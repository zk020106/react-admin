import { Table, type TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { ReactNode } from 'react'

export interface AdminTableProps<RecordType extends AnyObject> extends TableProps<RecordType> {
  /** 表格右上工具栏内容（新增按钮等操作入口）。 */
  toolbar?: ReactNode
}

/** 内容区标准表格：统一默认分页、尺寸与工具栏布局。
 *  消费方需位于 AdminConfigProvider 内以获得主题与语言上下文。 */
export function AdminTable<RecordType extends AnyObject>({
  pagination,
  toolbar,
  ...tableProps
}: AdminTableProps<RecordType>) {
  return (
    <div className="grid gap-3" data-slot="admin-table">
      {toolbar ? <div className="flex justify-end gap-2">{toolbar}</div> : null}
      <Table<RecordType>
        pagination={pagination ?? { pageSize: 10, showSizeChanger: false }}
        size="middle"
        {...tableProps}
      />
    </div>
  )
}
