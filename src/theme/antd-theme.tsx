import { ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'
import { useStore } from 'zustand'

import { useSystemDark } from '@/hooks/use-system-dark'
import { preferenceStore } from '@/store/preferences'
import { resolveAdminPrimaryColor } from '@/theme'
import type { AdminPreferences } from '@/types/admin'

// 函数：toAntdColor。把空格分隔的 HSL 颜色转成逗号写法，保证 antd 颜色解析兼容。
function toAntdColor(color: string) {
  const match = color.match(/^hsl\(\s*([\d.]+)\s+([\d.]+%)\s+([\d.]+%)\s*\)$/)

  return match ? `hsl(${match[1]}, ${match[2]}, ${match[3]})` : color
}

/** 由偏好设置派生 antd 主题配置，保证内容区与壳的视觉一致。 */
export function buildAntdThemeConfig(preferences: AdminPreferences, dark: boolean): ThemeConfig {
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
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
      theme={components ? { ...themeConfig, components } : themeConfig}
    >
      {children}
    </ConfigProvider>
  )
}
