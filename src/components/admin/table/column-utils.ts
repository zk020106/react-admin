import type { AnyObject } from 'antd/es/_util/type'

import type { AdminColumn } from './types'

/** 计算列的稳定标识：优先 key，其次 dataIndex，最后回退序号。 */
export function getColumnKey<RecordType extends AnyObject>(
  column: AdminColumn<RecordType>,
  index: number
) {
  if (column.key !== undefined) {
    return String(column.key)
  }

  if (Array.isArray(column.dataIndex)) {
    return column.dataIndex.map(item => String(item)).join('.')
  }

  if (typeof column.dataIndex === 'string' || typeof column.dataIndex === 'number') {
    return String(column.dataIndex)
  }

  return `column-${index}`
}

/** 计算列在列设置面板里的展示名：columnLabel > 字符串 title > key。 */
export function getColumnLabel<RecordType extends AnyObject>(
  column: AdminColumn<RecordType>,
  fallback: string
) {
  if (column.columnLabel) {
    return column.columnLabel
  }

  return typeof column.title === 'string' ? column.title : fallback
}
