import { describe, expect, it } from "vitest";

import { getVisibleTabs } from "@/layouts/tabbar";
import { createTabsStore } from "@/store/tabs";

describe("tabs store", () => {
  it("adds unique tabs and falls back to the nearest tab when closing the active tab", () => {
    const store = createTabsStore([
      { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
    ]);

    store.getState().openTab({ key: "/system/users", path: "/system/users", title: "Users" });
    store.getState().openTab({ key: "/system/roles", path: "/system/roles", title: "Roles" });
    store.getState().openTab({ key: "/system/users", path: "/system/users", title: "Users" });

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual([
      "/dashboard",
      "/system/users",
      "/system/roles",
    ]);
    expect(store.getState().activeKey).toBe("/system/users");

    store.getState().closeTab("/system/users");

    expect(store.getState().activeKey).toBe("/system/roles");
    expect(store.getState().tabs.map((tab) => tab.key)).toEqual(["/dashboard", "/system/roles"]);
  });

  it("keeps affix tabs when closing others and can reorder non-affix tabs", () => {
    const store = createTabsStore([
      { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
      { key: "/system/users", path: "/system/users", title: "Users" },
      { key: "/system/roles", path: "/system/roles", title: "Roles" },
    ]);

    store.getState().closeOthers("/system/roles");

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual(["/dashboard", "/system/roles"]);

    store.getState().openTab({ key: "/workplace", path: "/workplace", title: "Workplace" });
    store.getState().reorderTabs(2, 1);

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual([
      "/dashboard",
      "/workplace",
      "/system/roles",
    ]);
  });

  it("closes tabs on the left and right while preserving affix tabs", () => {
    const store = createTabsStore([
      { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
      { key: "/workplace", path: "/workplace", title: "Workplace" },
      { key: "/system/users", path: "/system/users", title: "Users" },
      { key: "/system/roles", path: "/system/roles", title: "Roles" },
    ]);

    store.getState().setActiveKey("/workplace");
    store.getState().closeLeft("/system/users");

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual([
      "/dashboard",
      "/system/users",
      "/system/roles",
    ]);
    expect(store.getState().activeKey).toBe("/system/users");

    store.getState().closeRight("/system/users");

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual(["/dashboard", "/system/users"]);
  });

  it("toggles tab affix state", () => {
    const store = createTabsStore([
      { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
      { key: "/workplace", path: "/workplace", title: "Workplace" },
    ]);

    store.getState().toggleAffix("/workplace");

    expect(store.getState().tabs.find((tab) => tab.key === "/workplace")?.affix).toBe(true);

    store.getState().toggleAffix("/workplace");

    expect(store.getState().tabs.find((tab) => tab.key === "/workplace")?.affix).toBe(false);
  });

  it("keeps one tab when closing all without affix tabs", () => {
    const store = createTabsStore([
      { key: "/workplace", path: "/workplace", title: "Workplace" },
      { key: "/system/users", path: "/system/users", title: "Users" },
    ]);

    store.getState().closeAll();

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual(["/workplace"]);
    expect(store.getState().activeKey).toBe("/workplace");
  });

  it("keeps store actions connected after resetting tab state", () => {
    const store = createTabsStore([
      { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
    ]);

    store.setState({
      activeKey: "/dashboard",
      tabs: [{ affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" }],
    });
    store.getState().openTab({ key: "/workplace", path: "/workplace", title: "Workplace" });

    expect(store.getState().tabs.map((tab) => tab.key)).toEqual(["/dashboard", "/workplace"]);
    expect(store.getState().activeKey).toBe("/workplace");
  });

  it("keeps the active tab visible when trimming tabbar items", () => {
    const tabs = [
      { affix: true, key: "/dashboard", path: "/dashboard", title: "Dashboard" },
      { key: "/workplace", path: "/workplace", title: "Workplace" },
      { key: "/system/users", path: "/system/users", title: "Users" },
      { key: "/system/roles", path: "/system/roles", title: "Roles" },
    ];

    expect(getVisibleTabs(tabs, "/workplace", 2).map((tab) => tab.key)).toEqual([
      "/system/roles",
      "/workplace",
    ]);
    expect(getVisibleTabs(tabs, "/system/roles", 2).map((tab) => tab.key)).toEqual([
      "/system/users",
      "/system/roles",
    ]);
    expect(getVisibleTabs(tabs, "/missing", 2).map((tab) => tab.key)).toEqual([
      "/system/users",
      "/system/roles",
    ]);
  });
});
