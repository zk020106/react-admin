import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBoolean, useDebounce, useKeyPress } from "ahooks"
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Copy,
  Expand,
  FileClock,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Maximize2,
  Moon,
  MoreHorizontal,
  PanelsTopLeft,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  Sun,
  UserRoundCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useStore } from "zustand"
import { z } from "zod"

import { affixTabs, adminMenu, getMenuTitle, overviewStats, userRows } from "./app-data"
import { FormApi } from "./form-api"
import { findMenuTrail, searchMenu } from "./menu"
import { createPreferenceStore, preferenceStore } from "./preferences"
import { DrawerApi, ModalApi, type PopupState } from "./popup-api"
import { createTabsStore, tabsStore } from "./tabs"
import { applyVbenTheme, BUILT_IN_THEME_PRESETS } from "./theme"
import type { AdminPreferences, MenuRecord, TabRecord } from "./types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const queryClient = new QueryClient()

const iconMap: Record<string, LucideIcon> = {
  BriefcaseBusiness,
  LayoutDashboard,
  PanelsTopLeft,
  Shield,
}

const pageIconMap: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/effects/form": PanelsTopLeft,
  "/effects/iframe": PanelsTopLeft,
  "/effects/modal": PanelsTopLeft,
  "/system/audit": FileClock,
  "/system/roles": Shield,
  "/system/users": Users,
  "/workplace": BriefcaseBusiness,
}

const layoutOptions: Array<{ label: string; value: AdminPreferences["layout"] }> = [
  { label: "Sidebar", value: "sidebar-nav" },
  { label: "Header", value: "header-nav" },
  { label: "Mixed", value: "mixed-nav" },
  { label: "Sidebar mixed", value: "sidebar-mixed-nav" },
  { label: "Full content", value: "full-content" },
]

const workplaceCounts = [18, 14, 9]

function delay<T>(value: T) {
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), 80)
  })
}

function resolveTab(path: string): TabRecord {
  const title = getMenuTitle(path)
  return {
    affix: path === "/dashboard",
    icon: pageIconMap[path] ? path : undefined,
    key: path,
    path,
    title,
  }
}

function usePopupState(api: ModalApi | DrawerApi) {
  const [state, setState] = useState<PopupState>(api.getState())

  useEffect(() => api.subscribe((next) => setState(next)), [api])

  return state
}

function AdminWorkspace() {
  const preferences = useStore(preferenceStore, (state) => state.preferences)
  const setPreferences = useStore(preferenceStore, (state) => state.setPreferences)
  const tabs = useStore(tabsStore, (state) => state.tabs)
  const activeKey = useStore(tabsStore, (state) => state.activeKey)
  const [activePath, setActivePath] = useState(activeKey ?? "/dashboard")
  const [preferencesOpen, preferencesActions] = useBoolean(false)
  const [searchOpen, searchActions] = useBoolean(false)
  const [lockOpen, lockActions] = useBoolean(false)

  useKeyPress("ctrl.k", (event) => {
    event.preventDefault()
    searchActions.setTrue()
  })
  useKeyPress("meta.k", (event) => {
    event.preventDefault()
    searchActions.setTrue()
  })

  useEffect(() => {
    tabsStore.setState(createTabsStore(affixTabs).getState(), true)
    tabsStore.getState().openTab(resolveTab("/dashboard"))
  }, [])

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
    })
  }, [
    preferences.colorMode,
    preferences.themeBuiltinType,
    preferences.themeColorDestructive,
    preferences.themeColorPrimary,
    preferences.themeColorSuccess,
    preferences.themeColorWarning,
    preferences.themeFontSize,
    preferences.themeRadius,
  ])

  function navigate(path: string) {
    const nextTab = resolveTab(path)
    setActivePath(path)
    tabsStore.getState().openTab(nextTab)
  }

  function closeTab(key: string) {
    tabsStore.getState().closeTab(key)
    const nextActive = tabsStore.getState().activeKey

    if (nextActive) {
      setActivePath(nextActive)
    }
  }

  const sidebarEnabled = preferences.layout !== "header-nav" && preferences.layout !== "full-content"

  return (
    <SidebarProvider
      open={!preferences.sidebarCollapsed}
      onOpenChange={(open) => setPreferences({ sidebarCollapsed: !open })}
    >
      {sidebarEnabled && <AdminSidebar activePath={activePath} navigate={navigate} />}
      <SidebarInset>
        <AdminHeader
          activePath={activePath}
          lockScreen={lockActions.setTrue}
          navigate={navigate}
          openPreferences={preferencesActions.setTrue}
          openSearch={searchActions.setTrue}
          preferences={preferences}
          sidebarEnabled={sidebarEnabled}
          setPreferences={setPreferences}
        />
        {preferences.tabbarEnable && (
          <Tabbar
            activePath={activePath}
            closeTab={closeTab}
            navigate={navigate}
            tabs={tabs}
          />
        )}
        <main className="min-h-0 flex-1 overflow-auto bg-background-deep p-4">
          <PageSurface activePath={activePath} />
        </main>
      </SidebarInset>
      <PreferencesSheet
        onOpenChange={preferencesActions.set}
        open={preferencesOpen}
        preferences={preferences}
        setPreferences={setPreferences}
      />
      <GlobalSearchDialog
        navigate={navigate}
        onOpenChange={searchActions.set}
        open={searchOpen}
      />
      <LockScreenDialog onOpenChange={lockActions.set} open={lockOpen} />
    </SidebarProvider>
  )
}

function AdminSidebar({
  activePath,
  navigate,
}: {
  activePath: string
  navigate: (path: string) => void
}) {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex h-10 items-center gap-2 rounded-lg px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PanelsTopLeft className="size-4" />
          </div>
          <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Vben React</span>
            <span className="truncate text-xs text-muted-foreground">Admin suite</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenu.map((item) => (
                <MenuNode activePath={activePath} item={item} key={item.key} navigate={navigate} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-lg border bg-background p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Query status: hot cache
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function MenuNode({
  activePath,
  item,
  navigate,
}: {
  activePath: string
  item: MenuRecord
  navigate: (path: string) => void
}) {
  const Icon = item.icon ? iconMap[item.icon] : pageIconMap[item.path]
  const children = item.children ?? []
  const isActive = activePath === item.path
  const hasActiveChild = children.some((child) => child.path === activePath)

  if (children.length > 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={hasActiveChild} tooltip={item.title}>
          {Icon && <Icon />}
          <span>{item.title}</span>
          <ChevronRight className="ml-auto size-3.5" />
        </SidebarMenuButton>
        <SidebarMenu className="ml-4 border-l pl-2 group-data-[collapsible=icon]:hidden">
          {children.map((child) => (
            <MenuNode activePath={activePath} item={child} key={child.key} navigate={navigate} />
          ))}
        </SidebarMenu>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <a
          href={item.path}
          onClick={(event) => {
            event.preventDefault()
            navigate(item.path)
          }}
        >
          {Icon && <Icon />}
          <span>{item.title}</span>
        </a>
      </SidebarMenuButton>
      {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  )
}

function AdminHeader({
  activePath,
  lockScreen,
  navigate,
  openPreferences,
  openSearch,
  preferences,
  sidebarEnabled,
  setPreferences,
}: {
  activePath: string
  lockScreen: () => void
  navigate: (path: string) => void
  openPreferences: () => void
  openSearch: () => void
  preferences: AdminPreferences
  sidebarEnabled: boolean
  setPreferences: ReturnType<typeof createPreferenceStore>["getState"] extends () => infer State
    ? State extends { setPreferences: infer Setter }
      ? Setter
      : never
    : never
}) {
  const trail = findMenuTrail(adminMenu, activePath) ?? [{ key: activePath, path: activePath, title: getMenuTitle(activePath) }]
  const isDark = preferences.colorMode === "dark"
  const headerNavigationEnabled = ["header-mixed-nav", "header-nav", "mixed-nav"].includes(preferences.layout)
  const sidebarTriggerVisible =
    sidebarEnabled && preferences.layout !== "mixed-nav" && preferences.layout !== "sidebar-mixed-nav"

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-header px-3">
      {sidebarTriggerVisible && (
        <>
          <SidebarTrigger />
          <Separator className="h-5" orientation="vertical" />
        </>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="sr-only">Vben React Admin</h1>
        {headerNavigationEnabled ? (
          <HeaderNavigation activePath={activePath} menu={adminMenu} navigate={navigate} />
        ) : (
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            {trail.map((item, index) => (
              <span className="inline-flex items-center gap-1" key={item.key}>
                {index > 0 && <ChevronRight className="size-3" />}
                <span className={index === trail.length - 1 ? "text-foreground" : ""}>{item.title}</span>
              </span>
            ))}
          </nav>
        )}
        <Button
          className="ml-auto hidden w-64 justify-start text-muted-foreground md:inline-flex"
          onClick={openSearch}
          variant="outline"
        >
          <Search className="size-4" />
          <span>Search menu</span>
          <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">Ctrl K</kbd>
        </Button>
      </div>
      <HeaderIconButton label="Search" onClick={openSearch}>
        <Search />
      </HeaderIconButton>
      <HeaderIconButton
        label={isDark ? "Light mode" : "Dark mode"}
        onClick={() => setPreferences({ colorMode: isDark ? "light" : "dark" })}
      >
        {isDark ? <Sun /> : <Moon />}
      </HeaderIconButton>
      <HeaderIconButton label="Language">
        <Globe2 />
      </HeaderIconButton>
      <HeaderIconButton label="Timezone">
        <Clock3 />
      </HeaderIconButton>
      <NotificationsMenu />
      <HeaderIconButton label="Lock screen" onClick={lockScreen}>
        <LockKeyhole />
      </HeaderIconButton>
      <HeaderIconButton label="Preferences" onClick={openPreferences}>
        <Settings2 />
      </HeaderIconButton>
      <UserMenu />
    </header>
  )
}

function HeaderNavigation({
  activePath,
  menu,
  navigate,
}: {
  activePath: string
  menu: MenuRecord[]
  navigate: (path: string) => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PanelsTopLeft className="size-4" />
        </div>
        <span className="text-sm font-semibold">Vben React</span>
      </div>
      <Separator className="hidden h-5 md:block" orientation="vertical" />
      <nav aria-label="Header navigation" className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {menu.map((item) => (
          <HeaderNavigationItem activePath={activePath} item={item} key={item.key} navigate={navigate} />
        ))}
      </nav>
    </div>
  )
}

function HeaderNavigationItem({
  activePath,
  item,
  navigate,
}: {
  activePath: string
  item: MenuRecord
  navigate: (path: string) => void
}) {
  const Icon = item.icon ? iconMap[item.icon] : pageIconMap[item.path]
  const children = item.children ?? []
  const isActive = isMenuRecordActive(item, activePath)

  if (children.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-current={isActive ? "page" : undefined}
            className={cn("h-8 gap-1.5 px-2 text-muted-foreground", isActive && "bg-muted text-foreground")}
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
            const ChildIcon = child.icon ? iconMap[child.icon] : pageIconMap[child.path]
            const childActive = isMenuRecordActive(child, activePath)

            return (
              <DropdownMenuItem asChild key={child.key}>
                <a
                  aria-current={childActive ? "page" : undefined}
                  className={cn(childActive && "bg-accent text-accent-foreground")}
                  href={child.path}
                  onClick={(event) => {
                    event.preventDefault()
                    navigate(child.path)
                  }}
                >
                  {ChildIcon && <ChildIcon className="size-4" />}
                  <span>{child.title}</span>
                  {child.badge && <Badge className="ml-auto" variant="secondary">{child.badge}</Badge>}
                </a>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      asChild
      className={cn("h-8 gap-1.5 px-2 text-muted-foreground", isActive && "bg-muted text-foreground")}
      variant="ghost"
    >
      <a
        aria-current={isActive ? "page" : undefined}
        href={item.path}
        onClick={(event) => {
          event.preventDefault()
          navigate(item.path)
        }}
      >
        {Icon && <Icon className="size-4" />}
        <span>{item.title}</span>
        {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
      </a>
    </Button>
  )
}

function isMenuRecordActive(item: MenuRecord, activePath: string): boolean {
  return item.path === activePath || (item.children ?? []).some((child) => isMenuRecordActive(child, activePath))
}

function HeaderIconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} onClick={onClick} size="icon-sm" variant="ghost">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Notifications" className="relative" size="icon-sm" variant="ghost">
          <Bell />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {["Audit policy updated", "New role pending review", "Query cache warmed"].map((item) => (
          <DropdownMenuItem className="items-start gap-2" key={item}>
            <CheckCircle2 className="mt-0.5 size-4 text-primary" />
            <span>{item}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="User menu" size="icon-sm" variant="ghost">
          <CircleUserRound />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Root Admin</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserRoundCog />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Tabbar({
  activePath,
  closeTab,
  navigate,
  tabs,
}: {
  activePath: string
  closeTab: (key: string) => void
  navigate: (path: string) => void
  tabs: TabRecord[]
}) {
  return (
    <div className="flex h-10 items-center gap-2 border-b bg-header px-3">
      <Tabs className="min-w-0 flex-1" onValueChange={navigate} value={activePath}>
        <TabsList className="max-w-full overflow-x-auto" variant="line">
          {tabs.map((tab) => (
            <div className="group/tab flex items-center" key={tab.key}>
              <TabsTrigger className="h-8 px-2" value={tab.key}>
                {tab.title}
              </TabsTrigger>
              {!tab.affix && (
                <Button
                  aria-label={`Close ${tab.title}`}
                  className="-ml-1 opacity-60 group-hover/tab:opacity-100"
                  onClick={() => closeTab(tab.key)}
                  size="icon-xs"
                  variant="ghost"
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
        </TabsList>
      </Tabs>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="Tab tools" size="icon-sm" variant="ghost">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <RefreshCcw />
            Refresh
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy />
            Copy route
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Maximize2 />
            Maximize content
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function PageSurface({ activePath }: { activePath: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
      {activePath === "/dashboard" && <DashboardPage />}
      {activePath === "/workplace" && <WorkplacePage />}
      {activePath === "/system/users" && <UsersPage />}
      {activePath === "/system/roles" && <RolesPage />}
      {activePath === "/system/audit" && <AuditPage />}
      {activePath === "/effects/modal" && <PopupLab />}
      {activePath === "/effects/form" && <SchemaFormPanel />}
      {activePath === "/effects/iframe" && <IframePanel />}
    </div>
  )
}

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryFn: () => delay(overviewStats),
    queryKey: ["overview-stats"],
  })

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-4">
        {(data ?? overviewStats).map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle>{isLoading ? <Skeleton className="h-6 w-24" /> : item.value}</CardTitle>
              <CardAction>
                <Badge variant="outline">{item.trend}</Badge>
              </CardAction>
            </CardHeader>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operations pulse</CardTitle>
            <CardDescription>Live query data rendered through TanStack Query.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {["Menu routing", "Tabs cache", "Popup API"].map((item, index) => (
                <div className="rounded-lg border bg-background p-3" key={item}>
                  <div className="text-sm font-medium">{item}</div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${72 + index * 8}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Layout widgets mirrored from Vben packages.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {["Global search", "Preferences drawer", "Theme toggle", "Lock screen"].map((item) => (
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2" key={item}>
                <span>{item}</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function WorkplacePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workplace</CardTitle>
        <CardDescription>Compact operational queue for repeated admin work.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {["Pending approvals", "Route cache", "Pinned tabs"].map((item, index) => (
          <div className="rounded-lg border bg-background p-4" key={item}>
            <div className="text-sm font-medium">{item}</div>
            <div className="mt-2 text-2xl font-semibold">{workplaceCounts[index]}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Table action patterns, badges and dense scanning states.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRows.map((user) => (
              <TableRow key={user.email}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.team}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function RolesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
        <CardDescription>Permission groups ready for auth integration.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {["Owner", "Operator", "Auditor"].map((role) => (
          <div className="rounded-lg border bg-background p-4" key={role}>
            <Shield className="mb-3 size-5 text-primary" />
            <div className="font-medium">{role}</div>
            <div className="text-sm text-muted-foreground">Scoped access profile</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AuditPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>Timeline surface for route and account events.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {["User role changed", "Preferences exported", "Drawer confirmed"].map((event) => (
          <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2" key={event}>
            <FileClock className="size-4 text-primary" />
            <span>{event}</span>
            <span className="ml-auto text-xs text-muted-foreground">just now</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function PopupLab() {
  const modalApi = useMemo(() => new ModalApi({ title: "Edit profile" }), [])
  const drawerApi = useMemo(() => new DrawerApi({ placement: "right", title: "Drawer task" }), [])
  const modalState = usePopupState(modalApi)
  const drawerState = usePopupState(drawerApi)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modal and drawer</CardTitle>
        <CardDescription>Chainable APIs with payload sharing, lock state and before-close hooks.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={() => modalApi.setData({ source: "modal" }).open()}>
          <Expand />
          Open modal
        </Button>
        <Button onClick={() => drawerApi.setData({ source: "drawer" }).open()} variant="outline">
          <PanelsTopLeft />
          Open drawer
        </Button>
      </CardContent>
      <Dialog open={modalState.isOpen} onOpenChange={(open) => (open ? modalApi.open() : void modalApi.close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalState.title}</DialogTitle>
            <DialogDescription>Payload: {JSON.stringify(modalApi.getData())}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => modalApi.lock()} variant="outline">
              Lock
            </Button>
            <Button onClick={() => void modalApi.close()}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={drawerState.isOpen} onOpenChange={(open) => (open ? drawerApi.open() : void drawerApi.close())}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{drawerState.title}</SheetTitle>
            <SheetDescription>Payload: {JSON.stringify(drawerApi.getData())}</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Button onClick={() => void drawerApi.close()}>Close drawer</Button>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
}

const schemaForm = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.string().min(1),
})

function SchemaFormPanel() {
  const [submitted, setSubmitted] = useState<Record<string, unknown>>({})
  const form = useForm<z.infer<typeof schemaForm>>({
    defaultValues: { email: "root@example.com", name: "Root", role: "Owner" },
    resolver: zodResolver(schemaForm),
  })
  const api = useMemo(
    () =>
      new FormApi({
        handleSubmit: setSubmitted,
        schema: [
          { component: "input", fieldName: "name", label: "Name" },
          { component: "input", fieldName: "email", label: "Email" },
          { component: "select", fieldName: "role", label: "Role" },
        ],
      }),
    [],
  )

  async function submitForm() {
    api.mount({
      reset: form.reset,
      setValue: (fieldName, value) => form.setValue(fieldName as keyof z.infer<typeof schemaForm>, value as never),
      submit: () => undefined,
      validate: async () => ({ valid: await form.trigger() }),
      values: form.getValues(),
    })
    await api.submit()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schema form</CardTitle>
        <CardDescription>react-hook-form and zod behind a Vben-like FormApi facade.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid max-w-2xl gap-4" onSubmit={form.handleSubmit(submitForm)}>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...form.register("email")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" {...form.register("role")} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Submit</Button>
            <Button onClick={() => form.reset()} type="button" variant="outline">
              Reset
            </Button>
          </div>
          <pre className="rounded-lg border bg-muted p-3 text-xs">{JSON.stringify(submitted, null, 2)}</pre>
        </form>
      </CardContent>
    </Card>
  )
}

function IframePanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Iframe view</CardTitle>
        <CardDescription>Route-cached iframe shell placeholder with consistent chrome.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex aspect-video items-center justify-center rounded-lg border bg-background text-muted-foreground">
          Embedded workspace
        </div>
      </CardContent>
    </Card>
  )
}

function PreferencesSheet({
  onOpenChange,
  open,
  preferences,
  setPreferences,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  preferences: AdminPreferences
  setPreferences: ReturnType<typeof preferenceStore.getState>["setPreferences"]
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-[360px] sm:max-w-[360px]">
        <SheetHeader>
          <SheetTitle>Preferences</SheetTitle>
          <SheetDescription>Theme, navigation and layout density.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-4">
          <div className="grid gap-5 pb-6">
            <section className="grid gap-2">
              <Label>Navigation mode</Label>
              <Select
                onValueChange={(value) => setPreferences({ layout: value as AdminPreferences["layout"] })}
                value={preferences.layout}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {layoutOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
            <PreferenceToggle
              checked={preferences.tabbarEnable}
              label="Tabs"
              onCheckedChange={(checked) => setPreferences({ tabbarEnable: checked })}
            />
            <PreferenceToggle
              checked={preferences.breadcrumbEnable}
              label="Breadcrumb"
              onCheckedChange={(checked) => setPreferences({ breadcrumbEnable: checked })}
            />
            <PreferenceToggle
              checked={preferences.footerEnable}
              label="Footer"
              onCheckedChange={(checked) => setPreferences({ footerEnable: checked })}
            />
            <section className="grid gap-2">
              <Label>Theme mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "system"] as const).map((mode) => (
                  <Button
                    key={mode}
                    onClick={() => setPreferences({ colorMode: mode })}
                    type="button"
                    variant={preferences.colorMode === mode ? "default" : "outline"}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </section>
            <section className="grid gap-2">
              <Label>Builtin theme</Label>
              <Select
                onValueChange={(value) =>
                  setPreferences({ themeBuiltinType: value as AdminPreferences["themeBuiltinType"] })
                }
                value={preferences.themeBuiltinType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUILT_IN_THEME_PRESETS.filter((preset) => preset.type !== "custom").map((preset) => (
                    <SelectItem key={preset.type} value={preset.type}>
                      {preset.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
            <section className="grid gap-2">
              <Label>Primary color</Label>
              <Input
                onChange={(event) =>
                  setPreferences({
                    themeBuiltinType: "custom",
                    themeColorPrimary: event.target.value,
                  })
                }
                value={preferences.themeColorPrimary}
              />
            </section>
            <section className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Radius</Label>
                <Input
                  max={1.5}
                  min={0}
                  onChange={(event) => setPreferences({ themeRadius: event.target.value })}
                  step={0.05}
                  type="number"
                  value={preferences.themeRadius}
                />
              </div>
              <div className="grid gap-2">
                <Label>Font size</Label>
                <Input
                  max={20}
                  min={12}
                  onChange={(event) => setPreferences({ themeFontSize: Number(event.target.value) })}
                  type="number"
                  value={preferences.themeFontSize}
                />
              </div>
            </section>
            <section className="grid gap-2">
              <Label>Sidebar width</Label>
              <Input
                max={360}
                min={180}
                onChange={(event) => setPreferences({ sidebarWidth: Number(event.target.value) })}
                type="number"
                value={preferences.sidebarWidth}
              />
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function PreferenceToggle({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background p-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function GlobalSearchDialog({
  navigate,
  onOpenChange,
  open,
}: {
  navigate: (path: string) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, { wait: 120 })
  const results = debouncedQuery ? searchMenu(adminMenu, debouncedQuery) : searchMenu(adminMenu, "dashboard")

  return (
    <CommandDialog onOpenChange={onOpenChange} open={open} title="Global search">
      <Command>
        <CommandInput onValueChange={setQuery} placeholder="Search routes" value={query} />
        <CommandList>
          <CommandEmpty>No route found.</CommandEmpty>
          <CommandGroup heading="Routes">
            {results.map((item) => (
              <CommandItem
                key={item.key}
                onSelect={() => {
                  navigate(item.path)
                  onOpenChange(false)
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
  )
}

function LockScreenDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Screen locked</DialogTitle>
          <DialogDescription>Session controls remain mounted while content is protected.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="unlock-password">Password</Label>
          <Input id="unlock-password" type="password" />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Unlock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminWorkspace />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
