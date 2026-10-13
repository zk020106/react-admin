import { runtimeEnv } from '@/config/env'
import { http, type HttpRequestConfig } from '@/lib/http'
import {
  adminMockApi,
  type DepartmentRecord,
  type MenuManagementRecord,
  type NotificationRecord,
  type OverviewSummary,
  type RoleInput,
  type RoleRecord,
  type UserInput,
  type UserRecord,
  type WorkplaceSummary
} from '@/mock/admin-mock'
import type { MenuRecord } from '@/types/admin'
import type { ProjectInfo } from '@/types/project-info'

export interface AdminApi {
  about: (signal?: AbortSignal) => Promise<ProjectInfo>
  createRole: (input: RoleInput) => Promise<RoleRecord>
  createUser: (input: UserInput) => Promise<UserRecord>
  deleteRole: (code: string) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  departments: (signal?: AbortSignal) => Promise<DepartmentRecord[]>
  menu: (signal?: AbortSignal) => Promise<MenuRecord[]>
  menus: (signal?: AbortSignal) => Promise<MenuManagementRecord[]>
  notifications: (signal?: AbortSignal) => Promise<NotificationRecord[]>
  overview: (signal?: AbortSignal) => Promise<OverviewSummary>
  roles: (signal?: AbortSignal) => Promise<RoleRecord[]>
  updateRole: (code: string, input: RoleInput) => Promise<RoleRecord>
  updateRolePermissions: (code: string, permissions: string[]) => Promise<RoleRecord>
  updateUser: (id: string, input: UserInput) => Promise<UserRecord>
  users: (signal?: AbortSignal) => Promise<UserRecord[]>
  workplace: (signal?: AbortSignal) => Promise<WorkplaceSummary>
}

export interface AdminApiHttpClient {
  delete: <T>(url: string, config?: HttpRequestConfig) => Promise<T>
  get: <T>(url: string, config?: HttpRequestConfig) => Promise<T>
  post: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => Promise<T>
  put: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => Promise<T>
}

export function createHttpAdminApi(client: AdminApiHttpClient = http): AdminApi {
  return {
    about: signal => client.get<ProjectInfo>('/admin/about', { signal }),
    createRole: input => client.post<RoleRecord>('/admin/system/roles', input),
    createUser: input => client.post<UserRecord>('/admin/system/users', input),
    deleteRole: code => client.delete<void>(`/admin/system/roles/${code}`),
    deleteUser: id => client.delete<void>(`/admin/system/users/${id}`),
    departments: signal => client.get<DepartmentRecord[]>('/admin/system/departments', { signal }),
    menu: signal => client.get<MenuRecord[]>('/admin/menu', { signal }),
    menus: signal => client.get<MenuManagementRecord[]>('/admin/system/menus', { signal }),
    notifications: signal => client.get<NotificationRecord[]>('/admin/notifications', { signal }),
    overview: signal => client.get<OverviewSummary>('/admin/overview', { signal }),
    roles: signal => client.get<RoleRecord[]>('/admin/system/roles', { signal }),
    updateRole: (code, input) => client.put<RoleRecord>(`/admin/system/roles/${code}`, input),
    updateRolePermissions: (code, permissions) =>
      client.put<RoleRecord>(`/admin/system/roles/${code}/permissions`, { permissions }),
    updateUser: (id, input) => client.put<UserRecord>(`/admin/system/users/${id}`, input),
    users: signal => client.get<UserRecord[]>('/admin/system/users', { signal }),
    workplace: signal => client.get<WorkplaceSummary>('/admin/workplace', { signal })
  }
}

export function createAdminApi(options: { useMock?: boolean } = {}): AdminApi {
  return (options.useMock ?? runtimeEnv.useMock) ? adminMockApi : createHttpAdminApi()
}

export const adminApi = createAdminApi()
