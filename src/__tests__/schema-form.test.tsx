import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SchemaForm } from '@/components/mc/form/schema-form'
import { useMCForm } from '@/components/mc/form/use-mc-form'
import type { FormApi, FormApiOptions } from '@/utils/form-api'

function Harness({
  onReady,
  options
}: {
  onReady: (api: FormApi) => void
  options: FormApiOptions
}) {
  const [api, form] = useMCForm(options)

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

  it('re-renders fields when updateSchema changes the schema', async () => {
    const api = renderSchemaForm({
      schema: [{ component: 'input', fieldName: 'email', label: 'Email' }]
    })

    expect(screen.getByLabelText('Email')).toBeInTheDocument()

    // updateSchema 应触发响应式重渲染，新标签随之出现。
    await act(async () => {
      api.updateSchema([{ fieldName: 'email', label: 'Work email' }])
    })

    expect(screen.getByLabelText('Work email')).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })
})
