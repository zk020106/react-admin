import { mockAdminMenu } from "@/mock/admin-mock";
import type { MenuRecord, TabRecord } from "@/types/admin";

export const ADMIN_DEFAULT_PATH = "/overview";

// 静态导出只作为首屏 placeholder，运行时菜单通过 mock query 获取。
export const adminMenu: MenuRecord[] = mockAdminMenu;

export const affixTabs: TabRecord[] = [
  {
    affix: true,
    icon: "LayoutDashboard",
    key: ADMIN_DEFAULT_PATH,
    path: ADMIN_DEFAULT_PATH,
    title: "概览",
  },
];

export const adminRoutePaths: string[] = [];

// 函数：flattenMenuRecords。展开管理菜单树，供路由和标签计算复用。
export function flattenMenuRecords(menu: MenuRecord[]): MenuRecord[] {
  return menu.flatMap((item) => [item, ...flattenMenuRecords(item.children ?? [])]);
}

// 函数：normalizePathname。去除查询、哈希和尾部斜杠，得到稳定路径。
function normalizePathname(pathname: string) {
  const [path = ""] = pathname.split(/[?#]/);
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

// 函数：getDefaultMenuPath。获取菜单节点可进入的默认叶子路径。
export function getDefaultMenuPath(item: MenuRecord): string {
  return item.children?.[0] ? getDefaultMenuPath(item.children[0]) : item.path;
}

// 函数：normalizeAdminPath。把任意路径规整到 mock 菜单可访问页面。
export function normalizeAdminPath(pathname: string, menu: MenuRecord[] = adminMenu) {
  const path = normalizePathname(pathname);

  if (path === "/") {
    return ADMIN_DEFAULT_PATH;
  }

  const menuRecord = flattenMenuRecords(menu).find((item) => item.path === path);

  return menuRecord ? getDefaultMenuPath(menuRecord) : ADMIN_DEFAULT_PATH;
}

// 函数：getMenuTitle。获取 mock 菜单中路径对应的标题。
export function getMenuTitle(path: string, menu: MenuRecord[] = adminMenu) {
  return (
    flattenMenuRecords(menu).find((item) => item.path === path)?.title ??
    flattenMenuRecords(menu).find((item) => item.path === ADMIN_DEFAULT_PATH)?.title ??
    path
  );
}
