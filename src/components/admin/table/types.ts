import type { AnyObject } from 'antd/es/_util/type'
import type { ColumnType } from 'antd/es/table'
import type { LucideIcon } from 'lucide-react'
import type { Key, ReactNode } from 'react'

import type { PermissionInput } from '@/lib/permissions'

/** 列固定方向。 */
export type ColumnFixed = 'left' | 'right'

/** AdminTable 列配置：在 antd 列基础上补充列设置面板所需的元信息。 */
export type AdminColumn<RecordType extends AnyObject> = ColumnType<RecordType> & {
  /** 列设置面板展示的名称，title 非字符串时使用。 */
  columnLabel?: string
  /** 不在列设置面板里展示该列的开关（列始终展示），适合操作列。 */
  hideInSetting?: boolean
}

/** 持久化的列状态：顺序、隐藏列和固定方向。 */
export interface AdminTableColumnState {
  /** 列 key 的展示顺序。 */
  order: string[]
  /** 被隐藏的列 key。 */
  hidden: string[]
  /** 列 key 到固定方向的映射。 */
  fixed: Record<string, ColumnFixed>
}

/** 操作项二次确认配置。 */
export interface AdminTableActionConfirm {
  /** 确认气泡标题。 */
  title: ReactNode
  /** 确认按钮文案。 */
  okText?: string
  /** 取消按钮文案。 */
  cancelText?: string
  /** 确认按钮是否使用危险样式。 */
  danger?: boolean
}

/** 操作列单个操作项配置。 */
export interface AdminTableAction<RecordType extends AnyObject> {
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
  /** 是否禁用，可根据当前行动态判断。 */
  disabled?: boolean | ((record: RecordType) => boolean)
  /** 是否针对当前行隐藏该操作。 */
  hidden?: (record: RecordType) => boolean
  /** 点击前的二次确认，传字符串时作为确认标题。 */
  confirm?: ReactNode | AdminTableActionConfirm
  /** 点击回调，返回 Promise 时按钮自动进入 loading。 */
  onClick?: (record: RecordType) => Promise<void> | void
}

/** 操作列整体配置。 */
export interface AdminActionColumnConfig {
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
export interface AdminTableBatchContext<RecordType extends AnyObject> {
  /** 当前选中的行 key。 */
  selectedRowKeys: Key[]
  /** 当前选中的行数据。 */
  selectedRows: RecordType[]
  /** 清空选择。 */
  clearSelection: () => void
}
