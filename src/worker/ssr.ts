import { renderPage } from "vike/server";

/**
 * Pipes the SSR stream through a TransformStream that buffers content up to
 * </head>, injects the CSP nonce into every <link rel="modulepreload"> tag
 * in that section, then passes all subsequent chunks through unchanged.
 * This preserves React's Suspense streaming without buffering the full HTML.
 */
function injectNoncesIntoStream(
  stream: ReadableStream<Uint8Array>,
  nonce: string
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let headDone = false;

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (headDone) {
          controller.enqueue(chunk);
          return;
        }
        buffer += decoder.decode(chunk, { stream: true });
        const headEnd = buffer.indexOf("</head>");
        if (headEnd === -1) return; // keep buffering until </head> is found

        headDone = true;
        const processed = buffer.replace(
          /<link\s[^>]*\brel=["']modulepreload["'][^>]*>/gi,
          (match) => {
            if (/\snonce=["']/.test(match)) return match; // already has nonce
            return match.replace(/^<link\b/, `<link nonce="${nonce}"`);
          }
        );
        buffer = "";
        controller.enqueue(encoder.encode(processed));
      },
      flush(controller) {
        if (buffer) {
          // Emit any remaining buffered content (e.g. if </head> was never found)
          controller.enqueue(encoder.encode(buffer));
          buffer = "";
        }
      },
    })
  );
}

export interface CustomPageContext {
  env: Env;
  urlOriginal: string;
  // ref: https://vike.dev/cloudflare-workers#universal-fetch
  fetch: typeof fetch;
  userAgent: string | null;
  cspNonce: string; // nonce for Content Security Policy (CSP)
}

interface EarlyHint {
  earlyHintLink: string; // Early hint value
  assetType:
    | "image"
    | "script"
    | "font"
    | "style"
    | "audio"
    | "video"
    | "document"
    | "fetch"
    | "track"
    | "worker"
    | "embed"
    | "object"
    | null;
  mediaType: string | null; // MIME type (updated to match vike's type)
  src: string; // Asset's URL
  isEntry: boolean; // true  ⇒ asset is an entry
  // false ⇒ asset is a dependency of an entry
}

export async function handleSsr(
  env: Env,
  url: string,
  userAgent: string | null
) {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const nonce = btoa(String.fromCharCode(...array));

  const pageContextInit: CustomPageContext = {
    env,
    urlOriginal: url,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    userAgent,
    cspNonce: nonce, // Include the nonce in the page context
  };
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
    return null;
  } else {
    const { statusCode: status, headers } = httpResponse;
    const { earlyHints } = httpResponse;

    // Pipe the SSR stream through a transformer that injects the CSP nonce into
    // <link rel="modulepreload"> tags, which Vike's inferPreloadTag omits.
    // Only the <head> section is buffered; React's Suspense streaming is preserved.
    const stream = injectNoncesIntoStream(
      httpResponse.getReadableWebStream(),
      nonce
    );

    const newHeaders = new Headers(headers);
    newHeaders.set(
      "link",
      earlyHints.map((e: EarlyHint) => e.earlyHintLink).join(", ")
    );
    // Set the CSP nonce in the headers
    if (nonce) {
      newHeaders.set(
        "Content-Security-Policy",
        `script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; upgrade-insecure-requests;`
      );
    }
    /*
    X-Frame-Options header prevents click-jacking attacks.
    @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
    */
    newHeaders.set("X-Frame-Options", "DENY");
    /*
    X-Content-Type-Options header prevents MIME-sniffing.
    @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options
    */
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
    newHeaders.set("Cross-Origin-Resource-Policy", "same-site");
    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
    return new Response(stream, { headers: newHeaders, status });
  }
}
