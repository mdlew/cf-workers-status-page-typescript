import type { FetchHandler } from "#src/types";
import { handleFetchError } from "./_helpers";
import { handleCronTrigger } from "./cron";
import { cleanKVstore } from "./cron/clean-kv";
import { handleSsr } from "./ssr";
import { handleStaticAssets } from "./static-assets";

import { isAssetUrl } from "./static-assets/helpers";

const handleFetchEvent: FetchHandler = async (request, env, context) => {
  const { url } = request;
  const userAgent = request.headers.get("User-Agent");

  // Check if the request is HTTP/2 or HTTP/3, return 403 if not
  if (
    typeof request.cf?.httpProtocol !== "string" ||
    !(
      request.cf.httpProtocol.toUpperCase().includes("HTTP/2") ||
      request.cf.httpProtocol.toUpperCase().includes("HTTP/3")
    )
  ) {
    console.log({
      error: `HTTP protocol error: "${request.cf?.httpProtocol}"`,
    });
    return new Response("Please use HTTP/2 or HTTP/3.", {
      status: 403,
      statusText: "Forbidden",
    });
  }

  // Check if the request is secure (HTTPS) and TLS version is 1.2 or higher, return 403 if not
  if (
    typeof request.cf?.tlsVersion !== "string" ||
    !(
      request.cf.tlsVersion.toUpperCase().includes("TLSV1.2") ||
      request.cf.tlsVersion.toUpperCase().includes("TLSV1.3")
    )
  ) {
    console.log({
      error: `TLS version error: "${request.cf?.tlsVersion}"`,
    });
    return new Response("Please use TLS version 1.2 or higher.", {
      status: 403,
      statusText: "Forbidden",
    });
  }

  // Only GET requests work with this proxy.
  if (request.method !== "GET") {
    console.log({ error: `Method ${request.method} not allowed` });
    return new Response(`Method ${request.method} not allowed.`, {
      status: 405,
      statusText: "Method Not Allowed",
      headers: {
        Allow: "GET",
      },
    });
  }

  if (!isAssetUrl(url)) {
    const response = await handleSsr(env, url, userAgent);
    if (response !== null) {
      return response;
    }
  }
  const response = await handleStaticAssets(request, env, context);
  return response;
};

const handler: ExportedHandler<Env> = {
  // Worker startup time limit: 400ms
  // ref: https://developers.cloudflare.com/workers/platform/limits/#worker-startup-time
  fetch: async (request, env, ctx) => {
    try {
      return await handleFetchEvent(request, env, ctx);
    } catch (err) {
      return handleFetchError(err);
    }
  },
  // Time limit:
  // When the schedule interval is less than 1 hour, a Scheduled Worker may run for up to 30 seconds.
  // When the schedule interval is more than 1 hour, a scheduled Worker may run for up to 15 minutes.
  // ref: https://developers.cloudflare.com/workers/platform/limits/#cpu-time Note block
  scheduled: async (controller, env, ctx) => {
    console.log("Running cron trigger: ", controller.cron);
    switch (controller.cron) {
      case "*/30 * * * *":
        // Every thirty minutes
        await handleCronTrigger(env, ctx);
        break;
      //      case '*/10 * * * *':
      // Every ten minutes
      //        await handleRemoteMonitors(env)
      //       break
      case "17 15 * * sun":
        // At 04:05 on Sunday
        await cleanKVstore(env, ctx);
        break;
      default:
        console.warn(`No handler for cron: ${controller.cron}`);
    }
  },
};

export default handler;
