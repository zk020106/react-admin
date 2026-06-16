import { useMemo, useState, type ReactNode } from 'react'

import { MCFormModal } from '@/components/mc'
import type { UserInput, UserRecord } from '@/mock/admin-mock'
import type { FormSchema } from '@/types/admin'

// 用户表单的字段清单：新增与编辑共用，默认值兜底下拉项。
const USER_FORM_FIELDS: FormSchema[] = [
  {
    component: 'input',
    fieldName: 'name',
    label: '姓名',
    rules: [{ message: '请输入姓名', required: true }]
  },
  {
    component: 'input',
    fieldName: 'email',
    label: '邮箱',
    rules: [
      { message: '请输入邮箱', required: true },
      { message: '邮箱格式不正确', type: 'email' }
    ]
  },
  {
    component: 'input',
    fieldName: 'role',
    label: '角色',
    rules: [{ message: '请输入角色', required: true }]
  },
  {
    component: 'input',
    fieldName: 'department',
    label: '部门',
    rules: [{ message: '请输入部门', required: true }]
  },
  {
    component: 'select',
    componentProps: { options: [{ value: '启用' }, { value: '复核中' }, { value: '停用' }] },
    defaultValue: '启用',
    fieldName: 'status',
    label: '状态'
  },
  {
    component: 'select',
    componentProps: { options: [{ value: '低' }, { value: '中' }, { value: '高' }] },
    defaultValue: '低',
    fieldName: 'riskLevel',
    label: '风险等级'
  }
]

export interface UseUserFormModalResult {
  /** 需要挂载到页面的弹窗节点。 */
  modal: ReactNode
  /** 打开新增用户弹窗。 */
  openCreate: () => void
  /** 打开编辑用户弹窗并回填记录。 */
  openEdit: (record: UserRecord) => void
}

/** 用户新增/编辑弹窗：MCFormModal + SchemaForm 的组合样板。
 *  校验失败保持弹窗打开；提交失败由 MutationCache 统一 toast 并解除锁定。 */
export function useUserFormModal({
  onSubmit
}: {
  onSubmit: (input: UserInput, editing?: UserRecord) => Promise<unknown>
}): UseUserFormModalResult {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<UserRecord>()
  const initialValues = useMemo(
    () =>
      editing
        ? {
            department: editing.department,
            email: editing.email,
            name: editing.name,
            riskLevel: editing.riskLevel,
            role: editing.role,
            status: editing.status
          }
        : undefined,
    [editing]
  )

  // 函数：openCreate。重置表单并以新增模式打开弹窗。
  function openCreate() {
    setEditing(undefined)
    setOpen(true)
  }

  // 函数：openEdit。以编辑模式打开弹窗并回填用户记录。
  function openEdit(record: UserRecord) {
    setEditing(record)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
  }

  const modal = (
    <MCFormModal<UserInput>
      initialValues={initialValues}
      onCancel={closeModal}
      onSubmit={async input => {
        await onSubmit(input, editing)
      }}
      open={open}
      schema={USER_FORM_FIELDS}
      title={editing ? '编辑用户' : '新增用户'}
    />
  )

  return { modal, openCreate, openEdit }
}
