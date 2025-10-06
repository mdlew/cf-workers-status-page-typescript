import { renderPage } from "vike/server";

export interface CustomPageContext {
  env: Env;
  urlOriginal: string;
  // ref: https://vike.dev/cloudflare-workers#universal-fetch
  fetch: typeof fetch;
  userAgent: string | null;
  cspNonce: string; // nonce for Content Security Policy (CSP)
}

export var nonce: string = ""; // Global nonce variable

type EarlyHint = {
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
};

export async function handleSsr(
  env: Env,
  url: string,
  userAgent: string | null
) {
  // Generate a nonce per-request and store it in the module-global variable
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  nonce = btoa(String.fromCharCode(...array));

  const pageContextInit: CustomPageContext = {
    env: env,
    urlOriginal: url,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    userAgent: userAgent,
    cspNonce: nonce, // Include the nonce in the page context so page templates can use it
  };
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
    return null;
  } else {
    const { statusCode: status, headers } = httpResponse;
    const { earlyHints } = httpResponse;
    const stream = httpResponse.getReadableWebStream();

    const newHeaders = new Headers(headers);

    // Build Link header from early hints (unchanged behavior)
    if (earlyHints && earlyHints.length) {
      newHeaders.set(
        "link",
        earlyHints.map((e: EarlyHint) => e.earlyHintLink).join(", ")
      );
    }

    // Set the CSP header using the generated nonce so inline scripts/styles with the nonce are allowed
    if (nonce) {
      newHeaders.set(
        "Content-Security-Policy",
        `img-src 'self'; script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'nonce-${nonce}'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; upgrade-insecure-requests;`
      );
    }

    // Additional security headers
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
    newHeaders.set("Cross-Origin-Resource-Policy", "same-site");
    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");

    /*
      Ensure that the CSP nonce is added to all stylesheet link elements in the HTML.

      We do this at response time with HTMLRewriter so any <link rel="stylesheet" ...>
      produced by the renderer (or by templates) will have the nonce attribute added.

      This is robust and does not rely on templates remembering to include the nonce.
    */
    if (nonce) {
      const transformed = new HTMLRewriter()
        .on('link[rel="stylesheet"]', {
          element(el) {
            el.setAttribute("nonce", nonce);
          },
        })
        .transform(stream);

      // HTMLRewriter.transform returns a Response; use its body (a ReadableStream) as the Response body
      return new Response(transformed.body, { headers: newHeaders, status });
    }

    return new Response(stream, { headers: newHeaders, status });
  }
}
