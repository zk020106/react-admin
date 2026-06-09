import type { QueryKey } from "@tanstack/react-query";

export const navigationKeys = {
  all: ["navigation"] as const,
  menu: () => [...navigationKeys.all, "menu"] as const,
};

export const overviewKeys = {
  all: ["overview"] as const,
  summary: () => [...overviewKeys.all, "summary"] as const,
};

export const workplaceKeys = {
  all: ["workplace"] as const,
  summary: () => [...workplaceKeys.all, "summary"] as const,
};

export const systemKeys = {
  all: ["system"] as const,
  departments: () => [...systemKeys.all, "departments"] as const,
  menus: () => [...systemKeys.all, "menus"] as const,
  roles: () => [...systemKeys.all, "roles"] as const,
  users: () => [...systemKeys.all, "users"] as const,
};

export const aboutKeys = {
  all: ["about"] as const,
  project: () => [...aboutKeys.all, "project"] as const,
};

// 当前页刷新只失效该路由实际拥有的查询，避免 invalidateQueries() 清空全局缓存。
export function getRouteRefreshQueryKeys(path: string): QueryKey[] {
  if (path === "/overview") {
    return [overviewKeys.summary()];
  }

  if (path === "/workplace") {
    return [workplaceKeys.summary()];
  }

  if (path === "/system/users") {
    return [systemKeys.users()];
  }

  if (path === "/system/roles") {
    return [systemKeys.roles()];
  }

  if (path === "/system/menus") {
    return [systemKeys.menus(), navigationKeys.menu()];
  }

  if (path === "/system/departments") {
    return [systemKeys.departments()];
  }

  if (path === "/about") {
    return [aboutKeys.project()];
  }

  return [];
}
