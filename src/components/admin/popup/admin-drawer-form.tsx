import { Form } from 'antd'
import { useEffect, useMemo } from 'react'

import { AdminDrawer } from '@/components/admin/popup/admin-drawer'
import { useDrawerApi } from '@/components/admin/popup/use-popup'
import type { FormSchema } from '@/types/admin'
import { FormApi } from '@/utils/form-api'
import { DrawerApi } from '@/utils/popup-api'
import { SchemaForm } from '../form/schema-form'

export interface AdminDrawerFormProps<TValues extends object> {
  initialValues?: Partial<TValues>
  open: boolean
  placement?: 'left' | 'right' | 'top' | 'bottom'
  schema: FormSchema[]
  title: string
  width?: number | string
  onCancel: () => void
  onSubmit: (values: TValues) => Promise<void> | void
}

/** 标准 schema 表单抽屉，统一回填、校验、提交 loading 和关闭重置流程。 */
export function AdminDrawerForm<TValues extends object>({
  initialValues,
  onCancel,
  onSubmit,
  open,
  placement = 'right',
  schema,
  title,
  width
}: AdminDrawerFormProps<TValues>) {
  const [form] = Form.useForm()
  const drawerApi = useDrawerApi(() => new DrawerApi({ placement, title }))
  const formApi = useMemo(() => new FormApi({ schema }), [schema])

  useEffect(() => {
    drawerApi.setState({ placement, title })

    if (!open) {
      void drawerApi.close()
      return
    }

    form.resetFields()
    if (initialValues) {
      form.setFieldsValue(initialValues)
    }
    drawerApi.open()
  }, [drawerApi, form, initialValues, open, placement, title])

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
    <AdminDrawer api={drawerApi} onConfirm={() => void handleConfirm()} width={width}>
      <SchemaForm api={formApi} form={form} />
    </AdminDrawer>
  )
}
