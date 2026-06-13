import { useState, type ReactNode } from 'react'
import { Drawer, Tag, Descriptions } from 'antd'
import type { UserRecord } from '@/mock/admin-mock'

export interface UseUserDetailDrawerResult {
  /** 关闭抽屉 */
  close: () => void
  /** 需要挂载到页面的抽屉节点 */
  drawer: ReactNode
  /** 打开详情抽屉并传入数据 */
  open: (data: UserRecord) => void
}

/** 用户详情抽屉 Hook */
export function useUserDetailDrawer(): UseUserDetailDrawerResult {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<UserRecord | null>(null)

  function open(record: UserRecord) {
    setData(record)
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    setTimeout(() => setData(null), 300)
  }

  const drawer = (
    <Drawer onClose={close} open={isOpen} title="用户详情" width={480}>
      {data && (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="用户名">{data.account}</Descriptions.Item>
          <Descriptions.Item label="昵称">{data.name}</Descriptions.Item>
          <Descriptions.Item label="性别">{data.gender}</Descriptions.Item>
          <Descriptions.Item label="手机号">{data.phone || '暂无'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{data.email || '暂无'}</Descriptions.Item>
          <Descriptions.Item label="所属部门">{data.department}</Descriptions.Item>
          <Descriptions.Item label="角色">{data.role}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={data.status === '启用' ? 'green' : 'default'}>{data.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建人">超级管理员</Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.lastLogin}</Descriptions.Item>
          <Descriptions.Item label="修改人">-</Descriptions.Item>
          <Descriptions.Item label="修改时间">-</Descriptions.Item>
          <Descriptions.Item label="描述">{data.remark || '暂无'}</Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  )

  return { close, drawer, open }
}
