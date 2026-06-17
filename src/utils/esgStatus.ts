import { ESGCapItem, CAPStatus } from "@/components/esg-cap/CAPTable";

const normalize = (s?: string) => (s ?? '').trim().toLowerCase();

export const getEffectiveStatus = (item: ESGCapItem): CAPStatus => {
  const originalStatus = normalize(item.status);
  const investorStatus = normalize(item.investorStatus);

  if (originalStatus === 'submitted') return 'submitted';
  // if (originalStatus === 'closed') return 'closed';
  if (originalStatus === 'request to re-submit') return 'request to re-submit';

  // 2. Investor closed overrides everything else
  if (investorStatus === 'closed') return 'submitted';
  // 3. All other cases → derive from targetDate
  if (!item.targetDate) return '' as CAPStatus;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(item.targetDate);
  target.setHours(0, 0, 0, 0);


  const isCurrentMonth = target.getFullYear() === today.getFullYear() &&
                         target.getMonth() === today.getMonth();
  if (isCurrentMonth) return 'due in this month';

  if (target < today) return 'overdue';

  return 'upcoming';
};