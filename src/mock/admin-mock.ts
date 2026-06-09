import type { MenuRecord } from "@/types/admin";

export interface OverviewStat {
  label: string;
  trend: string;
  value: string;
}

export interface OverviewSummary {
  healthItems: Array<{
    label: string;
    value: string;
  }>;
  operationItems: Array<{
    label: string;
    status: string;
  }>;
  stats: OverviewStat[];
}

export interface UserRecord {
  department: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export interface RoleRecord {
  code: string;
  dataScope: string;
  description: string;
  memberCount: number;
  name: string;
  permissions: string[];
  status: string;
}

export interface MenuManagementRecord {
  childrenCount: number;
  component: string;
  name: string;
  parentName: string;
  path: string;
  permission: string;
  sort: number;
  status: string;
  type: "目录" | "菜单";
}

export interface DepartmentRecord {
  leader: string;
  memberCount: number;
  name: string;
  parent: string;
  status: string;
}

export interface DependencyRecord {
  name: string;
  type: "dependency" | "devDependency";
  version: string;
}

export interface ProjectInfo {
  dependencies: DependencyRecord[];
  description: string;
  meta: Array<{
    label: string;
    value: string;
  }>;
  name: string;
  version: string;
}

const MOCK_DELAY = 120;

// Mock 菜单是后台导航和路由归一化的单一数据源，标题固定为中文。
export const mockAdminMenu: MenuRecord[] = [
  {
    icon: "LayoutDashboard",
    key: "/overview",
    path: "/overview",
    title: "概览",
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
      { key: "/system/menus", path: "/system/menus", title: "菜单管理" },
      { key: "/system/departments", path: "/system/departments", title: "部门管理" },
    ],
    icon: "Shield",
    key: "/system",
    path: "/system",
    title: "系统管理",
  },
  {
    icon: "Info",
    key: "/about",
    path: "/about",
    title: "关于",
  },
];

const overviewSummary: OverviewSummary = {
  healthItems: [
    { label: "路由记录", value: "8" },
    { label: "Mock 接口", value: "7" },
    { label: "查询键", value: "7" },
  ],
  operationItems: [
    { label: "菜单路由", status: "已从 mock 加载" },
    { label: "工作台页面", status: "已接入" },
    { label: "用户数据", status: "已就绪" },
    { label: "角色数据", status: "已就绪" },
    { label: "部门数据", status: "已就绪" },
  ],
  stats: [
    { label: "活跃用户", trend: "+12.5%", value: "1,286" },
    { label: "角色组", trend: "+2", value: "8" },
    { label: "菜单节点", trend: "+5", value: "33" },
    { label: "部门数量", trend: "+1", value: "12" },
  ],
};

const users: UserRecord[] = [
  {
    department: "平台部",
    email: "root@example.com",
    name: "超级管理员",
    role: "所有者",
    status: "启用",
  },
  {
    department: "运营部",
    email: "ops@example.com",
    name: "运营账号",
    role: "运营员",
    status: "启用",
  },
  {
    department: "风控部",
    email: "audit@example.com",
    name: "审计账号",
    role: "审计员",
    status: "复核中",
  },
];

const roles: RoleRecord[] = [
  {
    code: "owner",
    dataScope: "全部数据",
    description: "拥有平台全部权限",
    memberCount: 3,
    name: "所有者",
    permissions: [
      "overview:read",
      "workplace:read",
      "system:user:read",
      "system:role:read",
      "system:menu:read",
      "system:department:read",
      "about:read",
    ],
    status: "启用",
  },
  {
    code: "operator",
    dataScope: "本部门数据",
    description: "负责日常运营操作",
    memberCount: 16,
    name: "运营员",
    permissions: ["overview:read", "workplace:read", "system:user:read", "system:department:read"],
    status: "启用",
  },
  {
    code: "auditor",
    dataScope: "只读审计数据",
    description: "只读审计与复核权限",
    memberCount: 5,
    name: "审计员",
    permissions: ["overview:read", "workplace:read", "system:role:read", "about:read"],
    status: "复核中",
  },
];

const menus: MenuManagementRecord[] = [
  {
    childrenCount: 0,
    component: "OverviewPage",
    name: "概览",
    parentName: "-",
    path: "/overview",
    permission: "overview:read",
    sort: 10,
    status: "显示",
    type: "菜单",
  },
  {
    childrenCount: 0,
    component: "WorkplacePage",
    name: "工作台",
    parentName: "-",
    path: "/workplace",
    permission: "workplace:read",
    sort: 20,
    status: "显示",
    type: "菜单",
  },
  {
    childrenCount: 4,
    component: "LayoutRoute",
    name: "系统管理",
    parentName: "-",
    path: "/system",
    permission: "system:read",
    sort: 30,
    status: "显示",
    type: "目录",
  },
  {
    childrenCount: 0,
    component: "UsersPage",
    name: "用户管理",
    parentName: "系统管理",
    path: "/system/users",
    permission: "system:user:read",
    sort: 31,
    status: "显示",
    type: "菜单",
  },
  {
    childrenCount: 0,
    component: "RolesPage",
    name: "角色管理",
    parentName: "系统管理",
    path: "/system/roles",
    permission: "system:role:read",
    sort: 32,
    status: "显示",
    type: "菜单",
  },
  {
    childrenCount: 0,
    component: "MenusPage",
    name: "菜单管理",
    parentName: "系统管理",
    path: "/system/menus",
    permission: "system:menu:read",
    sort: 33,
    status: "显示",
    type: "菜单",
  },
  {
    childrenCount: 0,
    component: "DepartmentsPage",
    name: "部门管理",
    parentName: "系统管理",
    path: "/system/departments",
    permission: "system:department:read",
    sort: 34,
    status: "显示",
    type: "菜单",
  },
  {
    childrenCount: 0,
    component: "AboutPage",
    name: "关于",
    parentName: "-",
    path: "/about",
    permission: "about:read",
    sort: 40,
    status: "显示",
    type: "菜单",
  },
];

const departments: DepartmentRecord[] = [
  { leader: "明", memberCount: 18, name: "平台部", parent: "-", status: "启用" },
  { leader: "青", memberCount: 24, name: "运营部", parent: "-", status: "启用" },
  { leader: "林", memberCount: 9, name: "风控部", parent: "运营部", status: "启用" },
];

const dependencies: DependencyRecord[] = [
  { name: "@tanstack/react-query", type: "dependency", version: "^5.101.0" },
  { name: "@tanstack/react-router", type: "dependency", version: "^1.170.11" },
  { name: "@tanstack/react-table", type: "dependency", version: "^8.21.3" },
  { name: "antd", type: "dependency", version: "^6.4.3" },
  { name: "axios", type: "dependency", version: "^1.17.0" },
  { name: "lucide-react", type: "dependency", version: "^1.17.0" },
  { name: "react", type: "dependency", version: "^19.2.6" },
  { name: "react-dom", type: "dependency", version: "^19.2.6" },
  { name: "react-hook-form", type: "dependency", version: "^7.77.0" },
  { name: "tailwindcss", type: "dependency", version: "^4.3.0" },
  { name: "zod", type: "dependency", version: "^4.4.3" },
  { name: "zustand", type: "dependency", version: "^5.0.14" },
  { name: "typescript", type: "devDependency", version: "~6.0.2" },
  { name: "vite", type: "devDependency", version: "^8.0.12" },
  { name: "vitest", type: "devDependency", version: "^4.1.8" },
  { name: "oxfmt", type: "devDependency", version: "^0.53.0" },
  { name: "oxlint", type: "devDependency", version: "^1.68.0" },
];

// Mock API 保持和真实请求一致的 Promise + AbortSignal 形态，方便后续替换为 axios。
export const adminMockApi = {
  about: (signal?: AbortSignal) => delay(getProjectInfo(), signal),
  departments: (signal?: AbortSignal) => delay(departments, signal),
  menu: (signal?: AbortSignal) => delay(mockAdminMenu, signal),
  menus: (signal?: AbortSignal) => delay(menus, signal),
  overview: (signal?: AbortSignal) => delay(overviewSummary, signal),
  roles: (signal?: AbortSignal) => delay(roles, signal),
  users: (signal?: AbortSignal) => delay(users, signal),
};

// 函数：getProjectInfo。组装关于页展示的项目元信息。
function getProjectInfo(): ProjectInfo {
  return {
    dependencies,
    description: "Ant Design 6 + TanStack Query + TanStack Router 管理端示例。",
    meta: [
      { label: "包名", value: "antd-react-admin" },
      { label: "版本", value: "0.0.0" },
      { label: "运行时", value: "React 19" },
      { label: "包管理器", value: "pnpm" },
    ],
    name: "antd-react-admin",
    version: "0.0.0",
  };
}

// 函数：delay。模拟网络延迟，并在 TanStack Query 取消查询时中止等待。
function delay<T>(value: T, signal?: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = window.setTimeout(() => resolve(value), MOCK_DELAY);

    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
