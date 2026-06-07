import { useQuery } from "@tanstack/react-query";

import { aboutQueries } from "@/pages/admin-queries";
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

// 组件：AboutPage。展示项目基本信息和依赖版本。
export default function AboutPage() {
  const { data } = useQuery(aboutQueries.project());

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>关于项目</CardTitle>
          <CardDescription>{data?.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {(data?.meta ?? []).map((item) => (
            <div className="rounded-lg border bg-background p-3" key={item.label}>
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="mt-1 font-medium">{item.value}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>依赖版本</CardTitle>
          <CardDescription>展示当前项目 mock 中维护的核心依赖和版本。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>依赖</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>版本</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.dependencies ?? []).map((dependency) => (
                <TableRow key={dependency.name}>
                  <TableCell className="font-medium">{dependency.name}</TableCell>
                  <TableCell>
                    <Badge variant={dependency.type === "dependency" ? "default" : "secondary"}>
                      {dependency.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{dependency.version}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
