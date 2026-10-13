import type { ColumnDef } from '@tanstack/react-table'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { CTable } from '@/components/c-ui/table'

interface DemoRecord {
  id: string
  name: string
}

const columns: ColumnDef<DemoRecord>[] = [
  { accessorKey: 'id', header: '编号' },
  { accessorKey: 'name', header: '姓名' }
]

function makeData(count: number): DemoRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `u-${index + 1}`,
    name: `user-${index + 1}`
  }))
}

describe('c-table', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders columns, rows and the toolbar slot', () => {
    render(
      <CTable<DemoRecord>
        columns={columns}
        data={makeData(2)}
        getRowId={row => row.id}
        toolbar={<button type="button">新增用户</button>}
      />
    )

    expect(screen.getByText('编号')).toBeInTheDocument()
    expect(screen.getByText('user-1')).toBeInTheDocument()
    expect(screen.getByText('user-2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增用户' })).toBeInTheDocument()
  })

  it('omits the toolbar row when no toolbar is provided', () => {
    const { container } = render(
      <CTable<DemoRecord>
        columns={columns}
        data={makeData(2)}
        getRowId={row => row.id}
        pagination={false}
      />
    )

    // 无 toolbar 且关闭分页时，根节点下只有表格区一个子节点。
    expect(container.querySelector("[data-slot='c-table']")?.childElementCount).toBe(1)
  })

  it('switches pages with the pagination controls', async () => {
    render(<CTable<DemoRecord> columns={columns} data={makeData(12)} getRowId={row => row.id} />)

    expect(screen.getByText('user-10')).toBeInTheDocument()
    expect(screen.queryByText('user-11')).not.toBeInTheDocument()
    expect(screen.getByText('共 12 条')).toBeInTheDocument()
    expect(screen.getByText('第 1 / 共 2 页')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '下一页' }))

    expect(screen.getByText('user-11')).toBeInTheDocument()
    expect(screen.getByText('user-12')).toBeInTheDocument()
    expect(screen.queryByText('user-1')).not.toBeInTheDocument()
    expect(screen.getByText('第 2 / 共 2 页')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '上一页' }))

    expect(screen.getByText('user-1')).toBeInTheDocument()
    expect(screen.queryByText('user-11')).not.toBeInTheDocument()
  })

  it('toggles sorting when the header button is clicked', async () => {
    const data = [
      { id: 'a', name: 'Bravo' },
      { id: 'b', name: 'Alpha' }
    ]

    render(<CTable<DemoRecord> columns={columns} data={data} getRowId={row => row.id} />)

    const header = screen.getByRole('columnheader', { name: /姓名/ })
    await userEvent.click(within(header).getByRole('button', { name: '点击升序排序' }))

    const rows = screen.getAllByRole('row')
    // 首行是表头，其余为数据行：升序后 Alpha 排在 Bravo 前面。
    expect(within(rows[1]).getByText('Alpha')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Bravo')).toBeInTheDocument()

    await userEvent.click(within(header).getByRole('button', { name: '点击改为降序' }))

    const descRows = screen.getAllByRole('row')
    expect(within(descRows[1]).getByText('Bravo')).toBeInTheDocument()
    expect(within(descRows[2]).getByText('Alpha')).toBeInTheDocument()
  })

  it('renders searchBar above a split toolbar', () => {
    const { container } = render(
      <CTable<DemoRecord>
        columns={columns}
        data={makeData(2)}
        getRowId={row => row.id}
        searchBar={<div>搜索区</div>}
        toolbarLeft={<button type="button">新增</button>}
        toolbarRight={<button type="button">刷新</button>}
      />
    )

    const root = container.querySelector("[data-slot='c-table']")
    const searchSlot = container.querySelector("[data-slot='c-table-search-bar']")

    expect(searchSlot).toBeInTheDocument()
    expect(screen.getByText('搜索区')).toBeInTheDocument()
    // 三段式顺序：搜索区 → 工具栏 → 表格。
    expect(root?.children[0]).toBe(searchSlot)
    expect(screen.getByRole('button', { name: '新增' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()
  })

  it('merges the legacy toolbar into the left when split props are used', () => {
    render(
      <CTable<DemoRecord>
        columns={columns}
        data={makeData(2)}
        getRowId={row => row.id}
        toolbar={<button type="button">旧工具条</button>}
        toolbarLeft={<button type="button">新增</button>}
      />
    )

    const leftGroup = screen.getByRole('button', { name: '新增' }).parentElement

    expect(leftGroup).toContainElement(screen.getByRole('button', { name: '旧工具条' }))
  })

  it('renders the empty state when there is no data', () => {
    render(<CTable<DemoRecord> columns={columns} data={[]} getRowId={row => row.id} />)

    expect(screen.getByText('暂无数据')).toBeInTheDocument()
    // 空状态不渲染分页条。
    expect(screen.queryByRole('button', { name: '下一页' })).not.toBeInTheDocument()
  })

  it('renders a custom empty text', () => {
    render(
      <CTable<DemoRecord>
        columns={columns}
        data={[]}
        emptyText="没有符合条件的数据"
        getRowId={row => row.id}
      />
    )

    expect(screen.getByText('没有符合条件的数据')).toBeInTheDocument()
  })
})
