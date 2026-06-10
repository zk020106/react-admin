import { describe, expect, it } from "vitest";

import { adminMockApi, mockAdminMenu } from "@/mock/admin-mock";
import { buildWorkspaceSearchItems, findMenuTrail, flattenMenu, searchMenu } from "@/utils/menu";

const menu = [
  {
    icon: "LayoutDashboard",
    key: "/dashboard",
    path: "/dashboard",
    title: "Dashboard",
  },
  {
    children: [
      { key: "/system/users", path: "/system/users", title: "Users" },
      { badge: "4", key: "/system/roles", path: "/system/roles", title: "Roles" },
    ],
    icon: "Shield",
    key: "/system",
    path: "/system",
    title: "System",
  },
];

describe("menu helpers", () => {
  it("flattens nested menu records and resolves breadcrumb trails", () => {
    expect(flattenMenu(menu).map((item) => item.key)).toEqual([
      "/dashboard",
      "/system",
      "/system/users",
      "/system/roles",
    ]);

    expect(findMenuTrail(menu, "/system/users")?.map((item) => item.title)).toEqual([
      "System",
      "Users",
    ]);
  });

  it("searches by title, path and badge text", () => {
    expect(searchMenu(menu, "role").map((item) => item.path)).toEqual(["/system/roles"]);
    expect(searchMenu(menu, "4").map((item) => item.path)).toEqual(["/system/roles"]);
  });

  it("builds workspace search candidates from menus permissions and users", async () => {
    const [users, menus] = await Promise.all([adminMockApi.users(), adminMockApi.menus()]);

    expect(buildWorkspaceSearchItems(mockAdminMenu, users, menus)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: expect.stringContaining("system:user:read") }),
        expect.objectContaining({ title: "超级管理员" }),
      ]),
    );
  });
});
