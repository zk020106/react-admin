import { zodResolver } from "@hookform/resolvers/zod";
import { Expand, PanelsTopLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormApi } from "@/utils/form-api";
import { DrawerApi, ModalApi, type PopupState } from "@/utils/popup-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { getAdminMessages } from "@/i18n/admin-i18n";

type AdminMessages = ReturnType<typeof getAdminMessages>;

// 钩子：usePopupState。订阅弹窗 API 状态并映射为 React 状态。
function usePopupState(api: ModalApi | DrawerApi) {
  const [state, setState] = useState<PopupState>(api.getState());

  useEffect(() => api.subscribe((next) => setState(next)), [api]);

  return state;
}

// 组件：PopupLab。用于演示模态弹窗和抽屉 API 的交互能力。
export function PopupLab({ messages }: { messages: AdminMessages }) {
  const popup = messages.pages.popup;
  const modalApi = useMemo(() => new ModalApi({ title: popup.modalTitle }), [popup.modalTitle]);
  const drawerApi = useMemo(
    () => new DrawerApi({ placement: "right", title: popup.drawerTitle }),
    [popup.drawerTitle],
  );
  const modalState = usePopupState(modalApi);
  const drawerState = usePopupState(drawerApi);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{popup.title}</CardTitle>
        <CardDescription>{popup.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          onClick={() => modalApi.setData({ [popup.modalSourceKey]: popup.modalSource }).open()}
        >
          <Expand />
          {popup.openModal}
        </Button>
        <Button
          onClick={() => drawerApi.setData({ [popup.drawerSourceKey]: popup.drawerSource }).open()}
          variant="outline"
        >
          <PanelsTopLeft />
          {popup.openDrawer}
        </Button>
      </CardContent>
      <Dialog
        open={modalState.isOpen}
        onOpenChange={(open) => (open ? modalApi.open() : void modalApi.close())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalState.title}</DialogTitle>
            <DialogDescription>
              {popup.payload}: {JSON.stringify(modalApi.getData())}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => modalApi.lock()} variant="outline">
              {popup.lock}
            </Button>
            <Button onClick={() => void modalApi.close()}>{popup.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet
        open={drawerState.isOpen}
        onOpenChange={(open) => (open ? drawerApi.open() : void drawerApi.close())}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{drawerState.title}</SheetTitle>
            <SheetDescription>
              {popup.payload}: {JSON.stringify(drawerApi.getData())}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Button onClick={() => void drawerApi.close()}>{popup.closeDrawer}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}

const schemaForm = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.string().min(1),
});

// 组件：SchemaFormPanel。用于演示 schema 表单配置和统一提交能力。
export function SchemaFormPanel({ messages }: { messages: AdminMessages }) {
  const schemaFormMessages = messages.pages.schemaForm;
  const [submitted, setSubmitted] = useState<Record<string, unknown>>({});
  const form = useForm<z.infer<typeof schemaForm>>({
    defaultValues: {
      email: "root@example.com",
      name: "Root",
      role: schemaFormMessages.defaultRole,
    },
    resolver: zodResolver(schemaForm),
  });
  const api = useMemo(
    () =>
      new FormApi({
        handleSubmit: setSubmitted,
        schema: [
          { component: "input", fieldName: "name", label: schemaFormMessages.name },
          { component: "input", fieldName: "email", label: schemaFormMessages.email },
          { component: "select", fieldName: "role", label: schemaFormMessages.role },
        ],
      }),
    [schemaFormMessages.email, schemaFormMessages.name, schemaFormMessages.role],
  );

  // 函数：submitForm。挂载表单能力并通过 FormApi 统一提交。
  async function submitForm() {
    api.mount({
      reset: form.reset,
      setValue: (fieldName, value) =>
        form.setValue(fieldName as keyof z.infer<typeof schemaForm>, value as never),
      submit: () => undefined,
      validate: async () => ({ valid: await form.trigger() }),
      values: form.getValues(),
    });
    await api.submit();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{schemaFormMessages.title}</CardTitle>
        <CardDescription>{schemaFormMessages.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid max-w-2xl gap-4" onSubmit={form.handleSubmit(submitForm)}>
          <div className="grid gap-2">
            <Label htmlFor="name">{schemaFormMessages.name}</Label>
            <Input id="name" {...form.register("name")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">{schemaFormMessages.email}</Label>
            <Input id="email" {...form.register("email")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">{schemaFormMessages.role}</Label>
            <Input id="role" {...form.register("role")} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{schemaFormMessages.submit}</Button>
            <Button onClick={() => form.reset()} type="button" variant="outline">
              {schemaFormMessages.reset}
            </Button>
          </div>
          <pre className="rounded-lg border bg-muted p-3 text-xs">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </form>
      </CardContent>
    </Card>
  );
}

// 组件：IframePanel。用于展示内嵌页面能力的占位面板。
export function IframePanel({ messages }: { messages: AdminMessages }) {
  const iframe = messages.pages.iframe;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{iframe.title}</CardTitle>
        <CardDescription>{iframe.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex aspect-video items-center justify-center rounded-lg border bg-background text-muted-foreground">
          {iframe.placeholder}
        </div>
      </CardContent>
    </Card>
  );
}
