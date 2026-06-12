import { Form } from 'antd'
import { useEffect, useMemo } from 'react'

import { AdminModal } from '@/components/admin/popup/admin-modal'
import { useModalApi } from '@/components/admin/popup/use-popup'
import type { FormSchema } from '@/types/admin'
import { FormApi } from '@/utils/form-api'
import { ModalApi } from '@/utils/popup-api'
import { SchemaForm } from './schema-form'

export interface AdminFormModalProps<TValues extends object> {
  initialValues?: Partial<TValues>
  open: boolean
  schema: FormSchema[]
  title: string
  width?: number | string
  onCancel: () => void
  onSubmit: (values: TValues) => Promise<void> | void
}

/** 标准 schema 表单弹窗，统一回填、校验、提交 loading 和关闭重置流程。 */
export function AdminFormModal<TValues extends object>({
  initialValues,
  onCancel,
  onSubmit,
  open,
  schema,
  title,
  width
}: AdminFormModalProps<TValues>) {
  const [form] = Form.useForm()
  const modalApi = useModalApi(() => new ModalApi({ title }))
  const formApi = useMemo(() => new FormApi({ schema }), [schema])

  useEffect(() => {
    modalApi.setState({ title })

    if (!open) {
      void modalApi.close()
      return
    }

    form.resetFields()
    if (initialValues) {
      form.setFieldsValue(initialValues)
    }
    modalApi.open()
  }, [form, initialValues, modalApi, open, title])

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
    <AdminModal
      api={modalApi}
      forceRender
      onCancel={onCancel}
      onConfirm={() => void handleConfirm()}
      width={width}
    >
      <SchemaForm api={formApi} form={form} />
    </AdminModal>
  )
}
