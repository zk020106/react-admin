import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { PaginationProps } from 'antd'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { confirmBatchDelete, confirmDelete } from '@/components/mc/popup/confirm'
import { queryClient } from '@/lib/query-client'
import type { PageQuery, PageRes } from '@/types/page'

// 类型：UseTableBaseOptions。两种模式共享的配置。
interface UseTableBaseOptions<TRecord, TFilters extends Record<string, unknown>> {
  /** 初始筛选条件，reset() 会回到此值。默认空对象。 */
  defaultFilters?: TFilters
  /** 默认每页条数，默认 10。 */
  defaultPageSize?: number
  /** 从记录提取唯一标识，默认 `record => record.id`。删除/选择依赖它。 */
  rowKey?: (record: TRecord) => string
  /** 单条删除函数；提供后 onDelete 可用，删除成功会自动失效查询。 */
  deleteFn?: (id: string) => Promise<void>
  /** 批量删除函数；提供后 onBatchDelete 可用。 */
  batchDeleteFn?: (ids: string[]) => Promise<void>
}

// 类型：UseTableServerOptions。服务端分页模式：传 queryFn + queryKey。
export interface UseTableServerOptions<
  TRecord,
  TFilters extends Record<string, unknown>
> extends UseTableBaseOptions<TRecord, TFilters> {
  /** 列表查询函数：接收分页与筛选参数，返回当前页数据与总条数。 */
  queryFn: (params: PageQuery & TFilters, signal?: AbortSignal) => Promise<PageRes<TRecord>>
  /** queryKey factory：用于缓存与失效；接收完整分页+筛选参数。 */
  queryKey: (params: PageQuery & TFilters) => readonly unknown[]
  /**
   * 失效前缀 key：删除/批量删除成功后，按此前缀失效该资源所有分页/筛选变体。
   * 通常传 `systemKeys.users()`（无参，作前缀）。省略时仅失效当前 queryKey。
   */
  invalidateKey?: readonly unknown[]
  /** 透传给内部 useQuery 的额外选项（如 enabled、staleTime）。 */
  queryOptions?: Omit<UseQueryOptions<PageRes<TRecord>>, 'queryKey' | 'queryFn'>
  dataSource?: never
  filter?: never
}

// 类型：UseTableClientOptions。客户端分页模式：传 dataSource（全量）+ 可选 filter。
export interface UseTableClientOptions<
  TRecord,
  TFilters extends Record<string, unknown>
> extends UseTableBaseOptions<TRecord, TFilters> {
  /** 全量数据源；客户端模式在其上做 filter + 切片。 */
  dataSource: TRecord[]
  /** 客户端过滤函数；省略时不过滤。 */
  filter?: (record: TRecord, filters: TFilters) => boolean
  /**
   * 删除后回调：客户端模式无法自动失效查询，由调用方在此处理（如 refetch）。
   * 提供后 onDelete/onBatchDelete 成功会调用它。
   */
  onChanged?: () => void
  queryFn?: never
  queryKey?: never
  invalidateKey?: never
  queryOptions?: never
}

export type UseTableOptions<
  TRecord,
  TFilters extends Record<string, unknown> = Record<string, unknown>
> = UseTableServerOptions<TRecord, TFilters> | UseTableClientOptions<TRecord, TFilters>

/** 列表页表格逻辑 hook：统一管理分页、筛选、跨页选择与删除。
 *
 *  支持两种模式（二选一）：
 *  - **服务端分页**：传 `queryFn` + `queryKey`，内部用 useQuery 拉取当前页数据。
 *    `<MCTable table={table} />` 一行接入，loading/dataSource/pagination 自动来。
 *  - **客户端分页**：传 `dataSource`（全量）+ 可选 `filter`，内部做切片。
 *    适合需要客户端复杂联动筛选（如部门树）的场景。
 *
 *  @example 服务端模式
 *  const table = useTable({
 *    queryFn: (params, signal) => adminApi.users(params, signal),
 *    queryKey: systemKeys.users,
 *    invalidateKey: systemKeys.users(),
 *    deleteFn: id => adminApi.deleteUser(id)
 *  })
 *
 *  @example 客户端模式
 *  const table = useTable({
 *    dataSource: allUsers,
 *    filter: (user, filters) => userMatchesFilters(user, filters),
 *    defaultFilters: { keyword: '' }
 *  }) */
export function useTable<
  TRecord,
  TFilters extends Record<string, unknown> = Record<string, unknown>
>(options: UseTableOptions<TRecord, TFilters>) {
  const isServerMode = 'queryFn' in options && options.queryFn !== undefined
  const {
    defaultFilters = {} as TFilters,
    defaultPageSize = 10,
    rowKey = record => {
      const id = (record as Record<string, unknown>).id
      if (id === undefined && import.meta.env.DEV) {
        console.warn(
          '[useTable] 记录没有 id 字段，默认 rowKey 返回 "undefined"。请在 useTable 的 rowKey 选项中指定唯一标识。'
        )
      }
      return String(id)
    },
    deleteFn,
    batchDeleteFn
  } = options

  // 用 ref 固定 defaultFilters 的挂载初值，避免调用方传内联对象导致 reset 闭包每次重建，
  // 以及重置时回写到"当前渲染快照"而非"挂载初值"。
  const initialFiltersRef = useRef(defaultFilters)
  const [filters, setFilters] = useState<TFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const params = useMemo<PageQuery & TFilters>(
    () => ({ ...filters, page, size: pageSize }),
    [filters, page, pageSize]
  )

  // 客户端模式不需要 useQuery 取数，但 hooks 规则要求无条件调用。
  // 用 useId 生成实例唯一的占位 key，避免多个客户端实例共享缓存槽互相串扰。
  const clientId = useId()
  const placeholderQueryKey = useMemo(() => ['__useTableClient__', clientId] as const, [clientId])

  // —— 数据获取：服务端用 useQuery，客户端用 useMemo 切片 ——
  // placeholderData 保留上一页数据：翻页/改筛选时表格不闪烁为空（等价 v4 keepPreviousData）。
  const serverQuery = useQuery<PageRes<TRecord>>({
    queryKey: isServerMode
      ? (options as UseTableServerOptions<TRecord, TFilters>).queryKey(params)
      : placeholderQueryKey,
    queryFn: isServerMode
      ? ({ signal }) =>
          (options as UseTableServerOptions<TRecord, TFilters>).queryFn(params, signal)
      : () => ({ list: [] as TRecord[], total: 0 }),
    // 仅服务端模式启用 placeholderData（客户端模式切片即时不闪）。
    placeholderData: isServerMode ? (prev: PageRes<TRecord> | undefined) => prev : undefined,
    enabled: isServerMode,
    ...(options as UseTableServerOptions<TRecord, TFilters>).queryOptions
  })

  const clientData = useMemo(() => {
    if (isServerMode) return null
    const { dataSource, filter } = options as UseTableClientOptions<TRecord, TFilters>
    const filtered = filter ? dataSource.filter(record => filter(record, filters)) : dataSource
    const total = filtered.length
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)
    return { filtered, list, total }
  }, [isServerMode, options, filters, page, pageSize])

  const tableData = isServerMode ? (serverQuery.data?.list ?? []) : (clientData?.list ?? [])
  // filteredData：客户端模式下的过滤后全量（未切片），供树形表格等不分页场景使用。
  const filteredData = isServerMode ? tableData : (clientData?.filtered ?? [])
  const total = isServerMode ? (serverQuery.data?.total ?? 0) : (clientData?.total ?? 0)
  const loading = isServerMode ? serverQuery.isFetching : false

  // 越界收敛：total 变小（删除/筛选）后把 page 收敛到有效范围。
  // 仅依赖 total/pageSize（不含 page 自身），是对真实数据状态的纠偏，非派生状态同步。
  useEffect(() => {
    if (total === 0) {
      setPage(1)
      return
    }
    const lastPage = Math.max(1, Math.ceil(total / pageSize))
    setPage(current => Math.min(current, lastPage))
  }, [total, pageSize])

  // —— 删除 mutation ——
  const invalidateTarget = isServerMode
    ? ((options as UseTableServerOptions<TRecord, TFilters>).invalidateKey ??
      (options as UseTableServerOptions<TRecord, TFilters>).queryKey(params))
    : null

  const deleteMutation = useMutation({
    mutationFn: (id: string) => (deleteFn ? deleteFn(id) : Promise.resolve()),
    onSuccess: () => {
      if (invalidateTarget) {
        void queryClient.invalidateQueries({ queryKey: invalidateTarget })
      }
      if (!isServerMode) {
        const clientOpts = options as UseTableClientOptions<TRecord, TFilters>
        if (clientOpts.onChanged) {
          clientOpts.onChanged()
        } else if (import.meta.env.DEV) {
          // 客户端模式删除后，若未提供 onChanged，useTable 无法自动刷新数据源，
          // 表格仍显示已删除的行。提醒调用方配置 onChanged 或自行处理删除后刷新。
          console.warn(
            '[useTable] 客户端模式删除成功，但未配置 onChanged 回调，表格数据不会自动刷新。'
          )
        }
      }
    }
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => (batchDeleteFn ? batchDeleteFn(ids) : Promise.resolve()),
    onSuccess: () => {
      setSelectedKeys([])
      if (invalidateTarget) {
        void queryClient.invalidateQueries({ queryKey: invalidateTarget })
      }
      if (!isServerMode) {
        ;(options as UseTableClientOptions<TRecord, TFilters>).onChanged?.()
      }
    }
  })

  /** 搜索：应用新筛选条件并回到首页，清空跨页选择。 */
  const search = useCallback((nextFilters: TFilters) => {
    setFilters(nextFilters)
    setPage(1)
    setSelectedKeys([])
  }, [])

  /** 手动设置当前页（部门切换等外部联动回首页时用）。 */
  const setPageNumber = useCallback((next: number) => {
    setPage(next)
  }, [])

  /** 重置：回到挂载时的 defaultFilters 并回到首页。 */
  const reset = useCallback(() => {
    setFilters(initialFiltersRef.current)
    setPage(1)
    setSelectedKeys([])
  }, [])

  /** 刷新当前查询（仅服务端模式有效）。 */
  const refresh = useCallback(async () => {
    if (isServerMode) {
      await serverQuery.refetch()
    } else {
      ;(options as UseTableClientOptions<TRecord, TFilters>).onChanged?.()
    }
  }, [isServerMode, serverQuery, options])

  /** 删除单条：弹出确认框，确认后调 deleteFn。 */
  const onDelete = useCallback(
    async (record: TRecord, title?: string, content?: string) => {
      if (!deleteFn) return
      const confirmed = await confirmDelete(title ?? '确认删除', content)
      if (!confirmed) return
      await deleteMutation.mutateAsync(rowKey(record))
    },
    [deleteFn, deleteMutation, rowKey]
  )

  /** 批量删除选中的行（带确认框）；需配置 batchDeleteFn。 */
  const onBatchDelete = useCallback(async () => {
    if (!batchDeleteFn || selectedKeys.length === 0) return
    const confirmed = await confirmBatchDelete(selectedKeys.length)
    if (!confirmed) return
    await batchDeleteMutation.mutateAsync(selectedKeys)
  }, [batchDeleteFn, batchDeleteMutation, selectedKeys])

  // 组装好的 antd 分页对象。
  const pagination = useMemo<PaginationProps>(
    () => ({
      current: page,
      onChange: (next, size) => {
        setPage(next)
        setPageSize(size)
      },
      pageSize,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: t => `共 ${t} 条`,
      total
    }),
    [page, pageSize, total]
  )

  // 受控行选择：支持跨页保留选中。
  const rowSelection = useMemo(
    () => ({
      preserveSelectedRowKeys: true,
      selectedRowKeys: selectedKeys,
      onChange: (keys: React.Key[]) => setSelectedKeys(keys.map(key => String(key)))
    }),
    [selectedKeys]
  )

  return {
    loading,
    tableData,
    /** 客户端模式下过滤后的全量数据（未切片）；服务端模式等同于 tableData。 */
    filteredData,
    total,
    pagination,
    filters,
    selectedKeys,
    setSelectedKeys,
    search,
    setPage: setPageNumber,
    reset,
    refresh,
    onDelete,
    onBatchDelete,
    rowSelection,
    query: serverQuery
  }
}

// 类型：UseTableReturn。useTable 的返回值，供 MCTable 的 table prop 直接接收。
export type UseTableReturn<
  TRecord,
  TFilters extends Record<string, unknown> = Record<string, unknown>
> = ReturnType<typeof useTable<TRecord, TFilters>>
