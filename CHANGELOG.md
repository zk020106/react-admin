# 更新日志

## [未发布] - 2026-06-13

### 新增功能

#### 弹窗功能完善

1. **AdminDrawer / AdminDrawerForm** - 抽屉组件
   - 从侧边滑出的抽屉弹层
   - 支持左、右、上、下四个方向
   - 带表单的抽屉封装

2. **DetailModal** - 详情展示弹窗
   - 用于只读数据展示
   - 灵活的字段配置
   - 支持自定义渲染函数
   - 提供 `useDetailModal` Hook 简化使用

3. **message** - 消息提示工具
   - success / error / info / warning / loading
   - 统一的 API 接口
   - `withMessage` 异步操作包装函数

4. **notification** - 通知提示工具
   - 带标题和描述的通知
   - 支持自定义持续时间
   - 右上角弹出

5. **confirm** - 确认对话框工具
   - `confirm()` - 普通确认对话框
   - `confirmDelete()` - 删除确认
   - `confirmBatchDelete()` - 批量删除确认
   - 返回 Promise，支持 async/await

6. **MC 组件封装**
   - `MCDrawerForm` - MC 表单抽屉
   - 简化的字段配置
   - 自动处理表单校验和提交

### 改进

- 用户管理页面集成详情弹窗
- 用户管理页面删除操作添加确认对话框
- 导出所有弹窗相关工具到统一入口

### 文件结构

```
src/components/admin/popup/
├── admin-modal.tsx           # 模态弹窗
├── admin-drawer.tsx          # 抽屉组件（新增）
├── admin-drawer-form.tsx     # 表单抽屉（新增）
├── detail-modal.tsx          # 详情弹窗（新增）
├── use-detail-modal.ts       # 详情弹窗 Hook（新增）
├── message.tsx               # 消息提示（新增）
├── notification.tsx          # 通知提示（新增）
├── confirm.tsx               # 确认对话框（新增）
├── use-popup.ts              # 弹窗 Hook
├── index.ts                  # 统一导出
└── README.md                 # 文档（新增）

src/components/mc/form/
├── mc-drawer-form.tsx        # MC 表单抽屉（新增）
└── ...

src/pages/
├── popup-demo-page.tsx       # 弹窗功能示例页面（新增）
├── user-detail-modal.tsx     # 用户详情弹窗（新增）
└── ...
```

### 示例代码

详见 `src/pages/popup-demo-page.tsx` 和 `src/components/admin/popup/README.md`
