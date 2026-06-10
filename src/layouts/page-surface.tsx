import {
  BriefcaseBusiness,
  Info,
  LayoutDashboard,
  Shield,
  SquareMenu,
  Users,
  type LucideIcon
} from 'lucide-react'
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'

import { cn } from '@/lib/utils'
import type { AdminPreferences } from '@/types/admin'

type PageRegistryItem = {
  component: LazyExoticComponent<ComponentType>
  icon: LucideIcon
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

export const pageRegistry: Record<string, PageRegistryItem> = {
  '/about': {
    component: AboutPage,
    icon: Info
  },
  '/overview': {
    component: OverviewPage,
    icon: LayoutDashboard
  },
  '/workplace': {
    component: WorkplacePage,
    icon: BriefcaseBusiness
  },
  '/system/departments': {
    component: DepartmentsPage,
    icon: Users
  },
  '/system/menus': {
    component: MenusPage,
    icon: SquareMenu
  },
  '/system/roles': {
    component: RolesPage,
    icon: Shield
  },
  '/system/users': {
    component: UsersPage,
    icon: Users
  }
}

export const pageIconMap: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(pageRegistry).map(([path, page]) => [path, page.icon])
)

export function PageSurface({
  activePath,
  preferences
}: {
  activePath: string
  preferences: AdminPreferences
}) {
  const ActivePage = pageRegistry[activePath]?.component
  const compactContent = preferences.contentCompact === 'compact'

  return (
    <div
      className={cn('flex w-full flex-col gap-4', compactContent && 'mx-auto')}
      data-route-key={activePath}
      data-slot="page-surface"
      style={compactContent ? { maxWidth: preferences.contentCompactWidth } : undefined}
    >
      <Suspense fallback={<PageSurfaceFallback />}>{ActivePage ? <ActivePage /> : null}</Suspense>
    </div>
  )
}

function PageSurfaceFallback() {
  return (
    <div className="grid gap-4" data-slot="page-surface-fallback">
      <div className="h-24 rounded-lg border bg-muted/40" />
      <div className="h-40 rounded-lg border bg-muted/30" />
    </div>
  )
}
