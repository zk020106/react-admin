import type { FormInstance, FormItemProps, FormProps } from 'antd'
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
  lg?: number
  md?: number
  name: string
  required?: boolean | string
  rules?: Rule[]
  sm?: number
  span?: number
  valueFormat?: FormValueFormat
  xl?: number
  xs?: number
  xxl?: number
}

export interface MCFormProps extends Omit<FormProps, 'onFinish' | 'onValuesChange'> {
  // MC 扩展属性
  control?: MCFormControl
  fields: MCFormField[]
  grid?: boolean
  gutter?: number

  // 重写的属性（改变类型签名）
  onFinish?: (values: Record<string, unknown>) => void
  onValuesChange?: (changedValues: Record<string, unknown>, values: Record<string, unknown>) => void
}

export interface MCSearchFormProps {
  collapsedCount?: number
  defaultCollapsed?: boolean
  defaultValues?: Record<string, unknown>
  fields: MCFormField[]
  form?: FormInstance
  mode?: 'manual' | 'auto'
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

export interface MCDrawerFormProps<TValues extends object> {
  control?: MCFormControl
  fields: MCFormField[]
  initialValues?: Partial<TValues>
  open: boolean
  placement?: 'left' | 'right' | 'top' | 'bottom'
  title: string
  width?: number | string
  onCancel: () => void
  onSubmit: (values: TValues) => Promise<void> | void
}
