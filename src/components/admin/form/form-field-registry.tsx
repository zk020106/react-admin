import { Checkbox, DatePicker, Input, InputNumber, Radio, Select, Switch, TreeSelect } from 'antd'
import type { ReactNode } from 'react'

import type { FormSchema } from '@/types/admin'

type FieldRenderer = (schema: FormSchema) => ReactNode

// schema 组件类型到 antd 控件的渲染映射；componentProps 原样透传。
const fieldRegistry = new Map<string, FieldRenderer>([
  ['checkbox', schema => <Checkbox {...schema.componentProps} />],
  ['date', schema => <DatePicker className="w-full" {...schema.componentProps} />],
  [
    'date-range',
    schema => <DatePicker.RangePicker className="w-full" {...schema.componentProps} />
  ],
  ['input', schema => <Input {...schema.componentProps} />],
  ['number', schema => <InputNumber className="w-full" {...schema.componentProps} />],
  ['password', schema => <Input.Password {...schema.componentProps} />],
  ['pin', schema => <Input.OTP {...schema.componentProps} />],
  ['radio', schema => <Radio.Group {...schema.componentProps} />],
  ['select', schema => <Select {...schema.componentProps} />],
  ['switch', schema => <Switch {...schema.componentProps} />],
  ['textarea', schema => <Input.TextArea {...schema.componentProps} />],
  ['tree-select', schema => <TreeSelect {...schema.componentProps} />]
])

/** 注册业务自定义字段渲染器，重复注册会覆盖旧实现。 */
export function registerAdminFormField(component: string, renderer: FieldRenderer) {
  fieldRegistry.set(component, renderer)
}

/** 按 schema 渲染单个表单控件，未注册类型回退为输入框。 */
export function renderFormField(schema: FormSchema) {
  const renderer = fieldRegistry.get(schema.component) ?? fieldRegistry.get('input')

  return renderer?.(schema) ?? null
}
