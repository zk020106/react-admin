import type { ReactNode } from "react";

export type LayoutMode =
  | "full-content"
  | "header-mixed-nav"
  | "header-nav"
  | "header-sidebar-nav"
  | "mixed-nav"
  | "sidebar-mixed-nav"
  | "sidebar-nav";

export type ColorMode = "dark" | "light" | "system";
export type ContentCompact = "compact" | "wide";
export type HeaderMenuAlign = "center" | "end" | "start";
export type HeaderMode = "auto" | "auto-scroll" | "fixed" | "static";
export type NavigationStyleType = "plain" | "rounded";
export type PreferencesButtonPosition = "auto" | "fixed" | "header" | "user-dropdown";
export type TransitionName = "fade" | "fade-down" | "fade-slide" | "fade-up";
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
  | "zinc";

export interface AdminPreferences {
  animationEnable: boolean;
  appDynamicTitle: boolean;
  appEnableCheckUpdates: boolean;
  appEnableCopyPreferences: boolean;
  appEnableStickyPreferencesNavigationBar: boolean;
  appLocale: string;
  appPreferencesButtonPosition: PreferencesButtonPosition;
  appTimezone: string;
  appWatermark: boolean;
  appWatermarkContent: string;
  colorGrayMode: boolean;
  colorWeakMode: boolean;
  breadcrumbEnable: boolean;
  breadcrumbHideOnlyOne: boolean;
  breadcrumbShowHome: boolean;
  breadcrumbShowIcon: boolean;
  breadcrumbStyleType: "background" | "normal";
  colorMode: ColorMode;
  contentCompact: ContentCompact;
  contentCompactWidth: number;
  contentPadding: number;
  copyrightCompanyName: string;
  copyrightCompanySiteLink: string;
  copyrightDate: string;
  copyrightEnable: boolean;
  copyrightIcp: string;
  copyrightIcpLink: string;
  footerEnable: boolean;
  footerFixed: boolean;
  headerHeight: number;
  headerMenuAlign: HeaderMenuAlign;
  headerMode: HeaderMode;
  headerVisible: boolean;
  layout: LayoutMode;
  navigationAccordion: boolean;
  navigationSplit: boolean;
  navigationStyleType: NavigationStyleType;
  shortcutKeysEnable: boolean;
  shortcutKeysGlobalEscape: boolean;
  shortcutKeysGlobalLockScreen: boolean;
  shortcutKeysGlobalLogout: boolean;
  shortcutKeysGlobalSearch: boolean;
  sidebarAutoActivateChild: boolean;
  sidebarCollapsed: boolean;
  sidebarCollapsedButton: boolean;
  sidebarCollapsedShowTitle: boolean;
  sidebarDraggable: boolean;
  sidebarEnable: boolean;
  sidebarExtraCollapsed: boolean;
  sidebarExpandOnHover: boolean;
  sidebarFixedButton: boolean;
  sidebarHidden: boolean;
  sidebarMixedWidth: number;
  sidebarWidth: number;
  tabbarEnable: boolean;
  tabbarDraggable: boolean;
  tabbarHeight: number;
  tabbarMaxCount: number;
  tabbarMiddleClickToClose: boolean;
  tabbarPersist: boolean;
  tabbarShowIcon: boolean;
  tabbarShowMaximize: boolean;
  tabbarShowMore: boolean;
  tabbarShowRefresh: boolean;
  tabbarStyleType: "brisk" | "card" | "chrome" | "plain";
  tabbarVisitHistory: boolean;
  tabbarWheelable: boolean;
  themeBuiltinType: BuiltinThemeType;
  themeColorDestructive: string;
  themeColorPrimary: string;
  themeColorSuccess: string;
  themeColorWarning: string;
  themeFontSize: number;
  themeRadius: string;
  themeSemiDarkHeader: boolean;
  themeSemiDarkSidebar: boolean;
  themeSemiDarkSidebarSub: boolean;
  transitionEnable: boolean;
  transitionLoading: boolean;
  transitionName: TransitionName;
  transitionProgress: boolean;
  widgetFullscreen: boolean;
  widgetGlobalSearch: boolean;
  widgetLanguageToggle: boolean;
  widgetLockScreen: boolean;
  widgetNotification: boolean;
  widgetRefresh: boolean;
  widgetSidebarToggle: boolean;
  widgetThemeToggle: boolean;
  widgetTimezone: boolean;
}

export interface MenuRecord {
  badge?: string;
  children?: MenuRecord[];
  disabled?: boolean;
  icon?: string;
  key: string;
  path: string;
  title: string;
}

export interface TabRecord {
  affix?: boolean;
  badge?: string;
  icon?: string;
  key: string;
  path: string;
  title: string;
}

export type FormComponentType =
  | "checkbox"
  | "date-range"
  | "input"
  | "password"
  | "pin"
  | "select"
  | "switch"
  | (string & {});

export type FormValueFormat = (
  value: unknown,
  setValue: (fieldName: string, value: unknown) => void,
  values: Record<string, unknown>,
) => unknown;

export interface FormSchema {
  component: FormComponentType;
  componentProps?: Record<string, unknown>;
  defaultValue?: unknown;
  fieldName: string;
  label?: ReactNode;
  rules?: unknown;
  valueFormat?: FormValueFormat;
}

export type FieldMappingFormatter =
  | ((value: unknown, fieldName: string) => unknown)
  | [string, string]
  | null
  | string;

export type FieldMappingTime = [string, [string, string], FieldMappingFormatter?][];

export type ArrayToStringFields = Array<[string[], string?] | string>;
