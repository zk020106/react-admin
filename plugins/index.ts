import type { PluginOption } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'

import createViteArchiverPlugin from './archiver'
import createViteChunkPlugin from './chunk'

export default function createVitePlugins() {
  const vitePlugins: (PluginOption | PluginOption[])[] = [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ]
  vitePlugins.push(createViteArchiverPlugin())
  vitePlugins.push(
    createViteChunkPlugin({
      splitReact: true,
      // antd 及其依赖单独成组：它们只被懒加载的登录页引用，
      // 不能落入兜底 vendor 组（兜底组会被首屏急加载）。
      // clsx 被首屏 cn() 和 antd 共享，需在 antd 组之前捕获，
      // 否则会被并入 vendor-antd 导致入口预加载整个 antd。
      bigVendors: [
        '@tanstack',
        'radix-ui',
        'lucide-react',
        'ahooks',
        'clsx',
        'antd',
        '@ant-design',
        '@rc-component',
        'dayjs'
      ]
    })
  )

  return vitePlugins
}
