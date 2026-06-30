/**
 * Centralized mapping from internal metric keys to human-readable display names.
 * Internal keys remain unchanged across all computation files.
 * Only UI-facing components use this mapping for rendering.
 */

export const METRIC_DISPLAY_NAMES: Record<string, string> = {
  // ─── Non-Fashion Environment ───
  'Virgin Plastic Reduction %': 'Reduction in virgin plastic usage over time',
  'Plastic Intensity Score': 'Avg. plastic used per ₹1 Cr revenue (MT)',
  'Material Recycled %': 'Percentage of total materials recycled',
  'EPR/VPN %': 'Plastic neutralized either voluntarily or mandated by EPR',
  'P&S Recycled/Pkg %': 'Recycled content in primary & secondary packaging',
  'Recyclable %': 'Percentage of packaging that is recyclable',

  // ─── Fashion Environment ───
  'Recyclable Materials %': 'Percentage of materials that are recyclable',
  'Recyclable Packaging %': 'Percentage of packaging that is recyclable (Fashion)',
  'Fresh Water Consumed %': 'Fresh water consumed as percentage of total water',
  'Water Recycled %': 'Percentage of water recycled',

  // ─── Social ───
  'Supplier CoC In Place': 'Supplier Code of Conduct in place',
  'Supplier CoC Training': 'Supplier Code of Conduct training provided',
  'DEI Vendor %': 'Vendor diversity, equity & inclusion compliance',
  'Gender Ratio': 'Employee gender diversity ratio',
  'Women Leadership %': 'Women in leadership positions',
  'Pay Parity': 'Gender pay parity index',

  // ─── Governance ───
  'Policy Adoption %': 'Percentage of ESG policies adopted',
  'Training Coverage %': 'Employee ESG training coverage',
  'High Impact Unresolved %': 'Unresolved high-impact incidents',
};

/**
 * Returns the display name for a metric key, falling back to the key itself.
 */
export function getMetricDisplayName(key: string): string {
  return METRIC_DISPLAY_NAMES[key] ?? key;
}
