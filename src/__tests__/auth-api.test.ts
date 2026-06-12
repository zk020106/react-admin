import { describe, expect, it } from 'vitest'

import { createAuthApi, createHttpAuthApi, type AuthApiHttpClient } from '@/api/auth'
import type { HttpRequestConfig } from '@/lib/http'
import { mockAuthSession } from '@/mock/auth-mock'

describe('auth api service', () => {
  it('sends refresh requests with refresh replay disabled', async () => {
    const calls: Array<{ config?: HttpRequestConfig; data?: unknown; url: string }> = []
    const client: AuthApiHttpClient = {
      get: <T>() => Promise.resolve(undefined as T),
      post: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => {
        calls.push({ config, data, url })
        return Promise.resolve(mockAuthSession as T)
      }
    }
    const api = createHttpAuthApi(client)

    await api.refresh('refresh-token')

    expect(calls).toEqual([
      {
        config: { skipAuthRefresh: true },
        data: { refreshToken: 'refresh-token' },
        url: '/auth/refresh'
      }
    ])
  })

  it('refreshes mock sessions with a rotated access token', async () => {
    const api = createAuthApi({ useMock: true })

    await expect(api.refresh('mock-refresh-token')).resolves.toMatchObject({
      accessToken: 'mock-access-token-rotated',
      refreshToken: 'mock-refresh-token'
    })
  })
})
