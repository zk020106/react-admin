/**
 * 弹窗功能示例页面
 * 演示各种弹窗组件的使用方法
 */

import { Button, Divider, Space } from 'antd'
import { useState } from 'react'

import {
  confirm,
  confirmBatchDelete,
  confirmDelete,
  MCDrawerForm,
  MCFormModal,
  message,
  notification,
  useDetailModal,
  withMessage
} from '@/components/mc'
import type { MCFormField } from '@/components/mc'
import { Page, PageSection } from '@/components/page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DemoFormValues {
  email: string
  name: string
  remark?: string
}

const demoFormFields: MCFormField[] = [
  {
    component: 'input',
    label: '姓名',
    name: 'name',
    required: true
  },
  {
    component: 'input',
    label: '邮箱',
    name: 'email',
    required: true,
    rules: [{ message: '请输入正确的邮箱', type: 'email' }]
  },
  {
    component: 'textarea',
    componentProps: { rows: 4 },
    label: '备注',
    name: 'remark'
  }
]

const demoDetailFields = [
  { label: '姓名', value: 'name' },
  { label: '邮箱', value: 'email' },
  { label: '状态', value: 'status' },
  { label: '创建时间', value: 'createdAt' }
]

export function PopupDemoPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const detailModal = useDetailModal({
    fields: demoDetailFields,
    title: '用户详情'
  })

  // 消息提示示例
  const handleMessage = (type: 'success' | 'error' | 'info' | 'warning') => {
    message[type](`这是一条${type}消息`)
  }

  // 通知示例
  const handleNotification = (type: 'success' | 'error' | 'info' | 'warning') => {
    notification[type]({
      description: `这是一条${type}通知的详细描述内容`,
      title: `${type}通知`
    })
  }

  // 确认对话框示例
  const handleConfirm = async (type: 'confirm' | 'delete' | 'batch') => {
    let result = false
    switch (type) {
      case 'confirm':
        result = await confirm({
          content: '确认要执行此操作吗？',
          title: '操作确认'
        })
        break
      case 'delete':
        result = await confirmDelete('删除确认', '确定要删除这条记录吗？')
        break
      case 'batch':
        result = await confirmBatchDelete(5)
        break
    }
    message.info(result ? '用户点击了确认' : '用户点击了取消')
  }

  // 表单提交
  const handleSubmit = async (values: DemoFormValues) => {
    await withMessage(new Promise(resolve => setTimeout(resolve, 1000)), {
      error: '提交失败',
      loading: '提交中...',
      success: '提交成功'
    })
    console.log('表单值:', values)
    setModalOpen(false)
    setDrawerOpen(false)
  }

  // 详情展示
  const handleShowDetail = () => {
    detailModal.open({
      createdAt: '2024-01-15 10:30:00',
      email: 'demo@example.com',
      name: '张三',
      status: '启用'
    })
  }

  return (
    <Page description="演示项目中各种弹窗组件的使用方法" title="弹窗功能示例">
      {/* 消息提示 */}
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>消息提示 (Message)</CardTitle>
            <CardDescription>轻量级的全局提示，3秒后自动消失</CardDescription>
          </CardHeader>
          <CardContent>
            <Space wrap>
              <Button onClick={() => handleMessage('success')} type="primary">
                成功消息
              </Button>
              <Button danger onClick={() => handleMessage('error')}>
                错误消息
              </Button>
              <Button onClick={() => handleMessage('info')}>信息消息</Button>
              <Button onClick={() => handleMessage('warning')}>警告消息</Button>
              <Button
                onClick={() => {
                  const hide = message.loading('加载中...')
                  setTimeout(() => {
                    hide()
                    message.success('加载完成')
                  }, 2000)
                }}
              >
                加载消息
              </Button>
            </Space>
          </CardContent>
        </Card>
      </PageSection>

      {/* 通知提示 */}
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>通知提示 (Notification)</CardTitle>
            <CardDescription>带有标题和描述的全局通知，可包含更多信息</CardDescription>
          </CardHeader>
          <CardContent>
            <Space wrap>
              <Button onClick={() => handleNotification('success')} type="primary">
                成功通知
              </Button>
              <Button danger onClick={() => handleNotification('error')}>
                错误通知
              </Button>
              <Button onClick={() => handleNotification('info')}>信息通知</Button>
              <Button onClick={() => handleNotification('warning')}>警告通知</Button>
            </Space>
          </CardContent>
        </Card>
      </PageSection>

      <Divider />

      {/* 确认对话框 */}
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>确认对话框 (Confirm)</CardTitle>
            <CardDescription>用于需要用户确认的操作</CardDescription>
          </CardHeader>
          <CardContent>
            <Space wrap>
              <Button onClick={() => handleConfirm('confirm')} type="primary">
                普通确认
              </Button>
              <Button danger onClick={() => handleConfirm('delete')}>
                删除确认
              </Button>
              <Button danger onClick={() => handleConfirm('batch')}>
                批量删除确认
              </Button>
            </Space>
          </CardContent>
        </Card>
      </PageSection>

      <Divider />

      {/* 模态弹窗 */}
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>模态弹窗 (Modal)</CardTitle>
            <CardDescription>居中显示的弹窗，适合表单输入和重要操作</CardDescription>
          </CardHeader>
          <CardContent>
            <Space wrap>
              <Button onClick={() => setModalOpen(true)} type="primary">
                打开表单弹窗
              </Button>
              <Button onClick={handleShowDetail}>显示详情弹窗</Button>
            </Space>
          </CardContent>
        </Card>
      </PageSection>

      {/* 抽屉 */}
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>抽屉弹层 (Drawer)</CardTitle>
            <CardDescription>从侧边滑出的弹层，适合展示更多内容</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDrawerOpen(true)} type="primary">
              打开表单抽屉
            </Button>
          </CardContent>
        </Card>
      </PageSection>

      {/* 表单弹窗 */}
      <MCFormModal<DemoFormValues>
        fields={demoFormFields}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        open={modalOpen}
        title="用户信息"
      />

      {/* 表单抽屉 */}
      <MCDrawerForm<DemoFormValues>
        fields={demoFormFields}
        onCancel={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        open={drawerOpen}
        placement="right"
        title="用户信息"
        width={480}
      />

      {/* 详情弹窗 */}
      {detailModal.modal}
    </Page>
  )
}
