import { theme as antdTheme } from 'antd'
import { describe, expect, it } from 'vitest'

import { DEFAULT_PREFERENCES } from '@/store/preferences'
import {
  buildAntdThemeConfig,
  isDarkPreference,
  mergeAntdThemeComponents
} from '@/theme/antd-theme'

describe('antd theme bridge', () => {
  it('maps preference radius and font size to antd tokens', () => {
    const config = buildAntdThemeConfig({ ...DEFAULT_PREFERENCES, themeRadius: '0.5' }, false)

    expect(config.token?.borderRadius).toBe(8)
    expect(config.token?.fontSize).toBe(DEFAULT_PREFERENCES.themeFontSize)
  })

  it('switches algorithm by dark mode', () => {
    expect(buildAntdThemeConfig(DEFAULT_PREFERENCES, true).algorithm).toBe(antdTheme.darkAlgorithm)
    expect(buildAntdThemeConfig(DEFAULT_PREFERENCES, false).algorithm).toBe(
      antdTheme.defaultAlgorithm
    )
  })

  it('normalizes space-separated hsl colors for antd parsing', () => {
    const config = buildAntdThemeConfig(DEFAULT_PREFERENCES, false)

    // 默认主题主色 hsl(212 100% 45%) 需转为逗号写法。
    expect(config.token?.colorPrimary).toBe('hsl(212, 100%, 45%)')
    expect(config.token?.colorSuccess).toBe('hsl(144, 57%, 58%)')
  })

  it('passes custom primary colors through for the custom builtin theme', () => {
    const config = buildAntdThemeConfig(
      {
        ...DEFAULT_PREFERENCES,
        themeBuiltinType: 'custom',
        themeColorPrimary: '#ff5500'
      },
      false
    )

    expect(config.token?.colorPrimary).toBe('#ff5500')
  })

  it('maps antd table tokens to admin theme variables', () => {
    const config = buildAntdThemeConfig(DEFAULT_PREFERENCES, false)

    expect(config.components?.Table).toMatchObject({
      borderColor: 'hsl(var(--border))',
      headerBg: 'hsl(var(--muted) / 0.5)',
      headerColor: 'hsl(var(--foreground))',
      rowHoverBg: 'hsl(var(--muted) / 0.5)'
    })
  })

  it('keeps default table tokens when component overrides are merged', () => {
    const config = buildAntdThemeConfig(DEFAULT_PREFERENCES, false)

    expect(
      mergeAntdThemeComponents(config.components, {
        Button: {
          borderRadius: 12
        }
      })
    ).toMatchObject({
      Button: {
        borderRadius: 12
      },
      Table: {
        borderColor: 'hsl(var(--border))',
        headerBg: 'hsl(var(--muted) / 0.5)'
      }
    })
  })

  it('resolves dark preference from explicit and system modes', () => {
    expect(isDarkPreference('dark', false)).toBe(true)
    expect(isDarkPreference('light', true)).toBe(false)
    expect(isDarkPreference('system', true)).toBe(true)
    expect(isDarkPreference('system', false)).toBe(false)
  })
})
