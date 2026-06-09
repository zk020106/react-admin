import { getAdminMessages, getLocaleOptions } from "@/i18n/admin-i18n";
import {
  PreferenceBlock,
  PreferenceSelect,
  PreferenceText,
  PreferenceToggle,
} from "@/layouts/preferences-controls";
import {
  BuiltinThemeGrid,
  FontSizeStepper,
  RadiusPicker,
  ThemeModePicker,
  TransitionPresetPicker,
} from "@/layouts/preferences-pickers";
import { preferenceTimezoneOptions } from "@/layouts/preferences-options";
import type { PreferenceStoreState } from "@/store/preferences";
import type { AdminPreferences } from "@/types/admin";

type PreferencesSectionProps = {
  preferences: AdminPreferences;
  setPreferences: PreferenceStoreState["setPreferences"];
};

/**
 * 渲染偏好设置中的外观配置分组。
 *
 * @param props - 组件属性。
 * @param props.preferences - 当前完整偏好设置。
 * @param props.setPreferences - 偏好设置更新方法。
 * @returns 外观页签内的主题、圆角、字号和辅助显示配置。
 */
export function AppearancePreferences({ preferences, setPreferences }: PreferencesSectionProps) {
  const messages = getAdminMessages(preferences.appLocale);
  const isDarkMode = preferences.colorMode === "dark";
  const isFullContent = preferences.layout === "full-content";
  const isDoubleColumnLayout = ["header-mixed-nav", "sidebar-mixed-nav"].includes(
    preferences.layout,
  );
  const darkSidebarDisabled = isDarkMode || preferences.layout === "header-nav" || isFullContent;
  const darkSidebarSubDisabled =
    isDarkMode || !isDoubleColumnLayout || !preferences.themeSemiDarkSidebar;

  return (
    <>
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
              themeSemiDarkSidebarSub: checked ? preferences.themeSemiDarkSidebarSub : false,
            })
          }
        />
        <PreferenceToggle
          checked={preferences.themeSemiDarkSidebarSub}
          disabled={darkSidebarSubDisabled}
          label={messages.preferences.appearance.darkSidebarSub}
          onCheckedChange={(checked) => setPreferences({ themeSemiDarkSidebarSub: checked })}
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
    </>
  );
}

/**
 * 渲染偏好设置中的快捷键配置分组。
 *
 * @param props - 组件属性。
 * @param props.preferences - 当前完整偏好设置。
 * @param props.setPreferences - 偏好设置更新方法。
 * @returns 快捷键页签内的开关列表。
 */
export function ShortcutPreferences({ preferences, setPreferences }: PreferencesSectionProps) {
  const messages = getAdminMessages(preferences.appLocale);

  return (
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
        onCheckedChange={(shortcutKeysGlobalSearch) => setPreferences({ shortcutKeysGlobalSearch })}
        shortcut="Ctrl / ⌘ K"
      />
      <PreferenceToggle
        checked={preferences.shortcutKeysGlobalLogout}
        disabled={!preferences.shortcutKeysEnable}
        label={messages.preferences.shortcut.logout}
        onCheckedChange={(shortcutKeysGlobalLogout) => setPreferences({ shortcutKeysGlobalLogout })}
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
        onCheckedChange={(shortcutKeysGlobalEscape) => setPreferences({ shortcutKeysGlobalEscape })}
        shortcut="Esc"
      />
    </PreferenceBlock>
  );
}

/**
 * 渲染偏好设置中的通用配置和动画配置分组。
 *
 * @param props - 组件属性。
 * @param props.preferences - 当前完整偏好设置。
 * @param props.setPreferences - 偏好设置更新方法。
 * @returns 通用页签内的基础配置和页面动画配置。
 */
export function GeneralPreferences({ preferences, setPreferences }: PreferencesSectionProps) {
  const messages = getAdminMessages(preferences.appLocale);
  const localeOptions = getLocaleOptions(preferences.appLocale);

  return (
    <>
      <PreferenceBlock title={messages.preferences.general.title}>
        <PreferenceSelect
          items={localeOptions}
          label={messages.preferences.general.language}
          onValueChange={(appLocale) => setPreferences({ appLocale })}
          value={preferences.appLocale}
        />
        <PreferenceSelect
          items={preferenceTimezoneOptions}
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
        {preferences.appWatermark ? (
          <PreferenceText
            label={messages.preferences.general.watermarkContent}
            onValueChange={(appWatermarkContent) => setPreferences({ appWatermarkContent })}
            value={preferences.appWatermarkContent}
          />
        ) : null}
        <PreferenceToggle
          checked={preferences.appEnableCheckUpdates}
          label={messages.preferences.general.checkUpdates}
          onCheckedChange={(appEnableCheckUpdates) => setPreferences({ appEnableCheckUpdates })}
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
        {preferences.transitionEnable ? (
          <TransitionPresetPicker
            activeName={preferences.transitionName}
            locale={preferences.appLocale}
            onSelect={(transitionName) => setPreferences({ transitionName })}
          />
        ) : null}
      </PreferenceBlock>
    </>
  );
}
