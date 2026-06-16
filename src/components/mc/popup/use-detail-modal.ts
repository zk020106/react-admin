import { createElement, useState, type ReactNode } from 'react'

import { DetailModal, type DetailField } from './detail-modal'

export interface UseDetailModalOptions {
  /** 字段配置 */
  fields: DetailField[]
  /** 标题 */
  title?: string
  /** 宽度 */
  width?: number | string
}

export interface UseDetailModalResult<T> {
  /** 关闭弹窗 */
  close: () => void
  /** 需要挂载到页面的弹窗节点 */
  modal: ReactNode
  /** 打开详情弹窗并传入数据 */
  open: (data: T) => void
}

/** 详情弹窗 Hook：管理详情弹窗的打开/关闭和数据传递。 */
export function useDetailModal<T = Record<string, unknown>>({
  fields,
  title,
  width
}: UseDetailModalOptions): UseDetailModalResult<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | null>(null)

  function open(record: T) {
    setData(record)
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    // 延迟清空数据，等待动画结束
    setTimeout(() => setData(null), 300)
  }

  const modal = createElement(DetailModal, {
    data: data as Record<string, unknown> | null,
    fields,
    onClose: close,
    open: isOpen,
    title,
    width
  })

  return { close, modal, open }
}
