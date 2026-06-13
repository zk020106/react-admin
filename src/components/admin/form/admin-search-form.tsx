import { Button, Form, type FormInstance } from 'antd'
import { ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { FormSchema } from '@/types/admin'
import { FormApi } from '@/utils/form-api'
import { SchemaForm } from './schema-form'

export interface AdminSearchFormProps {
  /** 首屏展示的查询项数量，其余项由展开按钮控制。 */
  collapsedCount?: number
  /** 默认查询值。 */
  defaultValues?: Record<string, unknown>
  /** 是否默认折叠。 */
  defaultCollapsed?: boolean
  /** Ant Design 表单实例，允许页面层读取或控制表单。 */
  form?: FormInstance
  /** 查询条件 schema。 */
  schema: FormSchema[]
  /** 查询回调。 */
  onSearch: (values: Record<string, unknown>) => Promise<void> | void
  /** 重置回调。 */
  onReset?: () => Promise<void> | void
  /** 搜索模式：manual=手动触发（显示查询按钮），auto=值变化自动触发（隐藏查询按钮）。默认 manual */
  mode?: 'manual' | 'auto'
}

/** 面向列表页的 schema 查询表单，统一查询、重置和展开收起行为。 */
export function AdminSearchForm({
  collapsedCount = 3,
  defaultCollapsed = true,
  defaultValues,
  form: externalForm,
  mode = 'manual',
  onReset,
  onSearch,
  schema
}: AdminSearchFormProps) {
  const [internalForm] = Form.useForm()
  const form = externalForm ?? internalForm
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [submitting, setSubmitting] = useState(false)
  const visibleSchema = useMemo(
    () => (collapsed ? schema.slice(0, collapsedCount) : schema),
    [collapsed, collapsedCount, schema]
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
  const canCollapse = schema.length > collapsedCount
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
    <div className="rounded-md border bg-background p-4" data-slot="admin-search-form">
      <SchemaForm
        api={formApi}
        form={form}
        grid
        gutter={16}
        onFinish={() => void handleSearch()}
        onValuesChange={isAutoMode ? () => void handleSearch() : undefined}
      />
      {isAutoMode ? (
        <div className="mt-4 flex gap-2">
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
    Object.entries(values).filter(([, value]) => value !== undefined && value !== '')
  )
}
