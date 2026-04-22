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
import { MATRIX_INTERPRETATIONS } from "../../data/matrixInterpretations";
import { getUITheme, type ThemeMode } from "../../theme/uiTheme";
import { PLANET_COLORS_BY_NAME } from "../../theme/planetColors";

type MatrixSummaryTableProps = {
  rows: MatrixModelTableRow[];
  theme?: ThemeMode;
  cellOpacity?: number;
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

const TOP_ROW_DESCRIPTIONS: Record<
  0 | 1 | 2,
  { title: string; description: string }
> = {
  0: {
    title: "Шлях особистості",
    description: "Легкий шлях, шлях найменшого опору.",
  },
  1: {
    title: "Минулий досвід",
    description:
      "Кількість циклів у надсистемі. Архетип накопичення досвіду, готовність використати попередні накопичення.",
  },
  2: {
    title: "Шлях душі",
    description:
      "Шлях найбільшого опору, якісного накопичення досвіду.",
  },
};

const TOP_ROW_NUMBER_OVERRIDES: Record<0 | 1 | 2, Record<number, string>> = {
  0: {
    10: "Воля в досягненні результату, вплив на великі маси людей, трансформація власної свідомості та свідомості людей.",
  },
  1: {
    10: "Вище чуття, пізнання надсистеми, здатність прогнозувати.",
  },
  2: {
    10: "Здатність бачити стратегію, розуміти перспективу, ставити ціль і бачити шлях її досягнення. Провідник Волі більшої системи.",
  },
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
  cellOpacity = 10,
}: MatrixSummaryTableProps) {
  const ui = getUITheme(theme, cellOpacity / 100);
  const tableSurface = ui.surface;
  const tableSurfaceAlt = ui.surfaceAlt;
  const tableSurfaceSoft = ui.surfaceSoft;
  const tableBorder = ui.border;
  const tableBorderStrong = ui.borderStrong;
  const tableText = ui.text;
  const tableTextMuted = ui.textMuted;
  const tableTextSoft = ui.textSoft;
  const tableAccent = ui.accent;
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
    className = "mt-2 rounded-[16px] border p-2.5",
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
      const topRowContent = TOP_ROW_DESCRIPTIONS[parsed.colIndex as 0 | 1 | 2];
      const meaning =
        parsed.energy !== null ? MATRIX_INTERPRETATIONS[parsed.energy] : null;
      const topRowMeaningOverride =
        parsed.energy !== null
          ? TOP_ROW_NUMBER_OVERRIDES[parsed.colIndex as 0 | 1 | 2]?.[
              parsed.energy
            ] ?? null
          : null;
      const topBaseTitle =
        topRowContent?.title ??
        (parsed.colIndex === 0
          ? "Шлях найменшого опору"
          : parsed.colIndex === 2
            ? "Верхній правий показник"
            : "Архетип старту розвитку (0)");
      const topBaseText =
        topRowContent?.description ??
        (parsed.colIndex === 0
          ? "Це якісний базовий показник: те, що дається природно і легше за інше. Для цієї клітинки не застосовуються статуси «вище норми / нижче норми»."
          : parsed.colIndex === 2
            ? "Це окремий базовий показник верхнього правого кута. Він інтерпретується як якість (напрям), а не як кількісна «норма», тому статуси «вище / нижче норми» тут не використовуються."
            : "Нуль у центрі верхнього ряду показує минулий досвід у циклі над системою: архетип, з якого суб'єкт починає розвиток, і готовність використати попередні накопичення.");
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
            background: `linear-gradient(180deg, ${ui.surfaceAlt}, ${ui.surfaceDeep})`,
          }}
        >
          <p className="text-sm font-semibold" style={{ color: tableAccent }}>
            {topBaseTitle}
          </p>
          <p
            className="mt-1 text-base font-medium"
            style={{ color: tableText }}
          >
            Значення: {parsed.rawValue || "—"}
          </p>
          <p className="mt-1 text-sm" style={{ color: tableTextMuted }}>
            {topBaseText}
          </p>
          {meaning && (
            <p className="mt-1 text-sm" style={{ color: tableText }}>
              Значення числа: <span className="font-semibold">{meaning.title}</span>
              {" — "}
              {topRowMeaningOverride ?? meaning.summary}
            </p>
          )}
          {zeroStateText && (
            <p className="mt-1 text-sm font-medium text-emerald-600">
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
    const statusColor =
      status === "normal"
        ? "#10b981"
        : status === "above"
          ? "#f43f5e"
          : status === "below"
            ? "#f59e0b"
            : tableTextSoft;
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
        <div
          className={className}
          style={{
            borderColor: tableBorder,
            background: tableSurfaceAlt,
          }}
        >
          {isImageColumn ? (
            <>
              <p className="text-xs" style={{ color: tableAccent }}>
                4-й стовпчик: сумарний резонанс енергій рядка (показник
                отримується через суму цифр у рядку) і те, як це бачать інші.
              </p>
              <p className="mt-1 text-xs" style={{ color: tableTextMuted }}>
                Наразі явний іміджевий сигнал у цій зоні не сформований.
              </p>
              <p
                className="mt-1 text-xs font-medium"
                style={{ color: tableAccent }}
              >
                Що зробити, щоб вас краще розуміли люди: прямо проговорюйте свою
                позицію, узгоджуйте очікування і підкріплюйте наміри конкретними
                діями.
              </p>
            </>
          ) : (
            <p className="text-xs" style={{ color: tableTextMuted }}>
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
            background: `linear-gradient(180deg, ${ui.surfaceAlt}, ${ui.surfaceDeep})`,
          };
        })()}
      >
        {parsed.colIndex === 3 && (
          <p className={size.imageHint} style={{ color: tableAccent }}>
            4-й стовпчик: сумарний резонанс енергій рядка і видимий ефект для
            оточення.
          </p>
        )}
        <p
          className={`${size.title} font-semibold`}
          style={{ color: tableAccent }}
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
                  color: PLANET_COLORS_BY_NAME[profile.planet] ?? "#e2e8f0",
                  filter: `drop-shadow(0 0 4px ${PLANET_COLORS_BY_NAME[profile.planet] ?? "#94a3b8"}66)`,
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
          <p className={`mt-1 ${size.body}`} style={{ color: tableTextMuted }}>
            {profile.base}
          </p>
        )}
        {parsed.colIndex === 3 && profile?.base && (
          <p className={`mt-1 ${size.body}`} style={{ color: tableText }}>
            Люди частіше зчитують вас як: {profile.base.toLowerCase()}
          </p>
        )}
        <p className={`mt-1 ${size.stat}`} style={{ color: tableText }}>
          Норма: {count ?? "—"} • Факт: {totalCount}
          {parsed.bracketCount > 0
            ? ` (${parsed.mainCount} + ${parsed.bracketCount} у дужках)`
            : ""}
        </p>
        <p
          className={`mt-1 ${size.status} font-medium`}
          style={{ color: tableText }}
        >
          Статус: <span style={{ color: statusColor }}>{statusLabel}</span>
        </p>
        {statusText && (
          <p className={`mt-1 ${size.body}`} style={{ color: tableTextMuted }}>
            {statusText}
          </p>
        )}
        {profileStatusText && (
          <p className={`mt-1 ${size.body}`} style={{ color: tableTextMuted }}>
            {profileStatusText}
          </p>
        )}
        {currentLevel && (
          <p className={`mt-1 ${size.body}`} style={{ color: tableTextMuted }}>
            {currentLevel}
          </p>
        )}
        {parsed.bracketCount > 0 && (
          <p className={`mt-1 ${size.body}`} style={{ color: tableTextMuted }}>
            Числа в дужках — це друга хвиля сприйняття: неявний, відчутний
            потенціал, який потребує пропрацювання і закріплення досвідом.
          </p>
        )}
        <p className={`mt-1 ${size.footer} font-medium text-emerald-600`}>
          {isImageColumn ? workOnText : `Що пропрацьовувати: ${workOnText}`}
        </p>
      </div>
    );
  };

  return (
    <div
      className="relative mb-3 w-full rounded-xl border pt-1 backdrop-blur-md md:rounded-[32px]"
      style={{
        borderColor: tableBorderStrong,
        background: tableSurfaceSoft,
        boxShadow: ui.shadowStrong,
      }}
    >
      <div className="pointer-events-none absolute inset-0 md:rounded-[32px]" />
      <div className="relative mb-2 grid grid-cols-[minmax(0,1.2fr)_minmax(0,4fr)] gap-1 px-1">
        <div />
        <div className="grid grid-cols-4 gap-1.5">
          {MATRIX_COLUMN_LABELS.map((label) => (
            <div
              key={label}
              className="border px-2 py-2 text-center font-semibold tracking-widest uppercase text-pretty md:text-[11px] text-[7px] rounded-[18px]"
              style={{
                borderColor: tableBorderStrong,
                color: tableText,
                backgroundColor: tableSurfaceAlt,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), ${ui.shadowSoft}`,
              }}
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
              className="rounded-[18px] border px-2 py-2"
              style={{
                borderColor: tableBorderStrong,
                backgroundColor: tableSurfaceAlt,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), ${ui.shadowSoft}`,
              }}
            >
              <p
                className="text-[9px] leading-tight md:text-[11px]"
                style={{ color: tableText }}
              >
                {MATRIX_ROW_LABELS[rowIndex] ?? `Ряд ${rowIndex + 1}`}
              </p>
              {MATRIX_ROW_TIME_LABELS[rowIndex] && (
                <p
                  className="mt-1 text-[10px] tracking-wide uppercase"
                  style={{ color: tableAccent }}
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
                  ? "ring-1"
                  : "hover:brightness-105";

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className={`${cellBaseClass} ${interactiveClass} cursor-pointer transition`}
                    style={{
                      color: tableText,
                      borderColor: tableBorderStrong,
                      background: `linear-gradient(180deg, ${tableSurface}, ${tableSurface})`,
                      boxShadow: isActive
                        ? `inset 0 1px 0 0 rgba(255,255,255,0.1), 0 0 0 1px ${tableBorderStrong}, 0 0 0 2px ${ui.ring}, ${ui.shadowSoft}`
                        : `inset 0 1px 0 0 rgba(255,255,255,0.08), 0 0 0 1px ${tableBorder}, ${ui.shadowSoft}`,
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
            className="pointer-events-none fixed z-50 h-auto w-[min(88vw,360px)] overflow-hidden rounded-[24px] border p-3 backdrop-blur-md"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              borderColor: activeTheme.border,
              background: `linear-gradient(180deg, ${ui.surfaceAlt}, ${ui.surfaceDeep})`,
              boxShadow: `${ui.shadowStrong}, 0 0 30px -18px ${activeTheme.glow}, 0 0 0 1px ${activeTheme.border}`,
            }}
          >
            <p
              className="text-[11px] tracking-wide uppercase"
              style={{ color: tableAccent }}
            >
              {activeParsed.rowLabel} • {activeParsed.columnLabel}
              {activeParsed.timeLabel ? ` • ${activeParsed.timeLabel}` : ""}
            </p>
            <p className="mt-1 text-sm font-bold" style={{ color: tableText }}>
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
                borderTop: `8px solid ${ui.surfaceDeep}`,
              }}
            />
          </div>,
          document.body,
        )}

      <div
        className="mt-3 rounded-[26px] border p-3 backdrop-blur-xl"
        style={{
          borderColor: tableBorderStrong,
          background: tableSurfaceAlt,
          boxShadow: ui.shadowStrong,
        }}
      >
        <p
          className="text-[13px] tracking-widest uppercase"
          style={{ color: tableAccent }}
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
                      background: `linear-gradient(180deg, ${ui.surfaceAlt}, ${ui.surfaceDeep})`,
                      transform: isHighlighted ? "translateY(-1px)" : "none",
                      boxShadow: isHighlighted
                        ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(94,234,212,0.55), 0 0 0 2px rgba(45,212,191,0.35), ${ui.shadowStrong}, 0 0 42px -12px rgba(45,212,191,0.45)`
                        : `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px ${theme.border}, ${ui.shadowSoft}, 0 0 24px -18px ${theme.glow}`,
                    }}
                  >
                    <p
                      className="text-[16px] font-semibold leading-snug"
                      style={{ color: tableText }}
                    >
                      {parsed.rowLabel} • {parsed.columnLabel}
                      {parsed.timeLabel ? ` • ${parsed.timeLabel}` : ""}
                    </p>
                    <p
                      className="mt-1.5 text-[19px] font-bold"
                      style={{ color: tableText }}
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
