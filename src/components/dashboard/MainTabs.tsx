import type { UITheme } from "../../theme/uiTheme";

export type MainTabKey = "matrix" | "potential" | "today";

type MainTabsProps = {
  ui: UITheme;
  activeTab: MainTabKey;
  onChange: (tab: MainTabKey) => void;
};

export function MainTabs({ ui, activeTab, onChange }: MainTabsProps) {
  const tabs: Array<{ key: MainTabKey; label: string }> = [
    { key: "matrix", label: "Таблиця матриці" },
    { key: "potential", label: "Розписаний потенціал" },
    { key: "today", label: "Розпис на сьогодні" },
  ];

  return (
    <div className="mb-2 flex w-full max-w-3xl items-center gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className="rounded-full border px-3 py-1 text-sm font-semibold transition"
          style={{
            color: ui.text,
            borderColor: ui.borderStrong,
            background: activeTab === tab.key ? ui.surfaceAlt : ui.surfaceSoft,
            boxShadow: ui.shadowSoft,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
