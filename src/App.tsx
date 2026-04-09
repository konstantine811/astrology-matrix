import { useEffect, useMemo, useState } from 'react'
import { Particles } from './components/background/Particles'
import { BirthDatePicker } from './components/date-picker/BirthDatePicker'
import { MatrixCellDetails } from './components/matrix/MatrixCellDetails'
import { MatrixDiagram } from './components/matrix/MatrixDiagram'
import { MatrixSummaryTable } from './components/matrix/MatrixSummaryTable'
import { DEFAULT_BIRTH_YEAR, MONTHS_UA, createDayOptions, createYearOptions } from './constants/date'
import { buildMatrixModelTable } from './utils/modelTable'
import { calculateDestinyMatrix } from './utils/matrix'

function App() {
  const years = useMemo(() => createYearOptions(100), [])
  const defaultYearIndex = useMemo(() => {
    const index = years.indexOf(String(DEFAULT_BIRTH_YEAR))
    return index >= 0 ? index : 0
  }, [years])

  const [monthIndex, setMonthIndex] = useState(0)
  const [yearIndex, setYearIndex] = useState(defaultYearIndex)
  const [dayIndex, setDayIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  const selectedYear = Number.parseInt(years[yearIndex], 10)
  const days = useMemo(() => createDayOptions(monthIndex, selectedYear), [monthIndex, selectedYear])
  const selectedDay = Number.parseInt(days[dayIndex], 10)

  useEffect(() => {
    if (dayIndex > days.length - 1) {
      setDayIndex(days.length - 1)
    }
  }, [dayIndex, days.length])

  const matrixData = useMemo(() => {
    return calculateDestinyMatrix({
      day: selectedDay,
      month: monthIndex + 1,
      year: selectedYear,
    })
  }, [monthIndex, selectedDay, selectedYear])

  const modelTable = useMemo(
    () =>
      buildMatrixModelTable({
        day: selectedDay,
        month: monthIndex + 1,
        year: selectedYear,
      }),
    [monthIndex, selectedDay, selectedYear],
  )

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-5 text-white sm:py-6">
      <Particles />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
        <h1 className="mb-3 bg-gradient-to-b from-white to-white/75 bg-clip-text text-center text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
          Матриця Долі
        </h1>

        <div className="mb-4 w-full">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-indigo-300">✧</span>
            <span className="text-xs font-medium tracking-widest text-indigo-200/80 uppercase">Візуальна Матриця</span>
          </div>

          <MatrixDiagram matrix={matrixData} />
          <MatrixSummaryTable rows={modelTable.rows} />
        </div>

        <p className="mb-3 px-3 text-center text-xs leading-relaxed text-white/60 sm:text-sm">
          Змініть дату народження нижче, щоб оновити енергії на діаграмі.
        </p>

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

        <button
          onClick={() => setShowDetails((current) => !current)}
          className="w-full rounded-2xl bg-gradient-to-r from-[#6C72FF] to-[#8C52FF] py-3.5 text-sm font-semibold tracking-wider text-white uppercase shadow-[0_0_20px_rgba(108,114,255,0.3)] transition-all duration-300 hover:from-[#5a60eb] hover:to-[#7842e6] hover:shadow-[0_0_30px_rgba(108,114,255,0.5)] focus:ring-2 focus:ring-[#6C72FF] focus:ring-offset-2 focus:ring-offset-[#030712] focus:outline-none active:scale-[0.98] sm:text-base"
        >
          {showDetails ? 'Сховати Деталі' : 'Дізнатись Більше'}
        </button>

        {showDetails ? <MatrixCellDetails matrix={matrixData} rows={modelTable.rows} /> : null}
      </div>
    </div>
  )
}

export default App
