import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AreaFilterState {
  areaFilter: string; // "all" or area id
  setAreaFilter: (id: string) => void;
}

const AreaFilterContext = createContext<AreaFilterState | null>(null);

export function AreaFilterProvider({ children }: { children: ReactNode }) {
  const [areaFilter, setAreaFilter] = useState("all");
  const { profile } = useAuth();
  const initialized = useRef(false);

  // Auto-set to creator's first area on login (only once)
  useEffect(() => {
    if (initialized.current) return;
    if (profile?.creator_areas && (profile.creator_areas as any[]).length > 0) {
      const firstArea = (profile.creator_areas as any[])[0]?.area;
      if (firstArea?.id) {
        setAreaFilter(firstArea.id);
        initialized.current = true;
      }
    }
  }, [profile]);

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
