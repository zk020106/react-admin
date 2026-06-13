import { useQuery } from '@tanstack/react-query'
import { Button, Space, Table, type TableProps } from 'antd'
import { Plus, RefreshCw, Settings } from 'lucide-react'
import { useCallback, useMemo, useState, type Key } from 'react'

import { MCSearchForm } from '@/components/mc'
import type { MCFormField } from '@/components/mc'
import { Page } from '@/components/page'
import { useTable } from '@/hooks/use-table'
import { systemQueries } from '@/pages/admin-queries'
import type { DepartmentRecord } from '@/mock/admin-mock'

type DepartmentTableFilters = {
  name?: unknown
} & Record<string, unknown>

interface DepartmentTreeRecord extends DepartmentRecord {
  children?: DepartmentTreeRecord[]
}

interface DepartmentRelations {
  childrenByParent: Map<string, DepartmentRecord[]>
  departmentByName: Map<string, DepartmentRecord>
}

// 构建树形数据
const buildDepartmentTree = (departments: DepartmentRecord[]): DepartmentTreeRecord[] => {
  const map: Record<string, DepartmentTreeRecord> = {}
  const roots: DepartmentTreeRecord[] = []

  departments.forEach(dept => {
    map[dept.name] = { ...dept, children: [] }
  })

  departments.forEach(dept => {
    const node = map[dept.name]
    if (dept.parent === '-') {
      roots.push(node)
    } else {
      const parent = map[dept.parent]
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      }
    }
  })

  return roots
}

function normalizeKeyword(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function buildDepartmentRelations(departments: DepartmentRecord[]): DepartmentRelations {
  const childrenByParent = new Map<string, DepartmentRecord[]>()
  const departmentByName = new Map<string, DepartmentRecord>()

  departments.forEach(department => {
    departmentByName.set(department.name, department)

    if (department.parent !== '-') {
      const children = childrenByParent.get(department.parent) ?? []
      children.push(department)
      childrenByParent.set(department.parent, children)
    }
  })

  return { childrenByParent, departmentByName }
}

function departmentMatchesFilters(department: DepartmentRecord, filters: DepartmentTableFilters) {
  const name = normalizeKeyword(filters.name)

  if (
    name &&
    ![
      department.name,
      department.code,
      department.description,
      department.leader,
      department.parent,
      department.status
    ].some(value => normalizeKeyword(value).includes(name))
  ) {
    return false
  }

  return true
}

function hasMatchingDepartmentAncestor(
  department: DepartmentRecord,
  filters: DepartmentTableFilters,
  { departmentByName }: DepartmentRelations
) {
  let parentName = department.parent

  while (parentName && parentName !== '-') {
    const parent = departmentByName.get(parentName)

    if (!parent) {
      return false
    }

    if (departmentMatchesFilters(parent, filters)) {
      return true
    }

    parentName = parent.parent
  }

  return false
}

function hasMatchingDepartmentDescendant(
  department: DepartmentRecord,
  filters: DepartmentTableFilters,
  relations: DepartmentRelations
): boolean {
  const children = relations.childrenByParent.get(department.name) ?? []

  return children.some(
    child =>
      departmentMatchesFilters(child, filters) ||
      hasMatchingDepartmentDescendant(child, filters, relations)
  )
}

function departmentMatchesTreeFilters(
  department: DepartmentRecord,
  filters: DepartmentTableFilters,
  relations: DepartmentRelations
) {
  return (
    departmentMatchesFilters(department, filters) ||
    hasMatchingDepartmentAncestor(department, filters, relations) ||
    hasMatchingDepartmentDescendant(department, filters, relations)
  )
}

function hasDepartmentSearch(filters: DepartmentTableFilters) {
  return Boolean(normalizeKeyword(filters.name))
}

function collectDepartmentTreeKeys(nodes: DepartmentTreeRecord[]) {
  const keys: Key[] = []

  nodes.forEach(node => {
    keys.push(node.name)

    if (node.children) {
      keys.push(...collectDepartmentTreeKeys(node.children))
    }
  })

  return keys
}

// 搜索表单字段
const searchFields: MCFormField[] = [
  {
    component: 'input',
    componentProps: { allowClear: true, placeholder: '搜索名称' },
    label: '名称',
    name: 'name',
    span: 6
  }
]

export function DepartmentsPage() {
  const [expandedKeys, setExpandedKeys] = useState<Key[] | undefined>(undefined)

  const departmentsQuery = useQuery(systemQueries.departments())
  const { data: departments = [], isLoading } = departmentsQuery

  const departmentRelations = useMemo(() => buildDepartmentRelations(departments), [departments])
  const filterDepartments = useCallback(
    (record: DepartmentRecord, filters: DepartmentTableFilters) =>
      departmentMatchesTreeFilters(record, filters, departmentRelations),
    [departmentRelations]
  )
  const departmentsTable = useTable<DepartmentRecord, DepartmentTableFilters>({
    dataSource: departments,
    filter: filterDepartments
  })
  const treeData = useMemo(
    () => buildDepartmentTree(departmentsTable.filteredData),
    [departmentsTable.filteredData]
  )
  const searchExpandedKeys = useMemo(() => collectDepartmentTreeKeys(treeData), [treeData])
  const tableExpandedKeys = hasDepartmentSearch(departmentsTable.filters)
    ? searchExpandedKeys
    : (expandedKeys ?? searchExpandedKeys)

  const handleSearch = (values: Record<string, unknown>) => {
    departmentsTable.search(values)
  }

  const handleReset = () => {
    setExpandedKeys(undefined)
    departmentsTable.reset()
  }

  const columns: TableProps<DepartmentTreeRecord>['columns'] = [
    {
      dataIndex: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">🏢</span>
          <span className="font-medium">{name}</span>
        </div>
      ),
      title: '名称'
    },
    {
      dataIndex: 'status',
      render: (status: string) => (
        <span
          className={`inline-flex items-center gap-1 ${
            status === '启用' ? 'text-green-500' : 'text-gray-500'
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
      dataIndex: 'description',
      ellipsis: true,
      title: '描述'
    },
    {
      align: 'right',
      dataIndex: 'childrenCount',
      render: (count: number) => `${count} 个`,
      title: '子部门',
      width: 100
    },
    {
      dataIndex: 'name',
      render: () => '2025-08-29 20:07:19',
      title: '创建时间',
      width: 180
    },
    {
      fixed: 'right',
      render: () => (
        <Space size="small">
          <Button size="small" type="link">
            修改
          </Button>
          <Button danger size="small" type="link">
            删除
          </Button>
          <Button size="small" type="link">
            详情
          </Button>
        </Space>
      ),
      title: '操作',
      width: 180
    }
  ]

  return (
    <Page>
      <div className="flex min-h-0 flex-col gap-4">
        {/* 顶部标签页和搜索 */}
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <div className="flex gap-2">
            <Button size="small" type="primary">
              全部部门
            </Button>
            <Button size="small">组织部门树</Button>
          </div>
        </div>

        <MCSearchForm
          fields={searchFields}
          mode="auto"
          onReset={handleReset}
          onSearch={handleSearch}
        />

        {/* 表格区域 */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button icon={<Plus className="size-4" />} type="primary">
                新增
              </Button>
              <Button icon={<RefreshCw className="size-4" />}>导出</Button>
            </div>
            <div className="flex gap-2">
              <Button icon={<RefreshCw className="size-4" />} size="small" type="text" />
              <Button icon={<Settings className="size-4" />} size="small" type="text" />
              <Button icon={<Settings className="size-4" />} size="small" type="text" />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <Table
              columns={columns}
              dataSource={treeData}
              expandable={{
                defaultExpandAllRows: true,
                expandedRowKeys: tableExpandedKeys,
                onExpandedRowsChange: keys => setExpandedKeys([...keys])
              }}
              loading={isLoading}
              pagination={false}
              rowKey="name"
              size="small"
            />
          </div>
        </div>
      </div>
    </Page>
  )
}
