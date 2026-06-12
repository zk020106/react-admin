import { runtimeEnv } from '@/config/env'
import { http, type HttpRequestConfig } from '@/lib/http'
import { mockAuthApi } from '@/mock/auth-mock'
import type { AuthSession, AuthUser, LoginCredentials } from '@/types/auth'

export interface AuthApi {
  login: (credentials: LoginCredentials) => Promise<AuthSession>
  logout: (signal?: AbortSignal) => Promise<void>
  me: (signal?: AbortSignal) => Promise<AuthUser>
  refresh: (refreshToken: string) => Promise<AuthSession>
}

export interface AuthApiHttpClient {
  get: <T>(url: string, config?: HttpRequestConfig) => Promise<T>
  post: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => Promise<T>
}

export function createHttpAuthApi(client: AuthApiHttpClient = http): AuthApi {
  return {
    login: credentials => client.post<AuthSession>('/auth/login', credentials),
    logout: signal => client.post<void>('/auth/logout', undefined, { signal }),
    me: signal => client.get<AuthUser>('/auth/me', { signal }),
    refresh: refreshToken =>
      client.post<AuthSession>('/auth/refresh', { refreshToken }, { skipAuthRefresh: true })
  }
}

export function createAuthApi(options: { useMock?: boolean } = {}): AuthApi {
  return (options.useMock ?? runtimeEnv.useMock) ? mockAuthApi : createHttpAuthApi()
}

export const authApi = createAuthApi()
