import { Copy, Pin, PinOff, RefreshCcw } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getAdminMessages, getPreferenceTabs } from '@/i18n/admin-i18n'
import { cn } from '@/lib/utils'
import { getPreferenceDiff } from '@/layouts/preferences-options'
import {
  AppearancePreferences,
  GeneralPreferences,
  LayoutPreferences,
  ShortcutPreferences
} from '@/layouts/preferences-sections'
import type { PreferenceStoreState } from '@/store/preferences'
import type { AdminPreferences } from '@/types/admin'

type PreferencesSheetProps = {
  onClearCacheLogout: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  preferences: AdminPreferences
  resetPreferences: () => void
  setPreferences: PreferenceStoreState['setPreferences']
}

/**
 * 渲染偏好设置抽屉和全部配置页签。
 *
 * @param props - 组件属性。
 * @param props.onOpenChange - 抽屉开关状态变更回调。
 * @param props.open - 抽屉是否打开。
 * @param props.preferences - 当前完整偏好设置。
 * @param props.resetPreferences - 恢复默认偏好设置的方法。
 * @param props.setPreferences - 偏好设置更新方法。
 * @returns 偏好设置抽屉。
 */
export function PreferencesSheet({
  onClearCacheLogout,
  onOpenChange,
  open,
  preferences,
  resetPreferences,
  setPreferences
}: PreferencesSheetProps) {
  const messages = getAdminMessages(preferences.appLocale)
  const preferenceTabs = getPreferenceTabs(preferences.appLocale)
  const preferenceDiff = useMemo(() => getPreferenceDiff(preferences), [preferences])
  const hasPreferenceDiff = Object.keys(preferenceDiff).length > 0

  /**
   * 复制当前与默认值不同的偏好配置。
   *
   * @returns 剪贴板写入完成后的 Promise。
   */
  async function copyPreferences() {
    if (!hasPreferenceDiff) {
      return
    }

    await navigator.clipboard?.writeText(JSON.stringify(preferenceDiff, null, 2))
  }

  function handleClearCacheLogout() {
    resetPreferences()
    onOpenChange(false)
    onClearCacheLogout()
  }

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
                    {hasPreferenceDiff ? (
                      <span className="absolute top-1 right-1 size-1.5 rounded-sm bg-primary" />
                    ) : null}
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
                          !preferences.appEnableStickyPreferencesNavigationBar
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
                'grid h-9 w-full',
                preferences.appEnableStickyPreferencesNavigationBar && 'sticky top-0 z-20'
              )}
              style={{ gridTemplateColumns: `repeat(${preferenceTabs.length}, minmax(0, 1fr))` }}
            >
              {preferenceTabs.map(tab => (
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
              <LayoutPreferences preferences={preferences} setPreferences={setPreferences} />
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
            'grid gap-3 border-t p-4',
            preferences.appEnableCopyPreferences ? 'grid-cols-2' : 'grid-cols-1'
          )}
        >
          {preferences.appEnableCopyPreferences ? (
            <Button
              disabled={!hasPreferenceDiff}
              onClick={() => void copyPreferences()}
              variant="default"
            >
              <Copy />
              {messages.preferences.actions.copy}
            </Button>
          ) : null}
          <Button onClick={handleClearCacheLogout} variant="ghost">
            {messages.preferences.actions.clearCacheLogout}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
