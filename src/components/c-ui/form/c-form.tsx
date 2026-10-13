import { useEffect, useId, useSyncExternalStore, type ReactNode } from 'react'
import { Controller, FormProvider, useFormContext, type UseFormReturn } from 'react-hook-form'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { FormSchema } from '@/types/admin'
import type { FormApi } from '@/utils/form-api'

import { renderCField } from './c-field-registry'
import { toRHFRules } from './use-c-form'

// 类型：CFormLayout。表单布局：vertical 标签在上，horizontal 标签在左，inline 字段横向排列。
export type CFormLayout = 'horizontal' | 'inline' | 'vertical'

// 勾选类控件的标签放在控件右侧（沿用 antd 习惯），其他控件标签在上/左侧。
const CHECK_COMPONENTS = new Set(['checkbox', 'switch'])

// 组件：CFormField。单个 schema 字段：Controller 绑定 + Label + 控件 + 错误信息。
function CFormField({ item, layout }: { item: FormSchema; layout: CFormLayout }) {
  const id = useId()
  const { control } = useFormContext<Record<string, unknown>>()
  const rules = toRHFRules(item.rules)
  const required = rules.required !== undefined
  const isCheck = CHECK_COMPONENTS.has(item.component)

  return (
    <Controller
      control={control}
      // RHF 原生支持点路径，fieldName 可直接作为 name，无需像 antd 那样转 namePath。
      name={item.fieldName}
      rules={rules}
      render={({ field, fieldState }) => {
        const error = fieldState.error !== undefined
        const labelNode =
          item.label == null ? null : (
            <Label htmlFor={id}>
              {item.label}
              {required && (
                // 必填星号用 CSS 伪元素渲染，不进 DOM 文本：
                // 保持 label 的 textContent 干净，getByLabelText('姓名') 这类精确查询不受影响
                //（沿用旧 antd SchemaForm 的做法）。
                <span aria-hidden="true" className="text-destructive after:content-['*']" />
              )}
            </Label>
          )
        const controlNode = renderCField({
          binding: {
            onBlur: field.onBlur,
            onChange: value => field.onChange(value),
            value: field.value
          },
          error,
          id,
          schema: item
        })
        const errorNode =
          fieldState.error?.message == null || fieldState.error.message === '' ? null : (
            <p role="alert" className="text-xs text-destructive">
              {fieldState.error.message}
            </p>
          )

        // 勾选类：控件 + 标签横向排列。
        if (isCheck) {
          return (
            <div data-slot="c-form-field" className="space-y-1.5">
              <div className="flex items-center gap-2">
                {controlNode}
                {labelNode}
              </div>
              {errorNode}
            </div>
          )
        }

        // horizontal：标签左列固定宽度，控件右列。
        if (layout === 'horizontal') {
          return (
            <div
              data-slot="c-form-field"
              className="grid grid-cols-[140px_1fr] items-start gap-x-3"
            >
              <div className="pt-2">{labelNode}</div>
              <div className="space-y-1.5">
                {controlNode}
                {errorNode}
              </div>
            </div>
          )
        }

        // vertical / inline：标签在上。
        return (
          <div data-slot="c-form-field" className="space-y-1.5">
            {labelNode}
            {controlNode}
            {errorNode}
          </div>
        )
      }}
    />
  )
}

/** 组件：CForm。schema 驱动的 C-UI 表单（无 antd 依赖）。
 *  订阅 FormApi 的 schema 快照并把 react-hook-form 挂载为 FormApi 的宿主表单，
 *  消费方可通过 api.submit()/validate()/reset()/setValue() 驱动表单。 */
export function CForm({
  api,
  methods,
  layout = 'vertical'
}: {
  api: FormApi
  methods: UseFormReturn<Record<string, unknown>>
  layout?: CFormLayout
}): ReactNode {
  // 订阅 FormApi 的 schema 快照，使 updateSchema() 后表单能响应式重渲染。
  const schema = useSyncExternalStore(api.subscribe, api.getSchema, api.getSchema)

  useEffect(() => {
    // 把 react-hook-form 适配成 FormApi 的宿主表单契约；values 用 getter 保证读到活值。
    api.mount({
      reset: () => methods.reset(),
      setValue: (fieldName, value) => methods.setValue(fieldName, value),
      submit: () => methods.handleSubmit(() => {})(),
      validate: async () => ({ valid: await methods.trigger() }),
      get values() {
        return methods.getValues()
      }
    })
  }, [api, methods])

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        data-slot="c-form"
        onSubmit={methods.handleSubmit(() => {})}
        className={cn(
          layout === 'inline' && 'flex flex-wrap items-start gap-x-4 gap-y-5',
          layout === 'horizontal' && 'space-y-5',
          layout === 'vertical' && 'space-y-5'
        )}
      >
        {schema.map(item => (
          <CFormField key={item.fieldName} item={item} layout={layout} />
        ))}
      </form>
    </FormProvider>
  )
}
