import { FileClock, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { getAdminMessages } from "@/i18n/admin-i18n";
import type { AdminPreferences } from "@/types/admin";

type AdminMessages = ReturnType<typeof getAdminMessages>;

const auditEvents = [
  { happenedAt: "2026-06-06T12:30:00.000Z" },
  { happenedAt: "2026-06-06T10:15:00.000Z" },
  { happenedAt: "2026-06-05T23:50:00.000Z" },
];

// 函数：formatPreferenceDateTime。按偏好时区格式化审计时间。
function formatPreferenceDateTime(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  })
    .formatToParts(new Date(value))
    .reduce<Record<string, string>>((current, part) => {
      current[part.type] = part.value;
      return current;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

// 组件：UsersPage。用于展示用户列表和状态信息。
export function UsersPage({ messages }: { messages: AdminMessages }) {
  const users = messages.pages.users;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{users.title}</CardTitle>
        <CardDescription>{users.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{users.columns.email}</TableHead>
              <TableHead>{users.columns.role}</TableHead>
              <TableHead>{users.columns.team}</TableHead>
              <TableHead>{users.columns.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.rows.map((user) => (
              <TableRow key={user.email}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.team}</TableCell>
                <TableCell>
                  <Badge variant={user.status === users.rows[0].status ? "default" : "secondary"}>
                    {user.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// 组件：RolesPage。用于展示角色卡片列表。
export function RolesPage({ messages }: { messages: AdminMessages }) {
  const roles = messages.pages.roles;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{roles.title}</CardTitle>
        <CardDescription>{roles.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {roles.roles.map((role) => (
          <div className="rounded-lg border bg-background p-4" key={role}>
            <Shield className="mb-3 size-5 text-primary" />
            <div className="font-medium">{role}</div>
            <div className="text-sm text-muted-foreground">{roles.detail}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// 组件：AuditPage。用于展示审计日志并按偏好时区格式化时间。
export function AuditPage({
  messages,
  preferences,
}: {
  messages: AdminMessages;
  preferences: AdminPreferences;
}) {
  const audit = messages.pages.audit;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{audit.title}</CardTitle>
        <CardDescription>{audit.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {auditEvents.map((event, index) => (
          <div
            className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2"
            key={event.happenedAt}
          >
            <FileClock className="size-4 text-primary" />
            <span>{audit.events[index]}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatPreferenceDateTime(event.happenedAt, preferences.appTimezone)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
