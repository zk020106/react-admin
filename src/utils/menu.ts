import type { MenuRecord } from "@/types/admin";

export function flattenMenu(menu: MenuRecord[]): MenuRecord[] {
  return menu.flatMap((item) => [item, ...flattenMenu(item.children ?? [])]);
}

export function findMenuTrail(menu: MenuRecord[], path: string): MenuRecord[] | undefined {
  for (const item of menu) {
    if (item.path === path) {
      return [item];
    }

    const childTrail = findMenuTrail(item.children ?? [], path);
    if (childTrail) {
      return [item, ...childTrail];
    }
  }

  return undefined;
}

export function searchMenu(menu: MenuRecord[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return flattenMenu(menu).filter((item) => {
    const haystack = [item.badge, item.path, item.title].filter(Boolean).join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
