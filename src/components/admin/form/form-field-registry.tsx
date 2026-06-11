import { Checkbox, DatePicker, Input, Select, Switch } from 'antd'
import type { ReactNode } from 'react'

import type { FormSchema } from '@/types/admin'

type FieldRenderer = (schema: FormSchema) => ReactNode

// schema 组件类型到 antd 控件的渲染映射；componentProps 原样透传。
const fieldRegistry: Record<string, FieldRenderer> = {
  checkbox: schema => <Checkbox {...schema.componentProps} />,
  'date-range': schema => <DatePicker.RangePicker {...schema.componentProps} />,
  input: schema => <Input {...schema.componentProps} />,
  password: schema => <Input.Password {...schema.componentProps} />,
  pin: schema => <Input.OTP {...schema.componentProps} />,
  select: schema => <Select {...schema.componentProps} />,
  switch: schema => <Switch {...schema.componentProps} />
}

/** 按 schema 渲染单个表单控件，未注册类型回退为输入框。 */
export function renderFormField(schema: FormSchema) {
  const renderer = fieldRegistry[schema.component] ?? fieldRegistry.input

  return renderer(schema)
}
