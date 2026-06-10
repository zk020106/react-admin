import { useQuery } from "@tanstack/react-query";
import { useStore } from "zustand";

import { workplaceQueries } from "@/pages/admin-queries";
import { Page, PageSection } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminMessages } from "@/i18n/admin-i18n";
import { preferenceStore } from "@/store/preferences";

/**
 * 展示工作台任务、指标和活动流。
 *
 * @returns 工作台页面。
 */
export default function WorkplacePage() {
  const locale = useStore(preferenceStore, (state) => state.preferences.appLocale);
  const messages = getAdminMessages(locale);
  const workplace = messages.pages.workplace;
  const { data } = useQuery(workplaceQueries.summary());

  return (
    <Page title={workplace.title} description={workplace.description}>
      <PageSection contentClassName="grid gap-4 md:grid-cols-3">
        {(data?.metrics ?? workplace.items.map((label) => ({ label, trend: "-", value: "0" }))).map(
          (item) => (
            <Card key={item.label}>
              <CardHeader>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle>{item.value}</CardTitle>
                <Badge className="mt-1 w-fit" variant="outline">
                  {item.trend}
                </Badge>
              </CardHeader>
            </Card>
          ),
        )}
      </PageSection>
      <PageSection contentClassName="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{workplace.title}</CardTitle>
            <CardDescription>{workplace.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(data?.tasks ?? []).map((task) => (
              <div
                className="flex flex-col gap-2 rounded-lg border bg-background p-3 md:flex-row md:items-center md:justify-between"
                key={task.title}
              >
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {task.assignee} / {task.deadline}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={task.priority === "高" ? "destructive" : "outline"}>
                    {task.priority}
                  </Badge>
                  <Badge variant="secondary">{task.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>活动流</CardTitle>
            <CardDescription>展示最近的后台操作动态。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(data?.activities ?? []).map((activity) => (
              <div
                className="rounded-lg border bg-background p-3"
                key={`${activity.actor}-${activity.time}`}
              >
                <div className="font-medium">{activity.action}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {activity.actor} / {activity.time}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </PageSection>
    </Page>
  );
}
