import { useMemo } from 'react'

import { AdminDrawerForm } from '@/components/admin/popup/admin-drawer-form'
import { toFormSchema } from './field-adapter'
import type { MCDrawerFormProps } from './types'

/** MC 表单抽屉：简化的抽屉表单封装 */
export function MCDrawerForm<TValues extends object>({
  control,
  fields,
  initialValues,
  onCancel,
  onSubmit,
  open,
  placement,
  title,
  width
}: MCDrawerFormProps<TValues>) {
  const schema = useMemo(() => toFormSchema(fields, control), [control, fields])

  return (
    <AdminDrawerForm<TValues>
      initialValues={initialValues}
      onCancel={onCancel}
      onSubmit={onSubmit}
      open={open}
      placement={placement}
      schema={schema}
      title={title}
      width={width}
    />
  )
}
