import { ScrollColumn } from '../ui/ScrollColumn'

type BirthDatePickerProps = {
  months: readonly string[]
  days: readonly string[]
  years: readonly string[]
  monthIndex: number
  dayIndex: number
  yearIndex: number
  onMonthChange: (index: number) => void
  onDayChange: (index: number) => void
  onYearChange: (index: number) => void
}

export function BirthDatePicker({
  months,
  days,
  years,
  monthIndex,
  dayIndex,
  yearIndex,
  onMonthChange,
  onDayChange,
  onYearChange,
}: BirthDatePickerProps) {
  return (
    <div className="relative mb-4 flex w-full select-none justify-center rounded-3xl bg-black/20 p-3">
      <div className="pointer-events-none absolute top-1/2 left-4 right-4 h-12 -translate-y-6 rounded-xl border border-white/10 bg-white/[0.04]" />

      <div className="relative z-10 flex w-full max-w-[260px] justify-between">
        <ScrollColumn items={months} selectedIndex={monthIndex} onChange={onMonthChange} />
        <ScrollColumn items={days} selectedIndex={dayIndex} onChange={onDayChange} wrapAround />
        <ScrollColumn items={years} selectedIndex={yearIndex} onChange={onYearChange} />
      </div>
    </div>
  )
}
