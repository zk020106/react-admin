import { Form, type FormInstance } from 'antd'
import type { Rule } from 'antd/es/form'
import { useEffect, useSyncExternalStore } from 'react'

import type { FormApi } from '@/utils/form-api'
import { renderFormField } from './form-field-registry'

// 函数：toNamePath。把点路径字段名转换为 antd 的 namePath 数组。
function toNamePath(fieldName: string) {
  return fieldName.includes('.') ? fieldName.split('.') : fieldName
}

// 勾选类控件的受控属性是 checked 而不是 value。
const CHECKED_COMPONENTS = new Set(['checkbox', 'switch'])

/** schema 驱动的 antd 表单：挂载 FormApi 并按字段清单渲染。
 *  消费方需位于 AdminConfigProvider 内以获得主题与语言上下文。 */
export function SchemaForm({
  api,
  form,
  layout = 'vertical',
  onFinish
}: {
  api: FormApi
  form: FormInstance
  layout?: 'horizontal' | 'inline' | 'vertical'
  onFinish?: (values: Record<string, unknown>) => void
}) {
  // 订阅 FormApi 的 schema 快照，使 updateSchema() 后表单能响应式重渲染。
  const schema = useSyncExternalStore(api.subscribe, api.getSchema, api.getSchema)

  useEffect(() => {
    // 把 antd FormInstance 适配成 FormApi 的宿主表单契约；values 用 getter 保证读到活值。
    api.mount({
      reset: () => form.resetFields(),
      setValue: (fieldName, value) => form.setFieldValue(toNamePath(fieldName), value),
      submit: () => {},
      validate: async () => {
        try {
          await form.validateFields()
          return { valid: true }
        } catch (errorInfo) {
          return { errors: errorInfo as Record<string, unknown>, valid: false }
        }
      },
      get values() {
        return form.getFieldsValue(true) as Record<string, unknown>
      }
    })
  }, [api, form])

  const initialValues = Object.fromEntries(
    schema
      .filter(item => item.defaultValue !== undefined)
      .map(item => [item.fieldName, item.defaultValue])
  )

  return (
    <Form form={form} initialValues={initialValues} layout={layout} onFinish={onFinish}>
      {schema.map(item => (
        <Form.Item
          key={item.fieldName}
          label={item.label}
          name={toNamePath(item.fieldName)}
          rules={item.rules as Rule[] | undefined}
          valuePropName={CHECKED_COMPONENTS.has(item.component) ? 'checked' : 'value'}
        >
          {renderFormField(item)}
        </Form.Item>
      ))}
    </Form>
  )
}
