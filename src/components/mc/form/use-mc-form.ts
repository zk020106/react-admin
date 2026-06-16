import { Form, type FormInstance } from 'antd'
import { useState } from 'react'

import { FormApi, type FormApiOptions } from '@/utils/form-api'

/** 创建 FormApi 与 antd 表单实例的标准组合；options 仅在首次渲染时生效。 */
export function useMCForm(options: FormApiOptions = {}): [FormApi, FormInstance] {
  const [api] = useState(() => new FormApi(options))
  const [form] = Form.useForm()

  return [api, form]
}
