import type { ReactNode } from "react"

export type LayoutMode =
  | "full-content"
  | "header-mixed-nav"
  | "header-nav"
  | "mixed-nav"
  | "sidebar-mixed-nav"
  | "sidebar-nav"

export type ColorMode = "dark" | "light" | "system"
export type ContentCompact = "compact" | "wide"
export type ThemeMode = "dark" | "light"
export type BuiltinThemeType =
  | "custom"
  | "deep-blue"
  | "deep-green"
  | "default"
  | "gray"
  | "green"
  | "neutral"
  | "orange"
  | "pink"
  | "rose"
  | "sky-blue"
  | "slate"
  | "violet"
  | "yellow"
  | "zinc"

export interface AdminPreferences {
  animationEnable: boolean
  breadcrumbEnable: boolean
  colorMode: ColorMode
  contentCompact: ContentCompact
  contentCompactWidth: number
  contentPadding: number
  footerEnable: boolean
  headerHeight: number
  headerVisible: boolean
  layout: LayoutMode
  sidebarCollapsed: boolean
  sidebarTheme: ThemeMode
  sidebarWidth: number
  tabbarEnable: boolean
  tabbarHeight: number
  themeBuiltinType: BuiltinThemeType
  themeColorDestructive: string
  themeColorPrimary: string
  themeColorSuccess: string
  themeColorWarning: string
  themeFontSize: number
  themeRadius: string
}

export interface MenuRecord {
  badge?: string
  children?: MenuRecord[]
  disabled?: boolean
  icon?: string
  key: string
  path: string
  title: string
}

export interface TabRecord {
  affix?: boolean
  badge?: string
  icon?: string
  key: string
  path: string
  title: string
}

export type FormComponentType =
  | "checkbox"
  | "date-range"
  | "input"
  | "password"
  | "pin"
  | "select"
  | "switch"
  | (string & {})

export type FormValueFormat = (
  value: unknown,
  setValue: (fieldName: string, value: unknown) => void,
  values: Record<string, unknown>,
) => unknown

export interface FormSchema {
  component: FormComponentType
  componentProps?: Record<string, unknown>
  defaultValue?: unknown
  fieldName: string
  label?: ReactNode
  rules?: unknown
  valueFormat?: FormValueFormat
}

export type FieldMappingFormatter =
  | ((value: unknown, fieldName: string) => unknown)
  | [string, string]
  | null
  | string

export type FieldMappingTime = [string, [string, string], FieldMappingFormatter?][]

export type ArrayToStringFields = Array<[string[], string?] | string>
