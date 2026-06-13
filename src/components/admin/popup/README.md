# 弹窗组件文档

本目录提供了一套完整的弹窗解决方案，包括模态弹窗、抽屉、消息提示、通知和确认对话框。

## 组件列表

### 1. AdminModal - 模态弹窗

基于 `ModalApi` 的模态弹窗组件。

```tsx
import { AdminModal } from '@/components/admin/popup'
import { ModalApi } from '@/utils/popup-api'

const modalApi = new ModalApi({ title: '弹窗标题' })

<AdminModal
  api={modalApi}
  onConfirm={() => console.log('确认')}
  onCancel={() => console.log('取消')}
>
  弹窗内容
</AdminModal>
```

### 2. AdminFormModal - 表单弹窗

带表单的模态弹窗，自动处理表单校验和提交。

```tsx
import { AdminFormModal } from '@/components/admin/popup'

<AdminFormModal
  open={open}
  title="新增用户"
  schema={formSchema}
  initialValues={initialValues}
  onSubmit={async (values) => {
    await createUser(values)
  }}
  onCancel={() => setOpen(false)}
/>
```

### 3. AdminDrawer - 抽屉弹层

从侧边滑出的抽屉组件。

```tsx
import { AdminDrawer } from '@/components/admin/popup'
import { DrawerApi } from '@/utils/popup-api'

const drawerApi = new DrawerApi({ 
  title: '抽屉标题',
  placement: 'right' 
})

<AdminDrawer
  api={drawerApi}
  width={480}
  onConfirm={() => console.log('确认')}
>
  抽屉内容
</AdminDrawer>
```

### 4. AdminDrawerForm - 表单抽屉

带表单的抽屉组件。

```tsx
import { AdminDrawerForm } from '@/components/admin/popup'

<AdminDrawerForm
  open={open}
  title="编辑信息"
  placement="right"
  width={480}
  schema={formSchema}
  initialValues={initialValues}
  onSubmit={async (values) => {
    await updateData(values)
  }}
  onCancel={() => setOpen(false)}
/>
```

### 5. DetailModal - 详情弹窗

用于展示只读数据的详情弹窗。

```tsx
import { useDetailModal } from '@/components/admin/popup'

const detailModal = useDetailModal({
  title: '用户详情',
  fields: [
    { label: '姓名', value: 'name' },
    { label: '邮箱', value: 'email' },
    { 
      label: '状态', 
      render: (value) => <Tag>{value}</Tag>,
      value: 'status' 
    }
  ]
})

// 使用
detailModal.open(userData)

// 在组件中渲染
{detailModal.modal}
```

### 6. message - 消息提示

轻量级的全局提示，3秒后自动消失。

```tsx
import { message } from '@/components/admin/popup'

message.success('操作成功')
message.error('操作失败')
message.info('提示信息')
message.warning('警告信息')
message.loading('加载中...')
```

**异步操作包装：**

```tsx
import { withMessage } from '@/components/admin/popup'

await withMessage(
  apiCall(),
  {
    loading: '提交中...',
    success: '提交成功',
    error: '提交失败'
  }
)
```

### 7. notification - 通知提示

带标题和描述的全局通知，适合包含更多信息的场景。

```tsx
import { notification } from '@/components/admin/popup'

notification.success({
  title: '操作成功',
  description: '数据已成功保存到服务器',
  duration: 4.5
})

notification.error({
  title: '操作失败',
  description: '网络连接失败，请稍后重试'
})
```

### 8. confirm - 确认对话框

用于需要用户确认的操作。

```tsx
import { confirm, confirmDelete, confirmBatchDelete } from '@/components/admin/popup'

// 普通确认
const result = await confirm({
  title: '确认操作',
  content: '确定要执行此操作吗？',
  okText: '确定',
  cancelText: '取消'
})

// 删除确认
const confirmed = await confirmDelete('确认删除', '删除后无法恢复')
if (confirmed) {
  await deleteRecord()
}

// 批量删除确认
const batchConfirmed = await confirmBatchDelete(5)
if (batchConfirmed) {
  await batchDelete()
}
```

## MC 组件封装

为了简化使用，提供了 MC 系列的高级封装：

### MCFormModal

```tsx
import { MCFormModal } from '@/components/mc'

<MCFormModal
  open={open}
  title="新增用户"
  fields={[
    { name: 'name', label: '姓名', component: 'input', required: true },
    { name: 'email', label: '邮箱', component: 'input', required: true }
  ]}
  onSubmit={async (values) => {
    await createUser(values)
  }}
  onCancel={() => setOpen(false)}
/>
```

### MCDrawerForm

```tsx
import { MCDrawerForm } from '@/components/mc'

<MCDrawerForm
  open={open}
  title="编辑用户"
  placement="right"
  width={480}
  fields={[
    { name: 'name', label: '姓名', component: 'input', required: true },
    { name: 'email', label: '邮箱', component: 'input', required: true }
  ]}
  onSubmit={async (values) => {
    await updateUser(values)
  }}
  onCancel={() => setOpen(false)}
/>
```

## 使用示例

### 完整的增删改查示例

```tsx
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from 'antd'
import { 
  confirmDelete, 
  useDetailModal,
  message 
} from '@/components/admin/popup'
import { MCFormModal, MCTable } from '@/components/mc'

export function UserManagementPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  
  const usersQuery = useQuery({ 
    queryKey: ['users'], 
    queryFn: fetchUsers 
  })
  
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success('创建成功')
      setModalOpen(false)
      usersQuery.refetch()
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('删除成功')
      usersQuery.refetch()
    }
  })
  
  const detailModal = useDetailModal({
    title: '用户详情',
    fields: [
      { label: '姓名', value: 'name' },
      { label: '邮箱', value: 'email' }
    ]
  })
  
  const handleDelete = async (record) => {
    const confirmed = await confirmDelete(
      '确认删除', 
      `确定要删除用户"${record.name}"吗？`
    )
    if (confirmed) {
      await deleteMutation.mutateAsync(record.id)
    }
  }
  
  return (
    <>
      <Button onClick={() => setModalOpen(true)}>新增</Button>
      
      <MCTable
        dataSource={usersQuery.data}
        columns={columns}
        actions={[
          { label: '详情', onClick: detailModal.open },
          { label: '编辑', onClick: (record) => {
            setEditing(record)
            setModalOpen(true)
          }},
          { label: '删除', onClick: handleDelete, danger: true }
        ]}
      />
      
      <MCFormModal
        open={modalOpen}
        title={editing ? '编辑用户' : '新增用户'}
        fields={formFields}
        initialValues={editing}
        onSubmit={(values) => createMutation.mutateAsync(values)}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />
      
      {detailModal.modal}
    </>
  )
}
```

## 注意事项

1. **ModalApi / DrawerApi**: 使用 `useModalApi` 或 `useDrawerApi` Hook 创建稳定的 API 实例
2. **表单重置**: 表单弹窗会在提交成功后自动重置表单
3. **异步提交**: `onSubmit` 支持异步函数，提交期间按钮会显示 loading 状态
4. **确认对话框**: 返回 Promise<boolean>，可以用 async/await 等待用户操作
5. **消息提示**: message 和 notification 会自动销毁，无需手动清理

## API 文档

详细的 API 文档请参考各组件的 TypeScript 类型定义。
