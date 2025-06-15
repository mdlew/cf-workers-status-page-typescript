import path from 'node:path'

import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'
//import polishTaggedTemplates from 'unplugin-polish-tagged-templates/vite'
import autoImport from 'unplugin-auto-import/vite'
import { cloudflare } from "@cloudflare/vite-plugin";

import type { UserConfig } from 'vite'

export default {
  plugins: [
    react(),
    vike(),
    cloudflare(),
    // polishTaggedTemplates({
    //   clsTags: ['cls'],
    // }),
    autoImport({
      imports: ['react', 'react-router-dom'],
    }),
  ],
  resolve: {
    alias: {
      '#src': path.resolve(__dirname, 'src'),
    },
  },
} as UserConfig
