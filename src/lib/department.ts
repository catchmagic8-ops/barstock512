export type Department = "bar512" | "konferencje" | "polskie_smaki";

export interface DeptTables {
  inventory: "inventory_items" | "inventory_items_konferencje" | "inventory_items_polskie_smaki";
  events: "events" | "events_konferencje" | "events_polskie_smaki";
  recipes: "recipes" | "recipes_konferencje" | "recipes_polskie_smaki";
  contacts: "contacts" | "contacts_konferencje" | "contacts_polskie_smaki";
  subcategories: "subcategories" | "subcategories_konferencje" | "subcategories_polskie_smaki";
  alaCarte: "a_la_carte_bar512" | "a_la_carte_polskie_smaki" | null;
}

export const DEPT_TABLES: Record<Department, DeptTables> = {
  bar512: {
    inventory: "inventory_items",
    events: "events",
    recipes: "recipes",
    contacts: "contacts",
    subcategories: "subcategories",
    alaCarte: "a_la_carte_bar512",
  },
  konferencje: {
    inventory: "inventory_items_konferencje",
    events: "events_konferencje",
    recipes: "recipes_konferencje",
    contacts: "contacts_konferencje",
    subcategories: "subcategories_konferencje",
    alaCarte: null,
  },
  polskie_smaki: {
    inventory: "inventory_items_polskie_smaki",
    events: "events_polskie_smaki",
    recipes: "recipes_polskie_smaki",
    contacts: "contacts_polskie_smaki",
    subcategories: "subcategories_polskie_smaki",
    alaCarte: "a_la_carte_polskie_smaki",
  },
};

export interface DeptMeta {
  label: string;
  shortLabel: string;
  basePath: string;
  tagline: string;
}

export const DEPT_META: Record<Department, DeptMeta> = {
  bar512: {
    label: "Bar 512",
    shortLabel: "Bar",
    basePath: "", // routes stay at /home, /inventory, etc.
    tagline: "Cocktails, stock & service",
  },
  konferencje: {
    label: "Conference",
    shortLabel: "Conf.",
    basePath: "/conference",
    tagline: "Events & conference operations",
  },
  polskie_smaki: {
    label: "Polskie Smaki",
    shortLabel: "Smaki",
    basePath: "/polskie-smaki",
    tagline: "Kitchen, recipes & supplies",
  },
};

export function deptHomePath(d: Department): string {
  return d === "bar512" ? "/home" : DEPT_META[d].basePath;
}

export function deptSubPath(
  d: Department,
  sub: "inventory" | "events" | "recipes" | "telephone" | "admin" | "a-la-carte" | "reservations",
): string {
  return d === "bar512" ? `/${sub}` : `${DEPT_META[d].basePath}/${sub}`;
}
