import { afterEach, describe, expect, it } from 'vitest'

import { createAdminApi, createHttpAdminApi, type AdminApiHttpClient } from '@/api/admin'
import type { HttpRequestConfig } from '@/lib/http'
import { mockAdminMenu, resetMockUsers, type UserInput } from '@/mock/admin-mock'

const sampleInput: UserInput = {
  department: '质量部',
  email: 'qa@example.com',
  name: '测试账号',
  riskLevel: '低',
  role: '测试员',
  status: '启用'
}

describe('admin api service', () => {
  afterEach(() => {
    resetMockUsers()
  })

  it('uses the mock service when mock mode is enabled', async () => {
    const api = createAdminApi({ useMock: true })

    await expect(api.menu()).resolves.toEqual(mockAdminMenu)
  })

  it('passes TanStack Query abort signals into http requests', async () => {
    const calls: Array<{ signal?: unknown; url: string }> = []
    const client: AdminApiHttpClient = {
      delete: <T>() => Promise.resolve(undefined as T),
      get: <T>(url: string, config?: HttpRequestConfig) => {
        calls.push({ signal: config?.signal, url })
        return Promise.resolve([] as T)
      },
      post: <T>() => Promise.resolve(undefined as T),
      put: <T>() => Promise.resolve(undefined as T)
    }
    const controller = new AbortController()
    const api = createHttpAdminApi(client)

    await api.users(controller.signal)

    expect(calls).toEqual([
      {
        signal: controller.signal,
        url: '/admin/system/users'
      }
    ])
  })

  it('sends user mutations to REST endpoints with payloads', async () => {
    const calls: Array<{ data?: unknown; method: string; url: string }> = []
    const client: AdminApiHttpClient = {
      delete: <T>(url: string) => {
        calls.push({ method: 'DELETE', url })
        return Promise.resolve(undefined as T)
      },
      get: <T>() => Promise.resolve([] as T),
      post: <T>(url: string, data?: unknown) => {
        calls.push({ data, method: 'POST', url })
        return Promise.resolve(undefined as T)
      },
      put: <T>(url: string, data?: unknown) => {
        calls.push({ data, method: 'PUT', url })
        return Promise.resolve(undefined as T)
      }
    }
    const api = createHttpAdminApi(client)

    await api.createUser(sampleInput)
    await api.updateUser('user-root', sampleInput)
    await api.deleteUser('user-root')

    expect(calls).toEqual([
      { data: sampleInput, method: 'POST', url: '/admin/system/users' },
      { data: sampleInput, method: 'PUT', url: '/admin/system/users/user-root' },
      { method: 'DELETE', url: '/admin/system/users/user-root' }
    ])
  })

  it('creates, updates and deletes users in the mock service', async () => {
    const api = createAdminApi({ useMock: true })

    const created = await api.createUser(sampleInput)
    expect(created.id).toBeTruthy()
    await expect(api.users()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: '测试账号' })])
    )

    const updated = await api.updateUser(created.id, { ...sampleInput, name: '改名账号' })
    expect(updated.name).toBe('改名账号')

    await api.deleteUser(created.id)
    const remaining = await api.users()
    expect(remaining.some(user => user.id === created.id)).toBe(false)
  })
})
