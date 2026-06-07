import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { getAdminMessages } from "@/i18n/admin-i18n";

type AdminMessages = ReturnType<typeof getAdminMessages>;

const workplaceCounts = [18, 14, 9];

// 组件：WorkplacePage。用于展示工作台任务和统计卡片。
export default function WorkplacePage({ messages }: { messages: AdminMessages }) {
  const workplace = messages.pages.workplace;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{workplace.title}</CardTitle>
        <CardDescription>{workplace.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {workplace.items.map((item, index) => (
          <div className="rounded-lg border bg-background p-4" key={item}>
            <div className="text-sm font-medium">{item}</div>
            <div className="mt-2 text-2xl font-semibold">{workplaceCounts[index]}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
