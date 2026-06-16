import type { QueryKey } from '@tanstack/react-query'

export const navigationKeys = {
  all: ['navigation'] as const,
  menu: () => [...navigationKeys.all, 'menu'] as const
}

/** 通知中心查询键，用于精确刷新顶部通知列表。 */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const
}

export const overviewKeys = {
  all: ['overview'] as const,
  summary: () => [...overviewKeys.all, 'summary'] as const
}

export const workplaceKeys = {
  all: ['workplace'] as const,
  summary: () => [...workplaceKeys.all, 'summary'] as const
}

export const systemKeys = {
  all: ['system'] as const,
  departments: () => [...systemKeys.all, 'departments'] as const,
  menus: () => [...systemKeys.all, 'menus'] as const,
  roles: () => [...systemKeys.all, 'roles'] as const,
  // users 为服务端分页查询：传参时 key 携带 {page,size,...filters}，
  // 不传参（systemKeys.users()）作为前缀用于 invalidate 全量失效。
  users: (params?: Record<string, unknown>) => [...systemKeys.all, 'users', params ?? {}] as const,
  // 全量用户（非分页）：供全局搜索、角色成员统计等场景。
  usersAll: () => [...systemKeys.all, 'users-all'] as const
}

export const aboutKeys = {
  all: ['about'] as const,
  project: () => [...aboutKeys.all, 'project'] as const
}

// 当前页刷新只失效该路由实际拥有的查询，避免 invalidateQueries() 清空全局缓存。
export function getRouteRefreshQueryKeys(path: string): QueryKey[] {
  if (path === '/overview') {
    return [overviewKeys.summary()]
  }

  if (path === '/workplace') {
    return [workplaceKeys.summary()]
  }

  if (path === '/system/users') {
    return [systemKeys.users()]
  }

  if (path === '/system/roles') {
    return [systemKeys.roles()]
  }

  if (path === '/system/menus') {
    return [systemKeys.menus(), navigationKeys.menu()]
  }

  if (path === '/system/departments') {
    return [systemKeys.departments()]
  }

  if (path === '/about') {
    return [aboutKeys.project()]
  }

  return []
}
