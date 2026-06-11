import { queryClient } from '@/lib/query-client'
import { systemKeys } from '@/lib/query-keys'
import { adminApi } from '@/api/admin'
import type { UserInput } from '@/mock/admin-mock'

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
