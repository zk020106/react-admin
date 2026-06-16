import { queryOptions } from '@tanstack/react-query'

import {
  aboutKeys,
  navigationKeys,
  notificationKeys,
  overviewKeys,
  systemKeys,
  workplaceKeys
} from '@/lib/query-keys'
import { adminApi } from '@/api/admin'
import { mockAdminMenu } from '@/mock/admin-mock'

// 导航查询：菜单通过 mock request 获取，placeholder 只用于避免首屏空菜单。
export const navigationQueries = {
  menu: () =>
    queryOptions({
      placeholderData: mockAdminMenu,
      queryFn: ({ signal }) => adminApi.menu(signal),
      queryKey: navigationKeys.menu(),
      staleTime: 10 * 60 * 1000
    })
}

/** 通知中心查询，顶部栏通过该查询读取最新通知列表。 */
export const notificationQueries = {
  list: () =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.notifications(signal),
      queryKey: notificationKeys.list(),
      staleTime: 60 * 1000
    })
}

// 概览查询：统一导出 queryOptions，页面只负责调用 useQuery。
export const overviewQueries = {
  summary: () =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.overview(signal),
      queryKey: overviewKeys.summary()
    })
}

// 工作台查询：用于承载高频任务、指标和活动流数据。
export const workplaceQueries = {
  summary: () =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.workplace(signal),
      queryKey: workplaceKeys.summary()
    })
}

// 系统管理查询：按资源拆分 query key，便于刷新当前页时精准失效。
// 参考/低频数据（departments/menus/roles/usersAll）设 10 分钟 staleTime，与 navigation/about 对齐；
// users 分页查询保持默认 1 分钟（用户数据变化频繁，且 mutation 的 invalidate 会主动失效）。
const REF_STALE_TIME = 10 * 60 * 1000

export const systemQueries = {
  departments: () =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.departments(signal),
      queryKey: systemKeys.departments(),
      staleTime: REF_STALE_TIME
    }),
  menus: () =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.menus(signal),
      queryKey: systemKeys.menus(),
      staleTime: REF_STALE_TIME
    }),
  roles: () =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.roles(signal),
      queryKey: systemKeys.roles(),
      staleTime: REF_STALE_TIME
    }),
  users: (params: { page: number; size: number } & Record<string, unknown>) =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.users(params, signal),
      queryKey: systemKeys.users(params)
    }),
  usersAll: () =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.usersAll(signal),
      queryKey: systemKeys.usersAll(),
      staleTime: REF_STALE_TIME
    })
}

// 关于查询：项目元信息变化较少，设置更长 staleTime。
export const aboutQueries = {
  project: () =>
    queryOptions({
      queryFn: ({ signal }) => adminApi.about(signal),
      queryKey: aboutKeys.project(),
      staleTime: 10 * 60 * 1000
    })
}
