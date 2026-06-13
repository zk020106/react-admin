import type { AnyObject } from 'antd/es/_util/type'
import { Button, Checkbox, Tooltip } from 'antd'
import { Pin } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { ColumnMeta, ColumnStateController } from './use-column-state'

export interface ColumnSettingPanelProps<RecordType extends AnyObject> {
  controller: ColumnStateController<RecordType>
}

/** 列设置面板：拖拽排序、显隐勾选、左右固定，附全选与重置。 */
export function ColumnSettingPanel<RecordType extends AnyObject>({
  controller
}: ColumnSettingPanelProps<RecordType>) {
  const { dirty, metas, move, reset, setAllHidden, setFixed, setHidden } = controller
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const settableMetas = metas.filter(meta => meta.settable)
  const visibleCount = settableMetas.filter(meta => !meta.hidden).length
  const allChecked = settableMetas.length > 0 && visibleCount === settableMetas.length
  const indeterminate = visibleCount > 0 && visibleCount < settableMetas.length

  return (
    <div
      className="w-56 rounded-md border bg-popover shadow-lg"
      data-slot="admin-table-column-setting"
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Checkbox
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={event => setAllHidden(!event.target.checked)}
        >
          <span className="text-sm font-medium">列展示</span>
        </Checkbox>
        <Button disabled={!dirty} onClick={() => reset()} size="small" type="link">
          重置
        </Button>
      </div>
      <div className="max-h-96 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {metas.map(meta => (
            <ColumnSettingRow
              dragging={draggingKey === meta.key}
              key={meta.key}
              meta={meta}
              onDragEnd={() => setDraggingKey(null)}
              onDragStart={() => setDraggingKey(meta.key)}
              onDrop={fromKey => move(fromKey, meta.key)}
              onSetFixed={fixed => setFixed(meta.key, meta.fixed === fixed ? undefined : fixed)}
              onToggle={checked => setHidden(meta.key, !checked)}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

interface ColumnSettingRowProps<RecordType extends AnyObject> {
  dragging: boolean
  meta: ColumnMeta<RecordType>
  onDragEnd: () => void
  onDragStart: () => void
  onDrop: (fromKey: string) => void
  onSetFixed: (fixed: 'left' | 'right') => void
  onToggle: (checked: boolean) => void
}

function ColumnSettingRow<RecordType extends AnyObject>({
  dragging,
  meta,
  onDragEnd,
  onDragStart,
  onDrop,
  onSetFixed,
  onToggle
}: ColumnSettingRowProps<RecordType>) {
  const [over, setOver] = useState(false)

  if (!meta.settable) {
    return null
  }

  return (
    <li
      className={cn(
        'group flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-accent',
        over && 'bg-accent',
        dragging && 'opacity-50'
      )}
      data-slot="admin-table-column-setting-row"
      draggable
      onDragEnd={() => {
        setOver(false)
        onDragEnd()
      }}
      onDragLeave={() => setOver(false)}
      onDragOver={event => {
        event.preventDefault()
        setOver(true)
      }}
      onDragStart={onDragStart}
      onDrop={event => {
        event.preventDefault()
        setOver(false)
        const fromKey = event.dataTransfer.getData('text/plain')
        if (fromKey) {
          onDrop(fromKey)
        }
      }}
      onDragStartCapture={event => event.dataTransfer.setData('text/plain', meta.key)}
    >
      {/* 拖拽手柄 */}
      <div className="flex cursor-grab items-center text-muted-foreground">
        <svg
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>

      {/* 显示/隐藏 Checkbox */}
      <Checkbox
        checked={!meta.hidden}
        className="flex-1"
        onChange={event => onToggle(event.target.checked)}
      >
        <span className="truncate text-sm">{meta.label}</span>
      </Checkbox>

      {/* 操作按钮组 */}
      <div className="flex items-center gap-1">
        {/* 固定到左侧 */}
        <Tooltip title="固定到左侧">
          <Button
            icon={
              <Pin
                className={cn('size-3.5', meta.fixed === 'left' && '!text-blue-500')}
                style={{ transform: 'rotate(-45deg)' }}
              />
            }
            onClick={() => onSetFixed('left')}
            size="small"
            type="text"
          />
        </Tooltip>

        {/* 固定到右侧 */}
        <Tooltip title="固定到右侧">
          <Button
            icon={
              <Pin
                className={cn('size-3.5', meta.fixed === 'right' && '!text-blue-500')}
                style={{ transform: 'rotate(45deg)' }}
              />
            }
            onClick={() => onSetFixed('right')}
            size="small"
            type="text"
          />
        </Tooltip>
      </div>
    </li>
  )
}
