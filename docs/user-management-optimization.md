# 用户管理页面优化

## 更新内容

根据参考图片，对用户管理页面进行了以下优化：

### 1. 弹窗改为抽屉
- ✅ 将详情弹窗改为右侧抽屉展示
- ✅ 将新增/编辑弹窗改为右侧抽屉（宽度 480px）
- ✅ 优化用户体验，符合后台管理系统习惯

### 2. 表单字段优化
- ✅ **部门选择**：从输入框改为下拉选择框
  - 包含：平台部、研发部、产品部、数据部、UI部、安全部、运营部、财务部、人事部、运维部
- ✅ **角色选择**：从输入框改为下拉选择框
  - 包含：超级管理员、管理员、普通用户、访客
- ✅ **性别选择**：单选按钮组（男/女/未知）
- ✅ **状态控制**：Switch 开关（启用/停用）
- ✅ **描述字段**：多行文本域，支持字符计数（最多200字）

### 3. 表单字段列表

```typescript
[
  { label: '昵称', component: 'input', required: true },
  { label: '用户名', component: 'input', required: true },
  { label: '密码', component: 'input', type: 'password', required: true },
  { label: '手机号码', component: 'input' },
  { label: '邮箱', component: 'input', validation: 'email' },
  { label: '性别', component: 'radio-group', options: ['男', '女', '未知'] },
  { label: '所属部门', component: 'select', required: true },
  { label: '角色', component: 'select', required: true },
  { label: '描述', component: 'textarea', maxLength: 200 },
  { label: '状态', component: 'switch' }
]
```

### 4. 详情抽屉字段

使用 Ant Design 的 Descriptions 组件展示：
- ID
- 用户名
- 昵称
- 性别
- 手机号
- 邮箱
- 所属部门
- 角色
- 状态（Tag 展示）
- 创建人
- 创建时间
- 修改人
- 修改时间
- 描述

## 文件变更

### 新增文件
- `src/pages/user-form-drawer.tsx` - 用户表单抽屉
- `src/pages/user-detail-drawer.tsx` - 用户详情抽屉

### 修改文件
- `src/pages/system/users-page.tsx` - 引入新的抽屉组件

### 废弃文件（可选删除）
- `src/pages/user-form-modal.tsx` - 旧的弹窗组件
- `src/pages/user-detail-modal.tsx` - 旧的详情弹窗

## 使用示例

```tsx
import { useUserFormDrawer } from '@/pages/user-form-drawer'
import { useUserDetailDrawer } from '@/pages/user-detail-drawer'

export function UsersPage() {
  const { drawer: formDrawer, openCreate, openEdit } = useUserFormDrawer({
    onSubmit: async (input, editing) => {
      // 提交逻辑
    }
  })
  
  const { drawer: detailDrawer, open: openDetail } = useUserDetailDrawer()
  
  return (
    <>
      {/* 页面内容 */}
      {formDrawer}
      {detailDrawer}
    </>
  )
}
```

## 效果对比

### 优化前
- 使用 Modal 弹窗
- 部门和角色使用输入框

### 优化后
- 使用 Drawer 抽屉（右侧滑出）
- 部门和角色使用下拉选择框
- 增加字段：用户名、密码、性别、描述
- 状态使用 Switch 开关

## 注意事项

1. **密码字段**：新增时必填，编辑时可选（实际项目中可能需要单独的修改密码功能）
2. **部门和角色选项**：当前为硬编码，实际项目中应从后端接口获取
3. **状态值**：Switch 的 true/false 会映射到"启用"/"停用"
4. **创建人/修改人**：详情中暂时硬编码，需要后端提供实际数据

## 下一步建议

1. 将部门和角色选项改为从后端动态获取
2. 增加密码强度校验
3. 增加手机号格式校验
4. 考虑增加头像上传功能
5. 优化详情页面的布局和样式
