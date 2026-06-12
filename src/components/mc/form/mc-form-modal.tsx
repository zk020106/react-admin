import { useMemo } from 'react'

import { AdminFormModal } from '@/components/admin/form/admin-form-modal'
import { toFormSchema } from './field-adapter'
import type { MCFormModalProps } from './types'

export function MCFormModal<TValues extends object>({
  control,
  fields,
  initialValues,
  onCancel,
  onSubmit,
  open,
  title,
  width
}: MCFormModalProps<TValues>) {
  const schema = useMemo(() => toFormSchema(fields, control), [control, fields])

  return (
    <AdminFormModal<TValues>
      initialValues={initialValues}
      onCancel={onCancel}
      onSubmit={onSubmit}
      open={open}
      schema={schema}
      title={title}
      width={width}
    />
  )
}
