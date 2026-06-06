import { createStore } from "zustand/vanilla"

import type { TabRecord } from "./types"

export interface TabsStoreState {
  activeKey?: string
  closeAll: () => void
  closeLeft: (key: string) => void
  closeOthers: (key: string) => void
  closeRight: (key: string) => void
  closeTab: (key: string) => void
  openTab: (tab: TabRecord) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  setActiveKey: (key: string) => void
  tabs: TabRecord[]
  toggleAffix: (key: string) => void
}

function uniqueTabs(tabs: TabRecord[]) {
  return tabs.filter(
    (tab, index, source) => source.findIndex((item) => item.key === tab.key) === index,
  )
}

function nextActiveAfterClose(tabs: TabRecord[], closedIndex: number) {
  return tabs[closedIndex]?.key ?? tabs[closedIndex - 1]?.key ?? tabs[0]?.key
}

export function createTabsStore(initialTabs: TabRecord[] = []) {
  const normalized = uniqueTabs(initialTabs)

  return createStore<TabsStoreState>()((set, get) => ({
    activeKey: normalized[0]?.key,
    closeAll: () => {
      const affixTabs = get().tabs.filter((tab) => tab.affix)
      const tabs = affixTabs.length > 0 ? affixTabs : get().tabs.slice(0, 1)
      set({
        activeKey: tabs[0]?.key,
        tabs,
      })
    },
    closeLeft: (key) => {
      const current = get()
      const targetIndex = current.tabs.findIndex((tab) => tab.key === key)

      if (targetIndex <= 0) {
        return
      }

      const tabs = current.tabs.filter((tab, index) => tab.affix || index >= targetIndex)

      set({
        activeKey: tabs.some((tab) => tab.key === current.activeKey) ? current.activeKey : key,
        tabs,
      })
    },
    closeOthers: (key) => {
      const tabs = get().tabs.filter((tab) => tab.affix || tab.key === key)
      set({
        activeKey: tabs.some((tab) => tab.key === key) ? key : tabs[0]?.key,
        tabs,
      })
    },
    closeRight: (key) => {
      const current = get()
      const targetIndex = current.tabs.findIndex((tab) => tab.key === key)

      if (targetIndex < 0 || targetIndex >= current.tabs.length - 1) {
        return
      }

      const tabs = current.tabs.filter((tab, index) => tab.affix || index <= targetIndex)

      set({
        activeKey: tabs.some((tab) => tab.key === current.activeKey) ? current.activeKey : key,
        tabs,
      })
    },
    closeTab: (key) => {
      const current = get()
      const target = current.tabs.find((tab) => tab.key === key)

      if (!target || target.affix) {
        return
      }

      const closedIndex = current.tabs.findIndex((tab) => tab.key === key)
      const tabs = current.tabs.filter((tab) => tab.key !== key)

      set({
        activeKey:
          current.activeKey === key ? nextActiveAfterClose(tabs, closedIndex) : current.activeKey,
        tabs,
      })
    },
    openTab: (tab) => {
      const current = get()
      const exists = current.tabs.some((item) => item.key === tab.key)

      set({
        activeKey: tab.key,
        tabs: exists
          ? current.tabs.map((item) => (item.key === tab.key ? { ...item, ...tab } : item))
          : [...current.tabs, tab],
      })
    },
    reorderTabs: (fromIndex, toIndex) => {
      const tabs = [...get().tabs]

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= tabs.length ||
        toIndex >= tabs.length ||
        tabs[toIndex]?.affix
      ) {
        return
      }

      const [moving] = tabs.splice(fromIndex, 1)
      if (!moving) {
        return
      }
      tabs.splice(toIndex, 0, moving)
      set({ tabs })
    },
    setActiveKey: (key) => set({ activeKey: key }),
    tabs: normalized,
    toggleAffix: (key) => {
      set({
        tabs: get().tabs.map((tab) =>
          tab.key === key ? { ...tab, affix: !tab.affix } : tab,
        ),
      })
    },
  }))
}

export const tabsStore = createTabsStore([
  { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
])
