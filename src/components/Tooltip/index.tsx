import * as React from 'react'
import {
  FloatingPortal,
  useMergeRefs,
} from '@floating-ui/react'

import { TooltipContext, type TooltipOptions, useTooltip, useTooltipContext } from './hooks'

// Reusable tooltip component ref: https://floating-ui.com/docs/tooltip#examples
export function Tooltip({
  children,
  ...options
}: { children: React.ReactNode } & TooltipOptions) {
  // This can accept any props as options, e.g. `placement`,
  // or other positioning options.
  const tooltip = useTooltip(options)
  return (
    <TooltipContext.Provider value={tooltip}>
      {children}
    </TooltipContext.Provider>
  )
}

export const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, asChild = false, ...props }, propRef) => {
  const context = useTooltipContext()
  const childrenRef = (children as any).ref
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef])

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    // eslint-disable-next-line react/no-clone-element
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...(children.props && typeof children.props === 'object' ? children.props : {}), // fix error TS2698: Spread types may only be created from object types.
        'data-state': context.open ? 'open' : 'closed',
      } as any), // fix error TS2353: Object literal may only specify known properties, and ''data-state'' does not exist in type 'HTMLProps<Element>'.
    )
  }

  return (
    <button
      ref={ref}
      type='button'
      // The user can style the trigger based on the state
      data-state={context.open ? 'open' : 'closed'}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  )
})

TooltipTrigger.displayName = 'TooltipTrigger'

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(({ style, ...props }, propRef) => {
  const context = useTooltipContext()
  const ref = useMergeRefs([context.refs.setFloating, propRef])

  if (!context.open) {
    return null
  }

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={{
          ...context.floatingStyles,
          ...style,
        }}
        {...context.getFloatingProps(props)}
      />
    </FloatingPortal>
  )
})

TooltipContent.displayName = 'TooltipContent'
