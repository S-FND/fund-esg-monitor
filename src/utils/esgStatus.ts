// esgStatus.ts

import { ESGCapItem, CAPStatus } from "@/components/esg-cap/CAPTable";

const normalize = (s?: string) => (s ?? "").trim().toLowerCase();

export const getEffectiveStatus = (item: ESGCapItem): CAPStatus => {
  const companyStatus = normalize(item.companyStatus);
  const investorStatus = normalize(item.investorStatus);

  

  // 2. If company status is 'closed', return 'closed'
  if (companyStatus === 'closed') {
    return 'closed' as CAPStatus;
  }

  // 3. Check specific company statuses
  if (companyStatus === 'partly-submitted') {
    return 'partly-submitted' as CAPStatus;
  }

  // ✅ CHANGED: 'submitted'
  if (companyStatus === 'submitted') {
    return 'submitted' as CAPStatus;
  }

  // 1. If investor status is 'closed', return 'closed'
  if (investorStatus === 'closed') {
    return 'closed' as CAPStatus;
  }

  if (investorStatus === 're-submit requested') {
    return 're-submit-requested' as CAPStatus;
  }

  // 4. All other cases → derive from targetDate
  if (!item.targetDate) {
    return '' as CAPStatus;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(item.targetDate);
  target.setHours(0, 0, 0, 0);

  // Check if due in current month
  const isCurrentMonth =
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth();
  if (isCurrentMonth) {
    return 'due-in-this-month' as CAPStatus;
  }

  // Check if overdue
  if (target < today) {
    return 'overdue' as CAPStatus;
  }

  // Default: upcoming
  return 'upcoming' as CAPStatus;
};