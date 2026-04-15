import type { DailyInsightsResult } from "../../hooks/useDailyInsights";
import type { UITheme } from "../../theme/uiTheme";

type TodayTabContentProps = {
  ui: UITheme;
  dailyInsights: DailyInsightsResult;
};

export function TodayTabContent({ ui, dailyInsights }: TodayTabContentProps) {
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
          РОЗПИС НА ПОТОЧНУ ДАТУ • {dailyInsights.todayLabel}
        </p>
        <p className="mt-1 text-sm" style={{ color: ui.textMuted }}>
          Аналіз дня формується відносно вашої базової матриці (дата
          народження зверху) + поточної календарної дати.
        </p>
        <p className="text-sm" style={{ color: ui.textMuted }}>
          {dailyInsights.dayMode} {dailyInsights.restHint}
        </p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: ui.border, background: ui.surfaceAlt }}
        >
          <p className="text-sm font-semibold" style={{ color: ui.accent }}>
            Що сьогодні вдасться краще
          </p>
          {dailyInsights.topFocus.map((item) => (
            <div key={`focus-${item.energy}`} className="mt-2">
              <p className="text-sm font-semibold" style={{ color: item.color }}>
                {item.energy}. {item.name} ({item.planet})
              </p>
              <p className="text-xs" style={{ color: ui.textMuted }}>
                Сьогодні: {item.todayValue} • База: {item.birthValue}
              </p>
              <p className="text-xs" style={{ color: ui.text }}>
                {item.guidance}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: ui.border, background: ui.surfaceAlt }}
        >
          <p className="text-sm font-semibold" style={{ color: ui.accent }}>
            На що звернути увагу
          </p>
          {dailyInsights.caution.map((item) => (
            <div key={`risk-${item.energy}`} className="mt-2">
              <p className="text-sm font-semibold" style={{ color: item.color }}>
                {item.energy}. {item.name} ({item.planet})
              </p>
              <p className="text-xs" style={{ color: ui.textMuted }}>
                Сьогодні: {item.todayValue} • Норма: {item.norm}
              </p>
              <p className="text-xs" style={{ color: ui.text }}>
                {item.guidance}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: ui.border, background: ui.surfaceAlt }}
        >
          <p className="text-sm font-semibold" style={{ color: ui.accent }}>
            Рекомендований режим дня
          </p>
          <p className="mt-2 text-sm" style={{ color: ui.text }}>
            Рівень напруги дня: {dailyInsights.totalAbove.toFixed(1)}
          </p>
          <p className="mt-1 text-sm" style={{ color: ui.textMuted }}>
            Якщо показник вище 4 — плануйте паузи обов'язково. Якщо 2–4 —
            тримайте фокус на 2-3 пріоритетах. Якщо нижче 2 — день для
            спокійного прогресу й доробки.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: ui.border, background: ui.surfaceAlt }}
        >
          <p className="text-sm font-semibold" style={{ color: ui.accent }}>
            Кращий час дня
          </p>
          <p className="mt-2 text-sm" style={{ color: ui.text }}>
            {dailyInsights.bestTime}
          </p>
        </div>

        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: ui.border, background: ui.surfaceAlt }}
        >
          <p className="text-sm font-semibold" style={{ color: ui.accent }}>
            Уникати сьогодні
          </p>
          <p className="mt-2 text-sm" style={{ color: ui.text }}>
            {dailyInsights.avoidToday}
          </p>
        </div>

        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: ui.border, background: ui.surfaceAlt }}
        >
          <p className="text-sm font-semibold" style={{ color: ui.accent }}>
            Конкретні дії на 3 кроки
          </p>
          <ol className="mt-2 space-y-1 text-sm" style={{ color: ui.text }}>
            {dailyInsights.actionPlan.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
