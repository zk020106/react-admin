import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { TinyColor } from "@ctrl/tinycolor";
import { useBoolean, useDebounce, useKeyPress } from "ahooks";
import NProgress from "nprogress";
import {
  Bell,
  BriefcaseBusiness,
  ArrowLeftToLine,
  ArrowRightLeft,
  ArrowRightToLine,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleUserRound,
  Clock3,
  Copy,
  ExternalLink,
  FileClock,
  FoldHorizontal,
  Globe2,
  LayoutGrid,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Maximize2,
  Minimize2,
  Moon,
  MoonStar,
  PanelsTopLeft,
  PencilLine,
  Pin,
  PinOff,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  SquareMenu,
  Sun,
  SunMoon,
  UserRoundCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";

import {
  getAdminMessages,
  getColorModeOptions,
  getContentOptions,
  getHeaderAlignOptions,
  getHeaderModeOptions,
  getLayoutOptions,
  getLocaleOptions,
  getNavigationStyleOptions,
  getPreferenceButtonPositionOptions,
  getPreferenceStepAria,
  getPreferenceTabs,
  getTabbarStyleOptions,
  getThemePresetLabel,
} from "@/i18n/admin-i18n";
import {
  affixTabs,
  adminMenu,
  getDefaultMenuPath,
  getMenuTitle,
  localizeMenu,
  localizeTabs,
  normalizeAdminPath,
} from "@/router/app-data";
import { createPreferenceStore, DEFAULT_PREFERENCES, preferenceStore } from "@/store/preferences";
import { tabsStore } from "@/store/tabs";
import { applyVbenTheme, BUILT_IN_THEME_PRESETS } from "@/theme";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { findMenuTrail, searchMenu } from "@/utils/menu";

const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const WorkplacePage = lazy(() => import("@/pages/workplace-page"));
const UsersPage = lazy(() =>
  import("@/pages/system-pages").then((module) => ({ default: module.UsersPage })),
);
const RolesPage = lazy(() =>
  import("@/pages/system-pages").then((module) => ({ default: module.RolesPage })),
);
const AuditPage = lazy(() =>
  import("@/pages/system-pages").then((module) => ({ default: module.AuditPage })),
);
const PopupLab = lazy(() =>
  import("@/pages/effects-pages").then((module) => ({ default: module.PopupLab })),
);
const SchemaFormPanel = lazy(() =>
  import("@/pages/effects-pages").then((module) => ({ default: module.SchemaFormPanel })),
);
const IframePanel = lazy(() =>
  import("@/pages/effects-pages").then((module) => ({ default: module.IframePanel })),
);

const iconMap: Record<string, LucideIcon> = {
  BriefcaseBusiness,
  LayoutDashboard,
  PanelsTopLeft,
  Shield,
};

const pageIconMap: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/effects/form": PanelsTopLeft,
  "/effects/iframe": PanelsTopLeft,
  "/effects/modal": PanelsTopLeft,
  "/system/audit": FileClock,
  "/system/roles": Shield,
  "/system/users": Users,
  "/workplace": BriefcaseBusiness,
};

const colorModeIcons: Record<AdminPreferences["colorMode"], LucideIcon> = {
  dark: MoonStar,
  light: Sun,
  system: SunMoon,
};

const radiusOptions = ["0", "0.25", "0.5", "0.75", "1"];

const timezoneOptions = [
  { label: "Asia/Shanghai", value: "Asia/Shanghai" },
  { label: "UTC", value: "UTC" },
  { label: "America/New_York", value: "America/New_York" },
  { label: "Europe/London", value: "Europe/London" },
];

const transitionOptions: Array<{ label: string; value: AdminPreferences["transitionName"] }> = [
  { label: "fade", value: "fade" },
  { label: "fade-slide", value: "fade-slide" },
  { label: "fade-up", value: "fade-up" },
  { label: "fade-down", value: "fade-down" },
];

type PreferencesButtonPlacement = {
  fixed: boolean;
  header: boolean;
  userDropdown: boolean;
};

function resolveTab(path: string, locale = "zh-CN"): TabRecord {
  const title = getMenuTitle(path, locale);
  return {
    affix: path === "/dashboard",
    icon: pageIconMap[path] ? path : undefined,
    key: path,
    path,
    title,
  };
}

function getRootMenu(path: string, menu: MenuRecord[] = adminMenu) {
  return findMenuTrail(menu, path)?.[0] ?? menu.find((item) => item.path === path) ?? menu[0];
}

function findRootMenuInScope(menu: MenuRecord[], path: string) {
  return menu.find((item) => isMenuRecordActive(item, path));
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolvePreferencesButtonPlacement({
  headerEnabled,
  isMobile,
  preferences,
  sidebarEnabled,
}: {
  headerEnabled: boolean;
  isMobile: boolean;
  preferences: AdminPreferences;
  sidebarEnabled: boolean;
}): PreferencesButtonPlacement {
  const position = preferences.appPreferencesButtonPosition;

  if (position !== "auto") {
    return {
      fixed: position === "fixed",
      header: position === "header",
      userDropdown: position === "user-dropdown",
    };
  }

  const contentIsMaximized = !headerEnabled && !sidebarEnabled;
  const fixed =
    contentIsMaximized || preferences.layout === "full-content" || isMobile || !headerEnabled;

  return {
    fixed,
    header: !fixed,
    userDropdown: false,
  };
}

function AdminWorkspace() {
  const queryClient = useQueryClient();
  const preferences = useStore(preferenceStore, (state) => state.preferences);
  const setPreferences = useStore(preferenceStore, (state) => state.setPreferences);
  const tabs = useStore(tabsStore, (state) => state.tabs);
  const routePathname = useLocation({ select: (location) => location.pathname });
  const routerNavigate = useNavigate();
  const activePath = useMemo(() => normalizeAdminPath(routePathname), [routePathname]);
  const lastActiveByRootRef = useRef<Record<string, string>>({});
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
  const initialLocaleRef = useRef(preferences.appLocale);
  const messages = useMemo(() => getAdminMessages(preferences.appLocale), [preferences.appLocale]);
  const localizedMenu = useMemo(
    () => localizeMenu(adminMenu, preferences.appLocale),
    [preferences.appLocale],
  );
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
    const initialLocale = initialLocaleRef.current;
    const localizedAffixTabs = localizeTabs(affixTabs, initialLocale);

    tabsStore.setState({
      activeKey: localizedAffixTabs[0]?.key,
      tabs: localizedAffixTabs,
    });
    tabsStore.getState().openTab(resolveTab("/dashboard", initialLocale));
  }, []);

  useEffect(() => {
    const current = tabsStore.getState();

    tabsStore.setState({
      tabs: current.tabs.map((tab) => ({
        ...tab,
        title: getMenuTitle(tab.path, preferences.appLocale),
      })),
    });
  }, [preferences.appLocale]);

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
      ? `${getMenuTitle(activePath, preferences.appLocale)} - ${messages.common.systemName}`
      : messages.common.systemName;
  }, [activePath, messages.common.systemName, preferences.appDynamicTitle, preferences.appLocale]);

  useEffect(() => {
    if (
      !["auto", "auto-scroll"].includes(preferences.headerMode) ||
      effectiveLayout === "full-content"
    ) {
      return;
    }

    let lastScrollY = window.scrollY;

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
    const nextRootMenu = getRootMenu(activePath);

    if (nextRootMenu.path !== activePath) {
      lastActiveByRootRef.current = {
        ...lastActiveByRootRef.current,
        [nextRootMenu.path]: activePath,
      };
    }
  }, [activePath]);

  useEffect(() => {
    tabsStore.getState().openTab(resolveTab(activePath, preferences.appLocale));
  }, [activePath, preferences.appLocale]);

  function navigate(path: string, options?: { replace?: boolean }) {
    void routerNavigate({
      replace: options?.replace,
      to: normalizeAdminPath(path),
    });
  }

  function closeTab(key: string) {
    tabsStore.getState().closeTab(key);
    syncActiveTab();
  }

  function syncActiveTab() {
    const nextActive = tabsStore.getState().activeKey;

    if (nextActive) {
      navigate(nextActive, { replace: true });
    }
  }

  function closeLeftTabs(key: string) {
    tabsStore.getState().closeLeft(key);
    syncActiveTab();
  }

  function closeRightTabs(key: string) {
    tabsStore.getState().closeRight(key);
    syncActiveTab();
  }

  function closeOtherTabs(key: string) {
    tabsStore.getState().closeOthers(key);
    syncActiveTab();
  }

  function closeAllTabs() {
    tabsStore.getState().closeAll();
    syncActiveTab();
  }

  function toggleTabPin(key: string) {
    tabsStore.getState().toggleAffix(key);
  }

  function refreshActiveTab() {
    void queryClient.invalidateQueries();
  }

  function lockScreen(password: string) {
    setLockScreenPassword(password);
    setScreenLocked(true);
    lockActions.setFalse();
  }

  function unlockScreen() {
    setScreenLocked(false);
    setLockScreenPassword("");
  }

  const rootMenu = getRootMenu(activePath, localizedMenu);
  const manualMixedRootPath =
    manualMixedRoot?.anchorPath === activePath ? manualMixedRoot.path : undefined;
  const manualHeaderMixedSideRootPath =
    manualHeaderMixedSideRoot?.anchorPath === activePath
      ? manualHeaderMixedSideRoot.path
      : undefined;
  const mixedRootPath = manualMixedRootPath ?? rootMenu.path;

  const displayedMixedRoot = localizedMenu.find((item) => item.path === mixedRootPath) ?? rootMenu;
  const headerMixedRoot = effectiveLayout === "header-mixed-nav" ? displayedMixedRoot : rootMenu;
  const headerMixedSideMenu = headerMixedRoot.children ?? [];
  const activeHeaderMixedSideRoot = findRootMenuInScope(headerMixedSideMenu, activePath);
  const selectedHeaderMixedSideRoot =
    headerMixedSideMenu.find((item) => item.path === manualHeaderMixedSideRootPath) ??
    activeHeaderMixedSideRoot ??
    headerMixedSideMenu[0] ??
    headerMixedRoot;
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
      : localizedMenu;
  const preferencesButtonPlacement = resolvePreferencesButtonPlacement({
    headerEnabled,
    isMobile,
    preferences,
    sidebarEnabled,
  });

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
          rootMenus={effectiveLayout === "header-mixed-nav" ? headerMixedSideMenu : localizedMenu}
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
            menu={localizedMenu}
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
          <PageSurface
            activePath={activePath}
            key={activePath}
            locale={preferences.appLocale}
            preferences={preferences}
          />
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
        menu={localizedMenu}
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

  function handleSidebarMouseLeave() {
    if (!hoverExpanded) {
      return;
    }

    setHoverExpanded(false);
    setPreferences({ sidebarCollapsed: true });
  }

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (!preferences.sidebarDraggable || variant !== "primary") {
      return;
    }

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = preferences.sidebarWidth;

    function handlePointerMove(pointerEvent: PointerEvent) {
      const nextWidth = clampNumber(startWidth + pointerEvent.clientX - startX, 160, 320);
      setPreferences({ sidebarWidth: nextWidth });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

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

function MixedSidebarFrame({
  activePath,
  activeRootPath,
  navigate,
  onSelectRoot,
  preferences,
  rootAriaLabel,
  rootMenus = adminMenu,
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

  function handleMouseLeave() {
    if (!fixedExtra) {
      setHoveredRoot(null);
      setTransientExtraVisible(false);
    }
  }

  function startExtraResize(event: React.PointerEvent<HTMLDivElement>) {
    if (!preferences.sidebarDraggable || extraCollapsed) {
      return;
    }

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = preferences.sidebarWidth;

    function handlePointerMove(pointerEvent: PointerEvent) {
      const nextWidth = clampNumber(startWidth + pointerEvent.clientX - startX, 160, 320);
      setPreferences({ sidebarWidth: nextWidth });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
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
      />
      <aside
        className="fixed inset-y-0 left-0 z-20 flex h-svh w-(--mixed-sidebar-frame-width) bg-sidebar-deep transition-[width] duration-150 ease-linear"
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
                    activePath={activePath}
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

function MixedRootMenuItem({
  activePath,
  activeRootPath,
  item,
  onMouseEnter,
  onSelectRoot,
  rounded,
}: {
  activePath: string;
  activeRootPath: string;
  item: MenuRecord;
  onMouseEnter?: () => void;
  onSelectRoot: (item: MenuRecord) => void;
  rounded: boolean;
}) {
  const Icon = item.icon ? iconMap[item.icon] : pageIconMap[item.path];
  const isRouteActive = isMenuRecordActive(item, activePath);
  const isActive = activeRootPath === item.path || isRouteActive;

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
  const Icon = item.icon ? iconMap[item.icon] : (pageIconMap[item.path] ?? SquareMenu);
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
  const Icon = item.icon ? iconMap[item.icon] : pageIconMap[item.path];
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
    { key: activePath, path: activePath, title: getMenuTitle(activePath, preferences.appLocale) },
  ];
  const homeTrail = preferences.breadcrumbShowHome
    ? [
        { key: "__home", path: "/dashboard", title: messages.common.home },
        ...rawTrail.filter((item) => item.path !== "/dashboard"),
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
  const headerSidebarBrandVisible = !isMobile && layout === "header-sidebar-nav";
  const headerInlineBrandVisible =
    !isMobile && ["header-mixed-nav", "header-nav", "mixed-nav"].includes(layout);
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
    function handleFullscreenChange() {
      setBrowserFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();

    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
      {headerSidebarBrandVisible && (
        <>
          <div
            className="hidden h-full shrink-0 items-center gap-2 border-r pr-3 md:flex"
            data-slot="admin-header-sidebar-brand"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PanelsTopLeft className="size-4" />
            </div>
            <div className="grid min-w-0 leading-tight">
              <span className="truncate text-sm font-semibold">{messages.common.systemName}</span>
            </div>
          </div>
        </>
      )}
      {headerInlineBrandVisible && (
        <>
          <div
            className="hidden shrink-0 items-center gap-2 md:flex"
            data-slot="admin-header-inline-brand"
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
  const Icon = item.icon ? iconMap[item.icon] : pageIconMap[item.path];
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
            const ChildIcon = child.icon ? iconMap[child.icon] : pageIconMap[child.path];
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

function isMenuRecordActive(item: MenuRecord, activePath: string): boolean {
  return (
    item.path === activePath ||
    (item.children ?? []).some((child) => isMenuRecordActive(child, activePath))
  );
}

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

  function confirmTimezone() {
    setTimezone(draftTimezone);
    setOpen(false);
  }

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
            {timezoneOptions.map((item) => {
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

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!preferences.tabbarWheelable || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.scrollLeft += event.deltaY;
  }

  function copyTabPath(tab: TabRecord) {
    void navigator.clipboard?.writeText(tab.path);
  }

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
            const Icon = tab.icon ? (pageIconMap[tab.path] ?? LayoutDashboard) : undefined;

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

function PageSurface({
  activePath,
  locale,
  preferences,
}: {
  activePath: string;
  locale: string;
  preferences: AdminPreferences;
}) {
  const messages = getAdminMessages(locale);

  return (
    <div
      className="mx-auto flex w-full flex-col gap-4"
      data-route-key={activePath}
      data-slot="page-surface"
      style={{
        maxWidth: preferences.contentCompact === "compact" ? preferences.contentCompactWidth : 1440,
      }}
    >
      <Suspense fallback={<PageSurfaceFallback />}>
        {activePath === "/dashboard" && <DashboardPage locale={locale} />}
        {activePath === "/workplace" && <WorkplacePage messages={messages} />}
        {activePath === "/system/users" && <UsersPage messages={messages} />}
        {activePath === "/system/roles" && <RolesPage messages={messages} />}
        {activePath === "/system/audit" && (
          <AuditPage messages={messages} preferences={preferences} />
        )}
        {activePath === "/effects/modal" && <PopupLab messages={messages} />}
        {activePath === "/effects/form" && <SchemaFormPanel messages={messages} />}
        {activePath === "/effects/iframe" && <IframePanel messages={messages} />}
      </Suspense>
    </div>
  );
}

function PageSurfaceFallback() {
  return (
    <div className="grid gap-4" data-slot="page-surface-fallback">
      <div className="h-24 rounded-lg border bg-muted/40" />
      <div className="h-40 rounded-lg border bg-muted/30" />
    </div>
  );
}

function getPreferenceDiff(preferences: AdminPreferences) {
  const diff: Partial<AdminPreferences> = {};

  (Object.keys(DEFAULT_PREFERENCES) as Array<keyof AdminPreferences>).forEach((key) => {
    if (preferences[key] !== DEFAULT_PREFERENCES[key]) {
      diff[key] = preferences[key] as never;
    }
  });

  return diff;
}

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
  const localeOptions = getLocaleOptions(preferences.appLocale);
  const breadcrumbStyleOptions: Array<{
    label: string;
    value: AdminPreferences["breadcrumbStyleType"];
  }> = [
    { label: messages.common.normal, value: "normal" },
    { label: messages.common.background, value: "background" },
  ];
  const preferenceDiff = useMemo(() => getPreferenceDiff(preferences), [preferences]);
  const hasPreferenceDiff = Object.keys(preferenceDiff).length > 0;

  async function copyPreferences() {
    if (!hasPreferenceDiff) {
      return;
    }

    await navigator.clipboard?.writeText(JSON.stringify(preferenceDiff, null, 2));
  }

  const isDarkMode = preferences.colorMode === "dark";
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
  const isDoubleColumnLayout = ["header-mixed-nav", "sidebar-mixed-nav"].includes(
    preferences.layout,
  );
  const darkSidebarDisabled = isDarkMode || preferences.layout === "header-nav" || isFullContent;
  const darkSidebarSubDisabled =
    isDarkMode || !isDoubleColumnLayout || !preferences.themeSemiDarkSidebar;
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
              <PreferenceBlock title={messages.preferences.appearance.theme}>
                <ThemeModePicker
                  locale={preferences.appLocale}
                  mode={preferences.colorMode}
                  setMode={(colorMode) => setPreferences({ colorMode })}
                />
                <PreferenceToggle
                  checked={preferences.themeSemiDarkSidebar}
                  disabled={darkSidebarDisabled}
                  label={messages.preferences.appearance.darkSidebar}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      themeSemiDarkSidebar: checked,
                      themeSemiDarkSidebarSub: checked
                        ? preferences.themeSemiDarkSidebarSub
                        : false,
                    })
                  }
                />
                <PreferenceToggle
                  checked={preferences.themeSemiDarkSidebarSub}
                  disabled={darkSidebarSubDisabled}
                  label={messages.preferences.appearance.darkSidebarSub}
                  onCheckedChange={(checked) =>
                    setPreferences({ themeSemiDarkSidebarSub: checked })
                  }
                />
                <PreferenceToggle
                  checked={preferences.themeSemiDarkHeader}
                  disabled={isDarkMode}
                  label={messages.preferences.appearance.darkHeader}
                  onCheckedChange={(checked) => setPreferences({ themeSemiDarkHeader: checked })}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.appearance.builtinTheme}>
                <BuiltinThemeGrid
                  activeType={preferences.themeBuiltinType}
                  colorPrimary={preferences.themeColorPrimary}
                  locale={preferences.appLocale}
                  onCustomColorChange={(themeColorPrimary) =>
                    setPreferences({
                      themeBuiltinType: "custom",
                      themeColorPrimary,
                    })
                  }
                  onSelect={(themeBuiltinType) => setPreferences({ themeBuiltinType })}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.appearance.radius}>
                <RadiusPicker
                  radius={preferences.themeRadius}
                  setRadius={(themeRadius) => setPreferences({ themeRadius })}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.appearance.fontSize}>
                <FontSizeStepper
                  fontSize={preferences.themeFontSize}
                  locale={preferences.appLocale}
                  setFontSize={(themeFontSize) => setPreferences({ themeFontSize })}
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.appearance.other}>
                <PreferenceToggle
                  checked={preferences.colorWeakMode}
                  label={messages.preferences.appearance.colorWeak}
                  onCheckedChange={(checked) => setPreferences({ colorWeakMode: checked })}
                />
                <PreferenceToggle
                  checked={preferences.colorGrayMode}
                  label={messages.preferences.appearance.grayMode}
                  onCheckedChange={(checked) => setPreferences({ colorGrayMode: checked })}
                />
              </PreferenceBlock>
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
              <PreferenceBlock title={messages.preferences.shortcut.title}>
                <PreferenceToggle
                  checked={preferences.shortcutKeysEnable}
                  label={messages.preferences.shortcut.enable}
                  onCheckedChange={(shortcutKeysEnable) => setPreferences({ shortcutKeysEnable })}
                />
                <PreferenceToggle
                  checked={preferences.shortcutKeysGlobalSearch}
                  disabled={!preferences.shortcutKeysEnable}
                  label={messages.preferences.shortcut.globalSearch}
                  onCheckedChange={(shortcutKeysGlobalSearch) =>
                    setPreferences({ shortcutKeysGlobalSearch })
                  }
                  shortcut="Ctrl / ⌘ K"
                />
                <PreferenceToggle
                  checked={preferences.shortcutKeysGlobalLogout}
                  disabled={!preferences.shortcutKeysEnable}
                  label={messages.preferences.shortcut.logout}
                  onCheckedChange={(shortcutKeysGlobalLogout) =>
                    setPreferences({ shortcutKeysGlobalLogout })
                  }
                  shortcut="Alt Q"
                />
                <PreferenceToggle
                  checked={preferences.shortcutKeysGlobalLockScreen}
                  disabled={!preferences.shortcutKeysEnable}
                  label={messages.preferences.shortcut.lockScreen}
                  onCheckedChange={(shortcutKeysGlobalLockScreen) =>
                    setPreferences({ shortcutKeysGlobalLockScreen })
                  }
                  shortcut="Alt L"
                />
                <PreferenceToggle
                  checked={preferences.shortcutKeysGlobalEscape}
                  disabled={!preferences.shortcutKeysEnable}
                  label={messages.preferences.shortcut.closeOverlay}
                  onCheckedChange={(shortcutKeysGlobalEscape) =>
                    setPreferences({ shortcutKeysGlobalEscape })
                  }
                  shortcut="Esc"
                />
              </PreferenceBlock>
            </TabsContent>
            <TabsContent className="m-0 pb-6" value="general">
              <PreferenceBlock title={messages.preferences.general.title}>
                <PreferenceSelect
                  items={localeOptions}
                  label={messages.preferences.general.language}
                  onValueChange={(appLocale) => setPreferences({ appLocale })}
                  value={preferences.appLocale}
                />
                <PreferenceSelect
                  items={timezoneOptions}
                  label={messages.preferences.general.timezone}
                  onValueChange={(appTimezone) => setPreferences({ appTimezone })}
                  value={preferences.appTimezone}
                />
                <PreferenceToggle
                  checked={preferences.appDynamicTitle}
                  label={messages.preferences.general.dynamicTitle}
                  onCheckedChange={(appDynamicTitle) => setPreferences({ appDynamicTitle })}
                />
                <PreferenceToggle
                  checked={preferences.appWatermark}
                  label={messages.preferences.general.watermark}
                  onCheckedChange={(appWatermark) =>
                    setPreferences({
                      appWatermark,
                      appWatermarkContent: appWatermark
                        ? preferences.appWatermarkContent || messages.common.systemName
                        : "",
                    })
                  }
                />
                {preferences.appWatermark && (
                  <PreferenceText
                    label={messages.preferences.general.watermarkContent}
                    onValueChange={(appWatermarkContent) => setPreferences({ appWatermarkContent })}
                    value={preferences.appWatermarkContent}
                  />
                )}
                <PreferenceToggle
                  checked={preferences.appEnableCheckUpdates}
                  label={messages.preferences.general.checkUpdates}
                  onCheckedChange={(appEnableCheckUpdates) =>
                    setPreferences({ appEnableCheckUpdates })
                  }
                />
                <PreferenceToggle
                  checked={preferences.appEnableCopyPreferences}
                  label={messages.preferences.general.copyPreferences}
                  onCheckedChange={(appEnableCopyPreferences) =>
                    setPreferences({ appEnableCopyPreferences })
                  }
                />
              </PreferenceBlock>
              <PreferenceBlock title={messages.preferences.animation.title}>
                <PreferenceToggle
                  checked={preferences.transitionProgress}
                  label={messages.preferences.animation.progress}
                  onCheckedChange={(transitionProgress) => setPreferences({ transitionProgress })}
                />
                <PreferenceToggle
                  checked={preferences.transitionLoading}
                  label={messages.preferences.animation.pageLoading}
                  onCheckedChange={(transitionLoading) => setPreferences({ transitionLoading })}
                />
                <PreferenceToggle
                  checked={preferences.transitionEnable}
                  label={messages.preferences.animation.transition}
                  onCheckedChange={(transitionEnable) =>
                    setPreferences({
                      animationEnable: transitionEnable,
                      transitionEnable,
                    })
                  }
                />
                {preferences.transitionEnable && (
                  <TransitionPresetPicker
                    activeName={preferences.transitionName}
                    locale={preferences.appLocale}
                    onSelect={(transitionName) => setPreferences({ transitionName })}
                  />
                )}
              </PreferenceBlock>
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

function ThemeModePicker({
  locale,
  mode,
  setMode,
}: {
  locale: string;
  mode: AdminPreferences["colorMode"];
  setMode: (mode: AdminPreferences["colorMode"]) => void;
}) {
  const colorModeOptions = getColorModeOptions(locale);

  return (
    <div className="flex w-full flex-wrap justify-between gap-y-4">
      {colorModeOptions.map((option) => {
        const Icon = colorModeIcons[option.value];
        const active = mode === option.value;

        return (
          <PreferenceChoice
            active={active}
            key={option.value}
            label={option.label}
            onClick={() => setMode(option.value)}
          >
            <Icon className="size-5" />
          </PreferenceChoice>
        );
      })}
    </div>
  );
}

function LayoutModePicker({
  locale,
  layout,
  setLayout,
}: {
  locale: string;
  layout: AdminPreferences["layout"];
  setLayout: (layout: AdminPreferences["layout"]) => void;
}) {
  const layoutOptions = getLayoutOptions(locale);
  const messages = getAdminMessages(locale);

  return (
    <div className="flex w-full flex-wrap gap-5">
      {layoutOptions.map((option) => (
        <PreferenceChoice
          active={layout === option.value}
          ariaLabel={`${messages.preferences.layout.layout} ${option.label}`}
          key={option.value}
          label={option.label}
          onClick={() => setLayout(option.value)}
          title={option.tip}
        >
          <LayoutPreview layout={option.value} />
        </PreferenceChoice>
      ))}
    </div>
  );
}

function ContentModePicker({
  locale,
  mode,
  setMode,
}: {
  locale: string;
  mode: AdminPreferences["contentCompact"];
  setMode: (mode: AdminPreferences["contentCompact"]) => void;
}) {
  const contentOptions = getContentOptions(locale);
  const messages = getAdminMessages(locale);

  return (
    <div className="flex w-full gap-5">
      {contentOptions.map((option) => (
        <PreferenceChoice
          active={mode === option.value}
          ariaLabel={`${messages.preferences.layout.content} ${option.label}`}
          key={option.value}
          label={option.label}
          onClick={() => setMode(option.value)}
        >
          <ContentPreview mode={option.value} />
        </PreferenceChoice>
      ))}
    </div>
  );
}

function BuiltinThemeGrid({
  activeType,
  colorPrimary,
  locale,
  onCustomColorChange,
  onSelect,
}: {
  activeType: AdminPreferences["themeBuiltinType"];
  colorPrimary: string;
  locale: string;
  onCustomColorChange: (color: string) => void;
  onSelect: (type: AdminPreferences["themeBuiltinType"]) => void;
}) {
  const messages = getAdminMessages(locale);

  return (
    <div className="flex w-full flex-wrap justify-between gap-y-3">
      {BUILT_IN_THEME_PRESETS.map((preset) => {
        const active = activeType === preset.type;
        const label = getThemePresetLabel(preset.type, locale);

        return (
          <PreferenceChoice
            active={active}
            ariaLabel={`${messages.preferences.appearance.theme} ${label}`}
            key={preset.type}
            label={label}
            onClick={() => onSelect(preset.type)}
          >
            {preset.type === "custom" ? (
              <span className="relative flex size-5 items-center justify-center rounded-sm">
                <PencilLine className="absolute z-10 size-5 opacity-60 group-hover:opacity-100" />
                <input
                  aria-label={messages.preferences.actions.customThemeColor}
                  className="absolute inset-0 opacity-0"
                  onChange={(event) => onCustomColorChange(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  type="color"
                  value={toColorInputValue(colorPrimary)}
                />
              </span>
            ) : (
              <span className="size-5 rounded-md" style={{ backgroundColor: preset.color }} />
            )}
          </PreferenceChoice>
        );
      })}
    </div>
  );
}

function RadiusPicker({
  radius,
  setRadius,
}: {
  radius: string;
  setRadius: (radius: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {radiusOptions.map((option) => {
        const active = radius === option;

        return (
          <button
            aria-label={`圆角 ${option}`}
            aria-pressed={active}
            data-active={active ? "true" : undefined}
            className={cn(
              "h-8 rounded-sm border bg-background text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground",
              active &&
                "border-primary bg-primary text-primary-foreground shadow-none hover:bg-primary/90 hover:text-primary-foreground",
            )}
            key={option}
            onClick={() => setRadius(option)}
            type="button"
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function FontSizeStepper({
  fontSize,
  locale,
  setFontSize,
}: {
  fontSize: number;
  locale: string;
  setFontSize: (fontSize: number) => void;
}) {
  const messages = getAdminMessages(locale);

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[2.5rem_1fr_2.5rem_auto] items-center overflow-hidden rounded-md border">
        <Button
          aria-label={getPreferenceStepAria(
            locale,
            "decrease",
            messages.preferences.appearance.fontSize,
          )}
          className="rounded-none"
          onClick={() => setFontSize(fontSize - 1)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <span className="text-lg leading-none">-</span>
        </Button>
        <div className="border-x px-3 text-center text-sm font-medium tabular-nums">{fontSize}</div>
        <Button
          aria-label={getPreferenceStepAria(
            locale,
            "increase",
            messages.preferences.appearance.fontSize,
          )}
          className="rounded-none"
          onClick={() => setFontSize(fontSize + 1)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Plus className="size-4" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground">px</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {messages.preferences.appearance.fontSizeDescription}
      </div>
    </div>
  );
}

function toColorInputValue(color: string) {
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color;
  }

  const parsed = new TinyColor(color);

  if (parsed.isValid) {
    return parsed.toHexString();
  }

  return "#0072e5";
}

function PreferenceChoice({
  active,
  ariaLabel,
  children,
  label,
  onClick,
  title,
}: {
  active: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      data-active={active ? "true" : undefined}
      className="group flex w-25 min-w-0 cursor-pointer flex-col items-center gap-2 text-center text-xs text-muted-foreground"
      onClick={onClick}
      title={title}
      type="button"
    >
      <span
        className={cn(
          "vben-outline-box relative flex h-14 w-full items-center justify-center overflow-hidden rounded-md bg-background text-foreground transition-all",
          active && "vben-outline-box-active",
        )}
        data-active={active ? "true" : undefined}
      >
        {children}
        {active && <Check className="vben-outline-check pointer-events-none" strokeWidth={3} />}
      </span>
      <span
        className={cn("vben-outline-label w-full truncate", active && "font-semibold text-primary")}
      >
        {label}
      </span>
    </button>
  );
}

function LayoutPreview({ layout }: { layout: AdminPreferences["layout"] }) {
  const hasHeader = layout !== "full-content" && layout !== "sidebar-nav";
  const headerPrimary = ["header-nav", "header-mixed-nav", "mixed-nav"].includes(layout);
  const hasPrimarySidebar = [
    "header-mixed-nav",
    "header-sidebar-nav",
    "sidebar-mixed-nav",
    "sidebar-nav",
  ].includes(layout);
  const hasSecondarySidebar = ["header-mixed-nav", "mixed-nav", "sidebar-mixed-nav"].includes(
    layout,
  );
  const headerY = hasHeader ? 9 : 0;
  const contentX =
    layout === "sidebar-nav"
      ? 29
      : layout === "sidebar-mixed-nav" || layout === "header-mixed-nav"
        ? 26
        : layout === "header-sidebar-nav" || layout === "mixed-nav"
          ? 19
          : 4;

  if (layout === "full-content") {
    return (
      <svg className="vben-layout-preview" fill="none" height="66" viewBox="0 0 104 66" width="104">
        <rect fill="currentColor" fillOpacity="0.02" height="66" rx="4" width="104" />
        <rect fill="currentColor" fillOpacity="0.08" height="26" rx="2" width="39" x="4" y="4" />
        <rect fill="currentColor" fillOpacity="0.08" height="26" rx="2" width="50" x="49" y="4" />
        <rect fill="currentColor" fillOpacity="0.08" height="25" rx="2" width="95" x="4" y="35" />
      </svg>
    );
  }

  return (
    <svg className="vben-layout-preview" fill="none" height="66" viewBox="0 0 104 66" width="104">
      <rect fill="currentColor" fillOpacity="0.02" height="66" rx="4" width="104" />
      {hasHeader && (
        <>
          <rect
            fill={headerPrimary ? "hsl(var(--primary))" : "currentColor"}
            fillOpacity={headerPrimary ? 1 : 0.08}
            height="9"
            width="104"
          />
          <rect
            fill={headerPrimary ? "#e5e5e5" : "#b2b2b2"}
            height="2.8"
            rx="1.4"
            width="7.5"
            x="28"
            y="3"
          />
          <rect
            fill={headerPrimary ? "#e5e5e5" : "#b2b2b2"}
            height="2.8"
            rx="1.4"
            width="7.5"
            x="41"
            y="3.2"
          />
          <rect
            fill={headerPrimary ? "#e5e5e5" : "#b2b2b2"}
            height="2.8"
            rx="1.4"
            width="7.5"
            x="54"
            y="3"
          />
          <rect fill="#ffffff" height="6.5" rx="2" width="7.8" x="1.5" y="1" />
        </>
      )}
      {hasPrimarySidebar && (
        <rect
          fill="hsl(var(--primary))"
          height={layout === "sidebar-nav" || layout === "sidebar-mixed-nav" ? 66 : 57}
          width={
            layout === "sidebar-nav"
              ? 27
              : layout === "sidebar-mixed-nav" || layout === "header-mixed-nav"
                ? 10
                : 15
          }
          x="0"
          y={layout === "sidebar-nav" || layout === "sidebar-mixed-nav" ? 0 : headerY}
        />
      )}
      {hasSecondarySidebar && (
        <rect
          fill="currentColor"
          fillOpacity="0.08"
          height={layout === "sidebar-mixed-nav" ? 66 : 57}
          width={layout === "mixed-nav" ? 15 : 12}
          x={layout === "mixed-nav" ? 0 : 10}
          y={layout === "sidebar-mixed-nav" ? 0 : headerY}
        />
      )}
      {["sidebar-nav", "sidebar-mixed-nav"].includes(layout) && (
        <rect
          fill="#ffffff"
          height="7.5"
          rx="2"
          width="8.2"
          x={layout === "sidebar-nav" ? 9 : 0.6}
          y="1.4"
        />
      )}
      {hasPrimarySidebar && (
        <>
          <rect
            fill="#ffffff"
            fillOpacity={layout === "sidebar-nav" || layout === "header-sidebar-nav" ? 1 : 0.85}
            height="2.8"
            rx="1.4"
            width={layout === "sidebar-nav" ? 17.5 : 5.5}
            x={layout === "sidebar-nav" ? 4.9 : 1.7}
            y={headerY + 15}
          />
          <rect
            fill="#ffffff"
            fillOpacity={layout === "sidebar-nav" || layout === "header-sidebar-nav" ? 1 : 0.65}
            height="2.8"
            rx="1.4"
            width={layout === "sidebar-nav" ? 17.5 : 5.5}
            x={layout === "sidebar-nav" ? 4.9 : 1.7}
            y={headerY + 28}
          />
          <rect
            fill="#ffffff"
            fillOpacity={layout === "sidebar-nav" || layout === "header-sidebar-nav" ? 1 : 0.65}
            height="2.8"
            rx="1.4"
            width={layout === "sidebar-nav" ? 17.5 : 5.5}
            x={layout === "sidebar-nav" ? 4.9 : 1.7}
            y={headerY + 41}
          />
        </>
      )}
      <rect
        fill="currentColor"
        fillOpacity="0.08"
        height="21.5"
        rx="2"
        width={98 - contentX}
        x={contentX}
        y={headerY + 14}
      />
      <rect
        fill="currentColor"
        fillOpacity="0.08"
        height="21"
        rx="2"
        width="24"
        x={contentX}
        y={headerY + 14}
      />
      <rect
        fill="currentColor"
        fillOpacity="0.08"
        height="21.5"
        rx="2"
        width={98 - contentX}
        x={contentX}
        y={headerY + 39}
      />
    </svg>
  );
}

function ContentPreview({ mode }: { mode: AdminPreferences["contentCompact"] }) {
  return (
    <svg className="vben-layout-preview" fill="none" height="66" viewBox="0 0 104 66" width="104">
      <rect fill="currentColor" fillOpacity="0.02" height="66" rx="4" width="104" />
      <rect fill="hsl(var(--primary))" height="9" width="104" />
      <rect fill="#e5e5e5" height="2.8" rx="1.4" width="7.5" x="28" y="3" />
      <rect fill="#e5e5e5" height="2.8" rx="1.4" width="7.5" x="41" y="3.2" />
      <rect fill="#ffffff" height="6.5" rx="2" width="7.8" x="1.5" y="1" />
      <rect
        fill="currentColor"
        fillOpacity="0.08"
        height="21.5"
        rx="2"
        width={mode === "compact" ? 42 : 54}
        x={mode === "compact" ? 45 : 42}
        y="14"
      />
      <rect
        fill="currentColor"
        fillOpacity="0.08"
        height="21"
        rx="2"
        width={mode === "compact" ? 24 : 34}
        x={mode === "compact" ? 17 : 4}
        y="14"
      />
      <rect
        fill="currentColor"
        fillOpacity="0.08"
        height="21.5"
        rx="2"
        width={mode === "compact" ? 72 : 95}
        x={mode === "compact" ? 17 : 4}
        y="39"
      />
    </svg>
  );
}

function PreferenceBlock({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="flex flex-col border-b py-4 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold leading-none tracking-normal">{title}</h3>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}

function PreferenceNumber({
  disabled = false,
  label,
  locale,
  max,
  min,
  onValueChange,
  step = 1,
  value,
}: {
  disabled?: boolean;
  label: string;
  locale: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  const setNext = (next: number) => onValueChange(Math.min(Math.max(next, min), max));

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-2.5 hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Label>{label}</Label>
      <div className="grid grid-cols-[1.9rem_4.25rem_1.9rem] items-center overflow-hidden rounded-md border bg-background">
        <Button
          aria-label={getPreferenceStepAria(locale, "decrease", label)}
          className="rounded-none"
          disabled={disabled}
          onClick={() => setNext(value - step)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <span className="text-base leading-none">-</span>
        </Button>
        <Input
          aria-label={label}
          className="h-7 rounded-none border-y-0 border-x px-1 text-center text-xs tabular-nums"
          disabled={disabled}
          max={max}
          min={min}
          onChange={(event) => setNext(Number(event.target.value))}
          step={step}
          type="number"
          value={value}
        />
        <Button
          aria-label={getPreferenceStepAria(locale, "increase", label)}
          className="rounded-none"
          disabled={disabled}
          onClick={() => setNext(value + step)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PreferenceText({
  disabled = false,
  label,
  onValueChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  value: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-md px-2 py-2.5 hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Label>{label}</Label>
      <Input
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      />
    </div>
  );
}

function PreferenceSegmented<TValue extends string>({
  disabled = false,
  items,
  label,
  onValueChange,
  value,
}: {
  disabled?: boolean;
  items: Array<{ label: string; value: TValue }>;
  label: string;
  onValueChange: (value: TValue) => void;
  value: TValue;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Label className="shrink-0">{label}</Label>
      <div className="flex flex-wrap justify-end gap-2">
        {items.map((item) => {
          const active = value === item.value;

          return (
            <Button
              aria-pressed={active}
              data-active={active ? "true" : undefined}
              className={cn(
                "h-7 rounded-sm px-2 text-xs",
                active &&
                  "border-primary bg-primary text-primary-foreground shadow-none hover:bg-primary/90 hover:text-primary-foreground",
              )}
              disabled={disabled}
              key={item.value}
              onClick={() => onValueChange(item.value)}
              type="button"
              variant="outline"
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceCheckboxGroup<TValue extends string>({
  disabled = false,
  items,
  label,
  onValuesChange,
  values,
}: {
  disabled?: boolean;
  items: Array<{ label: string; value: TValue }>;
  label: string;
  onValuesChange: (values: TValue[]) => void;
  values: TValue[];
}) {
  function toggleValue(value: TValue) {
    if (values.includes(value)) {
      onValuesChange(values.filter((item) => item !== value));
      return;
    }

    onValuesChange([...values, value]);
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Label className="shrink-0">{label}</Label>
      <div className="flex flex-wrap justify-end gap-2">
        {items.map((item) => {
          const active = values.includes(item.value);

          return (
            <Button
              aria-pressed={active}
              data-active={active ? "true" : undefined}
              className={cn(
                "h-7 rounded-sm px-2 text-xs",
                active &&
                  "border-primary bg-primary text-primary-foreground shadow-none hover:bg-primary/90 hover:text-primary-foreground",
              )}
              disabled={disabled}
              key={item.value}
              onClick={() => toggleValue(item.value)}
              type="button"
              variant={active ? "default" : "outline"}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceSelect<TValue extends string>({
  disabled = false,
  items,
  label,
  onValueChange,
  value,
}: {
  disabled?: boolean;
  items: Array<{ label: string; value: TValue }>;
  label: string;
  onValueChange: (value: TValue) => void;
  value: TValue;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Label className="shrink-0">{label}</Label>
      <Select
        disabled={disabled}
        onValueChange={onValueChange as (value: string) => void}
        value={value}
      >
        <SelectTrigger aria-label={label} className="h-8 w-[165px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PreferenceToggle({
  checked,
  disabled = false,
  label,
  onCheckedChange,
  shortcut,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  shortcut?: string;
}) {
  return (
    <div
      className={cn(
        "my-1 flex w-full items-center justify-between rounded-md px-2 py-2.5 hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <Label className="min-w-0 flex-1 text-sm">{label}</Label>
      {shortcut && <span className="mr-2 ml-auto shrink-0 text-xs opacity-60">{shortcut}</span>}
      <Switch
        checked={checked}
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function TransitionPresetPicker({
  activeName,
  locale,
  onSelect,
}: {
  activeName: AdminPreferences["transitionName"];
  locale: string;
  onSelect: (value: AdminPreferences["transitionName"]) => void;
}) {
  const messages = getAdminMessages(locale);

  return (
    <div className="grid grid-cols-4 gap-3 px-2 py-2">
      {transitionOptions.map((item) => {
        const active = activeName === item.value;

        return (
          <button
            aria-label={`${messages.preferences.animation.title} ${item.label}`}
            aria-pressed={active}
            data-active={active ? "true" : undefined}
            className={cn(
              "vben-outline-box relative flex h-14 min-w-0 items-center justify-center overflow-hidden rounded-md bg-background p-2",
              active && "vben-outline-box-active",
            )}
            key={item.value}
            onClick={() => onSelect(item.value)}
            type="button"
          >
            <span
              className={cn("h-9 w-10 rounded-md bg-primary", `transition-preview-${item.value}`)}
            />
            {active && <Check className="vben-outline-check pointer-events-none" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

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
  const defaultSearchTerm = getMenuTitle("/dashboard", locale);
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

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setPassword("");
    }
  }

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

  function openUnlockForm() {
    setError("");
    setShowUnlockForm(true);
  }

  function closeUnlockForm() {
    setError("");
    setUnlockPassword("");
    setShowUnlockForm(false);
  }

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

export function BaseLayout() {
  return (
    <TooltipProvider>
      <AdminWorkspace />
    </TooltipProvider>
  );
}
