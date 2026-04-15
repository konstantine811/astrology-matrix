import type { UITheme } from "../../theme/uiTheme";

export type PlanetLegendItem = {
  planet: string;
  symbol: string;
  color: string;
  weight: number;
  share: number;
  total: number;
  norm: number;
};

type PlanetLegendBarProps = {
  ui: UITheme;
  items: PlanetLegendItem[];
};

export function PlanetLegendBar({ ui, items }: PlanetLegendBarProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="mb-2 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl px-2 py-2 backdrop-blur-md"
      style={{
        background: ui.surfaceSoft,
        border: `1px solid ${ui.border}`,
        boxShadow: ui.shadowSoft,
      }}
    >
      {items.map((item) => (
        <div
          key={item.planet}
          className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
          style={{
            borderColor: `${item.color}99`,
            background: `${item.color}22`,
            color: ui.text,
          }}
          title={`${item.planet}: ${item.total}/${item.norm} • ${item.share.toFixed(1)}% впливу`}
        >
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[16px] font-semibold leading-none"
            style={{
              color: item.color,
              background: `${item.color}14`,
              boxShadow: `0 0 10px ${item.color}66`,
            }}
          >
            {item.symbol}
          </span>
          <span className="font-medium">{item.planet}</span>
          <span style={{ color: ui.textSoft }}>{item.share.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}
