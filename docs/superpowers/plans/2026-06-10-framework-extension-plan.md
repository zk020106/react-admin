# Framework Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展当前 React 管理后台的框架能力，优先补齐通知中心、权限审计、数据管理和工程化验证链路。

**Architecture:** 延续现有 Vite + React + TanStack Router + TanStack Query + Zustand 架构。新增能力按 `mock 数据 -> query key -> queryOptions -> 页面或布局组件 -> 测试` 的顺序落地，避免把数据请求、筛选逻辑和展示逻辑重新堆回单个组件。全局交互放在 `src/layouts/`，业务页面放在 `src/pages/`，共享类型和 mock API 继续收敛到 `src/mock/admin-mock.ts` 与 `src/lib/query-keys.ts`。

**Tech Stack:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Zustand, shadcn/radix UI, Vitest, Testing Library, oxfmt, oxlint.

---

## 当前状态

- 分支：`dev`。
- 布局拆分已经完成，当前结构包含 `base-layout`、`admin-header`、`admin-sidebar`、`tabbar`、`workspace-navigation`、`workspace-overlays`、`preferences-*` 等模块。
- 数据查询已经形成集中模式：`src/lib/query-keys.ts` 管理 query key，`src/pages/admin-queries.ts` 管理 `queryOptions`，`src/mock/admin-mock.ts` 提供 mock API。
- 系统管理页面已扩展用户、角色、菜单、部门；工作台和概览页已接入数据摘要。
- 后续扩展应继续保持文件名 `kebab-case`，组件和类型 `PascalCase`，变量与函数 `camelCase`。
- 新增导出组件、导出函数、复杂内部函数需要补充中文 JSDoc 注释，注释格式使用 `/** ... */`。

## 文件职责

- `src/lib/query-keys.ts`：维护所有 TanStack Query key 工厂，支持按路由精确刷新。
- `src/pages/admin-queries.ts`：集中导出各业务域 `queryOptions`，页面只负责调用 `useQuery`。
- `src/mock/admin-mock.ts`：定义 mock 类型、mock 数据和 `adminMockApi`。
- `src/layouts/admin-header.tsx`：承载顶部全局能力，包括通知、搜索、刷新、偏好设置、语言、时区、全屏和用户菜单。
- `src/pages/system-pages.tsx`：承载系统管理四个业务页，后续可继续拆出表格、筛选和表单子组件。
- `src/__tests__/`：按能力补充单元测试或组件测试，优先覆盖 query key、筛选逻辑、弹层交互和关键页面渲染。

## 阶段路线图

### 阶段一：横向框架能力

- 通知中心数据驱动：顶部通知从国际化静态文案切到 mock API + TanStack Query。
- 全局搜索增强：搜索对象从路由标题扩展到菜单、页面动作、系统用户和权限编码。
- 刷新策略收敛：`getRouteRefreshQueryKeys()` 保持按路由精确失效，新增页面必须同时补 query key 和刷新映射。

### 阶段二：权限与审计

- 权限模型接口：补齐菜单权限、角色权限、数据范围和操作权限的 mock API。
- 审计日志页面：新增操作审计列表，展示操作者、动作、资源、结果、时间和风险级别。
- 角色授权链路：角色页从静态权限矩阵升级为可编辑矩阵，提交后按资源失效 query。

### 阶段三：数据管理能力

- 表格模式统一：用户、角色、菜单、部门页面统一搜索、筛选、排序、分页和空状态样式。
- Mutation 链路：新增创建、编辑、启停、删除等 mock mutation，并统一 toast、加载、错误和失效策略。
- 表单规范：React Hook Form + Zod 管理复杂表单校验，普通短表单继续使用本地 state。

### 阶段四：工程化与交付

- Mock 适配层：保留当前 `adminMockApi` 形态，逐步替换为 axios 或 MSW 时不影响页面。
- E2E 冒烟：覆盖登录后基础导航、顶部搜索、通知菜单、系统管理四页渲染。
- 回归门禁：每个阶段提交前执行 `pnpm.cmd format:check`、`pnpm.cmd lint`、`pnpm.cmd test`、`pnpm.cmd build`。

## 下一阶段任务拆解

### Task 1: 通知中心数据驱动

**Files:**

- Modify: `src/lib/query-keys.ts`
- Modify: `src/mock/admin-mock.ts`
- Modify: `src/pages/admin-queries.ts`
- Modify: `src/layouts/admin-header.tsx`
- Test: `src/__tests__/app-shell.test.tsx`

- [x] **Step 1: 写出通知菜单组件测试**

在 `src/__tests__/app-shell.test.tsx` 中增加顶部通知入口断言，测试先锁定用户可见行为。

```tsx
expect(screen.getByRole("button", { name: /通知|Notifications/i })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: /通知|Notifications/i }));
expect(await screen.findByText("系统巡检完成")).toBeInTheDocument();
expect(screen.getByText("权限矩阵已同步")).toBeInTheDocument();
```

Run: `pnpm.cmd test -- src/__tests__/app-shell.test.tsx`

Expected: FAIL，当前通知文案仍来自 `messages.header.notificationItems`，尚未接入 mock 通知数据。

- [x] **Step 2: 增加通知 query key**

在 `src/lib/query-keys.ts` 中补充通知中心 query key，并在路由刷新函数中保持不绑定业务页刷新。

```ts
/** 通知中心查询键，用于精确刷新顶部通知列表。 */
export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};
```

- [x] **Step 3: 增加通知 mock 类型与 API**

在 `src/mock/admin-mock.ts` 中增加类型、数据和 API。

```ts
export interface NotificationRecord {
  description: string;
  id: string;
  status: "read" | "unread";
  time: string;
  title: string;
  type: "success" | "warning" | "info";
}

const notifications: NotificationRecord[] = [
  {
    description: "工作台指标和系统管理数据均已完成刷新。",
    id: "notice-system-health",
    status: "unread",
    time: "10:30",
    title: "系统巡检完成",
    type: "success",
  },
  {
    description: "角色、菜单、部门页面的读取权限已按最新 mock 数据同步。",
    id: "notice-permission-sync",
    status: "read",
    time: "09:50",
    title: "权限矩阵已同步",
    type: "info",
  },
];
```

同时在 `adminMockApi` 中追加：

```ts
notifications: (signal?: AbortSignal) => delay(notifications, signal),
```

- [x] **Step 4: 增加通知 queryOptions**

在 `src/pages/admin-queries.ts` 中导入 `notificationKeys`，并追加通知查询。

```ts
/** 通知中心查询，顶部栏通过该查询读取最新通知列表。 */
export const notificationQueries = {
  list: () =>
    queryOptions({
      queryFn: ({ signal }) => adminMockApi.notifications(signal),
      queryKey: notificationKeys.list(),
      staleTime: 60 * 1000,
    }),
};
```

- [x] **Step 5: 改造顶部通知菜单**

在 `src/layouts/admin-header.tsx` 中用 `useQuery(notificationQueries.list())` 替换 `messages.header.notificationItems`。未读红点使用数据计算，空列表显示一条短文案。

```tsx
const emptyNotifications: NotificationRecord[] = [];

function NotificationsMenu({ locale }: { locale: string }) {
  const messages = getAdminMessages(locale);
  const { data = emptyNotifications } = useQuery(notificationQueries.list());
  const unreadCount = data.filter((item) => item.status === "unread").length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={messages.header.notifications} className="admin-header-icon-button relative" size="icon-sm" variant="ghost">
          <Bell />
          {unreadCount > 0 ? <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" /> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{messages.header.notifications}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data.length > 0 ? (
          data.map((item) => (
            <DropdownMenuItem className="items-start gap-2" key={item.id}>
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <span className="grid gap-0.5">
                <span>{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>暂无通知</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Run: `pnpm.cmd test -- src/__tests__/app-shell.test.tsx`

Expected: PASS，通知按钮可打开，菜单内展示 mock 通知标题。

- [x] **Step 6: 全量验证并提交**

```powershell
pnpm.cmd format:check
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
git add src/lib/query-keys.ts src/mock/admin-mock.ts src/pages/admin-queries.ts src/layouts/admin-header.tsx src/__tests__/app-shell.test.tsx
git commit -m "feat: add data-driven notification center"
```

Expected: 四个验证命令 exit code 均为 `0`，提交只包含通知中心相关改动。

### Task 2: 全局搜索增强

**Files:**

- Modify: `src/layouts/workspace-overlays.tsx`
- Modify: `src/utils/menu.ts`
- Modify: `src/mock/admin-mock.ts`
- Test: `src/__tests__/menu.test.ts`
- Test: `src/__tests__/app-shell.test.tsx`

- [x] **Step 1: 补搜索索引单元测试**

在 `src/__tests__/menu.test.ts` 中增加搜索候选断言，覆盖菜单、权限编码和系统用户。

```ts
const [users, menus] = await Promise.all([adminMockApi.users(), adminMockApi.menus()]);

expect(buildWorkspaceSearchItems(mockAdminMenu, users, menus)).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ keyword: expect.stringContaining("system:user:read") }),
    expect.objectContaining({ title: "超级管理员" }),
  ]),
);
```

Run: `pnpm.cmd test -- src/__tests__/menu.test.ts`

Expected: FAIL，当前搜索只覆盖已有菜单路径。

- [x] **Step 2: 抽取搜索候选构建函数**

在 `src/utils/menu.ts` 中增加纯函数，输入菜单和用户数据，输出可搜索候选项。

```ts
export interface WorkspaceSearchItem {
  description: string;
  keyword: string;
  path: string;
  title: string;
  type: "menu" | "user" | "permission";
}

/** 构建全局搜索候选项，覆盖菜单、权限和系统用户。 */
export function buildWorkspaceSearchItems(
  menu: MenuRecord[],
  users: UserRecord[],
  permissions: MenuManagementRecord[],
) {
  const menuItems = flattenMenu(menu).map((item) => ({
    description: item.path,
    keyword: [item.title, item.path, item.badge].filter(Boolean).join(" "),
    path: item.path,
    title: item.title,
    type: "menu" as const,
  }));

  const permissionItems = permissions.map((item) => ({
    description: `${item.name} / ${item.path}`,
    keyword: [item.name, item.path, item.permission, item.component].join(" "),
    path: item.path,
    title: item.permission,
    type: "permission" as const,
  }));

  const userItems = users.map((user) => ({
    description: `${user.role} / ${user.department}`,
    keyword: [user.name, user.email, user.role, user.department].join(" "),
    path: "/system/users",
    title: user.name,
    type: "user" as const,
  }));

  return [...menuItems, ...permissionItems, ...userItems];
}
```

- [x] **Step 3: 接入搜索弹层**

在 `src/layouts/workspace-overlays.tsx` 中读取 `systemQueries.users()` 和 `systemQueries.menus()`，调用候选构建函数，并保持点击候选项复用现有 `navigate(path)`。

Run: `pnpm.cmd test -- src/__tests__/app-shell.test.tsx`

Expected: PASS，搜索弹层能展示菜单和系统用户候选项。

- [x] **Step 4: 全量验证并提交**

```powershell
pnpm.cmd format:check
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
git add src/layouts/workspace-overlays.tsx src/utils/menu.ts src/mock/admin-mock.ts src/__tests__/menu.test.ts src/__tests__/app-shell.test.tsx
git commit -m "feat: expand global search"
```

### Task 3: 权限审计页面

**Files:**

- Modify: `src/mock/admin-mock.ts`
- Modify: `src/lib/query-keys.ts`
- Modify: `src/pages/admin-queries.ts`
- Modify: `src/router/app-data.ts`
- Create: `src/pages/audit-log-page.tsx`
- Test: `src/__tests__/app-shell.test.tsx`

- [ ] **Step 1: 定义审计数据**

在 `src/mock/admin-mock.ts` 中增加 `AuditLogRecord` 和 `auditLogs`，字段固定为操作者、动作、资源、结果、风险级别和发生时间。

```ts
export interface AuditLogRecord {
  action: string;
  actor: string;
  id: string;
  occurredAt: string;
  resource: string;
  result: "成功" | "失败" | "复核中";
  riskLevel: "低" | "中" | "高";
}
```

- [ ] **Step 2: 增加路由、菜单与查询**

新增 `/system/audit-logs` 路由，菜单标题为 `审计日志`，权限编码为 `system:audit:read`。query key 命名为 `systemKeys.auditLogs()`，queryOptions 命名为 `systemQueries.auditLogs()`。

- [ ] **Step 3: 创建审计日志页面**

`src/pages/audit-log-page.tsx` 使用 `Table` 展示审计记录，顶部放三项摘要：日志总数、高风险数量、失败数量。导出的 `AuditLogPage` 需要中文 JSDoc。

- [ ] **Step 4: 验证导航可达**

Run: `pnpm.cmd test -- src/__tests__/app-shell.test.tsx`

Expected: PASS，菜单中能进入 `审计日志` 页面，页面展示 mock 审计记录。

## 质量门禁

每个功能任务完成后执行：

```powershell
pnpm.cmd format:check
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
```

提交前检查：

```powershell
git status --short --branch
git diff --cached --stat
```

验收标准：

- 只提交当前任务相关文件。
- 所有新增导出组件、导出函数和复杂内部函数都有中文 JSDoc。
- query key、queryOptions、mock API 三者命名一致。
- 页面刷新只失效当前路由拥有的查询，不调用无范围的 `invalidateQueries()`。
- React 组件不在 render 内创建无意义对象或大数组；筛选、统计和派生数据使用 `useMemo`。

## 自检结果

- 规划覆盖当前状态、阶段路线图、下一阶段任务、文件边界、命名规范、注释规范和验证门禁。
- 文档未使用占位式条目；每个任务都有明确文件、命令和期望结果。
- 下一步建议优先执行 Task 1，因为它能把顶部全局能力纳入已经建立的 Query 数据模式。
