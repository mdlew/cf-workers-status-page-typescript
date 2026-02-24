/* eslint-disable no-console */
import type {
  MonitorDailyChecksItem,
  MonitorLastCheck,
} from "../_helpers/store";
import { config } from "#src/config";
import { getDate } from "../_helpers/datetime";
import { getCheckLocation } from "../_helpers/location";

import {
  getNotificationCount,
  getNotifications,
} from "../_helpers/notifications";

import { prepareData, upsertData } from "../_helpers/store";

import { Subrequests } from "./Subrequests";

const defaultSubrequestsLimit = 50;
const defaultMaxPollingRetries = 2;
const defaultPollingInitialDelayMs = 250;

export async function handleCronTrigger(env: Env, ctx: ExecutionContext) {
  const subrequests = new Subrequests();
  const checkedIds: string[] = [];
  let allOperational = true;

  const checkLocation = await getCheckLocation();
  subrequests.required();
  const checkDay = getDate();

  const { kvData, allMonitors, uncheckMonitors, lastCheckedMonitorIds } =
    await prepareData(env);
  subrequests.required(2);
  console.log("lastCheckedMonitorIds:", lastCheckedMonitorIds);
  console.log("uncheckMonitors:", uncheckMonitors);

  for (const monitor of uncheckMonitors) {
    const notificationCount = getNotificationCount();
    const monitorPollingMaxRetries =
      monitor.pollingMaxRetries ?? defaultMaxPollingRetries;
    const restSubrequestCount =
      (config.settings.subrequestsLimit || defaultSubrequestsLimit) -
      subrequests.total;
    const monitorMaxRequiredSubrequestCount =
      1 + monitorPollingMaxRetries + notificationCount;

    // Including a kv write subrequest
    if (restSubrequestCount < monitorMaxRequiredSubrequestCount + 1) {
      break;
    }

    console.log(`Checking ${monitor.name || monitor.id} ...`);

    const requestStartTime = Date.now();
    const fetchUrl = new URL(monitor.url);
    fetchUrl.searchParams.append("_from-status-page", Date.now().toFixed(0));
    const fetchOptions: RequestInit = {
      method: monitor.method || "GET",
      redirect: monitor.followRedirect ? "follow" : "manual",
      headers: {
        "User-Agent": "cf-worker-status-page-typescript",
      },
    };
    let checkResponse = await fetch(fetchUrl.href, fetchOptions);

    // If 202 Accepted (intermediate response), keep polling with exponential backoff until a final response is received
    let pollingCount = 0;
    let pollingDelay =
      monitor.pollingInitialDelayMs ?? defaultPollingInitialDelayMs;
    // Follow Location header from 202 responses, just like a browser would
    const resolveLocation = (location: string | null, base: string) => {
      if (!location) return base;
      try {
        return new URL(location, base).href;
      } catch {
        console.warn(
          `${monitor.name || monitor.id} invalid Location header URL: ${location}`,
        );
        return base;
      }
    };
    // If a 202 has no Location header, scan the response body for a usable URL
    const extractUrlFromBody = async (
      response: Response,
    ): Promise<string | null> => {
      // Skip clearly non-text responses to avoid wasting work on binary bodies
      const contentType = response.headers.get("Content-Type") ?? "";
      if (
        !/text|json|xml|javascript|html|x-www-form-urlencoded/i.test(
          contentType,
        )
      )
        return null;

      const stream = response.body;
      if (!stream) return null;

      // Read only a bounded prefix to avoid buffering large payloads in memory
      const MAX_BYTES = 16 * 1024;
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let received = 0;
      let text = "";

      try {
        while (received < MAX_BYTES) {
          const { done, value } = await reader.read();
          if (done || !value) break;
          received += value.byteLength;
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
        console.log(
          `${monitor.name || monitor.id} scanning response (Content-Type ${contentType}) for polling URL: ${text.slice(0, 200)}`,
        );

        const raw = text.match(/https?:\/\/[^\s"'<>]+/)?.[0];
        if (raw) {
          const candidate = raw.replace(/[.,;:!?)\]]+$/, "");
          return new URL(candidate).href; // validates and normalises; throws if not a valid URL
        }
      } catch (err) {
        console.warn(
          `${monitor.name || monitor.id} failed to extract polling URL from response body`,
          err,
        );
      } finally {
        reader.releaseLock();
      }
      return null;
    };
    let pollingUrl = resolveLocation(
      checkResponse.headers.get("Location"),
      fetchUrl.href,
    );
    if (
      checkResponse.status === 202 &&
      !checkResponse.headers.get("Location")
    ) {
      console.log(
        `${monitor.name || monitor.id} returned 202 Accepted without Location header, attempting to extract polling URL from response body`,
      );
      const bodyUrl = await extractUrlFromBody(checkResponse);
      if (bodyUrl) {
        pollingUrl = bodyUrl;
        console.log(
          `${monitor.name || monitor.id} extracted polling URL from response body: ${pollingUrl}`,
        );
      } else {
        console.warn(
          `${monitor.name || monitor.id} no URL found in response body, polling will retry the original URL: ${pollingUrl}`,
        );
      }
    }
    while (
      checkResponse.status === 202 &&
      pollingCount < monitorPollingMaxRetries
    ) {
      await new Promise<void>((resolve) => setTimeout(resolve, pollingDelay));
      pollingDelay *= 2;
      try {
        checkResponse = await fetch(pollingUrl, fetchOptions);
        // Update polling URL only on continued 202 responses
        if (checkResponse.status === 202) {
          const locationHeader = checkResponse.headers.get("Location");
          pollingUrl = resolveLocation(locationHeader, pollingUrl);
          if (!locationHeader) {
            const bodyUrl = await extractUrlFromBody(checkResponse);
            if (bodyUrl) pollingUrl = bodyUrl;
          }
        }
      } catch (err) {
        console.warn(
          `${monitor.name || monitor.id} polling fetch failed:`,
          err,
        );
        break;
      }
      pollingCount++;
    }
    if (
      checkResponse.status === 202 &&
      pollingCount === monitorPollingMaxRetries
    ) {
      console.warn(
        `${monitor.name || monitor.id} reached max polling retries (${monitorPollingMaxRetries}) and is still returning 202 Accepted`,
      );
    }

    const requestTime = Math.round(Date.now() - requestStartTime);

    // Determine whether operational and status changed
    const monitorOperational =
      checkResponse.status === (monitor.expectStatus || 200);
    const monitorStatusChanged =
      kvData.monitorHistoryData?.[monitor.id]?.lastCheck.operational !==
      monitorOperational;

    if (monitorStatusChanged) {
      console.log(
        `${monitor.name || monitor.id} status changed to ${monitorOperational ? "operational" : "un-operational"}`,
      );
      const notifications = getNotifications(
        monitor,
        {
          status: checkResponse.status,
          statusText: checkResponse.statusText,
          operational: monitorOperational,
        },
        () => {
          subrequests.notified();
        },
      );
      ctx.waitUntil(Promise.allSettled(notifications.map((item) => item())));
    }

    subrequests.checked(1 + pollingCount);
    checkedIds.push(monitor.id);
    if (!monitorOperational) {
      allOperational = false;
    }

    const monitorLastCheck: MonitorLastCheck = {
      status: checkResponse.status,
      statusText: checkResponse.statusText || "-",
      operational: monitorOperational,
      time: Date.now(),
    };

    const targetMonitorHistoryDataChecksItem = kvData.monitorHistoryData?.[
      monitor.id
    ]?.checks.find((item: MonitorDailyChecksItem) => {
      return item.date === checkDay;
    });

    const monitorHistoryDataChecksItem: MonitorDailyChecksItem =
      targetMonitorHistoryDataChecksItem || {
        date: checkDay,
        fails: 0,
        stats: {},
      };
    monitorHistoryDataChecksItem.fails =
      (monitorHistoryDataChecksItem.fails || 0) + (monitorOperational ? 0 : 1);

    if (config.settings.collectResponseTimes && monitorOperational) {
      if (Object.keys(monitorHistoryDataChecksItem.stats).length === 0) {
        monitorHistoryDataChecksItem.stats = {
          [checkLocation]: {
            count: 0,
            totalMs: 0,
          },
        };
      }
      if (!(checkLocation in monitorHistoryDataChecksItem.stats)) {
        monitorHistoryDataChecksItem.stats[checkLocation] = {
          count: 0,
          totalMs: 0,
        };
      }
      const count =
        monitorHistoryDataChecksItem.stats[checkLocation]!.count + 1;
      const totalMs =
        monitorHistoryDataChecksItem.stats[checkLocation]!.totalMs +
        requestTime;

      monitorHistoryDataChecksItem.stats[checkLocation] = {
        count,
        totalMs,
      };
    }

    if (!kvData.monitorHistoryData) {
      kvData.monitorHistoryData = {};
    }

    kvData.monitorHistoryData[monitor.id] = {
      checks: [
        ...(kvData.monitorHistoryData[monitor.id]?.checks || []).filter(
          (item: MonitorDailyChecksItem) => {
            return item.date !== monitorHistoryDataChecksItem.date;
          },
        ),
        monitorHistoryDataChecksItem,
      ],
      firstCheck: kvData.monitorHistoryData[monitor.id]?.firstCheck || checkDay,
      lastCheck: monitorLastCheck,
    };
  }

  // Call upsertKvStore also as a subrequest,
  // but only it have to count in advance.
  subrequests.required();

  kvData.lastUpdate = {
    time: Date.now(),
    location: checkLocation,
    subrequests: {
      total: subrequests.total,
      required: subrequests.requiredCount,
      notified: subrequests.notifiedCount,
    },
    checks: {
      ids: [...lastCheckedMonitorIds, ...checkedIds],
      allOperational,
    },
  };
  console.log("Check location:", kvData.lastUpdate.location);
  console.log("Latest checked monitor ids:", kvData.lastUpdate.checks.ids);

  await upsertData(env, kvData, allMonitors);
  return new Response("OK");
}
