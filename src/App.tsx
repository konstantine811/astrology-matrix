import { useEffect, useMemo, useState } from "react";
import { Particles } from "./components/background/Particles";
import { BirthDatePicker } from "./components/date-picker/BirthDatePicker";
// import { MatrixDiagram } from "./components/matrix/MatrixDiagram";
import { MatrixSummaryTable } from "./components/matrix/MatrixSummaryTable";
import {
  DEFAULT_BIRTH_YEAR,
  MONTHS_UA,
  createDayOptions,
  createYearOptions,
} from "./constants/date";
import { ENERGY_NORM_COUNT, ENERGY_PROFILES } from "./data/energyNorms";
import { buildMatrixModelTable, parseMatrixCell } from "./utils/modelTable";
// import { calculateDestinyMatrix } from "./utils/matrix";

type ThemeMode = "light" | "dark";
type LiquidPalette = {
  deep: string;
  mid: string;
  highlight: string;
  intensity: number;
};

const PLANET_COLOR_BY_NAME: Record<string, string> = {
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

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g)
    .toString(16)
    .padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function mixHex(colorA: string, colorB: string, ratio: number): string {
  const [ar, ag, ab] = hexToRgb(colorA);
  const [br, bg, bb] = hexToRgb(colorB);
  const t = Math.max(0, Math.min(1, ratio));
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = window.localStorage.getItem("metasense-theme");
    return savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : "light";
  });
  const years = useMemo(() => createYearOptions(100), []);
  const defaultYearIndex = useMemo(() => {
    const index = years.indexOf(String(DEFAULT_BIRTH_YEAR));
    return index >= 0 ? index : 0;
  }, [years]);

  const [monthIndex, setMonthIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(defaultYearIndex);
  const [dayIndex, setDayIndex] = useState(0);
  // const [showDetails, setShowDetails] = useState(false);

  const selectedYear = Number.parseInt(years[yearIndex], 10);
  const days = useMemo(
    () => createDayOptions(monthIndex, selectedYear),
    [monthIndex, selectedYear],
  );
  const safeDayIndex = Math.min(dayIndex, Math.max(0, days.length - 1));
  const selectedDay = Number.parseInt(days[safeDayIndex], 10);
  const selectedDate = useMemo(
    () => new Date(selectedYear, monthIndex, selectedDay),
    [monthIndex, selectedDay, selectedYear],
  );
  const [debouncedBirthDate, setDebouncedBirthDate] = useState({
    day: selectedDay,
    month: monthIndex + 1,
    year: selectedYear,
  });

  useEffect(() => {
    if (dayIndex > days.length - 1) {
      setDayIndex(days.length - 1);
    }
  }, [dayIndex, days.length]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("metasense-theme", theme);
  }, [theme]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedBirthDate({
        day: selectedDay,
        month: monthIndex + 1,
        year: selectedYear,
      });
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [monthIndex, selectedDay, selectedYear]);

  // const matrixData = useMemo(() => {
  //   return calculateDestinyMatrix({
  //     day: selectedDay,
  //     month: monthIndex + 1,
  //     year: selectedYear,
  //   });
  // }, [monthIndex, selectedDay, selectedYear]);

  const modelTable = useMemo(
    () =>
      buildMatrixModelTable({
        day: debouncedBirthDate.day,
        month: debouncedBirthDate.month,
        year: debouncedBirthDate.year,
      }),
    [debouncedBirthDate.day, debouncedBirthDate.month, debouncedBirthDate.year],
  );

  const liquidPalette = useMemo<LiquidPalette>(() => {
    const energyWeights = new Map<number, number>();

    modelTable.rows.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (colIndex >= 3 || rowIndex === 0) return;

        const parsed = parseMatrixCell(rowIndex, colIndex, value);
        if (!parsed.energy || parsed.energy < 1 || parsed.energy > 12) return;

        const totalCount = parsed.mainCount + parsed.bracketCount;
        if (totalCount <= 0) return;

        const norm = ENERGY_NORM_COUNT[parsed.energy] ?? 1;
        const normalizedWeight = totalCount / Math.max(norm, 1);
        energyWeights.set(parsed.energy, normalizedWeight);
      });
    });

    const ranked = [...energyWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const getPlanetColorByEnergy = (energy: number): string => {
      const profile = ENERGY_PROFILES[energy];
      return profile
        ? (PLANET_COLOR_BY_NAME[profile.planet] ?? "#60a5fa")
        : "#60a5fa";
    };

    const base: LiquidPalette = {
      deep: "#04050b",
      mid: "#134d93",
      highlight: "#8cecff",
      intensity: 1,
    };

    if (ranked.length === 0) return base;

    const c1 = getPlanetColorByEnergy(ranked[0][0]);
    const c2 = getPlanetColorByEnergy(ranked[1]?.[0] ?? ranked[0][0]);
    const c3 = getPlanetColorByEnergy(ranked[2]?.[0] ?? ranked[0][0]);
    const maxWeight = ranked[0]?.[1] ?? 1;
    const intensity = Math.max(0.7, Math.min(1.35, 0.72 + maxWeight * 0.2));

    return {
      deep: mixHex("#02030a", c1, 0.38),
      mid: mixHex("#0a1f4d", c2, 0.58),
      highlight: mixHex("#7dd3fc", c3, 0.66),
      intensity,
    };
  }, [modelTable.rows]);

  const handleDateSelect = (date: Date) => {
    const nextYearIndex = years.indexOf(String(date.getFullYear()));
    if (nextYearIndex >= 0) {
      setYearIndex(nextYearIndex);
    }

    setMonthIndex(date.getMonth());

    const nextDays = createDayOptions(date.getMonth(), date.getFullYear());
    const dayStr = String(date.getDate()).padStart(2, "0");
    const nextDayIndex = nextDays.indexOf(dayStr);
    setDayIndex(nextDayIndex >= 0 ? nextDayIndex : 0);
  };

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-2 sm:py-6 ${
        theme === "dark" ? "text-white" : "text-slate-900"
      }`}
    >
      <Particles palette={liquidPalette} />

      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="fixed top-3 right-3 z-[100]">
          <button
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow-md backdrop-blur transition hover:scale-105 ${
              theme === "dark"
                ? "border-white/30 bg-black/40"
                : "border-slate-300 bg-white/80"
            }`}
            aria-label="Перемкнути тему"
            title={
              theme === "dark"
                ? "Увімкнути світлу тему"
                : "Увімкнути темну тему"
            }
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <h1
          className={`mb-3 bg-clip-text text-center text-2xl font-semibold tracking-tight text-transparent sm:text-3xl ${
            theme === "dark"
              ? "bg-linear-to-b from-white to-white/75"
              : "bg-linear-to-b from-slate-900 to-slate-600"
          }`}
        >
          <span className="font-bold text-indigo-400">MetaSense</span> - Твоє
          призначення
        </h1>

        <div className="w-full backdrop-blur-[1px]">
          <div className="mb-4 w-full flex flex-col items-center justify-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="text-indigo-300">✧</span>
              <span
                className={`text-xs font-medium tracking-widest uppercase ${
                  theme === "dark" ? "text-indigo-200/80" : "text-indigo-700/85"
                }`}
              >
                Універсальна Матриця
              </span>
            </div>

            {/* <div className="max-w-3xl w-full">
              <MatrixDiagram matrix={matrixData} />
            </div> */}

            <div
              className={`max-w-sm w-full flex justify-center items-center backdrop-blur-sm rounded-2xl ${theme === "dark" ? "bg-black/50" : "bg-white/50"}`}
            >
              <BirthDatePicker
                months={MONTHS_UA}
                days={days}
                years={years}
                monthIndex={monthIndex}
                dayIndex={dayIndex}
                yearIndex={yearIndex}
                onMonthChange={setMonthIndex}
                onDayChange={setDayIndex}
                onYearChange={setYearIndex}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                theme={theme}
              />
            </div>
            <div
              className={`mt-2 mb-2 flex w-full max-w-3xl flex-row items-center justify-center gap-4 px-4 text-center text-lg font-semibold tracking-wide sm:text-2xl backdrop-blur-md bg-white/30 rounded-2xl ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              <span
                className={`text-xs ${theme === "dark" ? "text-indigo-300" : "text-indigo-700"}`}
              >
                {modelTable.calcLine.day}.{modelTable.calcLine.month}.
                {modelTable.calcLine.year}
              </span>
              <span>
                {modelTable.calcLine.calc1} {modelTable.calcLine.calc2}{" "}
                {modelTable.calcLine.calc3} {modelTable.calcLine.calc4}{" "}
              </span>{" "}
              ({modelTable.calcLine.calc5}
              {modelTable.calcLine.calc6})
            </div>
            <div className="max-w-3xl w-full flex justify-center items-center  relative z-50">
              <MatrixSummaryTable rows={modelTable.rows} theme={theme} cellOpacity={50} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
