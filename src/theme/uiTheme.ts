export type ThemeMode = "light" | "dark";

export type UITheme = ReturnType<typeof getUITheme>;

type ThemePreset = {
  text: string;
  textMuted: string;
  textSoft: string;
  accent: string;
  headingFrom: string;
  headingTo: string;
  pageBackground: string;
  border: [number, number, number];
  surface: [number, number, number];
  surfaceAlt: [number, number, number];
  surfaceDeep: [number, number, number];
  overlayButton: [number, number, number];
  ring: [number, number, number];
};

const SHARED_PAGE_BACKGROUND =
  "transparent";

const PRESETS: Record<ThemeMode, ThemePreset> = {
  light: {
    text: "#18181b",
    textMuted: "#3f3f46",
    textSoft: "#52525b",
    accent: "#27272a",
    headingFrom: "#18181b",
    headingTo: "#52525b",
    pageBackground: SHARED_PAGE_BACKGROUND,
    border: [39, 39, 42],
    surface: [255, 255, 255],
    surfaceAlt: [250, 250, 250],
    surfaceDeep: [244, 244, 245],
    overlayButton: [255, 255, 255],
    ring: [24, 24, 27],
  },
  dark: {
    text: "#fafafa",
    textMuted: "#d4d4d8",
    textSoft: "#a1a1aa",
    accent: "#e4e4e7",
    headingFrom: "#ffffff",
    headingTo: "#d4d4d8",
    pageBackground: SHARED_PAGE_BACKGROUND,
    border: [255, 255, 255],
    surface: [18, 18, 18],
    surfaceAlt: [24, 24, 27],
    surfaceDeep: [12, 12, 14],
    overlayButton: [0, 0, 0],
    ring: [255, 255, 255],
  },
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function rgba(rgb: [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clamp01(alpha)})`;
}

export function getUITheme(theme: ThemeMode, opacity = 0.5) {
  const p = PRESETS[theme];
  const o = clamp01(opacity);

  return {
    mode: theme,
    opacity: o,
    text: p.text,
    textMuted: p.textMuted,
    textSoft: p.textSoft,
    accent: p.accent,
    headingFrom: p.headingFrom,
    headingTo: p.headingTo,
    pageBackground: p.pageBackground,
    border: rgba(p.border, 0.24 + o * 0.36),
    borderStrong: rgba(p.border, 0.32 + o * 0.44),
    ring: rgba(p.ring, theme === "dark" ? 0.34 : 0.26),
    surface: rgba(p.surface, o),
    surfaceAlt: rgba(p.surfaceAlt, o),
    surfaceDeep: rgba(p.surfaceDeep, o),
    surfaceSoft: rgba(p.surface, Math.max(0.1, o * 0.52)),
    overlayButton: rgba(p.overlayButton, 0.35 + (1 - o) * 0.1),
    shadowSoft:
      theme === "dark"
        ? "0 10px 30px -16px rgba(0,0,0,0.86)"
        : "0 10px 30px -16px rgba(24,24,27,0.2)",
    shadowStrong:
      theme === "dark"
        ? "0 18px 44px -14px rgba(0,0,0,0.86)"
        : "0 18px 44px -14px rgba(24,24,27,0.22)",
  };
}

export function applyUIThemeCssVars(ui: UITheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.style.setProperty("--ui-text", ui.text);
  root.style.setProperty("--ui-text-muted", ui.textMuted);
  root.style.setProperty("--ui-text-soft", ui.textSoft);
  root.style.setProperty("--ui-accent", ui.accent);
  root.style.setProperty("--ui-border", ui.border);
  root.style.setProperty("--ui-border-strong", ui.borderStrong);
  root.style.setProperty("--ui-surface", ui.surface);
  root.style.setProperty("--ui-surface-alt", ui.surfaceAlt);
  root.style.setProperty("--ui-surface-deep", ui.surfaceDeep);
  root.style.setProperty("--ui-surface-soft", ui.surfaceSoft);
  root.style.setProperty("--ui-page-background", ui.pageBackground);
  root.style.setProperty("--ui-overlay-button", ui.overlayButton);
  root.style.setProperty("--ui-ring", ui.ring);
  root.style.setProperty("--ui-shadow-soft", ui.shadowSoft);
  root.style.setProperty("--ui-shadow-strong", ui.shadowStrong);
  root.style.setProperty("--ui-opacity", String(ui.opacity));
}
