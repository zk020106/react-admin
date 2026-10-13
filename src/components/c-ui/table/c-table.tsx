// 注意：本文件顶部用 "use no memo" 主动退出 React Compiler。
// 原因：TanStack Table v8 的 useReactTable 返回跨渲染稳定的可变实例，
// 渲染期读取的 table.getState()/getRowModel() 依赖实例内部状态；
// 实测 Compiler 会把 CTablePagination 里基于稳定 table 引用的 getState()
// 调用 memo 住，导致翻页后页码文案与按钮禁用态永远停留在第一页。
// （2026-10-13 实测：关掉 compiler 分页即恢复正常。）可变实例不适合编译器 memo，
'use no memo'

import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import type {
  ColumnDef,
  OnChangeFn,
  RowSelectionState,
  SortingState,
  Table as TanStackTable
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus
} from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

/** 行选择列的固定 id：渲染时靠它识别选择列（收窄表头宽度、禁用排序）。 */
const SELECT_COLUMN_ID = '__c_select__'

/** 加载中的骨架行数：固定行数，避免加载时表格高度跳动。 */
const SKELETON_ROW_COUNT = 5

/** 表格密度：单元格内边距方案，comfortable 默认舒适，compact 适合列多/数据密的场景。 */
export type CTableDensity = 'compact' | 'comfortable'

export interface CTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  loading?: boolean
  /** 表格右上方工具条槽位（沿用旧 AdminTable 的习惯：右对齐，常用放新增按钮等操作入口）。 */
  toolbar?: ReactNode
  /** 工具条左侧操作区（主要操作：新增、导入等）；传入后工具条按左右分区渲染。 */
  toolbarLeft?: ReactNode
  /** 工具条右侧操作区（次要操作：导出、刷新、列设置等）。 */
  toolbarRight?: ReactNode
  /** 搜索区插槽：渲染在工具条上方的独立行（列表页三段式：搜索区 → 工具栏 → 表格）。 */
  searchBar?: ReactNode
  /** 分页配置：false 关闭分页（显示全量数据）；默认 { pageSize: 10}。 */
  pagination?: false | { pageSize?: number }
  getRowId?: (row: TData, index: number) => string
  /** 空数据时的居中提示文案，默认 '暂无数据'。 */
  emptyText?: string
  /** 是否允许点击表头排序，默认 true。 */
  enableSorting?: boolean
  /** 是否启用行选择（首列复选框），默认 false。 */
  enableRowSelection?: boolean
  /** 行选择变化时回调，参数为当前选中的业务行（跨页选择也包含）。 */
  onRowSelectionChange?: (rows: TData[]) => void
  density?: CTableDensity
}

/**
 * 各密度下的单元格内边距。
 * 为什么集中定义：表头/正文/骨架屏三处 padding 必须同步变化，分散写容易漏改一处。
 */
const densityCellPadding: Record<CTableDensity, { th: string; td: string }> = {
  comfortable: { th: 'px-3', td: 'px-3 py-2.5' },
  compact: { th: 'px-2', td: 'px-2 py-1.5' }
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="size-3.5" aria-hidden />
  if (sorted === 'desc') return <ArrowDown className="size-3.5" aria-hidden />
  // 未排序时给一个弱化的双向箭头，暗示"可点击排序"
  return <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />
}

interface SelectCheckboxProps {
  checked: boolean | 'indeterminate'
  onCheckedChange: (checked: boolean | 'indeterminate') => void
  ariaLabel: string
}

/**
 * 表格内建的行选择复选框。
 * 为什么不用 ui/Checkbox 而基于同一 radix-ui 原语手写：ui/Checkbox 的
 * Indicator 写死了 CheckIcon，无法表达表头全选的 indeterminate（横线）态；
 * 且它的选中样式用 `data-checked:` 选择器，而 Radix Checkbox Root 只渲染
 * `data-state`（checked/unchecked/indeterminate），`data-checked` 从不出现，
 * 用它会导致 indeterminate 态视觉上无法区分。这里用文档化的
 * `data-[state=...]` 选择器，样式 token 与 ui/Checkbox 保持一致。
 */
function SelectCheckbox({ checked, onCheckedChange, ariaLabel }: SelectCheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background transition-colors',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center [&>svg]:size-3">
        {checked === 'indeterminate' ? <Minus aria-hidden /> : <Check aria-hidden />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

/**
 * 分页条：上一页/下一页按钮 + "第 X / 共 Y 页" + 总数。
 * 只在 pagination 开启且有数据时渲染（CTable 主组件控制）。
 */
function CTablePagination<TData>({ table }: { table: TanStackTable<TData> }) {
  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()
  const total = table.getRowCount()

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">共 {total} 条</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground" aria-live="polite">
          第 {pageIndex + 1} / 共 {pageCount} 页
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="上一页"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="下一页"
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  )
}

/**
 * CTable：中后台标准表格（替代旧 AdminTable 的 antd 实现）。
 * 状态逻辑（排序/分页/选择）由内部的 useReactTable 管理，这里只负责渲染。
 *
 * v8 API 要点（本项目 @tanstack/react-table 是 v8，不要按 v9 的 useTable/features 写法）：
 * - 排序/分页/过滤的 row model 必须全部注册，见下方 getPaginationRowModel 处的注释。
 * - 渲染行用 table.getRowModel().rows（分页生效后的当前页），单元格用 row.getVisibleCells()。
 */
export function CTable<TData>({
  columns,
  data,
  loading = false,
  toolbar,
  toolbarLeft,
  toolbarRight,
  searchBar,
  pagination = { pageSize: 10 },
  getRowId,
  emptyText = '暂无数据',
  enableSorting = true,
  enableRowSelection = false,
  onRowSelectionChange,
  density = 'comfortable'
}: CTableProps<TData>): ReactNode {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    // pagination=false 时分页模型不注册，pageSize 无实际作用
    pageSize: pagination === false ? data.length : (pagination.pageSize ?? 10)
  })

  // 最新 table 实例的引用：onRowSelectionChange 需要把 RowSelectionState（id 字典）
  // 映射回业务行，映射发生在事件回调里，此时用 ref 拿到已提交的 table 实例。
  const tableRef = useRef<TanStackTable<TData> | null>(null)
  const onRowSelectionChangeRef = useRef(onRowSelectionChange)
  onRowSelectionChangeRef.current = onRowSelectionChange

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = updater => {
    const next = typeof updater === 'function' ? updater(rowSelection) : updater
    setRowSelection(next)
    const notify = onRowSelectionChangeRef.current
    if (notify && tableRef.current) {
      // 用 core 行模型按 id 回查：core 模型包含全量行，不受分页/排序/过滤影响，
      // id 与 RowSelectionState 的 key（即 row.id）一一对应，跨页选择也不会丢。
      const rowsById = tableRef.current.getCoreRowModel().rowsById
      const selectedRows: TData[] = []
      for (const id of Object.keys(next)) {
        if (next[id]) {
          const row = rowsById[id]
          if (row) selectedRows.push(row.original)
        }
      }
      notify(selectedRows)
    }
  }

  // 行选择列：插到最前面。为什么做成内部列而非让调用方传：契约只暴露
  // enableRowSelection 开关，调用方不用关心选择列的拼装细节。
  const selectColumn = useMemo<ColumnDef<TData, any>[]>(
    () =>
      enableRowSelection
        ? [
            {
              id: SELECT_COLUMN_ID,
              enableSorting: false,
              header: ({ table }) => {
                const allSelected = table.getIsAllRowsSelected()
                const someSelected = table.getIsSomeRowsSelected()
                return (
                  <SelectCheckbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={value => table.toggleAllRowsSelected(!!value)}
                    ariaLabel="全选"
                  />
                )
              },
              cell: ({ row }) => (
                <SelectCheckbox
                  checked={row.getIsSelected()}
                  onCheckedChange={value => row.toggleSelected(!!value)}
                  ariaLabel="选择该行"
                />
              )
            }
          ]
        : [],
    [enableRowSelection]
  )
  const allColumns = useMemo(() => [...selectColumn, ...columns], [selectColumn, columns])

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    // 四个 row model 必须全部注册：v8 里分页切片
    // 完全由 getPaginationRowModel 完成，漏掉它 table.getRowModel().rows 会返回
    // 全量未分页行，分页彻底失效。排序/过滤模型同理，按需全量注册。
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // pagination=false 时不注册分页模型：getRowModel 直接返回全量行（对齐 antd 行为）
    ...(pagination === false ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    state: { sorting, pagination: paginationState, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPaginationState,
    onRowSelectionChange: handleRowSelectionChange,
    enableSorting,
    enableRowSelection
  })
  tableRef.current = table

  const leafColumns = table.getAllLeafColumns()
  const rows = table.getRowModel().rows
  const cellPadding = densityCellPadding[density]
  // pagination=false 时不渲染分页条；无数据时分页条无意义（空状态已表达），也不渲染
  const showPagination = pagination !== false && table.getRowCount() > 0
  // 工具条渲染策略：
  // - 只传 toolbar（旧用法）：保持右对齐单行，兼容 AdminTable 习惯；
  // - 传 toolbarLeft / toolbarRight：左右分区；三者同时传时 toolbar 内容并入左侧。
  const useSplitToolbar = toolbarLeft !== undefined || toolbarRight !== undefined
  const toolbarNode = useSplitToolbar ? (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {toolbarLeft}
        {toolbar}
      </div>
      <div className="flex flex-wrap items-center gap-2">{toolbarRight}</div>
    </div>
  ) : toolbar ? (
    <div className="flex justify-end gap-2">{toolbar}</div>
  ) : null

  return (
    <div className="grid gap-3" data-slot="c-table">
      {searchBar ? <div data-slot="c-table-search-bar">{searchBar}</div> : null}
      {toolbarNode}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const canSort = enableSorting && header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const isSelectColumn = header.column.id === SELECT_COLUMN_ID
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      // 无障碍：排序状态写在 th 上，读屏软件能直接播报
                      aria-sort={
                        canSort
                          ? sorted === 'asc'
                            ? 'ascending'
                            : sorted === 'desc'
                              ? 'descending'
                              : 'none'
                          : undefined
                      }
                      className={cn(cellPadding.th, isSelectColumn && 'w-10')}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          aria-label={
                            sorted === 'asc'
                              ? '点击改为降序'
                              : sorted === 'desc'
                                ? '点击取消排序'
                                : '点击升序排序'
                          }
                          className={cn(
                            '-ml-1 inline-flex items-center gap-1.5 rounded-sm px-1 py-0.5 transition-colors hover:text-foreground',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon sorted={sorted} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // 骨架屏：用 ui/skeleton，行数固定避免加载时高度跳动
              Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {leafColumns.map(column => (
                    <TableCell key={column.id} className={cellPadding.td}>
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className={cellPadding.td}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={leafColumns.length}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination ? <CTablePagination table={table} /> : null}
    </div>
  )
}
