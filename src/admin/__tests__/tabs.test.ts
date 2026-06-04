import { describe, expect, it } from "vitest"

import { createTabsStore } from "../tabs"

describe("tabs store", () => {
  it("adds unique tabs and falls back to the nearest tab when closing the active tab", () => {
    const store = createTabsStore([
      { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
    ])

    store.getState().openTab({ key: "/system/users", path: "/system/users", title: "Users" })
    store.getState().openTab({ key: "/system/roles", path: "/system/roles", title: "Roles" })
    store.getState().openTab({ key: "/system/users", path: "/system/users", title: "Users" })

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual([
      "/dashboard",
      "/system/users",
      "/system/roles",
    ])
    expect(store.getState().activeKey).toBe("/system/users")

    store.getState().closeTab("/system/users")

    expect(store.getState().activeKey).toBe("/system/roles")
    expect(store.getState().tabs.map((tab) => tab.key)).toEqual([
      "/dashboard",
      "/system/roles",
    ])
  })

  it("keeps affix tabs when closing others and can reorder non-affix tabs", () => {
    const store = createTabsStore([
      { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
      { key: "/system/users", path: "/system/users", title: "Users" },
      { key: "/system/roles", path: "/system/roles", title: "Roles" },
    ])

    store.getState().closeOthers("/system/roles")

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual([
      "/dashboard",
      "/system/roles",
    ])

    store.getState().openTab({ key: "/workplace", path: "/workplace", title: "Workplace" })
    store.getState().reorderTabs(2, 1)

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual([
      "/dashboard",
      "/workplace",
      "/system/roles",
    ])
  })
})
