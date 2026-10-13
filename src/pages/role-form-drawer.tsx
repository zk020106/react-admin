import { useState, type ReactNode } from 'react'

import { CForm, useCForm } from '@/components/c-ui/form'
import { CDrawer, useCDrawerApi } from '@/components/c-ui/popup'
import { Checkbox } from '@/components/ui/checkbox'
import type { RoleInput, RoleRecord } from '@/mock/admin-mock'
import type { FormSchema } from '@/types/admin'
import { DrawerApi } from '@/utils/popup-api'

/** 权限模块清单：分配权限抽屉按此分组渲染（与导航/菜单的权限编码对齐）。 */
export const permissionModules = [
  { label: '概览', value: 'overview:read' },
  { label: '工作台', value: 'workplace:read' },
  { label: '用户', value: 'system:user:read' },
  { label: '角色', value: 'system:role:read' },
  { label: '菜单', value: 'system:menu:read' },
  { label: '部门', value: 'system:department:read' },
  { label: '关于', value: 'about:read' }
]

// 角色表单的字段清单：新增与编辑共用。
const ROLE_FORM_FIELDS: FormSchema[] = [
  {
    component: 'input',
    fieldName: 'name',
    label: '角色名称',
    rules: [{ message: '请输入角色名称', required: true }]
  },
  {
    component: 'input',
    fieldName: 'code',
    label: '角色编码',
    rules: [{ message: '请输入角色编码', required: true }]
  },
  {
    component: 'textarea',
    fieldName: 'description',
    label: '角色描述'
  },
  {
    component: 'select',
    componentProps: { options: [{ value: '启用' }, { value: '停用' }] },
    defaultValue: '启用',
    fieldName: 'status',
    label: '状态'
  },
  {
    component: 'input',
    fieldName: 'dataScope',
    label: '数据范围',
    rules: [{ message: '请输入数据范围', required: true }]
  }
]

export interface UseRoleFormDrawerResult {
  /** 需要挂载到页面的抽屉节点。 */
  drawer: ReactNode
  /** 打开新增角色抽屉。 */
  openCreate: () => void
  /** 打开编辑角色抽屉并回填记录（编码为键，不可改）。 */
  openEdit: (record: RoleRecord) => void
}

/** 角色新增/编辑抽屉：CDrawer + CForm 的组合样板。 */
export function useRoleFormDrawer({
  onSubmit
}: {
  onSubmit: (input: RoleInput, editing?: RoleRecord) => Promise<unknown>
}): UseRoleFormDrawerResult {
  const drawerApi = useCDrawerApi(() => new DrawerApi({ title: '新增角色' }))
  const [formApi, methods] = useCForm({ schema: ROLE_FORM_FIELDS })

  // 函数：openCreate。重置表单并以新增模式打开抽屉（编码可填）。
  function openCreate() {
    drawerApi.setData(undefined)
    drawerApi.setState({ title: '新增角色' })
    formApi.updateSchema([{ componentProps: { disabled: false }, fieldName: 'code' }])
    methods.reset()
    drawerApi.open()
  }

  // 函数：openEdit。以编辑模式打开抽屉并回填角色记录（编码锁定）。
  function openEdit(record: RoleRecord) {
    drawerApi.setData(record)
    drawerApi.setState({ title: '编辑角色' })
    formApi.updateSchema([{ componentProps: { disabled: true }, fieldName: 'code' }])
    methods.reset({
      code: record.code,
      dataScope: record.dataScope,
      description: record.description,
      name: record.name,
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

      await onSubmit(values as unknown as RoleInput, drawerApi.getData<RoleRecord | undefined>())
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

export interface UsePermissionDrawerResult {
  /** 需要挂载到页面的抽屉节点。 */
  drawer: ReactNode
  /** 打开分配权限抽屉并载入角色的已有权限。 */
  openAssign: (role: RoleRecord) => void
}

/** 分配权限抽屉：按模块分组的多选，保存后由调用方 mutation 持久化并刷新列表。 */
export function usePermissionDrawer({
  onSubmit
}: {
  onSubmit: (role: RoleRecord, permissions: string[]) => Promise<unknown>
}): UsePermissionDrawerResult {
  const drawerApi = useCDrawerApi(() => new DrawerApi({ title: '分配权限' }))
  const [target, setTarget] = useState<RoleRecord | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  // 函数：openAssign。载入角色已有权限并打开抽屉。
  function openAssign(role: RoleRecord) {
    setTarget(role)
    setSelected([...role.permissions])
    drawerApi.setState({ title: `分配权限 - ${role.name}` })
    drawerApi.open()
  }

  // 函数：togglePermission。切换单个模块权限的选中态。
  function togglePermission(value: string, checked: boolean) {
    setSelected(current =>
      checked
        ? current.includes(value)
          ? current
          : [...current, value]
        : current.filter(item => item !== value)
    )
  }

  // 函数：handleConfirm。提交权限变更并按结果关闭或保持抽屉。
  async function handleConfirm() {
    if (!target) {
      return
    }

    drawerApi.lock()

    try {
      await onSubmit(target, selected)
      await drawerApi.close()
    } catch {
      // 提交失败：保持抽屉打开，错误提示由 MutationCache 统一处理。
      drawerApi.unlock()
    }
  }

  const drawer = (
    <CDrawer api={drawerApi} onConfirm={() => void handleConfirm()}>
      {target ? (
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">
            为「{target.name}」勾选可访问的模块，保存后即时生效。
          </p>
          {permissionModules.map(module => {
            const checked = selected.includes(module.value)

            return (
              <div
                aria-checked={checked}
                className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
                key={module.value}
                onClick={() => togglePermission(module.value, !checked)}
                onKeyDown={event => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault()
                    togglePermission(module.value, !checked)
                  }
                }}
                role="checkbox"
                tabIndex={0}
              >
                <Checkbox
                  aria-hidden="true"
                  checked={checked}
                  onClick={event => event.stopPropagation()}
                  onCheckedChange={value => togglePermission(module.value, value === true)}
                  tabIndex={-1}
                />
                <span className="text-sm font-medium">{module.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{module.value}</span>
              </div>
            )
          })}
        </div>
      ) : null}
    </CDrawer>
  )

  return { drawer, openAssign }
}
