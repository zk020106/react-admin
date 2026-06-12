# 后台基础组件拓展计划

## 背景

当前项目的后台壳子已经具备路由、布局、登录、权限、主题、标签页、Mock 数据、请求缓存和测试基线，但表格、表单、弹窗、CRUD 数据层仍偏薄。下一步重点不是继续堆业务页面，而是补齐可复用的后台基础组件层。

参考目标是类似 `gi-component` 的后台生产力封装思路：把常见后台模式沉淀为表格、查询表单、配置表单、页面布局、弹窗表单、选择弹窗、CRUD API 和 CRUD Hook。

## 功能清单

| 模块              | 功能                                                                             |
| ----------------- | -------------------------------------------------------------------------------- |
| `AdminTable`      | 表格列配置、分页、loading、toolbar、刷新、密度、列显隐、列固定、批量选择、操作列 |
| `AdminSearchForm` | 查询表单、重置、展开/收起、响应式栅格、默认值、提交参数转换                      |
| `AdminForm`       | Schema 表单、字段类型注册、校验、禁用/隐藏、默认值、回填、异步 options、字段联动 |
| `AdminFormModal`  | 新增/编辑弹窗、自动回填、提交 loading、校验失败不关闭、提交成功关闭              |
| `AdminFormDrawer` | 详情/编辑抽屉，逻辑与 `AdminFormModal` 保持一致                                  |
| `AdminPageLayout` | 搜索区、工具栏、内容区、左树右表布局                                             |
| `useCrudTable`    | 查询参数、分页、刷新、重置、TanStack Query 封装                                  |
| `createCrudApi`   | 标准接口：列表、详情、新增、编辑、删除、批量删除                                 |
| `SelectDialog`    | 选择用户、选择角色、选择部门等通用选择弹窗                                       |
| 示例页面          | 用用户管理、字典管理或操作日志验证整套组件                                       |

## 实施计划

### 第 1 阶段：表格和查询表单

目标：让列表页代码明显减少，先解决最高频的查询和表格场景。

状态：已完成首轮落地。

任务：

1. 增强 `src/components/admin/table/admin-table.tsx`
   - 支持标准 `columns` 配置。
   - 支持 `toolbar` 工具栏。
   - 支持 `rowSelection` 批量选择。
   - 支持分页默认值和分页变更事件。
   - 支持刷新入口。
   - 支持表格尺寸切换。
   - 支持列显隐。

2. 新增 `src/components/admin/form/admin-search-form.tsx`
   - 基于现有 `SchemaForm` 和字段注册机制。
   - 支持搜索、重置、展开、收起。
   - 支持响应式栅格布局。
   - 支持默认值。
   - 支持提交前参数转换。

3. 改造一个现有页面验证
   - 优先选择 `UsersPage`。
   - 将页面内手写搜索控件迁移到 `AdminSearchForm`。
   - 将表格迁移到增强后的 `AdminTable`。

已落地内容：

- `AdminTable` 已支持工具栏、左侧工具栏、刷新入口、密度切换、列显隐和默认分页。
- `AdminSearchForm` 已支持 schema 查询项、默认值、搜索、重置、展开/收起和空值清理。
- `AdminFormModal` 已支持 schema 表单弹窗、初始值回填、校验、提交 loading、提交成功关闭和失败保持。
- `UsersPage` 已迁移到 `AdminSearchForm`、增强版 `AdminTable` 和 `AdminFormModal`。
- `SchemaForm` 已补充 grid 布局、字段隐藏、字段禁用、help、extra 和更多字段类型。

验收标准：

- `UsersPage` 的搜索区和表格区由通用组件承载。
- 查询、重置、分页、loading 状态工作正常。
- 原有用户管理测试通过。

首轮验证：

- `tsc -b --pretty false` 通过。
- `oxlint --type-aware` 通过。
- `oxfmt --check` 通过。
- `admin-table`、`admin-search-form`、`admin-form-modal`、`schema-form`、`antd-theme` 定向测试通过。

### 第 1 阶段组件用法

### MC 组件层

新增业务侧组件命名使用 `MC` 前缀，代表莫愁组件层。`MCTable`、`MCForm`、
`MCSearchForm` 和 `MCFormModal` 的能力参考 `gi-component` 的 table/form 思路，但对外属性采用 React 和
Ant Design 习惯命名，例如 `dataSource`、`fields`、`name`、`component`、
`componentProps` 和 `control`。现有 `Admin*` 组件继续作为底层实现和兼容层保留。

MC 组件层已完成基础封装：
- ✅ `MCTable` - 表格组件，支持工具栏、刷新、列设置、操作列等
- ✅ `MCForm` - 表单组件，基于 fields 配置，支持 control 动态控制
- ✅ `MCSearchForm` - 搜索表单组件，支持展开/收起、重置等
- ✅ `MCFormModal` - 表单弹窗组件，支持新增/编辑模式、校验、提交 loading

#### MC 组件使用示例

`MCTable` 示例：

```tsx
import { MCTable } from '@/components/mc'
import type { MCTableColumn } from '@/components/mc'

<MCTable<UserRecord>
  columns={columns}
  dataSource={users}
  loading={isLoading}
  onRefresh={async () => await refetch()}
  rowKey="id"
  tools={{ columns: true, density: true, refresh: true }}
  toolbar={<Button type="primary">新增用户</Button>}
/>
```

`MCSearchForm` 示例：

```tsx
import { MCSearchForm } from '@/components/mc'
import type { MCFormField } from '@/components/mc'

const searchFields: MCFormField[] = [
  { component: 'input', label: '关键词', name: 'keyword' },
  {
    component: 'select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'enabled' },
        { label: '禁用', value: 'disabled' }
      ]
    },
    label: '状态',
    name: 'status'
  }
]

<MCSearchForm
  defaultValues={{ keyword: '', status: '' }}
  fields={searchFields}
  onReset={() => setFilters({ keyword: '', status: '' })}
  onSearch={values => setFilters(values)}
/>
```

`MCFormModal` 示例：

```tsx
import { MCFormModal } from '@/components/mc'
import type { MCFormField } from '@/components/mc'

const formFields: MCFormField[] = [
  { component: 'input', label: '姓名', name: 'name', required: true },
  { component: 'input', label: '邮箱', name: 'email', required: '请输入有效的邮箱' },
  {
    component: 'select',
    componentProps: {
      options: [
        { label: '管理员', value: 'admin' },
        { label: '普通用户', value: 'user' }
      ]
    },
    label: '角色',
    name: 'role',
    required: true
  }
]

<MCFormModal<UserInput>
  fields={formFields}
  initialValues={editingUser}
  onCancel={() => setOpen(false)}
  onSubmit={async input => {
    await saveUser(input)
  }}
  open={open}
  title={editingUser ? '编辑用户' : '新增用户'}
/>
```

动态控制字段状态（通过 `control` 属性）：

```tsx
<MCFormModal<UserInput>
  control={{
    email: { disabled: true },    // 禁用邮箱字段
    role: { hidden: true }         // 隐藏角色字段
  }}
  fields={formFields}
  initialValues={editingUser}
  onCancel={() => setOpen(false)}
  onSubmit={async input => {
    await saveUser(input)
  }}
  open={open}
  title="编辑用户"
/>
```

#### Admin 组件层示例（兼容层）

`AdminSearchForm` 示例：

```tsx
<AdminSearchForm
  defaultValues={{ keyword: '', status: '全部' }}
  onReset={() => setFilters({ keyword: '', status: '全部' })}
  onSearch={values =>
    setFilters({
      keyword: typeof values.keyword === 'string' ? values.keyword : '',
      status: typeof values.status === 'string' ? values.status : '全部'
    })
  }
  schema={searchSchema}
/>
```

`AdminTable` 示例：

```tsx
<AdminTable<UserRecord>
  columns={columns}
  dataSource={filteredUsers}
  loading={isLoading}
  onRefresh={async () => {
    await usersQuery.refetch()
  }}
  rowKey="id"
  tools={{ columns: true, density: true, refresh: true }}
  toolbar={<Button type="primary">新增用户</Button>}
/>
```

`AdminFormModal` 示例：

```tsx
<AdminFormModal<UserInput>
  initialValues={editingUser}
  onCancel={() => setOpen(false)}
  onSubmit={async input => {
    await saveUser(input)
  }}
  open={open}
  schema={userFormSchema}
  title={editingUser ? '编辑用户' : '新增用户'}
/>
```

### 第 2 阶段：配置表单增强

目标：让新增、编辑、详情表单可以通过 Schema 稳定配置。

任务：

1. 增强 `SchemaForm`
   - 支持字段 `hidden`。
   - 支持字段 `disabled`。
   - 支持字段 `span`。
   - 支持字段 `help`。
   - 支持字段 `extra`。
   - 支持字段分组。

2. 扩展字段类型
   - `textarea`
   - `number`
   - `radio`
   - `date`
   - `date-range`
   - `tree-select`
   - `password`
   - `switch`
   - `checkbox`

3. 抽出 `AdminForm`
   - 组合 `SchemaForm` 和 `useAdminForm`。
   - 对外提供 `submit`、`reset`、`setValues`、`getValues`。
   - 保持与 Ant Design Form 能力兼容。

验收标准：

- 用户新增/编辑表单不再手写字段 JSX。
- 表单支持回填、校验、重置、禁用和隐藏。
- Schema 变更可以驱动表单渲染变化。

### 第 3 阶段：弹窗表单和抽屉表单

目标：新增、编辑、详情流程标准化。

任务：

1. 新增 `src/components/admin/form/admin-form-modal.tsx`
   - 支持 `schema`。
   - 支持 `title`。
   - 支持 `open`。
   - 支持 `initialValues`。
   - 支持 `loading`。
   - 支持 `onSubmit`。
   - 支持 `onCancel`。

2. 新增 `src/components/admin/form/admin-form-drawer.tsx`
   - 适合复杂编辑和详情展示。
   - 复用 `AdminForm` 提交和校验逻辑。

3. 替换 `src/pages/user-form-modal.tsx`
   - 将用户新增/编辑改造成标准样板。
   - 保留现有 `ModalApi` 或在新封装中兼容。

验收标准：

- 新增和编辑只需要传入 Schema、初始值和提交函数。
- 校验失败弹窗保持打开。
- 提交中按钮进入 loading。
- 提交成功后关闭并重置表单。

### 第 4 阶段：CRUD 数据层

目标：页面只关心业务字段，不重复写 Query 和 Mutation 模板代码。

任务：

1. 新增 `src/lib/create-crud-api.ts`
   - `list`
   - `detail`
   - `create`
   - `update`
   - `remove`
   - `batchRemove`

2. 新增 `src/components/admin/crud/use-crud-table.ts`
   - 管理查询参数。
   - 管理分页状态。
   - 管理刷新。
   - 管理重置。
   - 对接 TanStack Query。

3. 新增 `src/components/admin/crud/use-crud-mutations.ts`
   - 管理新增、编辑、删除。
   - 成功后刷新列表缓存。
   - 失败提示继续走全局 MutationCache。

验收标准：

- 标准 CRUD 页面不需要重复写分页、刷新、重置、缓存失效逻辑。
- Mock API 和真实 HTTP API 可以共用同一套接口契约。

### 第 5 阶段：标准业务样板

目标：用真实页面验证组件体系，形成可复制模板。

推荐页面：字典管理。

功能：

- 查询表单。
- 表格。
- 新增。
- 编辑。
- 删除。
- 批量删除。
- 状态切换。
- 权限按钮。
- Mock 数据。
- 单元测试。
- README 使用示例。

验收标准：

- 字典管理页面可以作为新增业务模块的复制模板。
- 页面层代码主要由配置、API 和少量业务逻辑组成。
- 新增同类模块时不需要重新写表格、查询、弹窗表单和 CRUD 状态管理。

## 推荐执行顺序

第一轮只做以下内容：

1. 增强 `AdminTable`。
2. 新增 `AdminSearchForm`。
3. 新增 `AdminFormModal`。
4. 用 `UsersPage` 验证。

不要一开始就做过大的 `CrudPage` 封装。先把表格、查询表单、弹窗表单三个底层组件打稳，再抽 `useCrudTable` 和 `createCrudApi`。

## 参考项目

- `gi-component`: https://github.com/lin-97/gi-component
- 参考方向：表格、配置表单、页面布局、函数弹窗、选择弹窗、CRUD API 工厂和表格 Hook。
