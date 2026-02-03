// We use a Express.js server for development

import type { CustomPageContext } from '#src/worker/ssr'
import express from 'express'
import { renderPage } from 'vike/server'
// import fetch from 'node-fetch'

import { createServer } from 'vite'

const PORT = 3000

async function startServer() {
  const app = express()

  const viteDevMiddleware = (
    await createServer({
      server: { middlewareMode: true },
    })
  ).middlewares
  app.use(viteDevMiddleware)

  app.get('*', async (req, res, next) => {
    const userAgent = req.headers['user-agent'] || null

    const pageContextInit: CustomPageContext = {
      env: {} as any,
      urlOriginal: req.originalUrl,
      fetch: fetch as any,
      userAgent,
      cspNonce: '', // Nonce will be set in the ssr.ts file
    }
    const pageContext = await renderPage(pageContextInit)
    const { httpResponse } = pageContext

    if (!httpResponse) {
      return next()
    } else {
      const { statusCode, headers } = httpResponse
      headers.forEach(([name, value]) => res.setHeader(name, value))
      res.status(statusCode)
      httpResponse.pipe(res)
    }
  })

  app.listen(PORT)
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}`)
}

startServer()
