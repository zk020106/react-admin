import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

import createVitePlugins from './plugins'
import { projectInfoPlugin } from './vite.project-info'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL ?? process.env.VITE_BASE_PATH ?? '/',
  plugins: [projectInfoPlugin(process.cwd()), ...createVitePlugins()],
  resolve: {
    alias: {
      '@douyinfe/semi-ui-19/dist/css/semi.css': path.resolve(
        __dirname,
        'node_modules/@douyinfe/semi-ui-19/dist/css/semi.css'
      )
    },
    tsconfigPaths: true
  }
})
