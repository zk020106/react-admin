import { useQuery } from "@tanstack/react-query";

import { getAdminMessages } from "@/i18n/admin-i18n";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// 函数：delay。用固定延迟模拟接口返回。
// 类型参数：T 表示传入值和 Promise 解析值保持一致的类型。
function delay<T>(value: T) {
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), 80);
  });
}

// 组件：DashboardPage。用于展示仪表盘统计、概览和待办状态。
export default function DashboardPage({ locale }: { locale: string }) {
  const messages = getAdminMessages(locale);
  const dashboard = messages.pages.dashboard;
  const { data, isLoading } = useQuery({
    queryFn: () => delay(dashboard.stats),
    queryKey: ["overview-stats", locale],
  });

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-4">
        {(data ?? dashboard.stats).map((item) => (
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
            <CardTitle>{dashboard.overviewTitle}</CardTitle>
            <CardDescription>{dashboard.overviewDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {dashboard.metricItems.map((item, index) => (
                <div className="rounded-lg border bg-background p-3" key={item}>
                  <div className="text-sm font-medium">{item}</div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${72 + index * 8}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{dashboard.actionTitle}</CardTitle>
            <CardDescription>{dashboard.actionDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {dashboard.actionItems.map((item) => (
              <div
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                key={item}
              >
                <span>{item}</span>
                <Badge variant="secondary">{messages.common.ready}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
