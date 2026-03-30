import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type Period = "7d" | "30d" | "month" | "all" | "custom";

export interface PeriodState {
  period: Period;
  setPeriod: (p: Period) => void;
  customStart: Date | undefined;
  customEnd: Date | undefined;
  setCustomStart: (d: Date | undefined) => void;
  setCustomEnd: (d: Date | undefined) => void;
}

const PeriodContext = createContext<PeriodState | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  // Default to "month" when user is logged in, "all" otherwise
  const { profile } = useAuth();
  const initialized = useRef(false);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    if (initialized.current) return;
    if (profile) {
      setPeriod("month");
      initialized.current = true;
    }
  }, [profile]);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  return (
    <PeriodContext.Provider value={{ period, setPeriod, customStart, customEnd, setCustomStart, setCustomEnd }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}
