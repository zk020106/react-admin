import { Col, Form, Row, type FormInstance } from 'antd'
import type { Rule } from 'antd/es/form'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'

import type { FormSchema } from '@/types/admin'
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
  children,
  disabled = false,
  form,
  grid = false,
  gutter = 16,
  layout = 'vertical',
  onFinish
}: {
  api: FormApi
  children?: ReactNode
  disabled?: boolean
  form: FormInstance
  grid?: boolean
  gutter?: number
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
  const values = Form.useWatch([], form) ?? form.getFieldsValue(true)

  function renderItem(item: FormSchema) {
    const hidden =
      typeof item.hidden === 'function'
        ? item.hidden(values as Record<string, unknown>)
        : item.hidden

    if (hidden) {
      return null
    }

    const itemDisabled =
      disabled ||
      (typeof item.disabled === 'function'
        ? item.disabled(values as Record<string, unknown>)
        : item.disabled)
    const field = renderFormField({
      ...item,
      componentProps: {
        ...item.componentProps,
        disabled: itemDisabled ?? item.componentProps?.disabled
      }
    })
    const formItem = (
      <Form.Item
        extra={item.extra}
        help={item.help}
        label={item.label}
        name={toNamePath(item.fieldName)}
        rules={item.rules as Rule[] | undefined}
        valuePropName={CHECKED_COMPONENTS.has(item.component) ? 'checked' : 'value'}
      >
        {field}
      </Form.Item>
    )

    return grid ? (
      <Col key={item.fieldName} span={item.span ?? 8}>
        {formItem}
      </Col>
    ) : (
      <div key={item.fieldName}>{formItem}</div>
    )
  }

  return (
    <Form form={form} initialValues={initialValues} layout={layout} onFinish={onFinish}>
      {grid ? <Row gutter={gutter}>{schema.map(renderItem)}</Row> : schema.map(renderItem)}
      {children}
    </Form>
  )
}
