# 路由转正 + antd CRUD 基建 + 权限会话闭环 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把路由从「查表渲染」转正为真实 TanStack Router 路由树（P0），在 antd 6 上点亮 FormApi/PopupApi 组件层并跑通 users 全链路 CRUD（P0.5），补齐 token 刷新、按钮/路由级权限和错误边界（P1）。

**Architecture:** 壳（侧栏/标签页/偏好设置）保持 shadcn，业务内容区统一 antd 6，两者通过 `AdminConfigProvider`（preferences → antd ThemeConfig）做主题桥接。路由按「真实 route tree + 组件级响应式守卫」组织，页面经 `<Outlet />` 渲染；headless 的 FormApi/PopupApi 通过适配层绑定 antd Form/Modal/Drawer。数据写通道沿用 mock/http 双实现切换，mutation 统一经 MutationCache 上报 sonner toast。

**Tech Stack:** React 19, TanStack Router v1, TanStack Query v5, antd 6（内容区）, shadcn/radix（壳）, Zustand vanilla, Vitest + Testing Library。

**提交策略:** 本轮执行不直接 commit——工作区尚有未提交的性能优化改动，统一由维护者审阅后按主题拆分提交。每个任务以「定向测试 + lint」作为门禁；全部完成后跑完整四门禁（format:check 仅对触碰文件执行，仓库存量格式漂移不在本计划范围）。

---

## Part A — P0 路由转正

### 设计决策

- 守卫用**组件级响应式守卫**（`useStore(authStore)` + `<Navigate />`），不用 `beforeLoad`：authStore 是响应式 zustand 仓库，`beforeLoad` 不会因 store 变化重跑，登录态在视图存活期间被清除时无法自动跳转；组件守卫两种场景都覆盖。
- `/login` 成为 BaseLayout 的**兄弟路由**（不再嵌在 AuthGate 里），登录 chunk 继续懒加载。
- 未知路径不再被 `normalizeAdminPath` 吸到 /overview，改为 admin 布局内的 `$` 通配路由渲染 404 页（保留壳）。
- `pageRegistry` 取消，懒加载页面组件与图标元数据迁入 `src/router/routes.tsx`；`PageSurface` 退化为「容器 + Suspense + Outlet」。
- `normalizeAdminPath` 保留但只用于**标签页恢复时的清洗**，不再参与路由跳转；base-layout 的 redirect effect 删除。

### Task A1: 路由表与 404 页

**Files:**
- Create: `src/router/routes.tsx`
- Create: `src/pages/not-found-page.tsx`
- Modify: `src/router/index.tsx`
- Modify: `src/layouts/navigation.ts:3`（pageIconMap 改从 routes 导入）
- Test: `src/__tests__/router.test.ts`

- [ ] **Step 1: 新建 `src/router/routes.tsx`**

```tsx
import {
  BriefcaseBusiness,
  Info,
  LayoutDashboard,
  Shield,
  SquareMenu,
  Users,
  type LucideIcon
} from 'lucide-react'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** 单个后台页面的路由元数据。 */
export interface AdminPageDefinition {
  component: LazyExoticComponent<ComponentType>
  icon: LucideIcon
  /** P1 接入：进入页面所需权限编码。 */
  permission?: string
  path: string
}

const OverviewPage = lazy(() => import('@/pages/overview-page'))
const WorkplacePage = lazy(() => import('@/pages/workplace-page'))
const UsersPage = lazy(() =>
  import('@/pages/system-pages').then(m => ({ default: m.UsersPage }))
)
const RolesPage = lazy(() =>
  import('@/pages/system-pages').then(m => ({ default: m.RolesPage }))
)
const MenusPage = lazy(() =>
  import('@/pages/system-pages').then(m => ({ default: m.MenusPage }))
)
const DepartmentsPage = lazy(() =>
  import('@/pages/system-pages').then(m => ({ default: m.DepartmentsPage }))
)
const AboutPage = lazy(() => import('@/pages/about-page'))

/** 后台页面定义清单：路由、懒加载组件、图标与权限编码的单一数据源。 */
export const adminPages: AdminPageDefinition[] = [
  { component: OverviewPage, icon: LayoutDashboard, path: '/overview', permission: 'overview:read' },
  { component: WorkplacePage, icon: BriefcaseBusiness, path: '/workplace', permission: 'workplace:read' },
  { component: UsersPage, icon: Users, path: '/system/users', permission: 'system:user:read' },
  { component: RolesPage, icon: Shield, path: '/system/roles', permission: 'system:role:read' },
  { component: MenusPage, icon: SquareMenu, path: '/system/menus', permission: 'system:menu:read' },
  { component: DepartmentsPage, icon: Users, path: '/system/departments', permission: 'system:department:read' },
  { component: AboutPage, icon: Info, path: '/about', permission: 'about:read' }
]

/** 路径到图标的映射，供侧栏/标签页渲染。 */
export const pageIconMap: Record<string, LucideIcon> = Object.fromEntries(
  adminPages.map(page => [page.path, page.icon])
)
```

- [ ] **Step 2: 新建 `src/pages/not-found-page.tsx`**（壳内 404，提供回首页按钮，按内容区 antd 风格但此时 antd 桥未建，先用现有 shadcn Button 即可，B0 完成后无需回改）

```tsx
import { useNavigate } from '@tanstack/react-router'

import { ADMIN_DEFAULT_PATH } from '@/router/app-data'
import { Button } from '@/components/ui/button'

/** 渲染后台 404 页面，提示路径不存在并提供回首页入口。 */
export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="grid place-items-center gap-4 py-24 text-center" data-slot="not-found-page">
      <div className="text-6xl font-semibold text-muted-foreground">404</div>
      <p className="text-sm text-muted-foreground">页面不存在或已被移除。</p>
      <Button onClick={() => void navigate({ replace: true, to: ADMIN_DEFAULT_PATH })}>
        返回首页
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: 重写 `src/router/index.tsx` 为真实路由树**

```tsx
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  type RouterHistory
} from '@tanstack/react-router'
import { lazy } from 'react'

import { BaseLayout } from '@/layouts'
import { ADMIN_DEFAULT_PATH } from '@/router/app-data'
import { adminPages } from '@/router/routes'

const LoginRoutePage = lazy(() =>
  import('@/pages/login-page').then(m => ({ default: m.LoginRoutePage }))
)
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))

const rootRoute = createRootRoute({})

const loginRoute = createRoute({
  component: LoginRoutePage,
  getParentRoute: () => rootRoute,
  path: '/login'
})

// 布局路由：无 path，承载后台壳与登录守卫。
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

const pageRoutes = adminPages.map(page =>
  createRoute({
    component: page.component,
    getParentRoute: () => adminLayoutRoute,
    path: page.path,
    staticData: { permission: page.permission }
  })
)

const fallbackRoute = createRoute({
  component: NotFoundPage,
  getParentRoute: () => adminLayoutRoute,
  path: '$'
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  adminLayoutRoute.addChildren([indexRoute, ...pageRoutes, fallbackRoute])
])
```

`resolveRouterBasepath` 保留；`createAppRouter` 增加可注入 history（测试用）：

```tsx
// 函数：createAppRouter。创建应用路由实例并绑定浏览器历史。
export function createAppRouter(history: RouterHistory = createBrowserHistory()) {
  return createRouter({
    basepath: resolveRouterBasepath(),
    history,
    routeTree
  })
}
```

并为 `staticData` 增加类型声明：

```tsx
declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    permission?: string
  }
}
```

- [ ] **Step 4: `src/layouts/navigation.ts` 改导入**——`import { pageIconMap } from '@/router/routes'`，删除对 page-surface 的依赖（避免布局反向依赖页面层）。

- [ ] **Step 5: 跑定向测试确认现状破裂范围**

Run: `pnpm vitest run src/__tests__/router.test.ts src/__tests__/tabs.test.ts`
Expected: router.test PASS（basepath 纯函数未动）；app-shell 尚未适配，留到 A2/A3 一起验证。

### Task A2: BaseLayout 改造（Outlet 化 + 守卫 + 移除 AuthGate）

**Files:**
- Modify: `src/layouts/base-layout.tsx`
- Modify: `src/layouts/page-surface.tsx`
- Modify: `src/pages/login-page.tsx`
- Modify: `src/pages/login/LoginPage.tsx`（登录成功跳转目标）

- [ ] **Step 1: `page-surface.tsx` 重写为容器**（pageRegistry/懒组件全部移除，已迁 routes.tsx）

```tsx
import { Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'

import { cn } from '@/lib/utils'
import type { AdminPreferences } from '@/types/admin'

/** 渲染后台内容区容器，承载路由出口与懒加载兜底骨架。 */
export function PageSurface({
  activePath,
  preferences
}: {
  activePath: string
  preferences: AdminPreferences
}) {
  const compactContent = preferences.contentCompact === 'compact'

  return (
    <div
      className={cn('flex w-full flex-col gap-4', compactContent && 'mx-auto')}
      data-route-key={activePath}
      data-slot="page-surface"
      style={compactContent ? { maxWidth: preferences.contentCompactWidth } : undefined}
    >
      <Suspense fallback={<PageSurfaceFallback />}>
        <Outlet />
      </Suspense>
    </div>
  )
}
```

`PageSurfaceFallback` 原样保留。

- [ ] **Step 2: base-layout 改造**
  - 删除 `AuthGate`、删除 LoginPage 懒导入、删除 `routePathname !== activePath` 的 redirect effect。
  - `activePath` 改为 `routePathname` 直读（路由保证已匹配；404 路径也允许，下一条做防御）。
  - `openTab`/`document.title` 两个 effect 增加菜单命中守卫：`getMenuTitle` 查不到时（404/未授权路径）不开标签：

```tsx
const activePathInMenu = useMemo(
  () => flattenMenuRecords(activeMenu).some(item => item.path === activePath),
  [activeMenu, activePath]
)

useEffect(() => {
  if (activePathInMenu) {
    tabsStore.getState().openTab(resolveWorkspaceTab(activePath, activeMenu))
  }
}, [activeMenu, activePath, activePathInMenu])
```

  - `BaseLayout` 导出改为带守卫版本：

```tsx
// 组件：BaseLayout。用于提供管理端基础布局入口、登录守卫和全局提示上下文。
export function BaseLayout() {
  const session = useStore(authStore, state => state.session)

  if (runtimeEnv.authRequired && !session) {
    return <Navigate replace to="/login" />
  }

  return (
    <TooltipProvider>
      <AdminWorkspace />
    </TooltipProvider>
  )
}
```

（`Navigate` 从 `@tanstack/react-router` 导入。）

- [ ] **Step 3: 登录路由组件**——`src/pages/login-page.tsx` 增加已登录反向守卫：

```tsx
import { Navigate } from '@tanstack/react-router'
import { useStore } from 'zustand'

import { authStore } from '@/store/auth'

export { LoginPage } from './login/LoginPage'

/** 登录路由入口：已登录用户访问 /login 时回跳首页。 */
export function LoginRoutePage() {
  const session = useStore(authStore, state => state.session)

  if (session) {
    return <Navigate replace to="/" />
  }

  return <LoginPage />
}
```

（文件内需同时 `import { LoginPage } from './login/LoginPage'` 供本地引用。）

- [ ] **Step 4: 登录成功跳转**——`LoginPage.tsx` 的 `onSuccess` 里 `navigate({ to: '/' })` 保持不变（'/' 会经 indexRoute 重定向到默认页）。

- [ ] **Step 5: 定向验证**

Run: `pnpm vitest run src/__tests__/app-shell.test.tsx`
Expected: 大部分 PASS；若 `renders the admin shell` 等用例因 Outlet 时序新增 `findBy` 等待需求，在测试中将首屏断言改为 `await screen.findByRole(...)`。

### Task A3: 路由守卫与 404 测试

**Files:**
- Test: `src/__tests__/router.test.ts`

- [ ] **Step 1: 新增三条路由行为测试**（使用 `createMemoryHistory` 隔离；`createAppRouter(history)` 已支持注入）

```tsx
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, cleanup } from '@testing-library/react'

import { createAppRouter } from '@/router'
import { queryClient } from '@/lib/query-client'

function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }))
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return router
}

it('redirects the index route to the default admin path', async () => {
  const router = renderAt('/')
  await waitFor(() => expect(router.state.location.pathname).toBe('/overview'))
})

it('renders the in-shell 404 page for unknown paths', async () => {
  renderAt('/definitely-missing')
  expect(await screen.findByText('404')).toBeInTheDocument()
  // 壳仍然在：侧栏导航可见。
  expect(await screen.findByRole('navigation', { name: '侧栏导航' })).toBeInTheDocument()
})

it('does not open a workspace tab for unknown paths', async () => {
  renderAt('/definitely-missing')
  await screen.findByText('404')
  expect(tabsStore.getState().tabs.some(tab => tab.path === '/definitely-missing')).toBe(false)
})
```

注意文件需改名为 `router.test.tsx`（含 JSX），并补 afterEach 清理（cleanup、重置 tabsStore/preferenceStore、`window.history.replaceState(null, '', '/')`）。

- [ ] **Step 2: 全量测试**

Run: `pnpm vitest run`
Expected: 全部 PASS。

Run: `pnpm lint`
Expected: exit 0。

---

## Part B — P0.5 antd CRUD 基建

### Task B0: 主题桥 AdminConfigProvider

**Files:**
- Create: `src/hooks/use-system-dark.ts`
- Create: `src/theme/antd-theme.tsx`
- Modify: `src/theme/index.ts`（导出 `resolveAdminPrimaryColor`）
- Modify: `src/layouts/page-surface.tsx`（内容区包裹）
- Modify: `src/pages/login/LoginPage.tsx`（换用 AdminConfigProvider）
- Test: `src/__tests__/antd-theme.test.ts`

- [ ] **Step 1: 抽取系统暗色侦听 hook**（逻辑从 LoginPage.tsx:47-53,130-145 提取）

```tsx
import { useEffect, useState } from 'react'

/** 订阅系统颜色方案，返回当前是否偏好暗色。 */
export function useSystemDark() {
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemDark(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return systemDark
}
```

- [ ] **Step 2: theme/index.ts 导出主色解析**——把私有 `resolvePrimaryColor` 包一层导出：

```ts
// 函数：resolveAdminPrimaryColor。按偏好设置和明暗模式解析当前主色。
export function resolveAdminPrimaryColor(
  options: Pick<AdminThemeOptions, 'builtinType' | 'colorPrimary'>,
  dark: boolean
) {
  return resolvePrimaryColor(
    { ...options, fontSize: 16, mode: dark ? 'dark' : 'light', radius: '0.5' },
    dark
  )
}
```

- [ ] **Step 3: 新建 `src/theme/antd-theme.tsx`**

```tsx
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'
import { useStore } from 'zustand'

import { useSystemDark } from '@/hooks/use-system-dark'
import { preferenceStore } from '@/store/preferences'
import { resolveAdminPrimaryColor } from '@/theme'
import type { AdminPreferences } from '@/types/admin'

/** 由偏好设置派生 antd 主题配置，保证内容区与壳的视觉一致。 */
export function buildAntdThemeConfig(preferences: AdminPreferences, dark: boolean): ThemeConfig {
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    cssVar: true,
    token: {
      borderRadius: Math.round(Number(preferences.themeRadius) * 16),
      colorError: preferences.themeColorDestructive,
      colorPrimary: resolveAdminPrimaryColor(
        { builtinType: preferences.themeBuiltinType, colorPrimary: preferences.themeColorPrimary },
        dark
      ),
      colorSuccess: preferences.themeColorSuccess,
      colorWarning: preferences.themeColorWarning,
      fontSize: preferences.themeFontSize
    }
  }
}

/** 内容区 antd 上下文：主题与语言跟随偏好设置。 */
export function AdminConfigProvider({
  children,
  components
}: {
  children: ReactNode
  components?: ThemeConfig['components']
}) {
  const preferences = useStore(preferenceStore, state => state.preferences)
  const systemDark = useSystemDark()
  const dark =
    preferences.colorMode === 'dark' || (preferences.colorMode === 'system' && systemDark)
  const themeConfig = buildAntdThemeConfig(preferences, dark)

  return (
    <ConfigProvider
      locale={preferences.appLocale === 'en-US' ? enUS : zhCN}
      theme={components ? { ...themeConfig, components } : themeConfig}
    >
      {children}
    </ConfigProvider>
  )
}
```

- [ ] **Step 4: 单测 `buildAntdThemeConfig`**——断言 radius 0.5→8、暗色算法切换、自定义主题色透传。

- [ ] **Step 5: 各 antd 页面在自身懒加载模块内包裹 `<AdminConfigProvider>`**（修正：不在 PageSurface 全局包裹——PageSurface 位于主 chunk，静态引用 antd-theme 会把 antd 拖回首屏主包。约定：system-pages/effects 等 antd 页面在页面根部自行包裹）；LoginPage 用 `<AdminConfigProvider components={...原组件覆写}>` 替换手写 ConfigProvider（删除其 antdThemeConfig useMemo 与 systemDark 本地逻辑，改用 use-system-dark）。

Run: `pnpm vitest run src/__tests__/antd-theme.test.ts && pnpm lint`

### Task B1: SchemaForm + useAdminForm（FormApi → antd Form 适配）

**Files:**
- Create: `src/components/admin/form/form-field-registry.tsx`
- Create: `src/components/admin/form/schema-form.tsx`
- Create: `src/components/admin/form/use-admin-form.ts`
- Test: `src/__tests__/form-api.test.ts`（getter 行为）
- Test: `src/__tests__/schema-form.test.tsx`

- [ ] **Step 1: 先写 FormApi 活值测试（红）**——锁定 mount 必须支持 getter 形态：

```ts
it('reads live values when the mounted form exposes a values getter', async () => {
  const store: Record<string, unknown> = { name: 'before' }
  const api = new FormApi()
  api.mount({
    reset: () => {},
    setValue: (field, value) => { store[field] = value },
    submit: () => {},
    validate: () => ({ valid: true }),
    get values() { return { ...store } }
  })
  store.name = 'after'
  expect(await api.getValues()).toEqual({ name: 'after' })
})
```

Run: `pnpm vitest run src/__tests__/form-api.test.ts` — 该用例应直接 PASS（FormApi 每次读 `form.values`，getter 天然支持）；如 FAIL 说明实现有缓存，修复后再继续。此测试的价值是把契约钉死，防止适配层回退成快照。

- [ ] **Step 2: 字段注册表**

```tsx
import { Checkbox, DatePicker, Input, Select, Switch } from 'antd'
import type { ReactNode } from 'react'

import type { FormSchema } from '@/types/admin'

type FieldRenderer = (schema: FormSchema) => ReactNode

/** schema 组件类型到 antd 控件的渲染映射。 */
const fieldRegistry: Record<string, FieldRenderer> = {
  checkbox: schema => <Checkbox {...schema.componentProps} />,
  'date-range': schema => <DatePicker.RangePicker {...schema.componentProps} />,
  input: schema => <Input {...schema.componentProps} />,
  password: schema => <Input.Password {...schema.componentProps} />,
  pin: schema => <Input.OTP {...schema.componentProps} />,
  select: schema => <Select {...schema.componentProps} />,
  switch: schema => <Switch {...schema.componentProps} />
}

/** 按 schema 渲染单个表单控件，未注册类型回退为输入框。 */
export function renderFormField(schema: FormSchema) {
  return (fieldRegistry[schema.component] ?? fieldRegistry.input)(schema)
}
```

- [ ] **Step 3: SchemaForm**——antd Form + Form.Item 按 fields 渲染；`fieldName` 含 `.` 时转 namePath 数组；`valuePropName` 对 checkbox/switch 取 `checked`：

```tsx
import { Form, type FormInstance } from 'antd'
import type { Rule } from 'antd/es/form'
import { useEffect } from 'react'

import type { FormApi } from '@/utils/form-api'
import { renderFormField } from './form-field-registry'

function toNamePath(fieldName: string) {
  return fieldName.includes('.') ? fieldName.split('.') : fieldName
}

/** schema 驱动的 antd 表单：挂载 FormApi 并按字段清单渲染。 */
export function SchemaForm({
  api,
  form,
  layout = 'vertical',
  onFinish
}: {
  api: FormApi
  form: FormInstance
  layout?: 'horizontal' | 'vertical'
  onFinish?: (values: Record<string, unknown>) => void
}) {
  const schema = api.getState().schema ?? []

  useEffect(() => {
    api.mount({
      reset: () => form.resetFields(),
      setValue: (fieldName, value) => form.setFieldValue(toNamePath(fieldName), value),
      submit: () => {},
      validate: async () => {
        try {
          await form.validateFields()
          return { valid: true }
        } catch (errorInfo) {
          return { errors: errorInfo as Record<string, unknown>, valid: false }
        }
      },
      get values() {
        return form.getFieldsValue(true) as Record<string, unknown>
      }
    })
  }, [api, form])

  const initialValues = Object.fromEntries(
    schema.filter(item => item.defaultValue !== undefined).map(item => [item.fieldName, item.defaultValue])
  )

  return (
    <Form form={form} initialValues={initialValues} layout={layout} onFinish={onFinish}>
      {schema.map(item => (
        <Form.Item
          key={item.fieldName}
          label={item.label}
          name={toNamePath(item.fieldName)}
          rules={item.rules as Rule[] | undefined}
          valuePropName={['checkbox', 'switch'].includes(item.component) ? 'checked' : 'value'}
        >
          {renderFormField(item)}
        </Form.Item>
      ))}
    </Form>
  )
}
```

- [ ] **Step 4: useAdminForm**

```tsx
import { Form } from 'antd'
import { useState } from 'react'

import { FormApi, type FormApiOptions } from '@/utils/form-api'

/** 创建 FormApi 与 antd 表单实例的标准组合。 */
export function useAdminForm(options: FormApiOptions = {}) {
  const [api] = useState(() => new FormApi(options))
  const [form] = Form.useForm()

  return [api, form] as const
}
```

- [ ] **Step 5: 组件测试（schema-form.test.tsx）**——渲染 input+select schema、必填规则触发校验失败、`api.submit()` 走通 handleSubmit、`api.setValue` 后 `getValues` 读到新值（活值）。

Run: `pnpm vitest run src/__tests__/schema-form.test.tsx src/__tests__/form-api.test.ts && pnpm lint`

### Task B2: AdminModal / AdminDrawer（PopupApi → antd）

**Files:**
- Create: `src/components/admin/popup/use-popup.ts`
- Create: `src/components/admin/popup/admin-modal.tsx`
- Create: `src/components/admin/popup/admin-drawer.tsx`
- Test: `src/__tests__/admin-popup.test.tsx`

- [ ] **Step 1: use-popup.ts**（usePopupState 从 effects-pages 提升 + 工厂 hook）

```tsx
import { useEffect, useMemo, useState } from 'react'

import { DrawerApi, ModalApi, type PopupState } from '@/utils/popup-api'

/** 订阅弹层 API 状态并映射为 React 状态。 */
export function usePopupState(api: ModalApi | DrawerApi) {
  const [state, setState] = useState<PopupState>(api.getState())
  useEffect(() => api.subscribe(next => setState(next)), [api])
  return state
}

/** 创建组件生命周期内稳定的 ModalApi。 */
export function useModalApi(factory: () => ModalApi = () => new ModalApi()) {
  return useMemo(factory, [])
}

/** 创建组件生命周期内稳定的 DrawerApi。 */
export function useDrawerApi(factory: () => DrawerApi = () => new DrawerApi()) {
  return useMemo(factory, [])
}
```

- [ ] **Step 2: admin-modal.tsx**——消费 PopupState 全量字段：

```tsx
import { Modal } from 'antd'
import type { ReactNode } from 'react'

import type { ModalApi } from '@/utils/popup-api'
import { usePopupState } from './use-popup'

/** PopupApi 驱动的模态弹窗：submitting 映射确认按钮 loading，关闭走 beforeClose 守卫。 */
export function AdminModal({
  api,
  children,
  onConfirm,
  width
}: {
  api: ModalApi
  children?: ReactNode
  onConfirm?: () => void
  width?: number
}) {
  const state = usePopupState(api)

  return (
    <Modal
      cancelText={state.cancelText}
      confirmLoading={state.submitting}
      footer={state.footer ? undefined : null}
      okText={state.confirmText}
      onCancel={() => void api.close()}
      onOk={() => (onConfirm ? onConfirm() : api.onConfirm())}
      open={state.isOpen}
      title={state.title}
      width={width}
    >
      {children}
    </Modal>
  )
}
```

admin-drawer.tsx 同构：`placement={state.placement}`、footer 自渲染确认/取消按钮（`Button loading={state.submitting}`）。

- [ ] **Step 3: 组件测试**——open/close、beforeClose 返回 false 阻止关闭、lock() 后确认按钮 loading、setData 回读。

Run: `pnpm vitest run src/__tests__/admin-popup.test.tsx && pnpm lint`

### Task B3: AdminTable 薄封装

**Files:**
- Create: `src/components/admin/table/admin-table.tsx`
- Test: `src/__tests__/admin-table.test.tsx`

- [ ] **Step 1: 实现**（刻意保持薄：默认分页、loading、工具栏插槽；列设置持久化/服务端分页协议留到后续迭代，YAGNI）

```tsx
import { Table, type TableProps } from 'antd'
import type { ReactNode } from 'react'

export interface AdminTableProps<RecordType> extends TableProps<RecordType> {
  /** 表格右上工具栏内容（新增按钮等）。 */
  toolbar?: ReactNode
}

/** 内容区标准表格：统一分页尺寸与工具栏布局。 */
export function AdminTable<RecordType extends object>({
  pagination,
  toolbar,
  ...tableProps
}: AdminTableProps<RecordType>) {
  return (
    <div className="grid gap-3" data-slot="admin-table">
      {toolbar ? <div className="flex justify-end gap-2">{toolbar}</div> : null}
      <Table<RecordType>
        pagination={pagination ?? { pageSize: 10, showSizeChanger: false }}
        size="middle"
        {...tableProps}
      />
    </div>
  )
}
```

- [ ] **Step 2: 测试**——渲染列与数据、toolbar 插槽出现。

### Task B4: 数据写通道 + mutation 约定

**Files:**
- Modify: `src/mock/admin-mock.ts`（UserRecord+id、users CRUD mock）
- Modify: `src/api/admin.ts`（AdminApi 写方法 + http post/put/delete）
- Create: `src/pages/admin-mutations.ts`
- Modify: `src/lib/query-client.ts`（MutationCache onError → sonner）
- Modify: `src/layouts/base-layout.tsx`（挂载 `<Toaster />`，当前未挂载）
- Test: `src/__tests__/admin-api.test.ts`

- [ ] **Step 1: UserRecord 加 `id: string`**，三条 mock 数据补 `id: 'user-root' | 'user-ops' | 'user-audit'`；mock 增加：

```ts
let mutableUsers = [...users]
let userIdSeed = 0

export interface UserInput {
  department: string
  email: string
  name: string
  riskLevel: UserRecord['riskLevel']
  role: string
  status: string
}

// adminMockApi 内追加：
createUser: (input: UserInput) => {
  userIdSeed += 1
  const record: UserRecord = {
    ...input,
    id: `user-created-${userIdSeed}`,
    lastLogin: '尚未登录',
    loginMethod: '密码'
  }
  mutableUsers = [record, ...mutableUsers]
  return delay(record)
},
deleteUser: (id: string) => {
  mutableUsers = mutableUsers.filter(user => user.id !== id)
  return delay(undefined)
},
updateUser: (id: string, input: UserInput) => {
  mutableUsers = mutableUsers.map(user => (user.id === id ? { ...user, ...input } : user))
  const updated = mutableUsers.find(user => user.id === id)
  if (!updated) {
    return Promise.reject(new HttpError({ code: 404, message: '用户不存在', status: 404 }))
  }
  return delay(updated)
}
```

`users:` 读取改为 `delay(mutableUsers, signal)`；导出 `resetMockUsers()`（测试隔离用，恢复初始三条）。

- [ ] **Step 2: AdminApi 接口与 http 实现**——`AdminApiHttpClient` 增加 `post/put/delete` 签名；接口追加：

```ts
createUser: (input: UserInput) => Promise<UserRecord>
deleteUser: (id: string) => Promise<void>
updateUser: (id: string, input: UserInput) => Promise<UserRecord>
// http 实现：
createUser: input => client.post<UserRecord>('/admin/system/users', input),
deleteUser: id => client.delete<void>(`/admin/system/users/${id}`),
updateUser: (id, input) => client.put<UserRecord>(`/admin/system/users/${id}`, input)
```

- [ ] **Step 3: `src/pages/admin-mutations.ts`**

```ts
import { queryClient } from '@/lib/query-client'
import { systemKeys } from '@/lib/query-keys'
import { adminApi } from '@/api/admin'
import type { UserInput } from '@/mock/admin-mock'

// 用户管理 mutation 约定：成功后按资源精确失效列表查询。
export const userMutations = {
  create: () => ({
    mutationFn: (input: UserInput) => adminApi.createUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.users() })
  }),
  remove: () => ({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.users() })
  }),
  update: () => ({
    mutationFn: ({ id, input }: { id: string; input: UserInput }) => adminApi.updateUser(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.users() })
  })
}
```

- [ ] **Step 4: 全局 mutation 错误 toast**——query-client.ts：

```ts
import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    // mutation 失败统一提示，页面只处理成功路径。
    onError: error => {
      toast.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
    }
  }),
  defaultOptions: { /* 原配置不变 */ }
})
```

base-layout 的 `SidebarProvider` 内末尾挂 `<Toaster position="top-center" />`（`@/components/ui/sonner`）。

- [ ] **Step 5: admin-api.test.ts 补 CRUD 用例**——mock client 断言 POST/PUT/DELETE url 与 payload；mock api 测 create→列表包含、delete→列表移除（记得 `resetMockUsers()`）。

Run: `pnpm vitest run src/__tests__/admin-api.test.ts && pnpm lint`

### Task B5: users 页全链路 CRUD + effects 演示页转正

**Files:**
- Modify: `src/pages/system-pages.tsx`（UsersPage 重建）
- Create: `src/pages/user-form-modal.tsx`
- Modify: `src/router/routes.tsx`、`src/mock/admin-mock.ts`（/effects 菜单+路由，权限 `effects:read`，mockAuthUser 补该编码）
- Modify: `src/pages/effects-pages.tsx`（改用 B1/B2 新组件，作为能力演示页导出默认组件 EffectsPage）
- Test: `src/__tests__/app-shell.test.tsx`（users CRUD 流程）

- [ ] **Step 1: user-form-modal.tsx**——AdminModal + SchemaForm 组合，新增/编辑共用：

```tsx
import { useEffect } from 'react'

import { AdminModal } from '@/components/admin/popup/admin-modal'
import { SchemaForm } from '@/components/admin/form/schema-form'
import { useAdminForm } from '@/components/admin/form/use-admin-form'
import { useModalApi, usePopupState } from '@/components/admin/popup/use-popup'
import type { UserInput, UserRecord } from '@/mock/admin-mock'

const userFields = [
  { component: 'input', fieldName: 'name', label: '姓名', rules: [{ message: '请输入姓名', required: true }] },
  { component: 'input', fieldName: 'email', label: '邮箱', rules: [{ message: '请输入邮箱', required: true, type: 'email' }] },
  { component: 'input', fieldName: 'role', label: '角色', rules: [{ message: '请输入角色', required: true }] },
  { component: 'input', fieldName: 'department', label: '部门', rules: [{ message: '请输入部门', required: true }] },
  { component: 'select', fieldName: 'status', label: '状态', componentProps: { options: [{ value: '启用' }, { value: '复核中' }] } },
  { component: 'select', fieldName: 'riskLevel', label: '风险等级', componentProps: { options: [{ value: '低' }, { value: '中' }, { value: '高' }] } }
] satisfies FormSchema[]
```

组件：`useUserFormModal({ onSubmit })` 返回 `{ modal: <UserFormModal/>, openCreate(), openEdit(record) }`——openEdit 用 `api.setData(record)` + 打开后 `form.setFieldsValue(record)`；确认时 `api.lock()` → `formApi.submit()` → 成功 `api.close()`，失败 `api.unlock()`。

- [ ] **Step 2: UsersPage 重建**——汇总卡片保留；筛选区维持本地 state（遵循仓库规范「短表单用本地 state」）；表格换 `AdminTable`（antd columns，状态/风险列用 antd `Tag`），工具栏「新增用户」，操作列「编辑 / 删除（antd Popconfirm）」；`useMutation(userMutations.create())` 等驱动。

- [ ] **Step 3: effects 页转正**——mock 菜单追加 `{ icon: 'Shield', key: '/effects', path: '/effects', permission: 'effects:read', title: '组件示例' }`；`adminPages` 注册 `/effects`；effects-pages 默认导出 `EffectsPage`（PopupLab/SchemaFormPanel 改用 useModalApi/AdminModal/SchemaForm 实现，删除内部手写 usePopupState 与 RHF 版表单）。`mockAuthUser.permissions` 补 `'effects:read'`。

- [ ] **Step 4: app-shell 测试补 CRUD 流程**

```tsx
it('creates and deletes a user from the users page', async () => {
  preferenceStore.getState().resetPreferences()
  await renderApp()
  const sidebarNavigation = screen.getByRole('navigation', { name: '侧栏导航' })
  const { usersLink } = await openSystemMenu(sidebarNavigation)
  await userEvent.click(usersLink)

  await userEvent.click(await screen.findByRole('button', { name: '新增用户' }))
  const dialog = await screen.findByRole('dialog')
  await userEvent.type(within(dialog).getByLabelText('姓名'), '测试账号')
  await userEvent.type(within(dialog).getByLabelText('邮箱'), 'test@example.com')
  await userEvent.type(within(dialog).getByLabelText('角色'), '测试员')
  await userEvent.type(within(dialog).getByLabelText('部门'), '质量部')
  await userEvent.click(within(dialog).getByRole('button', { name: /确 定|OK/ }))

  expect(await screen.findByText('测试账号')).toBeInTheDocument()
})
```

（删除流程：行内删除按钮 → Popconfirm 确认 → `queryByText('测试账号')` 消失。测试 afterEach 调 `resetMockUsers()`。）

Run: `pnpm vitest run && pnpm lint`
Expected: 全部 PASS。

---

## Part C — P1 权限与会话闭环

### Task C1: token 刷新单飞队列

**Files:**
- Create: `src/auth/token-refresh.ts`
- Modify: `src/types/auth.ts`（如缺 refresh 响应类型则补）
- Modify: `src/api/auth.ts`（AuthApi += refresh）
- Modify: `src/mock/auth-mock.ts`（refresh 实现 + session 带 refreshToken）
- Modify: `src/lib/http.ts`（401 → 刷新重放钩子）
- Modify: `src/auth/http-auth.ts`（接线）
- Test: `src/__tests__/token-refresh.test.ts`

- [ ] **Step 1: 先写单飞队列测试（红）**

```ts
it('coalesces concurrent refresh calls into one request', async () => {
  let calls = 0
  const queue = createTokenRefreshQueue({
    refresh: async () => {
      calls += 1
      return 'new-token'
    }
  })
  const [a, b] = await Promise.all([queue.getFreshToken(), queue.getFreshToken()])
  expect(a).toBe('new-token')
  expect(b).toBe('new-token')
  expect(calls).toBe(1)
})

it('allows a new refresh after the previous one settles', async () => { /* 第二轮 calls 变 2 */ })
it('propagates refresh failure to all waiters and clears the in-flight slot', async () => { /* reject 两个等待者，随后可重试 */ })
```

- [ ] **Step 2: 实现 `createTokenRefreshQueue`**

```ts
// 类型：TokenRefreshQueueOptions。注入实际刷新动作。
export interface TokenRefreshQueueOptions {
  refresh: () => Promise<string>
}

// 函数：createTokenRefreshQueue。把并发的刷新请求合并为单次飞行。
export function createTokenRefreshQueue({ refresh }: TokenRefreshQueueOptions) {
  let inflight: Promise<string> | undefined

  return {
    getFreshToken() {
      inflight ??= refresh().finally(() => {
        inflight = undefined
      })
      return inflight
    }
  }
}
```

- [ ] **Step 3: AuthApi/mock 补 refresh**——`refresh: (refreshToken: string) => Promise<AuthSession>`；mock 返回 `{ ...mockAuthSession, accessToken: 'mock-access-token-rotated', refreshToken: 'mock-refresh-token' }`；`mockAuthSession` 本身补 `refreshToken: 'mock-refresh-token'`（让默认登录就具备可刷新会话）。http 实现 `client.post('/auth/refresh', { refreshToken })`。

- [ ] **Step 4: http.ts 接入**——`HttpConfig` 增加 `onTokenRefresh?: () => Promise<string | undefined>`；响应拦截器 401 分支改为：

```ts
// 401 时先尝试刷新一次并重放原请求，刷新失败再走 onUnauthorized。
async (error: AxiosError<unknown>) => {
  const normalizedError = normalizeAxiosError(error)
  const config = error.config as (AxiosRequestConfig & { __retried?: boolean }) | undefined

  if (normalizedError.status === 401 && config && !config.__retried && tokenRefreshHandler) {
    try {
      const token = await tokenRefreshHandler()
      if (token) {
        config.__retried = true
        return httpInstance.request(config)
      }
    } catch {
      // 刷新失败，继续走未授权处理。
    }
  }

  if (normalizedError.status === 401) {
    unauthorizedHandler?.(normalizedError)
  }

  return Promise.reject(normalizedError)
}
```

- [ ] **Step 5: http-auth.ts 接线**——构造队列：refresh = 读 store 的 refreshToken → `authApi.refresh()` → `setSession` → 返回新 accessToken；无 refreshToken 直接返回 undefined。`onUnauthorized` 保持 clearSession。

Run: `pnpm vitest run src/__tests__/token-refresh.test.ts && pnpm lint`

### Task C2: HasPermission 组件

**Files:**
- Create: `src/components/has-permission.tsx`
- Test: `src/__tests__/has-permission.test.tsx`
- Modify: `src/pages/system-pages.tsx`（新增/编辑/删除按钮包权限）
- Modify: `src/mock/auth-mock.ts`（permissions 补 `system:user:create/update/delete`）

- [ ] **Step 1: 实现**

```tsx
import type { ReactNode } from 'react'
import { useStore } from 'zustand'

import { runtimeEnv } from '@/config/env'
import { hasPermission, type PermissionInput } from '@/lib/permissions'
import { authStore } from '@/store/auth'

/** 读取当前会话权限集合；免登模式视为全量授权。 */
export function usePermissions() {
  const session = useStore(authStore, state => state.session)
  return session?.user.permissions ?? (runtimeEnv.authRequired ? [] : ['*'])
}

/** 按权限编码控制子内容渲染，未授权时渲染 fallback。 */
export function HasPermission({
  children,
  fallback = null,
  permission
}: {
  children: ReactNode
  fallback?: ReactNode
  permission: PermissionInput
}) {
  const permissions = usePermissions()
  return hasPermission(permissions, permission) ? children : fallback
}
```

- [ ] **Step 2: 测试**——免登模式全放行；authRequired 模拟下（createRuntimeEnv 不可变，测试通过 authStore.setSession 注入有限权限会话 + vi.mock runtimeEnv 或仅测 hasPermission 分支组合）渲染/隐藏两种结果。
- [ ] **Step 3: users 页三个写操作按钮分别包 `system:user:create/update/delete`**。

### Task C3: 路由级权限 + 403 面板

**Files:**
- Create: `src/pages/forbidden-page.tsx`（403 提示面板，结构同 404）
- Modify: `src/layouts/page-surface.tsx`（按当前匹配路由 staticData.permission 拦截）
- Test: `src/__tests__/router.test.tsx`

- [ ] **Step 1: PageSurface 内拦截**

```tsx
import { useMatches } from '@tanstack/react-router'

const matches = useMatches()
const requiredPermission = matches.at(-1)?.staticData.permission
const permissions = usePermissions()
const allowed = hasPermission(permissions, requiredPermission)
// Suspense 内：{allowed ? <Outlet /> : <ForbiddenPage />}
```

- [ ] **Step 2: 路由测试**——authRequired 关闭时全放行；注入仅 `overview:read` 的会话 + authRequired 开启场景下访问 `/system/users` 渲染 403 文案（通过 `createRuntimeEnv` 注入受控 env 的途径若不可达，则以 `authStore.setSession` + 临时 mock `runtimeEnv` 实现，测试内还原）。

### Task C4: 路由错误边界

**Files:**
- Create: `src/pages/route-error-page.tsx`
- Modify: `src/router/index.tsx`（`createRouter({ defaultErrorComponent: RouteErrorPage })`）
- Test: `src/__tests__/router.test.tsx`（抛错组件被边界捕获）

- [ ] **Step 1: RouteErrorPage**——展示错误信息 + 「重试」（`router.invalidate()`）+「返回首页」；中文 JSDoc。
- [ ] **Step 2: 测试**——临时路由组件 throw，断言错误面板出现且壳不崩溃。

---

## 收尾门禁

- [ ] `pnpm vitest run` 全量 PASS
- [ ] `pnpm lint` exit 0
- [ ] 触碰文件 `pnpm exec oxfmt --check <files>` 通过
- [ ] `pnpm build` 成功；`dist/index.html` 的 modulepreload **不含** vendor-antd / login-page / preferences-sheet / workspace-overlays；vendor-antd 仅被登录与内容页 chunk 引用
- [ ] 登录后空闲预热 vendor-antd（base-layout idle 预热列表追加内容页相关 chunk 已天然覆盖——antd 随 system-pages chunk 加载，无需单独处理；如构建显示 antd 未与页面 chunk 关联再补 `import('antd')` 预热）

## 自检结果

- P0/P0.5/P1 全部需求均有对应任务；无 TBD/占位步骤；类型与函数名跨任务一致（AdminPageDefinition/SchemaForm/useAdminForm/createTokenRefreshQueue 等在定义任务后才被引用）。
- 已知风险集中在 A2（base-layout 改造波及 app-shell 测试）与 B5（antd 组件在 jsdom 的交互细节，如 Select 需用 `mouseDown` 打开）；执行时按红绿节奏小步推进。
