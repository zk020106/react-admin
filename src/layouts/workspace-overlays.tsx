import { useDebounce } from "ahooks";
import { CircleUserRound, LockKeyhole, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminMessages } from "@/i18n/admin-i18n";
import type { MenuManagementRecord, UserRecord } from "@/mock/admin-mock";
import { systemQueries } from "@/pages/admin-queries";
import { ADMIN_DEFAULT_PATH, getMenuTitle } from "@/router/app-data";
import type { MenuRecord } from "@/types/admin";
import { buildWorkspaceSearchItems } from "@/utils/menu";

type GlobalSearchDialogProps = {
  locale: string;
  menu: MenuRecord[];
  navigate: (path: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

type LockScreenSetupDialogProps = {
  locale: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  open: boolean;
};

type LockScreenOverlayProps = {
  locale: string;
  onUnlock: () => void;
  password: string;
  timezone: string;
};

const emptyMenuManagementRecords: MenuManagementRecord[] = [];
const emptyUsers: UserRecord[] = [];

/**
 * 渲染菜单路由的全局搜索弹窗。
 *
 * @param props - 组件属性。
 * @param props.locale - 当前语言环境。
 * @param props.menu - 可搜索的菜单树。
 * @param props.navigate - 搜索结果跳转回调。
 * @param props.onOpenChange - 弹窗开关状态变更回调。
 * @param props.open - 弹窗是否打开。
 * @returns 全局搜索弹窗。
 */
export function GlobalSearchDialog({
  locale,
  menu,
  navigate,
  onOpenChange,
  open,
}: GlobalSearchDialogProps) {
  const messages = getAdminMessages(locale);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, { wait: 120 });
  const defaultSearchTerm = getMenuTitle(ADMIN_DEFAULT_PATH, menu);
  const { data: users = emptyUsers } = useQuery({ ...systemQueries.users(), enabled: open });
  const { data: managementMenus = emptyMenuManagementRecords } = useQuery({
    ...systemQueries.menus(),
    enabled: open,
  });
  const searchItems = useMemo(
    () => buildWorkspaceSearchItems(menu, users, managementMenus),
    [managementMenus, menu, users],
  );
  const results = useMemo(() => {
    const normalizedQuery = (debouncedQuery || defaultSearchTerm).trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return searchItems.filter((item) =>
      [item.title, item.description, item.keyword]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [debouncedQuery, defaultSearchTerm, searchItems]);

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
                key={`${item.type}:${item.title}:${item.path}`}
                onSelect={() => {
                  navigate(item.path);
                  onOpenChange(false);
                }}
                value={`${item.title} ${item.description} ${item.keyword}`}
              >
                <Search className="size-4" />
                <span className="grid gap-0.5">
                  <span>{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

/**
 * 渲染本次会话的锁屏密码设置弹窗。
 *
 * @param props - 组件属性。
 * @param props.locale - 当前语言环境。
 * @param props.onOpenChange - 弹窗开关状态变更回调。
 * @param props.onSubmit - 锁屏密码提交回调。
 * @param props.open - 弹窗是否打开。
 * @returns 锁屏设置弹窗。
 */
export function LockScreenSetupDialog({
  locale,
  onOpenChange,
  onSubmit,
  open,
}: LockScreenSetupDialogProps) {
  const messages = getAdminMessages(locale);
  const [password, setPassword] = useState("");

  /**
   * 同步锁屏设置弹窗显隐并在关闭时清空密码。
   *
   * @param nextOpen - 下一次弹窗开关状态。
   */
  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setPassword("");
    }
  }

  /**
   * 提交锁屏密码并重置输入框。
   *
   * @param event - 表单提交事件。
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

/**
 * 渲染锁屏界面并处理解锁表单。
 *
 * @param props - 组件属性。
 * @param props.locale - 当前语言环境。
 * @param props.onUnlock - 解锁成功回调。
 * @param props.password - 本次会话锁屏密码。
 * @param props.timezone - 锁屏时间展示时区。
 * @returns 锁屏覆盖层。
 */
export function LockScreenOverlay({
  locale,
  onUnlock,
  password,
  timezone,
}: LockScreenOverlayProps) {
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

  /**
   * 进入锁屏解锁表单。
   */
  function openUnlockForm() {
    setError("");
    setShowUnlockForm(true);
  }

  /**
   * 关闭解锁表单并清理输入状态。
   */
  function closeUnlockForm() {
    setError("");
    setUnlockPassword("");
    setShowUnlockForm(false);
  }

  /**
   * 校验锁屏密码并在通过后解锁。
   *
   * @param event - 表单提交事件。
   */
  function handleUnlock(event: FormEvent<HTMLFormElement>) {
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
              {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
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
        {showUnlockForm ? (
          <div className="mb-2 text-2xl md:text-3xl">
            {hour}:{minute} <span className="text-base md:text-lg">{meridiem}</span>
          </div>
        ) : null}
        <div className="text-xl md:text-3xl">{date}</div>
      </div>
    </div>
  );
}
