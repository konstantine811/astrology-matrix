import { useEffect, useMemo, useRef, useState } from "react";
import { Particles } from "./components/background/Particles";
import { BirthDatePicker } from "./components/date-picker/BirthDatePicker";
// import { MatrixDiagram } from "./components/matrix/MatrixDiagram";
import { MatrixSummaryTable } from "./components/matrix/MatrixSummaryTable";
import { MainTabs, type MainTabKey } from "./components/dashboard/MainTabs";
import { PotentialTabContent } from "./components/dashboard/PotentialTabContent";
import { TodayTabContent } from "./components/dashboard/TodayTabContent";
import { DevelopmentFooter } from "./components/dashboard/DevelopmentFooter";
import {
  PlanetLegendBar,
  type PlanetLegendItem,
} from "./components/dashboard/PlanetLegendBar";
import {
  applyUIThemeCssVars,
  getUITheme,
  type ThemeMode,
} from "./theme/uiTheme";
import {
  PLANET_COLORS_BY_NAME,
  PLANET_SYMBOLS_BY_NAME,
} from "./theme/planetColors";
import {
  DEFAULT_BIRTH_YEAR,
  MONTHS_UA,
  createDayOptions,
  createYearOptions,
} from "./constants/date";
import {
  ENERGY_NORM_COUNT,
  ENERGY_PROFILES,
} from "./data/energyNorms";
import { buildMatrixModelTable, parseMatrixCell } from "./utils/modelTable";
import { usePotentialItems } from "./hooks/usePotentialItems";
import { useDailyInsights } from "./hooks/useDailyInsights";
// import { calculateDestinyMatrix } from "./utils/matrix";

type FxProfileMode = "soft" | "balanced" | "intense";
type FlowDirection = "horizontal" | "diagonal" | "vertical" | "turbulence";
type EnergyLayerFx = {
  id: string;
  energy: number;
  planet: string | null;
  color: string;
  weight: number;
  bracketWeight: number;
  aboveWeight: number;
  direction: FlowDirection;
  rowIndex: number;
  count: number;
  bracketCount: number;
  norm: number;
};
type BackgroundFxModel = {
  layers: EnergyLayerFx[];
  dominantColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  speedPulse: number;
  grain: number;
  contrast: number;
  texture: number;
  resonanceGlow: number;
  profile: FxProfileMode;
  normalizationFactor: number;
  totalAbove: number;
  bracketField: number;
};

const PROFILE_MULTIPLIERS: Record<FxProfileMode, number> = {
  soft: 0.78,
  balanced: 1,
  intense: 1.3,
};
const MATRIX_CELL_OPACITY = 0.5;
const BIRTH_DATE_STORAGE_KEY = "metasense-birth-date";

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

  const initialBirthSelection = useMemo(() => {
    const fallback = {
      monthIndex: 0,
      yearIndex: defaultYearIndex,
      dayIndex: 0,
    };

    if (typeof window === "undefined") return fallback;

    try {
      const raw = window.localStorage.getItem(BIRTH_DATE_STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as {
        day?: number;
        month?: number;
        year?: number;
      };
      if (!parsed.day || !parsed.month || !parsed.year) return fallback;
      if (parsed.month < 1 || parsed.month > 12) return fallback;

      const monthIndexFromStorage = parsed.month - 1;
      const yearIndexFromStorage = years.indexOf(String(parsed.year));
      if (yearIndexFromStorage < 0) return fallback;

      const dayOptions = createDayOptions(monthIndexFromStorage, parsed.year);
      const normalizedDay = String(parsed.day).padStart(2, "0");
      const dayIndexFromStorage = dayOptions.indexOf(normalizedDay);
      if (dayIndexFromStorage < 0) return fallback;

      return {
        monthIndex: monthIndexFromStorage,
        yearIndex: yearIndexFromStorage,
        dayIndex: dayIndexFromStorage,
      };
    } catch {
      return fallback;
    }
  }, [defaultYearIndex, years]);

  const [monthIndex, setMonthIndex] = useState(initialBirthSelection.monthIndex);
  const [yearIndex, setYearIndex] = useState(initialBirthSelection.yearIndex);
  const [dayIndex, setDayIndex] = useState(initialBirthSelection.dayIndex);
  const [activeMainTab, setActiveMainTab] = useState<MainTabKey>("matrix");
  const fxProfile: FxProfileMode = "balanced";
  const [fxBurstToken, setFxBurstToken] = useState(0);
  const isFirstDatePersistRender = useRef(true);
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
  const ui = useMemo(() => getUITheme(theme, MATRIX_CELL_OPACITY), [theme]);
  const todayDate = useMemo(() => new Date(), []);

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
    applyUIThemeCssVars(ui);
  }, [ui]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isFirstDatePersistRender.current) {
      isFirstDatePersistRender.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(
        BIRTH_DATE_STORAGE_KEY,
        JSON.stringify({
          day: selectedDay,
          month: monthIndex + 1,
          year: selectedYear,
        }),
      );
    }, 10000);

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

  const backgroundFx = useMemo<BackgroundFxModel>(() => {
    const layers: EnergyLayerFx[] = [];
    const profileMultiplier = PROFILE_MULTIPLIERS[fxProfile];
    const rowFlow: Record<number, FlowDirection> = {
      1: "horizontal",
      2: "diagonal",
      3: "vertical",
      4: "turbulence",
    };

    let totalAbove = 0;
    let totalBracket = 0;
    const rowResonance: number[] = [];

    modelTable.rows.forEach((row, rowIndex) => {
      row.forEach((rawValue, colIndex) => {
        const parsed = parseMatrixCell(rowIndex, colIndex, rawValue);
        if (colIndex === 3 && rowIndex > 0) {
          const total = parsed.mainCount + parsed.bracketCount;
          const normForSigma = parsed.energy
            ? (ENERGY_NORM_COUNT[parsed.energy] ?? 1)
            : 1;
          rowResonance.push(total / normForSigma);
          return;
        }

        if (colIndex >= 3 || rowIndex === 0) return;
        if (!parsed.energy || parsed.energy < 1 || parsed.energy > 12) return;

        const norm = ENERGY_NORM_COUNT[parsed.energy] ?? 1;
        const count = parsed.mainCount;
        const bracketCount = parsed.bracketCount;
        const total = count + bracketCount;
        if (total <= 0) return;

        const baseWeight = total / norm;
        const bracketWeight = bracketCount / norm;
        const aboveWeight = Math.max(0, total - norm) / norm;
        const profile = ENERGY_PROFILES[parsed.energy];
        const color = profile
          ? (PLANET_COLORS_BY_NAME[profile.planet] ?? "#60a5fa")
          : "#60a5fa";

        totalAbove += aboveWeight;
        totalBracket += bracketWeight;

        layers.push({
          id: `${rowIndex}-${colIndex}-${parsed.energy}`,
          energy: parsed.energy,
          planet: profile?.planet ?? null,
          color,
          weight: baseWeight,
          bracketWeight,
          aboveWeight,
          direction: rowFlow[rowIndex] ?? "horizontal",
          rowIndex,
          count,
          bracketCount,
          norm,
        });
      });
    });

    const sortedByWeight = [...layers].sort((a, b) => b.weight - a.weight);
    const dominantColor = sortedByWeight[0]?.color ?? "#60a5fa";
    const secondaryColor = sortedByWeight[1]?.color ?? dominantColor;
    const tertiaryColor = sortedByWeight[2]?.color ?? secondaryColor;

    const maxWeight = sortedByWeight[0]?.weight ?? 1;
    const normalizationFactor = 1 / Math.max(1, Math.pow(maxWeight, 0.65));

    const normalizedLayers = layers.map((layer) => ({
      ...layer,
      weight: Math.min(
        1.6,
        Math.tanh(layer.weight * normalizationFactor) * profileMultiplier,
      ),
      bracketWeight: Math.min(
        1.1,
        Math.tanh(layer.bracketWeight * normalizationFactor) *
          profileMultiplier,
      ),
      aboveWeight: Math.min(
        1.2,
        Math.tanh(layer.aboveWeight * normalizationFactor) * profileMultiplier,
      ),
    }));

    const weights = normalizedLayers.map((layer) => layer.weight);
    const avg =
      weights.length > 0
        ? weights.reduce((acc, value) => acc + value, 0) / weights.length
        : 0;
    const variance =
      weights.length > 0
        ? weights.reduce((acc, value) => acc + (value - avg) ** 2, 0) /
          weights.length
        : 0;
    const texture = Math.min(
      1.4,
      Math.sqrt(variance) * 2.6 + totalAbove * 0.08,
    );
    const resonanceGlow = Math.min(
      1.6,
      (rowResonance.reduce((acc, value) => acc + value, 0) /
        Math.max(1, rowResonance.length)) *
        0.9,
    );

    const speedPulse =
      Math.min(2.2, 0.8 + totalAbove * 0.32) * profileMultiplier;
    const grain = Math.min(0.2, 0.025 + texture * 0.05);
    const contrast = Math.min(1.5, 1.02 + texture * 0.2);

    return {
      layers: normalizedLayers,
      dominantColor,
      secondaryColor,
      tertiaryColor,
      speedPulse,
      grain,
      contrast,
      texture,
      resonanceGlow,
      profile: fxProfile,
      normalizationFactor,
      totalAbove,
      bracketField: totalBracket,
    };
  }, [fxProfile, modelTable.rows]);

  const planetLegend = useMemo<PlanetLegendItem[]>(() => {
    const byPlanet = new Map<
      string,
      { color: string; weight: number; total: number; norm: number }
    >();

    backgroundFx.layers.forEach((layer) => {
      if (!layer.planet) return;
      const current = byPlanet.get(layer.planet) ?? {
        color: PLANET_COLORS_BY_NAME[layer.planet] ?? layer.color,
        weight: 0,
        total: 0,
        norm: 0,
      };
      current.weight += layer.weight;
      current.total += layer.count + layer.bracketCount;
      current.norm += layer.norm;
      byPlanet.set(layer.planet, current);
    });

    const totalWeight = Math.max(
      0.0001,
      Array.from(byPlanet.values()).reduce((acc, item) => acc + item.weight, 0),
    );

    return Array.from(byPlanet.entries())
      .map(([planet, item]) => ({
        planet,
        symbol: PLANET_SYMBOLS_BY_NAME[planet] ?? "✶",
        color: item.color,
        weight: item.weight,
        share: (item.weight / totalWeight) * 100,
        total: item.total,
        norm: item.norm,
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [backgroundFx.layers]);

  const potentialItems = usePotentialItems(modelTable);
  const dailyInsights = useDailyInsights(modelTable, todayDate);

  useEffect(() => {
    setFxBurstToken((value) => value + 1);
  }, [
    modelTable.calcLine.day,
    modelTable.calcLine.month,
    modelTable.calcLine.year,
    modelTable.calcLine.calc1,
    modelTable.calcLine.calc2,
    modelTable.calcLine.calc3,
    modelTable.calcLine.calc4,
    modelTable.calcLine.calc5,
    modelTable.calcLine.calc6,
  ]);

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-2 pb-24 sm:py-6 sm:pb-28">
      <Particles fx={backgroundFx} burstToken={fxBurstToken} />

      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="fixed top-3 right-3 z-[100] flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow-md backdrop-blur transition hover:scale-105"
            style={{
              borderColor: ui.border,
              background: ui.overlayButton,
              color: ui.text,
              boxShadow: ui.shadowSoft,
            }}
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

        <h1 className="mb-3 bg-clip-text text-center text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
          <span
            style={{
              backgroundImage: `linear-gradient(to bottom, ${ui.headingFrom}, ${ui.headingTo})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            <span className="font-bold text-indigo-400">MetaSense</span> - Твоє
            призначення
          </span>
        </h1>

        <div className="w-full">
          <div className="mb-4 w-full flex flex-col items-center justify-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="text-indigo-300">✧</span>
              <span className="text-xs font-medium tracking-widest uppercase text-[var(--ui-accent)]">
                Універсальна Матриця
              </span>
            </div>

            {/* <div className="max-w-3xl w-full">
              <MatrixDiagram matrix={matrixData} />
            </div> */}

            <div
              className="max-w-sm w-full flex justify-center items-center rounded-2xl backdrop-blur-md"
              style={{
                background: ui.surfaceSoft,
                border: `1px solid ${ui.border}`,
                boxShadow: ui.shadowSoft,
              }}
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
              className="mt-2 mb-2 flex flex-row items-center justify-center gap-4 rounded-2xl px-4 text-center text-lg font-semibold tracking-wide backdrop-blur-md sm:text-2xl"
              style={{
                color: ui.text,
                background: ui.surfaceSoft,
                border: `1px solid ${ui.border}`,
                boxShadow: ui.shadowSoft,
              }}
            >
              <span className="text-xs text-[var(--ui-accent)]">
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
            <PlanetLegendBar ui={ui} items={planetLegend} />
            <MainTabs
              ui={ui}
              activeTab={activeMainTab}
              onChange={setActiveMainTab}
            />
            <div className="max-w-3xl w-full flex justify-center items-center relative z-50">
              {activeMainTab === "matrix" && (
                <MatrixSummaryTable
                  rows={modelTable.rows}
                  theme={theme}
                  cellOpacity={MATRIX_CELL_OPACITY * 100}
                />
              )}
              {activeMainTab === "potential" && (
                <PotentialTabContent ui={ui} items={potentialItems} />
              )}
              {activeMainTab === "today" && (
                <TodayTabContent ui={ui} dailyInsights={dailyInsights} />
              )}
            </div>
            <DevelopmentFooter />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
