import type { ReactNode } from 'react'

import type { FormSchema } from '@/types/admin'
import type { MCFormControl, MCFormField } from './types'

function getLabelText(label: ReactNode) {
  return typeof label === 'string' && label.trim().length > 0 ? label : 'this field'
}

function createRequiredRule(required: boolean | string | undefined, label: ReactNode) {
  if (!required) {
    return undefined
  }

  return {
    message: typeof required === 'string' ? required : `Please enter ${getLabelText(label)}`,
    required: true
  }
}

function mergeBooleanControl(
  fieldValue: boolean | ((values: Record<string, unknown>) => boolean) | undefined,
  controlValue: boolean | undefined
) {
  if (controlValue === true) {
    return true
  }

  return fieldValue
}

export function toFormSchema(fields: MCFormField[], control: MCFormControl = {}): FormSchema[] {
  return fields.map(field => {
    const fieldControl = control[field.name]
    const required = fieldControl?.required ?? field.required
    const requiredRule = createRequiredRule(required, field.label)

    return {
      component: field.component,
      componentProps: field.componentProps,
      defaultValue: field.defaultValue,
      disabled: mergeBooleanControl(field.disabled, fieldControl?.disabled),
      extra: field.extra,
      fieldName: field.name,
      formItemProps: field.formItemProps,
      help: field.help,
      hidden: mergeBooleanControl(field.hidden, fieldControl?.hidden),
      label: field.label,
      rules: requiredRule ? [requiredRule, ...(field.rules ?? [])] : field.rules,
      span: field.span,
      valueFormat: field.valueFormat
    }
  })
}
