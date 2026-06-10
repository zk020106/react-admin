import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter
} from '@tanstack/react-router'

import { BaseLayout } from '@/layouts'

const rootRoute = createRootRoute({
  component: BaseLayout
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/'
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login'
})

const fallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$'
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, fallbackRoute])

// 函数：resolveRouterBasepath。把 Vite base URL 转为 TanStack Router 的 basepath。
export function resolveRouterBasepath(baseUrl = import.meta.env.BASE_URL) {
  const normalized = baseUrl.replace(/\/+$/, '')

  return normalized || '/'
}

// 函数：createAppRouter。创建应用路由实例并绑定浏览器历史。
export function createAppRouter() {
  return createRouter({
    basepath: resolveRouterBasepath(),
    history: createBrowserHistory(),
    routeTree
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
