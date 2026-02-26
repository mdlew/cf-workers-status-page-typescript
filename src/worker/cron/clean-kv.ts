/* eslint-disable no-console */
import type { DataV1 } from "../_helpers/store";
import { DATA_KEY } from "../_helpers/store";
import { getDate } from "../_helpers/datetime";

/**
 * Clean KV store by removing all monitor check entries older than 90 days.
 *
 * This function runs on a monthly cron trigger (5 4 1 * *) to optimize storage.
 * It iterates through all monitor history data and filters out daily check records
 * that are older than 90 days, based on their ISO date string (YYYY-MM-DD).
 *
 * @param env - Cloudflare Worker environment with KV store access
 * @param ctx - Cloudflare Worker execution context
 */
export async function cleanKVstore(env: Env, ctx: ExecutionContext) {
  const DAYS_TO_KEEP = 90;

  try {
    // Get current data from KV store
    const kvData = await env.KV_STORE.get<DataV1>(DATA_KEY, "json");

    if (!kvData || !kvData.monitorHistoryData) {
      console.log("No monitor history data to clean");
      return;
    }

    // Calculate cutoff date (90 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);
    const cutoffDateString = getDate(cutoffDate);

    // Track statistics for logging
    let totalEntriesRemoved = 0;
    let monitorsProcessed = 0;

    // Process each monitor's history
    const cleanedMonitorHistoryData = Object.entries(
      kvData.monitorHistoryData
    ).reduce<Record<string, any>>((acc, [monitorId, monitorData]) => {
      monitorsProcessed++;

      if (!monitorData.checks || monitorData.checks.length === 0) {
        acc[monitorId] = monitorData;
        return acc;
      }

      const originalCheckCount = monitorData.checks.length;

      // Filter out checks older than 90 days
      const filteredChecks = monitorData.checks.filter((check) => {
        return check.date >= cutoffDateString;
      });

      const entriesRemoved = originalCheckCount - filteredChecks.length;
      totalEntriesRemoved += entriesRemoved;

      // Keep the monitor data with filtered checks
      acc[monitorId] = {
        ...monitorData,
        checks: filteredChecks,
      };

      if (entriesRemoved > 0) {
        console.log(
          `Monitor "${monitorId}": Removed ${entriesRemoved} old entries`
        );
      }

      return acc;
    }, {});

    // Update KV store with cleaned data
    const cleanedData: DataV1 = {
      ...kvData,
      monitorHistoryData: cleanedMonitorHistoryData,
    };

    await env.KV_STORE.put(DATA_KEY, JSON.stringify(cleanedData));

    console.log(
      `KV store cleanup completed: ${monitorsProcessed} monitors processed, ${totalEntriesRemoved} total old entries removed, cutoff date: ${cutoffDateString}`
    );
  } catch (error) {
    console.error("Error cleaning KV store:", error);
    throw error;
  }
}
