import type { MenuManagementRecord, UserRecord } from '@/mock/admin-mock'
import type { MenuRecord } from '@/types/admin'

export interface WorkspaceSearchItem {
  description: string
  keyword: string
  path: string
  title: string
  type: 'menu' | 'user' | 'permission'
}

// 函数：flattenMenu。把树形菜单展开成按深度优先排列的一维列表。
export function flattenMenu(menu: MenuRecord[]): MenuRecord[] {
  return menu.flatMap(item => [item, ...flattenMenu(item.children ?? [])])
}

// 函数：findMenuTrail。查找指定路径对应的菜单祖先链。
export function findMenuTrail(menu: MenuRecord[], path: string): MenuRecord[] | undefined {
  for (const item of menu) {
    if (item.path === path) {
      return [item]
    }

    // 返回完整祖先链，保证面包屑和根菜单选中状态一致。
    const childTrail = findMenuTrail(item.children ?? [], path)
    if (childTrail) {
      return [item, ...childTrail]
    }
  }

  return undefined
}

// 函数：searchMenu。按关键字搜索菜单标题、路径和徽标。
export function searchMenu(menu: MenuRecord[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return []
  }

  // 搜索可见标题和路由元数据，徽标也纳入以支持数字快速检索。
  return flattenMenu(menu).filter(item => {
    const haystack = [item.badge, item.path, item.title].filter(Boolean).join(' ').toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

/** 构建全局搜索候选项，覆盖菜单、权限和系统用户。 */
export function buildWorkspaceSearchItems(
  menu: MenuRecord[],
  users: UserRecord[],
  permissions: MenuManagementRecord[]
): WorkspaceSearchItem[] {
  const menuItems = flattenMenu(menu).map(item => ({
    description: item.path,
    keyword: [item.title, item.path, item.badge].filter(Boolean).join(' '),
    path: item.path,
    title: item.title,
    type: 'menu' as const
  }))

  const permissionItems = permissions.map(item => ({
    description: `${item.name} / ${item.path}`,
    keyword: [item.name, item.path, item.permission, item.component].join(' '),
    path: item.path,
    title: item.permission,
    type: 'permission' as const
  }))

  const userItems = users.map(user => ({
    description: `${user.role} / ${user.department}`,
    keyword: [user.name, user.email, user.role, user.department].join(' '),
    path: '/system/users',
    title: user.name,
    type: 'user' as const
  }))

  return [...menuItems, ...permissionItems, ...userItems]
}
