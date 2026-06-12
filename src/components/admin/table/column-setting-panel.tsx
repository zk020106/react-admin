import type { AnyObject } from 'antd/es/_util/type'
import { Button, Checkbox, Tooltip } from 'antd'
import { ArrowLeftToLine, ArrowRightToLine, GripVertical, PinOff } from 'lucide-react'
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
      className="w-64 rounded-md border bg-popover p-2 shadow-md"
      data-slot="admin-table-column-setting"
    >
      <div className="flex items-center justify-between border-b px-1 pb-2">
        <Checkbox
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={event => setAllHidden(!event.target.checked)}
        >
          列展示
        </Checkbox>
        <Button disabled={!dirty} onClick={() => reset()} size="small" type="link">
          重置
        </Button>
      </div>
      <ul className="grid gap-0.5 pt-1">
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
        'flex items-center gap-1 rounded px-1 py-1 transition-colors',
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
      <GripVertical className="size-4 cursor-grab text-muted-foreground" />
      <Checkbox
        checked={!meta.hidden}
        className="flex-1"
        onChange={event => onToggle(event.target.checked)}
      >
        <span className="truncate">{meta.label}</span>
      </Checkbox>
      <Tooltip title="固定到左侧">
        <Button
          aria-label={`固定 ${meta.label} 到左侧`}
          icon={<ArrowLeftToLine className="size-3.5" />}
          onClick={() => onSetFixed('left')}
          size="small"
          type={meta.fixed === 'left' ? 'primary' : 'text'}
        />
      </Tooltip>
      <Tooltip title="固定到右侧">
        <Button
          aria-label={`固定 ${meta.label} 到右侧`}
          icon={<ArrowRightToLine className="size-3.5" />}
          onClick={() => onSetFixed('right')}
          size="small"
          type={meta.fixed === 'right' ? 'primary' : 'text'}
        />
      </Tooltip>
      {meta.fixed ? (
        <span className="text-muted-foreground" title="已固定">
          <PinOff className="size-3.5" />
        </span>
      ) : null}
    </li>
  )
}
