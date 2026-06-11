import {
  BriefcaseBusiness,
  Info,
  LayoutDashboard,
  Shield,
  SlidersHorizontal,
  SquareMenu,
  Users,
  type LucideIcon
} from 'lucide-react'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** 单个后台页面的路由元数据。 */
export interface AdminPageDefinition {
  /** 懒加载的页面组件。 */
  component: LazyExoticComponent<ComponentType>
  /** 菜单与标签页使用的图标。 */
  icon: LucideIcon
  /** 路由路径，与 mock 菜单的 path 对齐。 */
  path: string
  /** 进入页面所需权限编码，缺省表示无需权限。 */
  permission?: string
}

const OverviewPage = lazy(() => import('@/pages/overview-page'))
const WorkplacePage = lazy(() => import('@/pages/workplace-page'))
const UsersPage = lazy(() =>
  import('@/pages/system-pages').then(module => ({ default: module.UsersPage }))
)
const RolesPage = lazy(() =>
  import('@/pages/system-pages').then(module => ({ default: module.RolesPage }))
)
const MenusPage = lazy(() =>
  import('@/pages/system-pages').then(module => ({ default: module.MenusPage }))
)
const DepartmentsPage = lazy(() =>
  import('@/pages/system-pages').then(module => ({ default: module.DepartmentsPage }))
)
const AboutPage = lazy(() => import('@/pages/about-page'))
const EffectsPage = lazy(() => import('@/pages/effects-pages'))

/** 后台页面定义清单：路由、懒加载组件、图标与权限编码的单一数据源。 */
export const adminPages: AdminPageDefinition[] = [
  {
    component: OverviewPage,
    icon: LayoutDashboard,
    path: '/overview',
    permission: 'overview:read'
  },
  {
    component: WorkplacePage,
    icon: BriefcaseBusiness,
    path: '/workplace',
    permission: 'workplace:read'
  },
  {
    component: UsersPage,
    icon: Users,
    path: '/system/users',
    permission: 'system:user:read'
  },
  {
    component: RolesPage,
    icon: Shield,
    path: '/system/roles',
    permission: 'system:role:read'
  },
  {
    component: MenusPage,
    icon: SquareMenu,
    path: '/system/menus',
    permission: 'system:menu:read'
  },
  {
    component: DepartmentsPage,
    icon: Users,
    path: '/system/departments',
    permission: 'system:department:read'
  },
  {
    component: EffectsPage,
    icon: SlidersHorizontal,
    path: '/effects',
    permission: 'effects:read'
  },
  {
    component: AboutPage,
    icon: Info,
    path: '/about',
    permission: 'about:read'
  }
]

/** 路径到图标的映射，供侧栏和标签页渲染。 */
export const pageIconMap: Record<string, LucideIcon> = Object.fromEntries(
  adminPages.map(page => [page.path, page.icon])
)

// 函数：getAdminPageDefinition。按路径取页面定义，路由表构建时缺失直接快速失败。
export function getAdminPageDefinition(path: string): AdminPageDefinition {
  const page = adminPages.find(item => item.path === path)

  if (!page) {
    throw new Error(`Unknown admin page definition: ${path}`)
  }

  return page
}
