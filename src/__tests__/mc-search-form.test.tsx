import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MCSearchForm } from '@/components/mc'
import type { MCFormField } from '@/components/mc'

const fields: MCFormField[] = [
  { component: 'input', label: 'Keyword', name: 'keyword' },
  {
    component: 'select',
    componentProps: { options: [{ label: 'Enabled', value: 'enabled' }] },
    label: 'Status',
    name: 'status'
  },
  { component: 'input', label: 'Department', name: 'department' }
]

describe('MCSearchForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a collapsed search form and submits cleaned values', async () => {
    const onSearch = vi.fn()
    const onReset = vi.fn()

    render(
      <MCSearchForm
        collapsedCount={2}
        defaultValues={{ status: 'enabled' }}
        fields={fields}
        onReset={onReset}
        onSearch={onSearch}
      />
    )

    expect(screen.queryByLabelText('Department')).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Keyword'), 'audit')
    await userEvent.click(screen.getByRole('button', { name: '查询' }))

    expect(onSearch).toHaveBeenLastCalledWith({ keyword: 'audit', status: 'enabled' })

    await userEvent.click(screen.getByRole('button', { name: '展开' }))
    expect(screen.getByLabelText('Department')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Keyword'))
    await userEvent.click(screen.getByRole('button', { name: '重置' }))

    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenLastCalledWith({ status: 'enabled' })
  })
})
