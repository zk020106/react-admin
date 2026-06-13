import { Form } from 'antd'
import { useMemo } from 'react'

import { SchemaForm } from '@/components/admin/form/schema-form'
import { FormApi } from '@/utils/form-api'
import { toFormSchema } from './field-adapter'
import type { MCFormProps } from './types'

export function MCForm({
  children,
  control,
  fields,
  form: externalForm,
  grid,
  gutter,
  onFinish,
  onValuesChange,
  ...antdFormProps
}: MCFormProps) {
  const [internalForm] = Form.useForm()
  const form = externalForm ?? internalForm
  const schema = useMemo(() => toFormSchema(fields, control), [control, fields])
  const api = useMemo(() => new FormApi({ schema }), [schema])

  return (
    <SchemaForm
      {...antdFormProps}
      api={api}
      form={form}
      grid={grid}
      gutter={gutter}
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
      {typeof children === 'function' ? null : children}
    </SchemaForm>
  )
}
