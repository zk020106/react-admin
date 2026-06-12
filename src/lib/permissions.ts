import type { MenuRecord } from '@/types/admin'
import type { AuthSession } from '@/types/auth'

export type PermissionInput = string | string[] | undefined

const unrestrictedPermissions: readonly string[] = ['*']

export function resolveSessionPermissions(session: AuthSession | undefined) {
  if (!session) {
    return undefined
  }

  if (session.user.permissions.includes('*') || session.user.roles.includes('owner')) {
    return unrestrictedPermissions
  }

  return session.user.permissions
}

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
