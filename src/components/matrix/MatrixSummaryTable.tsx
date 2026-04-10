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
  "relative flex min-h-11 items-center justify-center rounded-[18px] border px-2 text-center text-sm font-semibold text-slate-100 backdrop-blur-sm transition-all duration-300 sm:min-h-12 sm:text-base";

type CellTheme = {
  bg: string;
  border: string;
  glow: string;
  textClass: string;
};

const ENERGY_CELL_THEME: Record<number, CellTheme> = {
  0: {
    bg: "rgba(42,50,72,0.22)",
    border: "rgba(167,139,250,0.08)",
    glow: "rgba(167,139,250,0.22)",
    textClass: "text-slate-100",
  },
  1: {
    bg: "rgba(24,125,40,0.10)",
    border: "rgba(52,211,153,0.12)",
    glow: "rgba(34,197,94,0.24)",
    textClass: "text-emerald-50",
  },
  2: {
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(244,114,182,0.14)",
    glow: "rgba(236,72,153,0.25)",
    textClass: "text-fuchsia-50",
  },
  3: {
    bg: "rgba(202,194,60,0.12)",
    border: "rgba(250,204,21,0.06)",
    glow: "rgba(250,204,21,0.22)",
    textClass: "text-yellow-50",
  },
  4: {
    bg: "rgba(206,79,203,0.12)",
    border: "rgba(244,114,182,0.04)",
    glow: "rgba(236,72,153,0.22)",
    textClass: "text-pink-50",
  },
  5: {
    bg: "rgba(21,128,61,0.12)",
    border: "rgba(74,222,128,0.04)",
    glow: "rgba(34,197,94,0.24)",
    textClass: "text-emerald-50",
  },
  6: {
    bg: "rgba(181,171,42,0.15)",
    border: "rgba(253,224,71,0.04)",
    glow: "rgba(250,204,21,0.22)",
    textClass: "text-yellow-50",
  },
  7: {
    bg: "rgba(194,70,199,0.12)",
    border: "rgba(232,121,249,0.04)",
    glow: "rgba(217,70,239,0.24)",
    textClass: "text-fuchsia-50",
  },
  8: {
    bg: "rgba(24,125,221,0.14)",
    border: "rgba(56,189,248,0.05)",
    glow: "rgba(14,165,233,0.25)",
    textClass: "text-sky-50",
  },
  9: {
    bg: "rgba(28,42,176,0.18)",
    border: "rgba(99,102,241,0.05)",
    glow: "rgba(79,70,229,0.24)",
    textClass: "text-indigo-50",
  },
  10: {
    bg: "rgba(235,28,144,0.12)",
    border: "rgba(244,114,182,0.06)",
    glow: "rgba(236,72,153,0.24)",
    textClass: "text-pink-50",
  },
  11: {
    bg: "rgba(199,21,133,0.13)",
    border: "rgba(244,114,182,0.05)",
    glow: "rgba(217,70,239,0.24)",
    textClass: "text-fuchsia-50",
  },
  12: {
    bg: "rgba(120,25,150,0.15)",
    border: "rgba(192,132,252,0.06)",
    glow: "rgba(168,85,247,0.25)",
    textClass: "text-purple-50",
  },
};

const DEFAULT_THEME: CellTheme = {
  bg: "rgba(19,21,28,0.95)",
  border: "rgba(255,255,255,0.08)",
  glow: "rgba(45,212,191,0.10)",
  textClass: "text-slate-200",
};

function getEnergyByCellPosition(
  rowIndex: number,
  colIndex: number,
): number | null {
  if (colIndex === 3) return null;
  if (rowIndex < 1 || rowIndex > 4) return null;
  return (rowIndex - 1) * 3 + colIndex + 1;
}

function getCellTheme(
  rowIndex: number,
  colIndex: number,
  energy: number | null,
): CellTheme {
  if (rowIndex === 0 && colIndex === 3) {
    return {
      bg: "rgba(28,32,43,0.95)",
      border: "rgba(94,234,212,0.20)",
      glow: "rgba(45,212,191,0.14)",
      textClass: "text-teal-100",
    };
  }

  if (energy !== null && ENERGY_CELL_THEME[energy]) {
    return ENERGY_CELL_THEME[energy];
  }

  if (colIndex === 3) {
    return {
      bg: "rgba(28,32,43,0.90)",
      border: "rgba(94,234,212,0.22)",
      glow: "rgba(45,212,191,0.14)",
      textClass: "text-teal-100",
    };
  }

  return DEFAULT_THEME;
}

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
  const parsedCellsForList = useMemo(
    () =>
      parsedCells.filter(
        (parsed) => !(parsed.rowIndex === 0 && parsed.colIndex === 3),
      ),
    [parsedCells],
  );
  const activeTheme = useMemo(() => {
    if (!activeParsed) return DEFAULT_THEME;
    const fallbackEnergy = getEnergyByCellPosition(
      activeParsed.rowIndex,
      activeParsed.colIndex,
    );
    const effectiveEnergy =
      activeParsed.energy !== null && activeParsed.energy !== undefined
        ? activeParsed.energy
        : fallbackEnergy;
    return getCellTheme(
      activeParsed.rowIndex,
      activeParsed.colIndex,
      effectiveEnergy,
    );
  }, [activeParsed]);

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
    const fallbackEnergy = getEnergyByCellPosition(
      parsed.rowIndex,
      parsed.colIndex,
    );
    const effectiveEnergy =
      parsed.energy !== null && parsed.energy !== undefined
        ? parsed.energy
        : fallbackEnergy;
    const cardTheme = getCellTheme(
      parsed.rowIndex,
      parsed.colIndex,
      effectiveEnergy,
    );
    const profile =
      effectiveEnergy !== null && effectiveEnergy !== undefined
        ? ENERGY_PROFILES[effectiveEnergy]
        : undefined;
    const count =
      effectiveEnergy !== null && effectiveEnergy !== undefined
        ? ENERGY_NORM_COUNT[effectiveEnergy]
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
    const isImageColumn = parsed.colIndex === 3;
    const workOnText = isImageColumn
      ? (profile?.imageClarity ??
        (status === "below" || status === "absent"
          ? "Частіше явно проговорюйте свої наміри і пояснюйте мотивацію вчинків."
          : status === "above"
            ? "Дозуйте прояв, говоріть простіше і перевіряйте, як вас почули."
            : "Зберігайте цей стиль прояву й підкріплюйте його конкретними діями."))
      : status === "below" || status === "absent"
        ? (profile?.practiceBelow ??
          "Посилювати цю енергію через регулярні практичні дії у темі комірки (рядок + стовпець).")
        : status === "above"
          ? (profile?.balanceAbove ??
            "Баланс прояву, м'якість у взаємодії, екологічне використання сили цієї енергії.")
          : "Підтримувати поточний баланс і стабільне застосування якості.";

    if (parsed.colIndex === 3 && parsed.rowIndex === 0) {
      return null;
    }

    if (effectiveEnergy === null) {
      return (
        <div className={className}>
          <p className="text-xs text-white/75">
            Для цієї комірки енергія не виділена окремим числом.
          </p>
        </div>
      );
    }

    return (
      <div
        className={className}
        style={{
          borderColor: cardTheme.border,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px ${cardTheme.border}, 0 12px 28px -18px rgba(0,0,0,0.85), 0 0 26px -18px ${cardTheme.glow}`,
          background: `linear-gradient(180deg, ${cardTheme.bg}, rgba(10,12,18,0.92))`,
        }}
      >
        {parsed.colIndex === 3 && (
          <p className="text-xs text-cyan-100/90">
            4-й стовпчик: це імідж і резонансне враження про тебе, як тебе
            бачать інші люди.
          </p>
        )}
        <p className="text-xs font-semibold text-cyan-100">
          Енергія {effectiveEnergy}
          {profile ? ` • ${profile.name} (${profile.planet})` : ""}
        </p>
        {profile?.base && (
          <p className="mt-1 text-xs text-white/80">{profile.base}</p>
        )}
        {parsed.colIndex === 3 && profile?.base && (
          <p className="mt-1 text-xs text-white/85">
            Люди частіше зчитують вас як: {profile.base.toLowerCase()}
          </p>
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
        <p className="mt-1 text-xs font-medium text-cyan-100/90">
          {isImageColumn ? workOnText : `Що пропрацьовувати: ${workOnText}`}
        </p>
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
                const isHiddenDescriptionCell =
                  rowIndex === 0 && colIndex === 3;
                const parsedCell = parseMatrixCell(rowIndex, colIndex, cell);
                const fallbackEnergy = getEnergyByCellPosition(
                  rowIndex,
                  colIndex,
                );
                const effectiveEnergy =
                  parsedCell.energy !== null && parsedCell.energy !== undefined
                    ? parsedCell.energy
                    : fallbackEnergy;
                const theme = getCellTheme(rowIndex, colIndex, effectiveEnergy);

                const isActive =
                  activeCell.rowIndex === rowIndex &&
                  activeCell.colIndex === colIndex;
                const interactiveClass = isActive
                  ? "ring-1 ring-white/35"
                  : "hover:brightness-110";

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className={`${cellBaseClass} ${theme.textClass} ${interactiveClass} cursor-pointer transition`}
                    style={{
                      borderColor: theme.border,
                      background: `linear-gradient(180deg, ${theme.bg}, rgba(10,12,18,0.90))`,
                      boxShadow: isActive
                        ? `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${theme.border}, 0 0 0 2px rgba(255,255,255,0.18), 0 0 26px -10px ${theme.glow}`
                        : `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px ${theme.border}, 0 10px 22px -12px rgba(0,0,0,0.8), 0 0 24px -16px ${theme.glow}`,
                    }}
                    onMouseEnter={() => {
                      if (!isTouchMode) {
                        if (isHiddenDescriptionCell) {
                          setTooltip((prev) => ({ ...prev, visible: false }));
                          return;
                        }
                        setActiveCell({ rowIndex, colIndex });
                        setTooltip((prev) => ({ ...prev, visible: true }));
                      }
                    }}
                    onMouseMove={(event) => {
                      if (!isTouchMode && !isHiddenDescriptionCell) {
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
                      if (!isTouchMode && !isHiddenDescriptionCell) {
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
            className="pointer-events-none fixed z-50 h-auto w-[min(88vw,360px)] overflow-hidden rounded-[24px] border p-3"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              borderColor: activeTheme.border,
              background: `linear-gradient(180deg, rgba(10,13,20,0.98), rgba(8,10,16,0.98))`,
              boxShadow: `0 20px 40px -10px rgba(0,0,0,0.8), 0 0 30px -18px ${activeTheme.glow}, 0 0 0 1px ${activeTheme.border}`,
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

      <div className="mt-3 rounded-[26px] border border-teal-500/20 bg-[#0E1017]/82 p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.75),0_0_24px_rgba(45,212,191,0.08)] backdrop-blur-xl">
        <p className="text-[11px] tracking-widest text-teal-200/80 uppercase">
          Розбір усіх комірок
        </p>
        <div className="mt-3 space-y-2.5">
          {parsedCellsForList.map((parsed, index) =>
            (() => {
              const fallbackEnergy = getEnergyByCellPosition(
                parsed.rowIndex,
                parsed.colIndex,
              );
              const effectiveEnergy =
                parsed.energy !== null && parsed.energy !== undefined
                  ? parsed.energy
                  : fallbackEnergy;
              const theme = getCellTheme(
                parsed.rowIndex,
                parsed.colIndex,
                effectiveEnergy,
              );

              return (
                <div
                  key={`${parsed.rowIndex}-${parsed.colIndex}-${index}`}
                  className="rounded-[20px] border p-2.5"
                  style={{
                    borderColor: theme.border,
                    background: `linear-gradient(180deg, rgba(16,19,28,0.95), rgba(10,12,18,0.98))`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px ${theme.border}, 0 12px 24px -16px rgba(0,0,0,0.75), 0 0 24px -18px ${theme.glow}`,
                  }}
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
                    "mt-2.5 rounded-[16px] border p-2.5",
                  )}
                </div>
              );
            })(),
          )}
        </div>
      </div>
    </div>
  );
});
