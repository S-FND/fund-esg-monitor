import { pct, r2 } from './helpers';
import type { CompanyAggregations } from './types';

/**
 * Match Admin Dashboard (`useAnalyticsDashboardData` → `deriveInsights`):
 *   - Training denominator = fixed 12 policies (not policiesInPlace)
 *   - Governance "incident term" = rate of high-impact incidents / total incidents
 */
export function governanceDerived(a: CompanyAggregations) {
  return {
    policyAdoptionPct: r2(pct(a.policiesInPlace, a.policiesTotal || 0)),
    trainingCoveragePct: r2(pct(a.policiesWithTraining, a.policiesTotal || 0)),
    highImpactIncidentRatePct: r2(pct(a.incidentsHighImpact, a.incidentsTotal || 0)),
    // kept for backwards compat with any UI still reading it
    unresolvedHighImpactPct: r2(pct(a.incidentsUnresolvedHigh, a.incidentsHighImpact || 0)),
  };
}
