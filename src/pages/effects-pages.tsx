import { Expand, PanelsTopLeft } from 'lucide-react'
import { useState } from 'react'
import { useStore } from 'zustand'

import { SchemaForm } from '@/components/admin/form/schema-form'
import { useAdminForm } from '@/components/admin/form/use-admin-form'
import { AdminDrawer } from '@/components/admin/popup/admin-drawer'
import { AdminModal } from '@/components/admin/popup/admin-modal'
import { useDrawerApi, useModalApi } from '@/components/admin/popup/use-popup'
import { Page, PageSection } from '@/components/page'
import { getAdminMessages } from '@/i18n/admin-i18n'
import { preferenceStore } from '@/store/preferences'
import { AdminConfigProvider } from '@/theme/antd-theme'
import { DrawerApi, ModalApi } from '@/utils/popup-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AdminMessages = ReturnType<typeof getAdminMessages>

/** 组件能力演示页：展示弹层 API 与 schema 表单的标准用法。 */
export default function EffectsPage() {
  const appLocale = useStore(preferenceStore, state => state.preferences.appLocale)
  const messages = getAdminMessages(appLocale)

  return (
    <AdminConfigProvider>
      <Page title="组件示例" description="演示 PopupApi 弹层与 SchemaForm 表单的框架用法。">
        <PageSection contentClassName="grid gap-4">
          <PopupLab messages={messages} />
          <SchemaFormPanel messages={messages} />
          <IframePanel messages={messages} />
        </PageSection>
      </Page>
    </AdminConfigProvider>
  )
}

/** 演示模态弹窗和抽屉 API 的交互能力。 */
export function PopupLab({ messages }: { messages: AdminMessages }) {
  const popup = messages.pages.popup
  const modalApi = useModalApi(() => new ModalApi({ title: popup.modalTitle }))
  const drawerApi = useDrawerApi(
    () => new DrawerApi({ placement: 'right', title: popup.drawerTitle })
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{popup.title}</CardTitle>
        <CardDescription>{popup.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          onClick={() => modalApi.setData({ [popup.modalSourceKey]: popup.modalSource }).open()}
        >
          <Expand />
          {popup.openModal}
        </Button>
        <Button
          onClick={() => drawerApi.setData({ [popup.drawerSourceKey]: popup.drawerSource }).open()}
          variant="outline"
        >
          <PanelsTopLeft />
          {popup.openDrawer}
        </Button>
      </CardContent>
      <AdminModal api={modalApi}>
        {popup.payload}: {JSON.stringify(modalApi.getData())}
      </AdminModal>
      <AdminDrawer api={drawerApi} onConfirm={() => void drawerApi.close()}>
        {popup.payload}: {JSON.stringify(drawerApi.getData())}
      </AdminDrawer>
    </Card>
  )
}

/** 演示 schema 表单配置和统一提交能力。 */
export function SchemaFormPanel({ messages }: { messages: AdminMessages }) {
  const schemaFormMessages = messages.pages.schemaForm
  const [submitted, setSubmitted] = useState<Record<string, unknown>>({})
  const [formApi, form] = useAdminForm({
    handleSubmit: setSubmitted,
    schema: [
      {
        component: 'input',
        defaultValue: 'Root',
        fieldName: 'name',
        label: schemaFormMessages.name,
        rules: [{ required: true }]
      },
      {
        component: 'input',
        defaultValue: 'root@example.com',
        fieldName: 'email',
        label: schemaFormMessages.email,
        rules: [{ required: true, type: 'email' }]
      },
      {
        component: 'select',
        componentProps: {
          options: [{ value: schemaFormMessages.defaultRole }, { value: 'auditor' }]
        },
        defaultValue: schemaFormMessages.defaultRole,
        fieldName: 'role',
        label: schemaFormMessages.role
      }
    ]
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{schemaFormMessages.title}</CardTitle>
        <CardDescription>{schemaFormMessages.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4">
        <SchemaForm api={formApi} form={form} />
        <div className="flex gap-2">
          <Button onClick={() => void formApi.submit()}>{schemaFormMessages.submit}</Button>
          <Button onClick={() => formApi.reset()} variant="outline">
            {schemaFormMessages.reset}
          </Button>
        </div>
        <pre className="rounded-lg border bg-muted p-3 text-xs">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}

/** 展示内嵌页面能力的占位面板。 */
export function IframePanel({ messages }: { messages: AdminMessages }) {
  const iframe = messages.pages.iframe

  return (
    <Card>
      <CardHeader>
        <CardTitle>{iframe.title}</CardTitle>
        <CardDescription>{iframe.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex aspect-video items-center justify-center rounded-lg border bg-background text-muted-foreground">
          {iframe.placeholder}
        </div>
      </CardContent>
    </Card>
  )
}
