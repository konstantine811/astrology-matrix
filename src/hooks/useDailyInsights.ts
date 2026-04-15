import { useMemo } from "react";
import { ENERGY_NORM_COUNT, ENERGY_PROFILES, getNormStatus } from "../data/energyNorms";
import { PLANET_COLORS_BY_NAME } from "../theme/planetColors";
import { buildMatrixModelTable, parseMatrixCell, type MatrixModelTable } from "../utils/modelTable";

export type DailyEnergyInsight = {
  energy: number;
  name: string;
  planet: string;
  color: string;
  todayValue: string;
  birthValue: string;
  todayTotal: number;
  birthTotal: number;
  norm: number;
  todayStatus: "below" | "normal" | "above" | "absent";
  score: number;
  guidance: string;
};

export type DailyInsightsResult = {
  all: DailyEnergyInsight[];
  topFocus: DailyEnergyInsight[];
  caution: DailyEnergyInsight[];
  dayMode: string;
  restHint: string;
  bestTime: string;
  avoidToday: string;
  actionPlan: string[];
  totalAbove: number;
  todayLabel: string;
};

function hasStatus(
  items: DailyEnergyInsight[],
  energy: number,
  status: "below" | "normal" | "above" | "absent",
) {
  return items.some((item) => item.energy === energy && item.todayStatus === status);
}

export function useDailyInsights(modelTable: MatrixModelTable, todayDate: Date): DailyInsightsResult {
  const todayModelTable = useMemo(
    () =>
      buildMatrixModelTable({
        day: todayDate.getDate(),
        month: todayDate.getMonth() + 1,
        year: todayDate.getFullYear(),
      }),
    [todayDate],
  );

  return useMemo(() => {
    const layout = [
      { energy: 1, row: 1, col: 0 },
      { energy: 2, row: 1, col: 1 },
      { energy: 3, row: 1, col: 2 },
      { energy: 4, row: 2, col: 0 },
      { energy: 5, row: 2, col: 1 },
      { energy: 6, row: 2, col: 2 },
      { energy: 7, row: 3, col: 0 },
      { energy: 8, row: 3, col: 1 },
      { energy: 9, row: 3, col: 2 },
      { energy: 10, row: 4, col: 0 },
      { energy: 11, row: 4, col: 1 },
      { energy: 12, row: 4, col: 2 },
    ] as const;

    const insights: DailyEnergyInsight[] = layout.map((item) => {
      const profile = ENERGY_PROFILES[item.energy];
      const todayRaw = todayModelTable.rows[item.row]?.[item.col] ?? "-";
      const birthRaw = modelTable.rows[item.row]?.[item.col] ?? "-";
      const todayParsed = parseMatrixCell(item.row, item.col, todayRaw);
      const birthParsed = parseMatrixCell(item.row, item.col, birthRaw);
      const todayTotal = todayParsed.mainCount + todayParsed.bracketCount;
      const birthTotal = birthParsed.mainCount + birthParsed.bracketCount;
      const norm = ENERGY_NORM_COUNT[item.energy] ?? 1;
      const todayStatus = getNormStatus(todayTotal, norm);

      const todayRatio = todayTotal / norm;
      const birthRatio = birthTotal / norm;
      const overlapBonus =
        todayTotal > 0 && birthTotal > 0
          ? Math.min(0.45, Math.min(todayRatio, birthRatio) * 0.25)
          : 0;
      const score = todayRatio * 0.65 + birthRatio * 0.35 + overlapBonus;

      const guidance =
        todayStatus === "above"
          ? profile.balanceAbove || profile.above
          : todayStatus === "below" || todayStatus === "absent"
            ? profile.practiceBelow || profile.below
            : profile.base;

      return {
        energy: item.energy,
        name: profile.name,
        planet: profile.planet,
        color: PLANET_COLORS_BY_NAME[profile.planet] ?? "#60a5fa",
        todayValue: todayParsed.rawValue,
        birthValue: birthParsed.rawValue,
        todayTotal,
        birthTotal,
        norm,
        todayStatus,
        score,
        guidance,
      };
    });

    const topFocus = [...insights]
      .filter((item) => item.todayTotal > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const caution = [...insights]
      .filter((item) => item.todayStatus === "below" || item.todayStatus === "absent")
      .sort((a, b) => b.birthTotal - a.birthTotal)
      .slice(0, 3);

    const totalAbove = insights.reduce(
      (acc, item) => acc + Math.max(0, item.todayTotal - item.norm),
      0,
    );
    const actionLoad =
      (insights.find((item) => item.energy === 3)?.todayTotal ?? 0) +
      (insights.find((item) => item.energy === 8)?.todayTotal ?? 0) +
      (insights.find((item) => item.energy === 10)?.todayTotal ?? 0);
    const emotionalLoad =
      (insights.find((item) => item.energy === 2)?.todayTotal ?? 0) +
      (insights.find((item) => item.energy === 6)?.todayTotal ?? 0) +
      (insights.find((item) => item.energy === 9)?.todayTotal ?? 0);

    const dayMode =
      totalAbove >= 4
        ? "Інтенсивний день: плануйте ритм 50/10 або 90/15, щоб не перегоріти."
        : totalAbove >= 2
          ? "Робочий збалансований день: тримайте 2–3 ключові задачі у фокусі."
          : "М'який день: краще працювати короткими сесіями з паузами на відновлення.";

    const restHint =
      emotionalLoad > actionLoad
        ? "Емоційний фон вищий за дійовий: додайте тишу, прогулянку, менше інформаційного шуму."
        : "Енергії дії більше: використайте першу половину дня для складних задач, ввечері знизьте темп.";

    const bestTime =
      actionLoad >= emotionalLoad + 1
        ? "08:30–12:00 — найкраще вікно для складних задач, переговорів і рішень."
        : emotionalLoad >= actionLoad + 1
          ? "11:00–16:00 — найкраще вікно для комунікації, узгоджень і творчих задач."
          : "09:30–12:30 та 15:00–17:30 — рівний робочий ритм без перевантаження.";


    const avoidToday = (() => {
      if (hasStatus(insights, 3, "above")) {
        return "Не поспішайте з реакціями: уникати конфліктних рішень «з ходу» та тиску на інших.";
      }
      if (hasStatus(insights, 2, "above")) {
        return "Не перевантажуйте себе спілкуванням: уникати емоційних гойдалок і імпульсивних обіцянок.";
      }
      if (hasStatus(insights, 8, "above")) {
        return "Не застрягайте в перфекціонізмі: уникати надконтролю та затягування через «ідеально».";
      }
      return "Уникати багатозадачності без пріоритетів: спершу 1 головна справа, потім решта.";
    })();

    const focusA = topFocus[0];
    const focusB = topFocus[1];
    const cautionA = caution[0];

    const actionPlan = [
      focusA
        ? `Крок 1: Зранку закрити 1 ключову задачу по темі ${focusA.energy} (${focusA.name}).`
        : "Крок 1: Зранку визначити 1 головний результат дня і закрити його до обіду.",
      focusB
        ? `Крок 2: У середині дня дати 60-90 хв фокусу на тему ${focusB.energy} (${focusB.name}) без відволікань.`
        : "Крок 2: У середині дня виділити 60-90 хв на найважливішу задачу без відволікань.",
      cautionA
        ? `Крок 3: Ввечері зробити коротку компенсацію по темі ${cautionA.energy} (${cautionA.name}): 1 маленька дія на баланс.`
        : "Крок 3: Ввечері зробити короткий підсумок дня і 1 дію на відновлення ресурсу.",
    ];

    return {
      all: insights,
      topFocus,
      caution,
      dayMode,
      restHint,
      bestTime,
      avoidToday,
      actionPlan,
      totalAbove,
      todayLabel: `${String(todayDate.getDate()).padStart(2, "0")}.${String(
        todayDate.getMonth() + 1,
      ).padStart(2, "0")}.${todayDate.getFullYear()}`,
    };
  }, [modelTable.rows, todayDate, todayModelTable.rows]);
}
