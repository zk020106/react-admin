import type { TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { ColumnType } from 'antd/es/table'
import type { ReactNode } from 'react'

/**
 * MCTable 列配置，基于 Ant Design ColumnType 扩展
 */
export interface MCTableColumn<RecordType extends AnyObject> extends Omit<
  ColumnType<RecordType>,
  'title'
> {
  /** 列标签，用于列设置面板显示 */
  columnLabel?: string
  /** 列标题 */
  title?: ReactNode
}

/**
 * MCTable 操作按钮配置
 */
export interface MCTableAction<RecordType extends AnyObject> {
  /** 按钮文本 */
  label: string
  /** 按钮类型 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  /** 是否危险按钮 */
  danger?: boolean
  /** 是否显示（可以是函数动态判断）*/
  visible?: boolean | ((record: RecordType) => boolean)
  /** 点击回调 */
  onClick: (record: RecordType) => void
}

/**
 * MCTable 工具栏配置
 */
export interface MCTableToolbar {
  /** 是否显示刷新按钮 */
  refresh?: boolean
  /** 是否显示列设置按钮 */
  columnSetting?: boolean
  /** 是否显示全屏按钮 */
  fullscreen?: boolean
  /** 刷新回调 */
  onRefresh?: () => void
}

/**
 * MCTable 组件属性，继承 Ant Design TableProps
 */
export interface MCTableProps<RecordType extends AnyObject> extends Omit<
  TableProps<RecordType>,
  'columns'
> {
  /** MC 扩展：列配置 */
  columns: MCTableColumn<RecordType>[]
  /** MC 扩展：操作列配置 */
  actions?: MCTableAction<RecordType>[]
  /** MC 扩展：操作列标题 */
  actionColumnTitle?: string
  /** MC 扩展：操作列宽度 */
  actionColumnWidth?: number
  /** MC 扩展：工具栏配置 */
  toolbar?: MCTableToolbar
  /** MC 扩展：持久化键，用于保存列设置状态到 localStorage */
  persistKey?: string
  /** MC 扩展：是否启用列标题拖动排序（默认 false）*/
  columnDraggable?: boolean
}
