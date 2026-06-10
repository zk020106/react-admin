import { describe, expect, it } from 'vitest'

import { createAdminApi, createHttpAdminApi, type AdminApiHttpClient } from '@/api/admin'
import type { HttpRequestConfig } from '@/lib/http'
import { mockAdminMenu } from '@/mock/admin-mock'

describe('admin api service', () => {
  it('uses the mock service when mock mode is enabled', async () => {
    const api = createAdminApi({ useMock: true })

    await expect(api.menu()).resolves.toEqual(mockAdminMenu)
  })

  it('passes TanStack Query abort signals into http requests', async () => {
    const calls: Array<{ signal?: unknown; url: string }> = []
    const client: AdminApiHttpClient = {
      get: <T>(url: string, config?: HttpRequestConfig) => {
        calls.push({ signal: config?.signal, url })
        return Promise.resolve([] as T)
      }
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
})
