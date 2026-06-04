import type { MenuRecord, TabRecord } from "./types"

export const adminMenu: MenuRecord[] = [
  {
    icon: "LayoutDashboard",
    key: "/dashboard",
    path: "/dashboard",
    title: "Dashboard",
  },
  {
    icon: "BriefcaseBusiness",
    key: "/workplace",
    path: "/workplace",
    title: "Workplace",
  },
  {
    children: [
      { badge: "12", key: "/system/users", path: "/system/users", title: "Users" },
      { key: "/system/roles", path: "/system/roles", title: "Roles" },
      { key: "/system/audit", path: "/system/audit", title: "Audit log" },
    ],
    icon: "Shield",
    key: "/system",
    path: "/system",
    title: "System",
  },
  {
    children: [
      { key: "/effects/modal", path: "/effects/modal", title: "Modal and drawer" },
      { key: "/effects/form", path: "/effects/form", title: "Schema form" },
      { key: "/effects/iframe", path: "/effects/iframe", title: "Iframe view" },
    ],
    icon: "PanelsTopLeft",
    key: "/effects",
    path: "/effects",
    title: "Effects",
  },
]

export const affixTabs: TabRecord[] = [
  {
    affix: true,
    icon: "LayoutDashboard",
    key: "/dashboard",
    path: "/dashboard",
    title: "Dashboard",
  },
]

export const overviewStats = [
  { label: "Active sessions", trend: "+18.2%", value: "24,892" },
  { label: "Query cache hit", trend: "+6.4%", value: "96.8%" },
  { label: "Open alerts", trend: "-3", value: "17" },
  { label: "Avg response", trend: "-24ms", value: "184ms" },
]

export const userRows = [
  { email: "root@example.com", role: "Owner", status: "Active", team: "Platform" },
  { email: "ops@example.com", role: "Operator", status: "Active", team: "Operations" },
  { email: "audit@example.com", role: "Auditor", status: "Review", team: "Risk" },
]

export function getMenuTitle(path: string) {
  const all = adminMenu.flatMap(function flatten(item): MenuRecord[] {
    return [item, ...(item.children ?? []).flatMap(flatten)]
  })

  return all.find((item) => item.path === path)?.title ?? "Dashboard"
}
