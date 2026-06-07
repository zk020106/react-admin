import type { QueryKey } from "@tanstack/react-query";

// Query key 统一工厂：保持层级结构，便于精准失效、预取和复用。
export const dashboardKeys = {
  all: ["dashboard"] as const,
  overviewStats: (locale: string) => [...dashboardKeys.all, "overview-stats", locale] as const,
};

// 当前页刷新只失效该路由实际拥有的查询，避免 invalidateQueries() 清空全局缓存。
export function getRouteRefreshQueryKeys(path: string, locale: string): QueryKey[] {
  if (path === "/dashboard") {
    return [dashboardKeys.overviewStats(locale)];
  }

  return [];
}
