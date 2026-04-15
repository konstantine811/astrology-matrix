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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-2 text-white sm:py-6">
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
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>
            <div className="mt-2 mb-2 w-full max-w-3xl px-4 text-center text-lg font-semibold tracking-wide text-white sm:text-2xl flex flex-row gap-4 justify-center">
              <span>
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
              <MatrixSummaryTable rows={modelTable.rows} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
