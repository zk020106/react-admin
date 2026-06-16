import { Button, Drawer } from 'antd'
import type { ReactNode } from 'react'

import type { DrawerApi } from '@/utils/popup-api'
import { usePopupState } from './use-popup'

interface MCDrawerProps {
  api: DrawerApi
  children?: ReactNode
  /** 覆盖确认行为；缺省时触发 api.onConfirm() 走 options 回调。 */
  onConfirm?: () => void
  width?: number | string
}

/** PopupApi 驱动的抽屉：placement、footer、submitting 全部来自弹层状态机。 */
export function MCDrawer({ api, children, onConfirm, width }: MCDrawerProps) {
  const state = usePopupState(api)

  return (
    <Drawer
      footer={
        state.footer ? (
          <div className="flex justify-end gap-2">
            {state.showCancelButton ? (
              <Button onClick={() => api.onCancel()}>{state.cancelText ?? '取消'}</Button>
            ) : null}
            {state.showConfirmButton ? (
              <Button
                loading={state.submitting}
                onClick={() => (onConfirm ? onConfirm() : api.onConfirm())}
                type="primary"
              >
                {state.confirmText ?? '确定'}
              </Button>
            ) : null}
          </div>
        ) : null
      }
      onClose={() => void api.close()}
      open={state.isOpen}
      placement={state.placement}
      title={state.title}
      width={width}
    >
      {children}
    </Drawer>
  )
}
