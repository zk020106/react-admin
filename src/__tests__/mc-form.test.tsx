import { Button, Form } from 'antd'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MCForm } from '@/components/mc'
import { toFormSchema } from '@/components/mc/form/field-adapter'
import type { MCFormField } from '@/components/mc'

describe('MCForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('adapts React-style field names to the existing schema shape', () => {
    const fields: MCFormField[] = [
      {
        component: 'input',
        componentProps: { placeholder: 'Enter username' },
        label: 'Username',
        name: 'username',
        required: true
      }
    ]

    expect(toFormSchema(fields)).toMatchObject([
      {
        component: 'input',
        componentProps: { placeholder: 'Enter username' },
        fieldName: 'username',
        label: 'Username'
      }
    ])
    expect(toFormSchema(fields)[0]?.rules).toEqual([
      { message: 'Please enter Username', required: true }
    ])
  })

  it('renders fields, validates required fields, and submits values', async () => {
    const onFinish = vi.fn()

    render(
      <MCForm
        fields={[
          {
            component: 'input',
            label: 'Username',
            name: 'username',
            required: true
          }
        ]}
        onFinish={onFinish}
      >
        <Button htmlType="submit">Save</Button>
      </MCForm>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Please enter Username')).toBeInTheDocument()
    expect(onFinish).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText('Username'), 'moc chou')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledWith({ username: 'moc chou' })
    })
  })

  it('applies control hidden, disabled, and required overrides', async () => {
    render(
      <MCForm
        control={{
          role: { hidden: true },
          status: { disabled: true },
          username: { required: 'Username is required by control' }
        }}
        fields={[
          { component: 'input', label: 'Username', name: 'username' },
          { component: 'input', label: 'Status', name: 'status' },
          { component: 'input', label: 'Role', name: 'role' }
        ]}
      >
        <Button htmlType="submit">Save</Button>
      </MCForm>
    )

    expect(screen.queryByLabelText('Role')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Username is required by control')).toBeInTheDocument()
  })

  it('uses external form instances, initialValues, and onValuesChange', async () => {
    const onValuesChange = vi.fn()

    function Harness() {
      const [form] = Form.useForm()

      return (
        <MCForm
          fields={[{ component: 'input', label: 'Username', name: 'username' }]}
          form={form}
          initialValues={{ username: 'initial' }}
          onValuesChange={onValuesChange}
        />
      )
    }

    render(<Harness />)

    expect(screen.getByLabelText('Username')).toHaveValue('initial')
    await userEvent.clear(screen.getByLabelText('Username'))
    await userEvent.type(screen.getByLabelText('Username'), 'next')

    expect(onValuesChange).toHaveBeenLastCalledWith({ username: 'next' }, { username: 'next' })
  })
})
