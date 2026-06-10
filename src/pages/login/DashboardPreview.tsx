import {
  Bell,
  Briefcase,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Globe2,
  Grid2X2,
  Info,
  LayoutDashboard,
  Maximize2,
  Moon,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  SlidersHorizontal,
  UserRoundCog,
  X
} from 'lucide-react'

import { AppLogo } from '@/components/app-logo'
import { cn } from '@/lib/utils'
import type { LoginThemeMode } from './ThemeToggle'

interface DashboardPreviewProps {
  themeMode: LoginThemeMode
}

const shellMenu = [
  { active: true, icon: LayoutDashboard, label: '概览' },
  { icon: Briefcase, label: '工作台' },
  { children: true, icon: Shield, label: '系统管理' },
  { icon: Info, label: '关于' }
]

const tabs = ['概览', '工作台', '用户管理']

const stats = [
  { label: '待处理任务', tone: 'blue', value: '18' },
  { label: '运行接口', tone: 'green', value: '42' },
  { label: '权限策略', tone: 'violet', value: '126' }
]

const tableRows = [
  ['Root Admin', '确认菜单权限接入', '进行中'],
  ['System', '同步偏好设置', '已完成'],
  ['Query', '刷新概览数据', '稳定']
]

export function DashboardPreview({ themeMode }: DashboardPreviewProps) {
  const isDark = themeMode === 'dark'

  return (
    <div className="dashboard-preview-float relative mx-auto w-full max-w-[900px]">
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[radial-gradient(circle_at_30%_10%,rgba(22,119,255,0.18),transparent_34%),radial-gradient(circle_at_78%_92%,rgba(99,102,241,0.16),transparent_36%)] blur-2xl dark:bg-[radial-gradient(circle_at_30%_10%,rgba(59,130,246,0.28),transparent_34%),radial-gradient(circle_at_78%_92%,rgba(124,58,237,0.24),transparent_36%)]" />
      <div
        className="relative overflow-hidden rounded-[24px] border border-white/72 bg-white/58 shadow-[0_26px_74px_rgba(15,23,42,0.13)] ring-1 ring-slate-950/[0.03] transition-all duration-[250ms] dark:border-white/10 dark:bg-slate-950/58 dark:shadow-[0_28px_82px_rgba(0,0,0,0.38)] dark:ring-white/[0.04]"
        style={{
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="grid min-h-[492px] grid-cols-[176px_1fr]">
          <aside className="flex min-w-0 flex-col border-r border-slate-200/70 bg-slate-950/[0.035] px-3 py-3 text-slate-700 transition-all duration-[250ms] dark:border-white/10 dark:bg-[#171a20] dark:text-slate-300">
            <div className="flex h-10 items-center gap-2 rounded-lg px-2">
              <AppLogo size="md" />
              <span className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                React Admin
              </span>
            </div>
            <div className="mt-5 px-2 text-[11px] font-medium text-slate-500 dark:text-slate-500">
              导航菜单
            </div>
            <nav aria-label="Admin shell preview menu" className="mt-3 grid gap-1">
              {shellMenu.map(item => {
                const Icon = item.icon

                return (
                  <div
                    className={cn(
                      'flex h-10 items-center gap-2 rounded-lg px-3 text-[12px] transition-all duration-[250ms]',
                      item.active
                        ? 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/18 dark:text-blue-300'
                        : 'text-slate-500 dark:text-slate-500'
                    )}
                    key={item.label}
                  >
                    <Icon className="size-4" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.children && <ChevronRight className="size-3.5 opacity-60" />}
                  </div>
                )
              })}
            </nav>
            <div className="mt-auto flex items-center justify-between px-2 text-slate-400 dark:text-slate-600">
              <span className="grid size-6 place-items-center rounded-md border border-slate-200/70 dark:border-white/10">
                <SlidersHorizontal className="size-3.5" />
              </span>
              <span className="h-1 w-14 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          </aside>

          <section className="grid min-w-0 grid-rows-[48px_38px_1fr] bg-slate-50/72 transition-all duration-[250ms] dark:bg-[#111419]">
            <header className="flex items-center gap-2 border-b border-slate-200/70 px-3 text-slate-500 dark:border-white/10 dark:text-slate-500">
              <RefreshCcw className="size-3.5" />
              <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-950 dark:text-white">
                <Grid2X2 className="size-4 text-blue-500" />
                <span>概览</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex h-7 w-[138px] items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 text-[11px] text-slate-400 dark:border-white/10 dark:bg-white/[0.04]">
                  <Search className="size-3.5" />
                  <span>搜索...</span>
                </div>
                <Settings2 className="size-3.5" />
                <Moon className="size-3.5" />
                <Globe2 className="size-3.5" />
                <Clock3 className="size-3.5" />
                <Maximize2 className="size-3.5" />
                <Bell className="size-3.5" />
                <CircleUserRound className="size-4" />
              </div>
            </header>

            <div className="flex items-center gap-2 border-b border-slate-200/70 bg-white/54 px-3 dark:border-white/10 dark:bg-white/[0.025]">
              {tabs.map((tab, index) => (
                <div
                  className={cn(
                    'flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] transition-all duration-[250ms]',
                    index === 0
                      ? 'border-slate-200/80 bg-white text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#171a20] dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-500'
                  )}
                  key={tab}
                >
                  {index === 0 && <LayoutDashboard className="size-3.5 text-blue-500" />}
                  <span>{tab}</span>
                  {index > 0 && <X className="size-3 opacity-60" />}
                </div>
              ))}
              <div className="ml-auto flex items-center gap-2 text-slate-400 dark:text-slate-600">
                <Grid2X2 className="size-3.5" />
                <RefreshCcw className="size-3.5" />
                <Maximize2 className="size-3.5" />
              </div>
            </div>

            <main className="relative min-w-0 overflow-hidden p-4">
              <div className="grid gap-4">
                <div className="rounded-xl border border-slate-200/70 bg-white/76 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold leading-none text-slate-950 dark:text-white">
                        运行概览
                      </div>
                      <div className="mt-2 max-w-[360px] text-[12px] leading-5 text-slate-500 dark:text-slate-500">
                        展示系统关键指标、运行状态和 mock 数据集。
                      </div>
                    </div>
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-3 text-[11px] text-slate-600 shadow-[0_1px_0_rgba(15,23,42,0.03)] dark:border-white/10 dark:bg-[#171a20] dark:text-slate-300"
                      type="button"
                    >
                      <Settings2 className="size-3.5" />
                      偏好设置
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {stats.map(item => (
                      <StatCard key={item.label} {...item} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-[1.25fr_0.85fr] gap-4">
                  <div className="rounded-xl border border-slate-200/70 bg-white/76 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-950 dark:text-white">
                          页面访问
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                          最近 12 小时
                        </div>
                      </div>
                      <span className="rounded-md bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-300">
                        +14.8%
                      </span>
                    </div>
                    <LineChart dark={isDark} />
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-xl border border-slate-200/70 bg-white/76 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-sm font-semibold text-slate-950 dark:text-white">
                        数据状态
                      </div>
                      <div className="mt-3 grid gap-2">
                        <StatusRow label="菜单权限" status="已接入" />
                        <StatusRow label="查询缓存" status="稳定" />
                        <StatusRow label="标签页" status="持久化" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-white/76 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                        <UserRoundCog className="size-4 text-blue-500" />
                        Root Admin
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                        <div className="h-full w-[72%] rounded-full bg-[linear-gradient(135deg,#1677ff,#6366f1)]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/76 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="grid grid-cols-[1fr_1.2fr_0.7fr] bg-slate-50/90 px-4 py-2 text-[11px] text-slate-500 dark:bg-white/[0.035] dark:text-slate-500">
                    <span>模块</span>
                    <span>最近操作</span>
                    <span>状态</span>
                  </div>
                  {tableRows.map(row => (
                    <div
                      className="grid grid-cols-[1fr_1.2fr_0.7fr] border-t border-slate-200/70 px-4 py-2 text-[11px] text-slate-600 dark:border-white/10 dark:text-slate-400"
                      key={row[1]}
                    >
                      <span>{row[0]}</span>
                      <span>{row[1]}</span>
                      <span className="text-blue-600 dark:text-blue-300">{row[2]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                aria-label="偏好设置"
                className="absolute top-1/2 right-0 grid size-8 -translate-y-1/2 place-items-center rounded-l-lg bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)]"
                type="button"
              >
                <Settings2 className="size-4" />
              </button>
            </main>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, tone, value }: { label: string; tone: string; value: string }) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
      : tone === 'violet'
        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
        : 'bg-blue-500/10 text-blue-600 dark:text-blue-300'

  return (
    <div className="rounded-lg border border-slate-200/70 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-black/10">
      <div className="text-[11px] text-slate-500 dark:text-slate-500">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-xl font-semibold leading-none text-slate-950 dark:text-white">
          {value}
        </span>
        <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', toneClass)}>
          live
        </span>
      </div>
    </div>
  )
}

function StatusRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-[11px] dark:border-white/10 dark:bg-black/10">
      <span className="text-slate-500 dark:text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{status}</span>
    </div>
  )
}

function LineChart({ dark }: { dark: boolean }) {
  const gridColor = dark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.24)'
  const areaId = dark ? 'loginPreviewLineAreaDark' : 'loginPreviewLineAreaLight'

  return (
    <svg aria-label="页面访问趋势" className="h-[118px] w-full" viewBox="0 0 360 132">
      {[28, 58, 88].map(y => (
        <line key={y} stroke={gridColor} strokeDasharray="4 8" x1="6" x2="354" y1={y} y2={y} />
      ))}
      <path
        d="M8 100 C34 96 42 70 66 72 C92 74 92 58 116 54 C146 48 152 78 176 74 C204 70 206 30 232 38 C258 46 250 96 278 96 C306 96 312 66 352 58"
        fill="none"
        stroke="#1677ff"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M8 100 C34 96 42 70 66 72 C92 74 92 58 116 54 C146 48 152 78 176 74 C204 70 206 30 232 38 C258 46 250 96 278 96 C306 96 312 66 352 58 L352 122 L8 122 Z"
        fill={`url(#${areaId})`}
      />
      <defs>
        <linearGradient id={areaId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1677ff" stopOpacity={dark ? '0.24' : '0.2'} />
          <stop offset="100%" stopColor="#1677ff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
