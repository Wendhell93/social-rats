import { useCallback } from "react";
import { subDays, startOfMonth, isAfter, parseISO, isWithinInterval } from "date-fns";
import { usePeriod } from "@/contexts/PeriodContext";

export function usePeriodFilter() {
  const { period, customStart, customEnd } = usePeriod();

  const inPeriod = useCallback(
    (dateStr: string): boolean => {
      const now = new Date();
      const date = parseISO(dateStr);

      switch (period) {
        case "7d":
          return isAfter(date, subDays(now, 7));
        case "30d":
          return isAfter(date, subDays(now, 30));
        case "month":
          return isAfter(date, startOfMonth(now));
        case "custom":
          if (customStart && customEnd) {
            return isWithinInterval(date, { start: customStart, end: customEnd });
          }
          return true;
        case "all":
        default:
          return true;
      }
    },
    [period, customStart, customEnd]
  );

  return { inPeriod, period, customStart, customEnd };
}