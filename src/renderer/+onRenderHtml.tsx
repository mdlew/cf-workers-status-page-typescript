// https://vike.dev/onRenderHtml
import React from 'react'
import { renderToStream } from 'react-streaming/server'
import { escapeInject } from 'vike/server'

import { PageLayout } from './PageLayout'
import './_global.css'

import type { OnRenderHtmlAsync } from 'vike/types'

import { config } from '#src/config'

export const onRenderHtml: OnRenderHtmlAsync = async (pageContext) => {
  const { Page, pageProps } = pageContext

  const page = (
    <React.StrictMode>
      <PageLayout pageContext={pageContext}>
        <Page {...pageProps} />
      </PageLayout>
    </React.StrictMode>
  )

  // Streaming is optional and we can use renderToString() instead
  const stream = await renderToStream(page, { userAgent: pageContext.userAgent })

  return escapeInject`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.settings.title}</title>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" sizes="any">
        <link rel="apple-touch-icon" href="/favicon.ico">
      	<link rel="preconnect" href="https://fonts.googleapis.com">
	      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,700;1,400;1,700&display=swap"
		rel="stylesheet">
      </head>
      <body>
        <div id="page-view">${stream}</div>
      </body>
    </html>
  `
}
