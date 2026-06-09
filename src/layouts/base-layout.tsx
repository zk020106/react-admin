import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useBoolean, useKeyPress } from "ahooks";
import { Settings2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import { getAdminMessages } from "@/i18n/admin-i18n";
import { getRouteRefreshQueryKeys } from "@/lib/query-keys";
import {
  ADMIN_DEFAULT_PATH,
  affixTabs,
  getDefaultMenuPath,
  getMenuTitle,
  normalizeAdminPath,
} from "@/router/app-data";
import { preferenceStore } from "@/store/preferences";
import { tabsStore } from "@/store/tabs";
import { applyVbenTheme } from "@/theme";
import type { AdminPreferences, MenuRecord, TabRecord } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { findActiveMenuRecord, hasPageIcon } from "@/layouts/navigation";
import { AdminHeader } from "@/layouts/admin-header";
import { AdminSidebar, MixedSidebarFrame } from "@/layouts/admin-sidebar";
import { PageTransitionLoading, PageTransitionProgress } from "@/layouts/page-transitions";
import { PageSurface } from "@/layouts/page-surface";
import { resolvePreferencesButtonPlacement } from "@/layouts/preferences-options";
import { PreferencesSheet } from "@/layouts/preferences-sheet";
import { Tabbar } from "@/layouts/tabbar";
import {
  GlobalSearchDialog,
  LockScreenOverlay,
  LockScreenSetupDialog,
} from "@/layouts/workspace-overlays";
import { navigationQueries } from "@/pages/admin-queries";
import { findMenuTrail } from "@/utils/menu";

const emptyMenu: MenuRecord[] = [];

// 函数：resolveTab。把路由路径转换成标签页记录。
function resolveTab(path: string, menu: MenuRecord[]): TabRecord {
  const title = getMenuTitle(path, menu);
  return {
    affix: path === ADMIN_DEFAULT_PATH,
    icon: hasPageIcon(path) ? path : undefined,
    key: path,
    path,
    title,
  };
}

// 函数：getRootMenu。获取当前路径所在的一级菜单。
function getRootMenu(path: string, menu: MenuRecord[]) {
  return findMenuTrail(menu, path)?.[0] ?? menu.find((item) => item.path === path) ?? menu[0];
}

// 组件：AdminWorkspace。用于组织后台布局状态、路由同步、标签页和偏好设置。
function AdminWorkspace() {
  const queryClient = useQueryClient();
  const menuQuery = useQuery(navigationQueries.menu());
  const preferences = useStore(preferenceStore, (state) => state.preferences);
  const setPreferences = useStore(preferenceStore, (state) => state.setPreferences);
  const tabs = useStore(tabsStore, (state) => state.tabs);
  const routePathname = useLocation({ select: (location) => location.pathname });
  const routerNavigate = useNavigate();
  const navigationMenu = menuQuery.data ?? emptyMenu;
  const activePath = useMemo(
    () => normalizeAdminPath(routePathname, navigationMenu),
    [navigationMenu, routePathname],
  );
  const lastActiveByRootRef = useRef<Record<string, string>>({});
  const tabsInitializedRef = useRef(false);
  const [manualHeaderMixedSideRoot, setManualHeaderMixedSideRoot] = useState<{
    anchorPath: string;
    path: string;
  } | null>(null);
  const [manualMixedRoot, setManualMixedRoot] = useState<{
    anchorPath: string;
    path: string;
  } | null>(null);
  const [scrollHeaderHidden, setScrollHeaderHidden] = useState(false);
  const [contentMaximized, setContentMaximized] = useState(false);
  const [preferencesOpen, preferencesActions] = useBoolean(false);
  const [searchOpen, searchActions] = useBoolean(false);
  const [lockOpen, lockActions] = useBoolean(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [lockScreenPassword, setLockScreenPassword] = useState("");
  const isMobile = useIsMobile();
  const messages = useMemo(() => getAdminMessages(preferences.appLocale), [preferences.appLocale]);
  const activeMenu = navigationMenu;
  const effectiveLayout: AdminPreferences["layout"] =
    isMobile && preferences.layout !== "full-content" ? "sidebar-nav" : preferences.layout;
  const headerHidden =
    ["auto", "auto-scroll"].includes(preferences.headerMode) &&
    effectiveLayout !== "full-content" &&
    scrollHeaderHidden;

  useKeyPress(
    "ctrl.k",
    (event) => {
      event.preventDefault();
      searchActions.setTrue();
    },
    {
      exactMatch: true,
      useCapture: true,
      events: ["keydown"],
      target: () =>
        preferences.shortcutKeysEnable && preferences.shortcutKeysGlobalSearch ? document : null,
    },
  );
  useKeyPress(
    "meta.k",
    (event) => {
      event.preventDefault();
      searchActions.setTrue();
    },
    {
      exactMatch: true,
      useCapture: true,
      events: ["keydown"],
      target: () =>
        preferences.shortcutKeysEnable && preferences.shortcutKeysGlobalSearch ? document : null,
    },
  );
  useKeyPress(
    "alt.l",
    (event) => {
      event.preventDefault();
      lockActions.setTrue();
    },
    {
      exactMatch: true,
      useCapture: true,
      events: ["keydown"],
      target: () =>
        preferences.shortcutKeysEnable && preferences.shortcutKeysGlobalLockScreen
          ? document
          : null,
    },
  );
  useKeyPress(
    "alt.q",
    (event) => {
      event.preventDefault();
    },
    {
      exactMatch: true,
      useCapture: true,
      events: ["keydown"],
      target: () =>
        preferences.shortcutKeysEnable && preferences.shortcutKeysGlobalLogout ? document : null,
    },
  );
  useKeyPress(
    "esc",
    () => {
      searchActions.setFalse();
      lockActions.setFalse();
      preferencesActions.setFalse();
    },
    {
      exactMatch: true,
      useCapture: true,
      events: ["keydown"],
      target: () =>
        preferences.shortcutKeysEnable && preferences.shortcutKeysGlobalEscape ? document : null,
    },
  );

  useEffect(() => {
    if (tabsInitializedRef.current || activeMenu.length === 0) {
      return;
    }

    const initialTabs = affixTabs.map((tab) => ({
      ...resolveTab(tab.path, activeMenu),
      affix: tab.affix,
    }));

    tabsStore.setState({
      activeKey: initialTabs[0]?.key,
      tabs: initialTabs,
    });
    tabsStore.getState().openTab(resolveTab(ADMIN_DEFAULT_PATH, activeMenu));
    tabsInitializedRef.current = true;
  }, [activeMenu]);

  useEffect(() => {
    const current = tabsStore.getState();

    tabsStore.setState({
      tabs: current.tabs.map((tab) => ({
        ...tab,
        title: getMenuTitle(tab.path, activeMenu),
      })),
    });
  }, [activeMenu]);

  useEffect(() => {
    applyVbenTheme({
      builtinType: preferences.themeBuiltinType,
      colorDestructive: preferences.themeColorDestructive,
      colorPrimary: preferences.themeColorPrimary,
      colorSuccess: preferences.themeColorSuccess,
      colorWarning: preferences.themeColorWarning,
      fontSize: preferences.themeFontSize,
      mode: preferences.colorMode === "system" ? "auto" : preferences.colorMode,
      radius: preferences.themeRadius,
      semiDarkHeader: preferences.themeSemiDarkHeader,
      semiDarkSidebar: preferences.themeSemiDarkSidebar,
      semiDarkSidebarSub: preferences.themeSemiDarkSidebarSub,
    });
  }, [
    preferences.colorMode,
    preferences.themeBuiltinType,
    preferences.themeColorDestructive,
    preferences.themeColorPrimary,
    preferences.themeColorSuccess,
    preferences.themeColorWarning,
    preferences.themeFontSize,
    preferences.themeRadius,
    preferences.themeSemiDarkHeader,
    preferences.themeSemiDarkSidebar,
    preferences.themeSemiDarkSidebarSub,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    const filters = [
      preferences.colorGrayMode ? "grayscale(1)" : "",
      preferences.colorWeakMode ? "contrast(0.9) saturate(0.6)" : "",
    ].filter(Boolean);

    root.style.filter = filters.join(" ");

    return () => {
      root.style.filter = "";
    };
  }, [preferences.colorGrayMode, preferences.colorWeakMode]);

  useEffect(() => {
    document.title = preferences.appDynamicTitle
      ? `${getMenuTitle(activePath, activeMenu)} - ${messages.common.systemName}`
      : messages.common.systemName;
  }, [activeMenu, activePath, messages.common.systemName, preferences.appDynamicTitle]);

  useEffect(() => {
    if (
      !["auto", "auto-scroll"].includes(preferences.headerMode) ||
      effectiveLayout === "full-content"
    ) {
      return;
    }

    let lastScrollY = window.scrollY;

    // 函数：handleScroll。根据滚动方向和高度更新顶栏隐藏状态。
    function handleScroll() {
      const nextScrollY = window.scrollY;

      if (preferences.headerMode === "auto") {
        setScrollHeaderHidden(nextScrollY > preferences.headerHeight);
      } else {
        setScrollHeaderHidden(nextScrollY > preferences.headerHeight && nextScrollY > lastScrollY);
      }

      lastScrollY = nextScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [effectiveLayout, preferences.headerHeight, preferences.headerMode]);

  useEffect(() => {
    if (routePathname !== activePath) {
      void routerNavigate({ replace: true, to: activePath });
    }
  }, [activePath, routePathname, routerNavigate]);

  useEffect(() => {
    const nextRootMenu = getRootMenu(activePath, activeMenu);

    if (nextRootMenu.path !== activePath) {
      lastActiveByRootRef.current = {
        ...lastActiveByRootRef.current,
        [nextRootMenu.path]: activePath,
      };
    }
  }, [activeMenu, activePath]);

  useEffect(() => {
    tabsStore.getState().openTab(resolveTab(activePath, activeMenu));
  }, [activeMenu, activePath]);

  // 函数：navigate。统一规整管理端路径后触发路由跳转。
  function navigate(path: string, options?: { replace?: boolean }) {
    void routerNavigate({
      replace: options?.replace,
      to: normalizeAdminPath(path, activeMenu),
    });
  }

  // 函数：closeTab。关闭指定标签并同步激活路由。
  function closeTab(key: string) {
    tabsStore.getState().closeTab(key);
    syncActiveTab();
  }

  // 函数：syncActiveTab。把标签仓库中的激活项同步到路由。
  function syncActiveTab() {
    const nextActive = tabsStore.getState().activeKey;

    if (nextActive) {
      navigate(nextActive, { replace: true });
    }
  }

  // 函数：closeLeftTabs。关闭指定标签左侧标签并同步路由。
  function closeLeftTabs(key: string) {
    tabsStore.getState().closeLeft(key);
    syncActiveTab();
  }

  // 函数：closeRightTabs。关闭指定标签右侧标签并同步路由。
  function closeRightTabs(key: string) {
    tabsStore.getState().closeRight(key);
    syncActiveTab();
  }

  // 函数：closeOtherTabs。关闭其它标签并同步路由。
  function closeOtherTabs(key: string) {
    tabsStore.getState().closeOthers(key);
    syncActiveTab();
  }

  // 函数：closeAllTabs。关闭全部可关闭标签并同步路由。
  function closeAllTabs() {
    tabsStore.getState().closeAll();
    syncActiveTab();
  }

  // 函数：toggleTabPin。切换标签固定状态。
  function toggleTabPin(key: string) {
    tabsStore.getState().toggleAffix(key);
  }

  // 函数：refreshActiveTab。刷新当前页面关联的查询缓存。
  function refreshActiveTab() {
    const refreshKeys = getRouteRefreshQueryKeys(activePath);

    void Promise.all(
      refreshKeys.map((queryKey) =>
        queryClient.invalidateQueries({
          queryKey,
        }),
      ),
    );
  }

  // 函数：lockScreen。保存锁屏密码并进入锁屏状态。
  function lockScreen(password: string) {
    setLockScreenPassword(password);
    setScreenLocked(true);
    lockActions.setFalse();
  }

  // 函数：unlockScreen。退出锁屏并清除锁屏密码。
  function unlockScreen() {
    setScreenLocked(false);
    setLockScreenPassword("");
  }

  const rootMenu = getRootMenu(activePath, activeMenu);
  const manualMixedRootPath =
    manualMixedRoot?.anchorPath === activePath ? manualMixedRoot.path : undefined;
  const manualHeaderMixedSideRootPath =
    manualHeaderMixedSideRoot?.anchorPath === activePath
      ? manualHeaderMixedSideRoot.path
      : undefined;
  const mixedRootPath = manualMixedRootPath ?? rootMenu.path;

  // 混合布局可临时覆盖可见根菜单，但不改变当前激活路由。
  const displayedMixedRoot = activeMenu.find((item) => item.path === mixedRootPath) ?? rootMenu;
  const headerMixedRoot = effectiveLayout === "header-mixed-nav" ? displayedMixedRoot : rootMenu;
  const headerMixedSideMenu = headerMixedRoot.children ?? [];
  const activeHeaderMixedSideRoot = findActiveMenuRecord(headerMixedSideMenu, activePath);
  const selectedHeaderMixedSideRoot =
    headerMixedSideMenu.find((item) => item.path === manualHeaderMixedSideRootPath) ??
    activeHeaderMixedSideRoot ??
    headerMixedSideMenu[0] ??
    headerMixedRoot;
  // 这些开关先统一判定布局区域是否可用，再进入具体渲染分支。
  const sidebarEnabled =
    !contentMaximized &&
    preferences.sidebarEnable &&
    !preferences.sidebarHidden &&
    [
      "header-mixed-nav",
      "header-sidebar-nav",
      "mixed-nav",
      "sidebar-mixed-nav",
      "sidebar-nav",
    ].includes(effectiveLayout) &&
    (effectiveLayout !== "header-mixed-nav" || headerMixedSideMenu.length > 0);
  const headerEnabled =
    !contentMaximized && effectiveLayout !== "full-content" && preferences.headerVisible;
  const tabbarEnabled = effectiveLayout !== "full-content" && preferences.tabbarEnable;
  const mixedSidebarEnabled =
    sidebarEnabled && ["header-mixed-nav", "sidebar-mixed-nav"].includes(effectiveLayout);
  const primarySidebarEnabled = sidebarEnabled && !mixedSidebarEnabled;
  const sidebarMenu =
    effectiveLayout === "mixed-nav" && preferences.navigationSplit
      ? (displayedMixedRoot.children ?? [])
      : activeMenu;
  const preferencesButtonPlacement = resolvePreferencesButtonPlacement({
    headerEnabled,
    isMobile,
    preferences,
    sidebarEnabled,
  });

  // 函数：selectMixedRoot。选择混合导航根菜单并按配置激活子页面。
  function selectMixedRoot(item: MenuRecord) {
    const children = item.children ?? [];

    setManualMixedRoot({ anchorPath: activePath, path: item.path });
    setManualHeaderMixedSideRoot(
      children[0]?.path ? { anchorPath: activePath, path: children[0].path } : null,
    );

    if (children.length === 0) {
      if (effectiveLayout === "mixed-nav" && preferences.navigationSplit) {
        return;
      }

      navigate(item.path);
      return;
    }

    if (preferences.sidebarAutoActivateChild) {
      navigate(lastActiveByRootRef.current[item.path] ?? getDefaultMenuPath(item));
    }
  }

  // 函数：selectHeaderMixedSideRoot。选择顶栏混合布局的侧栏根节点。
  function selectHeaderMixedSideRoot(item: MenuRecord) {
    const children = item.children ?? [];

    setManualHeaderMixedSideRoot({ anchorPath: activePath, path: item.path });

    if (children.length === 0) {
      navigate(item.path);
      return;
    }

    if (preferences.sidebarAutoActivateChild) {
      navigate(lastActiveByRootRef.current[item.path] ?? getDefaultMenuPath(item));
    }
  }

  return (
    <SidebarProvider
      open={!preferences.sidebarCollapsed}
      onOpenChange={(open) => setPreferences({ sidebarCollapsed: !open })}
      className={cn(
        effectiveLayout === "header-sidebar-nav" && "admin-layout-header-sidebar-nav",
        preferences.sidebarCollapsedShowTitle && "admin-sidebar-collapsed-show-title",
      )}
      style={
        {
          "--admin-header-height": `${preferences.headerHeight}px`,
          "--admin-sidebar-offset": preferences.sidebarCollapsed
            ? "3rem"
            : `${preferences.sidebarWidth}px`,
          ...(effectiveLayout === "header-sidebar-nav"
            ? { "--admin-header-brand-width": `${preferences.sidebarWidth}px` }
            : {}),
          "--sidebar-width-icon": preferences.sidebarCollapsedShowTitle ? "4.25rem" : "3rem",
          "--sidebar-width": `${preferences.sidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      {mixedSidebarEnabled && (
        <MixedSidebarFrame
          activePath={activePath}
          activeRootPath={
            effectiveLayout === "header-mixed-nav"
              ? selectedHeaderMixedSideRoot.path
              : displayedMixedRoot.path
          }
          navigate={navigate}
          onSelectRoot={
            effectiveLayout === "header-mixed-nav" ? selectHeaderMixedSideRoot : selectMixedRoot
          }
          preferences={preferences}
          rootAriaLabel={
            effectiveLayout === "header-mixed-nav"
              ? messages.navigation.headerMixedSidebar
              : messages.navigation.mixedMain
          }
          rootMenus={effectiveLayout === "header-mixed-nav" ? headerMixedSideMenu : activeMenu}
          selectedRoot={
            effectiveLayout === "header-mixed-nav"
              ? selectedHeaderMixedSideRoot
              : displayedMixedRoot
          }
          setPreferences={setPreferences}
        />
      )}
      {primarySidebarEnabled && (
        <AdminSidebar
          activePath={activePath}
          menu={sidebarMenu}
          navigate={navigate}
          preferences={preferences}
          setPreferences={setPreferences}
        />
      )}
      <SidebarInset>
        {headerEnabled && (
          <AdminHeader
            activePath={activePath}
            activeRootPath={displayedMixedRoot.path}
            isMobile={isMobile}
            layout={effectiveLayout}
            menu={activeMenu}
            navigate={navigate}
            openLock={lockActions.setTrue}
            openPreferences={preferencesActions.setTrue}
            openSearch={searchActions.setTrue}
            onRefresh={refreshActiveTab}
            onSelectRoot={selectMixedRoot}
            preferences={preferences}
            preferencesButtonPlacement={preferencesButtonPlacement}
            sidebarEnabled={sidebarEnabled}
            setPreferences={setPreferences}
            hidden={headerHidden}
          />
        )}
        {tabbarEnabled && (
          <Tabbar
            activePath={activePath}
            closeAllTabs={closeAllTabs}
            closeLeftTabs={closeLeftTabs}
            closeOtherTabs={closeOtherTabs}
            closeRightTabs={closeRightTabs}
            closeTab={closeTab}
            contentMaximized={contentMaximized}
            navigate={navigate}
            onRefresh={refreshActiveTab}
            onToggleMaximize={() => setContentMaximized((current) => !current)}
            preferences={preferences}
            tabs={tabs}
            toggleTabPin={toggleTabPin}
          />
        )}
        <main
          className={cn(
            "relative min-h-0 flex-1 overflow-auto bg-background-deep",
            preferences.transitionEnable && `admin-transition-${preferences.transitionName}`,
          )}
          data-slot="admin-content"
          style={{ padding: preferences.contentPadding }}
        >
          {preferences.transitionProgress && (
            <PageTransitionProgress key={`progress-${activePath}`} routeKey={activePath} />
          )}
          {preferences.transitionLoading && (
            <PageTransitionLoading key={`loading-${activePath}`} routeKey={activePath} />
          )}
          {preferences.appWatermark && preferences.appWatermarkContent && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 opacity-[0.08]"
              style={{
                backgroundImage: `repeating-linear-gradient(-30deg, transparent 0 110px, hsl(var(--foreground)) 110px 112px, transparent 112px 220px)`,
              }}
            >
              <div className="grid size-full place-items-center text-2xl font-semibold text-foreground">
                {preferences.appWatermarkContent}
              </div>
            </div>
          )}
          <PageSurface activePath={activePath} key={activePath} preferences={preferences} />
        </main>
        {preferences.layout !== "full-content" && preferences.footerEnable && (
          <footer
            className={cn(
              "flex h-9 shrink-0 items-center justify-center border-t bg-header px-4 text-xs text-muted-foreground",
              preferences.footerFixed && "sticky bottom-0 z-10",
            )}
          >
            {preferences.copyrightEnable
              ? `Copyright © ${preferences.copyrightDate} ${preferences.copyrightCompanyName}`
              : messages.common.systemName}
          </footer>
        )}
      </SidebarInset>
      <PreferencesSheet
        onOpenChange={preferencesActions.set}
        open={preferencesOpen}
        preferences={preferences}
        resetPreferences={preferenceStore.getState().resetPreferences}
        setPreferences={setPreferences}
      />
      {preferencesButtonPlacement.fixed && (
        <Button
          aria-label={messages.header.preferences}
          className="fixed top-1/2 right-0 z-50 size-9 -translate-y-1/2 rounded-r-none rounded-l-md bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          data-preferences-position="fixed"
          onClick={preferencesActions.setTrue}
          size="icon"
          type="button"
          variant="default"
        >
          <Settings2 className="size-4" />
        </Button>
      )}
      <GlobalSearchDialog
        locale={preferences.appLocale}
        menu={activeMenu}
        navigate={navigate}
        onOpenChange={searchActions.set}
        open={searchOpen}
      />
      <LockScreenSetupDialog
        locale={preferences.appLocale}
        onOpenChange={lockActions.set}
        onSubmit={lockScreen}
        open={lockOpen}
      />
      {screenLocked && (
        <LockScreenOverlay
          locale={preferences.appLocale}
          onUnlock={unlockScreen}
          password={lockScreenPassword}
          timezone={preferences.appTimezone}
        />
      )}
    </SidebarProvider>
  );
}

// 组件：BaseLayout。用于提供管理端基础布局入口和全局提示上下文。
export function BaseLayout() {
  return (
    <TooltipProvider>
      <AdminWorkspace />
    </TooltipProvider>
  );
}
