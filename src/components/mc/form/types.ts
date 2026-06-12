import type { FormInstance, FormItemProps } from 'antd'
import type { Rule } from 'antd/es/form'
import type { ReactNode } from 'react'

import type { FormComponentType, FormValueFormat } from '@/types/admin'

export type MCFormControl = Record<
  string,
  {
    disabled?: boolean
    hidden?: boolean
    required?: boolean | string
  }
>

export interface MCFormField {
  component: FormComponentType
  componentProps?: Record<string, unknown>
  defaultValue?: unknown
  disabled?: boolean | ((values: Record<string, unknown>) => boolean)
  extra?: ReactNode
  formItemProps?: Omit<FormItemProps, 'children' | 'help' | 'label' | 'name' | 'rules'>
  help?: ReactNode
  hidden?: boolean | ((values: Record<string, unknown>) => boolean)
  label?: ReactNode
  name: string
  required?: boolean | string
  rules?: Rule[]
  span?: number
  valueFormat?: FormValueFormat
}

export interface MCFormProps {
  children?: ReactNode
  control?: MCFormControl
  disabled?: boolean
  fields: MCFormField[]
  form?: FormInstance
  grid?: boolean
  gutter?: number
  initialValues?: Record<string, unknown>
  layout?: 'horizontal' | 'inline' | 'vertical'
  onFinish?: (values: Record<string, unknown>) => void
  onValuesChange?: (changedValues: Record<string, unknown>, values: Record<string, unknown>) => void
}

export interface MCSearchFormProps {
  collapsedCount?: number
  defaultCollapsed?: boolean
  defaultValues?: Record<string, unknown>
  fields: MCFormField[]
  form?: FormInstance
  onReset?: () => Promise<void> | void
  onSearch: (values: Record<string, unknown>) => Promise<void> | void
}

export interface MCFormModalProps<TValues extends object> {
  control?: MCFormControl
  fields: MCFormField[]
  initialValues?: Partial<TValues>
  open: boolean
  title: string
  width?: number | string
  onCancel: () => void
  onSubmit: (values: TValues) => Promise<void> | void
}
