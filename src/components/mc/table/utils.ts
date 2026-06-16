import type { AnyObject } from 'antd/es/_util/type'
import type { Key } from 'react'

import type { MCTableColumn } from './types'

/** 计算列的稳定标识：优先 key，其次 dataIndex，最后回退序号。 */
export function getColumnKey<RecordType extends AnyObject>(
  column: MCTableColumn<RecordType>,
  index: number
): string {
  if (column.key !== undefined) {
    return keyToString(column.key)
  }

  if (Array.isArray(column.dataIndex)) {
    return column.dataIndex.map(item => String(item)).join('.')
  }

  if (typeof column.dataIndex === 'string' || typeof column.dataIndex === 'number') {
    return String(column.dataIndex)
  }

  return `column-${index}`
}

/** 计算列在列设置面板里的展示名：columnLabel > 字符串 title > fallback。 */
export function getColumnLabel<RecordType extends AnyObject>(
  column: MCTableColumn<RecordType>,
  fallback: string
): string {
  if (column.columnLabel) {
    return column.columnLabel
  }

  return typeof column.title === 'string' ? column.title : fallback
}

/** 确保列有 columnLabel（用于列设置面板）。 */
export function ensureColumnLabel<T extends AnyObject>(
  col: MCTableColumn<T>
): MCTableColumn<T> & { columnLabel: string } {
  const label =
    col.columnLabel ||
    (typeof col.title === 'string'
      ? col.title
      : typeof col.key === 'string' || typeof col.key === 'number'
        ? keyToString(col.key)
        : '')

  return { ...col, columnLabel: label }
}

function keyToString(key: Key | undefined): string {
  if (typeof key === 'string' || typeof key === 'number') {
    return String(key)
  }
  return ''
}
