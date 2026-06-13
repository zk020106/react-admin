import { useMemo, useState } from 'react'

export interface UseTablePagination {
  current: number
  pageSize: number
}

export interface UseTableOptions<TRecord, TFilters extends Record<string, unknown>> {
  dataSource: TRecord[]
  defaultFilters?: TFilters
  defaultPagination?: Partial<UseTablePagination>
  filter?: (record: TRecord, filters: TFilters) => boolean
}

const DEFAULT_PAGINATION: UseTablePagination = {
  current: 1,
  pageSize: 10
}

export function useTable<
  TRecord,
  TFilters extends Record<string, unknown> = Record<string, unknown>
>({ dataSource, defaultFilters, defaultPagination, filter }: UseTableOptions<TRecord, TFilters>) {
  const [filters, setFilters] = useState<TFilters>(
    () => ({ ...defaultFilters }) as TFilters
  )
  const [pagination, setPagination] = useState<UseTablePagination>(() => ({
    ...DEFAULT_PAGINATION,
    ...defaultPagination
  }))

  const filteredData = useMemo(() => {
    if (!filter) {
      return dataSource
    }

    return dataSource.filter(record => filter(record, filters))
  }, [dataSource, filter, filters])

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pagination.pageSize))
  const currentPage = Math.min(pagination.current, pageCount)
  const effectivePagination = useMemo(
    () => ({
      ...pagination,
      current: currentPage
    }),
    [currentPage, pagination]
  )

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pagination.pageSize
    return filteredData.slice(start, start + pagination.pageSize)
  }, [currentPage, filteredData, pagination.pageSize])

  function search(nextFilters: Record<string, unknown>) {
    setFilters(nextFilters as TFilters)
    setPagination(value => ({ ...value, current: 1 }))
  }

  function reset() {
    setFilters({ ...defaultFilters } as TFilters)
    setPagination(value => ({ ...value, current: 1 }))
  }

  function setPage(current: number, pageSize = pagination.pageSize) {
    const nextPageSize = Math.max(1, pageSize)
    const nextPageCount = Math.max(1, Math.ceil(filteredData.length / nextPageSize))
    setPagination({
      current: Math.min(Math.max(1, current), nextPageCount),
      pageSize: nextPageSize
    })
  }

  return {
    filteredData,
    filters,
    pageCount,
    pagedData,
    pagination: effectivePagination,
    reset,
    search,
    setPage,
    setPagination,
    total: filteredData.length
  }
}
