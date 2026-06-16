import { Button, Dropdown, Segmented, Space, Table, Tooltip, type TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { TableRowSelection } from 'antd/es/table/interface'
import { Columns3, RefreshCw, Rows3, Settings2, X, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type Key } from 'react'

import { usePermissions } from '@/components/has-permission'
import { cn } from '@/lib/utils'
import { buildActionColumn } from './action-column'
import { ColumnSettingPanel } from './column-setting-panel'
import type { MCTableColumn, MCTableProps, MCTableBatchContext } from './types'
import { useColumnState } from './use-column-state'

type TableSize = NonNullable<TableProps<AnyObject>['size']>

interface MCActionColumnCompact {
  title?: string
  width?: number
}

/** MCTable 组件 - 基于 Ant Design Table 的封装。
 *
 * 特性：
 * 1. 完全继承 Ant Design Table 的所有原生属性
 * 2. 强类型操作列（permission 过滤 / 二次确认 / loading / 更多折叠）
 * 3. 工具栏（刷新 / 密度 / 列设置 / 自定义入口）
 * 4. 行批量选择工具栏
 * 5. 列状态持久化（顺序、显隐、固定） */
export function MCTable<RecordType extends AnyObject>({
  actionColumn,
  actions,
  actionColumnTitle,
  actionColumnWidth,
  batchToolbar,
  columns,
  onRefresh,
  pagination,
  persistKey,
  rootClassName,
  rowSelection,
  size = 'middle',
  table,
  toolbar,
  toolbarLeft,
  tools,
  ...tableProps
}: MCTableProps<RecordType>) {
  const [tableSize, setTableSize] = useState<TableSize>(size)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [selectedRows, setSelectedRows] = useState<RecordType[]>([])
  const permissions = usePermissions()

  // useTable 接入：table prop 的字段作为默认值，显式 prop 优先（允许覆盖）。
  const binding = table ?? {}
  const resolvedLoading = tableProps.loading ?? binding.loading
  const resolvedDataSource = tableProps.dataSource ?? binding.tableData
  const resolvedPagination = pagination ?? binding.pagination
  const resolvedRowSelectionProp = rowSelection ?? binding.rowSelection
  const resolvedOnRefresh = onRefresh ?? binding.refresh

  // 把 actionColumnTitle/actionColumnWidth 合并进 actionColumn，统一单一入口。
  const resolvedActionColumn = useMemo(() => {
    if (actionColumn) {
      return actionColumn
    }

    const compact: MCActionColumnCompact = {}
    if (actionColumnTitle !== undefined) {
      compact.title = actionColumnTitle
    }
    if (actionColumnWidth !== undefined) {
      compact.width = actionColumnWidth
    }
    return Object.keys(compact).length > 0 ? compact : undefined
  }, [actionColumn, actionColumnTitle, actionColumnWidth])

  // 操作列在进入列状态前追加，使其顺序、固定也能被统一管理。
  const sourceColumns = useMemo<MCTableColumn<RecordType>[]>(() => {
    if (!actions || actions.length === 0) {
      return columns
    }

    const actionCol: MCTableColumn<RecordType> = {
      ...buildActionColumn(actions, permissions, resolvedActionColumn),
      hideInSetting: true
    }
    return [...columns, actionCol]
  }, [actions, columns, permissions, resolvedActionColumn])

  const columnState = useColumnState({ columns: sourceColumns, persistKey })

  const selectionEnabled = Boolean(resolvedRowSelectionProp)
  const clearSelection = () => {
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  const resolvedRowSelection = useMemo<TableRowSelection<RecordType> | undefined>(() => {
    if (!selectionEnabled) {
      return undefined
    }

    const overrides =
      typeof resolvedRowSelectionProp === 'object' ? resolvedRowSelectionProp : undefined
    // 受控模式：外部传入 selectedRowKeys 时优先使用（配合 useTable 的跨页选择）；
    // 否则退回内部 state（MCTable 自管选择的兼容模式）。
    const isControlled = overrides?.selectedRowKeys !== undefined
    return {
      ...overrides,
      selectedRowKeys: isControlled ? overrides?.selectedRowKeys : selectedRowKeys,
      onChange: (keys, rows, info) => {
        if (!isControlled) {
          setSelectedRowKeys(keys)
          setSelectedRows(rows)
        }
        overrides?.onChange?.(keys, rows, info)
      }
    }
  }, [resolvedRowSelectionProp, selectedRowKeys, selectionEnabled])

  const showBatchToolbar = Boolean(batchToolbar && selectedRowKeys.length > 0)
  const showTools = Boolean(
    tools?.columns || tools?.density || (tools?.refresh && resolvedOnRefresh)
  )
  const showToolbar = Boolean(toolbar || toolbarLeft || showTools || showBatchToolbar)

  async function handleRefresh() {
    if (!resolvedOnRefresh || refreshing) {
      return
    }

    setRefreshing(true)
    try {
      await resolvedOnRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3" data-slot="mc-table">
      {showToolbar ? (
        <div
          className="flex min-h-8 flex-wrap items-center justify-between gap-2"
          data-slot="mc-table-toolbar"
        >
          <div className="flex flex-wrap items-center gap-2">
            {showBatchToolbar ? (
              <Space size="small" wrap>
                <span className="text-sm text-muted-foreground">
                  已选 {selectedRowKeys.length} 项
                </span>
                {batchToolbar?.({
                  clearSelection,
                  selectedRowKeys,
                  selectedRows
                } as MCTableBatchContext<RecordType>)}
                <Button
                  icon={<X className="size-4" />}
                  onClick={clearSelection}
                  size="small"
                  type="text"
                >
                  取消选择
                </Button>
              </Space>
            ) : (
              toolbarLeft
            )}
          </div>
          <Space size="small" wrap>
            {toolbar}
            {tools?.refresh && resolvedOnRefresh ? (
              <TableToolButton
                icon={RefreshCw}
                label="刷新表格"
                loading={refreshing}
                onClick={() => void handleRefresh()}
              />
            ) : null}
            {tools?.density ? (
              <Dropdown
                popupRender={() => (
                  <div className="rounded-md border bg-popover p-2 shadow-md">
                    <Segmented<TableSize>
                      onChange={setTableSize}
                      options={[
                        { label: '紧凑', value: 'small' },
                        { label: '默认', value: 'middle' },
                        { label: '宽松', value: 'large' }
                      ]}
                      value={tableSize}
                    />
                  </div>
                )}
                placement="bottomRight"
                trigger={['click']}
              >
                <span>
                  <TableToolButton icon={Rows3} label="表格密度" />
                </span>
              </Dropdown>
            ) : null}
            {tools?.columns ? (
              <Dropdown
                popupRender={() => <ColumnSettingPanel controller={columnState} />}
                placement="bottomRight"
                trigger={['click']}
              >
                <span>
                  <TableToolButton icon={Columns3} label="列设置" />
                </span>
              </Dropdown>
            ) : null}
          </Space>
        </div>
      ) : null}
      <Table<RecordType>
        className="min-h-0 flex-1"
        rootClassName={cn('mc-table-fill', rootClassName)}
        columns={columnState.columns}
        rowSelection={resolvedRowSelection}
        size={tableSize}
        {...tableProps}
        dataSource={resolvedDataSource}
        loading={resolvedLoading}
        pagination={resolvedPagination ?? { pageSize: 10, showSizeChanger: false }}
      />
    </div>
  )
}

function TableToolButton({
  icon: Icon = Settings2,
  label,
  loading,
  onClick
}: {
  icon?: LucideIcon
  label: string
  loading?: boolean
  onClick?: () => void
}) {
  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        icon={<Icon className="size-4" />}
        loading={loading}
        onClick={onClick}
        size="small"
        type="text"
      />
    </Tooltip>
  )
}
