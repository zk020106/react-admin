import { useMutation, useQuery } from '@tanstack/react-query'
import { Tag } from 'antd'
import { useMemo, useState } from 'react'
import { Plus, Shield, SlidersHorizontal, UserCheck, Users } from 'lucide-react'

import { MCFormModal, MCSearchForm, MCTable } from '@/components/mc'
import type { MCFormField, MCTableAction, MCTableColumn } from '@/components/mc'
import { HasPermission } from '@/components/has-permission'
import { Page, PageSection } from '@/components/page'
import { userMutations } from '@/pages/admin-mutations'
import { systemQueries } from '@/pages/admin-queries'
import { AdminConfigProvider } from '@/theme/antd-theme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { UserInput, UserRecord } from '@/mock/admin-mock'

const emptyUsers: UserRecord[] = []

// MC 组件层：使用 fields 配置代替 schema
const userSearchFields: MCFormField[] = [
  {
    component: 'input',
    componentProps: { allowClear: true, placeholder: '搜索姓名、邮箱、角色或部门' },
    label: '关键词',
    name: 'keyword',
    span: 12
  },
  {
    component: 'select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '全部', value: '全部' },
        { label: '启用', value: '启用' },
        { label: '复核中', value: '复核中' }
      ],
      placeholder: '账号状态'
    },
    defaultValue: '全部',
    label: '账号状态',
    name: 'status',
    span: 6
  }
]

const userFormFields: MCFormField[] = [
  {
    component: 'input',
    label: '姓名',
    name: 'name',
    required: true
  },
  {
    component: 'input',
    label: '邮箱',
    name: 'email',
    required: '请输入有效的邮箱',
    rules: [{ message: '邮箱格式不正确', type: 'email' }]
  },
  {
    component: 'input',
    label: '角色',
    name: 'role',
    required: true
  },
  {
    component: 'input',
    label: '部门',
    name: 'department',
    required: true
  },
  {
    component: 'select',
    componentProps: { options: [{ value: '启用' }, { value: '复核中' }, { value: '停用' }] },
    defaultValue: '启用',
    label: '状态',
    name: 'status'
  },
  {
    component: 'select',
    componentProps: { options: [{ value: '低' }, { value: '中' }, { value: '高' }] },
    defaultValue: '低',
    label: '风险等级',
    name: 'riskLevel'
  }
]

/**
 * 展示用户账号、角色、部门和状态列表（使用 MC 组件层）。
 *
 * @returns 用户管理页面（MC 版本）。
 */
export function UsersPageMC() {
  const [filters, setFilters] = useState({ keyword: '', status: '全部' })
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord>()

  const usersQuery = useQuery(systemQueries.users())
  const { data = emptyUsers, isLoading } = usersQuery
  const createMutation = useMutation(userMutations.create())
  const updateMutation = useMutation(userMutations.update())
  const removeMutation = useMutation(userMutations.remove())

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = filters.keyword.trim().toLowerCase()

    return data.filter(user => {
      const matchesStatus = filters.status === '全部' || user.status === filters.status
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        [user.name, user.email, user.role, user.department].some(value =>
          value.toLowerCase().includes(normalizedKeyword)
        )

      return matchesStatus && matchesKeyword
    })
  }, [data, filters])

  const userSummary = useMemo(() => {
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

  const columns: MCTableColumn<UserRecord>[] = [
    { dataIndex: 'name', key: 'name', title: '姓名' },
    { dataIndex: 'email', key: 'email', title: '邮箱' },
    { dataIndex: 'role', key: 'role', title: '角色' },
    { dataIndex: 'department', key: 'department', title: '部门' },
    { dataIndex: 'loginMethod', key: 'loginMethod', title: '登录方式' },
    { dataIndex: 'lastLogin', key: 'lastLogin', title: '最近登录' },
    {
      columnLabel: '风险',
      key: 'riskLevel',
      render: (_, record) => (
        <Tag
          color={record.riskLevel === '高' ? 'red' : record.riskLevel === '中' ? 'gold' : 'default'}
        >
          {record.riskLevel}
        </Tag>
      ),
      title: '风险'
    },
    {
      columnLabel: '状态',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.status === '启用' ? 'blue' : 'default'}>{record.status}</Tag>
      ),
      title: '状态'
    }
  ]

  const userActions: MCTableAction<UserRecord>[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: record => {
        setEditingUser(record)
        setFormOpen(true)
      },
      permission: 'system:user:update'
    },
    {
      confirm: { danger: true, okText: '确认删除', title: '确认删除该用户？' },
      danger: true,
      key: 'delete',
      label: '删除',
      onClick: record => removeMutation.mutateAsync(record.id),
      permission: 'system:user:delete'
    }
  ]

  function openCreate() {
    setEditingUser(undefined)
    setFormOpen(true)
  }

  async function handleSubmit(input: UserInput) {
    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, input })
    } else {
      await createMutation.mutateAsync(input)
    }
  }

  const formInitialValues = editingUser
    ? {
        department: editingUser.department,
        email: editingUser.email,
        name: editingUser.name,
        riskLevel: editingUser.riskLevel,
        role: editingUser.role,
        status: editingUser.status
      }
    : undefined

  return (
    <AdminConfigProvider>
      <Page title="用户管理 (MC)" description="使用 MC 组件层的用户管理页面示例。">
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
              <MCSearchForm
                defaultValues={filters}
                fields={userSearchFields}
                onReset={() => setFilters({ keyword: '', status: '全部' })}
                onSearch={values =>
                  setFilters({
                    keyword: typeof values.keyword === 'string' ? values.keyword : '',
                    status: typeof values.status === 'string' ? values.status : '全部'
                  })
                }
              />
              <MCTable<UserRecord>
                actionColumn={{ width: 140 }}
                actions={userActions}
                columns={columns}
                dataSource={filteredUsers}
                loading={isLoading}
                onRefresh={async () => {
                  await usersQuery.refetch()
                }}
                persistKey="mc:users-page:table"
                rowKey="id"
                tools={{ columns: true, density: true, refresh: true }}
                toolbar={
                  <HasPermission permission="system:user:create">
                    <Button onClick={openCreate} size="sm">
                      <Plus className="mr-1 size-4" />
                      新增用户
                    </Button>
                  </HasPermission>
                }
              />
            </CardContent>
          </Card>
        </PageSection>
      </Page>

      <MCFormModal<UserInput>
        fields={userFormFields}
        initialValues={formInitialValues}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        open={formOpen}
        title={editingUser ? '编辑用户' : '新增用户'}
      />
    </AdminConfigProvider>
  )
}
