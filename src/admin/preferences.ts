import { createStore } from "zustand/vanilla"

import type { AdminPreferences, LayoutMode } from "./types"

export const DEFAULT_PREFERENCES: AdminPreferences = {
  animationEnable: true,
  breadcrumbEnable: true,
  colorMode: "dark",
  contentCompact: "wide",
  contentCompactWidth: 1200,
  contentPadding: 16,
  footerEnable: false,
  headerHeight: 48,
  headerVisible: true,
  layout: "sidebar-nav",
  sidebarCollapsed: false,
  sidebarTheme: "dark",
  sidebarWidth: 248,
  tabbarEnable: true,
  tabbarHeight: 36,
  themeBuiltinType: "default",
  themeColorDestructive: "hsl(348 100% 61%)",
  themeColorPrimary: "hsl(212 100% 45%)",
  themeColorSuccess: "hsl(144 57% 58%)",
  themeColorWarning: "hsl(42 84% 61%)",
  themeFontSize: 16,
  themeRadius: "0.5",
}

const LAYOUTS = new Set<LayoutMode>([
  "full-content",
  "header-mixed-nav",
  "header-nav",
  "mixed-nav",
  "sidebar-mixed-nav",
  "sidebar-nav",
])

export interface PreferenceStoreState {
  preferences: AdminPreferences
  resetPreferences: () => void
  setPreferences: (
    updater:
      | ((preferences: AdminPreferences) => Partial<AdminPreferences>)
      | Partial<AdminPreferences>,
  ) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function normalizePreferences(
  next: Partial<AdminPreferences> = {},
  base: AdminPreferences = DEFAULT_PREFERENCES,
): AdminPreferences {
  const merged = { ...base, ...next }

  return {
    ...merged,
    contentCompactWidth: clamp(merged.contentCompactWidth, 960, 1680),
    contentPadding: clamp(merged.contentPadding, 0, 48),
    headerHeight: clamp(merged.headerHeight, 40, 80),
    layout: LAYOUTS.has(merged.layout) ? merged.layout : DEFAULT_PREFERENCES.layout,
    sidebarWidth: clamp(merged.sidebarWidth, 180, 360),
    tabbarHeight: clamp(merged.tabbarHeight, 28, 56),
    themeFontSize: clamp(merged.themeFontSize, 12, 20),
    themeRadius: String(clamp(Number(merged.themeRadius), 0, 1.5)),
  }
}

export function createPreferenceStore(initial?: Partial<AdminPreferences>) {
  return createStore<PreferenceStoreState>()((set, get) => ({
    preferences: normalizePreferences(initial),
    resetPreferences: () => set({ preferences: DEFAULT_PREFERENCES }),
    setPreferences: (updater) => {
      const current = get().preferences
      const patch = typeof updater === "function" ? updater(current) : updater

      set({ preferences: normalizePreferences(patch, current) })
    },
  }))
}

export const preferenceStore = createPreferenceStore()
