import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, LogIn, PanelsTopLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { navigationKeys, notificationKeys } from '@/lib/query-keys'
import { authStore } from '@/store/auth'

export function LoginPage() {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: session => {
      authStore.getState().setSession(session)
      void queryClient.invalidateQueries({ queryKey: navigationKeys.all })
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    }
  })
  const errorMessage =
    loginMutation.error instanceof Error ? loginMutation.error.message : undefined

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      return
    }

    loginMutation.mutate({
      password,
      username
    })
  }

  return (
    <main
      className="grid min-h-dvh place-items-center bg-background-deep px-4 py-8 text-foreground"
      data-slot="login-page"
    >
      <form
        className="grid w-full max-w-[360px] gap-5 rounded-lg border bg-card p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PanelsTopLeft className="size-5" />
          </div>
          <div className="grid gap-1">
            <h1 className="text-lg font-semibold leading-none">React Admin</h1>
            <p className="text-sm text-muted-foreground">管理后台登录</p>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="login-username">账号</Label>
          <Input
            autoComplete="username"
            autoFocus
            id="login-username"
            onChange={event => setUsername(event.target.value)}
            placeholder="请输入账号"
            value={username}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="login-password">密码</Label>
          <Input
            autoComplete="current-password"
            id="login-password"
            onChange={event => setPassword(event.target.value)}
            placeholder="请输入密码"
            type="password"
            value={password}
          />
        </div>
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            <span>{errorMessage}</span>
          </div>
        )}
        <Button disabled={loginMutation.isPending} type="submit">
          <LogIn className="size-4" />
          {loginMutation.isPending ? '登录中' : '登录'}
        </Button>
      </form>
    </main>
  )
}
