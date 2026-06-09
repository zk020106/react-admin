import { useStore } from "zustand";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminMessages } from "@/i18n/admin-i18n";
import { preferenceStore } from "@/store/preferences";

const workplaceCounts = [18, 14, 9];

/**
 * 展示工作台任务和统计卡片。
 *
 * @returns 工作台页面。
 */
export default function WorkplacePage() {
  const locale = useStore(preferenceStore, (state) => state.preferences.appLocale);
  const messages = getAdminMessages(locale);
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
