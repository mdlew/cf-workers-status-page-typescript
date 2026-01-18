import React from 'react'
import { clsx } from 'clsx'

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {}

const Spinner: React.FC<SpinnerProps> = ({ className, ...rest }) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      className={clsx('animate-spin', className)}
      aria-hidden
      {...rest}
    >
      <circle
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth={4}
        strokeLinecap='round'
        strokeDasharray='60 100'
        fill='none'
      />
    </svg>
  )
}

export default Spinner
