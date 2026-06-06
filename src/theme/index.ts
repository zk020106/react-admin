import { TinyColor } from "@ctrl/tinycolor";

export type BuiltinThemeType =
  | "custom"
  | "deep-blue"
  | "deep-green"
  | "default"
  | "gray"
  | "green"
  | "neutral"
  | "orange"
  | "pink"
  | "rose"
  | "sky-blue"
  | "slate"
  | "violet"
  | "yellow"
  | "zinc";

export type VbenThemeMode = "auto" | "dark" | "light";

export interface BuiltinThemePreset {
  color: string;
  darkPrimaryColor?: string;
  primaryColor?: string;
  type: BuiltinThemeType;
}

export interface VbenThemeOptions {
  builtinType: BuiltinThemeType;
  colorDestructive?: string;
  colorPrimary?: string;
  colorSuccess?: string;
  colorWarning?: string;
  fontSize: number;
  mode: VbenThemeMode;
  radius: string;
  semiDarkHeader?: boolean;
  semiDarkSidebar?: boolean;
  semiDarkSidebarSub?: boolean;
}

export const BUILT_IN_THEME_PRESETS: BuiltinThemePreset[] = [
  { color: "hsl(212 100% 45%)", type: "default" },
  { color: "hsl(245 82% 67%)", type: "violet" },
  { color: "hsl(347 77% 60%)", type: "pink" },
  { color: "hsl(42 84% 61%)", type: "yellow" },
  { color: "hsl(231 98% 65%)", type: "sky-blue" },
  { color: "hsl(161 90% 43%)", type: "green" },
  {
    color: "hsl(240 5% 26%)",
    darkPrimaryColor: "hsl(0 0% 98%)",
    primaryColor: "hsl(240 5.9% 10%)",
    type: "zinc",
  },
  { color: "hsl(181 84% 32%)", type: "deep-green" },
  { color: "hsl(211 91% 39%)", type: "deep-blue" },
  { color: "hsl(18 89% 40%)", type: "orange" },
  { color: "hsl(0 75% 42%)", type: "rose" },
  {
    color: "hsl(0 0% 25%)",
    darkPrimaryColor: "hsl(0 0% 98%)",
    primaryColor: "hsl(240 5.9% 10%)",
    type: "neutral",
  },
  {
    color: "hsl(215 25% 27%)",
    darkPrimaryColor: "hsl(0 0% 98%)",
    primaryColor: "hsl(240 5.9% 10%)",
    type: "slate",
  },
  {
    color: "hsl(217 19% 27%)",
    darkPrimaryColor: "hsl(0 0% 98%)",
    primaryColor: "hsl(240 5.9% 10%)",
    type: "gray",
  },
  { color: "", type: "custom" },
];

export function isDarkTheme(mode: VbenThemeMode) {
  if (mode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return mode === "dark";
}

export function applyVbenTheme(options: VbenThemeOptions) {
  const root = document.documentElement;
  const dark = isDarkTheme(options.mode);

  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  root.dataset.theme = options.builtinType;
  root.style.setProperty("--radius", `${options.radius}rem`);
  root.style.setProperty("--font-size-base", `${options.fontSize}px`);
  root.style.setProperty("--menu-font-size", `calc(${options.fontSize}px * 0.875)`);

  const primary = resolvePrimaryColor(options, dark);
  const colorVariables = {
    "--destructive": toHslCssVar(options.colorDestructive ?? "hsl(348 100% 61%)"),
    "--primary": toHslCssVar(primary),
    ...resolveSurfaceVariables(dark, options),
    "--success": toHslCssVar(options.colorSuccess ?? "hsl(144 57% 58%)"),
    "--warning": toHslCssVar(options.colorWarning ?? "hsl(42 84% 61%)"),
  };

  Object.entries(colorVariables).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  updateCSSVariables(colorVariables);
}

function resolveSurfaceVariables(dark: boolean, options: VbenThemeOptions) {
  const headerDark = dark || options.semiDarkHeader;
  const sidebarDark = dark || options.semiDarkSidebar;
  const sidebarSubDark = dark || options.semiDarkSidebarSub;
  const sidebarVariables = sidebarDark ? darkSidebarVariables() : lightSidebarVariables();
  const sidebarSubVariables = sidebarSubDark
    ? darkSidebarSubVariables()
    : lightSidebarSubVariables();

  return {
    "--header": headerDark ? "222.34deg 10.43% 12.27%" : "0 0% 100%",
    "--header-foreground": headerDark ? "0 0% 95%" : "210 6% 21%",
    "--menu": sidebarVariables["--sidebar"],
    ...sidebarVariables,
    ...sidebarSubVariables,
  };
}

function darkSidebarVariables() {
  return {
    "--sidebar": "222.34deg 10.43% 12.27%",
    "--sidebar-accent": "216 5% 19%",
    "--sidebar-accent-foreground": "0 0% 98%",
    "--sidebar-active": "216 5% 19%",
    "--sidebar-active-foreground": "0 0% 95%",
    "--sidebar-active-indicator": "0 0% 95%",
    "--sidebar-border": "240 3.7% 22%",
    "--sidebar-foreground": "0 0% 78%",
    "--sidebar-hover": "216 5% 24%",
    "--sidebar-hover-foreground": "0 0% 95%",
  };
}

function lightSidebarVariables() {
  return {
    "--sidebar": "0 0% 100%",
    "--sidebar-accent": "240 5% 96%",
    "--sidebar-accent-foreground": "240 6% 10%",
    "--sidebar-active": "var(--primary) / 15%",
    "--sidebar-active-foreground": "var(--primary)",
    "--sidebar-active-indicator": "var(--primary)",
    "--sidebar-border": "240 5.9% 90%",
    "--sidebar-foreground": "210 6% 21%",
    "--sidebar-hover": "240 5% 96%",
    "--sidebar-hover-foreground": "210 6% 21%",
  };
}

function darkSidebarSubVariables() {
  return {
    "--sidebar-sub": "222.34deg 10.43% 12.27%",
    "--sidebar-deep": "220deg 13.06% 9%",
  };
}

function lightSidebarSubVariables() {
  return {
    "--sidebar-sub": "0 0% 100%",
    "--sidebar-deep": "0 0% 100%",
  };
}

function resolvePrimaryColor(options: VbenThemeOptions, dark: boolean) {
  if (options.builtinType === "custom") {
    return options.colorPrimary ?? "hsl(212 100% 45%)";
  }

  const preset = BUILT_IN_THEME_PRESETS.find((item) => item.type === options.builtinType);

  if (!preset) {
    return options.colorPrimary ?? "hsl(212 100% 45%)";
  }

  return (dark ? preset.darkPrimaryColor : preset.primaryColor) || preset.color;
}

function toHslCssVar(color: string) {
  const hslMatch = color.match(/^hsl\((.*)\)$/);

  if (hslMatch?.[1]) {
    return hslMatch[1].trim();
  }

  const { a, h, l, s } = new TinyColor(color).toHsl();
  const hsl = `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;

  return a < 1 ? `${hsl} / ${a}` : hsl;
}

function updateCSSVariables(
  variables: Record<string, string>,
  id = "__vben-styles__",
  selector = ":root",
) {
  const styleElement =
    document.querySelector<HTMLStyleElement>(`#${id}`) ?? document.createElement("style");

  styleElement.id = id;
  styleElement.textContent = `${selector} {${Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join("")}}`;

  if (!styleElement.parentElement) {
    document.head.append(styleElement);
  }
}
