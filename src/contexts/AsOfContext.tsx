import { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';

/**
 * "As of Month/Year" snapshot for the Admin section.
 * When set, all admin analytics filter out kpi_entries whose reporting period
 * had not yet ended by the selected cutoff month.
 *
 * Cutoff semantics: "By reporting period".
 * Period deadlines (the date by which a period is considered "in the books"):
 *   Q1 -> May 1, Q2 -> Aug 1, Q3 -> Nov 1, Q4 -> Feb 1 (next year), FY -> Apr 1 (next year).
 * A period is INCLUDED when its deadline <= end of the selected as-of month.
 */

export interface AsOfValue {
  month: number; // 1-12
  year: number;
}

interface AsOfContextValue {
  /** null = "Live (current)" — no filtering applied. */
  asOf: AsOfValue | null;
  setAsOf: (v: AsOfValue | null) => void;
  /** True when a period (quarter/year) should be included given the current cutoff. */
  isPeriodIncluded: (quarter: string, year: number) => boolean;
  /** Human label e.g. "As of Apr 2025" or "Live". */
  label: string;
}

const AsOfContext = createContext<AsOfContextValue | undefined>(undefined);

const periodDeadline = (quarter: string, year: number): Date => {
  switch (quarter) {
    case 'Q1': return new Date(year, 4, 1);          // May 1
    case 'Q2': return new Date(year, 7, 1);          // Aug 1
    case 'Q3': return new Date(year, 10, 1);         // Nov 1
    case 'Q4': return new Date(year + 1, 1, 1);      // Feb 1 next year
    case 'FY': return new Date(year + 1, 3, 1);      // Apr 1 next year
    default:   return new Date(year, 11, 31);
  }
};

export const isPeriodAfterCutoff = (quarter: string, year: number, asOf: AsOfValue | null): boolean => {
  if (!asOf) return false;
  const cutoff = new Date(asOf.year, asOf.month, 0, 23, 59, 59); // last day of as-of month
  return periodDeadline(quarter, year).getTime() > cutoff.getTime();
};

export const AsOfProvider = ({ children }: { children: ReactNode }) => {
  const [asOf, setAsOf] = useState<AsOfValue | null>(null);

  const isPeriodIncluded = useCallback(
    (quarter: string, year: number) => !isPeriodAfterCutoff(quarter, year, asOf),
    [asOf]
  );

  const label = useMemo(() => {
    if (!asOf) return 'Live';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `As of ${monthNames[asOf.month - 1]} ${asOf.year}`;
  }, [asOf]);

  const value = useMemo(
    () => ({ asOf, setAsOf, isPeriodIncluded, label }),
    [asOf, isPeriodIncluded, label]
  );

  return <AsOfContext.Provider value={value}>{children}</AsOfContext.Provider>;
};

export const useAsOf = (): AsOfContextValue => {
  const ctx = useContext(AsOfContext);
  if (!ctx) {
    // Safe fallback for components rendered outside the provider (e.g. tests).
    return {
      asOf: null,
      setAsOf: () => {},
      isPeriodIncluded: () => true,
      label: 'Live',
    };
  }
  return ctx;
};
