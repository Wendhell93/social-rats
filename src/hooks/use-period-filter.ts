import { useMemo } from "react";
import { subDays, startOfMonth, isAfter, parseISO, isWithinInterval } from "date-fns";
import { usePeriod } from "@/contexts/PeriodContext";

/**
 * Returns a predicate function that checks whether a date string falls within
 * the currently selected period.
 */
export function usePeriodFilter() {
  const { period, customStart, customEnd } = usePeriod();

  const inPeriod = useMemo(
    () =>
      (dateStr: string): boolean => {
        const now = new Date();
        const date = parseISO(dateStr);
        if (period === "7d") return isAfter(date, subDays(now, 7));
        if (period === "30d") return isAfter(date, subDays(now, 30));
        if (period === "month") return isAfter(date, startOfMonth(now));
        if (period === "custom" && customStart && customEnd)
          return isWithinInterval(date, { start: customStart, end: customEnd });
        return true;
      },
    [period, customStart, customEnd]
  );

  return { inPeriod };
}
