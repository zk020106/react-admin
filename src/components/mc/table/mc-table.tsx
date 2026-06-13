import { Button, Popover, Space, Table } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import { RefreshCw, Settings } from 'lucide-react'
import { useMemo } from 'react'

import { ColumnSettingPanel } from '@/components/admin/table/column-setting-panel'
import { useColumnState } from '@/components/admin/table/use-column-state'
import { cn } from '@/lib/utils'
import type { MCTableColumn, MCTableProps } from './types'
import { ensureColumnLabel } from './utils'

/**
 * 构建操作列配置
 */
function buildActionColumn<T extends AnyObject>(
  actions: MCTableProps<T>['actions'],
  title: string,
  width: number
): MCTableColumn<T> {
  return {
    fixed: 'right',
    key: 'actions',
    render: (_: unknown, record: T) => (
      <Space size="small">
        {actions!
          .filter(action => {
            if (typeof action.visible === 'function') {
              return action.visible(record)
            }
            return action.visible !== false
          })
          .map((action, index) => (
            <Button
              key={index}
              danger={action.danger}
              onClick={() => action.onClick(record)}
              size="small"
              type={action.type ?? 'link'}
            >
              {action.label}
            </Button>
          ))}
      </Space>
    ),
    title,
    width
  }
}

/**
 * MCTable 组件 - 基于 Ant Design Table 的封装
 *
 * 特性：
 * 1. 完全继承 Ant Design Table 的所有原生属性
 * 2. 扩展了操作列（actions）的便捷配置
 * 3. 支持列标签（columnLabel）用于列设置面板
 * 4. 集成工具栏（刷新、列设置、全屏）
 */
export function MCTable<RecordType extends AnyObject>({
  actions,
  actionColumnTitle = '操作',
  actionColumnWidth = 150,
  columns,
  persistKey,
  rootClassName,
  toolbar,
  ...antdTableProps
}: MCTableProps<RecordType>) {
  // 准备列配置（确保每列都有 columnLabel）
  const preparedColumns = useMemo(() => columns.map(ensureColumnLabel), [columns])

  // 列状态管理（用于列设置）
  const columnStateController = useColumnState({
    columns: preparedColumns as any,
    persistKey
  })

  // 构建最终的列配置（包含操作列）
  const finalColumns = useMemo(() => {
    const cols: MCTableColumn<RecordType>[] = [...(columnStateController.columns as any)]

    // 如果有 actions，添加操作列
    if (actions && actions.length > 0) {
      cols.push(buildActionColumn(actions, actionColumnTitle, actionColumnWidth))
    }

    return cols
  }, [actions, actionColumnTitle, actionColumnWidth, columnStateController.columns])

  // 是否显示工具栏
  const showToolbar = toolbar && (toolbar.refresh || toolbar.columnSetting || toolbar.fullscreen)

  return (
    <div className="flex h-full min-h-0 flex-col gap-2" data-slot="mc-table">
      {/* 工具栏 */}
      {showToolbar ? (
        <div className="flex shrink-0 justify-end gap-2">
          {toolbar.refresh ? (
            <Button
              icon={<RefreshCw className="size-4" />}
              onClick={toolbar.onRefresh}
              size="small"
              type="text"
            />
          ) : null}
          {toolbar.columnSetting ? (
            <Popover
              content={<ColumnSettingPanel controller={columnStateController} />}
              placement="bottomRight"
              trigger="click"
            >
              <Button icon={<Settings className="size-4" />} size="small" type="text" />
            </Popover>
          ) : null}
        </div>
      ) : null}

      {/* 表格 */}
      <Table<RecordType>
        {...antdTableProps}
        columns={finalColumns}
        rootClassName={cn('mc-table-fill', rootClassName)}
      />
    </div>
  )
}
