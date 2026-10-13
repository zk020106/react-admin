import type { ReactNode } from 'react'

import { CForm, useCForm } from '@/components/c-ui/form'
import { CDrawer, useCDrawerApi } from '@/components/c-ui/popup'
import type { UserInput, UserRecord } from '@/mock/admin-mock'
import type { FormSchema } from '@/types/admin'
import { DrawerApi } from '@/utils/popup-api'

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

export interface UseUserFormDrawerResult {
  /** 需要挂载到页面的抽屉节点。 */
  drawer: ReactNode
  /** 打开新增用户抽屉。 */
  openCreate: () => void
  /** 打开编辑用户抽屉并回填记录。 */
  openEdit: (record: UserRecord) => void
}

/** 用户新增/编辑抽屉：CDrawer + CForm 的组合样板（新增/编辑统一走抽屉，不用 Modal）。
 *  校验失败保持抽屉打开；提交失败由 MutationCache 统一 toast 并解除锁定。 */
export function useUserFormDrawer({
  onSubmit
}: {
  onSubmit: (input: UserInput, editing?: UserRecord) => Promise<unknown>
}): UseUserFormDrawerResult {
  const drawerApi = useCDrawerApi(() => new DrawerApi({ title: '新增用户' }))
  const [formApi, methods] = useCForm({ schema: USER_FORM_FIELDS })

  // 函数：openCreate。重置表单并以新增模式打开抽屉。
  function openCreate() {
    drawerApi.setData(undefined)
    drawerApi.setState({ title: '新增用户' })
    methods.reset()
    drawerApi.open()
  }

  // 函数：openEdit。以编辑模式打开抽屉并回填用户记录。
  function openEdit(record: UserRecord) {
    drawerApi.setData(record)
    drawerApi.setState({ title: '编辑用户' })
    methods.reset({
      department: record.department,
      email: record.email,
      name: record.name,
      riskLevel: record.riskLevel,
      role: record.role,
      status: record.status
    })
    drawerApi.open()
  }

  // 函数：handleConfirm。校验、提交并按结果关闭或保持抽屉。
  async function handleConfirm() {
    drawerApi.lock()

    try {
      const values = await formApi.submit()

      if (!values) {
        drawerApi.unlock()
        return
      }

      await onSubmit(values as unknown as UserInput, drawerApi.getData<UserRecord | undefined>())
      await drawerApi.close()
      methods.reset()
    } catch {
      // 提交失败：保持抽屉打开，错误提示由 MutationCache 统一处理。
      drawerApi.unlock()
    }
  }

  const drawer = (
    <CDrawer api={drawerApi} forceRender onConfirm={() => void handleConfirm()}>
      <CForm api={formApi} methods={methods} />
    </CDrawer>
  )

  return { drawer, openCreate, openEdit }
}
