import { queryOptions } from "@tanstack/react-query";

import {
  aboutKeys,
  navigationKeys,
  notificationKeys,
  overviewKeys,
  systemKeys,
  workplaceKeys,
} from "@/lib/query-keys";
import { adminMockApi, mockAdminMenu } from "@/mock/admin-mock";

// 导航查询：菜单通过 mock request 获取，placeholder 只用于避免首屏空菜单。
export const navigationQueries = {
  menu: () =>
    queryOptions({
      placeholderData: mockAdminMenu,
      queryFn: ({ signal }) => adminMockApi.menu(signal),
      queryKey: navigationKeys.menu(),
      staleTime: 10 * 60 * 1000,
    }),
};

/** 通知中心查询，顶部栏通过该查询读取最新通知列表。 */
export const notificationQueries = {
  list: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.notifications(signal),
      queryKey: notificationKeys.list(),
      staleTime: 60 * 1000,
    }),
};

// 概览查询：统一导出 queryOptions，页面只负责调用 useQuery。
export const overviewQueries = {
  summary: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.overview(signal),
      queryKey: overviewKeys.summary(),
    }),
};

// 工作台查询：用于承载高频任务、指标和活动流数据。
export const workplaceQueries = {
  summary: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.workplace(signal),
      queryKey: workplaceKeys.summary(),
    }),
};

// 系统管理查询：按资源拆分 query key，便于刷新当前页时精准失效。
export const systemQueries = {
  departments: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.departments(signal),
      queryKey: systemKeys.departments(),
    }),
  menus: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.menus(signal),
      queryKey: systemKeys.menus(),
    }),
  roles: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.roles(signal),
      queryKey: systemKeys.roles(),
    }),
  users: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.users(signal),
      queryKey: systemKeys.users(),
    }),
};

// 关于查询：项目元信息变化较少，设置更长 staleTime。
export const aboutQueries = {
  project: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.about(signal),
      queryKey: aboutKeys.project(),
      staleTime: 10 * 60 * 1000,
    }),
};
