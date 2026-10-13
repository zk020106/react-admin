import { queryClient } from '@/lib/query-client'
import { systemKeys } from '@/lib/query-keys'
import { adminApi } from '@/api/admin'
import type { RoleInput, UserInput } from '@/mock/admin-mock'

// 用户管理 mutation 约定：成功后按资源精确失效列表查询，错误统一由 MutationCache 上报。
export const userMutations = {
  create: () => ({
    mutationFn: (input: UserInput) => adminApi.createUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.users() })
  }),
  remove: () => ({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.users() })
  }),
  update: () => ({
    mutationFn: ({ id, input }: { id: string; input: UserInput }) => adminApi.updateUser(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.users() })
  })
}

// 角色管理 mutation 约定：同用户，成功后失效角色列表查询。
export const roleMutations = {
  create: () => ({
    mutationFn: (input: RoleInput) => adminApi.createRole(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.roles() })
  }),
  remove: () => ({
    mutationFn: (code: string) => adminApi.deleteRole(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.roles() })
  }),
  update: () => ({
    mutationFn: ({ code, input }: { code: string; input: RoleInput }) =>
      adminApi.updateRole(code, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.roles() })
  }),
  updatePermissions: () => ({
    mutationFn: ({ code, permissions }: { code: string; permissions: string[] }) =>
      adminApi.updateRolePermissions(code, permissions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: systemKeys.roles() })
  })
}
