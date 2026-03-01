import { renderPage } from "vike/server";

function injectNonce(match: string, nonce: string): string {
  if (/\snonce=["']/.test(match)) return match; // already has nonce
  return match.replace(/^<link\b/, `<link nonce="${nonce}"`);
}

/**
 * Pipes the SSR stream through a TransformStream that injects the CSP nonce
 * into every <link rel="modulepreload"> tag in the stream. Vike may inject
 * these tags either inside <head> or into the body via HTML_STREAM (when using
 * react-streaming), so the transform is applied to every chunk.
 *
 * A small sliding buffer is carried forward to handle the edge case where a
 * <link> tag straddles a chunk boundary. Only a potential partial <link
 * sequence at the tail of each chunk is deferred; other '<' characters (e.g.
 * in text content like "if (x < 5)") are emitted immediately.
 */
function injectNoncesIntoStream(
  stream: ReadableStream<Uint8Array>,
  nonce: string,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  // Holds any partial <link…> tag tail that has not yet been closed with '>'.
  let pending = "";

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = pending + decoder.decode(chunk, { stream: true });

        // Only defer the tail if it looks like the start of a <link> tag.
        // This avoids over-buffering on bare '<' in text/script content.
        const partialLinkMatch = text.match(
          /<(?:l(?:i(?:n(?:k\b[^>]*)?)?)?)?$/i,
        );
        const safeEnd = partialLinkMatch
          ? text.length - partialLinkMatch[0].length
          : text.length;

        const safe = text.slice(0, safeEnd);
        pending = text.slice(safeEnd);

        controller.enqueue(
          encoder.encode(
            safe.replace(
              /<link\s[^>]*\brel=["']modulepreload["'][^>]*>/gi,
              (match) => injectNonce(match, nonce),
            ),
          ),
        );
      },
      flush(controller) {
        if (pending) {
          // Emit any remaining buffered content (e.g. a partial tag at the
          // very end of the stream, which should not occur in well-formed HTML).
          controller.enqueue(
            encoder.encode(
              pending.replace(
                /<link\s[^>]*\brel=["']modulepreload["'][^>]*>/gi,
                (match) => injectNonce(match, nonce),
              ),
            ),
          );
          pending = "";
        }
      },
    }),
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
  userAgent: string | null,
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
    // <link rel="modulepreload"> tags. Vike may emit these in <head> or in the
    // body via HTML_STREAM (react-streaming), so every chunk is processed.
    const stream = injectNoncesIntoStream(
      httpResponse.getReadableWebStream(),
      nonce,
    );

    const newHeaders = new Headers(headers);
    newHeaders.set(
      "link",
      earlyHints.map((e: EarlyHint) => e.earlyHintLink).join(", "),
    );
    // Set the CSP nonce in the headers
    if (nonce) {
      newHeaders.set(
        "Content-Security-Policy",
        `script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; upgrade-insecure-requests; require-trusted-types-for 'script';`,
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
