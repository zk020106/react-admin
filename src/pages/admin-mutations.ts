import { queryClient } from '@/lib/query-client'
import { systemKeys } from '@/lib/query-keys'
import { adminApi } from '@/api/admin'
import type { UserInput } from '@/mock/admin-mock'

// 用户管理 mutation 约定：成功后同时失效分页列表与全量列表查询，错误统一由 MutationCache 上报。
// 分页列表（systemKeys.users() 前缀）覆盖表格；全量列表（usersAll）覆盖全局搜索、角色成员统计。
function invalidateUserQueries() {
  void queryClient.invalidateQueries({ queryKey: systemKeys.users() })
  void queryClient.invalidateQueries({ queryKey: systemKeys.usersAll() })
}

export const userMutations = {
  create: () => ({
    mutationFn: (input: UserInput) => adminApi.createUser(input),
    onSuccess: invalidateUserQueries
  }),
  remove: () => ({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: invalidateUserQueries
  }),
  update: () => ({
    mutationFn: ({ id, input }: { id: string; input: UserInput }) => adminApi.updateUser(id, input),
    onSuccess: invalidateUserQueries
  })
}
