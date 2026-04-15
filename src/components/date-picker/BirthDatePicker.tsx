import { useEffect, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { uk } from "date-fns/locale";
import "react-day-picker/style.css";
import { ScrollColumn } from "../ui/ScrollColumn";
import { getUITheme, type ThemeMode } from "../../theme/uiTheme";

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
  theme?: ThemeMode;
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
  theme = "dark",
}: BirthDatePickerProps) {
  const ui = getUITheme(theme, 0.5);
  const [pickerMonth, setPickerMonth] = useState<Date>(selectedDate);
  const yearNumbers = years
    .map((y) => Number.parseInt(y, 10))
    .filter(Number.isFinite);
  const minYear = Math.min(...yearNumbers);
  const maxYear = Math.max(...yearNumbers);

  useEffect(() => {
    setPickerMonth(selectedDate);
  }, [selectedDate]);

  const handlePickerMonthChange = (nextMonth: Date) => {
    setPickerMonth(nextMonth);

    const nextYear = nextMonth.getFullYear();
    const nextYearIndex = years.indexOf(String(nextYear));
    if (nextYearIndex >= 0) {
      onYearChange(nextYearIndex);
    }

    onMonthChange(nextMonth.getMonth());

    const daysInTargetMonth = new Date(
      nextYear,
      nextMonth.getMonth() + 1,
      0,
    ).getDate();
    if (dayIndex > daysInTargetMonth - 1) {
      onDayChange(daysInTargetMonth - 1);
    }
  };

  return (
    <div
      className={`relative mb-4 flex w-full select-none justify-center rounded-3xl`}
    >
      <div
        className="pointer-events-none absolute top-1/2 left-4 right-4 h-12 -translate-y-6 rounded-xl border"
        style={{
          borderColor: ui.border,
          background: ui.surfaceSoft,
        }}
      />

      <div className="relative z-10 flex w-full max-w-[320px] items-center justify-between gap-3">
        <ScrollColumn
          items={months}
          selectedIndex={monthIndex}
          onChange={onMonthChange}
          theme={theme}
        />
        <ScrollColumn
          items={days}
          selectedIndex={dayIndex}
          onChange={onDayChange}
          wrapAround
          theme={theme}
        />
        <ScrollColumn
          items={years}
          selectedIndex={yearIndex}
          onChange={onYearChange}
          theme={theme}
        />
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="h-11 w-11 shrink-0 rounded-xl border transition"
              style={{
                borderColor: ui.border,
                color: ui.text,
                background: ui.surfaceSoft,
              }}
              aria-label="Обрати дату з календаря"
            >
              <CalendarIcon className="mx-auto h-5 w-5" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              sideOffset={10}
              className="z-[70] rounded-2xl border p-3 backdrop-blur-xl"
              style={{
                borderColor: ui.border,
                background: ui.surfaceDeep,
                boxShadow: ui.shadowStrong,
              }}
            >
              <DayPicker
                mode="single"
                locale={uk}
                selected={selectedDate}
                captionLayout="dropdown"
                startMonth={new Date(minYear, 0, 1)}
                endMonth={new Date(maxYear, 11, 31)}
                month={pickerMonth}
                onMonthChange={handlePickerMonthChange}
                onSelect={(date) => {
                  if (date) onDateSelect(date);
                }}
                className="matrix-day-picker"
              />
              <Popover.Arrow
                style={{ fill: ui.surfaceDeep }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
