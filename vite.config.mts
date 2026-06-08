import { defineConfig } from 'vite'

import createVitePlugins from './plugins'

// https://vite.dev/config/
export default defineConfig({
  plugins: createVitePlugins(),
  resolve: {
    tsconfigPaths: true
  }
})
