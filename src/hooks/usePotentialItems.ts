import { useMemo } from "react";
import { ENERGY_NORM_COUNT, ENERGY_PROFILES, getNormStatus } from "../data/energyNorms";
import { parseMatrixCell, type MatrixModelTable } from "../utils/modelTable";

export type PotentialItem = {
  energy: number;
  title: string;
  sectionTitle: string;
  value: string;
  total: number;
  norm: number;
  status: "below" | "normal" | "above" | "absent";
  summary: string;
};

export function usePotentialItems(modelTable: MatrixModelTable): PotentialItem[] {
  return useMemo<PotentialItem[]>(() => {
    const layout = [
      { energy: 1, row: 1, col: 0, title: "Потенціал 1", sectionTitle: "Строка 1" },
      { energy: 2, row: 1, col: 1, title: "Потенціал 2", sectionTitle: "Строка 1" },
      { energy: 3, row: 1, col: 2, title: "Потенціал 3", sectionTitle: "Строка 1" },
      { energy: 4, row: 2, col: 0, title: "Потенціал 4", sectionTitle: "Строка 2" },
      { energy: 5, row: 2, col: 1, title: "Потенціал 5", sectionTitle: "Строка 2" },
      { energy: 6, row: 2, col: 2, title: "Потенціал 6", sectionTitle: "Строка 2" },
    ] as const;

    return layout.map((item) => {
      const raw = modelTable.rows[item.row]?.[item.col] ?? "-";
      const parsed = parseMatrixCell(item.row, item.col, raw);
      const total = parsed.mainCount + parsed.bracketCount;
      const norm = ENERGY_NORM_COUNT[item.energy] ?? 1;
      const status = total > 0 ? getNormStatus(total, norm) : "absent";
      const profile = ENERGY_PROFILES[item.energy];

      const summary =
        status === "normal"
          ? profile.base
          : status === "above"
            ? profile.above
            : status === "below"
              ? profile.below
              : "Число не проявлене явно: потенціал розкривається через практику в цій темі.";

      return {
        energy: item.energy,
        title: item.title,
        sectionTitle: item.sectionTitle,
        value: parsed.rawValue,
        total,
        norm,
        status,
        summary,
      };
    });
  }, [modelTable.rows]);
}
