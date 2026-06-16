import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Space, Table, type TableProps } from 'antd'
import { Plus, RefreshCw, Settings } from 'lucide-react'
import { useCallback, useMemo, useState, type Key } from 'react'

import { MCSearchForm } from '@/components/mc'
import type { MCFormField } from '@/components/mc'
import { useTable } from '@/hooks/use-table'
import { Page } from '@/components/page'
import { systemQueries } from '@/pages/admin-queries'
import type { MenuManagementRecord } from '@/mock/admin-mock'
import { normalizeKeyword } from '@/utils/filter'

type MenuTableFilters = {
  menuCode?: unknown
  menuTitle?: unknown
  permission?: unknown
} & Record<string, unknown>

interface MenuTreeRecord extends MenuManagementRecord {
  children?: MenuTreeRecord[]
}

interface MenuRelations {
  childrenByParent: Map<string, MenuManagementRecord[]>
  menuByName: Map<string, MenuManagementRecord>
}

// 构建树形数据
const buildMenuTree = (menus: MenuManagementRecord[]): MenuTreeRecord[] => {
  const map: Record<string, MenuTreeRecord> = {}
  const roots: MenuTreeRecord[] = []

  menus.forEach(menu => {
    map[menu.name] = { ...menu, children: [] }
  })

  menus.forEach(menu => {
    const node = map[menu.name]
    if (menu.parentName === '-') {
      roots.push(node)
    } else {
      const parent = map[menu.parentName]
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      }
    }
  })

  return roots
}

function buildMenuRelations(menus: MenuManagementRecord[]): MenuRelations {
  const childrenByParent = new Map<string, MenuManagementRecord[]>()
  const menuByName = new Map<string, MenuManagementRecord>()

  menus.forEach(menu => {
    menuByName.set(menu.name, menu)

    if (menu.parentName !== '-') {
      const children = childrenByParent.get(menu.parentName) ?? []
      children.push(menu)
      childrenByParent.set(menu.parentName, children)
    }
  })

  return { childrenByParent, menuByName }
}

function menuMatchesFilters(menu: MenuManagementRecord, filters: MenuTableFilters) {
  const menuTitle = normalizeKeyword(filters.menuTitle)
  const menuCode = normalizeKeyword(filters.menuCode)
  const permission = normalizeKeyword(filters.permission)

  if (menuTitle && !normalizeKeyword(menu.name).includes(menuTitle)) {
    return false
  }

  if (
    menuCode &&
    ![menu.path, menu.component, menu.name, menu.parentName, menu.type].some(value =>
      normalizeKeyword(value).includes(menuCode)
    )
  ) {
    return false
  }

  if (permission && !normalizeKeyword(menu.permission).includes(permission)) {
    return false
  }

  return true
}

function hasMatchingMenuAncestor(
  menu: MenuManagementRecord,
  filters: MenuTableFilters,
  { menuByName }: MenuRelations
) {
  let parentName = menu.parentName

  while (parentName && parentName !== '-') {
    const parent = menuByName.get(parentName)

    if (!parent) {
      return false
    }

    if (menuMatchesFilters(parent, filters)) {
      return true
    }

    parentName = parent.parentName
  }

  return false
}

function hasMatchingMenuDescendant(
  menu: MenuManagementRecord,
  filters: MenuTableFilters,
  relations: MenuRelations
): boolean {
  const children = relations.childrenByParent.get(menu.name) ?? []

  return children.some(
    child =>
      menuMatchesFilters(child, filters) || hasMatchingMenuDescendant(child, filters, relations)
  )
}

function menuMatchesTreeFilters(
  menu: MenuManagementRecord,
  filters: MenuTableFilters,
  relations: MenuRelations
) {
  return (
    menuMatchesFilters(menu, filters) ||
    hasMatchingMenuAncestor(menu, filters, relations) ||
    hasMatchingMenuDescendant(menu, filters, relations)
  )
}

function hasMenuSearch(filters: MenuTableFilters) {
  return Boolean(
    normalizeKeyword(filters.menuTitle) ||
    normalizeKeyword(filters.menuCode) ||
    normalizeKeyword(filters.permission)
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

function collectMenuTreeKeys(nodes: MenuTreeRecord[]) {
  const keys: Key[] = []

  nodes.forEach(node => {
    keys.push(node.name)

    if (node.children) {
      keys.push(...collectMenuTreeKeys(node.children))
    }
  })

  return keys
}

// 搜索表单字段
const searchFields: MCFormField[] = [
  {
    component: 'input',
    componentProps: { allowClear: true, placeholder: '搜索菜单标题' },
    label: '菜单标题',
    name: 'menuTitle',
    span: 6
  },
  {
    component: 'input',
    componentProps: { allowClear: true, placeholder: '搜索菜单编码' },
    label: '菜单编码',
    name: 'menuCode',
    span: 6
  },
  {
    component: 'input',
    componentProps: { allowClear: true, placeholder: '搜索权限标识' },
    label: '权限标识',
    name: 'permission',
    span: 6
  }
]

export function MenusPage() {
  const [expandedKeys, setExpandedKeys] = useState<Key[] | undefined>(undefined)

  const menusQuery = useQuery(systemQueries.menus())
  const { data: menus = [], isLoading } = menusQuery

  const menuRelations = useMemo(() => buildMenuRelations(menus), [menus])
  const filterMenus = useCallback(
    (record: MenuManagementRecord, filters: MenuTableFilters) =>
      menuMatchesTreeFilters(record, filters, menuRelations),
    [menuRelations]
  )
  const menusTable = useTable<MenuManagementRecord, MenuTableFilters>({
    dataSource: menus,
    filter: filterMenus
  })
  const treeData = useMemo(() => buildMenuTree(menusTable.filteredData), [menusTable.filteredData])
  const searchExpandedKeys = useMemo(() => collectMenuTreeKeys(treeData), [treeData])
  const tableExpandedKeys = hasMenuSearch(menusTable.filters)
    ? searchExpandedKeys
    : (expandedKeys ?? searchExpandedKeys)

  const handleSearch = (values: Record<string, unknown>) => {
    menusTable.search(values)
  }

  const handleReset = () => {
    setExpandedKeys(undefined)
    menusTable.reset()
  }

  const columns: TableProps<MenuTreeRecord>['columns'] = [
    {
      dataIndex: 'name',
      render: (name: string, record) => (
        <div className="flex items-center gap-2">
          <span className={record.type === '按钮' ? 'text-purple-500' : 'text-primary'}>
            {record.type === '目录' ? '📁' : record.type === '菜单' ? '📄' : '🔘'}
          </span>
          <span className="font-medium">{name}</span>
        </div>
      ),
      title: '菜单标题',
      width: 200
    },
    {
      dataIndex: 'type',
      render: (type: string) => (
        <Badge color={getMenuTypeColor(type as MenuManagementRecord['type'])} text={type} />
      ),
      title: '类型',
      width: 80
    },
    {
      dataIndex: 'status',
      render: (status: string) => (
        <span
          className={`inline-flex items-center gap-1 ${
            status === '显示' ? 'text-green-500' : 'text-gray-500'
          }`}
        >
          <span className="size-2 rounded-full bg-current" />
          {status}
        </span>
      ),
      title: '状态',
      width: 80
    },
    {
      dataIndex: 'path',
      ellipsis: true,
      title: '路由地址',
      width: 150
    },
    {
      dataIndex: 'component',
      ellipsis: true,
      title: '组件名称',
      width: 120
    },
    {
      dataIndex: 'component',
      ellipsis: true,
      render: (component: string) => `src/pages/${component}`,
      title: '组件路径',
      width: 150
    },
    {
      dataIndex: 'permission',
      ellipsis: true,
      title: '权限标识',
      width: 150
    },
    {
      align: 'center',
      dataIndex: 'external',
      render: () => (
        <div className="inline-flex size-5 items-center justify-center rounded bg-red-500/10 text-xs text-red-500">
          否
        </div>
      ),
      title: '外链',
      width: 60
    },
    {
      align: 'center',
      dataIndex: 'hidden',
      render: () => (
        <div className="inline-flex size-5 items-center justify-center rounded bg-red-500/10 text-xs text-red-500">
          否
        </div>
      ),
      title: '隐藏',
      width: 60
    },
    {
      align: 'center',
      dataIndex: 'cache',
      render: () => (
        <div className="inline-flex size-5 items-center justify-center rounded bg-blue-500/10 text-xs text-blue-500">
          是
        </div>
      ),
      title: '缓存',
      width: 60
    },
    {
      dataIndex: 'sort',
      render: () => `2025-08-29 20:07:19`,
      title: '创建时间',
      width: 160
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
      width: 160
    }
  ]

  return (
    <Page>
      <div className="flex min-h-0 flex-col gap-4">
        {/* 顶部搜索栏 */}
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
              <Button className="text-orange-500" icon={<RefreshCw className="size-4" />}>
                清除缓存
              </Button>
            </div>
            <div className="flex gap-2">
              <Button icon={<Settings className="size-4" />} size="small" type="text" />
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
              scroll={{ x: 1500 }}
              size="small"
            />
          </div>
        </div>
      </div>
    </Page>
  )
}
