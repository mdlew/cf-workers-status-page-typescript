import { clsx } from 'clsx'
import * as React from 'react'

export interface IEmptyProps {
  children?: React.ReactNode
}

const Empty: React.FC<IEmptyProps> = (props) => {
  const { children } = props
  return (
    <div className={clsx(
      'mt-4 flex min-h-40 items-center justify-center',
      'rounded-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    )}
    >
      {children}
    </div>
  )
}

export default Empty
