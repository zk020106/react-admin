import type { AnyObject } from 'antd/es/_util/type'

import type { MCTableColumn } from './types'

/**
 * 确保列有 columnLabel（用于列设置面板）
 */
export function ensureColumnLabel<T extends AnyObject>(
  col: MCTableColumn<T>
): MCTableColumn<T> & { columnLabel: string } {
  return {
    ...col,
    columnLabel:
      col.columnLabel || (typeof col.title === 'string' ? col.title : String(col.key || ''))
  }
}

/**
 * 从列配置中提取列的唯一键
 */
export function getColumnKey<T extends AnyObject>(col: MCTableColumn<T>, index: number): string {
  return col.key ? String(col.key) : col.dataIndex ? String(col.dataIndex) : `column-${index}`
}
