import { createContext, useContext, useState, ReactNode } from "react";

interface AreaFilterState {
  areaFilter: string; // "all" or area id
  setAreaFilter: (id: string) => void;
}

const AreaFilterContext = createContext<AreaFilterState | null>(null);

export function AreaFilterProvider({ children }: { children: ReactNode }) {
  const [areaFilter, setAreaFilter] = useState("all");

  return (
    <AreaFilterContext.Provider value={{ areaFilter, setAreaFilter }}>
      {children}
    </AreaFilterContext.Provider>
  );
}

export function useAreaFilter() {
  const ctx = useContext(AreaFilterContext);
  if (!ctx) throw new Error("useAreaFilter must be used within AreaFilterProvider");
  return ctx;
}
