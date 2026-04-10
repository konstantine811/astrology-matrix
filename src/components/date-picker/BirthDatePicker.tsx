import { useEffect, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { uk } from "date-fns/locale";
import "react-day-picker/style.css";
import { ScrollColumn } from "../ui/ScrollColumn";

type BirthDatePickerProps = {
  months: readonly string[];
  days: readonly string[];
  years: readonly string[];
  monthIndex: number;
  dayIndex: number;
  yearIndex: number;
  onMonthChange: (index: number) => void;
  onDayChange: (index: number) => void;
  onYearChange: (index: number) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
};

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
  selectedDate,
  onDateSelect,
}: BirthDatePickerProps) {
  const [pickerMonth, setPickerMonth] = useState<Date>(selectedDate);

  useEffect(() => {
    setPickerMonth(selectedDate);
  }, [selectedDate]);

  return (
    <div className="relative mb-4 flex w-full select-none justify-center rounded-3xl bg-black/20">
      <div className="pointer-events-none absolute top-1/2 left-4 right-4 h-12 -translate-y-6 rounded-xl border border-white/10 bg-white/4" />

      <div className="relative z-10 flex w-full max-w-[320px] items-center justify-between gap-3">
        <ScrollColumn
          items={months}
          selectedIndex={monthIndex}
          onChange={onMonthChange}
        />
        <ScrollColumn
          items={days}
          selectedIndex={dayIndex}
          onChange={onDayChange}
          wrapAround
        />
        <ScrollColumn
          items={years}
          selectedIndex={yearIndex}
          onChange={onYearChange}
        />
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Обрати дату з календаря"
            >
              <CalendarIcon className="mx-auto h-5 w-5" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              sideOffset={10}
              className="z-[70] rounded-2xl border border-white/10 bg-[#0E1017]/95 p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            >
              <DayPicker
                mode="single"
                locale={uk}
                selected={selectedDate}
                month={pickerMonth}
                onMonthChange={setPickerMonth}
                onSelect={(date) => {
                  if (date) onDateSelect(date);
                }}
                className="text-white"
              />
              <Popover.Arrow className="fill-[#0E1017]/95" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
