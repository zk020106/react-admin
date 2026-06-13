import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Input, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type Key } from 'react'

import { confirmDelete } from '@/components/admin/popup'
import { MCSearchForm, MCTable } from '@/components/mc'
import type { MCFormField, MCTableColumn } from '@/components/mc'
import { Page } from '@/components/page'
import { PageLayout } from '@/components/page-layout'
import { useTable } from '@/hooks/use-table'
import { systemQueries } from '@/pages/admin-queries'
import { userMutations } from '@/pages/admin-mutations'
import { useUserDetailDrawer } from '@/pages/user-detail-drawer'
import { useUserFormDrawer } from '@/pages/user-form-drawer'
import type { DepartmentRecord, UserRecord } from '@/mock/admin-mock'

type UserTableFilters = {
  dateRange?: unknown
  searchText?: unknown
  status?: unknown
  userNameOrEmail?: unknown
} & Record<string, unknown>

const orgCompanyGroups = [
  {
    departments: ['平台部', '研发部', '产品部', '数据部', 'UI部', '安全部'],
    key: 'company-huaxin',
    title: '华信云科集团'
  },
  {
    departments: ['运营部', '财务部', '人事部', '运维部'],
    key: 'company-lingyuan',
    title: '凌远运营中心'
  }
] as const

function compactTreeNode(node: DataNode): DataNode {
  const children = node.children?.map(compactTreeNode)

  if (children?.length) {
    return { ...node, children }
  }

  return { key: node.key, title: node.title }
}

function buildDepartmentTreeData(departments: DepartmentRecord[]): DataNode[] {
  const nodeByName = new Map<string, DataNode>()

  departments.forEach(department => {
    nodeByName.set(department.name, {
      children: [],
      key: department.code,
      title: department.name
    })
  })

  departments.forEach(department => {
    if (department.parent === '-') {
      return
    }

    const node = nodeByName.get(department.name)
    const parent = nodeByName.get(department.parent)

    if (node && parent) {
      parent.children = [...(parent.children ?? []), node]
    }
  })

  return orgCompanyGroups.map(company => ({
    children: company.departments.flatMap(departmentName => {
      const node = nodeByName.get(departmentName)
      return node ? [compactTreeNode(node)] : []
    }),
    key: company.key,
    title: company.title
  }))
}

function getTreeNodeTitle(node: DataNode) {
  if (typeof node.title === 'string') {
    return node.title
  }
  if (node.title === null || node.title === undefined) {
    return ''
  }
  return String(node.title)
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

function filterTreeData(nodes: DataNode[], keyword: string): DataNode[] {
  const normalized = normalizeKeyword(keyword)

  if (!normalized) {
    return nodes
  }

  return nodes.flatMap(node => {
    const title = getTreeNodeTitle(node)
    const children = node.children ? filterTreeData(node.children, keyword) : []

    if (title.toLowerCase().includes(normalized)) {
      return [{ ...node }]
    }

    if (children.length > 0) {
      return [{ ...node, children }]
    }

    return []
  })
}

function collectTreeKeys(nodes: DataNode[]) {
  const keys: Key[] = []

  nodes.forEach(node => {
    keys.push(node.key)

    if (node.children) {
      keys.push(...collectTreeKeys(node.children))
    }
  })

  return keys
}

function findTreeNode(nodes: DataNode[], key: Key): DataNode | undefined {
  for (const node of nodes) {
    if (String(node.key) === String(key)) {
      return node
    }

    if (node.children) {
      const matched = findTreeNode(node.children, key)

      if (matched) {
        return matched
      }
    }
  }

  return undefined
}

function collectTreeTitles(nodes: DataNode[]) {
  const titles: string[] = []

  nodes.forEach(node => {
    titles.push(getTreeNodeTitle(node))

    if (node.children) {
      titles.push(...collectTreeTitles(node.children))
    }
  })

  return titles
}

function getMatchedDepartmentTitles(nodes: DataNode[], keyword: string) {
  const normalized = normalizeKeyword(keyword)

  if (!normalized) {
    return []
  }

  const titles: string[] = []

  nodes.forEach(node => {
    const nodeTitle = getTreeNodeTitle(node)

    if (normalizeKeyword(nodeTitle).includes(normalized)) {
      titles.push(...collectTreeTitles([node]))
      return
    }

    if (node.children) {
      titles.push(...getMatchedDepartmentTitles(node.children, keyword))
    }
  })

  return titles
}

function toTimestamp(value: unknown) {
  if (value == null) {
    return undefined
  }

  if (typeof value === 'object' && 'valueOf' in value && typeof value.valueOf === 'function') {
    const timestamp = Number(value.valueOf())

    if (Number.isFinite(timestamp)) {
      return timestamp
    }
  }

  const timestamp = Date.parse(String(value).replace(' ', 'T'))
  return Number.isFinite(timestamp) ? timestamp : undefined
}

function userMatchesFilters(
  record: UserRecord,
  filters: UserTableFilters,
  selectedDepartments: ReadonlySet<string>,
  searchedDepartments: ReadonlySet<string>
) {
  const departmentKeyword = normalizeKeyword(filters.searchText)
  const userKeyword = normalizeKeyword(filters.userNameOrEmail)
  const status = normalizeKeyword(filters.status)

  if (selectedDepartments.size > 0 && !selectedDepartments.has(record.department)) {
    return false
  }

  if (
    departmentKeyword &&
    !normalizeKeyword(record.department).includes(departmentKeyword) &&
    !searchedDepartments.has(record.department)
  ) {
    return false
  }

  if (
    userKeyword &&
    ![record.name, record.account, record.email, record.id, record.phone].some(value => {
      const strValue = typeof value === 'string' ? value : String(value)
      return normalizeKeyword(strValue).includes(userKeyword)
    })
  ) {
    return false
  }

  if (status && normalizeKeyword(record.status) !== status) {
    return false
  }

  if (Array.isArray(filters.dateRange)) {
    const [startValue, endValue] = filters.dateRange
    const start = toTimestamp(startValue)
    const end = toTimestamp(endValue)
    const recordTime = toTimestamp(record.lastLogin)

    if (!recordTime) {
      return false
    }

    if (start && recordTime < start) {
      return false
    }

    if (end && recordTime > end) {
      return false
    }
  }

  return true
}

// 搜索表单字段
const searchFields: MCFormField[] = [
  {
    component: 'input',
    componentProps: { allowClear: true, placeholder: '搜索部门/公司' },
    label: '部门/公司',
    name: 'searchText',
    span: 6
  },
  {
    component: 'input',
    componentProps: { allowClear: true, placeholder: '用户名/邮箱/编号' },
    label: '用户信息',
    name: 'userNameOrEmail',
    span: 6
  },
  {
    component: 'select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '启用', value: '启用' },
        { label: '停用', value: '停用' },
        { label: '复核中', value: '复核中' }
      ],
      placeholder: '系统状态全部'
    },
    label: '状态',
    name: 'status',
    span: 6
  },
  {
    component: 'date-range',
    componentProps: { placeholder: ['创建时间', '结束时间'] },
    label: '创建时间',
    name: 'dateRange',
    span: 6
  }
]

export function UsersPage() {
  const [selectedOrg, setSelectedOrg] = useState<Key[]>([])
  const [orgExpandedKeys, setOrgExpandedKeys] = useState<Key[]>([])
  const [orgSearch, setOrgSearch] = useState('')

  const usersQuery = useQuery(systemQueries.users())
  const { data: users = [], isLoading } = usersQuery
  const departmentsQuery = useQuery(systemQueries.departments())
  const { data: departments = [] } = departmentsQuery
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
  const { drawer: userDetailDrawer, open: openDetail } = useUserDetailDrawer()
  const orgTreeData = useMemo(() => buildDepartmentTreeData(departments), [departments])
  const allOrgKeys = useMemo(() => collectTreeKeys(orgTreeData), [orgTreeData])
  const filteredOrgTreeData = useMemo(
    () => filterTreeData(orgTreeData, orgSearch),
    [orgSearch, orgTreeData]
  )
  const orgSearchExpandedKeys = useMemo(
    () => collectTreeKeys(filteredOrgTreeData),
    [filteredOrgTreeData]
  )
  const treeExpandedKeys = orgSearch ? orgSearchExpandedKeys : orgExpandedKeys
  const selectedDepartmentSet = useMemo(() => {
    const titles = selectedOrg.flatMap(key => {
      const node = findTreeNode(orgTreeData, key)
      return node ? collectTreeTitles([node]) : []
    })

    return new Set(titles)
  }, [orgTreeData, selectedOrg])
  const filterUsers = useCallback(
    (record: UserRecord, filters: UserTableFilters) =>
      userMatchesFilters(
        record,
        filters,
        selectedDepartmentSet,
        new Set(getMatchedDepartmentTitles(orgTreeData, String(filters.searchText ?? '')))
      ),
    [orgTreeData, selectedDepartmentSet]
  )
  const usersTable = useTable<UserRecord, UserTableFilters>({
    dataSource: users,
    filter: filterUsers
  })

  const handleSearch = (values: Record<string, unknown>) => {
    usersTable.search(values)
  }

  const handleReset = () => {
    setSelectedOrg([])
    usersTable.reset()
  }

  const handleOrgSelect = (keys: Key[]) => {
    setSelectedOrg(keys)
    usersTable.setPage(1)
  }

  useEffect(() => {
    setSelectedOrg(keys =>
      keys.filter(key => allOrgKeys.some(orgKey => String(orgKey) === String(key)))
    )
  }, [allOrgKeys])

  useEffect(() => {
    if (departments.length > 0) {
      setOrgExpandedKeys(allOrgKeys)
    }
  }, [allOrgKeys, departments.length])

  const columns: MCTableColumn<UserRecord>[] = [
    {
      align: 'center',
      columnLabel: '序号',
      key: 'index',
      render: (_, __, index) => index + 1,
      title: '序号',
      width: 60
    },
    {
      columnLabel: '用户',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            {name[0]}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{record.email}</span>
          </div>
        </div>
      ),
      title: '用户',
      width: 200
    },
    {
      columnLabel: '用户名',
      dataIndex: 'account',
      key: 'account',
      title: '用户名',
      width: 120
    },
    {
      columnLabel: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span
          className={`inline-flex items-center gap-1 ${
            status === '启用' ? 'text-green-500' : 'text-orange-500'
          }`}
        >
          <span className="size-2 rounded-full bg-current" />
          {status}
        </span>
      ),
      title: '状态',
      width: 100
    },
    {
      columnLabel: '性别',
      dataIndex: 'gender',
      key: 'gender',
      title: '性别',
      width: 80
    },
    {
      columnLabel: '所属部门',
      dataIndex: 'department',
      key: 'department',
      title: '所属部门',
      width: 150
    },
    {
      columnLabel: '角色',
      dataIndex: 'role',
      key: 'role',
      title: '角色',
      width: 120
    },
    {
      columnLabel: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      title: '手机号',
      width: 130
    },
    {
      columnLabel: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
      key: 'email',
      title: '邮箱',
      width: 180
    },
    {
      columnLabel: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      key: 'remark',
      title: '备注'
    },
    {
      columnLabel: '创建时间',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      title: '创建时间',
      width: 180
    }
  ]

  return (
    <Page>
      <PageLayout
        autoCollapse
        collapseBreakpoint={1024}
        collapsible
        left={
          <div className="flex h-full min-h-0 flex-col gap-3 p-4">
            <div className="shrink-0">
              <Input
                allowClear
                onChange={event => setOrgSearch(event.target.value)}
                placeholder="搜索部门/公司"
                prefix={<Search className="size-4" />}
                size="small"
                value={orgSearch}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border/60 bg-background/40 p-2">
              <Tree
                expandedKeys={treeExpandedKeys}
                onExpand={keys => setOrgExpandedKeys([...keys])}
                onSelect={handleOrgSelect}
                selectedKeys={selectedOrg}
                showLine
                treeData={filteredOrgTreeData}
              />
            </div>
          </div>
        }
        leftStyle={{
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--card)'
        }}
        leftWidth={280}
        resizable
        toolbar={
          <>
            <Button icon={<Plus className="size-4" />} onClick={openCreate} type="primary">
              新增用户
            </Button>
            <Button>导入</Button>
          </>
        }
      >
        {/* 搜索表单 */}
        <MCSearchForm fields={searchFields} onReset={handleReset} onSearch={handleSearch} />

        {/* 表格 */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card p-4">
          <MCTable
            actions={[
              {
                label: '详情',
                onClick: openDetail,
                type: 'link'
              },
              {
                label: '修改',
                onClick: openEdit,
                type: 'link'
              },
              {
                danger: true,
                label: '删除',
                onClick: async record => {
                  const confirmed = await confirmDelete(
                    '确认删除',
                    `确定要删除用户"${record.name}"吗？`
                  )
                  if (confirmed) {
                    await removeMutation.mutateAsync(record.id)
                  }
                },
                type: 'link'
              }
            ]}
            columns={columns}
            dataSource={usersTable.pagedData}
            loading={isLoading}
            pagination={{
              current: usersTable.pagination.current,
              onChange: usersTable.setPage,
              pageSize: usersTable.pagination.pageSize,
              showQuickJumper: true,
              showSizeChanger: true,
              showTotal: total => `共 ${total} 条`,
              total: usersTable.total
            }}
            persistKey="users-table"
            rowKey="id"
            scroll={{ x: 1600 }}
            size="small"
            toolbar={{
              columnSetting: true,
              onRefresh: () => usersQuery.refetch(),
              refresh: true
            }}
          />
        </div>
      </PageLayout>
      {userFormDrawer}
      {userDetailDrawer}
    </Page>
  )
}
