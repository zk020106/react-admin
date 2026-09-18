import { TinyColor } from '@ctrl/tinycolor'

export type BuiltinThemeType =
  | 'custom'
  | 'cyber-blue'
  | 'deep-blue'
  | 'deep-green'
  | 'default'
  | 'gray'
  | 'green'
  | 'neutral'
  | 'orange'
  | 'pink'
  | 'rose'
  | 'sky-blue'
  | 'slate'
  | 'violet'
  | 'yellow'
  | 'zinc'

export type AdminThemeMode = 'auto' | 'dark' | 'light'

export interface BuiltinThemePreset {
  color: string
  darkPrimaryColor?: string
  primaryColor?: string
  type: BuiltinThemeType
}

export interface AdminThemeOptions {
  builtinType: BuiltinThemeType
  colorDestructive?: string
  colorPrimary?: string
  colorSuccess?: string
  colorWarning?: string
  fontSize: number
  mode: AdminThemeMode
  radius: string
  semiDarkHeader?: boolean
  semiDarkSidebar?: boolean
  semiDarkSidebarSub?: boolean
}

export const BUILT_IN_THEME_PRESETS: BuiltinThemePreset[] = [
  { color: 'hsl(212 100% 45%)', type: 'default' },
  {
    color: '#07bdfd',
    darkPrimaryColor: '#07bdfd',
    primaryColor: '#006be6',
    type: 'cyber-blue'
  },
  { color: 'hsl(245 82% 67%)', type: 'violet' },
  { color: 'hsl(347 77% 60%)', type: 'pink' },
  { color: 'hsl(42 84% 61%)', type: 'yellow' },
  { color: 'hsl(231 98% 65%)', type: 'sky-blue' },
  { color: 'hsl(161 90% 43%)', type: 'green' },
  {
    color: 'hsl(240 5% 26%)',
    darkPrimaryColor: 'hsl(0 0% 98%)',
    primaryColor: 'hsl(240 5.9% 10%)',
    type: 'zinc'
  },
  { color: 'hsl(181 84% 32%)', type: 'deep-green' },
  { color: 'hsl(211 91% 39%)', type: 'deep-blue' },
  { color: 'hsl(18 89% 40%)', type: 'orange' },
  { color: 'hsl(0 75% 42%)', type: 'rose' },
  {
    color: 'hsl(0 0% 25%)',
    darkPrimaryColor: 'hsl(0 0% 98%)',
    primaryColor: 'hsl(240 5.9% 10%)',
    type: 'neutral'
  },
  {
    color: 'hsl(215 25% 27%)',
    darkPrimaryColor: 'hsl(0 0% 98%)',
    primaryColor: 'hsl(240 5.9% 10%)',
    type: 'slate'
  },
  {
    color: 'hsl(217 19% 27%)',
    darkPrimaryColor: 'hsl(0 0% 98%)',
    primaryColor: 'hsl(240 5.9% 10%)',
    type: 'gray'
  },
  { color: '', type: 'custom' }
]

// 函数：isDarkTheme。根据主题模式判断当前是否应使用暗色主题。
export function isDarkTheme(mode: AdminThemeMode) {
  if (mode === 'auto') {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  return mode === 'dark'
}

/**
 * 解析并生成 Semi Design 全套圆角 CSS 变量映射。
 *
 * Semi Design 组件圆角消费约定：
 * - small: Button (按钮)、Input (输入框)、Select (选择器)、Tag (标签)、ButtonGroup
 * - extra-small: 微型指示器、微型标签
 * - medium: Card (卡片)、Dropdown (下拉菜单)、Tooltip (文字提示)、Popover (气泡卡片)
 * - large: Modal (弹窗内容区)、SideSheet (抽屉)
 *
 * @param radiusRem - 主题配置中的圆角字符串（如 '0', '0.25', '0.5', '0.75', '1'）
 */
export function resolveSemiRadiusTokens(radiusRem: string): Record<string, string> {
  const r = parseFloat(radiusRem)
  if (r === 0) {
    return {
      '--semi-border-radius-extra-small': '0px',
      '--semi-border-radius-small': '0px',
      '--semi-border-radius-medium': '0px',
      '--semi-border-radius-large': '0px'
    }
  }

  return {
    '--semi-border-radius-extra-small': `calc(${radiusRem}rem * 0.5)`,
    '--semi-border-radius-small': `${radiusRem}rem`,
    '--semi-border-radius-medium': `calc(${radiusRem}rem * 1.25)`,
    '--semi-border-radius-large': `calc(${radiusRem}rem * 1.75)`
  }
}

/**
 * 解析并生成 Semi Design 完整的状态色阶与交互色彩 Token。
 */
export function resolveSemiColorTokens(
  options: AdminThemeOptions,
  primaryColorHex: string,
  dark: boolean
): Record<string, string> {
  const primary = new TinyColor(primaryColorHex)
  const hexPrimary = primary.toHexString()

  const hoverColor = dark ? primary.lighten(8).toHexString() : primary.darken(6).toHexString()
  const activeColor = dark ? primary.lighten(15).toHexString() : primary.darken(12).toHexString()
  const disabledColor = dark
    ? primary.setAlpha(0.35).toRgbString()
    : primary.lighten(30).toHexString()
  const lightDefaultColor = primary.setAlpha(dark ? 0.18 : 0.1).toRgbString()
  const lightHoverColor = primary.setAlpha(dark ? 0.28 : 0.2).toRgbString()
  const lightActiveColor = primary.setAlpha(dark ? 0.38 : 0.3).toRgbString()

  const tokens: Record<string, string> = {
    '--semi-color-primary': hexPrimary,
    '--semi-color-primary-hover': hoverColor,
    '--semi-color-primary-active': activeColor,
    '--semi-color-primary-disabled': disabledColor,
    '--semi-color-primary-light-default': lightDefaultColor,
    '--semi-color-primary-light-hover': lightHoverColor,
    '--semi-color-primary-light-active': lightActiveColor,
    '--semi-color-focus-border': hexPrimary,
    '--semi-color-link': hexPrimary,
    '--semi-color-link-hover': hoverColor,
    '--semi-color-link-active': activeColor
  }

  if (options.colorSuccess) {
    const success = new TinyColor(options.colorSuccess)
    tokens['--semi-color-success'] = success.toHexString()
    tokens['--semi-color-success-hover'] = success.darken(6).toHexString()
    tokens['--semi-color-success-active'] = success.darken(12).toHexString()
    tokens['--semi-color-success-light-default'] = success.setAlpha(dark ? 0.18 : 0.1).toRgbString()
  }

  if (options.colorWarning) {
    const warning = new TinyColor(options.colorWarning)
    tokens['--semi-color-warning'] = warning.toHexString()
    tokens['--semi-color-warning-hover'] = warning.darken(6).toHexString()
    tokens['--semi-color-warning-active'] = warning.darken(12).toHexString()
    tokens['--semi-color-warning-light-default'] = warning.setAlpha(dark ? 0.18 : 0.1).toRgbString()
  }

  if (options.colorDestructive) {
    const danger = new TinyColor(options.colorDestructive)
    tokens['--semi-color-danger'] = danger.toHexString()
    tokens['--semi-color-danger-hover'] = danger.darken(6).toHexString()
    tokens['--semi-color-danger-active'] = danger.darken(12).toHexString()
    tokens['--semi-color-danger-light-default'] = danger.setAlpha(dark ? 0.18 : 0.1).toRgbString()
  }

  return tokens
}

// 函数：applyAdminTheme。把主题配置同步到根节点 class、data-theme 和 CSS 变量。
export function applyAdminTheme(options: AdminThemeOptions) {
  const root = document.documentElement
  const body = typeof document !== 'undefined' ? document.body : undefined
  const dark = isDarkTheme(options.mode)

  // 同步 class、data-theme 和 CSS 变量，确保 Tailwind、Semi 与自定义样式一致。
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)
  root.dataset.theme = options.builtinType
  root.style.setProperty('--radius', `${options.radius}rem`)
  root.style.setProperty('--font-size-base', `${options.fontSize}px`)
  root.style.setProperty('--menu-font-size', `calc(${options.fontSize}px * 0.875)`)

  // 同步 Semi Design 的明暗主题模式
  if (body) {
    if (dark) {
      body.setAttribute('theme-mode', 'dark')
    } else {
      body.removeAttribute('theme-mode')
    }
  }

  const primary = resolvePrimaryColor(options, dark)
  const hexPrimary = new TinyColor(primary).toHexString()

  // 解析并同步 Semi Design 全套圆角与色彩 Token
  const semiRadiusTokens = resolveSemiRadiusTokens(options.radius)
  const semiColorTokens = resolveSemiColorTokens(options, hexPrimary, dark)
  const allSemiTokens = {
    ...semiRadiusTokens,
    ...semiColorTokens
  }

  // 同步应用到 document.documentElement 及 document.body（针对挂载在 body 上的 Portal / Modal / Tooltip）
  Object.entries(allSemiTokens).forEach(([name, value]) => {
    root.style.setProperty(name, value)
    if (body) {
      body.style.setProperty(name, value)
    }
  })

  const colorVariables = {
    '--destructive': toHslCssVar(options.colorDestructive ?? 'hsl(348 100% 61%)'),
    '--primary': toHslCssVar(primary),
    ...resolveSurfaceVariables(dark, options),
    '--success': toHslCssVar(options.colorSuccess ?? 'hsl(144 57% 58%)'),
    '--warning': toHslCssVar(options.colorWarning ?? 'hsl(42 84% 61%)')
  }

  Object.entries(colorVariables).forEach(([name, value]) => {
    root.style.setProperty(name, value)
  })
  updateCSSVariables(
    {
      ...colorVariables,
      ...allSemiTokens
    },
    '__admin-theme-styles__',
    ':root, body, body[theme-mode="dark"]'
  )
}

// 函数：resolveSurfaceVariables。根据暗色和半深色配置生成表面变量。
function resolveSurfaceVariables(dark: boolean, options: AdminThemeOptions) {
  // 半深色开关允许顶栏/侧栏独立使用深色表面，内容区保持浅色。
  const headerDark = dark || options.semiDarkHeader
  const sidebarDark = dark || options.semiDarkSidebar
  const sidebarSubDark = dark || options.semiDarkSidebarSub
  const sidebarVariables = sidebarDark ? darkSidebarVariables() : lightSidebarVariables()
  const sidebarSubVariables = sidebarSubDark
    ? darkSidebarSubVariables()
    : lightSidebarSubVariables()

  return {
    '--header': headerDark ? '222.34deg 10.43% 12.27%' : '0 0% 100%',
    '--header-foreground': headerDark ? '0 0% 95%' : '210 6% 21%',
    '--menu': sidebarVariables['--sidebar'],
    ...sidebarVariables,
    ...sidebarSubVariables
  }
}

// 函数：darkSidebarVariables。返回暗色侧边栏的 CSS 变量。
function darkSidebarVariables() {
  return {
    '--sidebar': '222.34deg 10.43% 12.27%',
    '--sidebar-accent': '216 5% 19%',
    '--sidebar-accent-foreground': '0 0% 98%',
    '--sidebar-active': '216 5% 19%',
    '--sidebar-active-foreground': '0 0% 95%',
    '--sidebar-active-indicator': '0 0% 95%',
    '--sidebar-border': '240 3.7% 22%',
    '--sidebar-foreground': '0 0% 78%',
    '--sidebar-hover': '216 5% 24%',
    '--sidebar-hover-foreground': '0 0% 95%'
  }
}

// 函数：lightSidebarVariables。返回亮色侧边栏的 CSS 变量。
function lightSidebarVariables() {
  return {
    '--sidebar': '0 0% 100%',
    '--sidebar-accent': '240 5% 96%',
    '--sidebar-accent-foreground': '240 6% 10%',
    '--sidebar-active': 'var(--primary) / 15%',
    '--sidebar-active-foreground': 'var(--primary)',
    '--sidebar-active-indicator': 'var(--primary)',
    '--sidebar-border': '240 5.9% 90%',
    '--sidebar-foreground': '210 6% 21%',
    '--sidebar-hover': '240 5% 96%',
    '--sidebar-hover-foreground': '210 6% 21%'
  }
}

// 函数：darkSidebarSubVariables。返回暗色二级侧边栏的 CSS 变量。
function darkSidebarSubVariables() {
  return {
    '--sidebar-sub': '222.34deg 10.43% 12.27%',
    '--sidebar-deep': '220deg 13.06% 9%'
  }
}

// 函数：lightSidebarSubVariables。返回亮色二级侧边栏的 CSS 变量。
function lightSidebarSubVariables() {
  return {
    '--sidebar-sub': '0 0% 100%',
    '--sidebar-deep': '0 0% 100%'
  }
}

// 函数：resolvePrimaryColor。根据内置主题和明暗模式选择主色。
function resolvePrimaryColor(
  options: Pick<AdminThemeOptions, 'builtinType' | 'colorPrimary'>,
  dark: boolean
) {
  if (options.builtinType === 'custom') {
    return options.colorPrimary ?? 'hsl(212 100% 45%)'
  }

  const preset = BUILT_IN_THEME_PRESETS.find(item => item.type === options.builtinType)

  if (!preset) {
    return options.colorPrimary ?? 'hsl(212 100% 45%)'
  }

  return (dark ? preset.darkPrimaryColor : preset.primaryColor) || preset.color
}

// 函数：resolveAdminPrimaryColor。按偏好设置和明暗模式解析当前主色。
export function resolveAdminPrimaryColor(
  options: Pick<AdminThemeOptions, 'builtinType' | 'colorPrimary'>,
  dark: boolean
) {
  return resolvePrimaryColor(options, dark)
}

// 函数：toHslCssVar。把颜色值转换成 CSS 变量使用的 HSL 通道。
function toHslCssVar(color: string) {
  const hslMatch = color.match(/^hsl\((.*)\)$/)

  if (hslMatch?.[1]) {
    return hslMatch[1].trim()
  }

  // 主题变量只存储 HSL 通道，存在透明度时再追加 alpha。
  const { a, h, l, s } = new TinyColor(color).toHsl()
  const hsl = `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`

  return a < 1 ? `${hsl} / ${a}` : hsl
}

// 函数：updateCSSVariables。生成样式标签，暴露可被读取的 CSS 变量规则。
function updateCSSVariables(
  variables: Record<string, string>,
  id = '__admin-theme-styles__',
  selector = ':root'
) {
  // 样式标签同步内联变量，供读取样式规则的消费方使用。
  const styleElement =
    document.querySelector<HTMLStyleElement>(`#${id}`) ?? document.createElement('style')

  styleElement.id = id
  styleElement.textContent = `${selector} {${Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('')}}`

  if (!styleElement.parentElement) {
    document.head.append(styleElement)
  }
}
