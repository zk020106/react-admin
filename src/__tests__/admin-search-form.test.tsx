import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MCSearchForm } from '@/components/mc'
import type { FormSchema } from '@/types/admin'

const schema: FormSchema[] = [
  { component: 'input', fieldName: 'keyword', label: '关键词' },
  {
    component: 'select',
    componentProps: { options: [{ label: '启用', value: '启用' }] },
    fieldName: 'status',
    label: '状态'
  },
  { component: 'input', fieldName: 'department', label: '部门' }
]

describe('mc search form', () => {
  afterEach(() => {
    cleanup()
  })

  it('submits schema values and resets to defaults', async () => {
    const onSearch = vi.fn()

    render(
      <MCSearchForm
        collapsedCount={2}
        defaultValues={{ status: '启用' }}
        onSearch={onSearch}
        schema={schema}
      />
    )

    expect(screen.queryByLabelText('部门')).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('关键词'), 'audit')
    await userEvent.click(screen.getByRole('button', { name: '查询' }))

    expect(onSearch).toHaveBeenLastCalledWith({ keyword: 'audit', status: '启用' })

    await userEvent.click(screen.getByRole('button', { name: '展开' }))
    expect(screen.getByLabelText('部门')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(onSearch).toHaveBeenLastCalledWith({ status: '启用' })
  })
})
