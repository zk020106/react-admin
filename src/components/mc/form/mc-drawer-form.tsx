import { Form } from 'antd'
import { useEffect, useMemo, useRef } from 'react'

import { MCDrawer } from '@/components/mc/popup/mc-drawer'
import { useDrawerApi } from '@/components/mc/popup/use-popup'
import type { FormSchema } from '@/types/admin'
import { FormApi } from '@/utils/form-api'
import { DrawerApi } from '@/utils/popup-api'
import { toFormSchema } from './field-adapter'
import { SchemaForm } from './schema-form'
import type { MCDrawerFormProps } from './types'

interface MCDrawerFormComponentProps<TValues extends object> extends MCDrawerFormProps<TValues> {
  /**
   * 直接以 FormSchema 传入；与 fields 二选一。
   * 提供 schema 时跳过 MCFormField → FormSchema 的转换，便于复用既有 schema 配置。
   */
  schema?: FormSchema[]
}

/** 标准表单抽屉：统一回填、校验、提交 loading 和关闭重置流程。 */
export function MCDrawerForm<TValues extends object>({
  control,
  fields,
  initialValues,
  onCancel,
  onSubmit,
  open,
  placement = 'right',
  schema,
  title,
  width
}: MCDrawerFormComponentProps<TValues>) {
  const [form] = Form.useForm()
  const drawerApi = useDrawerApi(() => new DrawerApi({ placement, title }))
  const resolvedSchema = useMemo(
    () => schema ?? toFormSchema(fields ?? [], control),
    [control, fields, schema]
  )
  const formApi = useMemo(() => new FormApi({ schema: resolvedSchema }), [resolvedSchema])

  // 用 ref 跟踪 open 的上次状态，只在 false→true 转换时执行 reset+回填，
  // 避免父组件改 title/placement/initialValues（抽屉已开）时意外清空表单。
  const prevOpenRef = useRef(false)

  // placement/title 同步独立：变化只更新抽屉外观，不触碰表单。
  useEffect(() => {
    drawerApi.setState({ placement, title })
  }, [drawerApi, placement, title])

  // open 生命周期：仅在开关状态变化时响应。
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (!open) {
      void drawerApi.close()
      return
    }

    if (!wasOpen) {
      form.resetFields()
      if (initialValues) {
        form.setFieldsValue(initialValues)
      }
    }
    drawerApi.open()
  }, [drawerApi, form, initialValues, open])

  async function handleConfirm() {
    drawerApi.lock()
    try {
      const values = await formApi.submit()

      if (!values) {
        drawerApi.unlock()
        return
      }

      await onSubmit(values as TValues)
      form.resetFields()
      onCancel()
    } catch {
      drawerApi.unlock()
    }
  }

  return (
    <MCDrawer api={drawerApi} onConfirm={() => void handleConfirm()} width={width}>
      <SchemaForm api={formApi} form={form} />
    </MCDrawer>
  )
}
