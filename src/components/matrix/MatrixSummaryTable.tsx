import { useEffect, useMemo, useState } from "react";
import {
  ENERGY_LEVELS,
  ENERGY_NORM_COUNT,
  ENERGY_PROFILES,
  getNormStatus,
} from "../../data/energyNorms";
import {
  MATRIX_COLUMN_LABELS,
  MATRIX_ROW_LABELS,
  MATRIX_ROW_TIME_LABELS,
  parseMatrixCell,
  type MatrixModelTableRow,
} from "../../utils/modelTable";

type MatrixSummaryTableProps = {
  rows: MatrixModelTableRow[];
};

const cellBaseClass =
  "flex min-h-11 items-center justify-center border border-white/20 px-2 text-center text-sm font-semibold text-white sm:min-h-12 sm:text-base";

const cellToneClasses = {
  neutral: "bg-white/[0.04]",
  left: "bg-gradient-to-r from-fuchsia-500/35 to-fuchsia-400/20",
  middle: "bg-gradient-to-r from-cyan-500/30 to-indigo-500/20",
  right: "bg-gradient-to-r from-blue-600/35 to-purple-600/20",
  metric: "bg-white/[0.06] text-cyan-100",
} as const;

export function MatrixSummaryTable({ rows }: MatrixSummaryTableProps) {
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [activeCell, setActiveCell] = useState<{
    rowIndex: number;
    colIndex: number;
  }>({
    rowIndex: 1,
    colIndex: 0,
  });
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => setIsTouchMode(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setActiveCell((prev) => ({
      rowIndex: Math.min(prev.rowIndex, rows.length - 1),
      colIndex: Math.min(prev.colIndex, 3),
    }));
  }, [rows.length]);

  const activeParsed = useMemo(() => {
    const row = rows[activeCell.rowIndex];
    if (!row) return null;
    const value = row[activeCell.colIndex];
    if (value === undefined) return null;
    return parseMatrixCell(activeCell.rowIndex, activeCell.colIndex, value);
  }, [activeCell.colIndex, activeCell.rowIndex, rows]);
  const parsedCells = useMemo(
    () =>
      rows.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => parseMatrixCell(rowIndex, colIndex, value)),
      ),
    [rows],
  );

  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1280;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 720;
  const tooltipX = Math.min(viewportWidth - 100, Math.max(100, tooltip.x - 15));
  const tooltipBottom = Math.max(8, viewportHeight - tooltip.y - 95);

  const renderParsedBlock = (
    parsed: ReturnType<typeof parseMatrixCell>,
    className = "mt-2 rounded-lg border border-cyan-200/20 bg-white/5 p-2",
  ) => {
    const profile =
      parsed.energy !== null && parsed.energy !== undefined
        ? ENERGY_PROFILES[parsed.energy]
        : undefined;
    const count =
      parsed.energy !== null && parsed.energy !== undefined
        ? ENERGY_NORM_COUNT[parsed.energy]
        : undefined;
    const status = count !== undefined ? getNormStatus(parsed.mainCount, count) : null;
    const statusLabel =
      status === "normal"
        ? "Норма"
        : status === "below"
          ? "Нижче норми"
          : status === "above"
            ? "Вище норми"
            : "Немає числа";
    const statusText =
      status === "normal"
        ? "Якість проявляється природно і стабільно."
        : status === "below"
          ? profile?.below
          : status === "above"
            ? profile?.above
            : "Енергія зазвичай проявляється ситуативно, через необхідність і зусилля.";
    const currentLevel =
      parsed.mainCount > 0 ? ENERGY_LEVELS[Math.min(7, parsed.mainCount)] ?? null : null;

    if (parsed.colIndex === 3) {
      return (
        <div className={className}>
          <p className="text-xs text-white/80">
            `Σ` у 4-му стовпці: підсумкова резонансна енергія рядка (як це бачать інші).
          </p>
          <p className="mt-1 text-xs text-white/70">
            Число без дужок — явний прояв, у дужках — другий/прихований шар сприйняття.
          </p>
        </div>
      );
    }

    if (parsed.energy === null) {
      return (
        <div className={className}>
          <p className="text-xs text-white/75">
            Для цієї комірки енергія не виділена окремим числом.
          </p>
        </div>
      );
    }

    return (
      <div className={className}>
        <p className="text-xs font-semibold text-cyan-100">
          Енергія {parsed.energy}
          {profile ? ` • ${profile.name} (${profile.planet})` : ""}
        </p>
        {profile?.base && <p className="mt-1 text-xs text-white/80">{profile.base}</p>}
        <p className="mt-1 text-xs text-white/85">
          Норма: {count ?? "—"} • Факт: {parsed.mainCount}
          {parsed.bracketCount > 0 ? ` (+${parsed.bracketCount} у дужках)` : ""}
        </p>
        <p className="mt-1 text-xs font-medium text-cyan-50">Статус: {statusLabel}</p>
        {statusText && <p className="mt-1 text-xs text-white/80">{statusText}</p>}
        {currentLevel && <p className="mt-1 text-xs text-white/75">{currentLevel}</p>}
        {parsed.bracketCount > 0 && (
          <p className="mt-1 text-xs text-white/70">
            Значення в дужках показує прихований/нестійкий потенціал, що потребує пропрацювання.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mb-3 w-full bg-transparent p-0">
      <div className="mb-2 grid grid-cols-4 gap-1 px-1">
        {MATRIX_COLUMN_LABELS.map((label) => (
          <div
            key={label}
            className="rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-2 py-1.5 text-center text-[10px] font-semibold tracking-wide text-cyan-100 uppercase sm:text-[11px]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,4fr)] gap-1"
          >
            <div className="rounded-lg border border-white/15 bg-white/[0.05] px-2 py-2">
              <p className="text-[11px] leading-tight text-white/85">
                {MATRIX_ROW_LABELS[rowIndex] ?? `Ряд ${rowIndex + 1}`}
              </p>
              {MATRIX_ROW_TIME_LABELS[rowIndex] && (
                <p className="mt-1 text-[10px] tracking-wide text-cyan-200/90 uppercase">
                  {MATRIX_ROW_TIME_LABELS[rowIndex]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 overflow-hidden rounded-lg">
              {row.map((cell, colIndex) => {
                const toneClass = (() => {
                  if (rowIndex === 0) {
                    return colIndex === 3
                      ? cellToneClasses.metric
                      : cellToneClasses.neutral;
                  }

                  if (rowIndex === 1) {
                    if (colIndex === 0) return cellToneClasses.left;
                    if (colIndex === 1) return cellToneClasses.middle;
                    if (colIndex === 2)
                      return "bg-gradient-to-r from-emerald-400/35 to-yellow-300/25";
                    return cellToneClasses.metric;
                  }

                  if (rowIndex === 2) {
                    if (colIndex === 0)
                      return "bg-gradient-to-r from-violet-500/35 to-fuchsia-500/20";
                    if (colIndex === 1)
                      return "bg-gradient-to-r from-green-500/35 to-teal-500/20";
                    if (colIndex === 2)
                      return "bg-gradient-to-r from-yellow-200/35 to-yellow-400/25 text-slate-900";
                    return cellToneClasses.metric;
                  }

                  if (rowIndex === 3) {
                    if (colIndex === 0)
                      return "bg-gradient-to-r from-pink-500/35 to-purple-500/20";
                    if (colIndex === 1) return cellToneClasses.middle;
                    if (colIndex === 2) return cellToneClasses.right;
                    return cellToneClasses.metric;
                  }

                  if (colIndex === 0)
                    return "bg-gradient-to-r from-fuchsia-600/45 to-pink-500/35";
                  if (colIndex === 1) return "bg-white/[0.04]";
                  if (colIndex === 2)
                    return "bg-gradient-to-r from-violet-700/40 to-indigo-700/30";
                  return cellToneClasses.metric;
                })();

                const isActive =
                  activeCell.rowIndex === rowIndex &&
                  activeCell.colIndex === colIndex;
                const interactiveClass = isActive
                  ? "ring-2 ring-cyan-300/70 ring-inset"
                  : "hover:ring-2 hover:ring-cyan-300/45 hover:ring-inset";

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className={`${cellBaseClass} ${toneClass} ${interactiveClass} cursor-pointer transition`}
                    onMouseEnter={() => {
                      if (!isTouchMode) {
                        setActiveCell({ rowIndex, colIndex });
                        setTooltip((prev) => ({ ...prev, visible: true }));
                      }
                    }}
                    onMouseMove={(event) => {
                      if (!isTouchMode) {
                        setTooltip({
                          visible: true,
                          x: event.clientX,
                          y: event.clientY,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isTouchMode) {
                        setTooltip((prev) => ({ ...prev, visible: false }));
                      }
                    }}
                    onFocus={() => setActiveCell({ rowIndex, colIndex })}
                    onClick={() => {
                      if (!isTouchMode) {
                        setActiveCell({ rowIndex, colIndex });
                      }
                    }}
                    aria-label={`Ряд ${rowIndex + 1}, стовпець ${colIndex + 1}`}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!isTouchMode && tooltip.visible && activeParsed && (
        <div
          className="pointer-events-none fixed z-30 w-[min(88vw,360px)] rounded-xl border border-cyan-200/35 bg-slate-950/92 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm"
          style={{
            left: tooltipX,
            bottom: tooltipBottom,
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-[11px] tracking-wide text-cyan-100/90 uppercase">
            {activeParsed.rowLabel} • {activeParsed.columnLabel}
            {activeParsed.timeLabel ? ` • ${activeParsed.timeLabel}` : ""}
          </p>
          <p className="mt-1 text-sm font-bold text-cyan-50">
            Значення: {activeParsed.rawValue || "—"}
          </p>
          {renderParsedBlock(activeParsed)}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-full -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "8px solid rgba(15, 23, 42, 0.92)",
            }}
          />
        </div>
      )}

      {isTouchMode && (
        <div className="mt-2 rounded-xl border border-cyan-200/20 bg-cyan-950/25 p-3">
          <p className="text-[11px] tracking-wide text-cyan-100/85 uppercase">
            Розбір усіх комірок
          </p>
          <div className="mt-2 space-y-2">
            {parsedCells.map((parsed, index) => (
              <div key={`${parsed.rowIndex}-${parsed.colIndex}-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-2">
                <p className="text-sm font-semibold text-white">
                  {parsed.rowLabel} • {parsed.columnLabel}
                  {parsed.timeLabel ? ` • ${parsed.timeLabel}` : ""}
                </p>
                <p className="mt-1 text-base font-bold text-cyan-50">
                  Значення: {parsed.rawValue || "—"}
                </p>
                {renderParsedBlock(parsed, "mt-2 rounded-lg border border-cyan-200/20 bg-white/5 p-2")}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
