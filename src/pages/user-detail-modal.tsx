import { Tag } from 'antd'

import type { DetailField } from '@/components/admin/popup'
import { useDetailModal } from '@/components/admin/popup'
import type { UserRecord } from '@/mock/admin-mock'

/** 用户详情字段配置 */
const USER_DETAIL_FIELDS: DetailField[] = [
  {
    label: '姓名',
    value: 'name'
  },
  {
    label: '账号',
    value: 'account'
  },
  {
    label: '邮箱',
    value: 'email'
  },
  {
    label: '手机号',
    value: 'phone'
  },
  {
    label: '性别',
    value: 'gender'
  },
  {
    label: '角色',
    value: 'role'
  },
  {
    label: '部门',
    value: 'department'
  },
  {
    label: '登录方式',
    value: 'loginMethod'
  },
  {
    label: '状态',
    render: (_, record) => (
      <Tag color={record.status === '启用' ? 'blue' : 'default'}>{String(record.status)}</Tag>
    ),
    value: 'status'
  },
  {
    label: '风险等级',
    render: (_, record) => (
      <Tag
        color={record.riskLevel === '高' ? 'red' : record.riskLevel === '中' ? 'gold' : 'default'}
      >
        {String(record.riskLevel)}
      </Tag>
    ),
    value: 'riskLevel'
  },
  {
    label: '最近登录',
    value: 'lastLogin'
  },
  {
    label: '备注',
    value: 'remark'
  }
]

/** 用户详情弹窗 Hook */
export function useUserDetailModal() {
  return useDetailModal<UserRecord>({
    fields: USER_DETAIL_FIELDS,
    title: '用户详情',
    width: 600
  })
}
