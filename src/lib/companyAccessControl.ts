/**
 * Company access control configuration.
 *
 * Companies listed here retain full edit access via their company login.
 * All other companies get view-only access when logged in as a company user.
 *
 * Admin and Fandoro users normally have full edit access to all companies,
 * UNLESS the period being edited is locked.
 */

/**
 * The single open reporting period — Q1 2026 (JFM 2026).
 * All other periods (Q1–Q4 2025 and FY 2025) are LOCKED for everyone,
 * including Fireside Admin and Fandoro Consultant.
 *
 * Annual (FY) 2026 stays locked too — the user does not want annual
 * 2026 data filling opened yet.
 */
export const OPEN_QUARTER = 'Q1';
export const OPEN_YEAR = 2026;

/**
 * Returns true when the given reporting period is currently editable.
 * - Q1 2026 → editable
 * - Anything else (Q1–Q4 2025, FY 2025, FY 2026, etc.) → locked
 */
export const isPeriodEditable = (quarter: string | null | undefined, year: number | null | undefined): boolean => {
  if (!quarter || year == null) return false;
  return quarter === OPEN_QUARTER && year === OPEN_YEAR;
};

/**
 * Legacy alias — historically a global kill-switch. Kept so existing
 * imports continue to work, but now reflects "is anything locked?",
 * which is always true while we have any locked period (i.e. always).
 *
 * Use isPeriodEditable(quarter, year) when you need precise per-period
 * gating; this constant is only useful for places that show a generic
 * "some periods are locked" notice.
 */
export const EDIT_RIGHTS_PAUSED = false;

// Company IDs that retain full edit access via company login (for non-locked periods).
// While Q1–Q4 2025 + FY 2025 are locked for everyone, this list applies to Q1 2026 onwards.
export const EDITABLE_COMPANY_IDS = new Set([
  'company-demo',  // Demo Corp
  'company-8',     // Supertails
  'company-20',    // NewMe
  'company-33',    // Terractive
  'company-25',    // Iluvia
  'company-17',    // The Good Bug (TGB)
  'company-35',    // Sammmm Beauty
]);

/**
 * Check if a company has edit access when logged in as a company user
 * for a SPECIFIC reporting period. Admin and Fandoro users bypass the
 * EDITABLE_COMPANY_IDS allow-list but are still gated by isPeriodEditable.
 */
export const isCompanyEditable = (
  companyId: string | null,
  quarter?: string | null,
  year?: number | null
): boolean => {
  // If a period is supplied, it must be the open one.
  if (quarter !== undefined && year !== undefined) {
    if (!isPeriodEditable(quarter, year)) return false;
  }
  if (!companyId) return false;
  return EDITABLE_COMPANY_IDS.has(companyId);
};
