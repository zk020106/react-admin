import type { MenuRecord } from '@/types/admin'

export type PermissionInput = string | string[] | undefined

export function hasPermission(userPermissions: readonly string[], permission: PermissionInput) {
  if (!permission || (Array.isArray(permission) && permission.length === 0)) {
    return true
  }

  if (userPermissions.includes('*')) {
    return true
  }

  const requiredPermissions = Array.isArray(permission) ? permission : [permission]

  return requiredPermissions.some(item => userPermissions.includes(item))
}

export function filterAuthorizedMenu(
  menu: readonly MenuRecord[],
  userPermissions: readonly string[]
): MenuRecord[] {
  return menu.flatMap(item => {
    const children = filterAuthorizedMenu(item.children ?? [], userPermissions)
    const selfAllowed = hasPermission(userPermissions, item.permission)

    if (!selfAllowed && children.length === 0) {
      return []
    }

    return [
      {
        ...item,
        ...(children.length > 0 ? { children } : { children: undefined })
      }
    ]
  })
}
