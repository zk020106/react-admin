import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { BaseLayout } from "@/layouts";

const rootRoute = createRootRoute({
  component: BaseLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
});

const fallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
});

const routeTree = rootRoute.addChildren([indexRoute, fallbackRoute]);

// 函数：createAppRouter。创建应用路由实例并绑定浏览器历史。
export function createAppRouter() {
  return createRouter({
    history: createBrowserHistory(),
    routeTree,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
