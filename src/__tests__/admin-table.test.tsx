import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminTable } from '@/components/admin/table/admin-table'
import type { AdminColumn, AdminTableAction } from '@/components/admin/table/types'

interface DemoRecord {
  id: string
  name: string
}

const columns = [{ dataIndex: 'name', key: 'name', title: '姓名' }]
const multiColumns: AdminColumn<DemoRecord>[] = [
  { dataIndex: 'name', key: 'name', title: '姓名' },
  { dataIndex: 'id', key: 'id', title: '编号' }
]
const dataSource: DemoRecord[] = [
  { id: 'a', name: '超级管理员' },
  { id: 'b', name: '运营账号' }
]

describe('admin table', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders columns, rows and the toolbar slot', () => {
    render(
      <AdminTable<DemoRecord>
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        toolbar={<button type="button">新增用户</button>}
      />
    )

    expect(screen.getByText('姓名')).toBeInTheDocument()
    expect(screen.getByText('超级管理员')).toBeInTheDocument()
    expect(screen.getByText('运营账号')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增用户' })).toBeInTheDocument()
  })

  it('omits the toolbar row when no toolbar is provided', () => {
    const { container } = render(
      <AdminTable<DemoRecord> columns={columns} dataSource={dataSource} rowKey="id" />
    )

    expect(container.querySelector("[data-slot='admin-table']")?.childElementCount).toBe(1)
  })

  it('supports refresh, density and column visibility tools', async () => {
    const refresh = vi.fn()

    render(
      <AdminTable<DemoRecord>
        columns={columns}
        dataSource={dataSource}
        onRefresh={refresh}
        rowKey="id"
        tools={{ columns: true, density: true, refresh: true }}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: '刷新表格' }))
    expect(refresh).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: '列设置' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: '姓名' }))

    const table = screen.getByRole('table')

    expect(within(table).queryByText('姓名')).not.toBeInTheDocument()
    expect(within(table).queryByText('超级管理员')).not.toBeInTheDocument()
  })

  it('renders an action column and runs the click handler', async () => {
    const edit = vi.fn()
    const actions: AdminTableAction<DemoRecord>[] = [{ key: 'edit', label: '编辑', onClick: edit }]

    render(
      <AdminTable<DemoRecord>
        actions={actions}
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
      />
    )

    expect(screen.getByText('操作')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: '编辑' })[0])
    expect(edit).toHaveBeenCalledWith(dataSource[0])
  })

  it('defers a confirmed action until confirmation', async () => {
    const remove = vi.fn()
    const actions: AdminTableAction<DemoRecord>[] = [
      {
        confirm: { title: '确认删除？' },
        danger: true,
        key: 'delete',
        label: '删除',
        onClick: remove
      }
    ]

    render(
      <AdminTable<DemoRecord>
        actions={actions}
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
      />
    )

    await userEvent.click(screen.getAllByRole('button', { name: '删除' })[0])
    expect(remove).not.toHaveBeenCalled()

    await userEvent.click(await screen.findByRole('button', { name: /确\s*认/ }))
    expect(remove).toHaveBeenCalledWith(dataSource[0])
  })

  it('shows the batch toolbar only when rows are selected', async () => {
    render(
      <AdminTable<DemoRecord>
        batchToolbar={({ selectedRowKeys }) => (
          <button type="button">批量删除 {selectedRowKeys.length}</button>
        )}
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        rowSelection
      />
    )

    expect(screen.queryByText(/已选/)).not.toBeInTheDocument()

    const [, firstRowCheckbox] = screen.getAllByRole('checkbox')
    await userEvent.click(firstRowCheckbox)

    expect(screen.getByText('已选 1 项')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '批量删除 1' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '取消选择' }))
    expect(screen.queryByText(/已选/)).not.toBeInTheDocument()
  })

  it('persists hidden columns across remounts via persistKey', async () => {
    const { unmount } = render(
      <AdminTable<DemoRecord>
        columns={multiColumns}
        dataSource={dataSource}
        persistKey="test:demo:table"
        rowKey="id"
        tools={{ columns: true }}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: '列设置' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: '编号' }))
    expect(within(screen.getByRole('table')).queryByText('编号')).not.toBeInTheDocument()

    unmount()

    render(
      <AdminTable<DemoRecord>
        columns={multiColumns}
        dataSource={dataSource}
        persistKey="test:demo:table"
        rowKey="id"
        tools={{ columns: true }}
      />
    )

    expect(within(screen.getByRole('table')).queryByText('编号')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '列设置' }))
    await userEvent.click(await screen.findByRole('button', { name: /重\s*置/ }))
    expect(within(screen.getByRole('table')).getByText('编号')).toBeInTheDocument()
  })
})
