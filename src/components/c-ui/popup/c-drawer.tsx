import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

import type { DrawerApi } from '@/utils/popup-api'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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

/** DrawerApi 驱动的抽屉（Radix Sheet 底座）：placement / footer / submitting 全部来自弹层状态机。 */
export function CDrawer({
  api,
  children,
  forceRender = false,
  onConfirm
}: {
  api: DrawerApi
  children?: ReactNode
  /** 抽屉未打开时也渲染内容，供表单实例提前挂载（编辑回填场景）。 */
  forceRender?: boolean
  /** 覆盖确认行为；缺省时触发 api.onConfirm() 走 options 回调。 */
  onConfirm?: () => void
}): ReactNode {
  const state = useCPopupState(api)
  usePopupLifecycle(api, state.isOpen)

  return (
    <>
      {forceRender && !state.isOpen ? (
        // forceRender：关闭时把内容挂在隐藏容器里，保证表单实例提前挂载。
        // 原因同 CModal：Radix 的 forceMount 够不着关闭时不渲染的 Portal。
        <div hidden>{children}</div>
      ) : null}
      <Sheet
        open={state.isOpen}
        onOpenChange={open => {
          // X / 遮罩 / Esc 触发的关闭统一走 api.onCancel()，内部跑 beforeClose 守卫。
          if (!open) {
            api.onCancel()
          }
        }}
      >
        <SheetContent side={state.placement ?? 'right'}>
          {state.header ? (
            <SheetHeader>
              <SheetTitle>{state.title}</SheetTitle>
            </SheetHeader>
          ) : null}
          {children}
          {state.footer ? (
            <SheetFooter className="flex-row justify-end">
              {state.showCancelButton ? (
                // 直接用普通 Button + onClick，不包 SheetClose，避免 <button> 嵌套。
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
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
