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
          fill='currentColor'
          className={className}
          aria-hidden
          {...rest}
        >
          <path d='m12 2.25c-5.382 0-9.75 4.368-9.75 9.75s4.368 9.75 9.75 9.75 9.75-4.368 9.75-9.75-4.368-9.75-9.75-9.75zm0 1.5c4.554 0 8.25 3.696 8.25 8.25s-3.696 8.25-8.25 8.25-8.25-3.696-8.25-8.25 3.696-8.25 8.25-8.25z' />
          <path d='m8.606 2.735a1.408 1.367 0 1 1 -2.816 0 1.408 1.367 0 1 1 2.816 0z' transform='matrix(1.1989 0 0 1.2342 3.182 4.312)' />
          <path d='m13.6 16.644c-0.01 0.41 0.182 0.525 0.649 0.573l0.751 0.015v0.768h-5.861v-0.768l0.825-0.015c0.494-0.015 0.612-0.207 0.649-0.573v-4.622c0.005-0.732-0.944-0.617-1.614-0.595v-0.761l4.6-0.166' />
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
