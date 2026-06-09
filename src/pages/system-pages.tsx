import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Building2,
  FolderTree,
  Route,
  Shield,
  SlidersHorizontal,
  SquareMenu,
  Users,
} from "lucide-react";

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
import type { MenuManagementRecord } from "@/mock/admin-mock";

const emptyMenus: MenuManagementRecord[] = [];

/**
 * 展示用户账号、角色、部门和状态列表。
 *
 * @returns 用户管理页面。
 */
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

/**
 * 展示角色编码、成员数量和权限说明。
 *
 * @returns 角色管理页面。
 */
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

/**
 * 展示菜单配置、路由组件和权限编码。
 *
 * @returns 菜单管理页面。
 */
export function MenusPage() {
  const { data = emptyMenus } = useQuery(systemQueries.menus());
  const menuSummary = useMemo(() => {
    const visibleCount = data.filter((menu) => menu.status === "显示").length;
    const directoryCount = data.filter((menu) => menu.type === "目录").length;

    return [
      { icon: Route, label: "路由记录", value: data.length },
      { icon: FolderTree, label: "目录节点", value: directoryCount },
      { icon: SlidersHorizontal, label: "可见菜单", value: visibleCount },
    ];
  }, [data]);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        {menuSummary.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle>{item.value}</CardTitle>
                </div>
                <Icon className="size-5 text-primary" />
              </CardHeader>
            </Card>
          );
        })}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>菜单管理</CardTitle>
          <CardDescription>维护后台路由路径、页面组件、权限编码和层级关系。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>父级</TableHead>
                <TableHead>路径</TableHead>
                <TableHead>组件</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>排序</TableHead>
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
                  <TableCell>
                    <Badge variant={menu.type === "目录" ? "outline" : "secondary"}>
                      {menu.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{menu.parentName}</TableCell>
                  <TableCell>{menu.path}</TableCell>
                  <TableCell>{menu.component}</TableCell>
                  <TableCell>{menu.permission}</TableCell>
                  <TableCell>{menu.sort}</TableCell>
                  <TableCell>
                    <Badge variant={menu.status === "显示" ? "default" : "secondary"}>
                      {menu.status}
                    </Badge>
                    {menu.childrenCount > 0 ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {menu.childrenCount} 个子项
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * 展示组织部门、负责人和成员数量。
 *
 * @returns 部门管理页面。
 */
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
