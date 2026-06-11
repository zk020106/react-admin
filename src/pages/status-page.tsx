import type { VariantProps } from 'class-variance-authority'
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Button, type buttonVariants } from '@/components/ui/button'

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>

export interface StatusPageAction {
  className?: string
  label: string
  onClick: () => void
  variant?: ButtonVariant
}

interface StatusPageProps {
  actions: StatusPageAction[]
  code: string
  dataSlot: string
  description: string
  detail?: ReactNode
  footerLinks?: string[]
  title: string
  tone?: 'danger' | 'neutral' | 'warning'
}

const toneClasses = {
  danger: {
    code: 'text-destructive/85',
    glow: 'bg-destructive/10'
  },
  neutral: {
    code: 'text-slate-800/85 dark:text-slate-100/80',
    glow: 'bg-slate-400/12 dark:bg-slate-300/10'
  },
  warning: {
    code: 'text-warning/90',
    glow: 'bg-warning/10'
  }
}

const defaultFooterLinks = ['常见问题', '联系我们', '帮助中心']

const statusPageBackgroundStyle = {
  backgroundImage:
    'radial-gradient(circle at 50% 36%, hsl(var(--background)) 0%, hsl(var(--background)) 34%, hsl(var(--muted) / 0.42) 68%, transparent 100%)'
} satisfies CSSProperties

const horizonMistStyle = {
  background:
    'linear-gradient(90deg, transparent 0%, hsl(var(--background) / 0.9) 20%, hsl(var(--background)) 50%, hsl(var(--background) / 0.9) 80%, transparent 100%)'
} satisfies CSSProperties

const lightBeamStyle = {
  background:
    'linear-gradient(180deg, hsl(var(--background) / 0.96) 0%, hsl(var(--background) / 0.72) 46%, hsl(var(--muted) / 0.14) 100%)',
  clipPath: 'polygon(50% 0, 100% 100%, 0 100%)'
} satisfies CSSProperties

const codeShadowStyle = {
  textShadow: '0 30px 38px hsl(var(--foreground) / 0.12), 0 8px 18px hsl(var(--foreground) / 0.1)'
} satisfies CSSProperties

export function StatusPage({
  actions,
  code,
  dataSlot,
  description,
  detail,
  footerLinks = defaultFooterLinks,
  title,
  tone = 'neutral'
}: StatusPageProps) {
  const styles = toneClasses[tone]

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center overflow-hidden bg-background px-4 py-14 text-center sm:px-6"
      data-slot={dataSlot}
      style={statusPageBackgroundStyle}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.18)_100%)]" />
      <div
        className={cn(
          'pointer-events-none absolute top-[33%] left-1/2 h-36 w-[min(44rem,82vw)] -translate-x-1/2 rounded-[50%] blur-3xl',
          styles.glow
        )}
      />
      <div
        className="pointer-events-none absolute top-[41%] left-1/2 h-52 w-[min(48rem,86vw)] -translate-x-1/2 opacity-80"
        style={lightBeamStyle}
      />
      <div
        className="pointer-events-none absolute top-[48%] left-1/2 h-24 w-[min(42rem,82vw)] -translate-x-1/2 blur-md"
        style={horizonMistStyle}
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
        <div className="relative grid w-full place-items-center pb-8 sm:pb-10">
          <div
            className={cn(
              'select-none text-[clamp(8rem,24vw,18rem)] font-semibold leading-[0.82]',
              styles.code
            )}
            style={codeShadowStyle}
          >
            {code}
          </div>
        </div>

        <div className="relative space-y-3">
          <h1 className="text-2xl font-medium text-foreground/80 sm:text-3xl">{title}</h1>
          <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>

        {detail ? (
          <div className="mt-7 w-full max-w-2xl overflow-hidden rounded-lg border bg-muted/30 p-3 text-left">
            {detail}
          </div>
        ) : null}

        <div className="mt-9 flex flex-wrap justify-center gap-2">
          {actions.map(action => (
            <Button
              className={cn(
                'h-11 min-w-44 rounded-md bg-slate-800 px-8 text-base text-white shadow-[0_14px_32px_hsl(var(--foreground)/0.14)] hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200',
                action.className
              )}
              key={action.label}
              onClick={action.onClick}
              type="button"
              variant={action.variant ?? 'default'}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {footerLinks.length > 0 ? (
        <nav
          aria-label="状态页辅助链接"
          className="relative z-10 flex flex-wrap items-center justify-center gap-5 pt-12 text-sm text-muted-foreground/55"
        >
          {footerLinks.map((link, index) => (
            <span className="flex items-center gap-5" key={link}>
              {index > 0 ? <span className="h-3 w-px bg-border" aria-hidden="true" /> : null}
              <button className="hover:text-foreground" type="button">
                {link}
              </button>
            </span>
          ))}
        </nav>
      ) : null}
    </section>
  )
}
