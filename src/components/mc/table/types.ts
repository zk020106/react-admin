import type { AnyObject } from 'antd/es/_util/type'

import type { AdminTableProps, AdminTableTools } from '@/components/admin/table/admin-table'
import type {
  AdminActionColumnConfig,
  AdminColumn,
  AdminTableAction,
  AdminTableBatchContext
} from '@/components/admin/table/types'

export type MCActionColumnConfig = AdminActionColumnConfig
export type MCTableAction<RecordType extends AnyObject> = AdminTableAction<RecordType>
export type MCTableBatchContext<RecordType extends AnyObject> = AdminTableBatchContext<RecordType>
export type MCTableColumn<RecordType extends AnyObject> = AdminColumn<RecordType>
export type MCTableProps<RecordType extends AnyObject> = AdminTableProps<RecordType>
export type MCTableTools = AdminTableTools
