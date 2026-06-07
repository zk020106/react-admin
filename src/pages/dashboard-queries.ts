import { queryOptions } from "@tanstack/react-query";

import { getAdminMessages } from "@/i18n/admin-i18n";
import { dashboardKeys } from "@/lib/query-keys";

const MOCK_QUERY_DELAY = 80;

// Dashboard 查询配置工厂：集中维护 queryKey、queryFn 和该页面的查询策略。
export const dashboardQueries = {
  overviewStats: (locale: string) =>
    queryOptions({
      queryFn: () => getOverviewStats(locale),
      queryKey: dashboardKeys.overviewStats(locale),
    }),
};

function getOverviewStats(locale: string) {
  return delay(getAdminMessages(locale).pages.dashboard.stats);
}

function delay<T>(value: T) {
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), MOCK_QUERY_DELAY);
  });
}
