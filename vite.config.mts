import { defineConfig } from 'vite'

import createVitePlugins from './plugins'
import { projectInfoPlugin } from './vite.project-info'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL ?? process.env.VITE_BASE_PATH ?? '/',
  plugins: [projectInfoPlugin(process.cwd()), ...createVitePlugins()],
  resolve: {
    tsconfigPaths: true
  }
})
