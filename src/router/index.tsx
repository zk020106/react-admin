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
import { runtimeEnv } from '@/config/env'
import { hasPermission, resolveSessionPermissions } from '@/lib/permissions'
import { authStore } from '@/store/auth'
import { ADMIN_DEFAULT_PATH } from '@/router/app-data'
import { getAdminPageDefinition } from '@/router/routes'
import { RouteErrorPage } from '@/pages/error-boundary-page'

// 登录页、404、403 页懒加载，避免进入首屏主包。
const LoginRoutePage = lazy(() =>
  import('@/pages/login-page').then(module => ({ default: module.LoginRoutePage }))
)
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))
const ForbiddenPage = lazy(() => import('@/pages/forbidden-page'))

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

function PreviewServerErrorPage() {
  throw new Error('Preview route error boundary')
}

// 布局路由：无 path，承载后台壳。
// beforeLoad 在首次进入时阻断未授权访问（避免壳 chunk 被下载）；
// BaseLayout 内的组件守卫仍保留，用于响应运行时 session 失效（如 401 清除会话）。
// 布局路由：无 path，承载后台壳。
// beforeLoad 在首次进入时阻断未授权访问（避免壳 chunk 被下载）；
// BaseLayout 内的组件守卫仍保留，用于响应运行时 session 失效（如 401 清除会话）。
const adminLayoutRoute = createRoute({
  beforeLoad: () => {
    if (runtimeEnv.authRequired && !authStore.getState().session) {
      throw redirect({ replace: true, to: '/login' })
    }
  },
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
// beforeLoad 在路由匹配阶段按 staticData.permission 判定权限，未授权直接跳 403，
// 避免无权限用户下载该页面的内容 chunk。
// 函数：createAdminPageRoute。按字面量路径创建内容页路由，保留类型化导航能力。
// beforeLoad 在路由匹配阶段按 staticData.permission 判定权限，未授权直接跳 403，
// 避免无权限用户下载该页面的内容 chunk。
function createAdminPageRoute<TPath extends string>(path: TPath) {
  const page = getAdminPageDefinition(path)

  return createRoute({
    beforeLoad: () => {
      if (!page.permission) {
        return
      }

      const session = authStore.getState().session
      // 免登录模式下无 session 视为拥有全部权限，与组件层 has-permission 逻辑一致。
      const perms = resolveSessionPermissions(session) ?? (runtimeEnv.authRequired ? [] : ['*'])
      if (!hasPermission(perms, page.permission)) {
        throw redirect({ replace: true, to: '/forbidden' })
      }
    },
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

const previewServerErrorRoute = import.meta.env.DEV
  ? createRoute({
      component: PreviewServerErrorPage,
      getParentRoute: () => adminLayoutRoute,
      path: '/__preview/500'
    })
  : undefined

// 403 页：无权限时由 createAdminPageRoute 的 beforeLoad 跳转到此。
const forbiddenRoute = createRoute({
  component: ForbiddenPage,
  getParentRoute: () => adminLayoutRoute,
  path: '/forbidden'
})

// 通配路由：未知路径在壳内渲染 404，不再静默吸附到默认页。
const fallbackRoute = createRoute({
  component: NotFoundPage,
  getParentRoute: () => adminLayoutRoute,
  path: '$'
})

const adminChildRoutes = [
  indexRoute,
  overviewRoute,
  workplaceRoute,
  systemUsersRoute,
  systemRolesRoute,
  systemMenusRoute,
  systemDepartmentsRoute,
  effectsRoute,
  aboutRoute,
  forbiddenRoute,
  ...(previewServerErrorRoute ? [previewServerErrorRoute] : []),
  fallbackRoute
]

const routeTree = rootRoute.addChildren([
  loginRoute,
  adminLayoutRoute.addChildren(adminChildRoutes)
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
    defaultErrorComponent: RouteErrorPage,
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
