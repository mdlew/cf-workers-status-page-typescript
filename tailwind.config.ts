import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

import defaultTheme from 'tailwindcss/defaultTheme'

const config = {
  //darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    animate,
  ],
} satisfies Config

export default config
