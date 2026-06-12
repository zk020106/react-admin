import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminFormModal } from '@/components/admin/form/admin-form-modal'

describe('admin form modal', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps invalid forms open and submits valid values', async () => {
    const onCancel = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <AdminFormModal<{ name: string }>
        onCancel={onCancel}
        onSubmit={onSubmit}
        open
        schema={[
          {
            component: 'input',
            fieldName: 'name',
            label: '姓名',
            rules: [{ message: '请输入姓名', required: true }]
          }
        ]}
        title="新增用户"
      />
    )

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /确 定|OK/ }))

    expect(await within(dialog).findByText('请输入姓名')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()

    await userEvent.type(within(dialog).getByLabelText('姓名'), '测试账号')
    await userEvent.click(within(dialog).getByRole('button', { name: /确 定|OK/ }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: '测试账号' })
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })
})
