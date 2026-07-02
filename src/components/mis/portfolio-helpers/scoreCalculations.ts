import { minMax, r2 } from './helpers';
import type { CompanyAggregations, CompanyDerived, CompanyScores } from './types';

/**
 * Compute per-company E/S/G sub-scores using cohort-relative percentile normalization
 * for the continuous metrics, then combine into a composite with weights E 35 / S 25 / G 40.
 * Companies without an environment feature get E=0 and their weight is redistributed to S and G.
 */
export function computeScores(
  companies: { id: string; aggregations: CompanyAggregations; derived: CompanyDerived; hasEnvironmentFeature: boolean }[],
): Map<string, CompanyScores> {
  const n = companies.length;
  const out = new Map<string, CompanyScores>();
  if (n === 0) return out;

  // Environment components (percentile-normalized across cohort)
  const recycledPct = minMax(companies.map(c => c.derived.recycledContentPct));
  const waterPct = minMax(companies.map(c => c.derived.waterRecyclingPct));
  const renewablePct = minMax(companies.map(c => c.derived.renewableEnergyPct));
  const wastePct = minMax(companies.map(c => c.derived.wasteDiversionPct));

  // Social components
  const genderPct = minMax(companies.map(c => c.derived.genderDiversityPct));
  const leadPct = minMax(companies.map(c => c.derived.womenInLeadershipPct));
  const boardPct = minMax(companies.map(c => c.derived.womenOnBoardPct));

  // Governance is absolute (no percentile — matches existing methodology)
  companies.forEach((c, i) => {
    const envRaw = 0.30 * recycledPct[i] + 0.25 * waterPct[i] + 0.25 * renewablePct[i] + 0.20 * wastePct[i];
    const environmentScore = c.hasEnvironmentFeature ? r2(Math.min(100, envRaw)) : 0;

    const socialRaw = 0.40 * genderPct[i] + 0.35 * leadPct[i] + 0.25 * boardPct[i];
    const socialScore = r2(Math.min(100, socialRaw));

    const policy = c.derived.policyAdoptionPct;
    const training = c.derived.trainingCoveragePct;
    // Admin Dashboard uses high-impact incident RATE (highImpact/totalIncidents), weights 40/40/20.
    const highImpactRate = (c.derived as any).highImpactIncidentRatePct ?? c.derived.unresolvedHighImpactPct;
    const governanceScore = r2(
      Math.min(100, 0.40 * policy + 0.40 * training + 0.20 * Math.max(0, 100 - highImpactRate)),
    );

    let composite: number;
    if (!c.hasEnvironmentFeature) {
      const sW = 25 / 65;
      const gW = 40 / 65;
      composite = r2(Math.min(100, socialScore * sW + governanceScore * gW));
    } else {
      composite = r2(Math.min(100, environmentScore * 0.35 + socialScore * 0.25 + governanceScore * 0.40));
    }

    // Admin Dashboard aliases deiCompositeScore → socialScore.
    const deiScore = socialScore;

    out.set(c.id, {
      environmentScore,
      socialScore,
      governanceScore,
      compositeScore: composite,
      circularEconomyIndex: environmentScore,
      deiScore,
    });
  });

  return out;
}
