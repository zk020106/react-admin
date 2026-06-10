import { configureHttp } from '@/lib/http'
import { authStore } from '@/store/auth'

let configured = false

export function setupHttpAuth() {
  if (configured) {
    return
  }

  configureHttp({
    getAccessToken: () => authStore.getState().getAccessToken(),
    onUnauthorized: () => authStore.getState().clearSession()
  })
  configured = true
}
