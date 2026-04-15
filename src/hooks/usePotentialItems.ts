import { useMemo } from "react";
import {
  ENERGY_NORM_COUNT,
  ENERGY_PROFILES,
  getNormStatus,
  type NormStatus,
} from "../data/energyNorms";
import {
  parseMatrixCell,
  type MatrixModelTable,
  MATRIX_ROW_LABELS,
} from "../utils/modelTable";

export type PotentialItem = {
  key: string;
  rowIndex: number;
  colIndex: number;
  sectionTitle: string;
  title: string;
  value: string;
  total: number;
  norm: number | null;
  status: NormStatus;
  summary: string;
  workOn: string;
  profileName: string;
  isImageColumn: boolean;
};

function getEnergyByCellPosition(rowIndex: number, colIndex: number): number | null {
  if (colIndex === 3) return null;
  if (rowIndex < 1 || rowIndex > 4) return null;
  return (rowIndex - 1) * 3 + colIndex + 1;
}

function statusLabel(status: NormStatus): string {
  if (status === "normal") return "Норма";
  if (status === "above") return "Вище норми";
  if (status === "below") return "Нижче норми";
  return "Немає числа";
}

export function usePotentialItems(modelTable: MatrixModelTable): PotentialItem[] {
  return useMemo<PotentialItem[]>(() => {
    const result: PotentialItem[] = [];

    modelTable.rows.forEach((row, rowIndex) => {
      row.forEach((rawValue, colIndex) => {
        // Potential tab includes only highlighted matrix core:
        // rows 1..4 (without top calculated row) and columns 0..2 (without image column).
        if (rowIndex === 0) return;
        if (colIndex === 3) return;

        const parsed = parseMatrixCell(rowIndex, colIndex, rawValue);
        const mappedEnergy = getEnergyByCellPosition(rowIndex, colIndex);
        const effectiveEnergy = parsed.energy ?? mappedEnergy;
        const isImageColumn = colIndex === 3;
        const total = parsed.mainCount + parsed.bracketCount;

        if (effectiveEnergy === null) {
          const genericStatus: NormStatus = total > 0 ? "normal" : "absent";
          result.push({
            key: `${rowIndex}-${colIndex}`,
            rowIndex,
            colIndex,
            sectionTitle: MATRIX_ROW_LABELS[rowIndex] ?? `Ряд ${rowIndex + 1}`,
            title: `${parsed.rowLabel} • ${parsed.columnLabel}`,
            value: parsed.rawValue,
            total,
            norm: null,
            status: genericStatus,
            summary:
              total > 0
                ? "Резонанс рядка присутній: це сигнал, як вас сприймають у цій темі через сумарну хвилю енергій."
                : "Резонанс у цій зоні ще не проявлений явно.",
            workOn:
              total > 0
                ? "Утримуйте ясність комунікації: проговорюйте намір, очікування і фінальний результат."
                : "Що бракує: явної проявленості позиції. Як пропрацювати: формулюйте позицію коротко і конкретно, узгоджуйте очікування з людьми.",
            profileName: "Резонанс рядка",
            isImageColumn,
          });
          return;
        }

        const norm = ENERGY_NORM_COUNT[effectiveEnergy] ?? 1;
        const status = getNormStatus(total, norm);
        const profile = ENERGY_PROFILES[effectiveEnergy];

        if (!profile) {
          result.push({
            key: `${rowIndex}-${colIndex}`,
            rowIndex,
            colIndex,
            sectionTitle: MATRIX_ROW_LABELS[rowIndex] ?? `Ряд ${rowIndex + 1}`,
            title: `${parsed.rowLabel} • ${parsed.columnLabel}`,
            value: parsed.rawValue,
            total,
            norm,
            status,
            summary:
              total > 0
                ? "Базовий розрахунковий показник проявлений: це опорний стан по цій комірці."
                : "Показник не проявлений явно на поточному рівні.",
            workOn:
              status === "below" || status === "absent"
                ? "Що бракує: стабільного прояву базового ресурсу. Як пропрацювати: короткі регулярні дії в цій темі та контроль динаміки щотижня."
                : status === "above"
                  ? "Баланс: не перевантажувати цю сферу, тримати ритм і екологічний темп."
                  : "Підтримуйте поточний баланс, закріплюючи результат практикою.",
            profileName: `Базовий показник • ${statusLabel(status)}`,
            isImageColumn,
          });
          return;
        }

        const summary =
          status === "normal"
            ? profile.base
            : status === "above"
              ? profile.above
              : status === "below"
                ? profile.below
                : `Число ${effectiveEnergy} у цій комірці не проявлене: потенціал є, але без автоматичного включення.`;

        const workOn = isImageColumn
          ? (profile.imageClarity ??
            (status === "below" || status === "absent"
              ? "Що бракує: прозорості намірів для оточення. Як пропрацювати: чітко проговорюйте мотив і очікуваний результат."
              : status === "above"
                ? "Баланс: зменшити тиск прояву, говорити простіше і перевіряти, як вас зрозуміли."
                : "Підтримуйте стиль прояву через конкретні дії та стабільний результат."))
          : status === "below" || status === "absent"
            ? (profile.practiceBelow ??
              `Що бракує: стабільного прояву енергії ${effectiveEnergy}. Як пропрацювати: регулярні малі дії в темі цієї комірки (${parsed.rowLabel}).`)
            : status === "above"
              ? (profile.balanceAbove ??
                "Баланс: менше надконтролю, більше екологічного використання сили цієї енергії.")
              : "Підтримуйте поточний баланс і регулярну реалізацію цієї якості в діях.";

        result.push({
          key: `${rowIndex}-${colIndex}`,
          rowIndex,
          colIndex,
          sectionTitle: MATRIX_ROW_LABELS[rowIndex] ?? `Ряд ${rowIndex + 1}`,
          title: `${parsed.rowLabel} • ${parsed.columnLabel}`,
          value: parsed.rawValue,
          total,
          norm,
          status,
          summary,
          workOn,
          profileName: `${profile.name} • ${statusLabel(status)}`,
          isImageColumn,
        });
      });
    });

    return result;
  }, [modelTable.rows]);
}
