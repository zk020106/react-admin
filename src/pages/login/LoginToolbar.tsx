import { Tooltip } from 'antd'
import { ChevronDown, Globe2, PanelLeft } from 'lucide-react'

import { cn } from '@/lib/utils'
import { GithubMark } from './GithubMark'
import { ThemeToggle, type LoginThemeMode } from './ThemeToggle'

type LoginLanguage = 'en-US' | 'zh-CN'

interface LoginToolbarProps {
  compactLayout: boolean
  language: LoginLanguage
  onGithubClick: () => void
  onThemeToggle: () => void
  onToggleLanguage: () => void
  onToggleLayout: () => void
  themeMode: LoginThemeMode
}

const iconButtonClass =
  'inline-flex size-10 items-center justify-center rounded-full border border-slate-200/70 bg-white/55 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-md transition-all duration-[250ms] hover:-translate-y-px hover:bg-white/80 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-none dark:hover:bg-white/[0.11] dark:hover:text-white'

export function LoginToolbar({
  compactLayout,
  language,
  onGithubClick,
  onThemeToggle,
  onToggleLanguage,
  onToggleLayout,
  themeMode
}: LoginToolbarProps) {
  const languageLabel = language === 'zh-CN' ? '简体中文' : 'English'

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2">
      <Tooltip title="切换语言">
        <button
          aria-label="切换语言"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200/70 bg-white/55 px-3 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-md transition-all duration-[250ms] hover:-translate-y-px hover:bg-white/80 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-none dark:hover:bg-white/[0.11] dark:hover:text-white"
          onClick={onToggleLanguage}
          type="button"
        >
          <Globe2 className="size-[17px]" />
          <span className="hidden sm:inline">{languageLabel}</span>
          <ChevronDown className="size-3.5 opacity-70" />
        </button>
      </Tooltip>
      <Tooltip title={compactLayout ? '切换为舒展布局' : '切换为紧凑布局'}>
        <button
          aria-label={compactLayout ? '切换为舒展布局' : '切换为紧凑布局'}
          aria-pressed={compactLayout}
          className={cn(iconButtonClass, compactLayout && 'text-blue-600 dark:text-blue-300')}
          onClick={onToggleLayout}
          type="button"
        >
          <PanelLeft className="size-[18px]" />
        </button>
      </Tooltip>
      <ThemeToggle onToggle={onThemeToggle} themeMode={themeMode} />
      <Tooltip title="GitHub">
        <button
          aria-label="打开 GitHub"
          className={cn(iconButtonClass)}
          onClick={onGithubClick}
          type="button"
        >
          <GithubMark className="size-[18px]" />
        </button>
      </Tooltip>
    </div>
  )
}
