import { ENERGY_PROFILES } from "../../data/energyNorms";
import type { UITheme } from "../../theme/uiTheme";
import type { PotentialItem } from "../../hooks/usePotentialItems";

type PotentialTabContentProps = {
  ui: UITheme;
  items: PotentialItem[];
};

export function PotentialTabContent({ ui, items }: PotentialTabContentProps) {
  return (
    <div
      className="w-full rounded-[28px] border p-3 backdrop-blur-md"
      style={{
        borderColor: ui.borderStrong,
        background: ui.surfaceSoft,
        boxShadow: ui.shadowStrong,
        color: ui.text,
      }}
    >
      <div className="rounded-2xl border p-3" style={{ borderColor: ui.border }}>
        <p className="text-sm font-semibold" style={{ color: ui.accent }}>
          АНАЛІЗ МАТРИЦІ (за бланком дослідження)
        </p>
        <p className="mt-1 text-sm" style={{ color: ui.textMuted }}>
          Строка 1: Потенціали особистісного прояву, енергія особистості,
          психофізіологічні характеристики (1, 2, 3).
        </p>
        <p className="text-sm" style={{ color: ui.textMuted }}>
          Строка 2: Потенціали енергії взаємодії з людьми, особливості
          поведінки у стосунках (4, 5, 6).
        </p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {items.map((item) => {
          const profile = ENERGY_PROFILES[item.energy];
          const statusLabel =
            item.status === "normal"
              ? "Норма"
              : item.status === "above"
                ? "Вище норми"
                : item.status === "below"
                  ? "Нижче норми"
                  : "Немає числа";
          const statusColor =
            item.status === "normal"
              ? "#10b981"
              : item.status === "above"
                ? "#ef4444"
                : item.status === "below"
                  ? "#f59e0b"
                  : ui.textSoft;

          return (
            <div
              key={`${item.energy}-${item.title}`}
              className="rounded-2xl border p-3"
              style={{
                borderColor: ui.border,
                background: ui.surfaceAlt,
                boxShadow: ui.shadowSoft,
              }}
            >
              <p className="text-xs font-medium" style={{ color: ui.textSoft }}>
                {item.sectionTitle}
              </p>
              <p className="text-sm font-semibold" style={{ color: ui.accent }}>
                {item.title} • {profile.name}
              </p>
              <p className="mt-1 text-sm" style={{ color: ui.textMuted }}>
                Значення: {item.value || "-"} • Норма: {item.norm} • Факт: {item.total}
              </p>
              <p className="text-sm font-medium" style={{ color: statusColor }}>
                Статус: {statusLabel}
              </p>
              <p className="mt-1 text-sm" style={{ color: ui.text }}>
                {item.summary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
