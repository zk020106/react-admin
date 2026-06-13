import { ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'
import { useStore } from 'zustand'

import { useSystemDark } from '@/hooks/use-system-dark'
import { preferenceStore } from '@/store/preferences'
import { resolveAdminPrimaryColor } from '@/theme'
import type { AdminPreferences } from '@/types/admin'

const ADMIN_TABLE_THEME_COMPONENTS: NonNullable<ThemeConfig['components']> = {
  Button: {
    controlHeight: 32,
    controlHeightSM: 28
  },
  Input: {
    controlHeight: 32,
    controlHeightSM: 28
  },
  Select: {
    controlHeight: 32,
    controlHeightSM: 28
  },
  Table: {
    borderColor: 'hsl(var(--border))',
    cellPaddingBlock: 12,
    cellPaddingInline: 12,
    colorBgContainer: 'hsl(var(--card))',
    colorText: 'hsl(var(--card-foreground))',
    headerBg: 'hsl(var(--card))',
    headerColor: 'hsl(var(--muted-foreground))',
    headerSplitColor: 'hsl(var(--border))',
    rowHoverBg: 'hsl(var(--accent))'
  },
  Tree: {
    colorBgContainer: 'hsl(var(--card))',
    directoryNodeSelectedBg: 'hsl(var(--accent))',
    directoryNodeSelectedColor: 'hsl(var(--accent-foreground))',
    nodeHoverBg: 'hsl(var(--accent))',
    nodeSelectedBg: 'hsl(var(--accent))'
  }
}

// 函数：toAntdColor。把空格分隔的 HSL 颜色转成逗号写法，保证 antd 颜色解析兼容。
function toAntdColor(color: string) {
  const match = color.match(/^hsl\(\s*([\d.]+)\s+([\d.]+%)\s+([\d.]+%)\s*\)$/)

  return match ? `hsl(${match[1]}, ${match[2]}, ${match[3]})` : color
}

/** 由偏好设置派生 antd 主题配置，保证内容区与壳的视觉一致。 */
export function buildAntdThemeConfig(preferences: AdminPreferences, dark: boolean): ThemeConfig {
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    components: ADMIN_TABLE_THEME_COMPONENTS,
    token: {
      borderRadius: Math.round(Number(preferences.themeRadius) * 16),
      colorError: toAntdColor(preferences.themeColorDestructive),
      colorPrimary: toAntdColor(
        resolveAdminPrimaryColor(
          {
            builtinType: preferences.themeBuiltinType,
            colorPrimary: preferences.themeColorPrimary
          },
          dark
        )
      ),
      colorSuccess: toAntdColor(preferences.themeColorSuccess),
      colorWarning: toAntdColor(preferences.themeColorWarning),
      fontSize: preferences.themeFontSize
    }
  }
}

/** 合并默认 antd 组件主题与页面级覆盖，后者同组件 token 优先。 */
export function mergeAntdThemeComponents(
  base: ThemeConfig['components'],
  override?: ThemeConfig['components']
) {
  if (!override) {
    return base
  }

  return Object.fromEntries(
    Object.entries({ ...base, ...override }).map(([component, tokens]) => [
      component,
      {
        ...base?.[component as keyof typeof base],
        ...tokens
      }
    ])
  ) as ThemeConfig['components']
}

// 函数：isDarkPreference。结合偏好设置与系统颜色方案判定暗色模式。
export function isDarkPreference(colorMode: AdminPreferences['colorMode'], systemDark: boolean) {
  return colorMode === 'dark' || (colorMode === 'system' && systemDark)
}

/** 内容区 antd 上下文：主题与语言跟随偏好设置。 */
export function AdminConfigProvider({
  children,
  components
}: {
  children: ReactNode
  components?: ThemeConfig['components']
}) {
  const preferences = useStore(preferenceStore, state => state.preferences)
  const systemDark = useSystemDark()
  const dark = isDarkPreference(preferences.colorMode, systemDark)
  const themeConfig = buildAntdThemeConfig(preferences, dark)

  return (
    <ConfigProvider
      locale={preferences.appLocale === 'en-US' ? enUS : zhCN}
      theme={
        components
          ? {
              ...themeConfig,
              components: mergeAntdThemeComponents(themeConfig.components, components)
            }
          : themeConfig
      }
    >
      {children}
    </ConfigProvider>
  )
}
