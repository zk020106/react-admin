import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useBoolean, useKeyPress } from "ahooks";
import NProgress from "nprogress";
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PanelsTopLeft,
  Pin,
  PinOff,
  Settings2,
  SquareMenu,
  type LucideIcon,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  findActiveMenuRecord,
  getMenuRecordIcon,
  hasPageIcon,
  isMenuRecordActive,
} from "@/layouts/navigation";
import { AdminHeader } from "@/layouts/admin-header";
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

// 函数：clampNumber。把数值约束在最小值和最大值之间。
function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// 函数：uniqueHtmlElements。过滤空值并去重 DOM 元素。
function uniqueHtmlElements(elements: Array<Element | null | undefined>) {
  return Array.from(
    new Set(elements.filter((element): element is HTMLElement => element instanceof HTMLElement)),
  );
}

// 函数：startDeferredSidebarResize。处理侧边栏拖拽预览，并在释放时提交宽度。
function startDeferredSidebarResize({
  event,
  max = 320,
  min = 160,
  onCommit,
  startWidth,
  targets,
}: {
  event: React.PointerEvent<HTMLDivElement>;
  max?: number;
  min?: number;
  onCommit: (width: number) => void;
  startWidth: number;
  targets: HTMLElement[];
}) {
  // 拖拽过程中保持布局状态稳定，只在释放时提交最终宽度。
  event.preventDefault();
  event.stopPropagation();

  const dragHandle = event.currentTarget;
  const startX = event.clientX;
  const handleTransition = dragHandle.style.transition;
  const handleTransform = dragHandle.style.transform;
  const handleBackground = dragHandle.style.backgroundColor;
  const targetTransitions = targets.map((target) => [target, target.style.transition] as const);
  const overlay = document.createElement("div");
  let cleanupDone = false;

  dragHandle.style.transition = "none";
  targetTransitions.forEach(([target]) => {
    target.style.transition = "none";
  });

  // 透明遮罩用于接管指针事件，避免拖出手柄后丢失拖拽状态。
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "9999";
  overlay.style.cursor = "col-resize";
  overlay.style.userSelect = "none";
  overlay.style.background = "rgba(0, 0, 0, 0)";
  overlay.style.outline = "none";
  overlay.tabIndex = -1;
  document.body.append(overlay);

  // 函数：resolveWidth。根据指针位置计算约束后的宽度和越界状态。
  function resolveWidth(clientX: number) {
    const rawWidth = startWidth + clientX - startX;
    return {
      outOfBounds: rawWidth < min || rawWidth > max,
      width: clampNumber(rawWidth, min, max),
    };
  }

  // 函数：restoreTargets。恢复参与拖拽的目标元素过渡样式。
  function restoreTargets() {
    targetTransitions.forEach(([target, transition]) => {
      target.style.transition = transition;
    });
  }

  // 函数：cleanup。移除拖拽监听、遮罩和临时样式。
  function cleanup({ deferTargetRestore = false }: { deferTargetRestore?: boolean } = {}) {
    if (cleanupDone) {
      return;
    }

    cleanupDone = true;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerCancel);
    dragHandle.style.transition = handleTransition;
    dragHandle.style.transform = handleTransform;
    dragHandle.style.backgroundColor = handleBackground;
    overlay.remove();

    if (deferTargetRestore && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(restoreTargets);
    } else {
      restoreTargets();
    }
  }

  // 函数：handlePointerMove。拖拽时更新手柄位移和越界反馈。
  function handlePointerMove(pointerEvent: PointerEvent) {
    const { outOfBounds, width } = resolveWidth(pointerEvent.clientX);

    dragHandle.style.transform = `translateX(${width - startWidth}px)`;
    dragHandle.style.backgroundColor = outOfBounds
      ? "hsl(var(--primary) / 0.3)"
      : "hsl(var(--primary))";
    overlay.style.cursor = outOfBounds ? "not-allowed" : "col-resize";
  }

  // 函数：handlePointerUp。释放指针时提交最终侧边栏宽度。
  function handlePointerUp(pointerEvent: PointerEvent) {
    const { width } = resolveWidth(pointerEvent.clientX);

    onCommit(Math.round(width));
    cleanup({ deferTargetRestore: true });
  }

  // 函数：handlePointerCancel。指针取消时回滚临时拖拽状态。
  function handlePointerCancel() {
    cleanup();
  }

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerCancel);
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

// 组件：AdminSidebar。用于渲染主侧边导航，并处理折叠、悬停展开和宽度拖拽。
function AdminSidebar({
  activePath,
  ariaLabel,
  menu,
  navigate,
  preferences,
  setPreferences,
  title,
  variant = "primary",
}: {
  activePath: string;
  ariaLabel?: string;
  menu: MenuRecord[];
  navigate: (path: string) => void;
  preferences: AdminPreferences;
  setPreferences: ReturnType<typeof preferenceStore.getState>["setPreferences"];
  title?: string;
  variant?: "primary" | "secondary";
}) {
  const messages = getAdminMessages(preferences.appLocale);
  const sidebarAriaLabel = ariaLabel ?? messages.navigation.sidebar;
  const sidebarTitle = title ?? messages.navigation.navigationMenu;
  const [accordionOpenKey, setAccordionOpenKey] = useState<string | null>();
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();
  const sidebarHeaderVisible = variant !== "primary" || preferences.layout !== "header-sidebar-nav";
  const sidebarTriggerVisible =
    variant === "primary" &&
    preferences.widgetSidebarToggle &&
    preferences.sidebarCollapsedButton &&
    preferences.layout !== "mixed-nav" &&
    preferences.layout !== "sidebar-mixed-nav";

  // 函数：handleSidebarMouseEnter。悬停时临时展开已折叠的主侧边栏。
  function handleSidebarMouseEnter() {
    if (
      variant !== "primary" ||
      preferences.sidebarExpandOnHover ||
      !preferences.sidebarCollapsed
    ) {
      return;
    }

    setHoverExpanded(true);
    setPreferences({ sidebarCollapsed: false });
  }

  // 函数：handleSidebarMouseLeave。离开侧边栏时恢复悬停展开前的折叠状态。
  function handleSidebarMouseLeave() {
    if (!hoverExpanded) {
      return;
    }

    setHoverExpanded(false);
    setPreferences({ sidebarCollapsed: true });
  }

  // 函数：startResize。启动主侧边栏宽度拖拽。
  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (!preferences.sidebarDraggable || variant !== "primary") {
      return;
    }

    const sidebar = event.currentTarget.closest("[data-slot='sidebar']");
    const targets = uniqueHtmlElements([
      sidebar?.querySelector("[data-slot='sidebar-gap']"),
      sidebar?.querySelector("[data-slot='sidebar-container']"),
    ]);

    startDeferredSidebarResize({
      event,
      onCommit: (sidebarWidth) => setPreferences({ sidebarWidth }),
      startWidth: preferences.sidebarWidth,
      targets,
    });
  }

  // 函数：navigateFromSidebar。侧边栏导航后在移动端自动收起抽屉。
  function navigateFromSidebar(path: string) {
    navigate(path);

    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar
      className={cn(
        variant === "primary" && "admin-primary-sidebar",
        variant === "secondary" &&
          "border-r bg-[hsl(var(--sidebar-sub))] [&_[data-slot=sidebar-inner]]:bg-[hsl(var(--sidebar-sub))]",
      )}
      collapsible={variant === "secondary" ? "none" : "icon"}
      data-admin-layout={preferences.layout}
      data-admin-sidebar-variant={variant}
      data-hover-expanded={hoverExpanded ? "true" : undefined}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      variant="sidebar"
    >
      {sidebarHeaderVisible && (
        <SidebarHeader>
          {variant === "primary" ? (
            <div
              className="flex h-10 items-center gap-2 rounded-lg px-2"
              data-slot="admin-sidebar-brand"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PanelsTopLeft className="size-4" />
              </div>
              <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">{messages.common.systemName}</span>
              </div>
            </div>
          ) : (
            <div className="grid h-10 min-w-0 place-content-center px-2 text-sm font-semibold text-sidebar-foreground">
              <span className="truncate">{sidebarTitle}</span>
            </div>
          )}
        </SidebarHeader>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{sidebarTitle}</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label={sidebarAriaLabel}>
              <SidebarMenu>
                {menu.map((item) => (
                  <MenuNode
                    activePath={activePath}
                    accordion={preferences.navigationAccordion}
                    accordionOpenKey={accordionOpenKey}
                    autoActivateChild={preferences.sidebarAutoActivateChild}
                    item={item}
                    key={item.key}
                    navigate={navigateFromSidebar}
                    rounded={preferences.navigationStyleType === "rounded"}
                    setAccordionOpenKey={setAccordionOpenKey}
                  />
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {sidebarTriggerVisible && (
        <SidebarFooter className="mt-auto">
          <SidebarTrigger
            aria-label={messages.navigation.toggleSidebar}
            className="size-8 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-hover-foreground group-data-[collapsible=icon]:mx-auto"
          />
        </SidebarFooter>
      )}
      {preferences.sidebarDraggable && variant === "primary" && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 z-30 w-1 cursor-col-resize hover:bg-primary"
          onPointerDown={startResize}
        />
      )}
    </Sidebar>
  );
}

// 组件：MixedSidebarFrame。用于组织混合侧栏的根菜单和二级菜单区域。
function MixedSidebarFrame({
  activePath,
  activeRootPath,
  navigate,
  onSelectRoot,
  preferences,
  rootAriaLabel,
  rootMenus = [],
  selectedRoot,
  setPreferences,
}: {
  activePath: string;
  activeRootPath: string;
  navigate: (path: string) => void;
  onSelectRoot: (item: MenuRecord) => void;
  preferences: AdminPreferences;
  rootAriaLabel?: string;
  rootMenus?: MenuRecord[];
  selectedRoot: MenuRecord;
  setPreferences: ReturnType<typeof preferenceStore.getState>["setPreferences"];
}) {
  const messages = getAdminMessages(preferences.appLocale);
  const [hoveredRoot, setHoveredRoot] = useState<MenuRecord | null>(null);
  const [accordionOpenKey, setAccordionOpenKey] = useState<string | null>();
  const [transientExtraVisible, setTransientExtraVisible] = useState(false);
  const fixedExtra = preferences.sidebarExpandOnHover;
  const previewRoot = !fixedExtra && hoveredRoot?.children?.length ? hoveredRoot : selectedRoot;
  const extraMenu = previewRoot.children ?? [];
  const selectedExtraVisible = selectedRoot.children?.length
    ? fixedExtra || transientExtraVisible
    : false;
  const extraVisible = !!hoveredRoot?.children?.length || selectedExtraVisible;
  const extraCollapsed = preferences.sidebarExtraCollapsed;
  const extraWidth = extraCollapsed ? 60 : preferences.sidebarWidth;
  const frameWidth = preferences.sidebarMixedWidth + (extraVisible ? extraWidth : 0);
  const extraTitle = messages.common.systemName;
  const resolvedRootAriaLabel = rootAriaLabel ?? messages.navigation.mixedMain;

  // 函数：handleMouseLeave。离开混合侧栏时清理临时展开的二级栏。
  function handleMouseLeave() {
    if (!fixedExtra) {
      setHoveredRoot(null);
      setTransientExtraVisible(false);
    }
  }

  // 函数：startExtraResize。启动混合侧栏二级栏宽度拖拽。
  function startExtraResize(event: React.PointerEvent<HTMLDivElement>) {
    if (!preferences.sidebarDraggable || extraCollapsed) {
      return;
    }

    const sidebar = event.currentTarget.closest("[data-slot='mixed-sidebar']");
    const targets = uniqueHtmlElements([
      sidebar?.querySelector("[data-slot='mixed-sidebar-gap']"),
      sidebar?.querySelector("[data-slot='mixed-sidebar-container']"),
      event.currentTarget.parentElement,
    ]);

    startDeferredSidebarResize({
      event,
      onCommit: (sidebarWidth) => setPreferences({ sidebarWidth }),
      startWidth: preferences.sidebarWidth,
      targets,
    });
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-slot="mixed-sidebar"
      style={
        {
          "--mixed-sidebar-width": `${preferences.sidebarMixedWidth}px`,
          "--mixed-sidebar-extra-width": `${extraWidth}px`,
          "--mixed-sidebar-frame-width": `${frameWidth}px`,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="relative w-(--mixed-sidebar-frame-width) bg-transparent transition-[width] duration-150 ease-linear"
        data-slot="mixed-sidebar-gap"
      />
      <aside
        className="fixed inset-y-0 left-0 z-20 flex h-svh w-(--mixed-sidebar-frame-width) bg-sidebar-deep transition-[width] duration-150 ease-linear"
        data-slot="mixed-sidebar-container"
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex h-full w-(--mixed-sidebar-width) shrink-0 flex-col border-r border-sidebar-border bg-sidebar-deep">
          <div className="flex h-12 items-center justify-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PanelsTopLeft className="size-4" />
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1 py-2">
            <nav aria-label={resolvedRootAriaLabel}>
              <SidebarMenu className="gap-1">
                {rootMenus.map((item) => (
                  <MixedRootMenuItem
                    activeRootPath={activeRootPath}
                    item={item}
                    key={item.key}
                    onMouseEnter={() => {
                      if (!fixedExtra) {
                        setHoveredRoot(item);
                      }
                    }}
                    onSelectRoot={(rootItem) => {
                      const hasChildren = !!rootItem.children?.length;

                      if (!fixedExtra) {
                        setTransientExtraVisible(hasChildren);
                      } else {
                        setTransientExtraVisible(false);
                      }

                      onSelectRoot(rootItem);
                    }}
                    rounded={preferences.navigationStyleType === "rounded"}
                  />
                ))}
              </SidebarMenu>
            </nav>
          </ScrollArea>
        </div>
        <div
          className={cn(
            "relative flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-[hsl(var(--sidebar-sub))] transition-[width] duration-200",
            extraVisible && "border-l",
          )}
          data-extra-visible={extraVisible ? "true" : undefined}
          style={{ width: extraVisible ? extraWidth : 0 }}
        >
          <div
            className={cn(
              "flex h-[calc(var(--admin-header-height)-1px)] shrink-0 items-center border-b px-3",
              extraCollapsed && "justify-center px-2",
            )}
            data-slot="mixed-sidebar-extra-title"
          >
            <div className="grid min-w-0 leading-tight">
              <span
                className={cn(
                  "truncate text-sm font-semibold text-sidebar-foreground",
                  extraCollapsed && "sr-only",
                )}
              >
                {extraTitle}
              </span>
            </div>
          </div>
          {extraVisible && (
            <ScrollArea className="min-h-0 flex-1 py-2 pb-12">
              <nav
                aria-label={messages.navigation.mixedSecondary}
                className={cn(extraCollapsed ? "px-0" : "px-2")}
              >
                <SidebarMenu className={cn(extraCollapsed && "items-center gap-1")}>
                  {extraMenu.map((item) =>
                    extraCollapsed ? (
                      <CollapsedExtraMenuItem
                        activePath={activePath}
                        item={item}
                        key={item.key}
                        navigate={navigate}
                        rounded={preferences.navigationStyleType === "rounded"}
                      />
                    ) : (
                      <MenuNode
                        activePath={activePath}
                        accordion={preferences.navigationAccordion}
                        accordionOpenKey={accordionOpenKey}
                        autoActivateChild={preferences.sidebarAutoActivateChild}
                        item={item}
                        key={item.key}
                        navigate={navigate}
                        rounded={preferences.navigationStyleType === "rounded"}
                        setAccordionOpenKey={setAccordionOpenKey}
                      />
                    ),
                  )}
                </SidebarMenu>
              </nav>
            </ScrollArea>
          )}
          <div aria-hidden="true" className="h-[42px] shrink-0" />
          {fixedExtra && extraVisible && (
            <Button
              aria-label={
                extraCollapsed
                  ? messages.navigation.expandSecondary
                  : messages.navigation.collapseSecondary
              }
              className="absolute bottom-2 left-3 z-10 size-6 rounded-sm bg-accent p-0 text-foreground/60 hover:bg-[hsl(var(--accent-hover))] hover:text-foreground"
              onClick={() => setPreferences({ sidebarExtraCollapsed: !extraCollapsed })}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              {extraCollapsed ? (
                <ChevronsRight className="size-4" />
              ) : (
                <ChevronsLeft className="size-4" />
              )}
            </Button>
          )}
          {!extraCollapsed && extraVisible && (
            <Button
              aria-label={
                fixedExtra ? messages.navigation.hoverSecondary : messages.navigation.fixSecondary
              }
              className="absolute right-3 bottom-2 z-10 size-6 rounded-sm bg-accent p-0 text-foreground/60 hover:bg-[hsl(var(--accent-hover))] hover:text-foreground"
              onClick={() => {
                setTransientExtraVisible(fixedExtra);
                setPreferences({ sidebarExpandOnHover: !fixedExtra });
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              {fixedExtra ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
            </Button>
          )}
          {preferences.sidebarDraggable && extraVisible && !extraCollapsed && (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 z-30 w-1 cursor-col-resize hover:bg-primary"
              onPointerDown={startExtraResize}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

// 组件：MixedRootMenuItem。用于渲染混合导航的一级根菜单项。
function MixedRootMenuItem({
  activeRootPath,
  item,
  onMouseEnter,
  onSelectRoot,
  rounded,
}: {
  activeRootPath: string;
  item: MenuRecord;
  onMouseEnter?: () => void;
  onSelectRoot: (item: MenuRecord) => void;
  rounded: boolean;
}) {
  const Icon = getMenuRecordIcon(item);
  const isActive = activeRootPath === item.path;

  return (
    <SidebarMenuItem className="px-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label={item.title}
            aria-pressed={isActive}
            className={cn(
              "group relative flex min-h-14 w-full flex-col items-center justify-center gap-1 px-0 py-2 text-sidebar-foreground/70 transition-[background-color,color,box-shadow] hover:bg-sidebar-hover/80 hover:text-sidebar-hover-foreground",
              rounded ? "rounded-md" : "rounded-none",
              isActive &&
                "rounded-none bg-sidebar-active/90 text-sidebar-active-foreground hover:bg-sidebar-active hover:text-sidebar-active-foreground",
            )}
            data-active={isActive ? "true" : undefined}
            onMouseEnter={onMouseEnter}
            onClick={() => onSelectRoot(item)}
            type="button"
          >
            {Icon && <Icon className="size-5 transition-transform group-hover:scale-110" />}
            <span className="w-full truncate text-center text-[11px] leading-4">{item.title}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}

// 组件：CollapsedExtraMenuItem。用于渲染混合侧栏折叠后的二级菜单入口。
function CollapsedExtraMenuItem({
  activePath,
  item,
  navigate,
  rounded,
}: {
  activePath: string;
  item: MenuRecord;
  navigate: (path: string) => void;
  rounded: boolean;
}) {
  const Icon = getMenuRecordIcon(item, SquareMenu);
  const isActive = isMenuRecordActive(item, activePath);
  const targetPath = item.children?.length ? getDefaultMenuPath(item) : item.path;

  return (
    <SidebarMenuItem className="flex w-full justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label={item.title}
            aria-pressed={isActive}
            className={cn(
              "flex h-10 w-12 items-center justify-center text-sidebar-foreground/70 transition-[background-color,color,box-shadow] hover:bg-sidebar-hover hover:text-sidebar-hover-foreground",
              rounded ? "rounded-md" : "rounded-none",
              isActive &&
                "bg-sidebar-active text-sidebar-active-foreground hover:bg-sidebar-active hover:text-sidebar-active-foreground",
            )}
            data-active={isActive ? "true" : undefined}
            onClick={() => navigate(targetPath)}
            type="button"
          >
            <Icon className="size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}

// 组件：MenuNode。用于渲染侧边导航中的单个菜单节点。
function MenuNode({
  activePath,
  accordion,
  accordionOpenKey,
  autoActivateChild,
  item,
  navigate,
  rounded,
  setAccordionOpenKey,
}: {
  activePath: string;
  accordion: boolean;
  accordionOpenKey?: string | null;
  autoActivateChild: boolean;
  item: MenuRecord;
  navigate: (path: string) => void;
  rounded: boolean;
  setAccordionOpenKey?: (key: string | null) => void;
}) {
  const Icon = getMenuRecordIcon(item);
  const children = item.children ?? [];
  const isActive = activePath === item.path;
  const hasActiveChild = children.some((child) => isMenuRecordActive(child, activePath));
  const defaultOpen = hasActiveChild;

  if (children.length > 0) {
    return (
      <CollapsibleMenuNode
        activePath={activePath}
        defaultOpen={defaultOpen}
        accordion={accordion}
        accordionOpenKey={accordionOpenKey}
        autoActivateChild={autoActivateChild}
        hasActiveChild={hasActiveChild}
        icon={Icon}
        item={item}
        navigate={navigate}
        rounded={rounded}
        setAccordionOpenKey={setAccordionOpenKey}
      />
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={cn(!rounded && "rounded-none")}
        isActive={isActive}
        tooltip={item.title}
      >
        <a
          href={item.path}
          onClick={(event) => {
            event.preventDefault();
            navigate(item.path);
          }}
        >
          {Icon && <Icon />}
          <span className="min-w-0 truncate">{item.title}</span>
        </a>
      </SidebarMenuButton>
      {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}

// 组件：CollapsibleMenuNode。用于渲染可展开的侧边导航父节点。
function CollapsibleMenuNode({
  accordion,
  accordionOpenKey,
  activePath,
  autoActivateChild,
  defaultOpen,
  hasActiveChild,
  icon: Icon,
  item,
  navigate,
  rounded,
  setAccordionOpenKey,
}: {
  accordion: boolean;
  accordionOpenKey?: string | null;
  activePath: string;
  autoActivateChild: boolean;
  defaultOpen: boolean;
  hasActiveChild: boolean;
  icon?: LucideIcon;
  item: MenuRecord;
  navigate: (path: string) => void;
  rounded: boolean;
  setAccordionOpenKey?: (key: string | null) => void;
}) {
  const [explicitOpen, setExplicitOpen] = useState<boolean>();
  const accordionControlled = accordion && !!setAccordionOpenKey;
  const open = accordionControlled
    ? accordionOpenKey === undefined
      ? defaultOpen
      : accordionOpenKey === item.key
    : (explicitOpen ?? defaultOpen);

  return (
    <SidebarMenuItem data-accordion={accordion ? "true" : undefined}>
      <SidebarMenuButton
        aria-expanded={open}
        className={cn(!rounded && "rounded-none")}
        isActive={hasActiveChild}
        isCurrent={false}
        onClick={() => {
          const nextOpen = !open;

          if (accordionControlled) {
            setAccordionOpenKey(nextOpen ? item.key : null);
          } else {
            setExplicitOpen(nextOpen);
          }

          if (nextOpen && autoActivateChild) {
            navigate(getDefaultMenuPath(item));
          }
        }}
        tooltip={item.title}
      >
        {Icon && <Icon />}
        <span>{item.title}</span>
        <ChevronRight
          className={cn("ml-auto size-3.5 transition-transform", open && "rotate-90")}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {(item.children ?? []).map((child) => (
            <SidebarMenuSubNode
              activePath={activePath}
              item={child}
              key={child.key}
              navigate={navigate}
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

// 组件：SidebarMenuSubNode。用于渲染侧边栏二级菜单节点。
function SidebarMenuSubNode({
  activePath,
  item,
  navigate,
}: {
  activePath: string;
  item: MenuRecord;
  navigate: (path: string) => void;
}) {
  const isActive = isMenuRecordActive(item, activePath);
  const isCurrent = item.path === activePath;

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        className="admin-sidebar-menu-sub-button"
        isActive={isActive}
        isCurrent={isCurrent}
      >
        <a
          href={item.path}
          onClick={(event) => {
            event.preventDefault();
            navigate(item.path);
          }}
        >
          <span>{item.title}</span>
          {item.badge && (
            <span aria-hidden="true" className="admin-sidebar-menu-count">
              {item.badge}
            </span>
          )}
        </a>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

// 组件：PageTransitionProgress。用于驱动页面切换时的顶部进度条。
function PageTransitionProgress({ routeKey }: { routeKey: string }) {
  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 80 });
    NProgress.start();

    const timer = window.setTimeout(() => {
      NProgress.done();
    }, 320);

    return () => {
      window.clearTimeout(timer);
      NProgress.done(true);
    };
  }, [routeKey]);

  return (
    <span
      aria-hidden="true"
      className="hidden"
      data-route-key={routeKey}
      data-slot="page-transition-progress"
    />
  );
}

// 组件：PageTransitionLoading。用于渲染页面切换时的 loading 动画。
function PageTransitionLoading({ routeKey }: { routeKey: string }) {
  return (
    <div
      aria-hidden="true"
      className="admin-page-transition-loading"
      data-route-key={routeKey}
      data-slot="page-transition-loading"
    >
      <div className="admin-page-transition-spinner" />
    </div>
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
