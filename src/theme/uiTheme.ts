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
  "radial-gradient(1200px 600px at 50% -220px, rgba(45,212,191,0.16), transparent 70%), #030712";

const PRESETS: Record<ThemeMode, ThemePreset> = {
  light: {
    text: "#0f172a",
    textMuted: "#334155",
    textSoft: "#475569",
    accent: "#4338ca",
    headingFrom: "#0f172a",
    headingTo: "#475569",
    pageBackground: SHARED_PAGE_BACKGROUND,
    border: [100, 116, 139],
    surface: [255, 255, 255],
    surfaceAlt: [241, 245, 249],
    surfaceDeep: [226, 232, 240],
    overlayButton: [255, 255, 255],
    ring: [15, 23, 42],
  },
  dark: {
    text: "#f8fafc",
    textMuted: "#cbd5e1",
    textSoft: "#94a3b8",
    accent: "#a5b4fc",
    headingFrom: "#ffffff",
    headingTo: "#cbd5e1",
    pageBackground: SHARED_PAGE_BACKGROUND,
    border: [255, 255, 255],
    surface: [14, 16, 22],
    surfaceAlt: [18, 20, 26],
    surfaceDeep: [10, 12, 18],
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
    borderStrong: rgba(p.border, 0.42 + o * 0.4),
    ring: rgba(p.ring, theme === "dark" ? 0.34 : 0.26),
    surface: rgba(p.surface, o),
    surfaceAlt: rgba(p.surfaceAlt, o),
    surfaceDeep: rgba(p.surfaceDeep, o),
    surfaceSoft: rgba(p.surface, Math.max(0.08, o * 0.5)),
    overlayButton: rgba(p.overlayButton, 0.35 + (1 - o) * 0.1),
    shadowSoft:
      theme === "dark"
        ? "0 12px 26px -16px rgba(0,0,0,0.82)"
        : "0 12px 26px -16px rgba(15,23,42,0.28)",
    shadowStrong:
      theme === "dark"
        ? "0 20px 44px -14px rgba(0,0,0,0.84)"
        : "0 20px 44px -14px rgba(15,23,42,0.28)",
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
