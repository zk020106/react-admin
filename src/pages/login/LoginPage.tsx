import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Button,
  Checkbox,
  ConfigProvider,
  Divider,
  Form,
  Input,
  theme as antdTheme,
  type ThemeConfig
} from 'antd'
import zhCN from 'antd/locale/zh_CN'
import {
  Eye,
  EyeOff,
  LockKeyhole,
  MessageCircle,
  Send,
  TriangleAlert,
  UserRound
} from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'

import { authApi } from '@/api/auth'
import { cn } from '@/lib/utils'
import { navigationKeys, notificationKeys } from '@/lib/query-keys'
import { authStore } from '@/store/auth'
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

const LOGIN_THEME_STORAGE_KEY = 'react-admin-theme'

function readStoredTheme(): LoginThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const stored = window.localStorage.getItem(LOGIN_THEME_STORAGE_KEY)

    return stored === 'dark' || stored === 'light' ? stored : 'light'
  } catch {
    return 'light'
  }
}

function persistTheme(themeMode: LoginThemeMode) {
  try {
    window.localStorage.setItem(LOGIN_THEME_STORAGE_KEY, themeMode)
  } catch {
    // Storage failures should not block login.
  }
}

export function LoginPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [themeMode, setThemeMode] = useState<LoginThemeMode>(readStoredTheme)
  const [language, setLanguage] = useState<LoginLanguage>('zh-CN')
  const [compactLayout, setCompactLayout] = useState(false)
  const [interactionStatus, setInteractionStatus] = useState('')
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
  const antdThemeConfig = useMemo<ThemeConfig>(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      components: {
        Button: {
          borderRadius: 12,
          controlHeight: 48
        },
        Checkbox: {
          borderRadiusSM: 5
        },
        Input: {
          activeBorderColor: '#1677ff',
          activeShadow: '0 0 0 3px rgba(22,119,255,0.12)',
          borderRadius: 14,
          controlHeight: 52,
          hoverBorderColor: '#1677ff'
        }
      },
      token: {
        borderRadius: 12,
        colorBgBase: isDark ? '#020617' : '#ffffff',
        colorBorder: isDark ? 'rgba(148,163,184,0.20)' : 'rgba(203,213,225,0.92)',
        colorPrimary: '#1677ff',
        colorText: isDark ? '#e5e7eb' : '#111827',
        colorTextPlaceholder: isDark ? 'rgba(148,163,184,0.74)' : 'rgba(100,116,139,0.68)',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
      }
    }),
    [isDark]
  )

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
    root.dataset.loginTheme = themeMode
    root.style.colorScheme = themeMode
    persistTheme(themeMode)

    return () => {
      root.classList.remove('dark', 'light')
      delete root.dataset.loginTheme
      root.style.colorScheme = ''
    }
  }, [isDark, themeMode])

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
    <ConfigProvider locale={zhCN} theme={antdThemeConfig}>
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
                基于 React、TypeScript、Vite、Ant Design 构建的现代化后台管理解决方案。
              </p>
            </div>
          </section>

          <section className="relative flex min-h-[100dvh] min-w-0 flex-col overflow-x-hidden px-5 py-6 sm:px-8 lg:px-12">
            <LoginToolbar
              compactLayout={compactLayout}
              language={language}
              onGithubClick={handleGithubClick}
              onThemeToggle={() => setThemeMode(current => (current === 'dark' ? 'light' : 'dark'))}
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

                <Form<LoginValues>
                  className="grid gap-4"
                  initialValues={{ password: 'admin123', remember: true, username: 'admin' }}
                  onFinish={handleFinish}
                  requiredMark={false}
                >
                  <Form.Item
                    className="!mb-0"
                    name="username"
                    rules={[{ message: '请输入用户名', required: true }]}
                  >
                    <Input
                      autoComplete="username"
                      autoFocus
                      className="login-input"
                      placeholder="请输入用户名"
                      prefix={<UserRound className="size-[18px] text-slate-400" />}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    className="!mb-0"
                    name="password"
                    rules={[{ message: '请输入密码', required: true }]}
                  >
                    <Input.Password
                      autoComplete="current-password"
                      className="login-input"
                      iconRender={visible =>
                        visible ? (
                          <EyeOff className="size-[18px] text-slate-400" />
                        ) : (
                          <Eye className="size-[18px] text-slate-400" />
                        )
                      }
                      placeholder="请输入密码"
                      prefix={<LockKeyhole className="size-[18px] text-slate-400" />}
                      size="large"
                    />
                  </Form.Item>

                  <div className="flex items-center justify-between pt-1">
                    <Form.Item name="remember" noStyle valuePropName="checked">
                      <Checkbox className="login-checkbox">记住我</Checkbox>
                    </Form.Item>
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
                    block
                    className="login-submit-button mt-2"
                    htmlType="submit"
                    loading={loginMutation.isPending}
                    size="large"
                    type="primary"
                  >
                    登录
                  </Button>
                </Form>

                <Divider className="login-divider !my-8">其他登录方式</Divider>

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
    </ConfigProvider>
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
