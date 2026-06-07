import { createStore } from "zustand/vanilla";

import type { TabRecord } from "@/types/admin";

export interface TabsStoreState {
  activeKey?: string;
  // 方法：closeAll。关闭所有可关闭标签并保留固定标签。
  closeAll: () => void;
  // 方法：closeLeft。关闭指定标签左侧的可关闭标签。
  closeLeft: (key: string) => void;
  // 方法：closeOthers。关闭指定标签之外的可关闭标签。
  closeOthers: (key: string) => void;
  // 方法：closeRight。关闭指定标签右侧的可关闭标签。
  closeRight: (key: string) => void;
  // 方法：closeTab。关闭单个非固定标签。
  closeTab: (key: string) => void;
  // 方法：openTab。打开或刷新一个标签页。
  openTab: (tab: TabRecord) => void;
  // 方法：reorderTabs。按拖拽位置重排标签页。
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  // 方法：setActiveKey。切换当前激活标签。
  setActiveKey: (key: string) => void;
  tabs: TabRecord[];
  // 方法：toggleAffix。切换标签的固定状态。
  toggleAffix: (key: string) => void;
}

// 函数：uniqueTabs。移除重复标签并保留首次出现的顺序。
function uniqueTabs(tabs: TabRecord[]) {
  // 恢复数据存在重复标签时保留第一项，保证顺序稳定。
  return tabs.filter(
    (tab, index, source) => source.findIndex((item) => item.key === tab.key) === index,
  );
}

// 函数：nextActiveAfterClose。计算关闭标签后的下一个激活标签。
function nextActiveAfterClose(tabs: TabRecord[], closedIndex: number) {
  // 关闭标签后优先激活右侧标签，再回退到左侧，贴近浏览器行为。
  return tabs[closedIndex]?.key ?? tabs[closedIndex - 1]?.key ?? tabs[0]?.key;
}

// 函数：createTabsStore。创建标签页状态仓库并注入初始标签。
export function createTabsStore(initialTabs: TabRecord[] = []) {
  const normalized = uniqueTabs(initialTabs);

  return createStore<TabsStoreState>()((set, get) => ({
    activeKey: normalized[0]?.key,
    closeAll: () => {
      const affixTabs = get().tabs.filter((tab) => tab.affix);
      // 至少保留一个标签，确保外壳始终有确定的激活路由。
      const tabs = affixTabs.length > 0 ? affixTabs : get().tabs.slice(0, 1);
      set({
        activeKey: tabs[0]?.key,
        tabs,
      });
    },
    closeLeft: (key) => {
      const current = get();
      const targetIndex = current.tabs.findIndex((tab) => tab.key === key);

      if (targetIndex <= 0) {
        return;
      }

      const tabs = current.tabs.filter((tab, index) => tab.affix || index >= targetIndex);

      set({
        activeKey: tabs.some((tab) => tab.key === current.activeKey) ? current.activeKey : key,
        tabs,
      });
    },
    closeOthers: (key) => {
      const tabs = get().tabs.filter((tab) => tab.affix || tab.key === key);
      set({
        activeKey: tabs.some((tab) => tab.key === key) ? key : tabs[0]?.key,
        tabs,
      });
    },
    closeRight: (key) => {
      const current = get();
      const targetIndex = current.tabs.findIndex((tab) => tab.key === key);

      if (targetIndex < 0 || targetIndex >= current.tabs.length - 1) {
        return;
      }

      const tabs = current.tabs.filter((tab, index) => tab.affix || index <= targetIndex);

      set({
        activeKey: tabs.some((tab) => tab.key === current.activeKey) ? current.activeKey : key,
        tabs,
      });
    },
    closeTab: (key) => {
      const current = get();
      const target = current.tabs.find((tab) => tab.key === key);

      if (!target || target.affix) {
        return;
      }

      const closedIndex = current.tabs.findIndex((tab) => tab.key === key);
      const tabs = current.tabs.filter((tab) => tab.key !== key);

      set({
        activeKey:
          current.activeKey === key ? nextActiveAfterClose(tabs, closedIndex) : current.activeKey,
        tabs,
      });
    },
    openTab: (tab) => {
      const current = get();
      const exists = current.tabs.some((item) => item.key === tab.key);

      set({
        activeKey: tab.key,
        tabs: exists
          ? current.tabs.map((item) => (item.key === tab.key ? { ...item, ...tab } : item))
          : [...current.tabs, tab],
      });
    },
    reorderTabs: (fromIndex, toIndex) => {
      const tabs = [...get().tabs];

      // 固定标签是锚点，不允许其他标签移动到其位置破坏约束。
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= tabs.length ||
        toIndex >= tabs.length ||
        tabs[toIndex]?.affix
      ) {
        return;
      }

      const [moving] = tabs.splice(fromIndex, 1);
      if (!moving) {
        return;
      }
      tabs.splice(toIndex, 0, moving);
      set({ tabs });
    },
    setActiveKey: (key) => set({ activeKey: key }),
    tabs: normalized,
    toggleAffix: (key) => {
      set({
        tabs: get().tabs.map((tab) => (tab.key === key ? { ...tab, affix: !tab.affix } : tab)),
      });
    },
  }));
}

export const tabsStore = createTabsStore([
  { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
]);
