import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { BaseLayout } from "@/layouts";

import { adminRoutePaths } from "./app-data";

const rootRoute = createRootRoute({
  component: BaseLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
});

const adminRoutes = adminRoutePaths.map((path) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
  }),
);

const fallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
});

const routeTree = rootRoute.addChildren([indexRoute, ...adminRoutes, fallbackRoute]);

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
