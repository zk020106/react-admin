# 搜索表单优化 - 布局统一

## 更新内容

优化了搜索表单在 `auto` 和 `manual` 模式下的布局，使两种模式的按钮位置保持一致。

### 优化后布局

#### Auto 模式（自动搜索）
```
┌─────────────┬─────────────┬─────────────┐
│  字段1      │  字段2      │  字段3      │
└─────────────┴─────────────┴─────────────┘
[重置]
```

#### Manual 模式（手动搜索）
```
┌─────────────┬─────────────┬─────────────┐
│  字段1      │  字段2      │  字段3      │
└─────────────┴─────────────┴─────────────┘
                         [重置] [查询] [▼]
```

## 关键变化

### Auto 模式
- ✅ 重置按钮独立在字段下方
- ✅ 左对齐布局，符合视觉习惯
- ✅ 输入变化自动触发搜索

### Manual 模式
- ✅ 操作按钮独立在字段下方
- ✅ 右对齐布局，符合操作习惯
- ✅ 包含：重置、查询、展开/收起按钮

## 代码实现

```tsx
// Auto 模式：重置按钮单独一行，左对齐
{isAutoMode ? (
  <div className="mt-4 flex gap-2">
    <Button onClick={() => void handleReset()}>
      重置
    </Button>
  </div>
) : (
  // Manual 模式：操作按钮独立一行，右对齐
  <div className="mt-4 flex justify-end gap-2">
    <Button onClick={() => void handleReset()}>
      重置
    </Button>
    <Button loading={submitting} type="primary">
      查询
    </Button>
    {canCollapse && <Button>展开/收起</Button>}
  </div>
)}
```

## 使用示例

### Auto 模式

```tsx
<MCSearchForm
  mode="auto"
  fields={[
    { name: 'name', label: '名称', component: 'input', span: 8 }
  ]}
  onSearch={handleSearch}
  onReset={handleReset}
/>
```

**效果**：
- 输入变化自动搜索
- 重置按钮在下方左侧

### Manual 模式

```tsx
<MCSearchForm
  mode="manual"
  fields={[
    { name: 'name', label: '名称', component: 'input', span: 6 },
    { name: 'status', label: '状态', component: 'select', span: 6 }
  ]}
  onSearch={handleSearch}
  onReset={handleReset}
/>
```

**效果**：
- 需要点击查询按钮
- 操作按钮在下方右侧

## 适用场景

**Auto 模式**：
- 简单筛选（1-2个条件）
- 需要实时响应
- 不需要展开/收起

**Manual 模式**：
- 复杂筛选（3+个条件）
- 手动触发查询
- 支持展开/收起

## 相关文件

- `src/components/admin/form/admin-search-form.tsx` - 主要修改文件
- `src/components/mc/form/mc-search-form.tsx` - MC 组件封装

## 效果预览

参考图片4的布局效果，重置按钮现在在字段下方独立一行，布局更加清晰整洁。

