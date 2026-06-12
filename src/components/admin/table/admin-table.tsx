import { Button, Dropdown, Segmented, Space, Table, Tooltip, type TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { TableRowSelection } from 'antd/es/table/interface'
import { Columns3, RefreshCw, Rows3, Settings2, X, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type Key, type ReactNode } from 'react'

import { usePermissions } from '@/components/has-permission'
import { buildActionColumn } from './action-column'
import { ColumnSettingPanel } from './column-setting-panel'
import type {
  AdminActionColumnConfig,
  AdminColumn,
  AdminTableAction,
  AdminTableBatchContext
} from './types'
import { useColumnState } from './use-column-state'

type TableSize = NonNullable<TableProps<AnyObject>['size']>

export interface AdminTableTools {
  columns?: boolean
  density?: boolean
  refresh?: boolean
}

export interface AdminTableProps<RecordType extends AnyObject> extends Omit<
  TableProps<RecordType>,
  'columns' | 'rowSelection'
> {
  /** 列配置，支持 columnLabel 和 hideInSetting 等扩展元信息。 */
  columns?: AdminColumn<RecordType>[]
  /** 操作列配置，传入后自动在末尾追加标准操作列。 */
  actions?: AdminTableAction<RecordType>[]
  /** 操作列外观配置。 */
  actionColumn?: AdminActionColumnConfig
  /** 开启行批量选择；可传 antd 原生 rowSelection 进一步定制。 */
  rowSelection?: TableRowSelection<RecordType> | boolean
  /** 渲染批量操作工具栏内容，仅在有选中行时展示。 */
  batchToolbar?: (context: AdminTableBatchContext<RecordType>) => ReactNode
  /** 提供后列状态（顺序、显隐、固定）持久化到 localStorage。 */
  persistKey?: string
  /** 刷新按钮点击行为；提供时可由 tools.refresh 展示刷新入口。 */
  onRefresh?: () => Promise<void> | void
  /** 工具栏左侧内容，适合批量操作和选中状态。 */
  toolbarLeft?: ReactNode
  /** 表格右上工具栏内容（新增按钮等操作入口）。 */
  toolbar?: ReactNode
  /** 开启内置刷新、密度和列设置工具。 */
  tools?: AdminTableTools
}

/** 内容区标准表格：统一默认分页、尺寸与工具栏布局。
 *  消费方需位于 AdminConfigProvider 内以获得主题与语言上下文。 */
export function AdminTable<RecordType extends AnyObject>({
  actionColumn,
  actions,
  batchToolbar,
  columns = [],
  onRefresh,
  pagination,
  persistKey,
  rowSelection,
  size = 'middle',
  toolbar,
  toolbarLeft,
  tools,
  ...tableProps
}: AdminTableProps<RecordType>) {
  const [tableSize, setTableSize] = useState<TableSize>(size)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [selectedRows, setSelectedRows] = useState<RecordType[]>([])
  const permissions = usePermissions()

  // 操作列在进入列状态前追加，使其顺序、固定也能被统一管理。
  const sourceColumns = useMemo(() => {
    if (!actions || actions.length === 0) {
      return columns
    }

    const actionCol: AdminColumn<RecordType> = {
      ...buildActionColumn(actions, permissions, actionColumn),
      hideInSetting: true
    }
    return [...columns, actionCol]
  }, [actionColumn, actions, columns, permissions])

  const columnState = useColumnState({ columns: sourceColumns, persistKey })

  const selectionEnabled = Boolean(rowSelection)
  const clearSelection = () => {
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  const resolvedRowSelection = useMemo<TableRowSelection<RecordType> | undefined>(() => {
    if (!selectionEnabled) {
      return undefined
    }

    const overrides = typeof rowSelection === 'object' ? rowSelection : undefined
    return {
      ...overrides,
      selectedRowKeys,
      onChange: (keys, rows, info) => {
        setSelectedRowKeys(keys)
        setSelectedRows(rows)
        overrides?.onChange?.(keys, rows, info)
      }
    }
  }, [rowSelection, selectedRowKeys, selectionEnabled])

  const showBatchToolbar = Boolean(batchToolbar && selectedRowKeys.length > 0)
  const showTools = Boolean(tools?.columns || tools?.density || (tools?.refresh && onRefresh))
  const showToolbar = Boolean(toolbar || toolbarLeft || showTools || showBatchToolbar)

  async function handleRefresh() {
    if (!onRefresh || refreshing) {
      return
    }

    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="grid gap-3" data-slot="admin-table">
      {showToolbar ? (
        <div
          className="flex min-h-8 flex-wrap items-center justify-between gap-2"
          data-slot="admin-table-toolbar"
        >
          <div className="flex flex-wrap items-center gap-2">
            {showBatchToolbar ? (
              <Space size="small" wrap>
                <span className="text-sm text-muted-foreground">
                  已选 {selectedRowKeys.length} 项
                </span>
                {batchToolbar?.({ clearSelection, selectedRowKeys, selectedRows })}
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
            {tools?.refresh && onRefresh ? (
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
        columns={columnState.columns}
        pagination={pagination ?? { pageSize: 10, showSizeChanger: false }}
        rowSelection={resolvedRowSelection}
        size={tableSize}
        {...tableProps}
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
