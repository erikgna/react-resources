import { createContext, useCallback, useContext, useState } from "react";

interface OptimizationContextValue {
  optimized: boolean;
  toggle: () => void;
}

const OptimizationContext = createContext<OptimizationContextValue>({
  optimized: false,
  toggle: () => {},
});

export function OptimizationProvider({ children }: { children: React.ReactNode }) {
  const [optimized, setOptimized] = useState(false);
  const toggle = useCallback(() => setOptimized((v) => !v), []);
  return (
    <OptimizationContext.Provider value={{ optimized, toggle }}>
      {children}
    </OptimizationContext.Provider>
  );
}

export function useOptimization() {
  return useContext(OptimizationContext);
}
