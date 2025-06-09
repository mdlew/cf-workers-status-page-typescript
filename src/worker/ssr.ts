import { renderPage } from 'vike/server'

export interface CustomPageContext {
  env: Env
  urlOriginal: string
  // ref: https://vike.dev/cloudflare-workers#universal-fetch
  fetch: typeof fetch
  userAgent: string | null
}

type EarlyHint = {
  earlyHintLink: string // Early hint value
  assetType: "image" | "script" | "font" | "style" | "audio" | "video" | "document" |
  "fetch" | "track" | "worker" | "embed" | "object" | null
  mediaType: string | null // MIME type (updated to match vike's type)
  src: string // Asset's URL
  isEntry: boolean // true  ⇒ asset is an entry
  // false ⇒ asset is a dependency of an entry
}

export async function handleSsr(env: Env, url: string, userAgent: string | null) {
  const pageContextInit: CustomPageContext = {
    env,
    urlOriginal: url,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    userAgent,
  }
  const pageContext = await renderPage(pageContextInit)
  const { httpResponse } = pageContext
  if (!httpResponse) {
    return null
  } else {
    const { statusCode: status, headers } = httpResponse
    const { earlyHints } = httpResponse
    const stream = httpResponse.getReadableWebStream()

    const newHeaders = new Headers(headers)
    newHeaders.set('link', earlyHints.map((e: EarlyHint) => e.earlyHintLink).join(', '))
    /*
    X-Frame-Options header prevents click-jacking attacks.
    @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
    */
    newHeaders.set("X-Frame-Options", "DENY")
    /*
    X-Content-Type-Options header prevents MIME-sniffing.
    @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options
    */
    newHeaders.set("X-Content-Type-Options", "nosniff")
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin")
    newHeaders.set("Cross-Origin-Embedder-Policy", 'require-corp; report-to="default";')
    newHeaders.set("Cross-Origin-Opener-Policy", 'same-site; report-to="default";')
    newHeaders.set("Cross-Origin-Resource-Policy", "same-site")
    return new Response(stream, { headers: newHeaders, status })
  }
}
