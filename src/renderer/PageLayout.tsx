import type { PageContext } from 'vike/types'

import { PageContextProvider } from './usePageContext'

export interface PageLayoutProps {
  pageContext: PageContext
}

export function PageLayout(props: React.PropsWithChildren<PageLayoutProps>) {
  const { pageContext, children } = props

  return (
    <PageContextProvider pageContext={pageContext}>
      {children}
    </PageContextProvider>
  )
}
