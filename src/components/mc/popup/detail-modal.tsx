import { Modal } from 'antd'
import type { ReactNode } from 'react'

export interface DetailField {
  /** 字段标签 */
  label: string
  /** 字段值渲染函数 */
  render?: (value: unknown, record: Record<string, unknown>) => ReactNode
  /** 字段值的数据键 */
  value: string | ((record: Record<string, unknown>) => ReactNode)
}

export interface DetailModalProps<T extends Record<string, unknown>> {
  /** 详情数据 */
  data: T | null
  /** 字段配置 */
  fields: DetailField[]
  /** 是否打开 */
  open: boolean
  /** 标题 */
  title?: string
  /** 宽度 */
  width?: number | string
  /** 关闭回调 */
  onClose: () => void
}

const modalMotionProps =
  import.meta.env.MODE === 'test' ? { maskTransitionName: '', transitionName: '' } : undefined

function renderFieldValue(field: DetailField, data: Record<string, unknown> | null): ReactNode {
  if (!data) {
    return '-'
  }

  if (typeof field.value === 'function') {
    return field.value(data)
  }

  const value = data[field.value]

  if (field.render) {
    return field.render(value, data)
  }

  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return '-'
}

/** 详情展示弹窗：用于只读数据展示。 */
export function DetailModal<T extends Record<string, unknown>>({
  data,
  fields,
  onClose,
  open,
  title = '详情',
  width = 600
}: DetailModalProps<T>) {
  return (
    <Modal
      {...modalMotionProps}
      footer={null}
      onCancel={onClose}
      open={open}
      title={title}
      width={width}
    >
      <div className="grid gap-4 py-4">
        {fields.map(field => (
          <div key={field.label} className="grid grid-cols-3 items-start gap-4">
            <div className="text-right text-sm font-medium text-muted-foreground">
              {field.label}:
            </div>
            <div className="col-span-2 text-sm">{renderFieldValue(field, data)}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
