import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Checkbox, Input, Segmented, Tabs } from 'antd'
import { ListCollapse, ListTree, MoreHorizontal, Plus, RefreshCw, Save, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Page } from '@/components/page'
import { PageLayout } from '@/components/page-layout'
import { useTable } from '@/hooks/use-table'
import { systemQueries } from '@/pages/admin-queries'
import type { MenuManagementRecord, RoleRecord, UserRecord } from '@/mock/admin-mock'

type PermissionMode = 'linked' | 'strict'

type RoleTableFilters = {
  keyword?: unknown
} & Record<string, unknown>

type PermissionRow =
  | {
      depth: number
      menu: MenuManagementRecord
      type: 'group'
    }
  | {
      actions: MenuManagementRecord[]
      depth: number
      menu: MenuManagementRecord
      type: 'menu'
    }

function normalizeKeyword(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().toLowerCase()
  }
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim().toLowerCase()
}

function roleMatchesFilters(role: RoleRecord, filters: RoleTableFilters) {
  const keyword = normalizeKeyword(filters.keyword)

  if (!keyword) {
    return true
  }

  return [role.name, role.code, role.description, role.dataScope].some(value =>
    normalizeKeyword(value).includes(keyword)
  )
}

function getMenuTypeColor(type: MenuManagementRecord['type']) {
  if (type === '目录') {
    return 'blue'
  }

  if (type === '菜单') {
    return 'green'
  }

  return 'purple'
}

function getActionLabel(permission: MenuManagementRecord) {
  if (permission.type !== '按钮') {
    return '列表'
  }

  return permission.name.replace(/用户|角色|菜单|部门/g, '')
}

function buildChildrenByParent(menus: MenuManagementRecord[]) {
  const childrenByParent = new Map<string, MenuManagementRecord[]>()

  menus.forEach(menu => {
    const children = childrenByParent.get(menu.parentName) ?? []
    children.push(menu)
    childrenByParent.set(menu.parentName, children)
  })

  childrenByParent.forEach(children => {
    children.sort((current, next) => current.sort - next.sort)
  })

  return childrenByParent
}

function collectBranchPermissions(
  menu: MenuManagementRecord,
  childrenByParent: Map<string, MenuManagementRecord[]>
) {
  const permissions = [menu.permission]

  const visit = (parentName: string) => {
    const children = childrenByParent.get(parentName) ?? []

    children.forEach(child => {
      permissions.push(child.permission)

      if (child.type !== '按钮') {
        visit(child.name)
      }
    })
  }

  visit(menu.name)

  return permissions
}

function buildPermissionRows(
  childrenByParent: Map<string, MenuManagementRecord[]>
): PermissionRow[] {
  const rows: PermissionRow[] = []

  const visit = (items: MenuManagementRecord[], depth: number) => {
    items.forEach(item => {
      if (item.type === '按钮') {
        return
      }

      const children = childrenByParent.get(item.name) ?? []
      const actions = children.filter(child => child.type === '按钮')
      const childMenus = children.filter(child => child.type !== '按钮')

      if (item.type === '目录') {
        rows.push({ depth, menu: item, type: 'group' })
        visit(childMenus, depth + 1)
        return
      }

      rows.push({ actions, depth, menu: item, type: 'menu' })

      if (childMenus.length > 0) {
        visit(childMenus, depth + 1)
      }
    })
  }

  visit(childrenByParent.get('-') ?? [], 0)

  return rows
}

function getRoleUsers(role: RoleRecord | undefined, users: UserRecord[]) {
  if (!role) {
    return []
  }

  return users.filter(user => user.role === role.name || role.name.includes(user.role))
}

export function RolesPage() {
  const [activeTab, setActiveTab] = useState('permissions')
  const [groupsExpanded, setGroupsExpanded] = useState(true)
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('linked')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(() => new Set())
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>()

  const rolesQuery = useQuery(systemQueries.roles())
  const menusQuery = useQuery(systemQueries.menus())
  const usersQuery = useQuery(systemQueries.users())
  const { data: roles = [], isLoading: rolesLoading } = rolesQuery
  const { data: menus = [], isLoading: menusLoading } = menusQuery
  const { data: users = [] } = usersQuery

  const filterRoles = useCallback(
    (record: RoleRecord, filters: RoleTableFilters) => roleMatchesFilters(record, filters),
    []
  )
  const rolesTable = useTable<RoleRecord, RoleTableFilters>({
    dataSource: roles,
    defaultFilters: { keyword: '' },
    filter: filterRoles
  })
  const filteredRoles = rolesTable.filteredData
  const roleKeyword = String(rolesTable.filters.keyword ?? '')
  const selectedRole = useMemo(
    () => filteredRoles.find(role => role.code === selectedRoleCode) ?? filteredRoles[0],
    [filteredRoles, selectedRoleCode]
  )
  const childrenByParent = useMemo(() => buildChildrenByParent(menus), [menus])
  const permissionRows = useMemo(() => buildPermissionRows(childrenByParent), [childrenByParent])
  const visiblePermissionRows = useMemo(
    () => (groupsExpanded ? permissionRows : permissionRows.filter(row => row.type === 'group')),
    [groupsExpanded, permissionRows]
  )
  const roleUsers = useMemo(() => getRoleUsers(selectedRole, users), [selectedRole, users])

  useEffect(() => {
    setSelectedPermissions(new Set(selectedRole?.permissions ?? []))
  }, [selectedRole])

  const handleTogglePermission = useCallback(
    (menu: MenuManagementRecord, checked: boolean) => {
      setSelectedPermissions(current => {
        const next = new Set(current)
        const targetPermissions =
          permissionMode === 'linked'
            ? collectBranchPermissions(menu, childrenByParent)
            : [menu.permission]

        targetPermissions.forEach(permission => {
          if (checked) {
            next.add(permission)
            return
          }

          next.delete(permission)
        })

        return next
      })
    },
    [childrenByParent, permissionMode]
  )

  return (
    <Page>
      <PageLayout
        autoCollapse
        collapseBreakpoint={1024}
        collapsible
        left={
          <div className="flex h-full min-h-0 flex-col gap-3 p-4">
            <div className="flex shrink-0 items-center justify-between">
              <span className="text-sm font-semibold">角色名称</span>
              <span className="text-xs text-muted-foreground">{filteredRoles.length} 个</span>
            </div>
            <div className="flex shrink-0 gap-2">
              <Input
                allowClear
                onChange={event => rolesTable.search({ keyword: event.target.value })}
                placeholder="搜索名称/编码"
                prefix={<Search className="size-4" />}
                size="small"
                value={roleKeyword}
              />
              <Button icon={<Plus className="size-4" />} size="small" type="primary" />
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <div className="grid gap-1">
                {filteredRoles.map(role => {
                  const active = selectedRole?.code === role.code

                  return (
                    <button
                      aria-pressed={active}
                      className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                        active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/70'
                      }`}
                      key={role.code}
                      onClick={() => setSelectedRoleCode(role.code)}
                      type="button"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-medium">{role.name}</span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {role.code}
                        </span>
                        {active ? <MoreHorizontal className="size-4 shrink-0" /> : null}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {role.dataScope}
                      </span>
                    </button>
                  )
                })}
                {filteredRoles.length === 0 ? (
                  <div className="rounded border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                    暂无角色
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        }
        leftStyle={{
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--card)'
        }}
        leftWidth={280}
        resizable
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="flex shrink-0 items-center justify-between border-b px-4">
            <Tabs
              activeKey={activeTab}
              items={[
                { key: 'permissions', label: '功能权限' },
                { key: 'users', label: '角色用户' }
              ]}
              onChange={setActiveTab}
            />
            <div className="flex items-center gap-2">
              <Button
                disabled={!selectedRole}
                icon={<Save className="size-4" />}
                size="small"
                type="primary"
              >
                保存权限
              </Button>
              <Button
                icon={<RefreshCw className="size-4" />}
                onClick={() =>
                  void Promise.all([
                    rolesQuery.refetch(),
                    menusQuery.refetch(),
                    usersQuery.refetch()
                  ])
                }
                size="small"
              />
              <Button
                icon={
                  groupsExpanded ? (
                    <ListCollapse className="size-4" />
                  ) : (
                    <ListTree className="size-4" />
                  )
                }
                onClick={() => setGroupsExpanded(value => !value)}
                size="small"
              >
                {groupsExpanded ? '折叠' : '展开'}
              </Button>
            </div>
          </div>

          {activeTab === 'permissions' ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {selectedRole?.name ?? '-'} / {selectedRole?.code ?? '-'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedRole?.dataScope ?? '-'}，已勾选 {selectedPermissions.size} 项
                  </div>
                </div>
                <Segmented
                  onChange={value => setPermissionMode(value as PermissionMode)}
                  options={[
                    { label: '节点关联', value: 'linked' },
                    { label: '节点独立', value: 'strict' }
                  ]}
                  size="small"
                  value={permissionMode}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-auto border">
                <table className="w-full min-w-[920px] border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-muted">
                    <tr>
                      <th className="w-[260px] border-b px-3 py-2 text-left font-medium">菜单</th>
                      <th className="border-b px-3 py-2 text-left font-medium">权限</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolesLoading || menusLoading ? (
                      <tr>
                        <td className="px-3 py-10 text-center text-muted-foreground" colSpan={2}>
                          权限加载中
                        </td>
                      </tr>
                    ) : (
                      visiblePermissionRows.map(row => {
                        if (row.type === 'group') {
                          return (
                            <tr className="bg-muted/50" key={row.menu.permission}>
                              <td className="border-b px-3 py-2" colSpan={2}>
                                <div
                                  className="flex items-center gap-2 font-medium"
                                  style={{ paddingLeft: row.depth * 18 }}
                                >
                                  <Checkbox
                                    checked={selectedPermissions.has(row.menu.permission)}
                                    disabled={!selectedRole}
                                    onChange={event =>
                                      handleTogglePermission(row.menu, event.target.checked)
                                    }
                                  />
                                  <span>{row.menu.name}</span>
                                  <Badge
                                    color={getMenuTypeColor(row.menu.type)}
                                    text={row.menu.type}
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        }

                        return (
                          <tr key={row.menu.permission}>
                            <td className="border-b px-3 py-2 align-top">
                              <div
                                className="flex items-center gap-2 font-medium"
                                style={{ paddingLeft: row.depth * 18 }}
                              >
                                <span>{row.menu.name}</span>
                                <Badge
                                  color={getMenuTypeColor(row.menu.type)}
                                  text={row.menu.type}
                                />
                              </div>
                            </td>
                            <td className="border-b px-3 py-2">
                              <div className="flex flex-wrap gap-x-5 gap-y-2">
                                <Checkbox
                                  checked={selectedPermissions.has(row.menu.permission)}
                                  disabled={!selectedRole}
                                  onChange={event =>
                                    handleTogglePermission(row.menu, event.target.checked)
                                  }
                                >
                                  列表
                                </Checkbox>
                                {row.actions.map(action => (
                                  <Checkbox
                                    checked={selectedPermissions.has(action.permission)}
                                    disabled={!selectedRole}
                                    key={action.permission}
                                    onChange={event =>
                                      handleTogglePermission(action, event.target.checked)
                                    }
                                  >
                                    {getActionLabel(action)}
                                  </Checkbox>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="overflow-hidden rounded-md border">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border-b px-3 py-2 text-left font-medium">用户</th>
                      <th className="border-b px-3 py-2 text-left font-medium">账号</th>
                      <th className="border-b px-3 py-2 text-left font-medium">所属部门</th>
                      <th className="border-b px-3 py-2 text-left font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleUsers.length > 0 ? (
                      roleUsers.map(user => (
                        <tr key={user.id}>
                          <td className="border-b px-3 py-2 font-medium">{user.name}</td>
                          <td className="border-b px-3 py-2">{user.account}</td>
                          <td className="border-b px-3 py-2">{user.department}</td>
                          <td className="border-b px-3 py-2">
                            <Badge
                              color={user.status === '启用' ? 'green' : 'orange'}
                              text={user.status}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-10 text-center text-muted-foreground" colSpan={4}>
                          暂无角色用户
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    </Page>
  )
}
