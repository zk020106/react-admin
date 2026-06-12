import { Form } from 'antd'
import { useMemo } from 'react'

import { SchemaForm } from '@/components/admin/form/schema-form'
import { FormApi } from '@/utils/form-api'
import { toFormSchema } from './field-adapter'
import type { MCFormProps } from './types'

export function MCForm({
  children,
  control,
  disabled,
  fields,
  form: externalForm,
  grid,
  gutter,
  initialValues,
  layout,
  onFinish,
  onValuesChange
}: MCFormProps) {
  const [internalForm] = Form.useForm()
  const form = externalForm ?? internalForm
  const schema = useMemo(() => toFormSchema(fields, control), [control, fields])
  const api = useMemo(() => new FormApi({ schema }), [schema])

  return (
    <SchemaForm
      api={api}
      disabled={disabled}
      form={form}
      grid={grid}
      gutter={gutter}
      initialValues={initialValues}
      layout={layout}
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
      {children}
    </SchemaForm>
  )
}
