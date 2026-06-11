import { Modal } from 'antd'
import type { ReactNode } from 'react'

import type { ModalApi } from '@/utils/popup-api'
import { usePopupState } from './use-popup'

/** PopupApi 驱动的模态弹窗：submitting 映射确认按钮 loading，关闭统一走 beforeClose 守卫。 */
export function AdminModal({
  api,
  children,
  forceRender = false,
  onConfirm,
  width
}: {
  api: ModalApi
  children?: ReactNode
  /** 弹窗未打开时也渲染内容，供表单实例提前挂载（编辑回填场景）。 */
  forceRender?: boolean
  /** 覆盖确认行为；缺省时触发 api.onConfirm() 走 options 回调。 */
  onConfirm?: () => void
  width?: number | string
}) {
  const state = usePopupState(api)

  return (
    <Modal
      afterClose={() => api.onClosed()}
      afterOpenChange={open => {
        if (open) {
          api.onOpened()
        }
      }}
      cancelText={state.cancelText}
      confirmLoading={state.submitting}
      footer={state.footer ? undefined : null}
      forceRender={forceRender}
      okText={state.confirmText}
      onCancel={() => api.onCancel()}
      onOk={() => (onConfirm ? onConfirm() : api.onConfirm())}
      open={state.isOpen}
      title={state.title}
      width={width}
    >
      {children}
    </Modal>
  )
}
