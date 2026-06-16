import type { TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { ColumnType } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
import type { LucideIcon } from 'lucide-react'
import type { Key, ReactNode } from 'react'

import type { PermissionInput } from '@/lib/permissions'

/** 列固定方向。 */
export type ColumnFixed = 'left' | 'right'

/** MCTable 列配置，基于 Ant Design ColumnType 扩展。 */
export interface MCTableColumn<RecordType extends AnyObject> extends ColumnType<RecordType> {
  /** 列设置面板展示的名称，title 非字符串时使用。 */
  columnLabel?: string
  /** 不在列设置面板里展示该列的开关（列始终展示），适合操作列。 */
  hideInSetting?: boolean
}

/** 持久化的列状态：顺序、隐藏列和固定方向。 */
export interface MCTableColumnState {
  /** 列 key 的展示顺序。 */
  order: string[]
  /** 被隐藏的列 key。 */
  hidden: string[]
  /** 列 key 到固定方向的映射。 */
  fixed: Record<string, ColumnFixed>
}

/** 操作项二次确认配置。 */
export interface MCTableActionConfirm {
  /** 确认按钮文案。 */
  okText?: string
  /** 取消按钮文案。 */
  cancelText?: string
  /** 确认气泡标题。 */
  title: ReactNode
  /** 确认按钮是否使用危险样式。 */
  danger?: boolean
}

/** 操作列单个操作项配置。 */
export interface MCTableAction<RecordType extends AnyObject> {
  /** 操作唯一标识。 */
  key: string
  /** 操作文案。 */
  label: ReactNode
  /** 操作图标。 */
  icon?: LucideIcon
  /** 展示该操作所需权限，未授权时整项隐藏。 */
  permission?: PermissionInput
  /** 是否使用危险样式。 */
  danger?: boolean
  /** 按钮类型。 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  /** 是否针对当前行隐藏该操作。 */
  hidden?: (record: RecordType) => boolean
  /** 是否禁用，可根据当前行动态判断。 */
  disabled?: boolean | ((record: RecordType) => boolean)
  /** 点击前的二次确认，传字符串时作为确认标题。 */
  confirm?: ReactNode | MCTableActionConfirm
  /** 点击回调，返回 Promise 时按钮自动进入 loading。 */
  onClick?: (record: RecordType) => Promise<void> | void
}

/** 操作列整体配置。 */
export interface MCActionColumnConfig {
  /** 列标题，默认“操作”。 */
  title?: ReactNode
  /** 列宽度。 */
  width?: number | string
  /** 列固定方向，默认固定到右侧。 */
  fixed?: ColumnFixed | false
  /** 行内最多展示的操作数，超出折叠进“更多”。 */
  max?: number
}

/** 批量操作工具栏渲染上下文。 */
export interface MCTableBatchContext<RecordType extends AnyObject> {
  /** 当前选中的行 key。 */
  selectedRowKeys: Key[]
  /** 当前选中的行数据。 */
  selectedRows: RecordType[]
  /** 清空选择。 */
  clearSelection: () => void
}

/** MCTable 工具栏开关。 */
export interface MCTableTools {
  /** 是否显示列设置入口。 */
  columns?: boolean
  /** 是否显示密度切换入口。 */
  density?: boolean
  /** 是否显示刷新入口（需配合 onRefresh）。 */
  refresh?: boolean
}

/**
 * useTable 接入协议：MCTable 的 table prop 接收满足此形状的对象（useTable 返回值天然满足）。
 * 用结构化类型而非直接 import UseTableReturn，避免 table 层反向依赖 hooks 层。
 */
export interface MCTableBinding<RecordType extends AnyObject> {
  loading?: boolean
  tableData?: RecordType[]
  pagination?: TableProps<RecordType>['pagination']
  rowSelection?: TableRowSelection<RecordType> | boolean
  refresh?: () => void | Promise<void>
}

/** MCTable 组件属性，继承 Ant Design TableProps。 */
export interface MCTableProps<RecordType extends AnyObject> extends Omit<
  TableProps<RecordType>,
  'columns' | 'rowSelection'
> {
  /** MC 扩展：useTable 返回值，传入后 loading/dataSource/pagination/rowSelection/onRefresh 自动接入。 */
  table?: MCTableBinding<RecordType>
  /** MC 扩展：列配置。 */
  columns: MCTableColumn<RecordType>[]
  /** MC 扩展：操作列配置，传入后自动在末尾追加标准操作列。 */
  actions?: MCTableAction<RecordType>[]
  /** MC 扩展：操作列外观配置。 */
  actionColumn?: MCActionColumnConfig
  /** MC 扩展：操作列标题（仅 actions 时的简化入口）。 */
  actionColumnTitle?: string
  /** MC 扩展：操作列宽度（仅 actions 时的简化入口）。 */
  actionColumnWidth?: number
  /** MC 扩展：开启行批量选择；可传 antd 原生 rowSelection 进一步定制。 */
  rowSelection?: TableRowSelection<RecordType> | boolean
  /** MC 扩展：渲染批量操作工具栏内容，仅在有选中行时展示。 */
  batchToolbar?: (context: MCTableBatchContext<RecordType>) => ReactNode
  /** MC 扩展：持久化键，用于保存列设置状态到 localStorage。 */
  persistKey?: string
  /** MC 扩展：刷新按钮点击行为；提供时可由 tools.refresh 展示刷新入口。 */
  onRefresh?: () => Promise<void> | void
  /** MC 扩展：工具栏左侧内容，适合批量操作和选中状态。 */
  toolbarLeft?: ReactNode
  /** MC 扩展：表格右上工具栏内容（新增按钮等操作入口）。 */
  toolbar?: ReactNode
  /** MC 扩展：开启内置刷新、密度和列设置工具。 */
  tools?: MCTableTools
  /** MC 扩展：附加在根容器上的 className。 */
  rootClassName?: string
}
