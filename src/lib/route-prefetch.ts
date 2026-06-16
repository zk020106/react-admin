import type { QueryClient } from '@tanstack/react-query'

import {
  aboutQueries,
  navigationQueries,
  overviewQueries,
  systemQueries,
  workplaceQueries
} from '@/pages/admin-queries'

// 路由路径到该路由首屏所需查询的映射，供侧栏 hover 预取使用。
// 仅包含无参/首屏查询；分页查询（如 users 分页）由页面挂载后自行发起。
// 内部直接调 prefetchQuery，避免返回异构 queryOptions 数组导致类型冲突。
export function prefetchRouteData(queryClient: QueryClient, path: string) {
  // 测试环境跳过预取：prefetchQuery 的副作用会干扰集成测试的渲染时序。
  if (import.meta.env.MODE === 'test') return
  switch (path) {
    case '/overview':
      void queryClient.prefetchQuery(overviewQueries.summary())
      break
    case '/workplace':
      void queryClient.prefetchQuery(workplaceQueries.summary())
      break
    case '/about':
      void queryClient.prefetchQuery(aboutQueries.project())
      break
    case '/system/users':
      // 用户页首屏同时需要全量用户（部门联动/统计）与导航菜单。
      void queryClient.prefetchQuery(systemQueries.usersAll())
      void queryClient.prefetchQuery(navigationQueries.menu())
      break
    case '/system/roles':
      void queryClient.prefetchQuery(systemQueries.roles())
      void queryClient.prefetchQuery(systemQueries.usersAll())
      void queryClient.prefetchQuery(systemQueries.menus())
      break
    case '/system/menus':
      void queryClient.prefetchQuery(systemQueries.menus())
      void queryClient.prefetchQuery(navigationQueries.menu())
      break
    case '/system/departments':
      void queryClient.prefetchQuery(systemQueries.departments())
      break
    default:
      break
  }
}
