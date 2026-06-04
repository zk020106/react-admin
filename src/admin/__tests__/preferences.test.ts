import { describe, expect, it } from "vitest"

import { createPreferenceStore, DEFAULT_PREFERENCES } from "../preferences"

describe("admin preferences", () => {
  it("starts with vben-like defaults and clamps numeric layout values", () => {
    const store = createPreferenceStore({
      contentPadding: -20,
      layout: "header-nav",
      sidebarWidth: 640,
    })

    expect(store.getState().preferences).toEqual(
      expect.objectContaining({
        ...DEFAULT_PREFERENCES,
        contentPadding: 0,
        layout: "header-nav",
        sidebarWidth: 360,
      }),
    )
  })

  it("updates and resets preferences through a zustand store", () => {
    const store = createPreferenceStore()

    store.getState().setPreferences({
      colorMode: "dark",
      sidebarCollapsed: true,
      tabbarEnable: false,
    })

    expect(store.getState().preferences).toEqual(
      expect.objectContaining({
        colorMode: "dark",
        sidebarCollapsed: true,
        tabbarEnable: false,
      }),
    )

    store.getState().resetPreferences()

    expect(store.getState().preferences).toEqual(DEFAULT_PREFERENCES)
  })
})
