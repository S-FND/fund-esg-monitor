import { Lock } from 'lucide-react';
import { isPeriodEditable, OPEN_QUARTER, OPEN_YEAR } from '@/lib/companyAccessControl';

interface EditPausedBannerProps {
  /** The reporting period being viewed. If omitted, the banner always renders (legacy global mode). */
  quarter?: string;
  year?: number;
  className?: string;
}

const QUARTER_LABELS: Record<string, string> = {
  Q1: 'JFM',
  Q2: 'AMJ',
  Q3: 'JAS',
  Q4: 'OND',
  FY: 'Annual',
};

/**
 * Notice shown when the period being viewed is locked for editing.
 * Q1 2026 (the open period) shows nothing — every other period shows the banner.
 */
export const EditPausedBanner = ({ quarter, year, className = '' }: EditPausedBannerProps) => {
  // If a period was supplied and that period IS the open one, render nothing.
  if (quarter && year && isPeriodEditable(quarter, year)) return null;

  const periodLabel = quarter && year
    ? `${QUARTER_LABELS[quarter] ?? quarter} ${year}`
    : 'this period';
  const openLabel = `${QUARTER_LABELS[OPEN_QUARTER]} ${OPEN_YEAR}`;

  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 ${className}`}
      role="status"
    >
      <Lock className="w-3.5 h-3.5 shrink-0" />
      <span>
        <strong>{periodLabel} is locked.</strong> Editing is currently open only
        for <strong>{openLabel}</strong>. All previous periods remain available
        in view-only mode.
      </span>
    </div>
  );
};
