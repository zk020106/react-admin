import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MCFormModal } from '@/components/mc'
import type { MCFormField } from '@/components/mc'

interface UserInput {
  email: string
  name: string
  role: string
}

const fields: MCFormField[] = [
  { component: 'input', label: 'Name', name: 'name', required: true },
  { component: 'input', label: 'Email', name: 'email', required: 'Please provide a valid email' },
  {
    component: 'select',
    componentProps: {
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' }
      ]
    },
    label: 'Role',
    name: 'role'
  }
]

describe('MCFormModal', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a modal with MC fields', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(
      <MCFormModal<UserInput>
        fields={fields}
        onCancel={onCancel}
        onSubmit={onSubmit}
        open={true}
        title="Create User"
      />
    )

    expect(screen.getByText('Create User')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
  })

  it('fills initial values and submits', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onCancel = vi.fn()

    render(
      <MCFormModal<UserInput>
        fields={fields}
        initialValues={{ email: 'moc@example.com', name: 'Moc Chou', role: 'admin' }}
        onCancel={onCancel}
        onSubmit={onSubmit}
        open={true}
        title="Edit User"
      />
    )

    expect(screen.getByDisplayValue('Moc Chou')).toBeInTheDocument()
    expect(screen.getByDisplayValue('moc@example.com')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'OK' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'moc@example.com',
        name: 'Moc Chou',
        role: 'admin'
      })
    })

    expect(onCancel).toHaveBeenCalled()
  })

  it('validates required fields before submit', async () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(
      <MCFormModal<UserInput>
        fields={fields}
        onCancel={onCancel}
        onSubmit={onSubmit}
        open={true}
        title="Create User"
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'OK' }))

    await waitFor(() => {
      expect(screen.getByText('Please enter Name')).toBeInTheDocument()
    })

    expect(screen.getByText('Please provide a valid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('applies control prop to override field states', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(
      <MCFormModal<UserInput>
        control={{ email: { disabled: true }, role: { hidden: true } }}
        fields={fields}
        onCancel={onCancel}
        onSubmit={onSubmit}
        open={true}
        title="Create User"
      />
    )

    const emailInput = screen.getByLabelText('Email')
    expect(emailInput).toBeDisabled()

    expect(screen.queryByText('Role')).not.toBeInTheDocument()
  })
})
