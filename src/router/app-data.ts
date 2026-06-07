import type { MenuRecord, TabRecord } from "@/types/admin";

export const adminMenu: MenuRecord[] = [
  {
    icon: "LayoutDashboard",
    key: "/dashboard",
    path: "/dashboard",
    title: "仪表盘",
  },
  {
    icon: "BriefcaseBusiness",
    key: "/workplace",
    path: "/workplace",
    title: "工作台",
  },
  {
    children: [
      { badge: "12", key: "/system/users", path: "/system/users", title: "用户管理" },
      { key: "/system/roles", path: "/system/roles", title: "角色管理" },
      { key: "/system/audit", path: "/system/audit", title: "审计日志" },
    ],
    icon: "Shield",
    key: "/system",
    path: "/system",
    title: "系统管理",
  },
  {
    children: [
      { key: "/effects/modal", path: "/effects/modal", title: "弹窗与抽屉" },
      { key: "/effects/form", path: "/effects/form", title: "配置表单" },
      { key: "/effects/iframe", path: "/effects/iframe", title: "内嵌页面" },
    ],
    icon: "PanelsTopLeft",
    key: "/effects",
    path: "/effects",
    title: "交互能力",
  },
];

export const affixTabs: TabRecord[] = [
  {
    affix: true,
    icon: "LayoutDashboard",
    key: "/dashboard",
    path: "/dashboard",
    title: "仪表盘",
  },
];

export const ADMIN_DEFAULT_PATH = "/dashboard";

// 函数：flattenMenuRecords。展开管理菜单树，供路由和标签计算复用。
function flattenMenuRecords(menu: MenuRecord[]): MenuRecord[] {
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

export const adminRoutePaths = flattenMenuRecords(adminMenu).map((item) => item.path);

export const adminPagePaths = flattenMenuRecords(adminMenu)
  .filter((item) => !item.children?.length)
  .map((item) => item.path);

// 函数：normalizeAdminPath。把任意路径规整到管理端可访问页面。
export function normalizeAdminPath(pathname: string) {
  const path = normalizePathname(pathname);

  if (path === "/") {
    return ADMIN_DEFAULT_PATH;
  }

  const menuRecord = flattenMenuRecords(adminMenu).find((item) => item.path === path);

  return menuRecord ? getDefaultMenuPath(menuRecord) : ADMIN_DEFAULT_PATH;
}

export const menuTitleMessages: Record<string, Record<string, string>> = {
  "/dashboard": {
    "en-US": "Dashboard",
    "zh-CN": "仪表盘",
  },
  "/effects": {
    "en-US": "Interaction",
    "zh-CN": "交互能力",
  },
  "/effects/form": {
    "en-US": "Schema Form",
    "zh-CN": "配置表单",
  },
  "/effects/iframe": {
    "en-US": "Embedded Page",
    "zh-CN": "内嵌页面",
  },
  "/effects/modal": {
    "en-US": "Modal & Drawer",
    "zh-CN": "弹窗与抽屉",
  },
  "/system": {
    "en-US": "System",
    "zh-CN": "系统管理",
  },
  "/system/audit": {
    "en-US": "Audit Log",
    "zh-CN": "审计日志",
  },
  "/system/roles": {
    "en-US": "Roles",
    "zh-CN": "角色管理",
  },
  "/system/users": {
    "en-US": "Users",
    "zh-CN": "用户管理",
  },
  "/workplace": {
    "en-US": "Workplace",
    "zh-CN": "工作台",
  },
};

// 函数：translateMenuTitle。按语言环境获取菜单标题。
export function translateMenuTitle(path: string, locale = "zh-CN") {
  return menuTitleMessages[path]?.[locale] ?? menuTitleMessages[path]?.["zh-CN"] ?? path;
}

// 函数：localizeMenu。递归替换菜单树的本地化标题。
export function localizeMenu(menu: MenuRecord[], locale = "zh-CN"): MenuRecord[] {
  return menu.map((item) => ({
    ...item,
    children: item.children ? localizeMenu(item.children, locale) : undefined,
    title: translateMenuTitle(item.path, locale),
  }));
}

// 函数：localizeTabs。替换标签页标题为当前语言。
export function localizeTabs(tabs: TabRecord[], locale = "zh-CN"): TabRecord[] {
  return tabs.map((tab) => ({
    ...tab,
    title: translateMenuTitle(tab.path, locale),
  }));
}

export const overviewStats = [
  { label: "在线会话", trend: "+18.2%", value: "24,892" },
  { label: "查询缓存命中", trend: "+6.4%", value: "96.8%" },
  { label: "待处理告警", trend: "-3", value: "17" },
  { label: "平均响应", trend: "-24ms", value: "184ms" },
];

export const userRows = [
  { email: "root@example.com", role: "所有者", status: "启用", team: "平台组" },
  { email: "ops@example.com", role: "运营员", status: "启用", team: "运营组" },
  { email: "audit@example.com", role: "审计员", status: "复核中", team: "风控组" },
];

// 函数：getMenuTitle。获取路径对应标题，未知路径回退到仪表盘标题。
export function getMenuTitle(path: string, locale = "zh-CN") {
  const all = flattenMenuRecords(adminMenu);

  return all.some((item) => item.path === path)
    ? translateMenuTitle(path, locale)
    : translateMenuTitle("/dashboard", locale);
}
