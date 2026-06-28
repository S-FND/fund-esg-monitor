// investorStatusUtils.ts

import { ESGCapItem } from "@/components/esg-cap/CAPTable";
import { getEffectiveStatus } from './esgStatus';

/**
 * Check if investor status should sync with company status
 * Only when: effective company status is 'overdue' AND priority is 'High'
 */
export const shouldSyncWithCompanyStatus = (item: ESGCapItem): boolean => {
  const effectiveStatus = getEffectiveStatus(item);
  const priority = (item.priority || '').toLowerCase().trim();
  return effectiveStatus === 'overdue' && priority === 'high';
};

/**
 * Get the derived investor status based on conditions
 * IMPORTANT: Only syncs when effectiveStatus is 'overdue' AND priority is 'High'
 * For all other cases, returns the existing investorStatus
 */
export const getDerivedInvestorStatus = (item: ESGCapItem): string => {
  // ✅ Use getEffectiveStatus to get the calculated company status
  const effectiveStatus = getEffectiveStatus(item);
  const priority = (item.priority || '').toLowerCase().trim();
  const investorStatus = (item.investorStatus || '').trim();
  
  // ✅ CRITICAL: Check if effectiveStatus is 'overdue' AND priority is 'high'
  if (effectiveStatus === 'overdue' && priority === 'high') {
    return 'high-priority-overdue';
  }

  // ✅ If investorStatus has a value, return it
  if (investorStatus && investorStatus !== '') {
    return investorStatus;
  }

  // ✅ Default: return empty string (nothing will be shown in the Investor Status column)
  return '';
};

/**
 * Get available investor statuses for dropdown
 * Matches the options in the Select component
 */
export const getAvailableInvestorStatuses = (item: ESGCapItem) => {
  const statuses = [];
  
  // Always available statuses (matching the Select options)
  statuses.push({ value: 're-submit-requested', label: 'Re-submit Requested' });
  statuses.push({ value: 'under-review', label: 'Under Review' });
  statuses.push({ value: 'reviewed-with-comments', label: 'Reviewed with Comments' });
  statuses.push({ value: 'closed', label: 'Closed' });
  statuses.push({ value: 'deferred', label: 'Deferred' });
  
  // Conditionally show High Priority Overdue (disabled) - ONLY when condition is met
  if (shouldSyncWithCompanyStatus(item)) {
    statuses.unshift({ 
      value: 'high-priority-overdue', 
      label: 'High Priority Overdue', 
      disabled: true 
    });
  }
  
  return statuses;
};

/**
 * Get the display value for investor status (for dropdown)
 */
export const getDisplayInvestorStatus = (item: ESGCapItem): string => {
  // If condition is met, always show high-priority-overdue
  if (shouldSyncWithCompanyStatus(item)) {
    return 'high-priority-overdue';
  }
  // Otherwise show the existing investorStatus or default to 'under-review'
  return item.investorStatus || 'under-review';
};

/**
 * Get the display label for investor status
 * Matches the labels in the Select component
 */
export const getInvestorStatusDisplayLabel = (status: string): string => {
  const map: Record<string, string> = {
    'high-priority-overdue': 'High Priority Overdue',
    're-submit-requested': 'Re-submit Requested',
    'under-review': 'Under Review',
    'reviewed-with-comments': 'Reviewed with Comments',
    'closed': 'Closed',
    'deferred': 'Deferred',
    '': '',
  };
  return map[status?.toLowerCase()] || status || '';
};

/**
 * Get the color class for investor status badge
 */
export const getInvestorStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    'high-priority-overdue': 'bg-red-100 text-red-800 border-red-300',
    're-submit-requested': 'bg-amber-100 text-amber-800 border-amber-300',
    'under-review': 'bg-blue-100 text-blue-800 border-blue-300',
    'reviewed-with-comments': 'bg-purple-100 text-purple-800 border-purple-300',
    'closed': 'bg-green-100 text-green-800 border-green-300',
    'deferred': 'bg-gray-100 text-gray-600 border-gray-300',
  };
  return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
};

/**
 * Get the tone for MetaPill component
 */
export const getInvestorStatusTone = (status: string): 'red' | 'green' | 'amber' | 'blue' | 'purple' | 'default' => {
  const map: Record<string, any> = {
    'high-priority-overdue': 'red',
    're-submit-requested': 'amber',
    'under-review': 'blue',
    'reviewed-with-comments': 'purple',
    'closed': 'green',
    'deferred': 'default',
  };
  return map[status?.toLowerCase()] || 'default';
};

/**
 * Check if investor status indicates closed
 */
export const isInvestorStatusClosed = (item: ESGCapItem): boolean => {
  const status = getDerivedInvestorStatus(item);
  return status === 'closed';
};