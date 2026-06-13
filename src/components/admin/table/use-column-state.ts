import type { AnyObject } from 'antd/es/_util/type'
import { useLocalStorageState, useMemoizedFn } from 'ahooks'
import { useMemo, useState } from 'react'

import { getColumnKey, getColumnLabel } from './column-utils'
import type { AdminColumn, AdminTableColumnState, ColumnFixed } from './types'

const emptyState: AdminTableColumnState = { fixed: {}, hidden: [], order: [] }

/** 列设置面板使用的单列元信息。 */
export interface ColumnMeta<RecordType extends AnyObject> {
  column: AdminColumn<RecordType>
  fixed?: ColumnFixed
  hidden: boolean
  key: string
  label: string
  /** 列设置面板是否展示该列的开关。 */
  settable: boolean
}

export interface UseColumnStateOptions<RecordType extends AnyObject> {
  columns: AdminColumn<RecordType>[]
  /** 提供后列状态持久化到 localStorage，并以此为存储键。 */
  persistKey?: string
}

export interface ColumnStateController<RecordType extends AnyObject> {
  /** 按当前顺序、可见性和固定方向计算出的最终 antd 列。 */
  columns: AdminColumn<RecordType>[]
  /** 列设置面板用的全部列元信息，按当前顺序排列。 */
  metas: ColumnMeta<RecordType>[]
  /** 是否存在任何与默认值不同的列状态。 */
  dirty: boolean
  setHidden: (key: string, hidden: boolean) => void
  setAllHidden: (hidden: boolean) => void
  setFixed: (key: string, fixed: ColumnFixed | undefined) => void
  move: (fromKey: string, toKey: string) => void
  reset: () => void
}

/** 管理列的顺序、显隐与固定方向，可选持久化到 localStorage。 */
export function useColumnState<RecordType extends AnyObject>({
  columns,
  persistKey
}: UseColumnStateOptions<RecordType>): ColumnStateController<RecordType> {
  // 持久化与内存态共用同一份结构，仅存储介质不同。
  const persisted = useLocalStorageState<AdminTableColumnState>(
    persistKey ?? 'admin-table-columns:__noop__',
    { defaultValue: emptyState, listenStorageChange: true }
  )
  const memoryState = useState<AdminTableColumnState>(emptyState)
  const state = persistKey ? (persisted[0] ?? emptyState) : memoryState[0]
  const setState = persistKey ? persisted[1] : memoryState[1]

  const baseColumns = useMemo(
    () =>
      columns.map((column, index) => {
        const key = getColumnKey(column, index)
        return {
          column,
          key,
          label: getColumnLabel(column, key),
          settable: column.hideInSetting !== true
        }
      }),
    [columns]
  )
  const baseKeys = useMemo(() => baseColumns.map(item => item.key), [baseColumns])

  const orderedKeys = useMemo(() => {
    const known = new Set(baseKeys)
    // 先按已保存顺序排列存在的列，再补上新增列，丢弃不存在的旧 key。
    const kept = state.order.filter(key => known.has(key))
    const appended = baseKeys.filter(key => !state.order.includes(key))
    return [...kept, ...appended]
  }, [baseKeys, state.order])

  const metas = useMemo<ColumnMeta<RecordType>[]>(() => {
    const byKey = new Map(baseColumns.map(item => [item.key, item]))
    return orderedKeys.flatMap(key => {
      const base = byKey.get(key)
      if (!base) {
        return []
      }

      return [
        {
          ...base,
          fixed: state.fixed[key],
          hidden: state.hidden.includes(key)
        }
      ]
    })
  }, [baseColumns, orderedKeys, state.fixed, state.hidden])

  const resolvedColumns = useMemo(() => {
    const visible = metas.filter(meta => !meta.hidden)

    // 分组：左固定、未固定、右固定
    const leftFixed: typeof visible = []
    const notFixed: typeof visible = []
    const rightFixed: typeof visible = []

    for (const meta of visible) {
      const fixed = meta.fixed ?? (meta.column.fixed as ColumnFixed | undefined)
      if (fixed === 'left') {
        leftFixed.push(meta)
      } else if (fixed === 'right') {
        rightFixed.push(meta)
      } else {
        notFixed.push(meta)
      }
    }

    // 按 左固定、未固定、右固定 的顺序排列
    const sorted = [...leftFixed, ...notFixed, ...rightFixed]

    return sorted.map(meta => {
      const fixed = meta.fixed ?? (meta.column.fixed as ColumnFixed | undefined)
      // 显式 undefined 会覆盖列原有 fixed，故仅在有值时写入。
      return fixed ? { ...meta.column, fixed } : meta.column
    })
  }, [metas])

  const dirty =
    state.order.length > 0 || state.hidden.length > 0 || Object.keys(state.fixed).length > 0

  const setHidden = useMemoizedFn((key: string, hidden: boolean) => {
    setState(current => {
      const base = current ?? emptyState
      const next = base.hidden.filter(item => item !== key)
      return { ...base, hidden: hidden ? [...next, key] : next }
    })
  })

  const setAllHidden = useMemoizedFn((hidden: boolean) => {
    setState(current => {
      const base = current ?? emptyState
      // 全选/全不选只作用于可配置列，操作列等始终可见。
      const settableKeys = baseColumns.filter(item => item.settable).map(item => item.key)
      return { ...base, hidden: hidden ? settableKeys : [] }
    })
  })

  const setFixed = useMemoizedFn((key: string, fixed: ColumnFixed | undefined) => {
    setState(current => {
      const base = current ?? emptyState
      const nextFixed = { ...base.fixed }
      if (fixed) {
        nextFixed[key] = fixed
      } else {
        delete nextFixed[key]
      }
      return { ...base, fixed: nextFixed }
    })
  })

  const move = useMemoizedFn((fromKey: string, toKey: string) => {
    if (fromKey === toKey) {
      return
    }

    setState(current => {
      const base = current ?? emptyState
      const order = orderedKeys.slice()
      const fromIndex = order.indexOf(fromKey)
      const toIndex = order.indexOf(toKey)
      if (fromIndex === -1 || toIndex === -1) {
        return base
      }

      order.splice(toIndex, 0, order.splice(fromIndex, 1)[0])
      return { ...base, order }
    })
  })

  const reset = useMemoizedFn(() => {
    setState(emptyState)
  })

  return { columns: resolvedColumns, dirty, metas, move, reset, setAllHidden, setFixed, setHidden }
}
