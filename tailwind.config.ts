import defaultTheme from 'tailwindcss/defaultTheme'
import animate from 'tailwindcss-animate'
import { addDynamicIconSelectors } from 'tailwindcss-plugin-iconify'

import type { Config } from 'tailwindcss'

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
    addDynamicIconSelectors({
      prefix: 'i',
      preprocessSets: {
        'ic': '*',
        'svg-spinners': '*',
      },
    }),
  ],
} satisfies Config

export default config
