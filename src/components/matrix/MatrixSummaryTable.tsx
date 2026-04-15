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
  theme?: "light" | "dark";
};

const cellBaseClass =
  "relative flex min-h-11 items-center justify-center rounded-[18px] border px-2 text-center text-sm font-semibold backdrop-blur-xs transition-all duration-300 sm:min-h-12 sm:text-base";

type CellTheme = {
  from: string;
  to: string;
  border: string;
  inset: string;
  glow: string;
  textClass: string;
};

const STATIC_CELL_THEME: Record<string, CellTheme> = {
  "0-0": {
    from: "rgba(255,255,255,0.08)",
    to: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.06)",
    inset: "rgba(255,255,255,0.02)",
    glow: "rgba(255,255,255,0.10)",
    textClass: "text-slate-200",
  },
  "0-1": {
    from: "rgba(255,255,255,0.08)",
    to: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.06)",
    inset: "rgba(255,255,255,0.02)",
    glow: "rgba(255,255,255,0.10)",
    textClass: "text-slate-200",
  },
  "0-2": {
    from: "rgba(255,255,255,0.08)",
    to: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.06)",
    inset: "rgba(255,255,255,0.02)",
    glow: "rgba(255,255,255,0.10)",
    textClass: "text-slate-200",
  },
  "0-3": {
    from: "rgba(255,255,255,0.02)",
    to: "rgba(255,255,255,0.01)",
    border: "rgba(255,255,255,0.06)",
    inset: "rgba(255,255,255,0.02)",
    glow: "rgba(255,255,255,0.10)",
    textClass: "text-slate-200",
  },
  "1-0": {
    from: "rgba(52, 211, 153, 0.2)",
    to: "rgba(52, 211, 153,0.05)",
    border: "rgba(52, 211, 153,0.03)",
    inset: "rgba(52, 211, 153,0.12)",
    glow: "rgba(52, 211, 153,0.88)",
    textClass: "text-pink-100/70",
  },
  "1-1": {
    from: "rgba(244, 114, 182,0.2)",
    to: "rgba(244, 114, 182,0.05)",
    border: "rgba(244, 114, 182,0.03)",
    inset: "rgba(244, 114, 182,0.02)",
    glow: "rgba(244, 114, 182,0.8)",
    textClass: "text-slate-200",
  },
  "1-2": {
    from: "rgba(253, 230, 138,0.3)",
    to: "rgba(253, 230, 138,0.01)",
    border: "rgba(253, 230, 138,0.04)",
    inset: "rgba(253, 230, 138,0.12)",
    glow: "rgba(253, 230, 138,0.88)",
    textClass: "text-blue-100/70",
  },
  "1-3": {
    from: "rgba(255,255,255,0.08)",
    to: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.06)",
    inset: "rgba(255,255,255,0.02)",
    glow: "rgba(255,255,255,0.10)",
    textClass: "text-slate-200",
  },
  "2-0": {
    from: "rgba(244, 114, 182,0.2)",
    to: "rgba(244, 114, 182,0.05)",
    border: "rgba(244, 114, 182,0.03)",
    inset: "rgba(244, 114, 182,0.02)",
    glow: "rgba(244, 114, 182,0.8)",
    textClass: "text-slate-200",
  },
  "2-1": {
    from: "rgba(52, 211, 153, 0.2)",
    to: "rgba(52, 211, 153,0.05)",
    border: "rgba(52, 211, 153,0.03)",
    inset: "rgba(52, 211, 153,0.12)",
    glow: "rgba(52, 211, 153,0.88)",
    textClass: "text-pink-100/70",
  },
  "2-2": {
    from: "rgba(253, 230, 138,0.3)",
    to: "rgba(253, 230, 138,0.01)",
    border: "rgba(253, 230, 138,0.04)",
    inset: "rgba(253, 230, 138,0.12)",
    glow: "rgba(253, 230, 138,0.88)",
    textClass: "text-blue-100/70",
  },
  "2-3": {
    from: "rgba(255,255,255,0.08)",
    to: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.06)",
    inset: "rgba(255,255,255,0.02)",
    glow: "rgba(255,255,255,0.10)",
    textClass: "text-slate-200",
  },
  "3-0": {
    from: "rgba(244, 114, 182,0.2)",
    to: "rgba(244, 114, 182,0.05)",
    border: "rgba(244, 114, 182,0.03)",
    inset: "rgba(244, 114, 182,0.02)",
    glow: "rgba(244, 114, 182,0.8)",
    textClass: "text-slate-200",
  },
  "3-1": {
    from: "rgba(34,211,238,0.10)",
    to: "rgba(255,255,255,0.01)",
    border: "rgba(34,211,238,0.10)",
    inset: "rgba(34,211,238,0.40)",
    glow: "rgba(34,211,238,0.26)",
    textClass: "text-cyan-50",
  },
  "3-2": {
    from: "rgba(49, 46, 129,0.6)",
    to: "rgba(249, 46, 129,0.1)",
    border: "rgba(49, 46, 129,0.14)",
    inset: "rgba(49, 46, 129,0.12)",
    glow: "rgba(49, 46, 129,0.8)",
    textClass: "text-blue-100/70",
  },
  "3-3": {
    from: "rgba(255,255,255,0.08)",
    to: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.06)",
    inset: "rgba(255,255,255,0.02)",
    glow: "rgba(255,255,255,0.10)",
    textClass: "text-slate-200",
  },
  "4-0": {
    from: "rgba(220, 38, 38,0.3)",
    to: "rgba(220, 38, 38,0.1)",
    border: "rgba(220, 38, 38,0.01)",
    inset: "rgba(255,255,255,0.01)",
    glow: "rgba(220, 38, 38,0.8)",
    textClass: "text-slate-200",
  },
  "4-1": {
    from: "rgba(220, 38, 38,0.3)",
    to: "rgba(220, 38, 38,0.1)",
    border: "rgba(220, 38, 38,0.01)",
    inset: "rgba(255,255,255,0.01)",
    glow: "rgba(220, 38, 38,0.8)",
    textClass: "text-slate-200",
  },
  "4-2": {
    from: "rgba(157, 23, 77,0.7)",
    to: "rgba(157, 23, 77,0.1)",
    border: "rgba(157, 23, 77,0.06)",
    inset: "rgba(157, 23, 77,0.02)",
    glow: "rgba(157, 23, 77,0.10)",
    textClass: "text-slate-200",
  },
  "4-3": {
    from: "rgba(255,255,255,0.08)",
    to: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.06)",
    inset: "rgba(255,255,255,0.02)",
    glow: "rgba(255,255,255,0.10)",
    textClass: "text-slate-200",
  },
};

const DEFAULT_THEME: CellTheme = {
  from: "rgba(255,255,255,0.02)",
  to: "rgba(255,255,255,0.01)",
  border: "rgba(255,255,255,0.06)",
  inset: "rgba(255,255,255,0.02)",
  glow: "rgba(45,212,191,0.10)",
  textClass: "text-slate-200",
};

const CELL_ACCENT_LINES: Record<string, string[]> = {
  "1-0": ["#34d399"],
  "1-1": ["#f472b6"],
  "1-2": ["#fde68a"],
  "2-0": ["#f472b6"],
  "2-1": ["#34d399"],
  "2-2": ["#fde68a"],
  "2-3": ["#22d3ee"],
  "3-0": ["#f472b6"],
  "3-2": ["#312e81"],
};

const PLANET_SYMBOLS: Record<string, string> = {
  Сонце: "☉",
  Місяць: "☽",
  Марс: "♂",
  Уран: "♅",
  Юпітер: "♃",
  Нептун: "♆",
  Меркурій: "☿",
  Сатурн: "♄",
  Венера: "♀",
  Плутон: "♇",
  Прозерпіна: "⚳",
  Вулкан: "🜂",
};

const PLANET_COLORS: Record<string, string> = {
  Сонце: "#f97316",
  Місяць: "#60a5fa",
  Меркурій: "#d946ef",
  Венера: "#fde047",
  Марс: "#ef4444",
  Юпітер: "#fb7185",
  Сатурн: "#f59e0b",
  Уран: "#22d3ee",
  Нептун: "#8b5cf6",
  Плутон: "#ec4899",
  Прозерпіна: "#a78bfa",
  Вулкан: "#f97316",
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
  void energy;
  return STATIC_CELL_THEME[`${rowIndex}-${colIndex}`] ?? DEFAULT_THEME;
}

export const MatrixSummaryTable = memo(function MatrixSummaryTable({
  rows,
  theme = "dark",
}: MatrixSummaryTableProps) {
  const isDark = theme === "dark";
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
  const detailCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimeoutRef = useRef<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const [highlightedDetailKey, setHighlightedDetailKey] = useState<
    string | null
  >(null);
  const getCellKey = (rowIndex: number, colIndex: number) =>
    `${rowIndex}-${colIndex}`;

  const triggerDetailHighlight = (cellKey: string) => {
    setHighlightedDetailKey(null);

    requestAnimationFrame(() => {
      setHighlightedDetailKey(cellKey);
    });

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedDetailKey(null);
      highlightTimeoutRef.current = null;
    }, 2200);
  };

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

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    },
    [],
  );

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
    className = `mt-2 rounded-[16px] border p-2.5 ${
      isDark
        ? "border-white/[0.06] bg-[#13151C]/95"
        : "border-slate-300/70 bg-white/90"
    }`,
    compact = false,
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
    const isTopBaseCell = parsed.rowIndex === 0 && parsed.colIndex <= 2;

    if (isTopBaseCell) {
      const topBaseTitle =
        parsed.colIndex === 0
          ? "Шлях найменшого опору"
          : parsed.colIndex === 2
            ? "Верхній правий показник"
            : "Архетип старту розвитку (0)";
      const topBaseText =
        parsed.colIndex === 0
          ? "Це якісний базовий показник: те, що дається природно і легше за інше. Для цієї клітинки не застосовуються статуси «вище норми / нижче норми»."
          : parsed.colIndex === 2
            ? "Це окремий базовий показник верхнього правого кута. Він інтерпретується як якість (напрям), а не як кількісна «норма», тому статуси «вище / нижче норми» тут не використовуються."
            : "Нуль у центрі верхнього ряду показує минулий досвід у циклі над системою: архетип, з якого суб'єкт починає розвиток, і готовність використати попередні накопичення.";
      const zeroStateText =
        parsed.colIndex !== 1
          ? null
          : parsed.mainCount > 0
            ? "Нуль у основному полі присутній: є опора на вже накопичений досвід."
            : parsed.bracketCount > 0
              ? "Нуль проявлений у дужках: потенціал минулого досвіду є, але потребує свідомого включення."
              : "Нуль явно не проявлений: тему опори на минулі накопичення варто розкривати через практику й усвідомлення пройденого досвіду.";

      return (
        <div
          className={className}
          style={{
            borderColor: cardTheme.border,
            boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.03), 0 0 0 1px ${cardTheme.border}, 0 12px 24px -18px rgba(0,0,0,0.85), 0 0 24px -16px ${cardTheme.glow}`,
            background: isDark
              ? "linear-gradient(180deg, rgba(17,21,31,0.95), rgba(10,12,18,0.98))"
              : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          }}
        >
          <p
            className={`text-sm font-semibold ${isDark ? "text-cyan-100" : "text-cyan-800"}`}
          >
            {topBaseTitle}
          </p>
          <p
            className={`mt-1 text-base font-medium ${isDark ? "text-white/90" : "text-slate-900"}`}
          >
            Значення: {parsed.rawValue || "—"}
          </p>
          <p
            className={`mt-1 text-sm ${isDark ? "text-white/85" : "text-slate-700"}`}
          >
            {topBaseText}
          </p>
          {zeroStateText && (
            <p
              className={`mt-1 text-sm font-medium ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
            >
              {zeroStateText}
            </p>
          )}
        </div>
      );
    }

    const totalCount = parsed.mainCount + parsed.bracketCount;
    const status =
      count !== undefined ? getNormStatus(totalCount, count) : null;
    const statusLabel =
      status === "normal"
        ? "Норма"
        : status === "below"
          ? "Нижче норми"
          : status === "above"
            ? "Вище норми"
            : "Немає числа";
    const statusClass =
      status === "normal"
        ? isDark
          ? "text-emerald-300"
          : "text-emerald-700"
        : status === "above"
          ? isDark
            ? "text-rose-300"
            : "text-rose-700"
          : status === "below"
            ? isDark
              ? "text-amber-300"
              : "text-amber-700"
            : isDark
              ? "text-slate-300"
              : "text-slate-700";
    const statusText =
      status === "normal"
        ? "Здібності та енергія проявляються природно, стабільно і легко."
        : status === "below"
          ? "Здібності проявляються переважно за певних умов або коли є зовнішній запит."
          : status === "above"
            ? "Здібності та енергія проявляються легко і в надлишку; інколи це може відчуватися оточенням як напруга."
            : "Якщо числа немає, енергія частіше вмикається через життєву необхідність і свідоме зусилля.";
    const profileStatusText =
      status === "below"
        ? profile?.below
        : status === "above"
          ? profile?.above
          : null;
    const currentLevel =
      totalCount > 0 ? (ENERGY_LEVELS[Math.min(7, totalCount)] ?? null) : null;
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
    const size = compact
      ? {
          imageHint: "text-xs",
          title: "text-sm",
          body: "text-xs",
          stat: "text-xs",
          status: "text-sm",
          footer: "text-xs",
        }
      : {
          imageHint: "text-sm",
          title: "text-lg",
          body: "text-base",
          stat: "text-base",
          status: "text-lg",
          footer: "text-base",
        };

    if (parsed.colIndex === 3 && parsed.rowIndex === 0) {
      return null;
    }

    if (effectiveEnergy === null) {
      return (
        <div className={className}>
          {isImageColumn ? (
            <>
              <p
                className={`text-xs ${isDark ? "text-cyan-100/90" : "text-cyan-800/90"}`}
              >
                4-й стовпчик: сумарний резонанс енергій рядка (показник
                отримується через суму цифр у рядку) і те, як це бачать інші.
              </p>
              <p
                className={`mt-1 text-xs ${isDark ? "text-white/80" : "text-slate-700"}`}
              >
                Наразі явний іміджевий сигнал у цій зоні не сформований.
              </p>
              <p
                className={`mt-1 text-xs font-medium ${isDark ? "text-cyan-100/90" : "text-cyan-800/90"}`}
              >
                Що зробити, щоб вас краще розуміли люди: прямо проговорюйте свою
                позицію, узгоджуйте очікування і підкріплюйте наміри конкретними
                діями.
              </p>
            </>
          ) : (
            <p
              className={`text-xs ${isDark ? "text-white/75" : "text-slate-700"}`}
            >
              Для цієї комірки енергія не виділена окремим числом.
            </p>
          )}
        </div>
      );
    }

    return (
      <div
        className={className}
        style={(() => {
          const isNeutralTheme = cardTheme.border.includes("255,255,255");
          const accentGlow = isNeutralTheme
            ? "rgba(255,255,255,0.08)"
            : cardTheme.glow;

          return {
            borderColor: cardTheme.border,
            boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.03), 0 0 0 1px ${cardTheme.border}, 0 12px 24px -18px rgba(0,0,0,0.85), 0 0 24px -16px ${accentGlow}`,
            background: isDark
              ? "linear-gradient(180deg, rgba(17,21,31,0.95), rgba(10,12,18,0.98))"
              : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          };
        })()}
      >
        {parsed.colIndex === 3 && (
          <p
            className={`${size.imageHint} ${isDark ? "text-cyan-100/90" : "text-cyan-800/90"}`}
          >
            4-й стовпчик: сумарний резонанс енергій рядка і видимий ефект для
            оточення.
          </p>
        )}
        <p
          className={`${size.title} font-semibold ${isDark ? "text-cyan-100" : "text-cyan-800"}`}
        >
          Енергія {effectiveEnergy}
          {profile && (
            <>
              {" • "}
              {profile.name}
              {" ("}
              <span
                className="mx-1 inline-block text-[1.05em] leading-none"
                style={{
                  color: PLANET_COLORS[profile.planet] ?? "#e2e8f0",
                  filter: `drop-shadow(0 0 4px ${PLANET_COLORS[profile.planet] ?? "#94a3b8"}66)`,
                }}
              >
                {PLANET_SYMBOLS[profile.planet] ?? "✶"}
              </span>
              {profile.planet}
              {")"}
            </>
          )}
        </p>
        {profile?.base && (
          <p
            className={`mt-1 ${size.body} ${isDark ? "text-white/85" : "text-slate-700"}`}
          >
            {profile.base}
          </p>
        )}
        {parsed.colIndex === 3 && profile?.base && (
          <p
            className={`mt-1 ${size.body} ${isDark ? "text-white/90" : "text-slate-800"}`}
          >
            Люди частіше зчитують вас як: {profile.base.toLowerCase()}
          </p>
        )}
        <p
          className={`mt-1 ${size.stat} ${isDark ? "text-white/90" : "text-slate-800"}`}
        >
          Норма: {count ?? "—"} • Факт: {totalCount}
          {parsed.bracketCount > 0
            ? ` (${parsed.mainCount} + ${parsed.bracketCount} у дужках)`
            : ""}
        </p>
        <p
          className={`mt-1 ${size.status} font-medium ${isDark ? "text-cyan-50" : "text-slate-900"}`}
        >
          Статус: <span className={statusClass}>{statusLabel}</span>
        </p>
        {statusText && (
          <p
            className={`mt-1 ${size.body} ${isDark ? "text-white/85" : "text-slate-700"}`}
          >
            {statusText}
          </p>
        )}
        {profileStatusText && (
          <p
            className={`mt-1 ${size.body} ${isDark ? "text-white/80" : "text-slate-700"}`}
          >
            {profileStatusText}
          </p>
        )}
        {currentLevel && (
          <p
            className={`mt-1 ${size.body} ${isDark ? "text-white/80" : "text-slate-700"}`}
          >
            {currentLevel}
          </p>
        )}
        {parsed.bracketCount > 0 && (
          <p
            className={`mt-1 ${size.body} ${isDark ? "text-white/80" : "text-slate-700"}`}
          >
            Числа в дужках — це друга хвиля сприйняття: неявний, відчутний
            потенціал, який потребує пропрацювання і закріплення досвідом.
          </p>
        )}
        <p
          className={`mt-1 ${size.footer} font-medium ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
        >
          {isImageColumn ? workOnText : `Що пропрацьовувати: ${workOnText}`}
        </p>
      </div>
    );
  };

  return (
    <div
      className={`relative mb-3 w-full rounded-xl border backdrop-blur-md md:rounded-[32px] pt-1 ${
        isDark
          ? "border-white/[0.03] bg-[#0A0C10]/1 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8),inset_0_0_80px_rgba(45,212,191,0.02)]"
          : "border-slate-300/60 bg-white/7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.28),inset_0_0_50px_rgba(56,189,248,0.05)]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 md:rounded-[32px] ${isDark ? "shadow-[0_0_60px_rgba(45,212,191,0.04)]" : "shadow-[0_0_60px_rgba(56,189,248,0.08)]"}`}
      />
      <div className="relative mb-2 grid grid-cols-[minmax(0,1.2fr)_minmax(0,4fr)] gap-1 px-1">
        <div />
        <div className="grid grid-cols-4 gap-1.5">
          {MATRIX_COLUMN_LABELS.map((label) => (
            <div
              key={label}
              className={`rounded-sm border px-2 py-2 text-center text-[6px] font-semibold tracking-widest uppercase text-pretty sm:text-[11px] md:rounded-full md:text-[10px] ${
                isDark
                  ? "border-white/[0.03] bg-[#12141A] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  : "border-sky-200/90 bg-linear-to-b from-sky-50 to-blue-50 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.98)]"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative space-y-1.5 px-1">
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,4fr)] gap-1"
          >
            <div
              className={`rounded-[18px] border px-2 py-2 ${
                isDark
                  ? "border-white/[0.03] bg-[#0E1016] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                  : "border-sky-200/90 bg-linear-to-b from-sky-50 to-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.98)]"
              }`}
            >
              <p
                className={`text-[9px] leading-tight md:text-[11px] ${isDark ? "text-slate-300/90" : "text-slate-800"}`}
              >
                {MATRIX_ROW_LABELS[rowIndex] ?? `Ряд ${rowIndex + 1}`}
              </p>
              {MATRIX_ROW_TIME_LABELS[rowIndex] && (
                <p
                  className={`mt-1 text-[10px] tracking-wide uppercase ${isDark ? "text-teal-300/75" : "text-teal-600"}`}
                >
                  {MATRIX_ROW_TIME_LABELS[rowIndex]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {row.map((cell, colIndex) => {
                const isHiddenDescriptionCell =
                  rowIndex === 0 && colIndex === 3;
                const accentLines =
                  CELL_ACCENT_LINES[`${rowIndex}-${colIndex}`] ?? [];

                const isActive =
                  activeCell.rowIndex === rowIndex &&
                  activeCell.colIndex === colIndex;
                const interactiveClass = isActive
                  ? isDark
                    ? "ring-1 ring-white/35"
                    : "ring-1 ring-slate-500/35"
                  : isDark
                    ? "hover:brightness-110"
                    : "hover:brightness-98";

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className={`${cellBaseClass} ${isDark ? "text-slate-200" : "text-slate-800"} ${interactiveClass} cursor-pointer transition`}
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(148,163,184,0.35)",
                      background: isDark
                        ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))"
                        : "linear-gradient(180deg, rgba(255,255,255,1), rgba(252,253,255,1))",
                      boxShadow: isActive
                        ? isDark
                          ? "inset 0 1px 0 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 2px rgba(255,255,255,0.16), 0 10px 22px -14px rgba(0,0,0,0.8)"
                          : "inset 0 1px 0 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(100,116,139,0.45), 0 0 0 2px rgba(30,41,59,0.3), 0 8px 18px -12px rgba(15,23,42,0.28)"
                        : isDark
                          ? "inset 0 1px 0 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(255,255,255,0.05), 0 10px 22px -14px rgba(0,0,0,0.8)"
                          : "inset 0 1px 0 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(148,163,184,0.4), 0 8px 18px -12px rgba(15,23,42,0.2)",
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
                      if (isHiddenDescriptionCell) return;

                      setActiveCell({ rowIndex, colIndex });

                      const target =
                        detailCardRefs.current[getCellKey(rowIndex, colIndex)];

                      if (target) {
                        target.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                        triggerDetailHighlight(getCellKey(rowIndex, colIndex));
                      }
                    }}
                    aria-label={`Ряд ${rowIndex + 1}, стовпець ${colIndex + 1}`}
                  >
                    {accentLines.length > 0 && (
                      <span className="pointer-events-none absolute top-2 left-1/2 flex -translate-x-1/2 items-center gap-1">
                        {accentLines.map((color, idx) => (
                          <span
                            key={`${rowIndex}-${colIndex}-line-${idx}`}
                            className="h-1.5 w-5 rounded-full"
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 0 8px ${color}66`,
                            }}
                          />
                        ))}
                      </span>
                    )}
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
              background: isDark
                ? "linear-gradient(180deg, rgba(10,13,20,0.98), rgba(8,10,16,0.98))"
                : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
              boxShadow: isDark
                ? `0 20px 40px -10px rgba(0,0,0,0.8), 0 0 30px -18px ${activeTheme.glow}, 0 0 0 1px ${activeTheme.border}`
                : `0 20px 40px -10px rgba(15,23,42,0.25), 0 0 20px -16px ${activeTheme.glow}, 0 0 0 1px ${activeTheme.border}`,
            }}
          >
            <p
              className={`text-[11px] tracking-wide uppercase ${isDark ? "text-teal-200/85" : "text-teal-700"}`}
            >
              {activeParsed.rowLabel} • {activeParsed.columnLabel}
              {activeParsed.timeLabel ? ` • ${activeParsed.timeLabel}` : ""}
            </p>
            <p
              className={`mt-1 text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Значення: {activeParsed.rawValue || "—"}
            </p>
            {renderParsedBlock(activeParsed, undefined, true)}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-full -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: isDark
                  ? "8px solid rgba(14, 16, 23, 0.85)"
                  : "8px solid rgba(255,255,255,0.95)",
              }}
            />
          </div>,
          document.body,
        )}

      <div
        className={`mt-3 rounded-[26px] border p-3 backdrop-blur-xl ${
          isDark
            ? "border-teal-500/20 bg-[#0E1017]/82 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.75),0_0_24px_rgba(45,212,191,0.08)]"
            : "border-slate-300/70 bg-white/85 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.22),0_0_24px_rgba(56,189,248,0.08)]"
        }`}
      >
        <p
          className={`text-[13px] tracking-widest uppercase ${isDark ? "text-teal-200/80" : "text-teal-700"}`}
        >
          Розбір усіх комірок
        </p>
        <div className="mt-3 space-y-2.5">
          {parsedCellsForList.map((parsed) =>
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

              return (() => {
                const cellKey = getCellKey(parsed.rowIndex, parsed.colIndex);
                const isHighlighted = highlightedDetailKey === cellKey;

                return (
                  <div
                    key={cellKey}
                    ref={(node) => {
                      detailCardRefs.current[cellKey] = node;
                    }}
                    className={`rounded-[20px] border p-2.5 transition-[box-shadow,border-color,transform] duration-500 ${
                      isHighlighted ? "animate-[pulse_1s_ease-in-out_2]" : ""
                    }`}
                    style={{
                      scrollMarginTop: "12px",
                      borderColor: isHighlighted
                        ? "rgba(94, 234, 212, 0.85)"
                        : theme.border,
                      background: isDark
                        ? "linear-gradient(180deg, rgba(16,19,28,0.95), rgba(10,12,18,0.98))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
                      transform: isHighlighted ? "translateY(-1px)" : "none",
                      boxShadow: isHighlighted
                        ? isDark
                          ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(94,234,212,0.55), 0 0 0 2px rgba(45,212,191,0.4), 0 16px 34px -14px rgba(0,0,0,0.75), 0 0 42px -10px rgba(45,212,191,0.7)`
                          : `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(94,234,212,0.55), 0 0 0 2px rgba(45,212,191,0.25), 0 16px 34px -14px rgba(15,23,42,0.3), 0 0 42px -12px rgba(45,212,191,0.35)`
                        : isDark
                          ? `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px ${theme.border}, 0 12px 24px -16px rgba(0,0,0,0.75), 0 0 24px -18px ${theme.glow}`
                          : `inset 0 1px 0 rgba(255,255,255,0.09), 0 0 0 1px ${theme.border}, 0 12px 24px -16px rgba(15,23,42,0.22), 0 0 24px -18px ${theme.glow}`,
                    }}
                  >
                    <p
                      className={`text-[16px] font-semibold leading-snug ${isDark ? "text-slate-100/95" : "text-slate-900"}`}
                    >
                      {parsed.rowLabel} • {parsed.columnLabel}
                      {parsed.timeLabel ? ` • ${parsed.timeLabel}` : ""}
                    </p>
                    <p
                      className={`mt-1.5 text-[19px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Значення: {parsed.rawValue || "—"}
                    </p>
                    {renderParsedBlock(
                      parsed,
                      "mt-2.5 rounded-[16px] border p-2.5",
                    )}
                  </div>
                );
              })();
            })(),
          )}
        </div>
      </div>
    </div>
  );
});
