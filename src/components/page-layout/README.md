# PageLayout 组件

可折叠、可拖动调整宽度的页面布局组件，参考 Vue 版本实现。

## 🎯 核心特性

1. **左侧面板折叠** - 点击按钮展开/收起
2. **拖动调整宽度** - 拖动分割线调整左侧面板宽度
3. **响应式自动折叠** - 小屏幕自动折叠左侧
4. **平滑动画** - 300ms 过渡动画
5. **灵活插槽** - 支持 left、header、toolbar、children

---

## 📦 基本用法

```tsx
import { PageLayout } from '@/components/page-layout'

<PageLayout
  // 左侧面板
  left={<OrgTree />}
  
  // 右侧头部（可选）
  header={<h1>用户管理</h1>}
  
  // 右侧工具栏（可选）
  toolbar={
    <>
      <Button>新增</Button>
      <Button>导出</Button>
    </>
  }
  
  // 主内容区
>
  <SearchForm />
  <Table />
</PageLayout>
```

---

## 📋 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `left` | ReactNode | - | 左侧面板内容 |
| `header` | ReactNode | - | 右侧头部内容 |
| `toolbar` | ReactNode | - | 右侧工具栏内容 |
| `children` | ReactNode | **必需** | 主内容区 |
| `leftWidth` | number | 270 | 左侧面板默认宽度（px）|
| `collapsible` | boolean | true | 是否启用折叠功能 |
| `autoCollapse` | boolean | false | 是否启用自动折叠（响应式）|
| `collapseBreakpoint` | number | 850 | 自动折叠断点（px）|
| `resizable` | boolean | true | 是否启用拖动调整宽度 |
| `bordered` | boolean | false | 是否显示边框 |
| `leftStyle` | CSSProperties | - | 左侧面板自定义样式 |
| `headerStyle` | CSSProperties | - | 头部自定义样式 |
| `toolbarStyle` | CSSProperties | - | 工具栏自定义样式 |
| `bodyStyle` | CSSProperties | - | 主内容区自定义样式 |

---

## 🎨 布局结构

```
┌─────────────────────────────────────────┐
│  PageLayout (100% 高度)                  │
├──────────────┬──────────────────────────┤
│              │ ← 折叠按钮                │
│  Left        │  Right                    │
│  Panel       │  ┌────────────────────┐  │
│              │  │ Header (可选)      │  │
│  可折叠       │  ├────────────────────┤  │
│  可拖动       │  │ Toolbar (可选)     │  │
│  270px       │  ├────────────────────┤  │
│  默认         │  │ Children (主内容)  │  │
│              │  │                    │  │
└──────────────┴──┴────────────────────┴──┘
             ↑
        可拖动分割线
```

---

## 💡 使用场景

### 1. **带组织树的管理页面**

```tsx
<PageLayout
  left={
    <>
      <Input placeholder="搜索" />
      <Tree treeData={orgData} />
    </>
  }
  toolbar={
    <>
      <Button type="primary">新增</Button>
      <Button>导出</Button>
    </>
  }
>
  <SearchForm />
  <Table />
</PageLayout>
```

### 2. **带导航的列表页面**

```tsx
<PageLayout
  left={<Menu items={menuItems} />}
  header={<Breadcrumb />}
>
  <Content />
</PageLayout>
```

### 3. **响应式布局**

```tsx
<PageLayout
  left={<Sidebar />}
  autoCollapse              // 启用自动折叠
  collapseBreakpoint={1024} // 小于 1024px 自动折叠
>
  <MainContent />
</PageLayout>
```

---

## ⚙️ 功能详解

### 1. **折叠功能**

- **手动折叠** - 点击左侧中间的折叠按钮
- **动画过渡** - 300ms 平滑动画
- **状态保持** - 折叠后左侧面板宽度为 0

```tsx
<PageLayout
  collapsible={true}  // 启用折叠按钮
  left={<Tree />}
>
  ...
</PageLayout>
```

### 2. **拖动调整宽度**

- **拖动分割线** - 鼠标拖动调整左侧宽度
- **宽度限制** - 最小 200px，最大 600px
- **视觉反馈** - 拖动时显示蓝色高亮

```tsx
<PageLayout
  resizable={true}  // 启用拖动调整
  leftWidth={300}   // 初始宽度
  left={<Tree />}
>
  ...
</PageLayout>
```

### 3. **响应式自动折叠**

- **断点触发** - 窗口宽度小于断点时自动折叠
- **动态监听** - 监听窗口 resize 事件
- **平滑过渡** - 自动折叠也有动画

```tsx
<PageLayout
  autoCollapse={true}       // 启用自动折叠
  collapseBreakpoint={1024} // 断点 1024px
  left={<Tree />}
>
  ...
</PageLayout>
```

---

## 🎨 样式定制

### 自定义样式

```tsx
<PageLayout
  left={<Tree />}
  leftStyle={{
    backgroundColor: '#f5f5f5',
    padding: '20px'
  }}
  headerStyle={{
    borderBottom: '2px solid #1890ff'
  }}
  bodyStyle={{
    padding: '24px'
  }}
>
  ...
</PageLayout>
```

### 自定义边框

```tsx
<PageLayout
  bordered={true}  // 显示外边框
  left={<Tree />}
>
  ...
</PageLayout>
```

---

## 🔥 实际案例

### 用户管理页面

```tsx
export function UsersPage() {
  return (
    <PageLayout
      // 左侧：组织树
      left={
        <div className="rounded-lg border bg-card p-4">
          <Input placeholder="搜索部门" />
          <Tree treeData={orgTreeData} />
        </div>
      }
      
      // 工具栏：操作按钮
      toolbar={
        <>
          <Button type="primary">新增</Button>
          <Button>导入</Button>
        </>
      }
      
      // 配置
      leftWidth={280}
      autoCollapse
      collapseBreakpoint={1024}
      resizable
    >
      {/* 主内容：搜索 + 表格 */}
      <MCSearchForm fields={searchFields} />
      <MCTable columns={columns} dataSource={users} />
    </PageLayout>
  )
}
```

---

## 📊 与 Vue 版本对比

| 特性 | Vue 版本 | React 版本 |
|------|---------|-----------|
| 框架 | Vue 3 + Element Plus | React + Tailwind |
| 左侧折叠 | ✅ ElSplitter | ✅ 自定义实现 |
| 拖动调整 | ✅ ElSplitter | ✅ 原生拖动 |
| 自动折叠 | ✅ useAutoCollapse | ✅ useEffect + resize |
| 动画 | ✅ 300ms | ✅ 300ms |
| 插槽 | ✅ 4 个 slot | ✅ 4 个 prop |
| BEM 命名 | ✅ | ✅ Tailwind classes |

---

## ⚠️ 注意事项

1. **高度设置** - PageLayout 默认 `h-full`，确保父容器有明确高度
2. **宽度限制** - 拖动宽度限制在 200px ~ 600px
3. **响应式断点** - 默认 850px，可根据项目调整
4. **动画性能** - 使用 CSS transition，性能良好

---

## 🚀 未来增强

- [ ] 左侧宽度持久化到 localStorage
- [ ] 支持右侧面板
- [ ] 支持上下分割
- [ ] 键盘快捷键（如 Ctrl+B 切换折叠）
- [ ] 更多预设布局模板
