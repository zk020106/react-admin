import { HttpError } from '@/lib/http'
import type { AuthSession, AuthUser, LoginCredentials } from '@/types/auth'

const MOCK_DELAY = 120

export const mockAuthUser: AuthUser = {
  id: 'root',
  name: 'Root Admin',
  permissions: [
    'overview:read',
    'workplace:read',
    'system:user:read',
    'system:role:read',
    'system:menu:read',
    'system:department:read',
    'effects:read',
    'about:read'
  ],
  roles: ['owner']
}

export const mockAuthSession: AuthSession = {
  accessToken: 'mock-access-token',
  user: mockAuthUser
}

export const mockAuthApi = {
  login: (credentials: LoginCredentials) => {
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      return delay(mockAuthSession)
    }

    return Promise.reject(
      new HttpError({
        code: 401,
        message: '账号或密码不正确',
        status: 401
      })
    )
  },
  logout: (signal?: AbortSignal) => delay(undefined, signal),
  me: (signal?: AbortSignal) => delay(mockAuthUser, signal)
}

function delay<T>(value: T, signal?: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = window.setTimeout(() => resolve(value), MOCK_DELAY)

    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}
