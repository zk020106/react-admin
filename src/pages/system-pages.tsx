import { useMutation, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState, type ReactNode } from 'react'
import {
  Building2,
  ChevronDown,
  FolderTree,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Route,
  Search,
  Shield,
  SlidersHorizontal,
  SquareMenu,
  UserCheck,
  Users
} from 'lucide-react'

import { CTable } from '@/components/c-ui/table'
import { HasPermission } from '@/components/has-permission'
import { Page, PageSection } from '@/components/page'
import { cn } from '@/lib/utils'
import { roleMutations, userMutations } from '@/pages/admin-mutations'
import { systemQueries } from '@/pages/admin-queries'
import { useRoleFormDrawer, usePermissionDrawer } from '@/pages/role-form-drawer'
import { useUserFormDrawer } from '@/pages/user-form-drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type {
  DepartmentRecord,
  MenuManagementRecord,
  RoleRecord,
  UserRecord
} from '@/mock/admin-mock'

const emptyDepartments: DepartmentRecord[] = []
const emptyMenus: MenuManagementRecord[] = []
const emptyRoles: RoleRecord[] = []
const emptyUsers: UserRecord[] = []
const userStatusOptions = ['全部', '启用', '复核中']
const roleStatusOptions = ['全部', '启用', '停用']

/** 行操作“更多”下拉菜单：收敛删除、分配权限等 destructive/次要操作，只留主要动作为文字链。 */
function MoreActionsMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="link">
          更多
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

/** 行内删除确认弹窗：受控 AlertDialog，由“更多”菜单项触发打开（避免菜单与弹窗嵌套）。 */
function RowDeleteConfirm({
  description,
  onCancel,
  onConfirm,
  open,
  pending,
  title
}: {
  description: string
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  pending: boolean
  title: string
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={value => {
        if (!value) {
          onCancel()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={event => {
              // 阻止 Radix 点击后自动关闭：pending 期间保持弹框打开并显示 loading，
              // 成功后由 onConfirm 手动关闭；失败时弹框保持打开，可重试或取消。
              event.preventDefault()
              onConfirm()
            }}
            variant="destructive"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * 用户管理页（三段式：搜索区 → 工具栏 → 表格）。
 * 列收敛说明：只保留可排序/可筛选/可操作的列——登录方式、最近登录为纯展示信息列，
 * 无筛选与操作需求，已砍掉（风险/状态列保留 Badge 展示且支持排序）。
 *
 * @returns 用户管理页面。
 */
export function UsersPage() {
  const [draftKeyword, setDraftKeyword] = useState('')
  const [draftStatus, setDraftStatus] = useState<string>('全部')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [appliedStatus, setAppliedStatus] = useState<string>('全部')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null)
  const { data = emptyUsers, isLoading, refetch } = useQuery(systemQueries.users())
  const createMutation = useMutation(userMutations.create())
  const updateMutation = useMutation(userMutations.update())
  const removeMutation = useMutation(userMutations.remove())
  const {
    drawer: userFormDrawer,
    openCreate,
    openEdit
  } = useUserFormDrawer({
    onSubmit: (input, editing) =>
      editing
        ? updateMutation.mutateAsync({ id: editing.id, input })
        : createMutation.mutateAsync(input)
  })
  const filteredUsers = useMemo(() => {
    const normalizedKeyword = appliedKeyword.trim().toLowerCase()

    return data.filter(user => {
      const matchesStatus = appliedStatus === '全部' || user.status === appliedStatus
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        [user.name, user.email, user.role, user.department].some(value =>
          value.toLowerCase().includes(normalizedKeyword)
        )

      return matchesStatus && matchesKeyword
    })
  }, [data, appliedKeyword, appliedStatus])
  const userSummary = useMemo(() => {
    // 单次遍历同时累计三类计数，避免对同一数组做多趟 filter。
    let enabledCount = 0
    let reviewCount = 0
    let riskCount = 0

    for (const user of data) {
      if (user.status === '启用') {
        enabledCount += 1
      }

      if (user.status === '复核中') {
        reviewCount += 1
      }

      if (user.riskLevel !== '低') {
        riskCount += 1
      }
    }

    return [
      { icon: Users, label: '账号总数', value: data.length },
      { icon: UserCheck, label: '启用账号', value: enabledCount },
      { icon: Shield, label: '复核账号', value: reviewCount },
      { icon: SlidersHorizontal, label: '风险关注', value: riskCount }
    ]
  }, [data])

  // 函数：applySearch。把搜索区草稿值提交为生效条件。
  function applySearch() {
    setAppliedKeyword(draftKeyword)
    setAppliedStatus(draftStatus)
  }

  // 函数：resetSearch。清空搜索区并恢复默认条件。
  function resetSearch() {
    setDraftKeyword('')
    setDraftStatus('全部')
    setAppliedKeyword('')
    setAppliedStatus('全部')
  }

  const columns: ColumnDef<UserRecord>[] = [
    { accessorKey: 'name', header: '姓名' },
    { accessorKey: 'email', header: '邮箱' },
    { accessorKey: 'role', header: '角色' },
    { accessorKey: 'department', header: '部门' },
    {
      accessorKey: 'riskLevel',
      cell: ({ row }) => {
        const level = row.original.riskLevel
        // ui Badge 没有 warning 变体：高风险用 destructive，中/低风险都降级为 secondary。
        const variant = level === '高' ? 'destructive' : 'secondary'

        return <Badge variant={variant}>{level}</Badge>
      },
      header: '风险'
    },
    {
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === '启用' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
      header: '状态'
    },
    {
      cell: ({ row }) => {
        const record = row.original

        return (
          <div className="flex items-center gap-1">
            <HasPermission permission="system:user:update">
              <Button onClick={() => openEdit(record)} size="sm" variant="link">
                编辑
              </Button>
            </HasPermission>
            <HasPermission permission="system:user:delete">
              <MoreActionsMenu>
                <DropdownMenuItem onSelect={() => setDeleteTarget(record)} variant="destructive">
                  删除
                </DropdownMenuItem>
              </MoreActionsMenu>
            </HasPermission>
          </div>
        )
      },
      enableSorting: false,
      header: '操作',
      id: 'actions'
    }
  ]

  const searchBar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Label className="sr-only" htmlFor="user-search-keyword">
          搜索用户
        </Label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="搜索用户"
          className="w-64 pl-9"
          id="user-search-keyword"
          onChange={event => setDraftKeyword(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              applySearch()
            }
          }}
          placeholder="搜索姓名、邮箱、角色或部门"
          value={draftKeyword}
        />
      </div>
      {searchExpanded ? (
        <Select onValueChange={setDraftStatus} value={draftStatus}>
          <SelectTrigger aria-label="账号状态筛选" className="w-40">
            <SelectValue placeholder="账号状态" />
          </SelectTrigger>
          <SelectContent>
            {userStatusOptions.map(status => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <div className="flex items-center gap-2">
        <Button onClick={applySearch} size="sm">
          <Search className="size-3.5" />
          搜索
        </Button>
        <Button onClick={resetSearch} size="sm" variant="outline">
          重置
        </Button>
        <Button
          aria-expanded={searchExpanded}
          onClick={() => setSearchExpanded(current => !current)}
          size="sm"
          variant="ghost"
        >
          {searchExpanded ? '收起' : '展开'}
          <ChevronDown
            className={cn('size-3.5 transition-transform', searchExpanded && 'rotate-180')}
          />
        </Button>
      </div>
    </div>
  )

  return (
    <Page title="用户管理" description="查询用户账号、角色、部门和风险状态。">
      <PageSection contentClassName="grid gap-4 md:grid-cols-4">
        {userSummary.map(item => {
          const Icon = item.icon

          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle>{item.value}</CardTitle>
                </div>
                <Icon className="size-5 text-primary" />
              </CardHeader>
            </Card>
          )
        })}
      </PageSection>
      <PageSection>
        <Card>
          <CardContent className="grid gap-4">
            <CTable<UserRecord>
              columns={columns}
              data={filteredUsers}
              getRowId={row => row.id}
              loading={isLoading}
              searchBar={searchBar}
              toolbarLeft={
                <HasPermission permission="system:user:create">
                  <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    新增用户
                  </Button>
                </HasPermission>
              }
              toolbarRight={
                <Button onClick={() => void refetch()} size="sm" variant="outline">
                  <RefreshCw className="size-3.5" />
                  刷新
                </Button>
              }
            />
          </CardContent>
        </Card>
      </PageSection>
      {userFormDrawer}
      <RowDeleteConfirm
        description={
          deleteTarget ? `删除后「${deleteTarget.name}」将无法登录，此操作不可撤销。` : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            removeMutation
              .mutateAsync(deleteTarget.id)
              .then(() => setDeleteTarget(null))
              .catch(() => {
                // 删除失败时保持弹框打开（可重试/取消），错误由 MutationCache 全局 toast 提示
              })
          }
        }}
        open={deleteTarget !== null}
        pending={removeMutation.isPending}
        title="确认删除该用户？"
      />
    </Page>
  )
}

/**
 * 角色管理页（三段式：搜索区 → 工具栏 → 表格）。
 * 新增/编辑/分配权限统一走抽屉；删除收进“更多”菜单并用行内确认。
 *
 * @returns 角色管理页面。
 */
export function RolesPage() {
  const [draftName, setDraftName] = useState('')
  const [draftCode, setDraftCode] = useState('')
  const [draftStatus, setDraftStatus] = useState<string>('全部')
  const [appliedFilters, setAppliedFilters] = useState({ code: '', name: '', status: '全部' })
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null)
  const { data = emptyRoles } = useQuery(systemQueries.roles())
  const createMutation = useMutation(roleMutations.create())
  const updateMutation = useMutation(roleMutations.update())
  const removeMutation = useMutation(roleMutations.remove())
  const permissionsMutation = useMutation(roleMutations.updatePermissions())
  const {
    drawer: roleFormDrawer,
    openCreate,
    openEdit
  } = useRoleFormDrawer({
    onSubmit: (input, editing) =>
      editing
        ? updateMutation.mutateAsync({ code: editing.code, input })
        : createMutation.mutateAsync(input)
  })
  const { drawer: permissionDrawer, openAssign } = usePermissionDrawer({
    onSubmit: (role, permissions) =>
      permissionsMutation.mutateAsync({ code: role.code, permissions })
  })
  const roleSummary = useMemo(() => {
    const enabledCount = data.filter(role => role.status === '启用').length
    const permissionCount = new Set(data.flatMap(role => role.permissions)).size
    const memberCount = data.reduce((total, role) => total + role.memberCount, 0)

    return [
      { icon: Shield, label: '角色数量', value: data.length },
      { icon: Users, label: '授权成员', value: memberCount },
      { icon: KeyRound, label: '权限编码', value: permissionCount },
      { icon: UserCheck, label: '启用角色', value: enabledCount }
    ]
  }, [data])
  const filteredRoles = useMemo(() => {
    const nameKeyword = appliedFilters.name.trim().toLowerCase()
    const codeKeyword = appliedFilters.code.trim().toLowerCase()

    return data.filter(role => {
      const matchesName = nameKeyword.length === 0 || role.name.toLowerCase().includes(nameKeyword)
      const matchesCode = codeKeyword.length === 0 || role.code.toLowerCase().includes(codeKeyword)
      const matchesStatus =
        appliedFilters.status === '全部' || role.status === appliedFilters.status

      return matchesName && matchesCode && matchesStatus
    })
  }, [data, appliedFilters])

  // 函数：applySearch。把搜索区草稿值提交为生效条件。
  function applySearch() {
    setAppliedFilters({ code: draftCode, name: draftName, status: draftStatus })
  }

  // 函数：resetSearch。清空搜索区并恢复默认条件。
  function resetSearch() {
    setDraftName('')
    setDraftCode('')
    setDraftStatus('全部')
    setAppliedFilters({ code: '', name: '', status: '全部' })
  }

  const columns: ColumnDef<RoleRecord>[] = [
    { accessorKey: 'name', header: '角色名称' },
    { accessorKey: 'code', header: '角色编码' },
    {
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === '启用' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
      header: '状态'
    },
    {
      accessorKey: 'memberCount',
      cell: ({ row }) => `${row.original.memberCount} 人`,
      header: '成员数量'
    },
    { accessorKey: 'dataScope', header: '数据范围' },
    {
      cell: ({ row }) => {
        const record = row.original

        return (
          <div className="flex items-center gap-1">
            <HasPermission permission="system:role:update">
              <Button onClick={() => openEdit(record)} size="sm" variant="link">
                编辑
              </Button>
            </HasPermission>
            <MoreActionsMenu>
              <HasPermission permission="system:role:update">
                <DropdownMenuItem onSelect={() => openAssign(record)}>分配权限</DropdownMenuItem>
              </HasPermission>
              <HasPermission permission="system:role:delete">
                <DropdownMenuItem onSelect={() => setDeleteTarget(record)} variant="destructive">
                  删除
                </DropdownMenuItem>
              </HasPermission>
            </MoreActionsMenu>
          </div>
        )
      },
      enableSorting: false,
      header: '操作',
      id: 'actions'
    }
  ]

  const searchBar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="role-search-name">角色名称</Label>
        <Input
          className="w-48"
          id="role-search-name"
          onChange={event => setDraftName(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              applySearch()
            }
          }}
          placeholder="请输入角色名称"
          value={draftName}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="role-search-code">角色编码</Label>
        <Input
          className="w-48"
          id="role-search-code"
          onChange={event => setDraftCode(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              applySearch()
            }
          }}
          placeholder="请输入角色编码"
          value={draftCode}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="role-search-status">状态</Label>
        <Select onValueChange={setDraftStatus} value={draftStatus}>
          <SelectTrigger className="w-32" id="role-search-status">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            {roleStatusOptions.map(status => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end gap-2 self-end pb-px">
        <Button onClick={applySearch} size="sm">
          <Search className="size-3.5" />
          搜索
        </Button>
        <Button onClick={resetSearch} size="sm" variant="outline">
          重置
        </Button>
      </div>
    </div>
  )

  return (
    <Page title="角色管理" description="管理角色、成员规模、数据范围与模块权限分配。">
      <PageSection contentClassName="grid gap-4 md:grid-cols-4">
        {roleSummary.map(item => {
          const Icon = item.icon

          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle>{item.value}</CardTitle>
                </div>
                <Icon className="size-5 text-primary" />
              </CardHeader>
            </Card>
          )
        })}
      </PageSection>
      <PageSection>
        <Card>
          <CardContent className="grid gap-4">
            <CTable<RoleRecord>
              columns={columns}
              data={filteredRoles}
              getRowId={row => row.code}
              searchBar={searchBar}
              toolbarLeft={
                <HasPermission permission="system:role:create">
                  <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    新增角色
                  </Button>
                </HasPermission>
              }
            />
          </CardContent>
        </Card>
      </PageSection>
      {roleFormDrawer}
      {permissionDrawer}
      <RowDeleteConfirm
        description={
          deleteTarget ? `删除后「${deleteTarget.name}」的权限配置将一并移除，此操作不可撤销。` : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            removeMutation
              .mutateAsync(deleteTarget.code)
              .then(() => setDeleteTarget(null))
              .catch(() => {
                // 删除失败时保持弹框打开（可重试/取消），错误由 MutationCache 全局 toast 提示
              })
          }
        }}
        open={deleteTarget !== null}
        pending={removeMutation.isPending}
        title="确认删除该角色？"
      />
    </Page>
  )
}

/** 部门树节点：按 parent 名称组装层级，支持选中。 */
interface DepartmentNode {
  children: DepartmentNode[]
  depth: number
  record: DepartmentRecord
}

/** 函数：buildDepartmentTree。按 parent 名称把平铺部门组装成树，parent 为 '-' 或找不到时视为根。 */
function buildDepartmentTree(departments: DepartmentRecord[]): DepartmentNode[] {
  const names = new Set(departments.map(item => item.name))
  const build = (record: DepartmentRecord, depth: number): DepartmentNode => ({
    children: departments
      .filter(item => item.parent === record.name)
      .map(item => build(item, depth + 1)),
    depth,
    record
  })

  return departments
    .filter(item => item.parent === '-' || !names.has(item.parent))
    .map(item => build(item, 0))
}

function DepartmentTreeNode({
  node,
  onSelect,
  selectedCode
}: {
  node: DepartmentNode
  onSelect: (code: string | null) => void
  selectedCode: string | null
}) {
  const selected = selectedCode === node.record.code

  return (
    <>
      <button
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
          selected ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-muted'
        )}
        onClick={() => onSelect(node.record.code)}
        style={{ paddingLeft: 8 + node.depth * 16 }}
        type="button"
      >
        {node.children.length > 0 ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        <span className="truncate">{node.record.name}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {node.record.memberCount} 人
        </span>
      </button>
      {node.children.map(child => (
        <DepartmentTreeNode
          key={child.record.code}
          node={child}
          onSelect={onSelect}
          selectedCode={selectedCode}
        />
      ))}
    </>
  )
}

/**
 * 部门管理页（树 + 表布局）：左侧部门树、右侧组织明细表，共用一个页面容器；
 * 选中树节点时右侧只展示该节点及其后代部门。
 *
 * @returns 部门管理页面。
 */
export function DepartmentsPage() {
  const { data = emptyDepartments } = useQuery(systemQueries.departments())
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const departmentSummary = useMemo(() => {
    const memberCount = data.reduce((total, department) => total + department.memberCount, 0)
    const projectCount = data.reduce((total, department) => total + department.projectCount, 0)
    const childrenCount = data.reduce((total, department) => total + department.childrenCount, 0)

    return [
      { icon: Building2, label: '部门数量', value: data.length },
      { icon: Users, label: '成员总数', value: memberCount },
      { icon: Route, label: '项目数量', value: projectCount },
      { icon: FolderTree, label: '子部门', value: childrenCount }
    ]
  }, [data])
  const departmentTree = useMemo(() => buildDepartmentTree(data), [data])
  const visibleDepartments = useMemo(() => {
    if (!selectedCode) {
      return data
    }

    // 收集选中节点及其所有后代的编码。
    const codes = new Set<string>([selectedCode])
    let grown = true

    while (grown) {
      grown = false

      for (const item of data) {
        if (codes.has(item.code)) {
          continue
        }

        const parent = data.find(candidate => candidate.name === item.parent)

        if (parent && codes.has(parent.code)) {
          codes.add(item.code)
          grown = true
        }
      }
    }

    return data.filter(item => codes.has(item.code))
  }, [data, selectedCode])

  const columns: ColumnDef<DepartmentRecord>[] = [
    { accessorKey: 'name', header: '部门名称' },
    { accessorKey: 'code', header: '部门编码' },
    { accessorKey: 'leader', header: '负责人' },
    { accessorKey: 'memberCount', header: '成员数' },
    { accessorKey: 'projectCount', header: '项目数' },
    {
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === '启用' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
      header: '状态'
    }
  ]

  return (
    <Page title="部门管理" description="查看组织部门、负责人、层级关系和资源规模。">
      <PageSection contentClassName="grid gap-4 md:grid-cols-4">
        {departmentSummary.map(item => {
          const Icon = item.icon

          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle>{item.value}</CardTitle>
                </div>
                <Icon className="size-5 text-primary" />
              </CardHeader>
            </Card>
          )
        })}
      </PageSection>
      <PageSection>
        <Card>
          <CardContent className="flex flex-col gap-4 md:flex-row">
            <div
              className="w-full shrink-0 md:w-60 md:border-r md:pr-4"
              data-slot="department-tree"
            >
              <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">部门树</p>
              <div className="grid gap-0.5">
                <button
                  aria-current={selectedCode === null ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    selectedCode === null
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-foreground hover:bg-muted'
                  )}
                  onClick={() => setSelectedCode(null)}
                  type="button"
                >
                  <FolderTree className="size-3.5 shrink-0 text-muted-foreground" />
                  全部部门
                </button>
                {departmentTree.map(node => (
                  <DepartmentTreeNode
                    key={node.record.code}
                    node={node}
                    onSelect={setSelectedCode}
                    selectedCode={selectedCode}
                  />
                ))}
              </div>
            </div>
            <div className="min-w-0 flex-1" data-slot="department-table">
              <CTable<DepartmentRecord>
                columns={columns}
                data={visibleDepartments}
                getRowId={row => row.code}
              />
            </div>
          </CardContent>
        </Card>
      </PageSection>
    </Page>
  )
}

/**
 * 展示菜单配置、路由组件和权限编码。
 *
 * @returns 菜单管理页面。
 */
export function MenusPage() {
  const { data = emptyMenus } = useQuery(systemQueries.menus())
  const menuSummary = useMemo(() => {
    const visibleCount = data.filter(menu => menu.status === '显示').length
    const directoryCount = data.filter(menu => menu.type === '目录').length

    return [
      { icon: Route, label: '路由记录', value: data.length },
      { icon: FolderTree, label: '目录节点', value: directoryCount },
      { icon: SlidersHorizontal, label: '可见菜单', value: visibleCount }
    ]
  }, [data])

  return (
    <Page title="菜单管理" description="维护后台路由路径、页面组件、权限编码和层级关系。">
      <PageSection contentClassName="grid gap-4 md:grid-cols-3">
        {menuSummary.map(item => {
          const Icon = item.icon

          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle>{item.value}</CardTitle>
                </div>
                <Icon className="size-5 text-primary" />
              </CardHeader>
            </Card>
          )
        })}
      </PageSection>
      <PageSection>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>父级</TableHead>
                  <TableHead>路径</TableHead>
                  <TableHead>组件</TableHead>
                  <TableHead>权限</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(menu => (
                  <TableRow key={menu.path}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <SquareMenu className="size-4 text-primary" />
                        {menu.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={menu.type === '目录' ? 'outline' : 'secondary'}>
                        {menu.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{menu.parentName}</TableCell>
                    <TableCell>{menu.path}</TableCell>
                    <TableCell>{menu.component}</TableCell>
                    <TableCell>{menu.permission}</TableCell>
                    <TableCell>{menu.sort}</TableCell>
                    <TableCell>
                      <Badge variant={menu.status === '显示' ? 'default' : 'secondary'}>
                        {menu.status}
                      </Badge>
                      {menu.childrenCount > 0 ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {menu.childrenCount} 个子项
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageSection>
    </Page>
  )
}
