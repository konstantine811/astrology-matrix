import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  "relative flex min-h-11 items-center justify-center rounded-[18px] border border-white/[0.04] bg-[#13151C] px-2 text-center text-sm font-semibold text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_22px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-all duration-300 sm:min-h-12 sm:text-base";

const cellToneClasses = {
  neutral: "bg-[#13151C] text-slate-300",
  left: "bg-[#151821] text-slate-200",
  middle: "bg-[#161A23] text-slate-200",
  right: "bg-[#181B25] text-slate-100",
  metric: "bg-[#1C202B] text-teal-200",
} as const;

export const MatrixSummaryTable = memo(function MatrixSummaryTable({
  rows,
}: MatrixSummaryTableProps) {
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
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });

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
        row.map((value, colIndex) =>
          parseMatrixCell(rowIndex, colIndex, value),
        ),
      ),
    [rows],
  );

  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1280;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 720;

  useLayoutEffect(() => {
    if (!tooltip.visible || isTouchMode) return;

    const el = tooltipRef.current;
    const popupWidth = el?.offsetWidth ?? 340;
    const popupHeight = el?.offsetHeight ?? 220;
    const margin = 12;
    const gap = 12;

    const left = Math.min(
      viewportWidth - popupWidth - margin,
      Math.max(margin, tooltip.x - popupWidth / 2),
    );

    const top = Math.max(margin, tooltip.y - popupHeight - gap);

    setTooltipPosition({ left, top });
  }, [
    isTouchMode,
    tooltip.visible,
    tooltip.x,
    tooltip.y,
    viewportWidth,
    viewportHeight,
  ]);

  const renderParsedBlock = (
    parsed: ReturnType<typeof parseMatrixCell>,
    className = "mt-2 rounded-[16px] border border-white/[0.06] bg-[#13151C]/95 p-2.5",
  ) => {
    const profile =
      parsed.energy !== null && parsed.energy !== undefined
        ? ENERGY_PROFILES[parsed.energy]
        : undefined;
    const count =
      parsed.energy !== null && parsed.energy !== undefined
        ? ENERGY_NORM_COUNT[parsed.energy]
        : undefined;
    const status =
      count !== undefined ? getNormStatus(parsed.mainCount, count) : null;
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
      parsed.mainCount > 0
        ? (ENERGY_LEVELS[Math.min(7, parsed.mainCount)] ?? null)
        : null;

    if (parsed.colIndex === 3) {
      return (
        <div className={className}>
          <p className="text-xs text-white/80">
            `Σ` у 4-му стовпці: підсумкова резонансна енергія рядка (як це
            бачать інші).
          </p>
          <p className="mt-1 text-xs text-white/70">
            Число без дужок — явний прояв, у дужках — другий/прихований шар
            сприйняття.
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
        {profile?.base && (
          <p className="mt-1 text-xs text-white/80">{profile.base}</p>
        )}
        <p className="mt-1 text-xs text-white/85">
          Норма: {count ?? "—"} • Факт: {parsed.mainCount}
          {parsed.bracketCount > 0 ? ` (+${parsed.bracketCount} у дужках)` : ""}
        </p>
        <p className="mt-1 text-xs font-medium text-cyan-50">
          Статус: {statusLabel}
        </p>
        {statusText && (
          <p className="mt-1 text-xs text-white/80">{statusText}</p>
        )}
        {currentLevel && (
          <p className="mt-1 text-xs text-white/75">{currentLevel}</p>
        )}
        {parsed.bracketCount > 0 && (
          <p className="mt-1 text-xs text-white/70">
            Значення в дужках показує прихований/нестійкий потенціал, що
            потребує пропрацювання.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="relative mb-3 w-full md:rounded-[32px] rounded-xl  border border-white/[0.03] bg-[#0A0C10] p-3 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8),inset_0_0_80px_rgba(45,212,191,0.02)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 md:rounded-[32px] shadow-[0_0_60px_rgba(45,212,191,0.04)]" />
      <div className="relative mb-2 grid grid-cols-[minmax(0,1.2fr)_minmax(0,4fr)] gap-1 px-1">
        <div />
        <div className="grid grid-cols-4 gap-1.5">
          {MATRIX_COLUMN_LABELS.map((label) => (
            <div
              key={label}
              className="md:rounded-full rounded-sm border border-white/[0.03] bg-[#12141A] md:px-2 py-2 text-center md:text-[10px] text-[6px] font-semibold tracking-widest text-slate-400 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:text-[11px] text-pretty"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative space-y-1.5">
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,4fr)] gap-1"
          >
            <div className="rounded-[18px] border border-white/[0.03] bg-[#0E1016] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <p className="md:text-[11px] text-[9px] leading-tight text-slate-300/90">
                {MATRIX_ROW_LABELS[rowIndex] ?? `Ряд ${rowIndex + 1}`}
              </p>
              {MATRIX_ROW_TIME_LABELS[rowIndex] && (
                <p className="mt-1 text-[10px] tracking-wide text-teal-300/75 uppercase">
                  {MATRIX_ROW_TIME_LABELS[rowIndex]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
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
                    if (colIndex === 2) return cellToneClasses.right;
                    return cellToneClasses.metric;
                  }

                  if (rowIndex === 2) {
                    if (colIndex === 0) return cellToneClasses.left;
                    if (colIndex === 1) return cellToneClasses.middle;
                    if (colIndex === 2) return cellToneClasses.right;
                    return cellToneClasses.metric;
                  }

                  if (rowIndex === 3) {
                    if (colIndex === 0) return cellToneClasses.left;
                    if (colIndex === 1) return cellToneClasses.middle;
                    if (colIndex === 2) return cellToneClasses.right;
                    return cellToneClasses.metric;
                  }

                  if (colIndex === 0) return cellToneClasses.left;
                  if (colIndex === 1) return cellToneClasses.middle;
                  if (colIndex === 2) return cellToneClasses.right;
                  return cellToneClasses.metric;
                })();

                const isActive =
                  activeCell.rowIndex === rowIndex &&
                  activeCell.colIndex === colIndex;
                const interactiveClass = isActive
                  ? "ring-1 ring-teal-400/40 bg-[#1C202B] text-white shadow-[0_0_20px_rgba(45,212,191,0.12)]"
                  : "hover:bg-[#181B24] hover:text-white hover:ring-1 hover:ring-white/5";

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

      {!isTouchMode &&
        tooltip.visible &&
        activeParsed &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className="pointer-events-none fixed z-50 w-[min(88vw,360px)] overflow-hidden rounded-[24px] border border-teal-500/30 bg-black p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),0_0_30px_rgba(45,212,191,0.15)] h-auto"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
            }}
          >
            <p className="text-[11px] tracking-wide text-teal-200/85 uppercase">
              {activeParsed.rowLabel} • {activeParsed.columnLabel}
              {activeParsed.timeLabel ? ` • ${activeParsed.timeLabel}` : ""}
            </p>
            <p className="mt-1 text-sm font-bold text-white">
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
                borderTop: "8px solid rgba(14, 16, 23, 0.85)",
              }}
            />
          </div>,
          document.body,
        )}

      {isTouchMode && (
        <div className="mt-3 rounded-[26px] border border-teal-500/20 bg-[#0E1017]/82 p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.75),0_0_24px_rgba(45,212,191,0.08)] backdrop-blur-xl">
          <p className="text-[11px] tracking-widest text-teal-200/80 uppercase">
            Розбір усіх комірок
          </p>
          <div className="mt-3 space-y-2.5">
            {parsedCells.map((parsed, index) => (
              <div
                key={`${parsed.rowIndex}-${parsed.colIndex}-${index}`}
                className="rounded-[20px] border border-white/[0.05] bg-[#13151C]/95 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_22px_-14px_rgba(0,0,0,0.7)]"
              >
                <p className="text-[13px] font-semibold leading-snug text-slate-100/95">
                  {parsed.rowLabel} • {parsed.columnLabel}
                  {parsed.timeLabel ? ` • ${parsed.timeLabel}` : ""}
                </p>
                <p className="mt-1.5 text-base font-bold text-white">
                  Значення: {parsed.rawValue || "—"}
                </p>
                {renderParsedBlock(
                  parsed,
                  "mt-2.5 rounded-[16px] border border-teal-500/20 bg-[#0F121A]/95 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
