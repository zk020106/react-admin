import { Form } from 'antd'
import { useEffect, useMemo, useRef } from 'react'

import { MCModal } from '@/components/mc/popup/mc-modal'
import { useModalApi } from '@/components/mc/popup/use-popup'
import type { FormSchema } from '@/types/admin'
import { FormApi } from '@/utils/form-api'
import { ModalApi } from '@/utils/popup-api'
import { toFormSchema } from './field-adapter'
import { SchemaForm } from './schema-form'
import type { MCFormModalProps } from './types'

interface MCFormModalComponentProps<TValues extends object> extends MCFormModalProps<TValues> {
  /**
   * 直接以 FormSchema 传入；与 fields 二选一。
   * 提供 schema 时跳过 MCFormField → FormSchema 的转换，便于复用既有 schema 配置。
   */
  schema?: FormSchema[]
}

/** 标准表单弹窗：统一回填、校验、提交 loading 和关闭重置流程。 */
export function MCFormModal<TValues extends object>({
  control,
  fields,
  initialValues,
  onCancel,
  onSubmit,
  open,
  schema,
  title,
  width
}: MCFormModalComponentProps<TValues>) {
  const [form] = Form.useForm()
  const modalApi = useModalApi(() => new ModalApi({ title }))
  const resolvedSchema = useMemo(
    () => schema ?? toFormSchema(fields ?? [], control),
    [control, fields, schema]
  )
  const formApi = useMemo(() => new FormApi({ schema: resolvedSchema }), [resolvedSchema])

  // 用 ref 跟踪 open 的上次状态，只在 false→true 转换时执行 reset+回填，
  // 避免父组件改 title/initialValues（弹窗已开）时意外清空用户正在编辑的内容。
  const prevOpenRef = useRef(false)

  // title 同步独立出来：title 变化只更新弹层标题，不触碰表单。
  useEffect(() => {
    modalApi.setState({ title })
  }, [modalApi, title])

  // open 生命周期：仅在开关状态变化时响应。
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (!open) {
      void modalApi.close()
      return
    }

    // 仅在由关闭变为打开时回填，避免重复 reset。
    if (!wasOpen) {
      form.resetFields()
      if (initialValues) {
        form.setFieldsValue(initialValues)
      }
    }
    modalApi.open()
  }, [form, initialValues, modalApi, open])

  async function handleConfirm() {
    modalApi.lock()
    try {
      const values = await formApi.submit()

      if (!values) {
        modalApi.unlock()
        return
      }

      await onSubmit(values as TValues)
      form.resetFields()
      onCancel()
    } catch {
      modalApi.unlock()
    }
  }

  return (
    <MCModal
      api={modalApi}
      forceRender
      onCancel={onCancel}
      onConfirm={() => void handleConfirm()}
      width={width}
    >
      <SchemaForm api={formApi} form={form} />
    </MCModal>
  )
}
