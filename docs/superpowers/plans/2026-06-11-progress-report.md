# 2026-06-11 路由 + antd CRUD 进度报告

## 已完成任务 ✅

### A 组：路由转正 (3/3)
- **A1 路由表与 404 页** ✅
  - 新增 `routes.tsx` 定义页面清单与路由表
  - 新增 `NotFoundPage` 壳内 404 页
  - 新增 `getAdminPageDefinition()` 按路径取页面定义
  - 路由树改为显式声明每条路由(移除 `pageRoutes.map` 循环)
  
- **A2 BaseLayout Outlet 化与守卫** ✅
  - `BaseLayout` 改为 `<Outlet />` 承载路由内容
  - 登录守卫：未认证重定向到 `/login`
  - 根路由 `/` 重定向到 `ADMIN_DEFAULT_PATH`
  - 通配路由 `$` 渲染壳内 404,不再吸附到默认页
  
- **A3 路由行为测试** ✅
  - 新增 `router.test.tsx`:根路由重定向、壳内 404、不开标签
  - 测试全过(5/5)

### B 组：antd CRUD 基建 (6/7,B5 测试未过)

- **B0 AdminConfigProvider 主题桥** ✅
  - 新增 `antd-theme.tsx`:
    - `buildAntdThemeConfig()` 由偏好派生 antd 主题
    - `isDarkPreference()` 结合系统颜色判定暗色模式
    - `AdminConfigProvider` 包裹内容区,提供主题与语言
  - 新增 `use-system-dark.ts` 订阅系统颜色方案
  - `theme/index.ts` 导出 `resolveAdminPrimaryColor()` 供桥使用
  - `LoginPage` 替换手写 ConfigProvider 为 `AdminConfigProvider`
  - 测试:`antd-theme.test.ts` 覆盖主题映射、颜色转换、明暗判定(5/5)

- **B1 SchemaForm + useAdminForm** ✅
  - 新增 `form-field-registry.tsx` 注册 schema 组件到 antd 控件
  - 新增 `schema-form.tsx`:
    - 挂载 FormApi 到 antd FormInstance
    - 按 schema 渲染表单,支持嵌套字段与校验规则
  - 新增 `use-admin-form.ts` 组合 FormApi + antd Form
  - `FormApi` 新增 `setValue()` 方法
  - 测试:`schema-form.test.tsx` 覆盖渲染、校验、提交、活值读取(4/4)
  - 测试:`form-api.test.ts` 新增活值 getter 契约测试

- **B2 AdminModal / AdminDrawer** ✅
  - 新增 `use-popup.ts`:
    - `usePopupState()` 订阅弹层状态
    - `useModalApi()` / `useDrawerApi()` 创建稳定 API 实例
  - 新增 `admin-modal.tsx`:
    - `forceRender` 支持表单实例提前挂载
    - `submitting` 映射确认按钮 loading
  - 新增 `admin-drawer.tsx`:动态 footer、placement、确认/取消按钮
  - 测试:`admin-popup.test.tsx` 覆盖打开、守卫、loading、确认回调(5/5)

- **B3 AdminTable** ✅
  - 新增 `admin-table.tsx`:统一分页、尺寸、工具栏布局
  - 测试:`admin-table.test.tsx` 覆盖列、行、工具栏渲染(2/2)

- **B4 写接口与 mutation 约定** ✅
  - `api/admin.ts`:
    - `AdminApiHttpClient` 扩展 POST/PUT/DELETE 方法
    - `createHttpAdminApi()` 新增 createUser/updateUser/deleteUser
  - `mock/admin-mock.ts`:
    - 新增 `UserInput` 类型(可编辑字段集合)
    - `mutableUsers` + `resetMockUsers()` 内存 CRUD
    - `adminMockApi` 实现 createUser/updateUser/deleteUser
  - `lib/query-client.ts` 新增 `MutationCache` 统一错误 toast
  - 新增 `admin-mutations.ts`:user CRUD mutation 配置
  - `BaseLayout` 挂载 `<Toaster />`
  - 测试:`admin-api.test.ts` 覆盖 HTTP 调用、mock CRUD(4/4)

- **B5 users 全链路 CRUD + effects 转正** 🔄 代码完成,测试未过
  - `system-pages.tsx` UsersPage 重写:
    - AdminTable 替换 shadcn Table
    - 操作列:编辑按钮 + Popconfirm 删除
    - 整页包 `<AdminConfigProvider>`
  - 新增 `user-form-modal.tsx`:
    - `useUserFormModal()` 组合 SchemaForm + AdminModal
    - 支持新增/编辑模式、表单回填、校验失败保持打开
  - 新增 `effects-pages.tsx`:
    - PopupLab 演示 Modal/Drawer API
    - SchemaFormPanel 演示表单配置
    - IframePanel 占位
  - `routes.tsx` 新增 `/effects` 路由
  - `mock/admin-mock.ts` + `mock/auth-mock.ts` 添加 effects 权限
  - **测试状态**:
    - `app-shell.test.tsx` 新增「创建删除用户」流程测试
    - **问题**:新增用户后 `findByText('测试账号')` 超时(10s),表格未更新
    - 已排查:SchemaForm/AdminModal 单测全过,怀疑 mutation 或 invalidate 未触发

### C 组:权限会话闭环 (0/4,未开始)
- C1 token 刷新单飞队列
- C2 HasPermission 组件
- C3 路由权限 + 403
- C4 错误边界 + 收尾门禁

---

## 当前卡点:B5 测试

### 症状
`app-shell.test.tsx` 中「创建删除用户」测试失败:
1. 点击「新增用户」→ 填表 → 点确定
2. `expect(await screen.findByText('测试账号', undefined, { timeout: 10000 })).toBeInTheDocument()` 超时
3. 表格未刷新,新增用户未出现

### 已排查
- ✅ SchemaForm 单测过(提交、校验、活值读取)
- ✅ AdminModal 单测过(打开、确认、loading)
- ✅ AdminTable 单测过(列渲染)
- ✅ admin-api 单测过(mock CRUD 能新增用户)
- ✅ TypeScript 编译通过
- ✅ Lint 通过

### 怀疑点
1. **mutation 未触发**:
   - `useUserFormModal` 的 `onSubmit` 是否被调用?
   - `createMutation.mutateAsync()` 是否真的执行?
   
2. **invalidate 未生效**:
   - `userMutations.create().onSuccess` 的 `invalidateQueries` 是否触发?
   - `systemKeys.users()` 的 queryKey 是否匹配?

3. **测试环境差异**:
   - QueryClient 是否在测试间正确隔离?
   - 需要 `queryClient.clear()` 在 afterEach?

### 下一步调试方案
1. **加断点日志**:在 `useUserFormModal` 的 `handleConfirm` 和 mutation 回调里加 `console.log`
2. **简化测试**:单独测「点新增按钮→弹窗打开」,逐步加填表、提交、验证
3. **检查 queryKey**:打印 `systemKeys.users()` 和 invalidate 的 queryKey 是否一致
4. **测试隔离**:在 `afterEach` 加 `queryClient.clear()` + `resetMockUsers()`

---

## 代码规范状态 ✅
- TypeScript:`pnpm exec tsc -b` 通过
- Lint:`pnpm lint` 通过
- 测试覆盖:107/109 通过(2 个 app-shell 失败)

---

## 技术债务
1. **懒加载测试超时**:system-pages 含 antd,首次转换在测试环境耗时 18-30 秒,已加 `{ timeout: 30000 }` 和 `{ timeout: 45000 }` workaround
2. **空闲预热竞态**:BaseLayout 的 `requestIdleCallback` 预热弹层在测试环境可能与 teardown 冲突,已加 `MODE === 'test'` 跳过
3. **Popconfirm 按钮选择器**:自定义 `okText="确认删除"` 避免与表单弹窗「确定」按钮冲突

---

## 后续工作优先级

### 立即修复(阻塞 B5)
1. 调试「新增用户」流程,定位 mutation/invalidate 失效原因
2. 修复 `searches workspace users` 回归(大概率是上个测试污染)

### B5 完成后
3. 运行完整测试套件确认无回归
4. 提交 B5 commit

### C 组实施
5. C1:实现 token 刷新单飞队列
6. C2:实现 HasPermission 组件
7. C3:实现路由权限守卫 + 403 页
8. C4:实现错误边界 + 收尾检查

---

## 文件清单

### 新增文件
- `src/router/routes.tsx`:路由表定义
- `src/pages/not-found-page.tsx`:壳内 404
- `src/hooks/use-system-dark.ts`:系统颜色方案订阅
- `src/theme/antd-theme.tsx`:antd 主题桥
- `src/components/admin/form/form-field-registry.tsx`:schema 组件注册
- `src/components/admin/form/schema-form.tsx`:schema 驱动表单
- `src/components/admin/form/use-admin-form.ts`:FormApi + antd Form 组合
- `src/components/admin/popup/use-popup.ts`:弹层状态钩子
- `src/components/admin/popup/admin-modal.tsx`:PopupApi 驱动模态弹窗
- `src/components/admin/popup/admin-drawer.tsx`:PopupApi 驱动抽屉
- `src/components/admin/table/admin-table.tsx`:标准表格
- `src/pages/admin-mutations.ts`:mutation 配置
- `src/pages/user-form-modal.tsx`:用户表单弹窗
- `src/pages/effects-pages.tsx`:组件能力演示页
- `src/__tests__/router.test.tsx`:路由行为测试
- `src/__tests__/antd-theme.test.ts`:主题桥测试
- `src/__tests__/schema-form.test.tsx`:表单测试
- `src/__tests__/admin-popup.test.tsx`:弹层测试
- `src/__tests__/admin-table.test.tsx`:表格测试

### 修改文件
- `src/router/index.tsx`:显式路由树、根重定向、通配路由
- `src/layouts/base-layout.tsx`:Outlet 化、登录守卫、Toaster 挂载、测试环境跳过预热
- `src/layouts/page-surface.tsx`:注释说明 antd 不在此包裹
- `src/pages/login/LoginPage.tsx`:换用 AdminConfigProvider、use-system-dark
- `src/pages/system-pages.tsx`:UsersPage 重写(AdminTable + CRUD)
- `src/api/admin.ts`:扩展写方法、UserInput 类型
- `src/mock/admin-mock.ts`:UserInput、mutableUsers、CRUD 实现、effects 菜单
- `src/mock/auth-mock.ts`:effects 权限
- `src/lib/query-client.ts`:MutationCache 错误 toast
- `src/theme/index.ts`:导出 resolveAdminPrimaryColor
- `src/utils/form-api.ts`:新增 setValue 方法
- `src/__tests__/admin-api.test.ts`:扩展 CRUD 测试
- `src/__tests__/app-shell.test.tsx`:新增 CRUD 流程测试、QueryClient.clear()、resetMockUsers()
- `src/__tests__/form-api.test.ts`:新增活值 getter 测试

### 删除文件
- `src/__tests__/router.test.ts`(旧版,已被 .tsx 替换)
- `docs/superpowers/plans/2026-06-10-framework-extension-plan.md`(已执行完成)
