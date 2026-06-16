import { Button, Dropdown, Popconfirm, Space } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { ColumnType } from 'antd/es/table'
import { MoreHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { hasPermission } from '@/lib/permissions'
import type { MCActionColumnConfig, MCTableAction, MCTableActionConfirm } from './types'

/** 把操作项配置编译成 antd 操作列；权限过滤依赖调用方传入的权限集合。 */
export function buildActionColumn<RecordType extends AnyObject>(
  actions: MCTableAction<RecordType>[],
  permissions: readonly string[],
  config?: MCActionColumnConfig
): ColumnType<RecordType> {
  const max = config?.max ?? 3
  // 无权限的操作项整体剔除，行内不再判定。
  const authorized = actions.filter(action => hasPermission(permissions, action.permission))

  return {
    fixed: config?.fixed === false ? undefined : (config?.fixed ?? 'right'),
    key: 'mc-table-actions',
    title: config?.title ?? '操作',
    width: config?.width,
    render: (_, record) => <ActionCell actions={authorized} max={max} record={record} />
  }
}

function ActionCell<RecordType extends AnyObject>({
  actions,
  max,
  record
}: {
  actions: MCTableAction<RecordType>[]
  max: number
  record: RecordType
}) {
  // 行级隐藏在渲染期判定，确保依赖当前行数据的 hidden 生效。
  const visible = actions.filter(action => !action.hidden?.(record))
  const inline = visible.slice(0, max)
  const overflow = visible.slice(max)

  return (
    <Space size={4}>
      {inline.map(action => (
        <ActionButton action={action} key={action.key} record={record} />
      ))}
      {overflow.length > 0 ? (
        <Dropdown
          menu={{
            items: overflow.map(action => ({
              danger: action.danger,
              disabled: resolveDisabled(action, record),
              key: action.key,
              label: action.label,
              onClick: () => void runAction(action, record)
            }))
          }}
          trigger={['click']}
        >
          <Button
            aria-label="更多操作"
            icon={<MoreHorizontal className="size-4" />}
            size="small"
            type="text"
          />
        </Dropdown>
      ) : null}
    </Space>
  )
}

function ActionButton<RecordType extends AnyObject>({
  action,
  record
}: {
  action: MCTableAction<RecordType>
  record: RecordType
}) {
  const [loading, setLoading] = useState(false)
  const disabled = resolveDisabled(action, record)
  const Icon = action.icon

  async function handleRun() {
    if (loading) {
      return
    }

    setLoading(true)
    try {
      await runAction(action, record)
    } finally {
      setLoading(false)
    }
  }

  const button = (
    <Button
      danger={action.danger}
      disabled={disabled}
      icon={Icon ? <Icon className="size-4" /> : undefined}
      loading={loading}
      // 有确认气泡时点击交给 Popconfirm 的 onConfirm，避免双触发。
      onClick={action.confirm ? undefined : () => void handleRun()}
      size="small"
      type={action.type ?? 'link'}
    >
      {action.label}
    </Button>
  )

  if (!action.confirm || disabled) {
    return button
  }

  const confirm = normalizeConfirm(action.confirm)

  return (
    <Popconfirm
      cancelText={confirm.cancelText ?? '取消'}
      okButtonProps={{ danger: confirm.danger ?? action.danger }}
      okText={confirm.okText ?? '确认'}
      onConfirm={() => void handleRun()}
      title={confirm.title}
    >
      {button}
    </Popconfirm>
  )
}

function resolveDisabled<RecordType extends AnyObject>(
  action: MCTableAction<RecordType>,
  record: RecordType
) {
  return typeof action.disabled === 'function' ? action.disabled(record) : Boolean(action.disabled)
}

async function runAction<RecordType extends AnyObject>(
  action: MCTableAction<RecordType>,
  record: RecordType
) {
  await action.onClick?.(record)
}

function normalizeConfirm(confirm: ReactNode | MCTableActionConfirm): MCTableActionConfirm {
  if (confirm && typeof confirm === 'object' && 'title' in confirm) {
    return confirm
  }

  return { title: confirm as ReactNode }
}
