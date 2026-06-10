import {
  ArrowLeftToLine,
  ArrowRightLeft,
  ArrowRightToLine,
  Copy,
  ExternalLink,
  FoldHorizontal,
  LayoutDashboard,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  RefreshCcw,
  X
} from 'lucide-react'
import { useRef, type WheelEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAdminMessages } from '@/i18n/admin-i18n'
import { cn } from '@/lib/utils'
import { getTabIcon } from '@/layouts/navigation'
import { tabsStore } from '@/store/tabs'
import type { AdminPreferences, TabRecord } from '@/types/admin'

type TabbarProps = {
  activePath: string
  closeAllTabs: () => void
  closeLeftTabs: (key: string) => void
  closeOtherTabs: (key: string) => void
  closeRightTabs: (key: string) => void
  closeTab: (key: string) => void
  contentMaximized: boolean
  navigate: (path: string) => void
  onRefresh: () => void
  onToggleMaximize: () => void
  preferences: AdminPreferences
  tabs: TabRecord[]
  toggleTabPin: (key: string) => void
}

/**
 * 渲染页面标签栏及其右键菜单操作。
 *
 * @param props - 组件属性。
 * @param props.activePath - 当前激活路由路径。
 * @param props.closeAllTabs - 关闭全部可关闭标签的回调。
 * @param props.closeLeftTabs - 关闭指定标签左侧标签的回调。
 * @param props.closeOtherTabs - 关闭指定标签以外标签的回调。
 * @param props.closeRightTabs - 关闭指定标签右侧标签的回调。
 * @param props.closeTab - 关闭单个标签的回调。
 * @param props.contentMaximized - 内容区是否最大化。
 * @param props.navigate - 标签切换导航回调。
 * @param props.onRefresh - 刷新当前页面回调。
 * @param props.onToggleMaximize - 切换内容区最大化回调。
 * @param props.preferences - 当前完整偏好设置。
 * @param props.tabs - 当前标签页列表。
 * @param props.toggleTabPin - 切换标签固定状态的回调。
 * @returns 后台页面标签栏。
 */
export function Tabbar({
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
  toggleTabPin
}: TabbarProps) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const messages = getAdminMessages(preferences.appLocale)
  const tabbarClass =
    preferences.tabbarStyleType === 'card'
      ? 'gap-1'
      : preferences.tabbarStyleType === 'plain'
        ? 'gap-0'
        : 'gap-2'

  const visibleTabs = getVisibleTabs(tabs, activePath, preferences.tabbarMaxCount)
  const activeTab = tabs.find(tab => tab.key === activePath)

  /**
   * 把纵向滚轮转换为标签栏横向滚动。
   *
   * @param event - 标签列表的滚轮事件。
   */
  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!preferences.tabbarWheelable || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return
    }

    event.preventDefault()
    event.currentTarget.scrollLeft += event.deltaY
  }

  /**
   * 复制标签页路径到剪贴板。
   *
   * @param tab - 待复制路径的标签页。
   */
  function copyTabPath(tab: TabRecord) {
    void navigator.clipboard?.writeText(tab.path)
  }

  /**
   * 在新窗口打开标签页路径。
   *
   * @param tab - 待打开的标签页。
   */
  function openTabInNewWindow(tab: TabRecord) {
    window.open(tab.path, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="flex items-center gap-2 border-b bg-header px-3"
      style={{ height: preferences.tabbarHeight }}
    >
      <Tabs className="min-w-0 flex-1" onValueChange={navigate} value={activePath}>
        <TabsList
          className={cn(
            'admin-tabs-scroll max-w-full overflow-x-auto overflow-y-hidden',
            tabbarClass
          )}
          onWheel={handleWheel}
          ref={listRef}
          variant="line"
        >
          {visibleTabs.map(tab => {
            const tabIndex = tabs.findIndex(item => item.key === tab.key)
            const canClose = !tab.affix && tabs.length > 1
            const hasClosableLeft = tabs.slice(0, tabIndex).some(item => !item.affix)
            const hasClosableRight = tabs.slice(tabIndex + 1).some(item => !item.affix)
            const hasClosableOther = tabs.some(item => item.key !== tab.key && !item.affix)
            const Icon = getTabIcon(tab, LayoutDashboard)

            return (
              <ContextMenu key={tab.key} modal={false}>
                <ContextMenuTrigger asChild>
                  <div
                    className="group/tab flex items-center"
                    draggable={preferences.tabbarDraggable && !tab.affix}
                    onDragStart={event => {
                      if (!preferences.tabbarDraggable) {
                        return
                      }

                      event.dataTransfer.setData('text/plain', tab.key)
                    }}
                    onDragOver={event => {
                      if (preferences.tabbarDraggable) {
                        event.preventDefault()
                      }
                    }}
                    onDrop={event => {
                      if (!preferences.tabbarDraggable) {
                        return
                      }

                      event.preventDefault()
                      const fromKey = event.dataTransfer.getData('text/plain')
                      const currentTabs = tabsStore.getState().tabs
                      const fromIndex = currentTabs.findIndex(item => item.key === fromKey)
                      const toIndex = currentTabs.findIndex(item => item.key === tab.key)

                      tabsStore.getState().reorderTabs(fromIndex, toIndex)
                    }}
                  >
                    <TabsTrigger
                      className={cn(
                        'h-8 px-2',
                        preferences.tabbarStyleType === 'card' && 'rounded-md border bg-background',
                        preferences.tabbarStyleType === 'brisk' && 'h-7'
                      )}
                      onMouseDown={event => {
                        if (
                          event.button === 1 &&
                          preferences.tabbarMiddleClickToClose &&
                          !tab.affix
                        ) {
                          event.preventDefault()
                          closeTab(tab.key)
                        }
                      }}
                      value={tab.key}
                    >
                      {preferences.tabbarShowIcon && Icon ? <Icon className="size-3.5" /> : null}
                      {tab.title}
                    </TabsTrigger>
                    {!tab.affix ? (
                      <Button
                        aria-label={messages.tabbar.closeCurrent.replace('{title}', tab.title)}
                        className="-ml-1 opacity-60 group-hover/tab:opacity-100"
                        onClick={() => closeTab(tab.key)}
                        size="icon-xs"
                        variant="ghost"
                      >
                        <X />
                      </Button>
                    ) : null}
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
                    disabled={!tabs.some(item => !item.affix)}
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
            )
          })}
        </TabsList>
      </Tabs>
      {preferences.tabbarShowMore && activeTab ? (
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
      ) : null}
      {preferences.tabbarShowRefresh ? (
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
      ) : null}
      {preferences.tabbarShowMaximize ? (
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
      ) : null}
    </div>
  )
}

/**
 * 按最大显示数量裁剪标签并保留当前激活标签。
 *
 * @param tabs - 当前标签页列表。
 * @param activePath - 当前激活路由路径。
 * @param maxCount - 最多展示的标签数量，0 表示不限制。
 * @returns 裁剪后的标签页列表。
 */
export function getVisibleTabs(tabs: TabRecord[], activePath: string, maxCount: number) {
  if (maxCount <= 0 || tabs.length <= maxCount) {
    return tabs
  }

  const latestTabs = tabs.slice(-maxCount)

  if (latestTabs.some(tab => tab.key === activePath)) {
    return latestTabs
  }

  const activeTab = tabs.find(tab => tab.key === activePath)

  if (!activeTab) {
    return latestTabs
  }

  return [...latestTabs.slice(1), activeTab]
}
