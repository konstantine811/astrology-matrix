import { useEffect, useMemo, useState } from "react";
import { Particles } from "./components/background/Particles";
import { BirthDatePicker } from "./components/date-picker/BirthDatePicker";
import { MatrixCellDetails } from "./components/matrix/MatrixCellDetails";
import { MatrixDiagram } from "./components/matrix/MatrixDiagram";
import { MatrixSummaryTable } from "./components/matrix/MatrixSummaryTable";
import {
  DEFAULT_BIRTH_YEAR,
  MONTHS_UA,
  createDayOptions,
  createYearOptions,
} from "./constants/date";
import { buildMatrixModelTable } from "./utils/modelTable";
import { calculateDestinyMatrix } from "./utils/matrix";

function App() {
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
  const selectedDay = Number.parseInt(days[dayIndex], 10);

  useEffect(() => {
    if (dayIndex > days.length - 1) {
      setDayIndex(days.length - 1);
    }
  }, [dayIndex, days.length]);

  const matrixData = useMemo(() => {
    return calculateDestinyMatrix({
      day: selectedDay,
      month: monthIndex + 1,
      year: selectedYear,
    });
  }, [monthIndex, selectedDay, selectedYear]);

  const modelTable = useMemo(
    () =>
      buildMatrixModelTable({
        day: selectedDay,
        month: monthIndex + 1,
        year: selectedYear,
      }),
    [monthIndex, selectedDay, selectedYear],
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-2 text-white sm:py-6">
      <Particles />

      <div className="relative z-10 flex w-full flex-col items-center">
        <h1 className="mb-3 bg-linear-to-b from-white to-white/75 bg-clip-text text-center text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
          Матриця Долі
        </h1>

        <div className="max-w-lg w-full backdrop-blur-[1px]">
          <div className="mb-4 w-full">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="text-indigo-300">✧</span>
              <span className="text-xs font-medium tracking-widest text-indigo-200/80 uppercase">
                Візуальна Матриця
              </span>
            </div>

            <MatrixDiagram matrix={matrixData} />

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
            />
            <MatrixSummaryTable rows={modelTable.rows} />
          </div>
        </div>

        <div className="max-w-7xl w-full backdrop-blur-[1px]">
          <MatrixCellDetails matrix={matrixData} rows={modelTable.rows} />
        </div>
      </div>
    </div>
  );
}

export default App;
