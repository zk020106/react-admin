import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function mockProjectInfoPlugin() {
  const virtualModuleId = 'virtual:admin-project-info'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'mock-project-info',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return `export const projectInfo = {
          name: 'react-admin',
          version: '0.0.0',
          description: 'React Admin',
          meta: [
            { label: '项目名', value: 'react-admin' },
            { label: '版本', value: '0.0.0' }
          ],
          dependencyGroups: [
            {
              dependencies: [
                { name: 'react', version: '19.2.6' },
                { name: '@tanstack/react-query', version: '5.101.0' }
              ],
              description: '从 workspace package.json 解析出的运行时依赖。',
              title: '生产环境依赖',
              type: 'dependencies'
            },
            {
              dependencies: [{ name: 'vite', version: '8.0.16' }],
              description: '从 workspace package.json 解析出的开发、构建和测试依赖。',
              title: '开发环境依赖',
              type: 'devDependencies'
            }
          ],

          git: { commit: 'mock', branch: 'feat', commitTime: '' },
          buildTime: ''
        }`
      }
    }
  }
}

export default defineConfig({
  plugins: [mockProjectInfoPlugin(), react(), tailwindcss()],

  resolve: {
    alias: {
      '@douyinfe/semi-ui-19/dist/css/semi.css': path.resolve(
        __dirname,
        'node_modules/@douyinfe/semi-ui-19/dist/css/semi.css'
      )
    },
    tsconfigPaths: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 15000,
    server: {
      deps: {
        inline: [/@douyinfe/]
      }
    }
  }
})
