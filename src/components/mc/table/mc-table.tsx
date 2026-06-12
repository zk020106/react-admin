import type { AnyObject } from 'antd/es/_util/type'

import { AdminTable } from '@/components/admin/table/admin-table'
import type { MCTableProps } from './types'

export function MCTable<RecordType extends AnyObject>(props: MCTableProps<RecordType>) {
  return <AdminTable<RecordType> {...props} />
}
