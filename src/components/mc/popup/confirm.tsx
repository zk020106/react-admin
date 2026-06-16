import { Modal, type ModalFuncProps } from 'antd'

/** 统一的确认对话框配置 */
export interface ConfirmOptions {
  /** 取消按钮文字 */
  cancelText?: string
  /** 内容 */
  content?: string
  /** 危险操作样式 */
  danger?: boolean
  /** 确定按钮文字 */
  okText?: string
  /** 标题 */
  title?: string
  /** 类型 */
  type?: 'confirm' | 'info' | 'success' | 'error' | 'warning'
}

/** 显示确认对话框 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    const { type = 'confirm', danger = false, ...restOptions } = options

    const modalConfig: ModalFuncProps = {
      cancelText: '取消',
      okButtonProps: { danger },
      okText: '确定',
      onCancel: () => resolve(false),
      onOk: () => resolve(true),
      ...restOptions
    }

    switch (type) {
      case 'info':
        Modal.info(modalConfig)
        break
      case 'success':
        Modal.success(modalConfig)
        break
      case 'error':
        Modal.error(modalConfig)
        break
      case 'warning':
        Modal.warning(modalConfig)
        break
      default:
        Modal.confirm(modalConfig)
    }
  })
}

/** 显示删除确认对话框 */
export function confirmDelete(title = '确认删除', content?: string): Promise<boolean> {
  return confirm({
    cancelText: '取消',
    content: content ?? '删除后无法恢复，确定要删除吗？',
    danger: true,
    okText: '删除',
    title
  })
}

/** 显示批量删除确认对话框 */
export function confirmBatchDelete(count: number): Promise<boolean> {
  return confirm({
    cancelText: '取消',
    content: `已选中 ${count} 条记录，删除后无法恢复，确定要批量删除吗？`,
    danger: true,
    okText: '批量删除',
    title: '批量删除确认'
  })
}
