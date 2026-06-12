import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MCTable } from '@/components/mc'
import type { MCTableAction, MCTableColumn } from '@/components/mc'

interface UserRecord {
  id: string
  name: string
  status: string
}

const dataSource: UserRecord[] = [
  { id: '1', name: 'Moc Chou', status: 'enabled' },
  { id: '2', name: 'Operator', status: 'disabled' }
]

const columns: MCTableColumn<UserRecord>[] = [
  { dataIndex: 'name', key: 'name', title: 'Name' },
  {
    dataIndex: 'status',
    key: 'status',
    render: value => <span>Status: {value}</span>,
    title: 'Status'
  }
]

describe('MCTable', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders Ant Design-style columns, rows, and toolbar', () => {
    render(
      <MCTable<UserRecord>
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        toolbar={<button type="button">Create user</button>}
      />
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Moc Chou')).toBeInTheDocument()
    expect(screen.getByText('Status: enabled')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
  })

  it('passes refresh and column setting tools through', async () => {
    const onRefresh = vi.fn()

    render(
      <MCTable<UserRecord>
        columns={columns}
        dataSource={dataSource}
        onRefresh={onRefresh}
        persistKey="mc:user:table"
        rowKey="id"
        tools={{ columns: true, refresh: true }}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: '刷新表格' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: '列设置' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Status' }))

    expect(within(screen.getByRole('table')).queryByText('Status')).not.toBeInTheDocument()
  })

  it('renders action columns through MC action types', async () => {
    const edit = vi.fn()
    const actions: MCTableAction<UserRecord>[] = [{ key: 'edit', label: 'Edit', onClick: edit }]

    render(
      <MCTable<UserRecord>
        actions={actions}
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
      />
    )

    expect(screen.getByText('操作')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(edit).toHaveBeenCalledWith(dataSource[0])
  })
})
