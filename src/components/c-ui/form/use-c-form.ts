import set from 'lodash-es/set'
import { useMemo, useState } from 'react'
import {
  useForm,
  type DefaultValues,
  type RegisterOptions,
  type UseFormReturn
} from 'react-hook-form'

import { FormApi, type FormApiOptions } from '@/utils/form-api'

// 邮箱校验正则：等价实现 antd 的 type: 'email' 规则。
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 函数：toRHFRules。把 antd 风格的 rules 数组转换为 react-hook-form 的 RegisterOptions。
 *  当前仅覆盖 required 与 type: 'email'；其他 antd 规则（min/max/len/whitespace/enum/validator
 *  等）暂不支持，直接忽略——调用方如需更强校验应改用 zod schema。 */
export function toRHFRules(rules: unknown): RegisterOptions {
  if (!Array.isArray(rules)) {
    return {}
  }

  const result: RegisterOptions = {}

  for (const rule of rules) {
    if (typeof rule !== 'object' || rule === null) {
      continue
    }

    const { message, required, type } = rule as {
      message?: string
      required?: boolean
      type?: string
    }

    if (required) {
      // 有 message 就用它做错误文案，否则传 true 让 RHF 标记错误（文案由 CForm 的错误态兜底）。
      result.required = message ?? true
    }

    if (type === 'email') {
      result.pattern = {
        message: message ?? '请输入有效的邮箱地址',
        value: EMAIL_PATTERN
      }
    }
  }

  return result
}

/** Hook：useCForm。创建组件生命周期内稳定的 FormApi，并配套 react-hook-form 的方法对象。
 *  defaultValues 从 options.schema 的 defaultValue 派生，点路径字段名用 lodash set
 *  自动组装成嵌套对象（例如 'filters.range' → { filters: { range: 默认值 } }）。 */
export function useCForm<TFieldValues extends Record<string, unknown> = Record<string, unknown>>(
  options: FormApiOptions = {}
): [FormApi, UseFormReturn<TFieldValues>] {
  // FormApi 用 useState 惰性创建，保证实例引用在组件生命周期内稳定。
  const [api] = useState(() => new FormApi(options))

  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = {}

    for (const item of options.schema ?? []) {
      if (item.defaultValue === undefined) {
        continue
      }
      // set 原生支持点路径，'a.b.c' 会组装成 { a: { b: { c: 值 } } }。
      set(values, item.fieldName, item.defaultValue)
    }

    return values as DefaultValues<TFieldValues>
  }, [options.schema])

  const methods = useForm<TFieldValues>({ defaultValues })

  // useForm 返回的 TTransformedValues 默认为 TFieldValues；契约签名用 UseFormReturn<TFieldValues>
  //（即 TTransformedValues = undefined），此处做一次类型收窄——运行时并未做值转换，两者一致。
  return [api, methods as UseFormReturn<TFieldValues>]
}
