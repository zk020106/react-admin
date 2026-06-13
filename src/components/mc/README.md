# MC 组件层

MC (Minimal Component) 组件层是基于 Ant Design 的二次封装，提供更简洁的 API 和更强大的功能。

## 设计原则

### 1. **完全继承原生 API**
所有 MC 组件都完全继承对应的 Ant Design 组件的属性，零学习成本。

### 2. **渐进增强**
- 可以先使用原生 API
- 需要时再使用 MC 扩展功能
- 不破坏原有使用方式

### 3. **类型安全**
- 完整的 TypeScript 类型定义
- IDE 自动补全支持
- 泛型支持

---

## 组件列表

### MCForm - 表单组件

基于 Ant Design Form，支持 Grid 布局和响应式栅格。

```tsx
import { MCForm } from '@/components/mc'

<MCForm
  // ✅ 所有 Ant Design Form 原生属性
  layout="vertical"
  disabled={false}
  
  // 🆕 MC 扩展属性
  grid
  gutter={16}
  fields={[
    {
      component: 'input',
      name: 'username',
      label: '用户名',
      span: 12,
      xs: 24,
      md: 12
    }
  ]}
  onFinish={handleSubmit}
/>
```

**特性：**
- ✅ 完全继承 Ant Design Form API
- ✅ 响应式栅格布局（xs, sm, md, lg, xl, xxl）
- ✅ 字段配置化
- ✅ 动态表单控制

---

### MCSearchForm - 搜索表单

面向列表页的搜索表单，支持手动/自动触发模式。

```tsx
import { MCSearchForm } from '@/components/mc'

<MCSearchForm
  fields={searchFields}
  mode="manual"  // 或 "auto"
  onSearch={handleSearch}
  onReset={handleReset}
/>
```

**特性：**
- ✅ Manual 模式：显示查询按钮，按钮单独一行
- ✅ Auto 模式：值变化自动搜索，重置按钮同行
- ✅ 展开/收起功能
- ✅ 默认值支持

---

### MCTable - 表格组件

基于 Ant Design Table，集成列设置、工具栏等功能。

```tsx
import { MCTable } from '@/components/mc'

<MCTable
  // ✅ 所有 Ant Design Table 原生属性
  dataSource={users}
  loading={isLoading}
  pagination={{ pageSize: 10 }}
  rowKey="id"
  
  // 🆕 MC 扩展属性
  columns={[
    {
      title: '姓名',
      dataIndex: 'name',
      columnLabel: '姓名',  // 用于列设置面板
      width: 100
    }
  ]}
  
  // 🆕 操作列配置
  actions={[
    {
      label: '编辑',
      type: 'link',
      onClick: (record) => handleEdit(record)
    }
  ]}
  
  // 🆕 工具栏
  toolbar={{
    refresh: true,
    columnSetting: true,
    onRefresh: () => refetch()
  }}
  
  // 🆕 持久化列设置
  persistKey="users-table"
/>
```

**特性：**
- ✅ 完全继承 Ant Design Table API
- ✅ 操作列配置化
- ✅ 列设置面板（拖拽排序、显隐、固定）
- ✅ 工具栏（刷新、列设置）
- ✅ 状态持久化到 localStorage

---

### MCFormModal - 表单弹窗

表单 + Modal 的组合组件。

```tsx
import { MCFormModal } from '@/components/mc'

<MCFormModal
  open={open}
  title="新增用户"
  fields={userFields}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

---

## 列设置功能

MCTable 集成了强大的列设置功能：

### 功能列表

- **拖拽排序** - 拖动调整列显示顺序
- **显示/隐藏** - Checkbox 控制列的显示
- **左右固定** - Pin 图标固定列到左侧或右侧
- **全选/重置** - 批量操作
- **✨ 自动持久化** - 设置 `persistKey` 后自动保存到 localStorage

### 持久化配置

只需设置 `persistKey`，列设置会自动保存到 localStorage：

```tsx
<MCTable
  persistKey="users-table"  // 设置唯一的持久化键
  columns={columns}
  dataSource={data}
/>
```

**持久化内容包括：**
- ✅ 列的显示/隐藏状态
- ✅ 列的排序顺序
- ✅ 列的固定位置（左/右）

**存储键格式：** `admin-table-columns:{persistKey}`

例如：`admin-table-columns:users-table`

### 交互说明

**固定列：**
- 点击左 Pin（←）固定到左侧，再次点击取消
- 点击右 Pin（→）固定到右侧，再次点击取消
- 激活状态显示蓝色图标
- 固定的列会自动排序到对应边缘

**排序：**
- 在列设置面板中拖动列进行排序
- 固定到左侧的列会移到最左边
- 固定到右侧的列会移到最右边
- 未固定的列保持拖动后的顺序

**重置：**
- 点击"重置"按钮恢复到初始状态
- 会清除所有持久化的设置

---

## 响应式栅格

MCForm 和 MCSearchForm 支持响应式栅格布局：

| 属性 | 断点 | 说明 |
|------|------|------|
| span | 所有 | 默认占用列数 |
| xs | < 576px | 超小屏 |
| sm | ≥ 576px | 小屏 |
| md | ≥ 768px | 中屏 |
| lg | ≥ 992px | 大屏 |
| xl | ≥ 1200px | 超大屏 |
| xxl | ≥ 1600px | 超超大屏 |

```tsx
{
  component: 'input',
  name: 'name',
  label: '姓名',
  span: 24,  // 默认全宽
  xs: 24,    // 手机全宽
  sm: 12,    // 平板半宽
  md: 8,     // 中屏 1/3
  lg: 6      // 大屏 1/4
}
```

---

## 最佳实践

### 1. **使用持久化键**
为常用表格设置 `persistKey`，保存用户的列设置偏好：

```tsx
<MCTable persistKey="users-table" ... />
```

### 2. **提供列标签**
为每列提供清晰的 `columnLabel`，用于列设置面板显示：

```tsx
columns={[
  {
    title: '用户名（Username）',  // 显示在表头
    columnLabel: '用户名',         // 显示在列设置面板
    dataIndex: 'username'
  }
]}
```

### 3. **操作列配置**
使用 `actions` 配置代替手动写操作列：

```tsx
// ❌ 不推荐
columns={[
  ...
  {
    title: '操作',
    render: (record) => <Button onClick={...}>编辑</Button>
  }
]}

// ✅ 推荐
actions={[
  {
    label: '编辑',
    onClick: (record) => handleEdit(record)
  }
]}
```

---

## 文件结构

```
mc/
├── form/
│   ├── mc-form.tsx           # 表单组件
│   ├── mc-search-form.tsx    # 搜索表单
│   ├── mc-form-modal.tsx     # 表单弹窗
│   ├── field-adapter.ts      # 字段适配器
│   └── types.ts              # 类型定义
├── table/
│   ├── mc-table.tsx          # 表格组件
│   ├── types.ts              # 类型定义
│   └── utils.ts              # 工具函数
└── index.ts                  # 统一导出
```
