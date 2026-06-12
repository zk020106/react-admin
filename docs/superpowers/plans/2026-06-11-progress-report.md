# 2026-06-11 路由 + antd CRUD + 权限会话进度报告

## 当前结论

- A 组路由转正已完成。
- B 组 antd CRUD 基建已完成；B5 原阻塞「新增用户后表格不刷新」已解决。
- C 组权限会话闭环已落地：token refresh 单飞、按钮权限、路由权限 403、路由错误边界。
- 当前主门禁通过：TypeScript、lint、全量 Vitest、生产 build。
- 剩余事项不再阻塞提交：antd/jsdom 测试噪音、Popconfirm 删除 UI 测试稳定性、vendor-antd chunk size 提示。

---

## 已完成任务

### A 组：路由转正 (3/3) ✅

- **A1 路由表与 404 页** ✅
  - 新增 `routes.tsx` 定义页面清单与路由表。
  - 新增 `NotFoundPage` 壳内 404 页。
  - 新增 `getAdminPageDefinition()` 按路径取页面定义。
  - 路由树改为显式声明每条路由。

- **A2 BaseLayout Outlet 化与守卫** ✅
  - `BaseLayout` 改为 `<Outlet />` 承载路由内容。
  - 登录守卫：未认证重定向到 `/login`。
  - 根路由 `/` 重定向到 `ADMIN_DEFAULT_PATH`。
  - 通配路由 `$` 渲染壳内 404，不再吸附到默认页。

- **A3 路由行为测试** ✅
  - 覆盖根路由重定向、壳内 404、未知路径不开标签页。
  - 补充 403 与 500 错误边界测试。

### B 组：antd CRUD 基建 (7/7) ✅

- **B0 AdminConfigProvider 主题桥** ✅
  - `buildAntdThemeConfig()`、`isDarkPreference()`、`AdminConfigProvider` 已落地。
  - 登录页和内容页 antd 主题桥接完成。

- **B1 SchemaForm + useAdminForm** ✅
  - schema 字段注册、SchemaForm、useAdminForm 已落地。
  - `FormApi` 已补 `setValue()` 和活值读取契约。

- **B2 AdminModal / AdminDrawer** ✅
  - `usePopupState()`、`useModalApi()`、`useDrawerApi()` 已落地。
  - Modal/Drawer 支持确认、取消、loading、守卫和动态 footer。

- **B3 AdminTable** ✅
  - 标准表格组件已落地，统一分页、尺寸、工具栏布局。

- **B4 写接口与 mutation 约定** ✅
  - `AdminApiHttpClient` 已支持 POST/PUT/DELETE。
  - mock users 已改为内存 CRUD。
  - `userMutations` 成功后精确失效 `systemKeys.users()`。
  - `MutationCache` 统一 mutation 错误 toast。

- **B5 users 全链路 CRUD + effects 转正** ✅
  - UsersPage 已切换为 `AdminTable` + 新增/编辑 Modal + 删除 Popconfirm。
  - `useUserFormModal()` 已组合 `SchemaForm` 与 `AdminModal`。
  - `/effects` 页面与权限已接入。
  - 原卡点「新增用户后 `测试账号` 不出现」已修复并验证。
  - 全局搜索回归已修复：`CommandDialog` 的 `DialogTitle` 已移入 `DialogContent`，弹窗可按 `role=dialog name=全局搜索` 查询。

### C 组：权限会话闭环 (4/4) ✅

- **C1 token 刷新单飞队列** ✅
  - 新增 `src/auth/token-refresh.ts`。
  - `AuthApi` 增加 `refresh(refreshToken)`。
  - mock session 增加 `refreshToken`，mock auth 增加 refresh 实现。
  - HTTP 401 会先尝试 refresh，再重放原请求；refresh 请求本身通过 `skipAuthRefresh` 避免循环刷新。
  - `http-auth.ts` 已接线 store 会话刷新与 token 写回。

- **C2 HasPermission 组件** ✅
  - 新增 `src/components/has-permission.tsx`。
  - 权限解析层将 `owner` 角色视为全权限，兼容旧持久化 mock session 只带 read 权限导致操作按钮隐藏的问题。
  - UsersPage 新增、编辑、删除按钮分别接入：
    - `system:user:create`
    - `system:user:update`
    - `system:user:delete`
  - mock 默认用户已补写权限，避免现有流程不可见。

- **C3 路由权限 + 403** ✅
  - `routes.tsx` 页面定义已挂 `permission`。
  - `BaseLayout` 读取当前 route staticData，并在无权限时渲染壳内 403。
  - `forbidden-page.tsx` 已落地。
  - 路由测试覆盖无权限访问 `/system/users`。

- **C4 错误边界 + 收尾门禁** ✅
  - `RouteErrorPage` 已作为 TanStack Router `defaultErrorComponent`。
  - 错误页提供「重试」和「返回首页」。
  - 路由测试覆盖预览错误路由进入壳内 500 页面。

---

## 当前验证状态

- `pnpm exec tsc -b` ✅
- `pnpm lint` ✅
- `pnpm exec vitest run --reporter=dot` ✅
  - 21 个测试文件通过。
  - 120 个测试用例通过。
- `pnpm build` ✅
  - 生产构建成功。
  - `dist.zip` 已生成。
- `dist/index.html` preload 检查 ✅
  - 未匹配到 `vendor-antd`。
  - 未匹配到 `login-page`。
  - 未匹配到 `preferences-sheet`。
  - 未匹配到 `workspace-overlays`。

---

## 已知剩余事项

1. **测试噪音**
   - `admin-popup.test.tsx` 仍有 React `act(...)` warning。
   - antd Drawer 仍提示 `width` deprecated，后续可改为 `size` 或调整封装参数。

2. **Popconfirm 删除 UI 测试稳定性**
   - 曾尝试把 app-shell 用例扩成创建后删除，但当前 jsdom + antd Popconfirm 组合会卡住进程。
   - 删除能力已由 `admin-api.test.ts` 覆盖 mock CRUD，不作为当前提交阻塞项。

3. **构建体积提示**
   - `vendor-antd` 仍超过 Vite 默认 500 kB chunk 提示。
   - 当前按懒加载门禁看没有首屏 preload，不阻塞本轮。

4. **可选补强**
   - 可后续增加一个更低层的 HTTP 401 replay 集成测试，直接锁住「401 -> refresh -> 重放原请求」行为。

---

## 文件清单

### 新增文件

- `src/auth/token-refresh.ts`: token refresh 单飞队列。
- `src/components/has-permission.tsx`: 按当前会话权限渲染内容。
- `src/__tests__/auth-api.test.ts`: auth refresh API 测试。
- `src/__tests__/has-permission.test.tsx`: 权限组件测试。
- `src/__tests__/token-refresh.test.ts`: refresh 队列测试。

### 关键修改文件

- `src/components/ui/command.tsx`: 修复 CommandDialog 可访问标题结构。
- `src/pages/system-pages.tsx`: users 写操作按钮接入权限。
- `src/api/auth.ts`: AuthApi 增加 refresh。
- `src/auth/http-auth.ts`: 接入 refresh 队列。
- `src/lib/http.ts`: 401 refresh + replay 支持。
- `src/mock/auth-mock.ts`: mock refreshToken、refresh API、用户写权限。
- `src/pages/error-boundary-page.tsx`: 增加重试动作。
- `src/__tests__/router.test.tsx`: 补 403/500 路由行为测试。
- `src/__tests__/app-shell.test.tsx`: 修复全局搜索懒加载等待，保留稳定创建用户链路测试。

---

## 建议提交

提交信息建议：

```text
feat: complete admin auth permissions and crud regressions
```
