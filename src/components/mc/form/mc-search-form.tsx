import { Button, Form } from 'antd'
import { ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { FormSchema } from '@/types/admin'
import { FormApi } from '@/utils/form-api'
import { toFormSchema } from './field-adapter'
import { SchemaForm } from './schema-form'
import type { MCSearchFormProps } from './types'

interface MCSearchFormComponentProps extends MCSearchFormProps {
  /**
   * 直接以 FormSchema 传入；与 fields 二选一。
   * 提供 schema 时跳过 MCFormField → FormSchema 的转换，便于复用既有 schema 配置。
   */
  schema?: FormSchema[]
}

/** 面向列表页的 schema 查询表单，统一查询、重置和展开收起行为。 */
export function MCSearchForm({
  collapsedCount = 3,
  defaultCollapsed = true,
  defaultValues,
  fields,
  form: externalForm,
  mode = 'manual',
  onReset,
  onSearch,
  schema
}: MCSearchFormComponentProps) {
  const [internalForm] = Form.useForm()
  const form = externalForm ?? internalForm
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [submitting, setSubmitting] = useState(false)
  const resolvedSchema = useMemo(() => schema ?? toFormSchema(fields ?? []), [fields, schema])
  const visibleSchema = useMemo(
    () => (collapsed ? resolvedSchema.slice(0, collapsedCount) : resolvedSchema),
    [collapsed, collapsedCount, resolvedSchema]
  )
  const formApi = useMemo(
    () =>
      new FormApi({
        schema: visibleSchema.map(item => ({
          ...item,
          defaultValue: defaultValues?.[item.fieldName] ?? item.defaultValue
        }))
      }),
    [defaultValues, visibleSchema]
  )
  const canCollapse = resolvedSchema.length > collapsedCount
  const isAutoMode = mode === 'auto'

  async function handleSearch() {
    setSubmitting(true)
    try {
      const values = await formApi.submit()
      if (values) {
        await onSearch(cleanSearchValues(values))
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset() {
    form.resetFields()
    await onReset?.()
    await handleSearch()
  }

  return (
    <div className="rounded-md border bg-background p-4" data-slot="mc-search-form">
      <SchemaForm
        api={formApi}
        form={form}
        grid
        gutter={16}
        onFinish={() => void handleSearch()}
        onValuesChange={isAutoMode ? () => void handleSearch() : undefined}
      />
      {isAutoMode ? (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            htmlType="button"
            icon={<RotateCcw className="size-4" />}
            onClick={() => void handleReset()}
          >
            重置
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            htmlType="button"
            icon={<RotateCcw className="size-4" />}
            onClick={() => void handleReset()}
          >
            重置
          </Button>
          <Button
            htmlType="submit"
            icon={<Search className="size-4" />}
            loading={submitting}
            onClick={() => void handleSearch()}
            type="primary"
          >
            查询
          </Button>
          {canCollapse ? (
            <Button
              aria-expanded={!collapsed}
              icon={
                collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />
              }
              onClick={() => setCollapsed(value => !value)}
              type="text"
            >
              {collapsed ? '展开' : '收起'}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}

function cleanSearchValues(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        value !== undefined &&
        value !== '' &&
        value !== null &&
        !(Array.isArray(value) && value.length === 0)
    )
  )
}
