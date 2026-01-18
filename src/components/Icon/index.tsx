import React from 'react'

export type IconName = 'star' | 'info' | 'external-link'

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName
}

const Icon: React.FC<IconProps> = ({ name, className, ...rest }) => {
  switch (name) {
    case 'star':
      return (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth={2}
          className={className}
          aria-hidden
          {...rest}
        >
          <polygon
            points='12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9'
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      )
    case 'info':
      return (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth={2}
          className={className}
          aria-hidden
          {...rest}
        >
          <circle cx='12' cy='12' r='9' />
          <line x1='12' y1='11' x2='12' y2='16' />
          <circle cx='12' cy='8' r='1.5' />
        </svg>
      )
    case 'external-link':
      return (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth={2}
          className={className}
          aria-hidden
          {...rest}
        >
          {/* Box */}
          <path d='M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2' />
          {/* Arrow */}
          <path d='M15 5h4v4' />
          <path d='M10 14l9-9' />
        </svg>
      )
    default:
      return null
  }
}

export default Icon
