import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Maximize2,
  Minimize2,
  Moon,
  RefreshCcw,
  Search,
  Settings2,
  Sun,
  UserRoundCog
} from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'

import { AppLogo } from '@/components/app-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getAdminMessages, getLocaleOptions } from '@/i18n/admin-i18n'
import { cn } from '@/lib/utils'
import { getMenuRecordIcon, isMenuRecordActive } from '@/layouts/navigation'
import {
  preferenceTimezoneOptions,
  type PreferencesButtonPlacement
} from '@/layouts/preferences-options'
import type { NotificationRecord } from '@/mock/admin-mock'
import { notificationQueries } from '@/pages/admin-queries'
import { ADMIN_DEFAULT_PATH, getDefaultMenuPath, getMenuTitle } from '@/router/app-data'
import type { AdminPreferences, MenuRecord } from '@/types/admin'
import { findMenuTrail } from '@/utils/menu'

type SetPreferences = (
  updater:
    | ((preferences: AdminPreferences) => Partial<AdminPreferences>)
    | Partial<AdminPreferences>
) => void

type AdminHeaderProps = {
  activePath: string
  activeRootPath: string
  hidden: boolean
  isMobile: boolean
  layout: AdminPreferences['layout']
  menu: MenuRecord[]
  navigate: (path: string) => void
  onLogout: () => void
  onRefresh: () => void
  onSelectRoot: (item: MenuRecord) => void
  openLock: () => void
  openPreferences: () => void
  openSearch: () => void
  preferences: AdminPreferences
  preferencesButtonPlacement: PreferencesButtonPlacement
  setPreferences: SetPreferences
  sidebarEnabled: boolean
}

type HeaderNavigationProps = {
  activePath: string
  activeRootPath: string
  className?: string
  menu: MenuRecord[]
  navigate: (path: string) => void
  onSelectRoot: (item: MenuRecord) => void
  rootOnly?: boolean
  showBrand?: boolean
  systemName: string
  topNavigationLabel: string
}

type HeaderNavigationItemProps = {
  activePath: string
  activeRootPath: string
  item: MenuRecord
  navigate: (path: string) => void
  onSelectRoot: (item: MenuRecord) => void
  rootOnly: boolean
}

type HeaderIconButtonProps = {
  children: ReactNode
  dataPreferencesPosition?: AdminPreferences['appPreferencesButtonPosition']
  label: string
  onClick?: () => void
}

type LanguageDropdownProps = {
  locale: string
  setLocale: (locale: string) => void
}

type TimezoneDialogButtonProps = {
  locale: string
  setTimezone: (timezone: string) => void
  timezone: string
}

type UserMenuProps = {
  locale: string
  lockScreenEnabled: boolean
  openLock: () => void
  openPreferences: () => void
  showPreferencesItem?: boolean
  onLogout: () => void
}

const emptyNotifications: NotificationRecord[] = []

/**
 * 渲染后台顶栏、面包屑、导航和工具按钮。
 *
 * @param props - 组件属性。
 * @param props.activePath - 当前激活的路由路径。
 * @param props.activeRootPath - 当前激活的一级菜单路径。
 * @param props.hidden - 顶栏是否处于滚动隐藏状态。
 * @param props.isMobile - 当前是否为移动端视口。
 * @param props.layout - 当前后台布局模式。
 * @param props.menu - 顶栏可用的菜单树。
 * @param props.navigate - 路由跳转回调。
 * @param props.onRefresh - 刷新当前标签页回调。
 * @param props.onSelectRoot - 混合导航根菜单选择回调。
 * @param props.openLock - 打开锁屏设置入口。
 * @param props.openPreferences - 打开偏好设置入口。
 * @param props.openSearch - 打开全局搜索入口。
 * @param props.preferences - 当前偏好设置。
 * @param props.preferencesButtonPlacement - 偏好设置按钮展示位置。
 * @param props.setPreferences - 更新偏好设置回调。
 * @param props.sidebarEnabled - 当前布局是否启用侧边栏。
 * @returns 后台顶栏。
 */
export function AdminHeader({
  activePath,
  activeRootPath,
  hidden,
  isMobile,
  layout,
  menu,
  navigate,
  onLogout,
  onRefresh,
  onSelectRoot,
  openLock,
  openPreferences,
  openSearch,
  preferences,
  preferencesButtonPlacement,
  setPreferences,
  sidebarEnabled
}: AdminHeaderProps) {
  const messages = getAdminMessages(preferences.appLocale)
  const [browserFullscreen, setBrowserFullscreen] = useState(false)
  const rawTrail = findMenuTrail(menu, activePath) ?? [
    { key: activePath, path: activePath, title: getMenuTitle(activePath, menu) }
  ]
  const homeTrail = preferences.breadcrumbShowHome
    ? [
        { key: '__home', path: ADMIN_DEFAULT_PATH, title: messages.common.home },
        ...rawTrail.filter(item => item.path !== ADMIN_DEFAULT_PATH)
      ]
    : rawTrail
  const trail = preferences.breadcrumbHideOnlyOne && homeTrail.length <= 1 ? [] : homeTrail
  const isDark = preferences.colorMode === 'dark'
  const headerNavigationEnabled =
    !isMobile && ['header-mixed-nav', 'header-nav', 'mixed-nav'].includes(layout)
  const headerNavigationRootOnly =
    !isMobile &&
    (layout === 'header-mixed-nav' || (layout === 'mixed-nav' && preferences.navigationSplit))
  const headerFullWidth = layout === 'header-sidebar-nav'
  const headerInlineBrandVisible =
    !isMobile &&
    (['header-mixed-nav', 'header-nav', 'header-sidebar-nav'].includes(layout) ||
      (layout === 'mixed-nav' && !sidebarEnabled))
  const headerInlineBrandStyle =
    layout === 'header-sidebar-nav'
      ? ({ minWidth: 'var(--admin-header-brand-width)' } as CSSProperties)
      : undefined
  const mobileHeaderLogoVisible = isMobile
  const headerJustifyClass =
    preferences.headerMenuAlign === 'center'
      ? 'justify-center'
      : preferences.headerMenuAlign === 'end'
        ? 'justify-end'
        : 'justify-start'
  const fixedHeader = ['auto', 'auto-scroll', 'fixed'].includes(preferences.headerMode)
  const mobileSidebarTriggerVisible =
    isMobile &&
    sidebarEnabled &&
    preferences.sidebarEnable &&
    !preferences.sidebarHidden &&
    layout !== 'full-content'

  useEffect(() => {
    /**
     * 同步浏览器全屏状态到顶栏按钮。
     */
    function handleFullscreenChange() {
      setBrowserFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    handleFullscreenChange()

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  /**
   * 切换浏览器全屏模式。
   */
  function toggleBrowserFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.()
      return
    }

    void document.documentElement.requestFullscreen?.()
  }

  return (
    <header
      className={cn(
        'flex shrink-0 items-center gap-2 border-b bg-header px-3 text-[hsl(var(--header-foreground,var(--foreground)))] transition-[margin-top,transform] duration-200',
        fixedHeader && 'sticky top-0 z-20',
        hidden && '-mt-(--admin-header-height)',
        headerFullWidth && 'admin-header-full-width'
      )}
      data-slot="admin-header"
      style={{ height: preferences.headerHeight }}
    >
      {mobileHeaderLogoVisible && (
        <div
          className="flex h-full w-10 shrink-0 items-center justify-center"
          data-slot="admin-header-mobile-brand"
        >
          <AppLogo size="sm" />
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
            <AppLogo size="sm" />
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
              'hidden items-center gap-1 text-sm text-muted-foreground md:flex',
              preferences.breadcrumbStyleType === 'background' && 'rounded-md bg-accent px-2 py-1'
            )}
          >
            {trail.map((item, index) => (
              <span className="inline-flex items-center gap-1" key={item.key}>
                {index > 0 && <ChevronRight className="size-3" />}
                {preferences.breadcrumbShowIcon && index === 0 && (
                  <LayoutDashboard className="size-3.5" />
                )}
                <span className={index === trail.length - 1 ? 'text-foreground' : ''}>
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
          onClick={() => setPreferences({ colorMode: isDark ? 'light' : 'dark' })}
        >
          {isDark ? <Sun /> : <Moon />}
        </HeaderIconButton>
      )}
      {preferencesButtonPlacement.header && preferences.widgetLanguageToggle && (
        <LanguageDropdown
          locale={preferences.appLocale}
          setLocale={appLocale => setPreferences({ appLocale })}
        />
      )}
      {preferencesButtonPlacement.header && preferences.widgetTimezone && (
        <TimezoneDialogButton
          locale={preferences.appLocale}
          setTimezone={appTimezone => setPreferences({ appTimezone })}
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
        onLogout={onLogout}
        openLock={openLock}
        openPreferences={openPreferences}
        showPreferencesItem={preferencesButtonPlacement.userDropdown}
      />
    </header>
  )
}

/**
 * 渲染顶栏导航列表和品牌区域。
 *
 * @param props - 组件属性。
 * @returns 顶栏导航内容。
 */
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
  topNavigationLabel
}: HeaderNavigationProps) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-3', className)}>
      {showBrand && (
        <>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <AppLogo size="sm" />
            <span className="text-sm font-semibold">{systemName}</span>
          </div>
          <Separator className="hidden h-5 md:block" orientation="vertical" />
        </>
      )}
      <nav
        aria-label={topNavigationLabel}
        className="admin-header-nav-scroll flex min-w-0 items-center gap-1 overflow-x-auto overflow-y-hidden"
      >
        {menu.map(item => (
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
  )
}

/**
 * 渲染单个顶栏导航项及其子菜单。
 *
 * @param props - 组件属性。
 * @returns 顶栏导航项。
 */
function HeaderNavigationItem({
  activePath,
  activeRootPath,
  item,
  navigate,
  onSelectRoot,
  rootOnly
}: HeaderNavigationItemProps) {
  const Icon = getMenuRecordIcon(item)
  const children = item.children ?? []
  const isActive = rootOnly ? activeRootPath === item.path : isMenuRecordActive(item, activePath)

  if (rootOnly || children.length === 0) {
    const targetPath = rootOnly ? getDefaultMenuPath(item) : item.path

    return (
      <Button
        className={cn(
          'h-8 gap-1.5 px-2 text-muted-foreground',
          isActive && 'bg-muted text-foreground'
        )}
        onClick={() => (rootOnly ? onSelectRoot(item) : navigate(targetPath))}
        variant="ghost"
      >
        {Icon && <Icon className="size-4" />}
        <span>{item.title}</span>
        {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
      </Button>
    )
  }

  if (children.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'h-8 gap-1.5 px-2 text-muted-foreground',
              isActive && 'bg-muted text-foreground'
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
          {children.map(child => {
            const ChildIcon = getMenuRecordIcon(child)
            const childActive = isMenuRecordActive(child, activePath)

            return (
              <DropdownMenuItem asChild key={child.key}>
                <a
                  aria-current={childActive ? 'page' : undefined}
                  className={cn(childActive && 'bg-accent text-accent-foreground')}
                  href={child.path}
                  onClick={event => {
                    event.preventDefault()
                    navigate(child.path)
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
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return null
}

/**
 * 渲染顶栏图标按钮并附带悬浮提示。
 *
 * @param props - 组件属性。
 * @returns 顶栏图标按钮。
 */
function HeaderIconButton({
  children,
  dataPreferencesPosition,
  label,
  onClick
}: HeaderIconButtonProps) {
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
  )
}

/**
 * 渲染语言切换下拉菜单。
 *
 * @param props - 组件属性。
 * @returns 语言切换菜单。
 */
function LanguageDropdown({ locale, setLocale }: LanguageDropdownProps) {
  const messages = getAdminMessages(locale)
  const localeOptions = getLocaleOptions(locale)

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
          {localeOptions.map(item => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 打开时区选择弹窗并保存时区。
 *
 * @param props - 组件属性。
 * @returns 时区选择入口。
 */
function TimezoneDialogButton({ locale, setTimezone, timezone }: TimezoneDialogButtonProps) {
  const messages = getAdminMessages(locale)
  const [open, setOpen] = useState(false)
  const [draftTimezone, setDraftTimezone] = useState(timezone)

  /**
   * 确认并保存时区选择。
   */
  function confirmTimezone() {
    setTimezone(draftTimezone)
    setOpen(false)
  }

  /**
   * 打开时区弹窗并同步当前值到草稿。
   */
  function openTimezoneDialog() {
    setDraftTimezone(timezone)
    setOpen(true)
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
            {preferenceTimezoneOptions.map(item => {
              const active = draftTimezone === item.value

              return (
                <div
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-2 hover:bg-accent',
                    active && 'border-primary bg-accent text-accent-foreground'
                  )}
                  key={item.value}
                  onClick={() => setDraftTimezone(item.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setDraftTimezone(item.value)
                    }
                  }}
                  role="presentation"
                >
                  <RadioGroupItem aria-label={item.label} value={item.value} />
                  <span className="text-sm">{item.label}</span>
                </div>
              )
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
  )
}

/**
 * 渲染顶栏通知入口和通知列表。
 *
 * @param props - 组件属性。
 * @returns 通知下拉菜单。
 */
function NotificationsMenu({ locale }: { locale: string }) {
  const messages = getAdminMessages(locale)
  const { data = emptyNotifications } = useQuery(notificationQueries.list())
  const unreadCount = useMemo(() => data.filter(item => item.status === 'unread').length, [data])

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
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{messages.header.notifications}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data.length > 0 ? (
          data.map(item => (
            <DropdownMenuItem className="items-start gap-2" key={item.id}>
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <span className="grid gap-0.5">
                <span>{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>暂无通知</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 渲染用户下拉菜单及偏好和锁屏入口。
 *
 * @param props - 组件属性。
 * @returns 用户下拉菜单。
 */
function UserMenu({
  locale,
  lockScreenEnabled,
  onLogout,
  openLock,
  openPreferences,
  showPreferencesItem = false
}: UserMenuProps) {
  const messages = getAdminMessages(locale)

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
        <DropdownMenuItem onClick={onLogout}>
          <LogOut />
          {messages.header.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
