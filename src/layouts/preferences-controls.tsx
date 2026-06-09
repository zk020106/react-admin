import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getPreferenceStepAria } from "@/i18n/admin-i18n";
import { cn } from "@/lib/utils";

type PreferenceOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type PreferenceBlockProps = {
  children: ReactNode;
  title: string;
};

type PreferenceNumberProps = {
  disabled?: boolean;
  label: string;
  locale: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  step?: number;
  value: number;
};

type PreferenceTextProps = {
  disabled?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  value: string;
};

type PreferenceSegmentedProps<TValue extends string> = {
  disabled?: boolean;
  items: Array<PreferenceOption<TValue>>;
  label: string;
  onValueChange: (value: TValue) => void;
  value: TValue;
};

type PreferenceCheckboxGroupProps<TValue extends string> = {
  disabled?: boolean;
  items: Array<PreferenceOption<TValue>>;
  label: string;
  onValuesChange: (values: TValue[]) => void;
  values: TValue[];
};

type PreferenceSelectProps<TValue extends string> = {
  disabled?: boolean;
  items: Array<PreferenceOption<TValue>>;
  label: string;
  onValueChange: (value: TValue) => void;
  value: TValue;
};

type PreferenceToggleProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  shortcut?: string;
};

/**
 * 渲染偏好设置面板中的分组区块。
 *
 * @param props - 组件属性。
 * @param props.children - 分组内的偏好控件。
 * @param props.title - 分组标题文本。
 * @returns 带标题和分割线的偏好设置分组。
 */
export function PreferenceBlock({ children, title }: PreferenceBlockProps) {
  return (
    <section className="flex flex-col border-b py-4 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold leading-none tracking-normal">{title}</h3>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}

/**
 * 渲染偏好设置中的数值步进控件。
 *
 * @param props - 组件属性。
 * @param props.disabled - 是否禁用当前控件。
 * @param props.label - 控件标签文本。
 * @param props.locale - 当前语言环境，用于生成无障碍文案。
 * @param props.max - 允许设置的最大值。
 * @param props.min - 允许设置的最小值。
 * @param props.onValueChange - 数值变更回调。
 * @param props.step - 每次点击步进按钮调整的数值。
 * @param props.value - 当前数值。
 * @returns 带加减按钮和数字输入框的偏好控件。
 */
export function PreferenceNumber({
  disabled = false,
  label,
  locale,
  max,
  min,
  onValueChange,
  step = 1,
  value,
}: PreferenceNumberProps) {
  /**
   * 约束数值步进后的结果并回传。
   *
   * @param next - 用户输入或按钮步进后的候选值。
   */
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

/**
 * 渲染偏好设置中的文本输入项。
 *
 * @param props - 组件属性。
 * @param props.disabled - 是否禁用当前控件。
 * @param props.label - 输入项标签文本。
 * @param props.onValueChange - 文本变更回调。
 * @param props.value - 当前文本值。
 * @returns 带标签的文本输入控件。
 */
export function PreferenceText({
  disabled = false,
  label,
  onValueChange,
  value,
}: PreferenceTextProps) {
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

/**
 * 渲染偏好设置中的分段单选控件。
 *
 * @typeParam TValue - 单选项 value 的字符串字面量类型。
 * @param props - 组件属性。
 * @param props.disabled - 是否禁用当前控件。
 * @param props.items - 可选择的分段项列表。
 * @param props.label - 控件标签文本。
 * @param props.onValueChange - 单选值变更回调。
 * @param props.value - 当前选中的值。
 * @returns 右侧按钮式分段单选控件。
 */
export function PreferenceSegmented<TValue extends string>({
  disabled = false,
  items,
  label,
  onValueChange,
  value,
}: PreferenceSegmentedProps<TValue>) {
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

/**
 * 渲染偏好设置中的多选按钮组。
 *
 * @typeParam TValue - 多选项 value 的字符串字面量类型。
 * @param props - 组件属性。
 * @param props.disabled - 是否禁用当前控件。
 * @param props.items - 可选择的多选项列表。
 * @param props.label - 控件标签文本。
 * @param props.onValuesChange - 多选值集合变更回调。
 * @param props.values - 当前已选中的值集合。
 * @returns 右侧按钮式多选控件。
 */
export function PreferenceCheckboxGroup<TValue extends string>({
  disabled = false,
  items,
  label,
  onValuesChange,
  values,
}: PreferenceCheckboxGroupProps<TValue>) {
  /**
   * 根据当前选中状态添加或移除多选值。
   *
   * @param value - 本次点击的多选项值。
   */
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

/**
 * 渲染偏好设置中的下拉选择控件。
 *
 * @typeParam TValue - 下拉选项 value 的字符串字面量类型。
 * @param props - 组件属性。
 * @param props.disabled - 是否禁用当前控件。
 * @param props.items - 下拉选项列表。
 * @param props.label - 控件标签文本。
 * @param props.onValueChange - 下拉值变更回调。
 * @param props.value - 当前选中的值。
 * @returns 带标签的下拉选择控件。
 */
export function PreferenceSelect<TValue extends string>({
  disabled = false,
  items,
  label,
  onValueChange,
  value,
}: PreferenceSelectProps<TValue>) {
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

/**
 * 渲染偏好设置中的开关项。
 *
 * @param props - 组件属性。
 * @param props.checked - 当前开关是否开启。
 * @param props.disabled - 是否禁用当前控件。
 * @param props.label - 开关标签文本。
 * @param props.onCheckedChange - 开关状态变更回调。
 * @param props.shortcut - 可选快捷键提示文本。
 * @returns 可点击整行切换的偏好开关控件。
 */
export function PreferenceToggle({
  checked,
  disabled = false,
  label,
  onCheckedChange,
  shortcut,
}: PreferenceToggleProps) {
  return (
    <div
      className={cn(
        "my-1 flex w-full items-center justify-between rounded-md px-2 py-2.5 hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <Label className="min-w-0 flex-1 text-sm">{label}</Label>
      {shortcut ? (
        <span className="mr-2 ml-auto shrink-0 text-xs opacity-60">{shortcut}</span>
      ) : null}
      <Switch
        checked={checked}
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
