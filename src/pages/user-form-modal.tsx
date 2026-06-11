import type { ReactNode } from 'react'

import { SchemaForm } from '@/components/admin/form/schema-form'
import { useAdminForm } from '@/components/admin/form/use-admin-form'
import { AdminModal } from '@/components/admin/popup/admin-modal'
import { useModalApi } from '@/components/admin/popup/use-popup'
import type { UserInput, UserRecord } from '@/mock/admin-mock'
import type { FormSchema } from '@/types/admin'
import { ModalApi } from '@/utils/popup-api'

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

/** 用户新增/编辑弹窗：AdminModal + SchemaForm 的组合样板。
 *  校验失败保持弹窗打开；提交失败由 MutationCache 统一 toast 并解除锁定。 */
export function useUserFormModal({
  onSubmit
}: {
  onSubmit: (input: UserInput, editing?: UserRecord) => Promise<unknown>
}): UseUserFormModalResult {
  const modalApi = useModalApi(() => new ModalApi({ title: '新增用户' }))
  const [formApi, form] = useAdminForm({ schema: USER_FORM_FIELDS })

  // 函数：openCreate。重置表单并以新增模式打开弹窗。
  function openCreate() {
    modalApi.setData(undefined)
    modalApi.setState({ title: '新增用户' })
    form.resetFields()
    modalApi.open()
  }

  // 函数：openEdit。以编辑模式打开弹窗并回填用户记录。
  function openEdit(record: UserRecord) {
    modalApi.setData(record)
    modalApi.setState({ title: '编辑用户' })
    form.setFieldsValue({
      department: record.department,
      email: record.email,
      name: record.name,
      riskLevel: record.riskLevel,
      role: record.role,
      status: record.status
    })
    modalApi.open()
  }

  // 函数：handleConfirm。校验、提交并按结果关闭或保持弹窗。
  async function handleConfirm() {
    modalApi.lock()

    try {
      const values = await formApi.submit()

      if (!values) {
        modalApi.unlock()
        return
      }

      await onSubmit(values as unknown as UserInput, modalApi.getData<UserRecord | undefined>())
      await modalApi.close()
      form.resetFields()
    } catch {
      // 提交失败：保持弹窗打开，错误提示由 MutationCache 统一处理。
      modalApi.unlock()
    }
  }

  const modal = (
    <AdminModal api={modalApi} forceRender onConfirm={() => void handleConfirm()}>
      <SchemaForm api={formApi} form={form} />
    </AdminModal>
  )

  return { modal, openCreate, openEdit }
}
