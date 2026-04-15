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
          Розпис формується по всіх комірках таблиці 4×5 (включно з колонкою
          резонансу/іміджу). Для кожної комірки показано: факт, норма, статус,
          зміст потенціалу та практична рекомендація.
        </p>
        <p className="text-sm" style={{ color: ui.textMuted }}>
          Для статусів «Немає числа» та «Нижче норми» окремо додається: чого
          бракує і як це пропрацювати.
        </p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {items.map((item) => {
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
              key={item.key}
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
                {item.title}
              </p>
              <p className="mt-1 text-sm" style={{ color: ui.textMuted }}>
                Значення: {item.value || "-"}{" "}
                {item.norm ? `• Норма: ${item.norm}` : ""} • Факт: {item.total}
              </p>
              <p className="text-sm font-medium" style={{ color: statusColor }}>
                Статус: {statusLabel}
              </p>
              <p className="mt-1 text-xs font-medium" style={{ color: ui.textSoft }}>
                {item.profileName}
              </p>
              <p className="mt-1 text-sm" style={{ color: ui.text }}>
                {item.summary}
              </p>
              <p className="mt-1 text-sm" style={{ color: ui.textMuted }}>
                {item.workOn}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
