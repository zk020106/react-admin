import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  type RouterHistory
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { BaseLayout } from '@/layouts'
import { ADMIN_DEFAULT_PATH } from '@/router/app-data'
import { getAdminPageDefinition } from '@/router/routes'

// 登录页与 404 页懒加载，避免进入首屏主包。
const LoginRoutePage = lazy(() =>
  import('@/pages/login-page').then(module => ({ default: module.LoginRoutePage }))
)
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))

// 根路由：提供顶层 Suspense，承接懒加载的兄弟路由（登录页）。
const rootRoute = createRootRoute({
  component: () => (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  )
})

const loginRoute = createRoute({
  component: LoginRoutePage,
  getParentRoute: () => rootRoute,
  path: '/login'
})

// 布局路由：无 path，承载后台壳；登录守卫在 BaseLayout 内响应式处理。
const adminLayoutRoute = createRoute({
  component: BaseLayout,
  getParentRoute: () => rootRoute,
  id: 'admin'
})

const indexRoute = createRoute({
  beforeLoad: () => {
    throw redirect({ replace: true, to: ADMIN_DEFAULT_PATH })
  },
  getParentRoute: () => adminLayoutRoute,
  path: '/'
})

// 函数：createAdminPageRoute。按字面量路径创建内容页路由，保留类型化导航能力。
function createAdminPageRoute<TPath extends string>(path: TPath) {
  const page = getAdminPageDefinition(path)

  return createRoute({
    component: page.component,
    getParentRoute: () => adminLayoutRoute,
    path,
    staticData: { permission: page.permission }
  })
}

const overviewRoute = createAdminPageRoute('/overview')
const workplaceRoute = createAdminPageRoute('/workplace')
const systemUsersRoute = createAdminPageRoute('/system/users')
const systemRolesRoute = createAdminPageRoute('/system/roles')
const systemMenusRoute = createAdminPageRoute('/system/menus')
const systemDepartmentsRoute = createAdminPageRoute('/system/departments')
const effectsRoute = createAdminPageRoute('/effects')
const aboutRoute = createAdminPageRoute('/about')

// 通配路由：未知路径在壳内渲染 404，不再静默吸附到默认页。
const fallbackRoute = createRoute({
  component: NotFoundPage,
  getParentRoute: () => adminLayoutRoute,
  path: '$'
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  adminLayoutRoute.addChildren([
    indexRoute,
    overviewRoute,
    workplaceRoute,
    systemUsersRoute,
    systemRolesRoute,
    systemMenusRoute,
    systemDepartmentsRoute,
    effectsRoute,
    aboutRoute,
    fallbackRoute
  ])
])

// 函数：resolveRouterBasepath。把 Vite base URL 转为 TanStack Router 的 basepath。
export function resolveRouterBasepath(baseUrl = import.meta.env.BASE_URL) {
  const normalized = baseUrl.replace(/\/+$/, '')

  return normalized || '/'
}

// 函数：createAppRouter。创建应用路由实例，默认绑定浏览器历史，测试可注入内存历史。
export function createAppRouter(history: RouterHistory = createBrowserHistory()) {
  return createRouter({
    basepath: resolveRouterBasepath(),
    history,
    routeTree
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }

  interface StaticDataRouteOption {
    /** 进入路由所需权限编码，缺省表示无需权限。 */
    permission?: string
  }
}
