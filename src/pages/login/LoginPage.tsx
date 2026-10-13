import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useStore } from 'zustand'
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Send,
  TriangleAlert,
  UserRound
} from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { authApi } from '@/api/auth'
import { useSystemDark } from '@/hooks/use-system-dark'
import { cn } from '@/lib/utils'
import { navigationKeys, notificationKeys } from '@/lib/query-keys'
import { authStore } from '@/store/auth'
import { preferenceStore } from '@/store/preferences'
import { applyAdminTheme } from '@/theme'
import type { AdminPreferences } from '@/types/admin'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { BrandMark } from './BrandMark'
import { DashboardPreview } from './DashboardPreview'
import { GithubMark } from './GithubMark'
import { LoginToolbar } from './LoginToolbar'
import type { LoginThemeMode } from './ThemeToggle'

interface LoginValues {
  password: string
  remember: boolean
  username: string
}

type LoginLanguage = 'en-US' | 'zh-CN'

function resolveLoginThemeMode(
  colorMode: AdminPreferences['colorMode'],
  systemDark: boolean
): LoginThemeMode {
  if (colorMode === 'system') {
    return systemDark ? 'dark' : 'light'
  }

  return colorMode
}

export function LoginPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const preferences = useStore(preferenceStore, state => state.preferences)
  const setPreferences = useStore(preferenceStore, state => state.setPreferences)
  const systemDark = useSystemDark()
  const [language, setLanguage] = useState<LoginLanguage>('zh-CN')
  const [compactLayout, setCompactLayout] = useState(false)
  const [interactionStatus, setInteractionStatus] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { formState, handleSubmit, register, setValue, watch } = useForm<LoginValues>({
    defaultValues: { password: 'admin123', remember: true, username: 'admin' }
  })
  const { errors } = formState
  const remember = watch('remember')
  const themeMode = resolveLoginThemeMode(preferences.colorMode, systemDark)
  const isDark = themeMode === 'dark'
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: session => {
      authStore.getState().setSession(session)
      void queryClient.invalidateQueries({ queryKey: navigationKeys.all })
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      void navigate({ to: '/' })
    }
  })
  const errorMessage =
    loginMutation.error instanceof Error ? loginMutation.error.message : undefined
  const pageStyle = useMemo<CSSProperties>(
    () => ({
      background: isDark
        ? 'radial-gradient(circle at top left, rgba(59,130,246,0.20), transparent 40%), radial-gradient(circle at bottom right, rgba(124,58,237,0.18), transparent 40%), #020617'
        : 'radial-gradient(circle at top left, rgba(22,119,255,0.10), transparent 40%), radial-gradient(circle at bottom right, rgba(99,102,241,0.10), transparent 40%), #ffffff',
      transition: 'all .25s ease'
    }),
    [isDark]
  )
  useEffect(() => {
    applyAdminTheme({
      builtinType: preferences.themeBuiltinType,
      colorDestructive: preferences.themeColorDestructive,
      colorPrimary: preferences.themeColorPrimary,
      colorSuccess: preferences.themeColorSuccess,
      colorWarning: preferences.themeColorWarning,
      fontSize: preferences.themeFontSize,
      mode: preferences.colorMode === 'system' ? 'auto' : preferences.colorMode,
      radius: preferences.themeRadius,
      semiDarkHeader: preferences.themeSemiDarkHeader,
      semiDarkSidebar: preferences.themeSemiDarkSidebar,
      semiDarkSidebarSub: preferences.themeSemiDarkSidebarSub
    })

    const root = document.documentElement
    root.dataset.loginTheme = themeMode

    return () => {
      delete root.dataset.loginTheme
    }
  }, [
    preferences.colorMode,
    preferences.themeBuiltinType,
    preferences.themeColorDestructive,
    preferences.themeColorPrimary,
    preferences.themeColorSuccess,
    preferences.themeColorWarning,
    preferences.themeFontSize,
    preferences.themeRadius,
    preferences.themeSemiDarkHeader,
    preferences.themeSemiDarkSidebar,
    preferences.themeSemiDarkSidebarSub,
    themeMode
  ])

  function handleFinish(values: LoginValues) {
    loginMutation.mutate({
      password: values.password,
      username: values.username
    })
  }

  function handleAuxiliaryAction(label: string) {
    setInteractionStatus(`${label} 已点击`)
  }

  function handleGithubClick() {
    window.open('https://github.com', '_blank', 'noopener,noreferrer')
  }

  return (
    <main
      className={cn(
        'react-admin-login min-h-[100dvh] overflow-hidden text-slate-950 transition-all duration-[250ms] dark:text-white',
        isDark ? 'dark' : 'light'
      )}
      data-login-theme={themeMode}
      data-slot="login-page"
      style={pageStyle}
    >
      <div className="grid min-h-[100dvh] w-full min-w-0 lg:grid-cols-[58fr_42fr] xl:grid-cols-[62fr_38fr]">
        <section className="relative hidden min-h-0 flex-col justify-between overflow-hidden px-[clamp(2rem,3.4vw,4.5rem)] py-[clamp(2.25rem,4.4vw,4.75rem)] lg:flex">
          <div className="pointer-events-none absolute -top-32 left-1/2 size-[520px] rounded-full bg-blue-500/[0.06] blur-3xl dark:bg-blue-400/[0.10]" />
          <div className="relative flex items-center gap-4">
            <BrandMark />
            <div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-slate-950 dark:text-white">
                React Admin
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Professional · Efficient · Elegant
              </p>
            </div>
          </div>

          <DashboardPreview themeMode={themeMode} />

          <div className="relative max-w-[720px]">
            <h2 className="text-[clamp(1.7rem,2.45vw,2.45rem)] font-semibold leading-tight tracking-[-0.02em] text-slate-950 dark:text-white">
              开箱即用的 React 管理系统
            </h2>
            <p className="mt-4 max-w-[680px] text-[16px] leading-7 text-slate-600 dark:text-slate-400">
              基于 React、TypeScript、Vite、TanStack 构建的现代化后台管理解决方案。
            </p>
          </div>
        </section>

        <section className="relative flex min-h-[100dvh] min-w-0 flex-col overflow-x-hidden px-5 py-6 sm:px-8 lg:px-12">
          <LoginToolbar
            compactLayout={compactLayout}
            language={language}
            onGithubClick={handleGithubClick}
            onThemeToggle={() => setPreferences({ colorMode: isDark ? 'light' : 'dark' })}
            onToggleLanguage={() =>
              setLanguage(current => (current === 'zh-CN' ? 'en-US' : 'zh-CN'))
            }
            onToggleLayout={() => setCompactLayout(current => !current)}
            themeMode={themeMode}
          />

          <div className="flex flex-1 items-center justify-center py-10">
            <div
              className="w-full min-w-0 transition-all duration-[250ms]"
              data-slot="login-form-panel"
              style={{
                maxWidth: compactLayout
                  ? 'min(380px, calc(100vw - 2.5rem))'
                  : 'min(430px, calc(100vw - 2.5rem))'
              }}
            >
              <div className="mb-10 lg:hidden">
                <div className="flex items-center justify-center gap-3">
                  <BrandMark compact />
                  <div>
                    <div className="text-lg font-semibold text-slate-950 dark:text-white">
                      React Admin
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Professional · Efficient · Elegant
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-9">
                <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-slate-950 dark:text-white">
                  欢迎回来
                </h2>
                <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
                  请输入您的账号信息登录系统
                </p>
              </div>

              <form className="grid gap-4" noValidate onSubmit={handleSubmit(handleFinish)}>
                <div>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      {...register('username', { required: '请输入用户名' })}
                      aria-invalid={errors.username ? true : undefined}
                      autoComplete="username"
                      autoFocus
                      className="login-input h-[52px] rounded-[14px] pr-3 pl-10"
                      placeholder="请输入用户名"
                    />
                  </div>
                  {errors.username?.message ? (
                    <p className="login-field-error" role="alert">
                      {errors.username.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      {...register('password', { required: '请输入密码' })}
                      aria-invalid={errors.password ? true : undefined}
                      autoComplete="current-password"
                      className="login-input h-[52px] rounded-[14px] pr-12 pl-10"
                      placeholder="请输入密码"
                      type={showPassword ? 'text' : 'password'}
                    />
                    <button
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                      onClick={() => setShowPassword(current => !current)}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="size-[18px]" />
                      ) : (
                        <Eye className="size-[18px]" />
                      )}
                    </button>
                  </div>
                  {errors.password?.message ? (
                    <p className="login-field-error" role="alert">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={remember}
                      className="login-checkbox"
                      id="login-remember"
                      onCheckedChange={value => setValue('remember', value === true)}
                    />
                    <Label htmlFor="login-remember">记住我</Label>
                  </div>
                  <button
                    className="text-sm font-medium text-blue-600 transition-colors duration-[250ms] hover:text-indigo-500 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => handleAuxiliaryAction('忘记密码')}
                    type="button"
                  >
                    忘记密码?
                  </button>
                </div>

                {errorMessage && (
                  <div
                    className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300"
                    role="alert"
                  >
                    <TriangleAlert className="size-4" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  className="login-submit-button mt-2 h-12 w-full rounded-xl"
                  disabled={loginMutation.isPending}
                  type="submit"
                >
                  {loginMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  登录
                </Button>
              </form>

              <div className="login-divider my-8 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="shrink-0">其他登录方式</span>
                <Separator className="flex-1" />
              </div>

              <div className="flex items-center justify-center gap-5">
                <SocialButton label="GitHub" onClick={() => handleAuxiliaryAction('GitHub 登录')}>
                  <GithubMark className="size-5" />
                </SocialButton>
                <SocialButton label="微信" onClick={() => handleAuxiliaryAction('微信登录')}>
                  <MessageCircle className="size-5 text-[#1aad19]" />
                </SocialButton>
                <SocialButton label="钉钉" onClick={() => handleAuxiliaryAction('钉钉登录')}>
                  <Send className="size-5 text-[#1677ff]" />
                </SocialButton>
              </div>

              <p className="mt-9 text-center text-sm text-slate-500 dark:text-slate-400">
                还没有账号？{' '}
                <button
                  className="font-medium text-blue-600 transition-colors duration-[250ms] hover:text-indigo-500 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => handleAuxiliaryAction('创建账号')}
                  type="button"
                >
                  创建账号
                </button>
              </p>
              <span aria-live="polite" className="sr-only">
                {interactionStatus}
              </span>
            </div>
          </div>

          <footer className="pb-1 text-center text-xs text-slate-400 dark:text-slate-500">
            © 2026 React Admin. All rights reserved.
          </footer>
        </section>
      </div>
    </main>
  )
}

function SocialButton({
  children,
  label,
  onClick
}: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-14 items-center justify-center rounded-full border border-slate-200/80 bg-white/56 text-slate-950 shadow-[0_10px_26px_rgba(15,23,42,0.05)] backdrop-blur-md transition-all duration-[250ms] hover:scale-[1.05] hover:border-blue-300 hover:bg-white/82 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:shadow-none dark:hover:border-blue-400/45 dark:hover:bg-white/[0.10]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
