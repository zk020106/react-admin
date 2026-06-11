import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SchemaForm } from '@/components/admin/form/schema-form'
import { useAdminForm } from '@/components/admin/form/use-admin-form'
import type { FormApi, FormApiOptions } from '@/utils/form-api'

function Harness({
  onReady,
  options
}: {
  onReady: (api: FormApi) => void
  options: FormApiOptions
}) {
  const [api, form] = useAdminForm(options)

  onReady(api)

  return <SchemaForm api={api} form={form} />
}

function renderSchemaForm(options: FormApiOptions) {
  let api: FormApi | undefined

  render(
    <Harness
      onReady={instance => {
        api = instance
      }}
      options={options}
    />
  )

  if (!api) {
    throw new Error('FormApi 未初始化')
  }

  return api
}

describe('schema form', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders fields from schema with labels and default values', () => {
    renderSchemaForm({
      schema: [
        { component: 'input', defaultValue: 'Root', fieldName: 'name', label: '姓名' },
        { component: 'select', fieldName: 'role', label: '角色' }
      ]
    })

    expect(screen.getByLabelText('姓名')).toHaveValue('Root')
    expect(screen.getByRole('combobox', { name: '角色' })).toBeInTheDocument()
  })

  it('blocks submit when required rules fail', async () => {
    const handleSubmit = vi.fn()
    const api = renderSchemaForm({
      handleSubmit,
      schema: [
        {
          component: 'input',
          fieldName: 'name',
          label: '姓名',
          rules: [{ message: '请输入姓名', required: true }]
        }
      ]
    })

    const result = await api.submit()

    expect(result).toBeUndefined()
    expect(handleSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText('请输入姓名')).toBeInTheDocument()
  })

  it('submits typed values through the FormApi pipeline', async () => {
    const handleSubmit = vi.fn()
    const api = renderSchemaForm({
      handleSubmit,
      schema: [
        {
          component: 'input',
          fieldName: 'name',
          label: '姓名',
          rules: [{ message: '请输入姓名', required: true }]
        }
      ]
    })

    await userEvent.type(screen.getByLabelText('姓名'), '测试账号')

    const result = await api.submit()

    expect(result).toEqual({ name: '测试账号' })
    expect(handleSubmit).toHaveBeenCalledWith({ name: '测试账号' })
  })

  it('reads live values after programmatic setValue', async () => {
    const api = renderSchemaForm({
      schema: [{ component: 'input', defaultValue: 'before', fieldName: 'name', label: '姓名' }]
    })

    api.setValue('name', 'after')

    await expect(api.getValues()).resolves.toEqual({ name: 'after' })
  })
})
