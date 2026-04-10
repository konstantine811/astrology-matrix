import { MATRIX_INTERPRETATIONS } from "../../data/matrixInterpretations";
import type { MatrixData } from "../../types/matrix";
import type { MatrixModelTableRow } from "../../utils/modelTable";

type MatrixCellDetailsProps = {
  matrix: MatrixData;
  rows: MatrixModelTableRow[];
};

function cellLabel(rowIndex: number, colIndex: number): string {
  const col = ["I", "II", "III", "IV"][colIndex] ?? `${colIndex + 1}`;
  return `Ряд ${rowIndex + 1}, Стовпець ${col}`;
}

export function MatrixCellDetails({ matrix, rows }: MatrixCellDetailsProps) {
  const describe = (value: number) => MATRIX_INTERPRETATIONS[value];

  // const coreEntries: Array<{ key: string; value: number; formula: string }> = [
  //   { key: "A", value: matrix.A, formula: "Ліва точка (день)" },
  //   { key: "B", value: matrix.B, formula: "Верхня точка (місяць)" },
  //   { key: "C", value: matrix.C, formula: "Права точка (рік)" },
  //   { key: "D", value: matrix.D, formula: "Нижня точка (A+B+C)" },
  //   { key: "E", value: matrix.E, formula: "Центр (A+B+C+D)" },
  //   { key: "TL", value: matrix.TL, formula: "Верх-ліво (A+B)" },
  //   { key: "TR", value: matrix.TR, formula: "Верх-право (B+C)" },
  //   { key: "BL", value: matrix.BL, formula: "Низ-ліво (A+D)" },
  //   { key: "BR", value: matrix.BR, formula: "Низ-право (C+D)" },
  //   { key: "P1", value: matrix.personalPurpose, formula: "Особисте" },
  //   { key: "P2", value: matrix.socialPurpose, formula: "Соціальне" },
  //   { key: "P3", value: matrix.spiritualPurpose, formula: "Духовне" },
  // ];

  return (
    <div className="mt-3 w-full rounded-2xl border border-white/10 bg-white/4 p-3 sm:p-4">
      {/* <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/90 uppercase">
        Актуальні Дані Матриці
      </h2>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {coreEntries.map((entry) => (
          <div
            key={entry.key}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
          >
            <p className="text-[11px] text-white/50">{entry.formula}</p>
            <p className="text-base font-bold text-cyan-100">
              {entry.key}: {entry.value}
            </p>
            <p className="mt-1 text-xs font-medium text-white/85">
              {describe(entry.value)?.title ?? `Енергія ${entry.value}`}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              {describe(entry.value)?.summary ??
                "Опис для цього значення поки не додано."}
            </p>
          </div>
        ))}
      </div> */}

      <h3 className="mb-2 text-xs font-semibold tracking-wider text-white/70 uppercase">
        Комірки Таблиці 4×5
      </h3>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {rows.flatMap((row, rowIndex) =>
          row.map((cellValue, colIndex) => {
            const bracketMatch = cellValue.match(/\((\d+)\)\s*$/);
            const directNumberMatch = cellValue.match(/^(\d{1,2})$/);
            const repeatedDigitMatch = cellValue.match(/^(\d)\1+$/);
            const energy = bracketMatch
              ? Number.parseInt(bracketMatch[1], 10)
              : directNumberMatch
                ? Number.parseInt(directNumberMatch[1], 10)
                : repeatedDigitMatch
                  ? Number.parseInt(repeatedDigitMatch[1], 10)
                  : null;
            const meaning = energy !== null ? describe(energy) : null;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="rounded-xl border border-white/10 bg-black/20 p-2.5"
              >
                <p className="text-[11px] text-white/50">
                  {cellLabel(rowIndex, colIndex)}
                </p>
                <p className="mt-0.5 text-base font-bold text-white">
                  {cellValue || "—"}
                </p>
                {energy === null ? (
                  <p className="mt-1 text-xs text-white/60">
                    Поточне значення комірки для обраної дати.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-xs font-medium text-cyan-100">
                      {meaning?.title ?? `Енергія ${energy}`}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {meaning?.summary ??
                        "Опис для цього значення поки не додано."}
                    </p>
                  </>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
