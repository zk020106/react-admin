import { useQuery } from "@tanstack/react-query";
import { Shield, SquareMenu, Building2, Users } from "lucide-react";

import { systemQueries } from "@/pages/admin-queries";
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

// 组件：UsersPage。展示 mock 用户列表。
export function UsersPage() {
  const { data = [] } = useQuery(systemQueries.users());

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户管理</CardTitle>
        <CardDescription>展示用户账号、角色、部门和状态。</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user) => (
              <TableRow key={user.email}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "启用" ? "default" : "secondary"}>
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

// 组件：RolesPage。展示 mock 角色列表。
export function RolesPage() {
  const { data = [] } = useQuery(systemQueries.roles());

  return (
    <Card>
      <CardHeader>
        <CardTitle>角色管理</CardTitle>
        <CardDescription>展示角色编码、成员数量和权限说明。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {data.map((role) => (
          <div className="rounded-lg border bg-background p-4" key={role.code}>
            <Shield className="mb-3 size-5 text-primary" />
            <div className="font-medium">{role.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{role.description}</div>
            <Badge className="mt-3" variant="outline">
              {role.memberCount} 人
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// 组件：MenusPage。展示 mock 菜单配置列表。
export function MenusPage() {
  const { data = [] } = useQuery(systemQueries.menus());

  return (
    <Card>
      <CardHeader>
        <CardTitle>菜单管理</CardTitle>
        <CardDescription>展示路由路径、组件标识和权限编码。</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>路径</TableHead>
              <TableHead>组件</TableHead>
              <TableHead>权限</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((menu) => (
              <TableRow key={menu.path}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    <SquareMenu className="size-4 text-primary" />
                    {menu.name}
                  </span>
                </TableCell>
                <TableCell>{menu.path}</TableCell>
                <TableCell>{menu.component}</TableCell>
                <TableCell>{menu.permission}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{menu.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// 组件：DepartmentsPage。展示 mock 部门列表。
export function DepartmentsPage() {
  const { data = [] } = useQuery(systemQueries.departments());

  return (
    <Card>
      <CardHeader>
        <CardTitle>部门管理</CardTitle>
        <CardDescription>展示组织部门、负责人和成员数量。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {data.map((department) => (
          <div className="rounded-lg border bg-background p-4" key={department.name}>
            <Building2 className="mb-3 size-5 text-primary" />
            <div className="font-medium">{department.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">上级：{department.parent}</div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1">
                <Users className="size-4" />
                {department.memberCount} 人
              </span>
              <Badge variant="secondary">{department.status}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
