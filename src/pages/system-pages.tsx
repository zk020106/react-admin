import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  CircleMinus,
  FolderTree,
  KeyRound,
  Route,
  Search,
  Shield,
  SlidersHorizontal,
  SquareMenu,
  UserCheck,
  Users
} from 'lucide-react'

import { Page, PageSection } from '@/components/page'
import { systemQueries } from '@/pages/admin-queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
const userStatusFilters = ['全部', '启用', '复核中'] as const
const permissionLabels = [
  { label: '概览', value: 'overview:read' },
  { label: '工作台', value: 'workplace:read' },
  { label: '用户', value: 'system:user:read' },
  { label: '角色', value: 'system:role:read' },
  { label: '菜单', value: 'system:menu:read' },
  { label: '部门', value: 'system:department:read' },
  { label: '关于', value: 'about:read' }
]

/**
 * 展示用户账号、角色、部门和状态列表。
 *
 * @returns 用户管理页面。
 */
export function UsersPage() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof userStatusFilters)[number]>('全部')
  const { data = emptyUsers } = useQuery(systemQueries.users())
  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return data.filter(user => {
      const matchesStatus = statusFilter === '全部' || user.status === statusFilter
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        [user.name, user.email, user.role, user.department].some(value =>
          value.toLowerCase().includes(normalizedKeyword)
        )

      return matchesStatus && matchesKeyword
    })
  }, [data, keyword, statusFilter])
  const userSummary = useMemo(() => {
    const enabledCount = data.filter(user => user.status === '启用').length
    const reviewCount = data.filter(user => user.status === '复核中').length
    const riskCount = data.filter(user => user.riskLevel !== '低').length

    return [
      { icon: Users, label: '账号总数', value: data.length },
      { icon: UserCheck, label: '启用账号', value: enabledCount },
      { icon: Shield, label: '复核账号', value: reviewCount },
      { icon: SlidersHorizontal, label: '风险关注', value: riskCount }
    ]
  }, [data])

  return (
    <Page title="用户管理" description="查询用户账号、角色、部门、登录方式和风险状态。">
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="relative block lg:w-80" htmlFor="user-search-input">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <span className="sr-only">搜索用户</span>
                <Input
                  className="pl-8"
                  id="user-search-input"
                  onChange={event => setKeyword(event.target.value)}
                  placeholder="搜索姓名、邮箱、角色或部门"
                  value={keyword}
                />
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="账号状态筛选">
                {userStatusFilters.map(status => (
                  <Button
                    aria-pressed={statusFilter === status}
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    size="sm"
                    variant={statusFilter === status ? 'default' : 'outline'}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>登录方式</TableHead>
                  <TableHead>最近登录</TableHead>
                  <TableHead>风险</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.email}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.loginMethod}</TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <Badge variant={user.riskLevel === '高' ? 'destructive' : 'outline'}>
                        {user.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === '启用' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
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

/**
 * 展示角色编码、成员数量和权限说明。
 *
 * @returns 角色管理页面。
 */
export function RolesPage() {
  const { data = emptyRoles } = useQuery(systemQueries.roles())
  const roleSummary = useMemo(() => {
    const enabledCount = data.filter(role => role.status === '启用').length
    const permissionCount = new Set(data.flatMap(role => role.permissions)).size
    const memberCount = data.reduce((total, role) => total + role.memberCount, 0)

    return [
      { icon: Shield, label: '角色数量', value: data.length },
      { icon: Users, label: '授权成员', value: memberCount },
      { icon: KeyRound, label: '权限编码', value: permissionCount },
      { icon: CheckCircle2, label: '启用角色', value: enabledCount }
    ]
  }, [data])

  return (
    <Page title="角色管理" description="管理角色编码、成员数量、数据范围和页面级权限。">
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
      <PageSection contentClassName="grid gap-4 lg:grid-cols-3">
        {data.map(role => (
          <Card key={role.code}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <Badge variant={role.status === '启用' ? 'default' : 'secondary'}>
                  {role.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-muted-foreground">角色编码</span>
                <span className="font-medium">{role.code}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-muted-foreground">数据范围</span>
                <span className="font-medium">{role.dataScope}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-muted-foreground">成员数量</span>
                <span className="font-medium">{role.memberCount} 人</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </PageSection>
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>权限矩阵</CardTitle>
            <CardDescription>按角色展示后台页面级权限编码的授权状态。</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色</TableHead>
                  {permissionLabels.map(permission => (
                    <TableHead key={permission.value}>{permission.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(role => {
                  const permissionSet = new Set(role.permissions)

                  return (
                    <TableRow key={role.code}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      {permissionLabels.map(permission => {
                        const granted = permissionSet.has(permission.value)

                        return (
                          <TableCell key={permission.value}>
                            <span className="inline-flex items-center gap-1">
                              {granted ? (
                                <CheckCircle2 className="size-4 text-primary" />
                              ) : (
                                <CircleMinus className="size-4 text-muted-foreground" />
                              )}
                              <span className="sr-only">{granted ? '已授权' : '未授权'}</span>
                              <span className="text-xs text-muted-foreground">
                                {granted ? permission.value : '-'}
                              </span>
                            </span>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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

/**
 * 展示组织部门、负责人和成员数量。
 *
 * @returns 部门管理页面。
 */
export function DepartmentsPage() {
  const { data = emptyDepartments } = useQuery(systemQueries.departments())
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
      <PageSection contentClassName="grid gap-4 lg:grid-cols-3">
        {data.map(department => (
          <Card key={department.code}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{department.name}</CardTitle>
                  <CardDescription>{department.description}</CardDescription>
                </div>
                <Badge variant={department.status === '启用' ? 'default' : 'secondary'}>
                  {department.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-muted-foreground">负责人</span>
                <span className="font-medium">{department.leader}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-muted-foreground">上级部门</span>
                <span className="font-medium">{department.parent}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-muted-foreground">成员 / 项目</span>
                <span className="font-medium">
                  {department.memberCount} 人 / {department.projectCount} 项
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </PageSection>
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>组织明细</CardTitle>
            <CardDescription>展示部门编码、层级关系、负责人和资源规模。</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部门</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>上级</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>成员</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>子部门</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(department => (
                  <TableRow key={department.code}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.code}</TableCell>
                    <TableCell>{department.parent}</TableCell>
                    <TableCell>{department.leader}</TableCell>
                    <TableCell>{department.memberCount}</TableCell>
                    <TableCell>{department.projectCount}</TableCell>
                    <TableCell>{department.childrenCount}</TableCell>
                    <TableCell>
                      <Badge variant={department.status === '启用' ? 'default' : 'secondary'}>
                        {department.status}
                      </Badge>
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
