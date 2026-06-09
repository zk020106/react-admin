import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useBoolean, useDebounce, useKeyPress } from "ahooks";
import NProgress from "nprogress";
import {
  Bell,
  ArrowLeftToLine,
  ArrowRightLeft,
  ArrowRightToLine,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleUserRound,
  Clock3,
  Copy,
  ExternalLink,
  FoldHorizontal,
  Globe2,
  LayoutGrid,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Maximize2,
  Minimize2,
  Moon,
  PanelsTopLeft,
  Pin,
  PinOff,
  RefreshCcw,
  Search,
  Settings2,
  SquareMenu,
  Sun,
  UserRoundCog,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import {
  getAdminMessages,
  getHeaderAlignOptions,
  getHeaderModeOptions,
  getLocaleOptions,
  getNavigationStyleOptions,
  getPreferenceButtonPositionOptions,
  getPreferenceTabs,
  getTabbarStyleOptions,
} from "@/i18n/admin-i18n";
import { getRouteRefreshQueryKeys } from "@/lib/query-keys";
import {
  ADMIN_DEFAULT_PATH,
  affixTabs,
  getDefaultMenuPath,
  getMenuTitle,
  normalizeAdminPath,
} from "@/router/app-data";
import { createPreferenceStore, preferenceStore } from "@/store/preferences";
import { tabsStore } from "@/store/tabs";
import { applyVbenTheme } from "@/theme";
import type { AdminPreferences, MenuRecord, TabRecord } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  findActiveMenuRecord,
  getMenuRecordIcon,
  getTabIcon,
  hasPageIcon,
  isMenuRecordActive,
} from "@/layouts/navigation";
import { PageSurface } from "@/layouts/page-surface";
import {
  PreferenceBlock,
  PreferenceCheckboxGroup,
  PreferenceNumber,
  PreferenceSegmented,
  PreferenceSelect,
  PreferenceText,
  PreferenceToggle,
} from "@/layouts/preferences-controls";
import {
  getPreferenceDiff,
  preferenceTimezoneOptions,
  resolvePreferencesButtonPlacement,
  type PreferencesButtonPlacement,
} from "@/layouts/preferences-options";
import { ContentModePicker, LayoutModePicker } from "@/layouts/preferences-pickers";
import {
  AppearancePreferences,
  GeneralPreferences,
  ShortcutPreferences,
} from "@/layouts/preferences-sections";
import { navigationQueries } from "@/pages/admin-queries";
import { findMenuTrail, searchMenu } from "@/utils/menu";

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

// 组件：AdminHeader。用于渲染后台顶栏、面包屑、导航和工具按钮。
function AdminHeader({
  activePath,
  hidden,
  activeRootPath,
  isMobile,
  layout,
  menu,
  navigate,
  openLock,
  openPreferences,
  openSearch,
  onRefresh,
  onSelectRoot,
  preferences,
  preferencesButtonPlacement,
  sidebarEnabled,
  setPreferences,
}: {
  activePath: string;
  hidden: boolean;
  activeRootPath: string;
  isMobile: boolean;
  layout: AdminPreferences["layout"];
  menu: MenuRecord[];
  navigate: (path: string) => void;
  openLock: () => void;
  openPreferences: () => void;
  openSearch: () => void;
  onRefresh: () => void;
  onSelectRoot: (item: MenuRecord) => void;
  preferences: AdminPreferences;
  preferencesButtonPlacement: PreferencesButtonPlacement;
  sidebarEnabled: boolean;
  setPreferences: ReturnType<typeof createPreferenceStore>["getState"] extends () => infer State
    ? State extends { setPreferences: infer Setter }
      ? Setter
      : never
    : never;
}) {
  const messages = getAdminMessages(preferences.appLocale);
  const [browserFullscreen, setBrowserFullscreen] = useState(false);
  const rawTrail = findMenuTrail(menu, activePath) ?? [
    { key: activePath, path: activePath, title: getMenuTitle(activePath, menu) },
  ];
  const homeTrail = preferences.breadcrumbShowHome
    ? [
        { key: "__home", path: ADMIN_DEFAULT_PATH, title: messages.common.home },
        ...rawTrail.filter((item) => item.path !== ADMIN_DEFAULT_PATH),
      ]
    : rawTrail;
  const trail = preferences.breadcrumbHideOnlyOne && homeTrail.length <= 1 ? [] : homeTrail;
  const isDark = preferences.colorMode === "dark";
  const headerNavigationEnabled =
    !isMobile && ["header-mixed-nav", "header-nav", "mixed-nav"].includes(layout);
  const headerNavigationRootOnly =
    !isMobile &&
    (layout === "header-mixed-nav" || (layout === "mixed-nav" && preferences.navigationSplit));
  const headerFullWidth = layout === "header-sidebar-nav";
  const headerInlineBrandVisible =
    !isMobile &&
    ["header-mixed-nav", "header-nav", "header-sidebar-nav", "mixed-nav"].includes(layout);
  // 上游布局使用最小宽度保留侧栏空间，同时避免内容被强制裁切。
  const headerInlineBrandStyle =
    layout === "header-sidebar-nav"
      ? ({ minWidth: "var(--admin-header-brand-width)" } as React.CSSProperties)
      : undefined;
  const mobileHeaderLogoVisible = isMobile;
  const headerJustifyClass =
    preferences.headerMenuAlign === "center"
      ? "justify-center"
      : preferences.headerMenuAlign === "end"
        ? "justify-end"
        : "justify-start";
  const fixedHeader = ["auto", "auto-scroll", "fixed"].includes(preferences.headerMode);
  const mobileSidebarTriggerVisible =
    isMobile &&
    sidebarEnabled &&
    preferences.sidebarEnable &&
    !preferences.sidebarHidden &&
    layout !== "full-content";

  useEffect(() => {
    // 函数：handleFullscreenChange。同步浏览器全屏状态到顶栏按钮。
    function handleFullscreenChange() {
      setBrowserFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();

    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 函数：toggleBrowserFullscreen。切换浏览器全屏模式。
  function toggleBrowserFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }

    void document.documentElement.requestFullscreen?.();
  }

  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2 border-b bg-header px-3 text-[hsl(var(--header-foreground,var(--foreground)))] transition-[margin-top,transform] duration-200",
        fixedHeader && "sticky top-0 z-20",
        hidden && "-mt-(--admin-header-height)",
        headerFullWidth && "admin-header-full-width",
      )}
      data-slot="admin-header"
      style={{ height: preferences.headerHeight }}
    >
      {mobileHeaderLogoVisible && (
        <div
          className="flex h-full w-10 shrink-0 items-center justify-center"
          data-slot="admin-header-mobile-brand"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PanelsTopLeft className="size-4" />
          </div>
        </div>
      )}
      {mobileSidebarTriggerVisible && (
        <SidebarTrigger aria-label={messages.header.openMenu} className="md:hidden" />
      )}
      {headerInlineBrandVisible && (
        <>
          <div
            className="hidden shrink-0 items-center gap-2 md:flex"
            data-slot="admin-header-inline-brand"
            style={headerInlineBrandStyle}
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PanelsTopLeft className="size-4" />
            </div>
            <span className="text-sm font-semibold">{messages.common.systemName}</span>
          </div>
          <Separator className="hidden h-5 md:block" orientation="vertical" />
        </>
      )}
      {preferences.widgetRefresh && (
        <HeaderIconButton label={messages.header.refresh} onClick={onRefresh}>
          <RefreshCcw />
        </HeaderIconButton>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="sr-only">{messages.common.systemName}</h1>
        {headerNavigationEnabled ? (
          <HeaderNavigation
            activePath={activePath}
            activeRootPath={activeRootPath}
            className={headerJustifyClass}
            menu={menu}
            navigate={navigate}
            onSelectRoot={onSelectRoot}
            rootOnly={headerNavigationRootOnly}
            showBrand={false}
            systemName={messages.common.systemName}
            topNavigationLabel={messages.header.topNavigation}
          />
        ) : !isMobile && preferences.breadcrumbEnable && trail.length > 0 ? (
          <nav
            aria-label={messages.header.breadcrumb}
            className={cn(
              "hidden items-center gap-1 text-sm text-muted-foreground md:flex",
              preferences.breadcrumbStyleType === "background" && "rounded-md bg-accent px-2 py-1",
            )}
          >
            {trail.map((item, index) => (
              <span className="inline-flex items-center gap-1" key={item.key}>
                {index > 0 && <ChevronRight className="size-3" />}
                {preferences.breadcrumbShowIcon && index === 0 && (
                  <LayoutDashboard className="size-3.5" />
                )}
                <span className={index === trail.length - 1 ? "text-foreground" : ""}>
                  {item.title}
                </span>
              </span>
            ))}
          </nav>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
      </div>
      {preferences.widgetGlobalSearch && (
        <HeaderIconButton label={messages.header.search} onClick={openSearch}>
          <Search />
        </HeaderIconButton>
      )}
      {preferencesButtonPlacement.header && (
        <HeaderIconButton
          dataPreferencesPosition="header"
          label={messages.header.preferences}
          onClick={openPreferences}
        >
          <Settings2 />
        </HeaderIconButton>
      )}
      {preferencesButtonPlacement.header && preferences.widgetThemeToggle && (
        <HeaderIconButton
          label={isDark ? messages.header.lightMode : messages.header.darkMode}
          onClick={() => setPreferences({ colorMode: isDark ? "light" : "dark" })}
        >
          {isDark ? <Sun /> : <Moon />}
        </HeaderIconButton>
      )}
      {preferencesButtonPlacement.header && preferences.widgetLanguageToggle && (
        <LanguageDropdown
          locale={preferences.appLocale}
          setLocale={(appLocale) => setPreferences({ appLocale })}
        />
      )}
      {preferencesButtonPlacement.header && preferences.widgetTimezone && (
        <TimezoneDialogButton
          locale={preferences.appLocale}
          setTimezone={(appTimezone) => setPreferences({ appTimezone })}
          timezone={preferences.appTimezone}
        />
      )}
      {preferences.widgetFullscreen && (
        <HeaderIconButton
          label={browserFullscreen ? messages.header.exitFullscreen : messages.header.fullscreen}
          onClick={toggleBrowserFullscreen}
        >
          {browserFullscreen ? <Minimize2 /> : <Maximize2 />}
        </HeaderIconButton>
      )}
      {preferences.widgetNotification && <NotificationsMenu locale={preferences.appLocale} />}
      <UserMenu
        locale={preferences.appLocale}
        lockScreenEnabled={preferences.widgetLockScreen}
        openLock={openLock}
        openPreferences={openPreferences}
        showPreferencesItem={preferencesButtonPlacement.userDropdown}
      />
    </header>
  );
}

// 组件：HeaderNavigation。用于渲染顶栏导航列表和品牌区域。
function HeaderNavigation({
  activePath,
  activeRootPath,
  className,
  menu,
  navigate,
  onSelectRoot,
  rootOnly = false,
  showBrand = true,
  systemName,
  topNavigationLabel,
}: {
  activePath: string;
  activeRootPath: string;
  className?: string;
  menu: MenuRecord[];
  navigate: (path: string) => void;
  onSelectRoot: (item: MenuRecord) => void;
  rootOnly?: boolean;
  showBrand?: boolean;
  systemName: string;
  topNavigationLabel: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-3", className)}>
      {showBrand && (
        <>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PanelsTopLeft className="size-4" />
            </div>
            <span className="text-sm font-semibold">{systemName}</span>
          </div>
          <Separator className="hidden h-5 md:block" orientation="vertical" />
        </>
      )}
      <nav
        aria-label={topNavigationLabel}
        className="admin-header-nav-scroll flex min-w-0 items-center gap-1 overflow-x-auto overflow-y-hidden"
      >
        {menu.map((item) => (
          <HeaderNavigationItem
            activePath={activePath}
            activeRootPath={activeRootPath}
            item={item}
            key={item.key}
            navigate={navigate}
            onSelectRoot={onSelectRoot}
            rootOnly={rootOnly}
          />
        ))}
      </nav>
    </div>
  );
}

// 组件：HeaderNavigationItem。用于渲染单个顶栏导航项及其子菜单。
function HeaderNavigationItem({
  activePath,
  activeRootPath,
  item,
  navigate,
  onSelectRoot,
  rootOnly,
}: {
  activePath: string;
  activeRootPath: string;
  item: MenuRecord;
  navigate: (path: string) => void;
  onSelectRoot: (item: MenuRecord) => void;
  rootOnly: boolean;
}) {
  const Icon = getMenuRecordIcon(item);
  const children = item.children ?? [];
  const isActive = rootOnly ? activeRootPath === item.path : isMenuRecordActive(item, activePath);

  if (rootOnly || children.length === 0) {
    const targetPath = rootOnly ? getDefaultMenuPath(item) : item.path;

    return (
      <Button
        className={cn(
          "h-8 gap-1.5 px-2 text-muted-foreground",
          isActive && "bg-muted text-foreground",
        )}
        onClick={() => (rootOnly ? onSelectRoot(item) : navigate(targetPath))}
        variant="ghost"
      >
        {Icon && <Icon className="size-4" />}
        <span>{item.title}</span>
        {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
      </Button>
    );
  }

  if (children.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "h-8 gap-1.5 px-2 text-muted-foreground",
              isActive && "bg-muted text-foreground",
            )}
            variant="ghost"
          >
            {Icon && <Icon className="size-4" />}
            <span>{item.title}</span>
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {children.map((child) => {
            const ChildIcon = getMenuRecordIcon(child);
            const childActive = isMenuRecordActive(child, activePath);

            return (
              <DropdownMenuItem asChild key={child.key}>
                <a
                  aria-current={childActive ? "page" : undefined}
                  className={cn(childActive && "bg-accent text-accent-foreground")}
                  href={child.path}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(child.path);
                  }}
                >
                  {ChildIcon && <ChildIcon className="size-4" />}
                  <span>{child.title}</span>
                  {child.badge && (
                    <Badge className="ml-auto" variant="secondary">
                      {child.badge}
                    </Badge>
                  )}
                </a>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}

// 组件：HeaderIconButton。用于渲染顶栏图标按钮并附带悬浮提示。
function HeaderIconButton({
  children,
  dataPreferencesPosition,
  label,
  onClick,
}: {
  children: React.ReactNode;
  dataPreferencesPosition?: AdminPreferences["appPreferencesButtonPosition"];
  label: string;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="admin-header-icon-button"
          data-preferences-position={dataPreferencesPosition}
          onClick={onClick}
          size="icon-sm"
          variant="ghost"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// 组件：LanguageDropdown。用于渲染语言切换下拉菜单。
function LanguageDropdown({
  locale,
  setLocale,
}: {
  locale: string;
  setLocale: (locale: string) => void;
}) {
  const messages = getAdminMessages(locale);
  const localeOptions = getLocaleOptions(locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={messages.header.language}
          className="admin-header-icon-button"
          size="icon-sm"
          variant="ghost"
        >
          <Globe2 />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{messages.header.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup onValueChange={setLocale} value={locale}>
          {localeOptions.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 组件：TimezoneDialogButton。用于打开时区选择弹窗并保存时区。
function TimezoneDialogButton({
  locale,
  setTimezone,
  timezone,
}: {
  locale: string;
  setTimezone: (timezone: string) => void;
  timezone: string;
}) {
  const messages = getAdminMessages(locale);
  const [open, setOpen] = useState(false);
  const [draftTimezone, setDraftTimezone] = useState(timezone);

  // 函数：confirmTimezone。确认并保存时区选择。
  function confirmTimezone() {
    setTimezone(draftTimezone);
    setOpen(false);
  }

  // 函数：openTimezoneDialog。打开时区弹窗并同步当前值到草稿。
  function openTimezoneDialog() {
    setDraftTimezone(timezone);
    setOpen(true);
  }

  return (
    <>
      <HeaderIconButton label={messages.header.timezone} onClick={openTimezoneDialog}>
        <Clock3 />
      </HeaderIconButton>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.header.timezoneTitle}</DialogTitle>
            <DialogDescription>{messages.header.timezoneDescription}</DialogDescription>
          </DialogHeader>
          <RadioGroup className="grid gap-2" onValueChange={setDraftTimezone} value={draftTimezone}>
            {preferenceTimezoneOptions.map((item) => {
              const active = draftTimezone === item.value;

              return (
                <div
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-2 hover:bg-accent",
                    active && "border-primary bg-accent text-accent-foreground",
                  )}
                  key={item.value}
                  onClick={() => setDraftTimezone(item.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDraftTimezone(item.value);
                    }
                  }}
                  role="presentation"
                >
                  <RadioGroupItem aria-label={item.label} value={item.value} />
                  <span className="text-sm">{item.label}</span>
                </div>
              );
            })}
          </RadioGroup>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              {messages.common.cancel}
            </Button>
            <Button onClick={confirmTimezone} type="button">
              {messages.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// 组件：NotificationsMenu。用于渲染顶栏通知入口和通知列表。
function NotificationsMenu({ locale }: { locale: string }) {
  const messages = getAdminMessages(locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={messages.header.notifications}
          className="admin-header-icon-button relative"
          size="icon-sm"
          variant="ghost"
        >
          <Bell />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{messages.header.notifications}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {messages.header.notificationItems.map((item) => (
          <DropdownMenuItem className="items-start gap-2" key={item}>
            <CheckCircle2 className="mt-0.5 size-4 text-primary" />
            <span>{item}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 组件：UserMenu。用于渲染用户下拉菜单及偏好和锁屏入口。
function UserMenu({
  locale,
  lockScreenEnabled,
  openLock,
  openPreferences,
  showPreferencesItem = false,
}: {
  locale: string;
  lockScreenEnabled: boolean;
  openLock: () => void;
  openPreferences: () => void;
  showPreferencesItem?: boolean;
}) {
  const messages = getAdminMessages(locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={messages.header.userMenu}
          className="admin-header-icon-button"
          size="icon-sm"
          variant="ghost"
        >
          <CircleUserRound />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Root Admin</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserRoundCog />
          {messages.header.userProfile}
        </DropdownMenuItem>
        {showPreferencesItem && (
          <DropdownMenuItem data-preferences-position="user-dropdown" onClick={openPreferences}>
            <Settings2 />
            {messages.header.preferences}
          </DropdownMenuItem>
        )}
        {lockScreenEnabled && (
          <DropdownMenuItem onClick={openLock}>
            <LockKeyhole />
            {messages.header.lockScreen}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>
          <LogOut />
          {messages.header.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 组件：Tabbar。用于渲染页面标签栏及其右键菜单操作。
function Tabbar({
  activePath,
  closeAllTabs,
  closeLeftTabs,
  closeOtherTabs,
  closeRightTabs,
  closeTab,
  contentMaximized,
  navigate,
  onRefresh,
  onToggleMaximize,
  preferences,
  tabs,
  toggleTabPin,
}: {
  activePath: string;
  closeAllTabs: () => void;
  closeLeftTabs: (key: string) => void;
  closeOtherTabs: (key: string) => void;
  closeRightTabs: (key: string) => void;
  closeTab: (key: string) => void;
  contentMaximized: boolean;
  navigate: (path: string) => void;
  onRefresh: () => void;
  onToggleMaximize: () => void;
  preferences: AdminPreferences;
  tabs: TabRecord[];
  toggleTabPin: (key: string) => void;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const messages = getAdminMessages(preferences.appLocale);
  const tabbarClass =
    preferences.tabbarStyleType === "card"
      ? "gap-1"
      : preferences.tabbarStyleType === "plain"
        ? "gap-0"
        : "gap-2";

  const visibleTabs = getVisibleTabs(tabs, activePath, preferences.tabbarMaxCount);
  const activeTab = tabs.find((tab) => tab.key === activePath);

  // 函数：handleWheel。把纵向滚轮转换为标签栏横向滚动。
  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!preferences.tabbarWheelable || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.scrollLeft += event.deltaY;
  }

  // 函数：copyTabPath。复制标签页路径到剪贴板。
  function copyTabPath(tab: TabRecord) {
    void navigator.clipboard?.writeText(tab.path);
  }

  // 函数：openTabInNewWindow。在新窗口打开标签页路径。
  function openTabInNewWindow(tab: TabRecord) {
    window.open(tab.path, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="flex items-center gap-2 border-b bg-header px-3"
      style={{ height: preferences.tabbarHeight }}
    >
      <Tabs className="min-w-0 flex-1" onValueChange={navigate} value={activePath}>
        <TabsList
          className={cn(
            "admin-tabs-scroll max-w-full overflow-x-auto overflow-y-hidden",
            tabbarClass,
          )}
          onWheel={handleWheel}
          ref={listRef}
          variant="line"
        >
          {visibleTabs.map((tab) => {
            const tabIndex = tabs.findIndex((item) => item.key === tab.key);
            const canClose = !tab.affix && tabs.length > 1;
            const hasClosableLeft = tabs.slice(0, tabIndex).some((item) => !item.affix);
            const hasClosableRight = tabs.slice(tabIndex + 1).some((item) => !item.affix);
            const hasClosableOther = tabs.some((item) => item.key !== tab.key && !item.affix);
            const Icon = getTabIcon(tab, LayoutDashboard);

            return (
              <ContextMenu key={tab.key} modal={false}>
                <ContextMenuTrigger asChild>
                  <div
                    className="group/tab flex items-center"
                    draggable={preferences.tabbarDraggable && !tab.affix}
                    onDragStart={(event) => {
                      if (!preferences.tabbarDraggable) {
                        return;
                      }

                      event.dataTransfer.setData("text/plain", tab.key);
                    }}
                    onDragOver={(event) => {
                      if (preferences.tabbarDraggable) {
                        event.preventDefault();
                      }
                    }}
                    onDrop={(event) => {
                      if (!preferences.tabbarDraggable) {
                        return;
                      }

                      event.preventDefault();
                      const fromKey = event.dataTransfer.getData("text/plain");
                      const currentTabs = tabsStore.getState().tabs;
                      const fromIndex = currentTabs.findIndex((item) => item.key === fromKey);
                      const toIndex = currentTabs.findIndex((item) => item.key === tab.key);

                      tabsStore.getState().reorderTabs(fromIndex, toIndex);
                    }}
                  >
                    <TabsTrigger
                      className={cn(
                        "h-8 px-2",
                        preferences.tabbarStyleType === "card" && "rounded-md border bg-background",
                        preferences.tabbarStyleType === "brisk" && "h-7",
                      )}
                      onMouseDown={(event) => {
                        if (
                          event.button === 1 &&
                          preferences.tabbarMiddleClickToClose &&
                          !tab.affix
                        ) {
                          event.preventDefault();
                          closeTab(tab.key);
                        }
                      }}
                      value={tab.key}
                    >
                      {preferences.tabbarShowIcon && Icon && <Icon className="size-3.5" />}
                      {tab.title}
                    </TabsTrigger>
                    {!tab.affix && (
                      <Button
                        aria-label={messages.tabbar.closeCurrent.replace("{title}", tab.title)}
                        className="-ml-1 opacity-60 group-hover/tab:opacity-100"
                        onClick={() => closeTab(tab.key)}
                        size="icon-xs"
                        variant="ghost"
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-52">
                  <ContextMenuItem disabled={!canClose} onSelect={() => closeTab(tab.key)}>
                    <X />
                    {messages.tabbar.close}
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => toggleTabPin(tab.key)}>
                    {tab.affix ? <PinOff /> : <Pin />}
                    {tab.affix ? messages.tabbar.unpin : messages.tabbar.pin}
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={onToggleMaximize}>
                    {contentMaximized ? <Minimize2 /> : <Maximize2 />}
                    {contentMaximized ? messages.tabbar.restoreMaximize : messages.tabbar.maximize}
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={onRefresh}>
                    <RefreshCcw />
                    {messages.tabbar.refresh}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => openTabInNewWindow(tab)}>
                    <ExternalLink />
                    {messages.tabbar.openNewWindow}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    disabled={!hasClosableLeft}
                    onSelect={() => closeLeftTabs(tab.key)}
                  >
                    <ArrowLeftToLine />
                    {messages.tabbar.closeLeft}
                  </ContextMenuItem>
                  <ContextMenuItem
                    disabled={!hasClosableRight}
                    onSelect={() => closeRightTabs(tab.key)}
                  >
                    <ArrowRightToLine />
                    {messages.tabbar.closeRight}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    disabled={!hasClosableOther}
                    onSelect={() => closeOtherTabs(tab.key)}
                  >
                    <FoldHorizontal />
                    {messages.tabbar.closeOther}
                  </ContextMenuItem>
                  <ContextMenuItem
                    disabled={!tabs.some((item) => !item.affix)}
                    onSelect={closeAllTabs}
                  >
                    <ArrowRightLeft />
                    {messages.tabbar.closeAll}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => copyTabPath(tab)}>
                    <Copy />
                    {messages.tabbar.copyPath}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </TabsList>
      </Tabs>
      {preferences.tabbarShowMore && activeTab && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={messages.tabbar.more}
              className="admin-tabbar-tool"
              size="icon-sm"
              variant="ghost"
            >
              <LayoutGrid />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => copyTabPath(activeTab)}>
              <Copy />
              {messages.tabbar.copyPath}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openTabInNewWindow(activeTab)}>
              <ExternalLink />
              {messages.tabbar.openNewWindow}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {preferences.tabbarShowRefresh && (
        <Button
          aria-label={messages.tabbar.refreshCurrent}
          className="admin-tabbar-tool"
          onClick={onRefresh}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <RefreshCcw />
        </Button>
      )}
      {preferences.tabbarShowMaximize && (
        <Button
          aria-label={
            contentMaximized ? messages.tabbar.restoreContent : messages.tabbar.maximizeContent
          }
          className="admin-tabbar-tool"
          onClick={onToggleMaximize}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          {contentMaximized ? <Minimize2 /> : <Maximize2 />}
        </Button>
      )}
    </div>
  );
}

// 函数：getVisibleTabs。按最大显示数量裁剪标签并保留当前激活标签。
function getVisibleTabs(tabs: TabRecord[], activePath: string, maxCount: number) {
  if (maxCount <= 0 || tabs.length <= maxCount) {
    return tabs;
  }

  const latestTabs = tabs.slice(-maxCount);

  if (latestTabs.some((tab) => tab.key === activePath)) {
    return latestTabs;
  }

  const activeTab = tabs.find((tab) => tab.key === activePath);

  if (!activeTab) {
    return latestTabs;
  }

  return [...latestTabs.slice(1), activeTab];
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

// 组件：PreferencesSheet。用于渲染偏好设置抽屉和全部配置面板。
function PreferencesSheet({
  onOpenChange,
  open,
  preferences,
  resetPreferences,
  setPreferences,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  preferences: AdminPreferences;
  resetPreferences: () => void;
  setPreferences: ReturnType<typeof preferenceStore.getState>["setPreferences"];
}) {
  const messages = getAdminMessages(preferences.appLocale);
  const preferenceTabs = getPreferenceTabs(preferences.appLocale);
  const headerModeOptions = getHeaderModeOptions(preferences.appLocale);
  const headerAlignOptions = getHeaderAlignOptions(preferences.appLocale);
  const navigationStyleOptions = getNavigationStyleOptions(preferences.appLocale);
  const tabbarStyleOptions = getTabbarStyleOptions(preferences.appLocale);
  const preferenceButtonPositionOptions = getPreferenceButtonPositionOptions(preferences.appLocale);
  const breadcrumbStyleOptions: Array<{
    label: string;
    value: AdminPreferences["breadcrumbStyleType"];
  }> = [
    { label: messages.common.normal, value: "normal" },
    { label: messages.common.background, value: "background" },
  ];
  const preferenceDiff = useMemo(() => getPreferenceDiff(preferences), [preferences]);
  const hasPreferenceDiff = Object.keys(preferenceDiff).length > 0;

  // 函数：copyPreferences。复制当前与默认值不同的偏好配置。
  async function copyPreferences() {
    if (!hasPreferenceDiff) {
      return;
    }

    await navigator.clipboard?.writeText(JSON.stringify(preferenceDiff, null, 2));
  }

  const isFullContent = preferences.layout === "full-content";
  const isSideMode = [
    "header-mixed-nav",
    "header-sidebar-nav",
    "mixed-nav",
    "sidebar-mixed-nav",
    "sidebar-nav",
  ].includes(preferences.layout);
  const isMixedLike = ["header-mixed-nav", "mixed-nav", "sidebar-mixed-nav"].includes(
    preferences.layout,
  );
  const breadcrumbDisabled =
    isFullContent ||
    !["header-sidebar-nav", "sidebar-mixed-nav", "sidebar-nav"].includes(preferences.layout);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-[390px] gap-0 sm:max-w-[390px]">
        <SheetHeader className="pr-20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>{messages.preferences.title}</SheetTitle>
              <SheetDescription>{messages.preferences.description}</SheetDescription>
            </div>
            <div className="absolute top-3 right-11 flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={messages.preferences.actions.reset}
                    className="relative"
                    disabled={!hasPreferenceDiff}
                    onClick={resetPreferences}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    {hasPreferenceDiff && (
                      <span className="absolute top-1 right-1 size-1.5 rounded-sm bg-primary" />
                    )}
                    <RefreshCcw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{messages.preferences.actions.resetTooltip}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={
                      preferences.appEnableStickyPreferencesNavigationBar
                        ? messages.preferences.actions.unpinNavigation
                        : messages.preferences.actions.pinNavigation
                    }
                    onClick={() =>
                      setPreferences({
                        appEnableStickyPreferencesNavigationBar:
                          !preferences.appEnableStickyPreferencesNavigationBar,
                      })
                    }
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    {preferences.appEnableStickyPreferencesNavigationBar ? <PinOff /> : <Pin />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {preferences.appEnableStickyPreferencesNavigationBar
                    ? messages.preferences.actions.unpinNavigation
                    : messages.preferences.actions.pinNavigation}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SheetHeader>
        <Tabs className="min-h-0 flex-1 gap-0" defaultValue="appearance">
          <div className="px-4 pb-3">
            <TabsList
              className={cn(
                "grid h-9 w-full",
                preferences.appEnableStickyPreferencesNavigationBar && "sticky top-0 z-20",
              )}
              style={{ gridTemplateColumns: `repeat(${preferenceTabs.length}, minmax(0, 1fr))` }}
            >
              {preferenceTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <ScrollArea className="min-h-0 flex-1 px-4">
            <TabsContent className="m-0 pb-6" value="appearance">
              <AppearancePreferences preferences={preferences} setPreferences={setPreferences} />
            </TabsContent>
            <TabsContent className="m-0 pb-6" value="layout">
              <PreferenceBlock title={messages.preferences.layout.layout}>
                <LayoutModePicker
                  locale={preferences.appLocale}
                  layout={preferences.layout}
                  setLayout={(layout) =>
                    setPreferences({
                      layout,
                      sidebarHidden:
                        layout === "sidebar-mixed-nav" ? false : preferences.sidebarHidden,
                    })
                  }
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.layout.content}>
                <ContentModePicker
                  locale={preferences.appLocale}
                  mode={preferences.contentCompact}
                  setMode={(contentCompact) => setPreferences({ contentCompact })}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.sidebar.title}>
                <PreferenceToggle
                  checked={preferences.sidebarEnable}
                  disabled={!isSideMode}
                  label={messages.preferences.sidebar.enable}
                  onCheckedChange={(sidebarEnable) => setPreferences({ sidebarEnable })}
                />
                <PreferenceToggle
                  checked={preferences.sidebarDraggable}
                  disabled={!preferences.sidebarEnable || !isSideMode}
                  label={messages.preferences.sidebar.draggable}
                  onCheckedChange={(sidebarDraggable) => setPreferences({ sidebarDraggable })}
                />
                <PreferenceToggle
                  checked={preferences.sidebarCollapsed}
                  disabled={!preferences.sidebarEnable || !isSideMode}
                  label={messages.preferences.sidebar.defaultCollapsed}
                  onCheckedChange={(sidebarCollapsed) => setPreferences({ sidebarCollapsed })}
                />
                <PreferenceToggle
                  checked={preferences.sidebarExpandOnHover}
                  disabled={
                    !preferences.sidebarEnable || !preferences.sidebarCollapsed || !isSideMode
                  }
                  label={messages.preferences.sidebar.expandOnHover}
                  onCheckedChange={(sidebarExpandOnHover) =>
                    setPreferences({ sidebarExpandOnHover })
                  }
                />
                <PreferenceToggle
                  checked={preferences.sidebarCollapsedShowTitle}
                  disabled={
                    !preferences.sidebarEnable || !preferences.sidebarCollapsed || !isSideMode
                  }
                  label={messages.preferences.sidebar.collapsedShowTitle}
                  onCheckedChange={(sidebarCollapsedShowTitle) =>
                    setPreferences({ sidebarCollapsedShowTitle })
                  }
                />
                <PreferenceToggle
                  checked={preferences.sidebarAutoActivateChild}
                  disabled={!preferences.sidebarEnable || !isMixedLike}
                  label={messages.preferences.sidebar.autoActivateChild}
                  onCheckedChange={(sidebarAutoActivateChild) =>
                    setPreferences({ sidebarAutoActivateChild })
                  }
                />
                <PreferenceCheckboxGroup
                  disabled={!preferences.sidebarEnable || !isSideMode}
                  items={[
                    { label: messages.preferences.sidebar.collapsedButton, value: "collapsed" },
                    { label: messages.preferences.sidebar.fixedButton, value: "fixed" },
                  ]}
                  label={messages.preferences.sidebar.buttons}
                  onValuesChange={(values) =>
                    setPreferences({
                      sidebarCollapsedButton: values.includes("collapsed"),
                      sidebarFixedButton: values.includes("fixed"),
                    })
                  }
                  values={[
                    ...(preferences.sidebarCollapsedButton ? ["collapsed"] : []),
                    ...(preferences.sidebarFixedButton ? ["fixed"] : []),
                  ]}
                />
                <PreferenceNumber
                  disabled={!preferences.sidebarEnable || !isSideMode}
                  label={messages.preferences.sidebar.width}
                  locale={preferences.appLocale}
                  max={320}
                  min={160}
                  onValueChange={(sidebarWidth) => setPreferences({ sidebarWidth })}
                  step={10}
                  value={preferences.sidebarWidth}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.header.title}>
                <PreferenceToggle
                  checked={preferences.headerVisible}
                  disabled={isFullContent}
                  label={messages.preferences.header.visible}
                  onCheckedChange={(headerVisible) => setPreferences({ headerVisible })}
                />
                <PreferenceSelect
                  disabled={!preferences.headerVisible || isFullContent}
                  items={headerModeOptions}
                  label={messages.preferences.header.mode}
                  onValueChange={(headerMode) => setPreferences({ headerMode })}
                  value={preferences.headerMode}
                />
                <PreferenceSegmented
                  disabled={!preferences.headerVisible || isFullContent}
                  items={headerAlignOptions}
                  label={messages.preferences.header.align}
                  onValueChange={(headerMenuAlign) => setPreferences({ headerMenuAlign })}
                  value={preferences.headerMenuAlign}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.navigation.title}>
                <PreferenceSegmented
                  disabled={isFullContent}
                  items={navigationStyleOptions}
                  label={messages.preferences.navigation.style}
                  onValueChange={(navigationStyleType) => setPreferences({ navigationStyleType })}
                  value={preferences.navigationStyleType}
                />
                <PreferenceToggle
                  checked={preferences.navigationSplit}
                  disabled={preferences.layout !== "mixed-nav" || isFullContent}
                  label={messages.preferences.navigation.split}
                  onCheckedChange={(navigationSplit) => setPreferences({ navigationSplit })}
                />
                <PreferenceToggle
                  checked={preferences.navigationAccordion}
                  disabled={isFullContent}
                  label={messages.preferences.navigation.accordion}
                  onCheckedChange={(navigationAccordion) => setPreferences({ navigationAccordion })}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.breadcrumb.title}>
                <PreferenceToggle
                  checked={preferences.breadcrumbEnable}
                  disabled={breadcrumbDisabled}
                  label={messages.preferences.breadcrumb.enable}
                  onCheckedChange={(breadcrumbEnable) => setPreferences({ breadcrumbEnable })}
                />
                <PreferenceToggle
                  checked={preferences.breadcrumbHideOnlyOne}
                  disabled={breadcrumbDisabled || !preferences.breadcrumbEnable}
                  label={messages.preferences.breadcrumb.hideOnlyOne}
                  onCheckedChange={(breadcrumbHideOnlyOne) =>
                    setPreferences({ breadcrumbHideOnlyOne })
                  }
                />
                <PreferenceToggle
                  checked={preferences.breadcrumbShowIcon}
                  disabled={breadcrumbDisabled || !preferences.breadcrumbEnable}
                  label={messages.preferences.breadcrumb.showIcon}
                  onCheckedChange={(breadcrumbShowIcon) => setPreferences({ breadcrumbShowIcon })}
                />
                <PreferenceToggle
                  checked={preferences.breadcrumbShowHome}
                  disabled={
                    breadcrumbDisabled ||
                    !preferences.breadcrumbEnable ||
                    !preferences.breadcrumbShowIcon
                  }
                  label={messages.preferences.breadcrumb.showHome}
                  onCheckedChange={(breadcrumbShowHome) => setPreferences({ breadcrumbShowHome })}
                />
                <PreferenceSegmented
                  disabled={breadcrumbDisabled || !preferences.breadcrumbEnable}
                  items={breadcrumbStyleOptions}
                  label={messages.preferences.breadcrumb.style}
                  onValueChange={(breadcrumbStyleType) => setPreferences({ breadcrumbStyleType })}
                  value={preferences.breadcrumbStyleType}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.tabbar.title}>
                <PreferenceToggle
                  checked={preferences.tabbarEnable}
                  label={messages.preferences.tabbar.enable}
                  onCheckedChange={(tabbarEnable) => setPreferences({ tabbarEnable })}
                />
                <PreferenceToggle
                  checked={preferences.tabbarShowIcon}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.showIcon}
                  onCheckedChange={(tabbarShowIcon) => setPreferences({ tabbarShowIcon })}
                />
                <PreferenceToggle
                  checked={preferences.tabbarPersist}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.persist}
                  onCheckedChange={(tabbarPersist) => setPreferences({ tabbarPersist })}
                />
                <PreferenceToggle
                  checked={preferences.tabbarVisitHistory}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.visitHistory}
                  onCheckedChange={(tabbarVisitHistory) => setPreferences({ tabbarVisitHistory })}
                />
                <PreferenceToggle
                  checked={preferences.tabbarDraggable}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.draggable}
                  onCheckedChange={(tabbarDraggable) => setPreferences({ tabbarDraggable })}
                />
                <PreferenceToggle
                  checked={preferences.tabbarWheelable}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.wheelable}
                  onCheckedChange={(tabbarWheelable) => setPreferences({ tabbarWheelable })}
                />
                <PreferenceToggle
                  checked={preferences.tabbarMiddleClickToClose}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.middleClick}
                  onCheckedChange={(tabbarMiddleClickToClose) =>
                    setPreferences({ tabbarMiddleClickToClose })
                  }
                />
                <PreferenceToggle
                  checked={preferences.tabbarShowMore}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.showMore}
                  onCheckedChange={(tabbarShowMore) => setPreferences({ tabbarShowMore })}
                />
                <PreferenceToggle
                  checked={preferences.tabbarShowRefresh}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.showRefresh}
                  onCheckedChange={(tabbarShowRefresh) => setPreferences({ tabbarShowRefresh })}
                />
                <PreferenceToggle
                  checked={preferences.tabbarShowMaximize}
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.showMaximize}
                  onCheckedChange={(tabbarShowMaximize) => setPreferences({ tabbarShowMaximize })}
                />
                <PreferenceSelect
                  disabled={!preferences.tabbarEnable}
                  items={tabbarStyleOptions}
                  label={messages.preferences.tabbar.style}
                  onValueChange={(tabbarStyleType) => setPreferences({ tabbarStyleType })}
                  value={preferences.tabbarStyleType}
                />
                <PreferenceNumber
                  disabled={!preferences.tabbarEnable}
                  label={messages.preferences.tabbar.maxCount}
                  locale={preferences.appLocale}
                  max={30}
                  min={0}
                  onValueChange={(tabbarMaxCount) => setPreferences({ tabbarMaxCount })}
                  step={5}
                  value={preferences.tabbarMaxCount}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.widgets.title}>
                <PreferenceToggle
                  checked={preferences.widgetGlobalSearch}
                  label={messages.preferences.widgets.globalSearch}
                  onCheckedChange={(widgetGlobalSearch) => setPreferences({ widgetGlobalSearch })}
                />
                <PreferenceToggle
                  checked={preferences.widgetThemeToggle}
                  label={messages.preferences.widgets.theme}
                  onCheckedChange={(widgetThemeToggle) => setPreferences({ widgetThemeToggle })}
                />
                <PreferenceToggle
                  checked={preferences.widgetLanguageToggle}
                  label={messages.preferences.widgets.language}
                  onCheckedChange={(widgetLanguageToggle) =>
                    setPreferences({ widgetLanguageToggle })
                  }
                />
                <PreferenceToggle
                  checked={preferences.widgetFullscreen}
                  label={messages.preferences.widgets.fullscreen}
                  onCheckedChange={(widgetFullscreen) => setPreferences({ widgetFullscreen })}
                />
                <PreferenceToggle
                  checked={preferences.widgetNotification}
                  label={messages.preferences.widgets.notification}
                  onCheckedChange={(widgetNotification) => setPreferences({ widgetNotification })}
                />
                <PreferenceToggle
                  checked={preferences.widgetLockScreen}
                  label={messages.preferences.widgets.lockScreen}
                  onCheckedChange={(widgetLockScreen) => setPreferences({ widgetLockScreen })}
                />
                <PreferenceToggle
                  checked={preferences.widgetSidebarToggle}
                  label={messages.preferences.widgets.sidebarToggle}
                  onCheckedChange={(widgetSidebarToggle) => setPreferences({ widgetSidebarToggle })}
                />
                <PreferenceToggle
                  checked={preferences.widgetRefresh}
                  label={messages.preferences.widgets.refresh}
                  onCheckedChange={(widgetRefresh) => setPreferences({ widgetRefresh })}
                />
                <PreferenceToggle
                  checked={preferences.widgetTimezone}
                  label={messages.preferences.widgets.timezone}
                  onCheckedChange={(widgetTimezone) => setPreferences({ widgetTimezone })}
                />
                <PreferenceSelect
                  items={preferenceButtonPositionOptions}
                  label={messages.preferences.widgets.preferencesButtonPosition}
                  onValueChange={(appPreferencesButtonPosition) =>
                    setPreferences({ appPreferencesButtonPosition })
                  }
                  value={preferences.appPreferencesButtonPosition}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.footer.title}>
                <PreferenceToggle
                  checked={preferences.footerEnable}
                  label={messages.preferences.footer.enable}
                  onCheckedChange={(footerEnable) => setPreferences({ footerEnable })}
                />
                <PreferenceToggle
                  checked={preferences.footerFixed}
                  disabled={!preferences.footerEnable}
                  label={messages.preferences.footer.fixed}
                  onCheckedChange={(footerFixed) => setPreferences({ footerFixed })}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.copyright.title}>
                <PreferenceToggle
                  checked={preferences.copyrightEnable}
                  disabled={!preferences.footerEnable}
                  label={messages.preferences.copyright.enable}
                  onCheckedChange={(copyrightEnable) => setPreferences({ copyrightEnable })}
                />
                <PreferenceText
                  disabled={!preferences.footerEnable || !preferences.copyrightEnable}
                  label={messages.preferences.copyright.companyName}
                  onValueChange={(copyrightCompanyName) => setPreferences({ copyrightCompanyName })}
                  value={preferences.copyrightCompanyName}
                />
                <PreferenceText
                  disabled={!preferences.footerEnable || !preferences.copyrightEnable}
                  label={messages.preferences.copyright.companyLink}
                  onValueChange={(copyrightCompanySiteLink) =>
                    setPreferences({ copyrightCompanySiteLink })
                  }
                  value={preferences.copyrightCompanySiteLink}
                />
                <PreferenceText
                  disabled={!preferences.footerEnable || !preferences.copyrightEnable}
                  label={messages.preferences.copyright.date}
                  onValueChange={(copyrightDate) => setPreferences({ copyrightDate })}
                  value={preferences.copyrightDate}
                />
                <PreferenceText
                  disabled={!preferences.footerEnable || !preferences.copyrightEnable}
                  label={messages.preferences.copyright.icp}
                  onValueChange={(copyrightIcp) => setPreferences({ copyrightIcp })}
                  value={preferences.copyrightIcp}
                />
                <PreferenceText
                  disabled={!preferences.footerEnable || !preferences.copyrightEnable}
                  label={messages.preferences.copyright.icpLink}
                  onValueChange={(copyrightIcpLink) => setPreferences({ copyrightIcpLink })}
                  value={preferences.copyrightIcpLink}
                />
              </PreferenceBlock>
            </TabsContent>
            <TabsContent className="m-0 pb-6" value="shortcut">
              <ShortcutPreferences preferences={preferences} setPreferences={setPreferences} />
            </TabsContent>
            <TabsContent className="m-0 pb-6" value="general">
              <GeneralPreferences preferences={preferences} setPreferences={setPreferences} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <div
          className={cn(
            "grid gap-3 border-t p-4",
            preferences.appEnableCopyPreferences ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {preferences.appEnableCopyPreferences && (
            <Button
              disabled={!hasPreferenceDiff}
              onClick={() => void copyPreferences()}
              variant="default"
            >
              <Copy />
              {messages.preferences.actions.copy}
            </Button>
          )}
          <Button disabled={!hasPreferenceDiff} onClick={resetPreferences} variant="ghost">
            {messages.preferences.actions.clearCacheLogout}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// 组件：GlobalSearchDialog。用于提供菜单路由的全局搜索弹窗。
function GlobalSearchDialog({
  locale,
  menu,
  navigate,
  onOpenChange,
  open,
}: {
  locale: string;
  menu: MenuRecord[];
  navigate: (path: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const messages = getAdminMessages(locale);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, { wait: 120 });
  const defaultSearchTerm = getMenuTitle(ADMIN_DEFAULT_PATH, menu);
  const results = debouncedQuery
    ? searchMenu(menu, debouncedQuery)
    : searchMenu(menu, defaultSearchTerm);

  return (
    <CommandDialog onOpenChange={onOpenChange} open={open} title={messages.search.title}>
      <Command>
        <CommandInput
          onValueChange={setQuery}
          placeholder={messages.search.placeholder}
          value={query}
        />
        <CommandList>
          <CommandEmpty>{messages.search.empty}</CommandEmpty>
          <CommandGroup heading={messages.search.group}>
            {results.map((item) => (
              <CommandItem
                key={item.key}
                onSelect={() => {
                  navigate(item.path);
                  onOpenChange(false);
                }}
              >
                <Search className="size-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

// 组件：LockScreenSetupDialog。用于设置本次会话的锁屏密码。
function LockScreenSetupDialog({
  locale,
  onOpenChange,
  onSubmit,
  open,
}: {
  locale: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  open: boolean;
}) {
  const messages = getAdminMessages(locale);
  const [password, setPassword] = useState("");

  // 函数：handleOpenChange。同步锁屏设置弹窗显隐并在关闭时清空密码。
  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setPassword("");
    }
  }

  // 函数：handleSubmit。提交锁屏密码并重置输入框。
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim()) {
      return;
    }

    onSubmit(password);
    setPassword("");
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.lock.title}</DialogTitle>
          <DialogDescription>{messages.lock.description}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <div className="flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-accent text-muted-foreground">
                <CircleUserRound className="size-10" />
              </div>
            </div>
            <Label htmlFor="lock-screen-password">{messages.lock.password}</Label>
            <Input
              autoFocus
              id="lock-screen-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={messages.lock.placeholder}
              type="password"
              value={password}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
              {messages.common.cancel}
            </Button>
            <Button disabled={!password.trim()} type="submit">
              {messages.lock.title}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 组件：LockScreenOverlay。用于渲染锁屏界面并处理解锁表单。
function LockScreenOverlay({
  locale,
  onUnlock,
  password,
  timezone,
}: {
  locale: string;
  onUnlock: () => void;
  password: string;
  timezone: string;
}) {
  const messages = getAdminMessages(locale);
  const [now, setNow] = useState(() => new Date());
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const timer = window.setInterval(() => setNow(new Date()), 1000);

    document.body.style.overflow = "hidden";

    return () => {
      window.clearInterval(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const hour = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(now);
  const minute = new Intl.DateTimeFormat("en-US", {
    minute: "2-digit",
    timeZone: timezone,
  }).format(now);
  const meridiem =
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      hour12: true,
      timeZone: timezone,
    })
      .formatToParts(now)
      .find((part) => part.type === "dayPeriod")?.value ?? "";
  const date = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
  }).format(now);

  // 函数：openUnlockForm。进入锁屏解锁表单。
  function openUnlockForm() {
    setError("");
    setShowUnlockForm(true);
  }

  // 函数：closeUnlockForm。关闭解锁表单并清理输入状态。
  function closeUnlockForm() {
    setError("");
    setUnlockPassword("");
    setShowUnlockForm(false);
  }

  // 函数：handleUnlock。校验锁屏密码并在通过后解锁。
  function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (unlockPassword === password) {
      onUnlock();
      return;
    }

    setError(messages.lock.error);
  }

  return (
    <div
      aria-labelledby="lock-screen-title"
      aria-modal="true"
      className="fixed inset-0 z-[2000] bg-background text-foreground"
      role="dialog"
    >
      <h2 className="sr-only" id="lock-screen-title">
        {messages.lock.screenTitle}
      </h2>
      {!showUnlockForm ? (
        <div className="size-full">
          <button
            className="group fixed top-6 left-1/2 z-[2001] flex -translate-x-1/2 flex-col items-center gap-1 text-xl font-semibold text-foreground/80 transition-colors hover:text-foreground"
            onClick={openUnlockForm}
            type="button"
          >
            <LockKeyhole className="size-5 transition-transform group-hover:scale-125" />
            <span>{messages.lock.unlock}</span>
          </button>
          <div className="flex size-full items-center justify-center">
            <div className="flex w-full justify-center gap-4 px-4 sm:gap-6 md:gap-8">
              <div className="relative flex h-35 w-35 items-center justify-center rounded-xl bg-accent text-[36px] font-medium sm:h-40 sm:w-40 sm:text-[42px] md:h-50 md:w-50 md:text-[72px]">
                <span className="absolute top-3 left-3 text-xs font-semibold sm:text-sm md:text-xl">
                  {meridiem}
                </span>
                {hour}
              </div>
              <div className="flex h-35 w-35 items-center justify-center rounded-xl bg-accent text-[36px] font-medium sm:h-40 sm:w-40 sm:text-[42px] md:h-50 md:w-50 md:text-[72px]">
                {minute}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form className="flex size-full items-center justify-center" onSubmit={handleUnlock}>
          <div className="mb-10 flex w-[90%] max-w-75 flex-col items-center px-4">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-accent text-muted-foreground">
              <CircleUserRound className="size-10" />
            </div>
            <div className="mb-2 w-full">
              <Label className="sr-only" htmlFor="lock-screen-unlock-password">
                {messages.lock.password}
              </Label>
              <Input
                autoFocus
                id="lock-screen-unlock-password"
                onChange={(event) => {
                  setError("");
                  setUnlockPassword(event.target.value);
                }}
                placeholder={messages.lock.placeholder}
                type="password"
                value={unlockPassword}
              />
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
            <Button className="w-full" type="submit">
              {messages.lock.submit}
            </Button>
            <Button className="my-2 w-full" onClick={closeUnlockForm} type="button" variant="ghost">
              {messages.lock.back}
            </Button>
          </div>
        </form>
      )}
      <div className="absolute bottom-5 w-full text-center text-xl md:text-2xl xl:text-xl 2xl:text-3xl">
        {showUnlockForm && (
          <div className="mb-2 text-2xl md:text-3xl">
            {hour}:{minute} <span className="text-base md:text-lg">{meridiem}</span>
          </div>
        )}
        <div className="text-xl md:text-3xl">{date}</div>
      </div>
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
