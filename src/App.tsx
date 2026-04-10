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
import { buildMatrixModelTable } from "./utils/modelTable";
// import { calculateDestinyMatrix } from "./utils/matrix";

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
          <span className="font-bold text-indigo-300">MetaSense</span> - Твоє
          призначення
        </h1>

        <div className="w-full backdrop-blur-[1px]">
          <div className="mb-4 w-full flex flex-col items-center justify-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="text-indigo-300">✧</span>
              <span className="text-xs font-medium tracking-widest text-indigo-200/80 uppercase">
                Універсальна Матриця
              </span>
            </div>

            {/* <div className="max-w-3xl w-full">
              <MatrixDiagram matrix={matrixData} />
            </div> */}

            <div className="max-w-sm w-full flex justify-center items-center">
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
            </div>
            <div className="max-w-3xl w-full flex justify-center items-center  relative z-50">
              <MatrixSummaryTable rows={modelTable.rows} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
