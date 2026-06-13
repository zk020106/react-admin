import { useState, type ReactNode } from 'react'

import { MCDrawerForm } from '@/components/mc'
import type { UserInput, UserRecord } from '@/mock/admin-mock'
import type { MCFormField } from '@/components/mc'

// 用户表单的字段清单：新增与编辑共用
const USER_FORM_FIELDS: MCFormField[] = [
  {
    component: 'input',
    label: '昵称',
    name: 'name',
    required: '请输入昵称',
    span: 24
  },
  {
    component: 'input',
    label: '用户名',
    name: 'account',
    required: '请输入用户名',
    span: 24
  },
  {
    component: 'input',
    componentProps: { type: 'password' },
    label: '密码',
    name: 'password',
    required: '请输入密码',
    span: 24
  },
  {
    component: 'input',
    label: '手机号码',
    name: 'phone',
    span: 24
  },
  {
    component: 'input',
    label: '邮箱',
    name: 'email',
    rules: [{ message: '邮箱格式不正确', type: 'email' }],
    span: 24
  },
  {
    component: 'radio-group',
    componentProps: {
      options: [
        { label: '男', value: '男' },
        { label: '女', value: '女' },
        { label: '未知', value: '未知' }
      ]
    },
    defaultValue: '男',
    label: '性别',
    name: 'gender',
    span: 24
  },
  {
    component: 'select',
    componentProps: {
      options: [
        { label: '平台部', value: '平台部' },
        { label: '研发部', value: '研发部' },
        { label: '产品部', value: '产品部' },
        { label: '数据部', value: '数据部' },
        { label: 'UI部', value: 'UI部' },
        { label: '安全部', value: '安全部' },
        { label: '运营部', value: '运营部' },
        { label: '财务部', value: '财务部' },
        { label: '人事部', value: '人事部' },
        { label: '运维部', value: '运维部' }
      ],
      placeholder: '请选择所属部门'
    },
    label: '所属部门',
    name: 'department',
    required: '请选择所属部门',
    span: 24
  },
  {
    component: 'select',
    componentProps: {
      options: [
        { label: '超级管理员', value: '超级管理员' },
        { label: '管理员', value: '管理员' },
        { label: '普通用户', value: '普通用户' },
        { label: '访客', value: '访客' }
      ],
      placeholder: '请选择角色'
    },
    label: '角色',
    name: 'role',
    required: '请选择角色',
    span: 24
  },
  {
    component: 'textarea',
    componentProps: { maxLength: 200, placeholder: '请输入描述', rows: 4, showCount: true },
    label: '描述',
    name: 'remark',
    span: 24
  },
  {
    component: 'switch',
    componentProps: { checkedChildren: '启用', unCheckedChildren: '停用' },
    defaultValue: true,
    label: '状态',
    name: 'status',
    span: 24
  }
]

export interface UseUserFormDrawerResult {
  /** 需要挂载到页面的抽屉节点。 */
  drawer: ReactNode
  /** 打开新增用户抽屉。 */
  openCreate: () => void
  /** 打开编辑用户抽屉并回填记录。 */
  openEdit: (record: UserRecord) => void
}

/** 用户新增/编辑抽屉：MCDrawerForm 的组合样板。 */
export function useUserFormDrawer({
  onSubmit
}: {
  onSubmit: (input: UserInput, editing?: UserRecord) => Promise<unknown>
}): UseUserFormDrawerResult {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<UserRecord>()

  function openCreate() {
    setEditing(undefined)
    setOpen(true)
  }

  function openEdit(record: UserRecord) {
    setEditing(record)
    setOpen(true)
  }

  function closeDrawer() {
    setOpen(false)
  }

  const initialValues = editing
    ? {
        account: editing.account,
        department: editing.department,
        email: editing.email,
        gender: editing.gender,
        name: editing.name,
        phone: editing.phone,
        remark: editing.remark,
        role: editing.role,
        status: editing.status
      }
    : undefined

  const drawer = (
    <MCDrawerForm<UserInput>
      fields={USER_FORM_FIELDS}
      initialValues={initialValues}
      onCancel={closeDrawer}
      onSubmit={async input => {
        await onSubmit(input, editing)
        closeDrawer()
      }}
      open={open}
      placement="right"
      title={editing ? '编辑用户' : '新增用户'}
      width={480}
    />
  )

  return { drawer, openCreate, openEdit }
}
