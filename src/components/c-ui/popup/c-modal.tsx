import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

import type { ModalApi } from '@/utils/popup-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useCPopupState } from './use-c-popup'

/**
 * 监听 isOpen 的翻转，触发弹层生命周期回调（对应旧 antd 版的 afterClose / afterOpenChange）。
 * api.onClosed() 内部会再检查 isOpen 确已关闭才会真正回调，调用一次即可。
 */
function usePopupLifecycle(
  api: { onClosed: () => unknown; onOpened: () => unknown },
  isOpen: boolean
) {
  const prevOpenRef = useRef(isOpen)

  useEffect(() => {
    const prevOpen = prevOpenRef.current
    prevOpenRef.current = isOpen

    if (isOpen === prevOpen) {
      return
    }

    if (isOpen) {
      api.onOpened()
    } else {
      api.onClosed()
    }
  }, [api, isOpen])
}

/** ModalApi 驱动的模态弹窗（Radix 底座）：submitting 映射确认按钮 loading，关闭统一走 beforeClose 守卫。 */
export function CModal({
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
  /** 映射为弹窗内容的 maxWidth。 */
  width?: number | string
}): ReactNode {
  const state = useCPopupState(api)
  usePopupLifecycle(api, state.isOpen)

  // 内联样式 maxWidth 覆盖 shadcn 默认的 sm:max-w-sm。
  const maxWidth =
    width === undefined ? undefined : typeof width === 'number' ? `${width}px` : width

  return (
    <>
      {forceRender && !state.isOpen ? (
        // forceRender：关闭时把内容挂在隐藏容器里，保证表单实例提前挂载。
        // 为什么不用 Radix 的 forceMount：Dialog 的 Portal 在关闭时根本不渲染，
        // forceMount 传给 Content 够不着 Portal；若给 Portal 强行 forceMount，
        // 关闭态的遮罩与内容会实际可见并触发焦点陷阱，得不偿失。
        <div hidden>{children}</div>
      ) : null}
      <Dialog
        open={state.isOpen}
        onOpenChange={open => {
          // X / 遮罩 / Esc 触发的关闭统一走 api.onCancel()，内部跑 beforeClose 守卫。
          if (!open) {
            api.onCancel()
          }
        }}
      >
        <DialogContent style={maxWidth === undefined ? undefined : { maxWidth }}>
          {state.header ? (
            <DialogHeader>
              <DialogTitle>{state.title}</DialogTitle>
            </DialogHeader>
          ) : null}
          {children}
          {state.footer ? (
            <DialogFooter>
              {state.showCancelButton ? (
                // 直接用普通 Button + onClick，不包 DialogClose，避免 <button> 嵌套。
                <Button variant="outline" onClick={() => api.onCancel()}>
                  {state.cancelText ?? '取消'}
                </Button>
              ) : null}
              {state.showConfirmButton ? (
                <Button
                  disabled={state.submitting}
                  onClick={() => (onConfirm ? onConfirm() : api.onConfirm())}
                >
                  {state.submitting ? <Loader2 className="animate-spin" /> : null}
                  {state.confirmText ?? '确认'}
                </Button>
              ) : null}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
