import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Download, Loader2, FileText, Code, UploadCloud } from 'lucide-react';
import { mockCompanies, generateUniquePassword } from '@/data/mockData';
import { usePortfolioRankings, CompanyRanking } from '@/hooks/usePortfolioRankings';
import { useAnalyticsDashboardData, CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';
import { useAllQuartersProgress } from '@/hooks/useAllQuartersProgress';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import { toast } from 'sonner';
import { CAPStatus, ESGCapItem } from './esg-cap/CAPTable';
import { http } from '@/utils/httpInterceptor';
import { Company } from '@/types/esg';
import { ComplianceScoreEngine, PlanItem, PlanJson } from '@/pages/compliance-score-engine';
import { useComparePeriods } from '@/hooks/periodComparision';

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

type ScoreFormat = 'percentile' | 'category';

export interface ParseStats {
  csItems: number;
  cpItems: number;
  roadmapItems: number;
  applicableItems: number | null;
}

interface ParseState {
  parsed: PlanJson | null;
  error: string | null;
  stats: ParseStats;
}

const percentileToCategory = (p: number): string => {
  if (p >= 80) return 'AA';
  if (p >= 60) return 'A';
  if (p >= 40) return 'BB';
  if (p >= 20) return 'B';
  return 'C';
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  console.log('trend :: ', trend)
  if (trend === 'up') {
    return `
      <svg
        width="18"
        height="14"
        viewBox="0 0 18 14"
        xmlns="http://www.w3.org/2000/svg"
        style="vertical-align:middle; margin-left:4px;"
      >
        <polyline
          points="1,11 5,7 8,10 14,3"
          fill="none"
          stroke="#16a085"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <polyline
          points="10,3 14,3 14,7"
          fill="none"
          stroke="#16a085"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  if (trend === 'down') {
    return `
      <svg
        width="18"
        height="14"
        viewBox="0 0 18 14"
        xmlns="http://www.w3.org/2000/svg"
        style="vertical-align:middle; margin-left:4px;"
      >
        <polyline
          points="1,3 5,7 8,4 14,11"
          fill="none"
          stroke="#e74c3c"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <polyline
          points="10,11 14,11 14,7"
          fill="none"
          stroke="#e74c3c"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  return `
    <span
      style="
        display:inline-block;
        width:18px;
        margin-left:4px;
        color:#9ca3af;
        font-size:16px;
        font-weight:700;
        line-height:1;
        vertical-align:middle;
      "
    >
      —
    </span>
  `;
};


/**
 * Compute percentile rank for a value within a sorted (ascending) array of all values.
 * Uses the same formula as ESGCategoryBreakdown.assignPercentiles: Math.round(((idx+1)/n)*99)
 */
/**
 * Compute percentile rank using the same formula as ESGCategoryBreakdown.assignPercentiles:
 * Sort ascending, use first matching index, percentile = round(((idx+1)/n)*99).
 */
const cohortPercentile = (value: number, allValues: number[]): number => {
  if (allValues.length <= 1) return 99;
  const sorted = [...allValues].sort((a, b) => a - b);
  let idx = sorted.findIndex(v => v >= value);
  if (idx === -1) idx = sorted.length - 1;
  const pct = Math.round(((idx + 1) / sorted.length) * 99);
  return Math.max(1, Math.min(99, pct));
};
const cohortPercentilev1 = (
  value: number,
  brand: string,
  allValues: { score: number; brand: string }[]
): number => {
  if (allValues.length <= 1) return 99;

  // Sort ascending by score, then by brand alphabetically for deterministic tie-breaking
  const sorted = [...allValues].sort((a, b) => {
    const diff = a.score - b.score;
    return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
  });

  const idx = sorted.findIndex(v => v.score === value && v.brand === brand);
  const resolvedIdx = idx === -1 ? sorted.length - 1 : idx;

  const pct = Math.round(((resolvedIdx + 1) / sorted.length) * 99);
  return Math.max(1, Math.min(99, pct));
};

function generateEmailHTML(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  overallProgress: { filled: number; total: number; percentage: number },
  scoreFormat: ScoreFormat = 'percentile',
) {
  debugger;
  const insights = companyRaw?.insights || {} as any;
  const industry = companyRaw?.industry || company.industry || '';
  const revenueStage = companyRaw?.revenueStage || company.revenueStage || '';

  // ─── Performance metric percentiles (using raw scores + cohort ranking, matching ESGCategoryBreakdown) ───
  // const allAvgScores = allRankings.map(r => Math.round((r.completionPct + r.consistencyPct + r.timelinessScore) / 3 * 10) / 10);
  const allAvgScoresWithBrand = allRankings.map(r => ({ score: Math.round((r.completionPct + r.consistencyPct + r.timelinessScore) / 3 * 10) / 10, brand: r.brand }));

  // const allComplScores = allRankings.map(r => r.completionPct);
  // const allConsScores = allRankings.map(r => r.consistencyPct);
  // const allTimeScores = allRankings.map(r => r.timelinessScore);

  const allComplScoresWithBrand = allRankings.map(r => ({ score: r.completionPct, brand: r.brand }));
  const allConsScoresWithBrand = allRankings.map(r => ({ score: r.consistencyPct, brand: r.brand }));
  const allTimeScoresWithBrand = allRankings.map(r => ({ score: r.timelinessScore, brand: r.brand }));
  const myAvgScore = Math.round((ranking.completionPct + ranking.consistencyPct + ranking.timelinessScore) / 3 * 10) / 10;
  const overallPercentile = cohortPercentilev1(myAvgScore, company.brand, allAvgScoresWithBrand);
  const completenessPercentile = cohortPercentilev1(ranking.completionPct, company.brand, allComplScoresWithBrand);
  const consistencyPercentile = cohortPercentilev1(ranking.consistencyPct, company.brand, allConsScoresWithBrand);
  const timelinessPercentile = cohortPercentilev1(ranking.timelinessScore, company.brand, allTimeScoresWithBrand);

  // ─── ESG pillar percentiles (matching Category Breakdown filtering: only companies with valid scores) ───
  const pillarKeys = ['circularEconomyIndex', 'socialScore', 'governanceScore'] as const;
  // Filter to only companies with submitted data (at least one KPI)
  const submittingRaw = allCompaniesRaw.filter(c => Object.keys(c.kpis).length > 0);
  // For environment, further filter to companies with active env features
  const envEligibleRaw = submittingRaw.filter(c => (c as any).hasEnvironmentFeature);

  // const getValidScores = (pool: CompanyRawMetrics[], key: string): number[] =>
  //   pool.filter(c => {
  //     const v = (c.insights as any)?.[key];
  //     return v !== undefined && v !== null && !isNaN(v);
  //   }).map(c => (c.insights as any)[key] as number);
  const getValidScoresV1 = (pool: CompanyRawMetrics[], key: string): { score: number; brand: string }[] =>
    pool
      .filter(c => {
        const v = (c.insights as any)?.[key];
        return v !== undefined && v !== null && !isNaN(v);
      })
      .map(c => ({
        score: (c.insights as any)[key] as number,
        brand: c.brand,
      }));

  const envPool = getValidScoresV1(envEligibleRaw, 'circularEconomyIndex');
  const socPool = getValidScoresV1(submittingRaw, 'socialScore');
  const govPool = getValidScoresV1(submittingRaw, 'governanceScore');
  const esgPool = getValidScoresV1(submittingRaw, 'esgCompositeScore');

  const envPercentile = cohortPercentilev1(insights.circularEconomyIndex ?? 0, company.brand, envPool);
  const socPercentile = cohortPercentilev1(insights.socialScore ?? 0, company.brand, socPool);
  const govPercentile = cohortPercentilev1(insights.governanceScore ?? 0, company.brand, govPool);
  const esgCompositePercentile = cohortPercentilev1(insights.esgCompositeScore ?? 0, company.brand, esgPool);

  const allPillarPools = [envPool, socPool, govPool];
  const pillarData = pillarKeys.map((key, i) => {
    const companyPctile = [envPercentile, socPercentile, govPercentile][i];
    const pool = allPillarPools[i];

    // Sector avg: average of cohort percentiles for companies in same industry
    const indGroup = (i === 0 ? envEligibleRaw : submittingRaw).filter(c => c.industry === industry && !isNaN((c.insights as any)?.[key] ?? NaN));
    const indAvg = indGroup.length > 0 ? Math.round(indGroup.reduce((s, c) => s + cohortPercentilev1((c.insights as any)?.[key] ?? 0, c.brand, pool), 0) / indGroup.length) : 0;

    // Revenue cohort avg: average of cohort percentiles for companies in same revenue stage
    const revGroup = (i === 0 ? envEligibleRaw : submittingRaw).filter(c => c.revenueStage === revenueStage && !isNaN((c.insights as any)?.[key] ?? NaN));
    const revAvg = revGroup.length > 0 ? Math.round(revGroup.reduce((s, c) => s + cohortPercentilev1((c.insights as any)?.[key] ?? 0, c.brand, pool), 0) / revGroup.length) : 0;

    return { companyPctile, indAvg, revAvg };
  });

  // ESG Composite sector/revenue cohort averages
  const esgIndGroup = submittingRaw.filter(c => c.industry === industry && !isNaN((c.insights as any)?.esgCompositeScore ?? NaN));
  const esgCompositeIndAvg = esgIndGroup.length > 0 ? Math.round(esgIndGroup.reduce((s, c) => s + cohortPercentilev1((c.insights as any)?.esgCompositeScore ?? 0, c.brand, esgPool), 0) / esgIndGroup.length) : 0;
  const esgRevGroup = submittingRaw.filter(c => c.revenueStage === revenueStage && !isNaN((c.insights as any)?.esgCompositeScore ?? NaN));
  const esgCompositeRevAvg = esgRevGroup.length > 0 ? Math.round(esgRevGroup.reduce((s, c) => s + cohortPercentilev1((c.insights as any)?.esgCompositeScore ?? 0, c.brand, esgPool), 0) / esgRevGroup.length) : 0;

  const password = company.loginPassword || generateUniquePassword(company.companyCode);

  const ord = (n: number) => `${n}${getOrdinalSuffix(n)}`;

  const isCat = scoreFormat === 'category';
  const fmtScore = (p: number) => isCat ? percentileToCategory(p) : `${ord(p)} percentile`;
  const fmtBarLabel = (p: number) => isCat ? percentileToCategory(p) : String(p);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ESG Progress (Data Reporting) - ${company.brand}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#1e1e1e;line-height:1.6;max-width:680px;margin:0 auto;padding:24px;background:#ffffff;">

<h1 style="font-size:20px;color:#1a1a1a;margin:0 0 4px 0;">${company.brand}</h1>

<h2 style="font-size:17px;color:#2d2d2d;margin:8px 0 4px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">Progress (Data Reporting)</h2>
<p style="color:#6b7280;font-size:14px;margin:0 0 16px 0;">See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 20px 0;">
  <tr>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Responsiveness Score</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${fmtScore(overallPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Completeness</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${fmtScore(completenessPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Consistency</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${fmtScore(consistencyPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Timeliness</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${fmtScore(timelinessPercentile)}</div>
    </td>
  </tr>
</table>

<h2 style="font-size:17px;color:#2d2d2d;margin:28px 0 8px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">ESG&nbsp;Preformance&nbsp;Score: ${fmtScore(esgCompositePercentile)} (n=${esgPool.length})</h2>

<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">📊 ESG&nbsp;Composite (n=${esgPool.length})</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Your ${isCat ? 'Category' : 'Percentile'}</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#3b82f6;height:14px;border-radius:3px;width:${esgCompositePercentile}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${fmtBarLabel(esgCompositePercentile)}</td></tr></table></td>
  </tr>
  <tr><td colspan="2" style="height:3px;"></td></tr>
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Sector Avg</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#22c55e;height:14px;border-radius:3px;width:${esgCompositeIndAvg}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${fmtBarLabel(esgCompositeIndAvg)}</td></tr></table></td>
  </tr>
  <tr><td colspan="2" style="height:3px;"></td></tr>
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Revenue Cohort Avg</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#f59e0b;height:14px;border-radius:3px;width:${esgCompositeRevAvg}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${fmtBarLabel(esgCompositeRevAvg)}</td></tr></table></td>
  </tr>
</table>

${(() => {
      const hasEnvFeature = (companyRaw as any)?.hasEnvironmentFeature;
      const pillars = [
        { label: '🌿 Environment', data: pillarData[0], n: envPool.length, isNA: !hasEnvFeature },
        { label: '👥 Social', data: pillarData[1], n: socPool.length, isNA: false },
        { label: '🏛️ Governance', data: pillarData[2], n: govPool.length, isNA: false },
      ];
      return pillars.map(p => {
        if (p.isNA) {
          return `
<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">${p.label}</div>
<div style="font-size:12px;color:#9ca3af;font-style:italic;margin-bottom:10px;">NA — not applicable</div>`;
        }
        return `
<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">${p.label} (n=${p.n})</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Your ${isCat ? 'Category' : 'Percentile'}</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#3b82f6;height:14px;border-radius:3px;width:${p.data.companyPctile}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${fmtBarLabel(p.data.companyPctile)}</td></tr></table></td>
  </tr>
  <tr><td colspan="2" style="height:3px;"></td></tr>
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Sector Avg</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#22c55e;height:14px;border-radius:3px;width:${p.data.indAvg}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${fmtBarLabel(p.data.indAvg)}</td></tr></table></td>
  </tr>
  <tr><td colspan="2" style="height:3px;"></td></tr>
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Revenue Cohort Avg</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#f59e0b;height:14px;border-radius:3px;width:${p.data.revAvg}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${fmtBarLabel(p.data.revAvg)}</td></tr></table></td>
  </tr>
</table>`;
      }).join('');
    })()}

<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin-top:20px;">
  <p style="margin:0 0 8px 0;font-style:italic;color:#374151;font-size:14px;">Curious how your metrics are calculated and how you compare with your sector and revenue peers? Log in to view your results and tailored ESG recommendations.</p>
  <p style="margin:0 0 6px 0;font-size:14px;"><strong>URL :</strong> <a href="https://fireside.fandoro.com/" style="color:#2563eb;font-weight:600;">https://fireside.fandoro.com/</a></p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
    <tr>
      <td style="font-weight:600;color:#374151;padding:2px 12px 2px 0;font-size:14px;">Login ID:</td>
      <td><span style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #d1d5db;font-size:14px;">${company.companyCode}</span></td>
    </tr>
    <tr>
      <td style="font-weight:600;color:#374151;padding:2px 12px 2px 0;font-size:14px;">Password:</td>
      <td><span style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #d1d5db;font-size:14px;">${password.replace(/&/g, '&amp;')}</span></td>
    </tr>
  </table>
</div>

<div style="background:#f3f4f6;border-radius:8px;padding:10px 14px;margin-top:20px;">
  <p style="margin:2px 0;font-size:13px;">For technical issues (<a href="mailto:sm@fandoro.com">sm@fandoro.com</a>) or data-related queries and further clarification (<a href="mailto:tarak@firesideventures.com">tarak@firesideventures.com</a>).</p>
</div>

<div style="margin-top:24px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;">
  Fireside Ventures &mdash; ESG Reporting Platform<br>
  This is a confidential communication intended solely for the recipient.
</div>

</body>
</html>`;
}

async function generateEmailDOCX(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  overallProgress: { filled: number; total: number; percentage: number },
  scoreFormat: ScoreFormat = 'percentile',
) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, ShadingType, BorderStyle, HeadingLevel } = await import('docx');

  const insights = companyRaw?.insights || {} as any;
  const industry = companyRaw?.industry || company.industry || '';
  const revenueStage = companyRaw?.revenueStage || company.revenueStage || '';
  debugger;
  // ─── Performance metric percentiles (matching ESGCategoryBreakdown) ───
  const allAvgScores = allRankings.map(r => Math.round((r.completionPct + r.consistencyPct + r.timelinessScore) / 3 * 10) / 10);
  const allComplScores = allRankings.map(r => r.completionPct);
  const allConsScores = allRankings.map(r => r.consistencyPct);
  const allTimeScores = allRankings.map(r => r.timelinessScore);
  const myAvgScore = Math.round((ranking.completionPct + ranking.consistencyPct + ranking.timelinessScore) / 3 * 10) / 10;
  const overallPercentile = cohortPercentile(myAvgScore, allAvgScores);
  const completenessPercentile = cohortPercentile(ranking.completionPct, allComplScores);
  const consistencyPercentile = cohortPercentile(ranking.consistencyPct, allConsScores);
  const timelinessPercentile = cohortPercentile(ranking.timelinessScore, allTimeScores);

  // ─── ESG pillar percentiles (matching ESGCategoryBreakdown) ───
  const pillarKeyNames = ['circularEconomyIndex', 'socialScore', 'governanceScore'] as const;
  const allPillarScores = pillarKeyNames.map(key =>
    allCompaniesRaw.map(c => (c.insights as any)?.[key] ?? 0)
  );
  const allEsgScores = allCompaniesRaw.map(c => (c.insights as any)?.esgCompositeScore ?? 0);
  const envPercentile = cohortPercentile(insights.circularEconomyIndex ?? 0, allPillarScores[0]);
  const socPercentile = cohortPercentile(insights.socialScore ?? 0, allPillarScores[1]);
  const govPercentile = cohortPercentile(insights.governanceScore ?? 0, allPillarScores[2]);
  const esgCompositePercentile = cohortPercentile(insights.esgCompositeScore ?? 0, allEsgScores);

  // ESG Composite sector/revenue cohort averages
  const esgIndGroupDocx = allCompaniesRaw.filter(c => c.industry === industry && !isNaN((c.insights as any)?.esgCompositeScore ?? NaN));
  const esgCompositeIndAvgDocx = esgIndGroupDocx.length > 0 ? Math.round(esgIndGroupDocx.reduce((s, c) => s + cohortPercentile((c.insights as any)?.esgCompositeScore ?? 0, allEsgScores), 0) / esgIndGroupDocx.length) : 0;
  const esgRevGroupDocx = allCompaniesRaw.filter(c => c.revenueStage === revenueStage && !isNaN((c.insights as any)?.esgCompositeScore ?? NaN));
  const esgCompositeRevAvgDocx = esgRevGroupDocx.length > 0 ? Math.round(esgRevGroupDocx.reduce((s, c) => s + cohortPercentile((c.insights as any)?.esgCompositeScore ?? 0, allEsgScores), 0) / esgRevGroupDocx.length) : 0;

  const pillarKeys = [
    { key: 'circularEconomyIndex', label: '🌿 Environment', color: '059669' },
    { key: 'socialScore', label: '👥 Social', color: '2563EB' },
    { key: 'governanceScore', label: '🏛️ Governance', color: 'D97706' },
  ];

  const pillarData = pillarKeys.map((m, i) => {
    const companyPctile = [envPercentile, socPercentile, govPercentile][i];
    const indGroup = allCompaniesRaw.filter(c => c.industry === industry);
    const indAvg = indGroup.length > 0 ? Math.round(indGroup.reduce((s, c) => s + cohortPercentile((c.insights as any)?.[m.key] ?? 0, allPillarScores[i]), 0) / indGroup.length) : 0;
    const revGroup = allCompaniesRaw.filter(c => c.revenueStage === revenueStage);
    const revAvg = revGroup.length > 0 ? Math.round(revGroup.reduce((s, c) => s + cohortPercentile((c.insights as any)?.[m.key] ?? 0, allPillarScores[i]), 0) / revGroup.length) : 0;
    return { companyPctile, indAvg, revAvg, label: m.label };
  });

  const password = company.loginPassword || generateUniquePassword(company.companyCode);
  const ord = (n: number) => `${n}${getOrdinalSuffix(n)}`;
  const isCat = scoreFormat === 'category';
  const fmtScore = (p: number) => isCat ? percentileToCategory(p) : `${ord(p)} percentile`;
  const fmtBarLabel = (p: number) => isCat ? percentileToCategory(p) : String(p);

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  const makeBarRow = (label: string, value: number, color: string) => {
    // Create a visual bar using a colored cell
    const barWidth = Math.max(1, Math.round(value * 50)); // scale to ~50 chars max
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: label, size: 18, color: '6B7280', font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 5500, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 0, right: 80 },
          children: [
            new Table({
              width: { size: 5000, type: WidthType.DXA },
              columnWidths: [Math.round(value * 50), Math.round((100 - value) * 50)],
              rows: [new TableRow({
                height: { value: 220, rule: 'exact' as any },
                children: [
                  new TableCell({
                    width: { size: Math.round(value * 50), type: WidthType.DXA },
                    shading: { fill: color, type: ShadingType.CLEAR },
                    borders: noBorders,
                    children: [new Paragraph({ children: [] })],
                  }),
                  new TableCell({
                    width: { size: Math.round((100 - value) * 50), type: WidthType.DXA },
                    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                    borders: noBorders,
                    children: [new Paragraph({ children: [] })],
                  }),
                ],
              })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 700, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: fmtBarLabel(value), size: 18, bold: true, color: '374151', font: 'Arial' })] })],
        }),
      ],
    });
  };

  const hasEnvFeatureDocx = (companyRaw as any)?.hasEnvironmentFeature;
  const pillarSections = pillarData.flatMap((p, pi) => {
    const isEnvNA = pi === 0 && !hasEnvFeatureDocx;
    if (isEnvNA) {
      return [
        new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: p.label, size: 24, bold: true, color: '374151', font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'NA — not applicable', size: 22, italics: true, color: '9CA3AF', font: 'Arial' })] }),
      ];
    }
    return [
      new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: `${p.label} (n=${allPillarScores[pi].length})`, size: 24, bold: true, color: '374151', font: 'Arial' })] }),
      new Table({
        width: { size: 8200, type: WidthType.DXA },
        columnWidths: [2000, 5500, 700],
        rows: [
          makeBarRow(`Your ${isCat ? 'Category' : 'Percentile'}`, p.companyPctile, '3B82F6'),
          makeBarRow('Sector Avg', p.indAvg, '22C55E'),
          makeBarRow('Revenue Cohort Avg', p.revAvg, 'F59E0B'),
        ],
      }),
    ];
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        // Title
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: company.brand, size: 34, bold: true, color: '1A1A1A', font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Progress (Data Reporting)', size: 30, bold: true, color: '1A1A1A', font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: `See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).`, size: 24, color: '6B7280', font: 'Arial' })] }),

        // Stat cards as a 4-column table
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [2250, 2250, 2250, 2250],
          rows: [new TableRow({
            children: [
              { label: 'OVERALL', value: fmtScore(overallPercentile) },
              { label: 'COMPLETENESS', value: fmtScore(completenessPercentile) },
              { label: 'CONSISTENCY', value: fmtScore(consistencyPercentile) },
              { label: 'TIMELINESS', value: fmtScore(timelinessPercentile) },
            ].map(card => new TableCell({
              width: { size: 2250, type: WidthType.DXA },
              borders: cellBorders,
              shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
                    new TextRun({ text: card.label, size: 16, bold: true, color: '6B7280', font: 'Arial' }),
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER, children: [
                    new TextRun({ text: card.value, size: 22, bold: true, color: '059669', font: 'Arial' }),
                  ]
                }),
              ],
            })),
          })],
        }),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ESG Chart heading
        new Paragraph({
          spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB', space: 4 } }, children: [
            new TextRun({ text: `ESG Composite Score: ${fmtScore(esgCompositePercentile)} (n=${allEsgScores.length}) — ${isCat ? 'Category' : 'Percentile'} Comparison`, size: 30, bold: true, color: '2D2D2D', font: 'Arial' }),
          ]
        }),

        // Legend
        new Table({
          width: { size: 8200, type: WidthType.DXA },
          columnWidths: [2700, 2700, 2800],
          rows: [new TableRow({
            children: [
              new TableCell({
                borders: noBorders, width: { size: 2700, type: WidthType.DXA }, children: [new Paragraph({
                  children: [
                    new TextRun({ text: '■ ', color: '3B82F6', size: 20, font: 'Arial' }),
                    new TextRun({ text: `Your ${isCat ? 'Category' : 'Percentile'}`, color: '6B7280', size: 20, font: 'Arial' }),
                  ]
                })]
              }),
              new TableCell({
                borders: noBorders, width: { size: 2700, type: WidthType.DXA }, children: [new Paragraph({
                  children: [
                    new TextRun({ text: '■ ', color: '22C55E', size: 20, font: 'Arial' }),
                    new TextRun({ text: 'Sector Avg', color: '6B7280', size: 20, font: 'Arial' }),
                  ]
                })]
              }),
              new TableCell({
                borders: noBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({
                  children: [
                    new TextRun({ text: '■ ', color: 'F59E0B', size: 20, font: 'Arial' }),
                    new TextRun({ text: 'Revenue Cohort Avg', color: '6B7280', size: 20, font: 'Arial' }),
                  ]
                })]
              }),
            ],
          })],
        }),

        // ESG Composite chart
        new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: '📊 ESG\u00A0Composite', size: 24, bold: true, color: '374151', font: 'Arial' })] }),
        new Table({
          width: { size: 8200, type: WidthType.DXA },
          columnWidths: [2000, 5500, 700],
          rows: [
            makeBarRow(`Your ${isCat ? 'Category' : 'Percentile'}`, esgCompositePercentile, '3B82F6'),
            makeBarRow('Sector Avg', esgCompositeIndAvgDocx, '22C55E'),
            makeBarRow('Revenue Cohort Avg', esgCompositeRevAvgDocx, 'F59E0B'),
          ],
        }),

        // Pillar charts
        ...pillarSections,

        // Teaser line
        new Paragraph({
          shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, spacing: { before: 400, after: 60 }, children: [
            new TextRun({ text: 'Curious how your metrics are calculated and how you compare with your sector and revenue peers? Log in to view your results and tailored ESG recommendations.', size: 22, italics: true, color: '374151', font: 'Arial' }),
          ]
        }),
        // URL line
        new Paragraph({
          shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, spacing: { after: 60 }, children: [
            new TextRun({ text: 'URL : ', size: 22, bold: true, color: '374151', font: 'Arial' }),
            new TextRun({ text: 'https://fireside.fandoro.com/', size: 22, bold: true, color: '2563EB', font: 'Arial' }),
          ]
        }),
        new Table({
          width: { size: 5000, type: WidthType.DXA },
          columnWidths: [1800, 3200],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: 'Login ID:', size: 22, bold: true, color: '374151', font: 'Arial' })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: company.companyCode, size: 22, font: 'Courier New' })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: 'Password:', size: 22, bold: true, color: '374151', font: 'Arial' })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: password, size: 22, font: 'Courier New' })] })] }),
              ]
            }),
          ],
        }),

        // Contact block
        new Paragraph({
          spacing: { before: 300, after: 60 }, shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, children: [
            new TextRun({ text: 'For technical issues faced:', size: 22, bold: true, color: '374151', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 100 }, children: [
            new TextRun({ text: 'Contact Smita Mishra — sm@fandoro.com', size: 22, color: '374151', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 60 }, children: [
            new TextRun({ text: 'For data related issues:', size: 22, bold: true, color: '374151', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 200 }, children: [
            new TextRun({ text: 'Contact Tarak Doshi — tarak@firesideventures.com', size: 22, color: '374151', font: 'Arial' }),
          ]
        }),

        // Footer
        new Paragraph({
          spacing: { before: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB', space: 8 } }, children: [
            new TextRun({ text: 'Fireside Ventures — ESG Reporting Platform', size: 20, color: '9CA3AF', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'This is a confidential communication intended solely for the recipient.', size: 20, color: '9CA3AF', font: 'Arial' }),
          ]
        }),
      ],
    }],
  });

  return Packer.toBlob(doc);
}

function parseInput(text: string): ParseState {
  const empty: ParseStats = { csItems: 0, cpItems: 0, roadmapItems: 0, applicableItems: null };
  if (!text.trim()) return { parsed: null, error: null, stats: empty };
  try {
    const raw = JSON.parse(text);
    const plan: PlanItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.plan) ? raw.plan : [];
    let cs = 0,
      cp = 0,
      rm = 0;
    for (const p of plan) {
      if (p?.dealCondition === "CS") cs++;
      else if (p?.dealCondition === "CP") cp++;
      else if (p?.dealCondition === "Roadmap") rm++;
    }
    return {
      parsed: Array.isArray(raw) ? { plan } : (raw as PlanJson),
      error: null,
      stats: { csItems: cs, cpItems: cp, roadmapItems: rm, applicableItems: null },
    };
  } catch (e) {
    return { parsed: null, error: (e as Error).message, stats: empty };
  }
}

type ExportFormat = 'html' | 'docx';

interface Props {
  year?: number;
  quarter?: string;
}

type Trend = 'up' | 'down' | 'stable';

const getTrend = (current: number, previous: number): Trend => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
};

// const getGrade = (percentile: number): { grade: string; color: string } => {
//   if (percentile >= 80) return { grade: 'AA', color: 'text-emerald-600' };
//   if (percentile >= 60) return { grade: 'A', color: 'text-blue-600' };
//   if (percentile >= 40) return { grade: 'BB', color: 'text-amber-600' };
//   if (percentile >= 20) return { grade: 'B', color: 'text-orange-600' };
//   return { grade: 'C', color: 'text-red-600' };
// };

const getGrade = (percentile: number): { grade: string; color: string } => {
  if (percentile >= 80) {
    return { grade: 'AA', color: '#059669' }; // emerald-600
  }

  if (percentile >= 60) {
    return { grade: 'A', color: '#2563EB' }; // blue-600
  }

  if (percentile >= 40) {
    return { grade: 'BB', color: '#D97706' }; // amber-600
  }

  if (percentile >= 20) {
    return { grade: 'B', color: '#EA580C' }; // orange-600
  }

  return { grade: 'C', color: '#DC2626' }; // red-600
};

const getGradeTrend = (
  currentValue: number | null | undefined,
  previousValue: number | null | undefined
) => {
  if (currentValue == null || previousValue == null) {
    return 'stable';
  }

  const { grade: currentGrade } = getGrade(currentValue);
  const { grade: previousGrade } = getGrade(previousValue);

  const gradeOrder = ['AA', 'A', 'BB', 'B', 'C'];

  const currentIndex = gradeOrder.indexOf(currentGrade);
  const previousIndex = gradeOrder.indexOf(previousGrade);

  if (currentIndex === -1 || previousIndex === -1) {
    return 'stable';
  }

  if (currentIndex < previousIndex) {
    return 'up';
  }

  if (currentIndex > previousIndex) {
    return 'down';
  }

  return 'stable';
};


const gradeOrder = ['AA', 'A', 'BB', 'B', 'C']; // best → worst
const CATEGORY_RANK: Record<string, number> = { AA: 5, A: 4, BB: 3, B: 2, C: 1 };

// Trend is ALWAYS derived from grade-band comparison (categoryA vs categoryB),
// never from raw percentile/score movement.
const getTrendFromGrade = (categoryB?: string, categoryA?: string): string => {
  if (!categoryA || !categoryB) return 'stable';
  const rankA = CATEGORY_RANK[categoryA];
  const rankB = CATEGORY_RANK[categoryB];
  if (rankA === rankB) return 'stable';
  return rankB > rankA ? 'up' : 'down';
};

const RANKING_LOOKUP: Record<string, string> = {
  overallPercentile: 'overall',
  completenessPercentile: 'completeness',
  consistencyPercentile: 'consistency',
  timelinessPercentile: 'timeliness',
};

const ESG_LOOKUP: Record<string, string> = {
  esgCompositeIndAvg: 'esgCompositeScore',
  esgCompositePercentile: 'esgCompositeScore',
};

const PILLAR_TO_ESG_KEY: Record<string, string> = {
  environment: 'circularEconomyIndex',
  social: 'socialScore',
  governance: 'governanceScore',
};

const findCompanyEntry = (
  cards: any[] | undefined,
  cardKey: string,
  companyBrand: string
) => {
  const card = cards?.find(c => c.key === cardKey);
  return card?.companies?.find((c: any) => c.brand === companyBrand);
};

const getQuarterAnalyticsWithTrend = (
  currentQuarter: any,
  rankingCards: any[],
  esgCardCompare: any[],
  companyBrand: string
) => {
  const currentPillars = currentQuarter?.pillars || [];

  // const pillarTrends = currentPillars.map((currentPillar: any) => {
  //   const esgKey = PILLAR_TO_ESG_KEY[currentPillar.key];
  //   const entry = esgKey ? findCompanyEntry(esgCardCompare, esgKey, companyBrand) : undefined;

  //   return {
  //     key: currentPillar.key,
  //     companyPctileTrend: getTrendFromGrade(entry?.categoryB, entry?.categoryA),
  //   };
  // });

  const pillarTrends = currentPillars.map((currentPillar: any) => {
    // currentPillar.key already matches esgCardCompare's key directly
    // (circularEconomyIndex / socialScore / governanceScore) — no remapping needed
    const entry = findCompanyEntry(esgCardCompare, currentPillar.key, companyBrand);
    console.log('entry :: ', entry)

    return {
      key: currentPillar.key,
      enabled: entry ? true : false,
      current: currentPillar.companyPctile ?? entry?.percentileB ?? null,
      previous: entry?.percentileA ?? null,
      companyPctileTrend: getTrendFromGrade(entry?.categoryB, entry?.categoryA),
    };
  });

  const buildIndicator = (
    field: string,
    currentValue: number,
    lookupMap: Record<string, string>,
    sourceCards: any[],
    prevField: 'percentileA' | 'scoreA' = 'percentileA'
  ) => {
    const cardKey = lookupMap[field];
    const entry = findCompanyEntry(sourceCards, cardKey, companyBrand);

    return {
      current: currentValue,
      previous: entry?.[prevField] ?? null,
      trend: getTrendFromGrade(entry?.categoryB, entry?.categoryA), // grade-band compare only
    };
  };

  return {
    ...currentQuarter,

    indicators: {
      completenessPercentile: buildIndicator(
        'completenessPercentile',
        currentQuarter.completenessPercentile,
        RANKING_LOOKUP,
        rankingCards
      ),

      consistencyPercentile: buildIndicator(
        'consistencyPercentile',
        currentQuarter.consistencyPercentile,
        RANKING_LOOKUP,
        rankingCards
      ),

      esgCompositeIndAvg: buildIndicator(
        'esgCompositeIndAvg',
        currentQuarter.esgCompositeIndAvg,
        ESG_LOOKUP,
        esgCardCompare,
        'scoreA'
      ),

      esgCompositePercentile: buildIndicator(
        'esgCompositePercentile',
        currentQuarter.esgCompositePercentile,
        ESG_LOOKUP,
        esgCardCompare
      ),

      overallPercentile: buildIndicator(
        'overallPercentile',
        currentQuarter.overallPercentile,
        RANKING_LOOKUP,
        rankingCards
      ),

      timelinessPercentile: buildIndicator(
        'timelinessPercentile',
        currentQuarter.timelinessPercentile,
        RANKING_LOOKUP,
        rankingCards
      ),

      pillars: pillarTrends,
    },
  };
};

// const getQuarterAnalyticsWithTrend = (
//   currentQuarter: any,
//   prevQuarter: any
// ) => {
//   const currentPillars = currentQuarter?.pillars || [];
//   const previousPillars = prevQuarter?.pillars || [];

//   const pillarTrends = currentPillars.map((currentPillar: any) => {
//     const previousPillar = previousPillars.find(
//       (p: any) => p.key === currentPillar.key
//     );

//     return {
//       key: currentPillar.key,
//       companyPctileTrend: previousPillar
//         ? getGradeTrend(
//           currentPillar.companyPctile,
//           previousPillar.companyPctile
//         )
//         : 'stable',
//     };
//   });

//   return {
//     ...currentQuarter,

//     indicators: {
//       completenessPercentile: {
//         current: currentQuarter.completenessPercentile,
//         previous: prevQuarter?.completenessPercentile ?? null,
//         trend: getGradeTrend(
//           currentQuarter.completenessPercentile,
//           prevQuarter?.completenessPercentile
//         ),
//       },

//       consistencyPercentile: {
//         current: currentQuarter.consistencyPercentile,
//         previous: prevQuarter?.consistencyPercentile ?? null,
//         trend: getGradeTrend(
//           currentQuarter.consistencyPercentile,
//           prevQuarter?.consistencyPercentile
//         ),
//       },

//       esgCompositeIndAvg: {
//         current: currentQuarter.esgCompositeIndAvg,
//         previous: prevQuarter?.esgCompositeIndAvg ?? null,
//         trend: getGradeTrend(
//           currentQuarter.esgCompositeIndAvg,
//           prevQuarter?.esgCompositeIndAvg
//         ),
//       },

//       esgCompositePercentile: {
//         current: currentQuarter.esgCompositePercentile,
//         previous: prevQuarter?.esgCompositePercentile ?? null,
//         trend: getGradeTrend(
//           currentQuarter.esgCompositePercentile,
//           prevQuarter?.esgCompositePercentile
//         ),
//       },

//       overallPercentile: {
//         current: currentQuarter.overallPercentile,
//         previous: prevQuarter?.overallPercentile ?? null,
//         trend: getGradeTrend(
//           currentQuarter.overallPercentile,
//           prevQuarter?.overallPercentile
//         ),
//       },

//       timelinessPercentile: {
//         current: currentQuarter.timelinessPercentile,
//         previous: prevQuarter?.timelinessPercentile ?? null,
//         trend: getGradeTrend(
//           currentQuarter.timelinessPercentile,
//           prevQuarter?.timelinessPercentile
//         ),
//       },

//       pillars: pillarTrends,
//     },
//   };
// };



export const GenerateEmailDialog = ({ year = 2026, quarter = 'Q1' }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('html');
  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>('percentile');
  const [allEscap, setAllEscap] = useState<{ entityId: Company, plan: ESGCapItem[] }[]>([]);
  const [escapAnalyticsData, setEscapAnalyticsData] = useState<{
    complianceScore: number, priorityScore: {
      high: { [key: string]: number },
      medium: { [key: string]: number },
    }
  } | null>(null);


  const { rankingCards, esgCards: esgCardCompare, isLoading: compareLoading } = useComparePeriods(
    {
      "period": "annual",
      "quarter": "Q4",
      "year": 2025,
      "cumulative": false,
      "periodType": "quarterly"
    },
    {
      "period": "annual",
      "quarter": "Q1",
      "year": 2026,
      "cumulative": false,
      "periodType": "quarterly"
    },
    false,
    {
      "period": "annual",
      "quarter": "Q1",
      "year": 2026,
      "cumulative": false
    }
  );

  console.log('rankingCards :: ', rankingCards)
  console.log('esgCardCompare :: ', esgCardCompare)


  const getMisData = async (rankings, analyticsData, companyId) => {
    try {
      const company = mockCompanies.find(c => c.id === companyId);
      if (!company) return null;
      const ranking = rankings.find(r => r.companyId === companyId);
      if (!ranking) return null;

      const rawData = analyticsData.data?.quarterlyCombinedRawData || analyticsData.data?.companyRawData || [];
      const companyRaw = rawData.find(c => c.companyId === companyId);

      const overallProgress = {
        filled: Math.round((ranking.completionPct / 100) * 100),
        total: 100,
        percentage: Math.round(ranking.completionPct),
      };

      const brandSlug = company.brand.replace(/\s+/g, '_');

      return { company, ranking, companyRaw, rawData, rankings, overallProgress, scoreFormat, brandSlug }

    } catch (error) {
      throw error;
    }
  }

  const { rankings, isLoading: rankingsLoading } = usePortfolioRankings(year, quarter);
  const { rankings: prevRankings, isLoading: prevRankingsLoading } = usePortfolioRankings(2025, 'Q4')

  const escapDataAll = async () => {
    const data = await http.get('investor/esgdd/escap/all');
    console.log('analyticsData', data);
    if (data.error) throw data.error;

    setAllEscap(data.data);
  }

  const result = async (esgCap: { plan: ESGCapItem[] } | null) => {
    if (!esgCap?.plan) return null;
    const engine = new ComplianceScoreEngine();
    const parse = parseInput(JSON.stringify({ plan: esgCap.plan }));
    const r = engine.calculateComplianceScore(parse.parsed);
    return r;
    // console.log("retur result => ",r);
    // return calculateComplianceScore(mapESGCapItems(planData.plan));
  };

  useEffect(() => {
    escapDataAll();
  }, []);

  // Use annual combined view — aggregates Q1-Q4 data with percentile normalization across all companies
  const analyticsData = useAnalyticsDashboardData({
    period: 'annual',
    year,
  });

  const prevQuarterAnalyticsData = useAnalyticsDashboardData({
    period: 'annual',
    year: 2025
  },)

  const eligibleCompanies = mockCompanies.filter(c => !isCompanyExcluded(c.id, quarter, year));

  // We need overall progress for each company — use selected company's progress for preview
  const selectedProgress = useAllQuartersProgress(selectedCompanyId || 'none', year, 0, true);

  const handleDownload = async (companyId: string) => {
    console.log('Handle download')

    const company = mockCompanies.find(c => c.id === companyId);
    if (!company) return false;



    // const ranking = rankings.find(r => r.companyId === companyId);
    // if (!ranking) return false;

    // const rawData = analyticsData.data?.quarterlyCombinedRawData || analyticsData.data?.companyRawData || [];
    // const companyRaw = rawData.find(c => c.companyId === companyId);

    // const overallProgress = {
    //   filled: Math.round((ranking.completionPct / 100) * 100),
    //   total: 100,
    //   percentage: Math.round(ranking.completionPct),
    // };

    // const brandSlug = company.brand.replace(/\s+/g, '_');

    let currentMisConstruct = await getMisData(rankings, analyticsData, companyId)
    let prevMisConstruct = await getMisData(prevRankings, prevQuarterAnalyticsData, companyId)

    //Escap Data construct

    const escapData = allEscap.find(e => (e.entityId.misCompanyId.toLocaleLowerCase() === currentMisConstruct.company.brand.toLocaleLowerCase() || (e.entityId.misCompanyId.toLocaleLowerCase() === currentMisConstruct.company.companyCode.toLocaleLowerCase())));
    allEscap.forEach(e => {
      if ((e.entityId.misCompanyId.toLocaleLowerCase() === currentMisConstruct.company.brand.toLocaleLowerCase()) || 
      (e.entityId.misCompanyId.toLocaleLowerCase() === currentMisConstruct.company.companyCode.toLocaleLowerCase()))   {
        console.log('escapData found :: ', e);
      }
    })
    console.log('escapData :: ', escapData)
    let esgCapTemplateData = null;
    if (escapData) {
      let complianceScore = await result({ plan: escapData.plan });
      console.log('complianceScore :: ', complianceScore)
      const complianceRating = getComplianceRating(complianceScore.overallComplianceScore ?? 0) as { grade: string; label: string; color: string };

      esgCapTemplateData = {
        complianceScore: complianceScore.overallComplianceScore ?? 0,
        complianceRating: complianceRating,
        priorityScore: {
          high: {
            ontime: getCSCount("High", "ontime", escapData.plan),

            buffer1: getCSCount("High", "buffer1", escapData.plan),
            buffer2: getCSCount("High", "buffer2", escapData.plan),
            buffer3: getCSCount("High", "buffer3", escapData.plan),

            // under3: getCSCount("High", "under3", escapData.plan),
            // over3: getCSCount("High", "over3", escapData.plan),

            afterBufer: getCompletedOver3Count("High", escapData.plan),

            overdue: getNotCompletedOver3Count("High", escapData.plan),

            upcoming: getCSCount("High", "upcoming", escapData.plan),

            total: getCSCount("High", "ontime", escapData.plan) +
              getCSCount("High", "buffer1", escapData.plan) +
              getCSCount("High", "buffer2", escapData.plan) +
              getCSCount("High", "buffer3", escapData.plan) +
              getCSCount("High", "under3", escapData.plan) +
              getNotCompletedOver3Count("High", escapData.plan) +
              getCompletedOver3Count("High", escapData.plan) +
              getCSCount("High", "upcoming", escapData.plan)

          },
          medium: {
            ontime: getCSCount("Medium", "ontime", escapData.plan),

            buffer1: getCSCount("Medium", "buffer1", escapData.plan),
            buffer2: getCSCount("Medium", "buffer2", escapData.plan),
            buffer3: getCSCount("Medium", "buffer3", escapData.plan),
            // under3: getCSCount("Medium", "under3", escapData.plan),
            // over3: getCSCount("Medium", "over3", escapData.plan),
            afterBufer: getCompletedOver3Count("Medium", escapData.plan),

            overdue: getNotCompletedOver3Count("Medium", escapData.plan),

            upcoming: getCSCount("Medium", "upcoming", escapData.plan),

            total: getCSCount("Medium", "ontime", escapData.plan) +
              getCSCount("Medium", "buffer1", escapData.plan) +
              getCSCount("Medium", "buffer2", escapData.plan) +
              getCSCount("Medium", "buffer3", escapData.plan) +
              getCSCount("Medium", "under3", escapData.plan) +
              getNotCompletedOver3Count("Medium", escapData.plan) +
              getCompletedOver3Count("Medium", escapData.plan) +
              getCSCount("Medium", "upcoming", escapData.plan)
          },
          low: {
            ontime: getCSCount("Low", "ontime", escapData.plan),

            buffer1: getCSCount("Low", "buffer1", escapData.plan),
            buffer2: getCSCount("Low", "buffer2", escapData.plan),
            buffer3: getCSCount("Low", "buffer3", escapData.plan),
            // under3: getCSCount("Low", "under3", escapData.plan),
            // over3: getCSCount("Low", "over3", escapData.plan),
            afterBufer: getCompletedOver3Count("Low", escapData.plan),

            overdue: getNotCompletedOver3Count("Low", escapData.plan),

            upcoming: getCSCount("Low", "upcoming", escapData.plan),

            total: getCSCount("Low", "ontime", escapData.plan) +
              getCSCount("Low", "buffer1", escapData.plan) +
              getCSCount("Low", "buffer2", escapData.plan) +
              getCSCount("Low", "buffer3", escapData.plan) +
              getCSCount("Low", "under3", escapData.plan) +
              getNotCompletedOver3Count("Low", escapData.plan) +
              getCompletedOver3Count("Low", escapData.plan) +
              getCSCount("Low", "upcoming", escapData.plan)
          }
        },
        plan: escapData.plan,
        esgMetrics: calculateEsgMetrics(escapData.plan)
      }
    }





    //Construct metrics Here
    const currentM = computeEsgMetrics(currentMisConstruct.company, currentMisConstruct.ranking, currentMisConstruct.companyRaw, currentMisConstruct.rawData, currentMisConstruct.rankings, currentMisConstruct.scoreFormat);
    const prevM = computeEsgMetrics(prevMisConstruct.company, prevMisConstruct.ranking, prevMisConstruct.companyRaw, prevMisConstruct.rawData, prevMisConstruct.rankings, prevMisConstruct.scoreFormat);
    console.log('currentM :: ', currentM)
    console.log('prevM :: ', prevM)

    const compareResult = getQuarterAnalyticsWithTrend(
      currentM,
      rankingCards,
      esgCardCompare,
      company.brand
    );
    console.log('compareResult :: ', compareResult)
    if (format === 'docx') {
      // const blob = await generateEmailDOCX(company, ranking, companyRaw, rawData, rankings, overallProgress, scoreFormat);
      const blob = await generateEmailDOCXV4(currentMisConstruct.company, currentMisConstruct.ranking, currentMisConstruct.companyRaw, currentMisConstruct.rawData, currentMisConstruct.rankings, currentM, prevM, currentMisConstruct.overallProgress, currentMisConstruct.scoreFormat, esgCapTemplateData);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMisConstruct.brandSlug}_ESG_Email.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // const html = generateEmailHTML(company, ranking, companyRaw, rawData, rankings, overallProgress, scoreFormat);
      // const html = generateEmailHTMLV4(currentMisConstruct.company, currentMisConstruct.ranking, currentMisConstruct.companyRaw, currentMisConstruct.rawData, currentMisConstruct.rankings, currentMisConstruct.overallProgress, currentMisConstruct.scoreFormat, esgCapTemplateData, prevMisConstruct);
      const html = generateEmailHTMLV4(currentMisConstruct.company, currentMisConstruct.rankings, compareResult, esgCapTemplateData)
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMisConstruct.brandSlug}_ESG_Email.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!selectedCompanyId) { toast.error('Please select a company'); return; }

    const company = mockCompanies.find(c => c.id === selectedCompanyId);
    if (!company) { toast.error('Company not found'); return; }

    const ranking = rankings.find(r => r.companyId === selectedCompanyId);
    if (!ranking) { toast.error('Ranking data not available for this company'); return; }

    setGenerating(true);
    try {
      await handleDownload(selectedCompanyId);
      toast.success(`Email content downloaded for ${company.brand} (${format.toUpperCase()})`);
    } catch {
      toast.error('Failed to generate email');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    if (rankings.length === 0) { toast.error('Rankings not loaded yet'); return; }
    setGenerating(true);

    try {
      let count = 0;
      for (const company of eligibleCompanies) {
        if (await handleDownload(company.id)) count++;
      }
      toast.success(`Downloaded ${format.toUpperCase()} email content for ${count} companies`);
    } catch {
      toast.error('Failed to generate emails');
    } finally {
      setGenerating(false);
    }
  };


  const isReady = !rankingsLoading && !analyticsData.isLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="w-4 h-4 mr-2" />
          Generate Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Generate ESG Email Content
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Select Company</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a company..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {eligibleCompanies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="html" id="fmt-html" />
                <Label htmlFor="fmt-html" className="flex items-center gap-1.5 cursor-pointer text-sm font-normal">
                  <Code className="w-3.5 h-3.5" /> HTML
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="docx" id="fmt-docx" />
                <Label htmlFor="fmt-docx" className="flex items-center gap-1.5 cursor-pointer text-sm font-normal">
                  <FileText className="w-3.5 h-3.5" /> Word (.docx)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Score Format</Label>
            <RadioGroup value={scoreFormat} onValueChange={(v) => setScoreFormat(v as ScoreFormat)} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percentile" id="sf-pct" />
                <Label htmlFor="sf-pct" className="cursor-pointer text-sm font-normal">Percentile</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="category" id="sf-cat" />
                <Label htmlFor="sf-cat" className="cursor-pointer text-sm font-normal">Category</Label>
              </div>
            </RadioGroup>
          </div>

          {!isReady && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <p className="text-xs text-muted-foreground">Loading live data...</p>
            </div>
          )}

          {isReady && selectedCompanyId && (() => {
            const ranking = rankings.find(r => r.companyId === selectedCompanyId);
            const rawData = analyticsData.data?.quarterlyCombinedRawData || analyticsData.data?.companyRawData || [];
            const companyRaw = rawData.find(c => c.companyId === selectedCompanyId);
            const ord = (n: number) => `${n}${getOrdinalSuffix(n)}`;

            // Compute cohort percentiles matching ESGCategoryBreakdown (same filtering as download)
            const submitting = rawData.filter(c => Object.keys(c.kpis).length > 0);
            const envEligible = submitting.filter(c => (c as any).hasEnvironmentFeature);
            const getValid = (pool: typeof rawData, key: string): number[] =>
              pool.filter(c => { const v = (c.insights as any)?.[key]; return v !== undefined && v !== null && !isNaN(v); })
                .map(c => (c.insights as any)[key] as number);
            const envPoolP = getValid(envEligible, 'circularEconomyIndex');
            const socPoolP = getValid(submitting, 'socialScore');
            const govPoolP = getValid(submitting, 'governanceScore');
            const envP = companyRaw ? cohortPercentile(companyRaw.insights?.circularEconomyIndex ?? 0, envPoolP) : 0;
            const socP = companyRaw ? cohortPercentile(companyRaw.insights?.socialScore ?? 0, socPoolP) : 0;
            const govP = companyRaw ? cohortPercentile(companyRaw.insights?.governanceScore ?? 0, govPoolP) : 0;

            // Performance percentiles
            const allComplScores = rankings.map(r => r.completionPct);
            const allConsScores = rankings.map(r => r.consistencyPct);
            const allTimeScores = rankings.map(r => r.timelinessScore);
            const complP = ranking ? cohortPercentile(ranking.completionPct, allComplScores) : 0;
            const consP = ranking ? cohortPercentile(ranking.consistencyPct, allConsScores) : 0;
            const timeP = ranking ? cohortPercentile(ranking.timelinessScore, allTimeScores) : 0;

            return (
              <div className="rounded-lg border p-3 space-y-2 text-sm">
                <p className="font-medium">Preview (Live Data)</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-muted rounded p-2">
                    <p className="text-muted-foreground">Completeness</p>
                    <p className="font-bold">{ranking ? ord(complP) : 'N/A'}</p>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <p className="text-muted-foreground">Consistency</p>
                    <p className="font-bold">{ranking ? ord(consP) : 'N/A'}</p>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <p className="text-muted-foreground">Timeliness</p>
                    <p className="font-bold">{ranking ? ord(timeP) : 'N/A'}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">🌿 Environment:</span>
                    {!(companyRaw as any)?.hasEnvironmentFeature ? (
                      <span className="text-muted-foreground italic">NA — not applicable</span>
                    ) : (
                      <>
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${envP}%` }} />
                        </div>
                        <span className="font-bold w-12 text-right">{ord(envP)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">👥 Social:</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${socP}%` }} />
                    </div>
                    <span className="font-bold w-12 text-right">{ord(socP)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">🏛️ Governance:</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${govP}%` }} />
                    </div>
                    <span className="font-bold w-12 text-right">{ord(govP)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!selectedCompanyId || !isReady || generating}
              className="flex-1"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download for Selected
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateAll}
              disabled={!isReady || generating}
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              All Companies
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};




// ─────────────────────────────────────────────────────────────────────────
// SHARED HELPER — single source of truth for all percentile / pillar math.
// Both generateEmailHTML and generateEmailDOCX now call this once and just
// differ in how they *render* the result (HTML string vs docx Paragraphs).
//
// NOTE ON BEHAVIOR CHANGE: this uses the HTML version's logic
// (cohortPercentilev1, brand-aware, filtered to submittingRaw/envEligibleRaw).
// The old DOCX path used the legacy cohortPercentile() on unfiltered
// allCompaniesRaw, which could yield different numbers than the HTML email
// for the same company. After this refactor, DOCX and HTML will always
// match — but DOCX percentile *values* will change from what they were.
// ─────────────────────────────────────────────────────────────────────────

interface PillarMetric {
  key: 'circularEconomyIndex' | 'socialScore' | 'governanceScore';
  label: string;
  n: number;
  isNA: boolean;
  companyPctile: number;
  indAvg: number;
  revAvg: number;
}

interface EsgMetricsResult {
  industry: string;
  revenueStage: string;
  insights: any;
  password: string;
  ord: (n: number) => string;
  fmtScore: (p: number) => string;
  fmtBarLabel: (p: number) => string;
  // fmtScore: (p: number) => {grade:string,color:string} | string;
  // fmtBarLabel: (p: number) => {grade:string,color:string} |string;

  overallPercentile: number;
  completenessPercentile: number;
  consistencyPercentile: number;
  timelinessPercentile: number;

  esgCompositePercentile: number;
  esgCompositeIndAvg: number;
  esgCompositeRevAvg: number;
  esgPoolSize: number;

  // Order: Environment, Social, Governance
  pillars: PillarMetric[];
}

function computeEsgMetrics(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  scoreFormat: ScoreFormat = 'percentile',
): EsgMetricsResult {
  const insights = companyRaw?.insights || ({} as any);
  const industry = companyRaw?.industry || company.industry || '';
  const revenueStage = companyRaw?.revenueStage || company.revenueStage || '';

  // ─── Performance metric percentiles ───
  const allAvgScoresWithBrand = allRankings.map(r => ({
    score: Math.round(((r.completionPct + r.consistencyPct + r.timelinessScore) / 3) * 10) / 10,
    brand: r.brand,
  }));
  const allComplScoresWithBrand = allRankings.map(r => ({ score: r.completionPct, brand: r.brand }));
  const allConsScoresWithBrand = allRankings.map(r => ({ score: r.consistencyPct, brand: r.brand }));
  const allTimeScoresWithBrand = allRankings.map(r => ({ score: r.timelinessScore, brand: r.brand }));

  const myAvgScore = Math.round(((ranking.completionPct + ranking.consistencyPct + ranking.timelinessScore) / 3) * 10) / 10;
  const overallPercentile = cohortPercentilev1(myAvgScore, company.brand, allAvgScoresWithBrand);
  const completenessPercentile = cohortPercentilev1(ranking.completionPct, company.brand, allComplScoresWithBrand);
  const consistencyPercentile = cohortPercentilev1(ranking.consistencyPct, company.brand, allConsScoresWithBrand);
  const timelinessPercentile = cohortPercentilev1(ranking.timelinessScore, company.brand, allTimeScoresWithBrand);

  // ─── ESG pillar percentiles ───
  const pillarKeys = ['circularEconomyIndex', 'socialScore', 'governanceScore'] as const;
  const pillarLabels: Record<(typeof pillarKeys)[number], string> = {
    circularEconomyIndex: '🌿 Environment',
    socialScore: '👥 Social',
    governanceScore: '🏛️ Governance',
  };

  const submittingRaw = allCompaniesRaw.filter(c => Object.keys(c.kpis).length > 0);
  const envEligibleRaw = submittingRaw.filter(c => (c as any).hasEnvironmentFeature);

  const getValidScoresV1 = (pool: CompanyRawMetrics[], key: string): { score: number; brand: string }[] =>
    pool
      .filter(c => {
        const v = (c.insights as any)?.[key];
        return v !== undefined && v !== null && !isNaN(v);
      })
      .map(c => ({ score: (c.insights as any)[key] as number, brand: c.brand }));

  const envPool = getValidScoresV1(envEligibleRaw, 'circularEconomyIndex');
  const socPool = getValidScoresV1(submittingRaw, 'socialScore');
  const govPool = getValidScoresV1(submittingRaw, 'governanceScore');
  const esgPool = getValidScoresV1(submittingRaw, 'esgCompositeScore');
  const allPillarPools = [envPool, socPool, govPool];

  console.log('socPool', socPool)

  const envPercentile = cohortPercentilev1(insights.circularEconomyIndex ?? 0, company.brand, envPool);
  const socPercentile = cohortPercentilev1(insights.socialScore ?? 0, company.brand, socPool);
  const govPercentile = cohortPercentilev1(insights.governanceScore ?? 0, company.brand, govPool);
  const esgCompositePercentile = cohortPercentilev1(insights.esgCompositeScore ?? 0, company.brand, esgPool);

  const hasEnvFeature = (companyRaw as any)?.hasEnvironmentFeature;

  const pillars: PillarMetric[] = pillarKeys.map((key, i) => {
    const isNA = i === 0 && !hasEnvFeature;
    const pool = allPillarPools[i];
    const eligiblePool = i === 0 ? envEligibleRaw : submittingRaw;

    const indGroup = eligiblePool.filter(c => c.industry === industry && !isNaN((c.insights as any)?.[key] ?? NaN));
    const indAvg =
      indGroup.length > 0
        ? Math.round(indGroup.reduce((s, c) => s + cohortPercentilev1((c.insights as any)?.[key] ?? 0, c.brand, pool), 0) / indGroup.length)
        : 0;

    const revGroup = eligiblePool.filter(c => c.revenueStage === revenueStage && !isNaN((c.insights as any)?.[key] ?? NaN));
    const revAvg =
      revGroup.length > 0
        ? Math.round(revGroup.reduce((s, c) => s + cohortPercentilev1((c.insights as any)?.[key] ?? 0, c.brand, pool), 0) / revGroup.length)
        : 0;

    return {
      key,
      label: pillarLabels[key],
      n: pool.length,
      isNA,
      companyPctile: [envPercentile, socPercentile, govPercentile][i],
      indAvg,
      revAvg,
    };
  });

  // ─── ESG Composite sector / revenue cohort averages ───
  const esgIndGroup = submittingRaw.filter(c => c.industry === industry && !isNaN((c.insights as any)?.esgCompositeScore ?? NaN));
  const esgCompositeIndAvg =
    esgIndGroup.length > 0
      ? Math.round(esgIndGroup.reduce((s, c) => s + cohortPercentilev1((c.insights as any)?.esgCompositeScore ?? 0, c.brand, esgPool), 0) / esgIndGroup.length)
      : 0;
  const esgRevGroup = submittingRaw.filter(c => c.revenueStage === revenueStage && !isNaN((c.insights as any)?.esgCompositeScore ?? NaN));
  const esgCompositeRevAvg =
    esgRevGroup.length > 0
      ? Math.round(esgRevGroup.reduce((s, c) => s + cohortPercentilev1((c.insights as any)?.esgCompositeScore ?? 0, c.brand, esgPool), 0) / esgRevGroup.length)
      : 0;

  // ─── Formatting / misc ───
  const password = company.loginPassword || generateUniquePassword(company.companyCode);
  const ord = (n: number) => `${n}${getOrdinalSuffix(n)}`;
  const isCat = scoreFormat === 'category';
  const fmtScore = (p: number) => (isCat ? percentileToCategory(p) : `${ord(p)} percentile`);
  const fmtBarLabel = (p: number) => (isCat ? percentileToCategory(p) : String(p));

  return {
    industry,
    revenueStage,
    insights,
    password,
    ord,
    fmtScore,
    fmtBarLabel,
    overallPercentile,
    completenessPercentile,
    consistencyPercentile,
    timelinessPercentile,
    esgCompositePercentile,
    esgCompositeIndAvg,
    esgCompositeRevAvg,
    esgPoolSize: esgPool.length,
    pillars,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// HTML EMAIL — now just renders, doesn't compute.
// ─────────────────────────────────────────────────────────────────────────

function generateEmailHTMLV1(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  overallProgress: { filled: number; total: number; percentage: number },
  scoreFormat: ScoreFormat = 'percentile',
) {
  const m = computeEsgMetrics(company, ranking, companyRaw, allCompaniesRaw, allRankings, scoreFormat);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ESG Progress (Data Reporting) - ${company.brand}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#1e1e1e;line-height:1.6;max-width:680px;margin:0 auto;padding:24px;background:#ffffff;">

<h1 style="font-size:20px;color:#1a1a1a;margin:0 0 4px 0;">${company.brand}</h1>

<h2 style="font-size:17px;color:#2d2d2d;margin:8px 0 4px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">Progress (Data Reporting)</h2>
<p style="color:#6b7280;font-size:14px;margin:0 0 16px 0;">See how your ESG reporting compares to other portfolio companies (n=${41}).</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 20px 0;">
  <tr>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Overall</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${m.fmtScore(m.overallPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Completeness</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${m.fmtScore(m.completenessPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Consistency</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${m.fmtScore(m.consistencyPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Timeliness</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${m.fmtScore(m.timelinessPercentile)}</div>
    </td>
  </tr>
</table>

<h2 style="font-size:17px;color:#2d2d2d;margin:8px 0 4px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">Composite Scores List (Data Reporting)</h2>
<p style="color:#6b7280;font-size:14px;margin:0 0 16px 0;">See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).</p>


<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 20px 0;">
  <tr>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Composite Score</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${m.fmtScore(m.overallPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Environment</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${m.fmtScore(m.completenessPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Social</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${m.fmtScore(m.consistencyPercentile)}</div>
    </td>
    <td width="1%"></td>
    <td width="24%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Governance</strong></div>
      <div style="font-size:15px;font-weight:700;color:#059669;">${m.fmtScore(m.timelinessPercentile)}</div>
    </td>
  </tr>
</table>

<h2 style="font-size:17px;color:#2d2d2d;margin:28px 0 8px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">ESG&nbsp;Composite&nbsp;Score: ${m.fmtScore(m.esgCompositePercentile)} (n=${m.esgPoolSize})</h2>

<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">📊 ESG&nbsp;Composite (n=${m.esgPoolSize})</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Your ${scoreFormat === 'category' ? 'Category' : 'Percentile'}</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#3b82f6;height:14px;border-radius:3px;width:${m.esgCompositePercentile}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${m.fmtBarLabel(m.esgCompositePercentile)}</td></tr></table></td>
  </tr>
  <tr><td colspan="2" style="height:3px;"></td></tr>
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Sector Avg</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#22c55e;height:14px;border-radius:3px;width:${m.esgCompositeIndAvg}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${m.fmtBarLabel(m.esgCompositeIndAvg)}</td></tr></table></td>
  </tr>
  <tr><td colspan="2" style="height:3px;"></td></tr>
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Revenue Cohort Avg</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#f59e0b;height:14px;border-radius:3px;width:${m.esgCompositeRevAvg}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${m.fmtBarLabel(m.esgCompositeRevAvg)}</td></tr></table></td>
  </tr>
</table>

${m.pillars.map(p => {
    if (p.isNA) {
      return `
<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">${p.label}</div>
<div style="font-size:12px;color:#9ca3af;font-style:italic;margin-bottom:10px;">NA — not applicable</div>`;
    }
    return `
<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">${p.label} (n=${p.n})</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Your ${scoreFormat === 'category' ? 'Category' : 'Percentile'}</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#3b82f6;height:14px;border-radius:3px;width:${p.companyPctile}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${m.fmtBarLabel(p.companyPctile)}</td></tr></table></td>
  </tr>
  <tr><td colspan="2" style="height:3px;"></td></tr>
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Sector Avg</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#22c55e;height:14px;border-radius:3px;width:${p.indAvg}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${m.fmtBarLabel(p.indAvg)}</td></tr></table></td>
  </tr>
  <tr><td colspan="2" style="height:3px;"></td></tr>
  <tr>
    <td width="120" style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">Revenue Cohort Avg</td>
    <td style="padding:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;"><div style="background:#f59e0b;height:14px;border-radius:3px;width:${p.revAvg}%;"></div></td><td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">${m.fmtBarLabel(p.revAvg)}</td></tr></table></td>
  </tr>
</table>`;
  }).join('')}

<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin-top:20px;">
  <p style="margin:0 0 8px 0;font-style:italic;color:#374151;font-size:14px;">Curious how your metrics are calculated and how you compare with your sector and revenue peers? Log in to view your results and tailored ESG recommendations.</p>
  <p style="margin:0 0 6px 0;font-size:14px;"><strong>URL :</strong> <a href="https://fireside.fandoro.com/" style="color:#2563eb;font-weight:600;">https://fireside.fandoro.com/</a></p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
    <tr>
      <td style="font-weight:600;color:#374151;padding:2px 12px 2px 0;font-size:14px;">Login ID:</td>
      <td><span style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #d1d5db;font-size:14px;">${company.companyCode}</span></td>
    </tr>
    <tr>
      <td style="font-weight:600;color:#374151;padding:2px 12px 2px 0;font-size:14px;">Password:</td>
      <td><span style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #d1d5db;font-size:14px;">${m.password.replace(/&/g, '&amp;')}</span></td>
    </tr>
  </table>
</div>

<div style="background:#f3f4f6;border-radius:8px;padding:10px 14px;margin-top:20px;">
  <p style="margin:2px 0;font-size:13px;">For technical issues (<a href="mailto:sm@fandoro.com">sm@fandoro.com</a>) or data-related queries and further clarification (<a href="mailto:tarak@firesideventures.com">tarak@firesideventures.com</a>).</p>
</div>

<div style="margin-top:24px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;">
  Fireside Ventures &mdash; ESG Reporting Platform<br>
  This is a confidential communication intended solely for the recipient.
</div>

</body>
</html>`;
}

function generateEmailHTMLV2(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  overallProgress: { filled: number; total: number; percentage: number },
  scoreFormat: ScoreFormat = 'percentile',
) {
  const m = computeEsgMetrics(company, ranking, companyRaw, allCompaniesRaw, allRankings, scoreFormat);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ESG Progress (Data Reporting) - ${company.brand}</title>
</head>

<body style="font-family:Arial,Helvetica,sans-serif;color:#1e1e1e;line-height:1.6;max-width:680px;margin:0 auto;padding:24px;background:#ffffff;">

<h1 style="font-size:20px;color:#1a1a1a;margin:0 0 4px 0;">
  ${company.brand}
</h1>

<h2 style="font-size:17px;color:#2d2d2d;margin:8px 0 4px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">
  Progress (Data Reporting)
</h2>

<p style="color:#6b7280;font-size:14px;margin:0 0 16px 0;">
  See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).
</p>


<!-- ── ESG Score Cards ───────────────────────────────────── -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 20px 0;">
  <tr>

    <!-- Overall -->
    <td width="24%" valign="top"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 8px;text-align:center;">

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">
        Overall
      </div>

      <div style="font-size:26px;font-weight:700;color:#059669;line-height:1.2;">
        A
      </div>

      <div style="font-size:11px;color:#6b7280;margin-top:2px;">
        grade
      </div>

      <div style="margin-top:8px;">
        <span style="display:inline-block;background:#e5e7eb;color:#374151;font-size:9px;padding:3px 7px;border-radius:10px;">
          n=42
        </span>
      </div>

    </td>

    <td width="1%"></td>


    <!-- Completeness -->
    <td width="24%" valign="top"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 8px;text-align:center;">

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">
        Completeness
      </div>

      <div style="font-size:26px;font-weight:700;color:#059669;line-height:1.2;">
        A-
      </div>

      <div style="font-size:11px;color:#6b7280;margin-top:2px;">
        grade
      </div>

      <div style="margin-top:8px;">
        <span style="display:inline-block;background:#e5e7eb;color:#374151;font-size:9px;padding:3px 7px;border-radius:10px;">
          n=42
        </span>
      </div>

    </td>

    <td width="1%"></td>


    <!-- Consistency -->
    <td width="24%" valign="top"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 8px;text-align:center;">

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">
        Consistency
      </div>

      <div style="font-size:26px;font-weight:700;color:#2563eb;line-height:1.2;">
        B+
      </div>

      <div style="font-size:11px;color:#6b7280;margin-top:2px;">
        grade
      </div>

      <div style="margin-top:8px;">
        <span style="display:inline-block;background:#e5e7eb;color:#374151;font-size:9px;padding:3px 7px;border-radius:10px;">
          n=42
        </span>
      </div>

    </td>

    <td width="1%"></td>


    <!-- Timeliness -->
    <td width="24%" valign="top"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 8px;text-align:center;">

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">
        Timeliness
      </div>

      <div style="font-size:26px;font-weight:700;color:#d97706;line-height:1.2;">
        B
      </div>

      <div style="font-size:11px;color:#6b7280;margin-top:2px;">
        grade
      </div>

      <div style="margin-top:8px;">
        <span style="display:inline-block;background:#e5e7eb;color:#374151;font-size:9px;padding:3px 7px;border-radius:10px;">
          n=42
        </span>
      </div>

    </td>

  </tr>
</table>

<!-- ── ESG Score Cards ───────────────────────────────────── -->

<h2 style="font-size:17px;color:#2d2d2d;margin:24px 0 8px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">
  ESG Score Cards
</h2>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 20px 0;">
  <tr>

    <!-- Overall -->
    <td width="24%" valign="top"
        style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 8px;text-align:center;">

      <div style="text-align:right;font-size:16px;margin-bottom:2px;">
        📊
      </div>

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:5px;">
        Overall
      </div>

      <div style="font-size:28px;font-weight:700;color:#059669;line-height:1.1;">
        A
      </div>

      <div style="font-size:10px;color:#6b7280;margin-top:3px;">
        grade
      </div>

      <div style="margin-top:8px;">
        <span style="display:inline-block;background:#dcfce7;color:#166534;font-size:9px;font-weight:600;padding:3px 8px;border-radius:10px;">
          n=42
        </span>
      </div>

    </td>

    <td width="1%"></td>


    <!-- Completeness -->
    <td width="24%" valign="top"
        style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 8px;text-align:center;">

      <div style="text-align:right;font-size:16px;margin-bottom:2px;">
        ✓
      </div>

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:5px;">
        Completeness
      </div>

      <div style="font-size:28px;font-weight:700;color:#2563eb;line-height:1.1;">
        A-
      </div>

      <div style="font-size:10px;color:#6b7280;margin-top:3px;">
        grade
      </div>

      <div style="margin-top:8px;">
        <span style="display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:9px;font-weight:600;padding:3px 8px;border-radius:10px;">
          n=42
        </span>
      </div>

    </td>

    <td width="1%"></td>


    <!-- Consistency -->
    <td width="24%" valign="top"
        style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 8px;text-align:center;">

      <div style="text-align:right;font-size:16px;margin-bottom:2px;">
        🔄
      </div>

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:5px;">
        Consistency
      </div>

      <div style="font-size:28px;font-weight:700;color:#7c3aed;line-height:1.1;">
        B+
      </div>

      <div style="font-size:10px;color:#6b7280;margin-top:3px;">
        grade
      </div>

      <div style="margin-top:8px;">
        <span style="display:inline-block;background:#ede9fe;color:#6d28d9;font-size:9px;font-weight:600;padding:3px 8px;border-radius:10px;">
          n=42
        </span>
      </div>

    </td>

    <td width="1%"></td>


    <!-- Timeliness -->
    <td width="24%" valign="top"
        style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 8px;text-align:center;">

      <div style="text-align:right;font-size:16px;margin-bottom:2px;">
        ⏱
      </div>

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:5px;">
        Timeliness
      </div>

      <div style="font-size:28px;font-weight:700;color:#d97706;line-height:1.1;">
        B
      </div>

      <div style="font-size:10px;color:#6b7280;margin-top:3px;">
        grade
      </div>

      <div style="margin-top:8px;">
        <span style="display:inline-block;background:#fef3c7;color:#b45309;font-size:9px;font-weight:600;padding:3px 8px;border-radius:10px;">
          n=42
        </span>
      </div>

    </td>

  </tr>
</table>


<!-- ── Composite Scores List ───────────────────────────────────── -->

<h2 style="font-size:17px;color:#2d2d2d;margin:28px 0 4px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">
  Composite Scores List (Data Reporting)
</h2>

<p style="color:#6b7280;font-size:14px;margin:0 0 16px 0;">
  See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).
</p>


<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 20px 0;">
  <tr>

    <!-- Composite Score -->
    <td width="24%" valign="top"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">
        <strong>Composite Score</strong>
      </div>

      <div style="font-size:15px;font-weight:700;color:#059669;">
        ${m.fmtScore(m.overallPercentile)}
      </div>

    </td>

    <td width="1%"></td>


    <!-- Environment -->
    <td width="24%" valign="top"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">
        <strong>Environment</strong>
      </div>

      <div style="font-size:15px;font-weight:700;color:#059669;">
        ${m.fmtScore(m.completenessPercentile)}
      </div>

    </td>

    <td width="1%"></td>


    <!-- Social -->
    <td width="24%" valign="top"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">
        <strong>Social</strong>
      </div>

      <div style="font-size:15px;font-weight:700;color:#059669;">
        ${m.fmtScore(m.consistencyPercentile)}
      </div>

    </td>

    <td width="1%"></td>


    <!-- Governance -->
    <td width="24%" valign="top"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 8px;text-align:center;">

      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">
        <strong>Governance</strong>
      </div>

      <div style="font-size:15px;font-weight:700;color:#059669;">
        ${m.fmtScore(m.timelinessPercentile)}
      </div>

    </td>

  </tr>
</table>


<!-- ── ESG Composite Score ───────────────────────────────────── -->

<h1 style="font-size:17px;color:#2d2d2d;margin:28px 0 8px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">
  ESG&nbsp;Composite&nbsp;Score: ${m.fmtScore(m.esgCompositePercentile)} (n=${m.esgPoolSize})
</h1>


<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">
  📊 ESG&nbsp;Composite (n=${m.esgPoolSize})
</div>


<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">

  <tr>
    <td width="120"
        style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">
      Your ${scoreFormat === 'category' ? 'Category' : 'Percentile'}
    </td>

    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>

          <td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;">
            <div style="background:#3b82f6;height:14px;border-radius:3px;width:${m.esgCompositePercentile}%;"></div>
          </td>

          <td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">
            ${m.fmtBarLabel(m.esgCompositePercentile)}
          </td>

        </tr>
      </table>
    </td>
  </tr>


  <tr>
    <td colspan="2" style="height:3px;"></td>
  </tr>


  <tr>
    <td width="120"
        style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">
      Sector Avg
    </td>

    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>

          <td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;">
            <div style="background:#22c55e;height:14px;border-radius:3px;width:${m.esgCompositeIndAvg}%;"></div>
          </td>

          <td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">
            ${m.fmtBarLabel(m.esgCompositeIndAvg)}
          </td>

        </tr>
      </table>
    </td>
  </tr>


  <tr>
    <td colspan="2" style="height:3px;"></td>
  </tr>


  <tr>
    <td width="120"
        style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">
      Revenue Cohort Avg
    </td>

    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>

          <td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;">
            <div style="background:#f59e0b;height:14px;border-radius:3px;width:${m.esgCompositeRevAvg}%;"></div>
          </td>

          <td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">
            ${m.fmtBarLabel(m.esgCompositeRevAvg)}
          </td>

        </tr>
      </table>
    </td>
  </tr>

</table>


<!-- ── ESG Pillars ───────────────────────────────────── -->

${m.pillars.map(p => {

    if (p.isNA) {
      return `
<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">
  ${p.label}
</div>

<div style="font-size:12px;color:#9ca3af;font-style:italic;margin-bottom:10px;">
  NA — not applicable
</div>`;
    }

    return `
<div style="font-size:13px;font-weight:700;color:#374151;padding:4px 0 2px 0;">
  ${p.label} (n=${p.n})
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">

  <tr>

    <td width="120"
        style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">
      Your ${scoreFormat === 'category' ? 'Category' : 'Percentile'}
    </td>

    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>

          <td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;">
            <div style="background:#3b82f6;height:14px;border-radius:3px;width:${p.companyPctile}%;"></div>
          </td>

          <td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">
            ${m.fmtBarLabel(p.companyPctile)}
          </td>

        </tr>
      </table>
    </td>

  </tr>


  <tr>
    <td colspan="2" style="height:3px;"></td>
  </tr>


  <tr>

    <td width="120"
        style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">
      Sector Avg
    </td>

    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>

          <td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;">
            <div style="background:#22c55e;height:14px;border-radius:3px;width:${p.indAvg}%;"></div>
          </td>

          <td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">
            ${m.fmtBarLabel(p.indAvg)}
          </td>

        </tr>
      </table>
    </td>

  </tr>


  <tr>
    <td colspan="2" style="height:3px;"></td>
  </tr>


  <tr>

    <td width="120"
        style="font-size:10px;color:#6b7280;text-align:right;padding-right:8px;white-space:nowrap;">
      Revenue Cohort Avg
    </td>

    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>

          <td style="background:#f3f4f6;border-radius:3px;height:14px;padding:0;width:300px;">
            <div style="background:#f59e0b;height:14px;border-radius:3px;width:${p.revAvg}%;"></div>
          </td>

          <td style="font-size:10px;font-weight:600;color:#374151;padding-left:6px;white-space:nowrap;">
            ${m.fmtBarLabel(p.revAvg)}
          </td>

        </tr>
      </table>
    </td>

  </tr>

</table>`;

  }).join('')}


<!-- ── Login / Information Section ───────────────────────────────────── -->

<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin-top:20px;">

  <p style="margin:0 0 8px 0;font-style:italic;color:#374151;font-size:14px;">
    Curious how your metrics are calculated and how you compare with your sector and revenue peers?
    Log in to view your results and tailored ESG recommendations.
  </p>

  <p style="margin:0 0 6px 0;font-size:14px;">
    <strong>URL :</strong>
    <a href="https://fireside.fandoro.com/"
       style="color:#2563eb;font-weight:600;">
      https://fireside.fandoro.com/
    </a>
  </p>

  <table cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">

    <tr>
      <td style="font-weight:600;color:#374151;padding:2px 12px 2px 0;font-size:14px;">
        Login ID:
      </td>

      <td>
        <span style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #d1d5db;font-size:14px;">
          ${company.companyCode}
        </span>
      </td>
    </tr>

    <tr>
      <td style="font-weight:600;color:#374151;padding:2px 12px 2px 0;font-size:14px;">
        Password:
      </td>

      <td>
        <span style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #d1d5db;font-size:14px;">
          ${m.password.replace(/&/g, '&amp;')}
        </span>
      </td>
    </tr>

  </table>

</div>


<!-- ── Support Section ───────────────────────────────────── -->

<div style="background:#f3f4f6;border-radius:8px;padding:10px 14px;margin-top:20px;">

  <p style="margin:2px 0;font-size:13px;">
    For technical issues
    (<a href="mailto:sm@fandoro.com">sm@fandoro.com</a>)
    or data-related queries and further clarification
    (<a href="mailto:tarak@firesideventures.com">tarak@firesideventures.com</a>).
  </p>

</div>


<!-- ── Footer ───────────────────────────────────── -->

<div style="margin-top:24px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;">

  Fireside Ventures &mdash; ESG Reporting Platform
  <br>

  This is a confidential communication intended solely for the recipient.

</div>


</body>
</html>`;
}

// function generateEmailHTMLV3(
//   company: typeof mockCompanies[0],
//   ranking: CompanyRanking,
//   companyRaw: CompanyRawMetrics | undefined,
//   allCompaniesRaw: CompanyRawMetrics[],
//   allRankings: CompanyRanking[],
//   overallProgress: { filled: number; total: number; percentage: number },
//   scoreFormat: ScoreFormat = 'percentile',
//   esgCapTemplateData: {
//     complianceScore: number;
//     complianceRating: { grade: string; label: string; color: string };
//     priorityScore: {
//       high: {
//         ontime: number,
//         buffer1: number,
//         buffer2: number,
//         buffer3: number,
//         under3: number,
//         over3: number,
//         total: number
//       },
//       medium: {
//         ontime: number,
//         buffer1: number,
//         buffer2: number,
//         buffer3: number,
//         under3: number,
//         over3: number,
//         total: number
//       },
//       low: {
//         ontime: number,
//         buffer1: number,
//         buffer2: number,
//         buffer3: number,
//         under3: number,
//         over3: number,
//         total: number
//       }
//     },
//     plan: ESGCapItem[],
//     esgMetrics: {
//       dueThisMonth: number,
//       overdue: number,
//       partlySubmitted: number,
//       resubmitRequested: number,
//       submittedPendingReview: number,
//       closed: number,
//     }
//   },
//   prevMisConstruct:{}
// ) {
//   const m = computeEsgMetrics(company, ranking, companyRaw, allCompaniesRaw, allRankings, scoreFormat);

//   console.log('computeEsgMetrics :: m :: => ', m)
//   // const dummyCapItems = [
//   //   {
//   //     sno: 1,
//   //     capItem: 'PoSH, H&S & CoC Training',
//   //     priority: 'High',
//   //     targetDate: '22 Feb 2023',
//   //     companyStatus: 'Submitted',
//   //     investorStatus: 'Under Review',
//   //     completedOn: '',
//   //   },
//   //   {
//   //     sno: 2,
//   //     capItem: 'Plastic Reduction in Packaging',
//   //     priority: 'High',
//   //     targetDate: '24 Nov 2023',
//   //     companyStatus: 'Overdue',
//   //     investorStatus: '-',
//   //     completedOn: '',
//   //   },
//   //   {
//   //     sno: 3,
//   //     capItem: 'HR Policy Development',
//   //     priority: 'Medium',
//   //     targetDate: '13 Jun 2024',
//   //     companyStatus: 'Submitted',
//   //     investorStatus: 'Under Review',
//   //     completedOn: '',
//   //   },
//   //   {
//   //     sno: 4,
//   //     capItem: 'Human Rights Policy',
//   //     priority: 'Medium',
//   //     targetDate: '13 Jun 2024',
//   //     companyStatus: 'Overdue',
//   //     investorStatus: '-',
//   //     completedOn: '',
//   //   },
//   //   {
//   //     sno: 5,
//   //     capItem: 'Standalone ESG Policy',
//   //     priority: 'Medium',
//   //     targetDate: '13 Jun 2024',
//   //     companyStatus: 'Submitted',
//   //     investorStatus: 'Under Review',
//   //     completedOn: '',
//   //   },
//   //   {
//   //     sno: 6,
//   //     capItem: 'Supplier Code of Conduct',
//   //     priority: 'Low',
//   //     targetDate: '30 Jun 2024',
//   //     companyStatus: 'Closed',
//   //     investorStatus: 'Approved',
//   //     completedOn: '28 Jun 2024',
//   //   },
//   // ];
//   const dummyCapItems = esgCapTemplateData.plan.filter(item => item.dealCondition == 'CS');

//   return `<!DOCTYPE html>
// <html>
// <head>
// <meta charset="utf-8">
// <title>ESG Progress - ${company.brand}</title>
// </head>

// <body
//   style="
//     font-family:Arial,Helvetica,sans-serif;
//     color:#1e1e1e;
//     line-height:1.5;
//     max-width:900px;
//     margin:0 auto;
//     padding:24px;
//     background:#ffffff;
//   "
// >

// <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 4px 0;">
//   ${company.brand}
// </h1>

// <h2
//   style="
//     font-size:17px;
//     color:#2d2d2d;
//     margin:8px 0 4px 0;
//     border-bottom:2px solid #e5e7eb;
//     padding-bottom:6px;
//   "
// >
//   Progress (Data Reporting)
// </h2>

// <p
//   style="
//     color:#6b7280;
//     font-size:14px;
//     margin:0 0 16px 0;
//   "
// >
//   See how your ESG reporting compares to other portfolio companies
//   (n=${allRankings.length}).
// </p>



// <!-- ========================================================= -->
// <!-- YOUR EXISTING ESG SCORE CARDS CAN START HERE             -->
// <!-- ========================================================= -->


// <!-- ── ESG Score Cards ───────────────────────────────────── -->

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="margin:12px 0 20px 0;"
// >
// <tr>

// <td
//   width="24%"
//   valign="top"
//   style="
//     background:#f9fafb;
//     border:1px solid #e5e7eb;
//     border-radius:8px;
//     padding:12px 8px;
//     text-align:center;
//   "
// >

// <div
//   style="
//     font-size:10px;
//     font-weight:600;
//     color:#6b7280;
//     text-transform:uppercase;
//     letter-spacing:0.4px;
//     margin-bottom:6px;
//   "
// >
//   Overall
// </div>

// <div
//   style="
//     font-size:26px;
//     font-weight:700;
//     color:#059669;
//     line-height:1.2;
//   "
// >
//   ${m.fmtScore(m.overallPercentile)}
// </div>

// <div
//   style="
//     font-size:11px;
//     color:#6b7280;
//     margin-top:2px;
//   "
// >
//   grade
// </div>

// <div style="margin-top:8px;">
// <span
//   style="
//     display:inline-block;
//     background:#e5e7eb;
//     color:#374151;
//     font-size:9px;
//     padding:3px 7px;
//     border-radius:10px;
//   "
// >
//   n=${m.esgPoolSize}
// </span>
// </div>

// </td>


// <td width="1%"></td>


// <td
//   width="24%"
//   valign="top"
//   style="
//     background:#f9fafb;
//     border:1px solid #e5e7eb;
//     border-radius:8px;
//     padding:12px 8px;
//     text-align:center;
//   "
// >

// <div
//   style="
//     font-size:10px;
//     font-weight:600;
//     color:#6b7280;
//     text-transform:uppercase;
//     letter-spacing:0.4px;
//     margin-bottom:6px;
//   "
// >
//   Completeness
// </div>

// <div
//   style="
//     font-size:26px;
//     font-weight:700;
//     color:#059669;
//     line-height:1.2;
//   "
// >
// ${m.fmtScore(m.completenessPercentile)}
// </div>

// <div
//   style="
//     font-size:11px;
//     color:#6b7280;
//     margin-top:2px;
//   "
// >
//   grade
// </div>

// <div style="margin-top:8px;">
// <span
//   style="
//     display:inline-block;
//     background:#e5e7eb;
//     color:#374151;
//     font-size:9px;
//     padding:3px 7px;
//     border-radius:10px;
//   "
// >
//   n=${m.esgPoolSize}
// </span>
// </div>

// </td>


// <td width="1%"></td>


// <td
//   width="24%"
//   valign="top"
//   style="
//     background:#f9fafb;
//     border:1px solid #e5e7eb;
//     border-radius:8px;
//     padding:12px 8px;
//     text-align:center;
//   "
// >

// <div
//   style="
//     font-size:10px;
//     font-weight:600;
//     color:#6b7280;
//     text-transform:uppercase;
//     letter-spacing:0.4px;
//     margin-bottom:6px;
//   "
// >
//   Consistency
// </div>

// <div
//   style="
//     font-size:26px;
//     font-weight:700;
//     color:#2563eb;
//     line-height:1.2;
//   "
// >
// ${m.fmtScore(m.consistencyPercentile)}
// </div>

// <div
//   style="
//     font-size:11px;
//     color:#6b7280;
//     margin-top:2px;
//   "
// >
//   grade
// </div>

// <div style="margin-top:8px;">
// <span
//   style="
//     display:inline-block;
//     background:#e5e7eb;
//     color:#374151;
//     font-size:9px;
//     padding:3px 7px;
//     border-radius:10px;
//   "
// >
//   n=${m.esgPoolSize}
// </span>
// </div>

// </td>


// <td width="1%"></td>


// <td
//   width="24%"
//   valign="top"
//   style="
//     background:#f9fafb;
//     border:1px solid #e5e7eb;
//     border-radius:8px;
//     padding:12px 8px;
//     text-align:center;
//   "
// >

// <div
//   style="
//     font-size:10px;
//     font-weight:600;
//     color:#6b7280;
//     text-transform:uppercase;
//     letter-spacing:0.4px;
//     margin-bottom:6px;
//   "
// >
//   Timeliness
// </div>

// <div
//   style="
//     font-size:26px;
//     font-weight:700;
//     color:#d97706;
//     line-height:1.2;
//   "
// >
// ${m.fmtScore(m.timelinessPercentile)}
// </div>

// <div
//   style="
//     font-size:11px;
//     color:#6b7280;
//     margin-top:2px;
//   "
// >
//   grade
// </div>

// <div style="margin-top:8px;">
// <span
//   style="
//     display:inline-block;
//     background:#e5e7eb;
//     color:#374151;
//     font-size:9px;
//     padding:3px 7px;
//     border-radius:10px;
//   "
// >
//   n=${m.esgPoolSize}
// </span>
// </div>

// </td>

// </tr>
// </table>


// <!-- ========================================================= -->
// <!-- EXISTING CONTENT CAN CONTINUE BELOW                      -->
// <!-- ========================================================= -->


// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="margin:12px 0 20px 0;"
// >
// <tr>

// <td
//   width="24%"
//   style="
//     background:#f0fdf4;
//     border:1px solid #bbf7d0;
//     border-radius:8px;
//     padding:12px 8px;
//     text-align:center;
//   "
// >



// <div
//   style="
//     font-size:10px;
//     font-weight:600;
//     color:#6b7280;
//     text-transform:uppercase;
//   "
// >
//   ESG Composite Score
// </div>

// <div
//   style="
//     font-size:28px;
//     font-weight:700;
//     color:#059669;
//   "
// >
//   ${m.fmtScore(m.esgCompositePercentile)}
// </div>

// <div style="font-size:10px;color:#6b7280;">
//   grade
// </div>

// <div style="margin-top:8px;">
// <span
//   style="
//     display:inline-block;
//     background:#dcfce7;
//     color:#166534;
//     font-size:9px;
//     font-weight:600;
//     padding:3px 8px;
//     border-radius:10px;
//   "
// >
//   n=${m.esgPoolSize}
// </span>
// </div>

// </td>


// <td width="1%"></td>


// <td
//   width="24%"
//   style="
//     background:#eff6ff;
//     border:1px solid #bfdbfe;
//     border-radius:8px;
//     padding:12px 8px;
//     text-align:center;
//   "
// >



// <div
//   style="
//     font-size:10px;
//     font-weight:600;
//     color:#6b7280;
//     text-transform:uppercase;
//   "
// >
//   Environment Score
// </div>

// <div
//   style="
//     font-size:28px;
//     font-weight:700;
//     color:#2563eb;
//   "
// >
//   ${m.fmtScore(m.pillars[0].companyPctile)}
// </div>

// <div style="font-size:10px;color:#6b7280;">
//   grade
// </div>

// <div style="margin-top:8px;">
// <span
//   style="
//     display:inline-block;
//     background:#dbeafe;
//     color:#1d4ed8;
//     font-size:9px;
//     font-weight:600;
//     padding:3px 8px;
//     border-radius:10px;
//   "
// >
//   n=${m.pillars[0].n}
// </span>
// </div>

// </td>


// <td width="1%"></td>


// <td
//   width="24%"
//   style="
//     background:#f5f3ff;
//     border:1px solid #ddd6fe;
//     border-radius:8px;
//     padding:12px 8px;
//     text-align:center;
//   "
// >



// <div
//   style="
//     font-size:10px;
//     font-weight:600;
//     color:#6b7280;
//     text-transform:uppercase;
//   "
// >
//   Social Score
// </div>

// <div
//   style="
//     font-size:28px;
//     font-weight:700;
//     color:#7c3aed;
//   "
// >
// ${m.fmtScore(m.pillars[1].companyPctile)}
// </div>

// <div style="font-size:10px;color:#6b7280;">
//   grade
// </div>

// <div style="margin-top:8px;">
// <span
//   style="
//     display:inline-block;
//     background:#ede9fe;
//     color:#6d28d9;
//     font-size:9px;
//     font-weight:600;
//     padding:3px 8px;
//     border-radius:10px;
//   "
// >
//   n=${m.pillars[1].n}
// </span>
// </div>

// </td>


// <td width="1%"></td>


// <td
//   width="24%"
//   style="
//     background:#fffbeb;
//     border:1px solid #fde68a;
//     border-radius:8px;
//     padding:12px 8px;
//     text-align:center;
//   "
// >



// <div
//   style="
//     font-size:10px;
//     font-weight:600;
//     color:#6b7280;
//     text-transform:uppercase;
//   "
// >
//   Governance Score
// </div>

// <div
//   style="
//     font-size:28px;
//     font-weight:700;
//     color:#d97706;
//   "
// >
// ${m.fmtScore(m.pillars[2].companyPctile)}
// </div>

// <div style="font-size:10px;color:#6b7280;">
//   grade
// </div>

// <div style="margin-top:8px;">
// <span
//   style="
//     display:inline-block;
//     background:#fef3c7;
//     color:#b45309;
//     font-size:9px;
//     font-weight:600;
//     padding:3px 8px;
//     border-radius:10px;
//   "
// >
//   n=${m.pillars[2].n}
// </span>
// </div>

// </td>

// </tr>
// </table>

// <!-- ========================================================= -->
// <!-- COMPLIANCE SCORE + PRIORITY SUMMARY                       -->
// <!-- ========================================================= -->

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="margin:18px 0 16px 0;"
// >
// <tr>

// <!-- COMPLIANCE SCORE -->
// <td
//   width="25%"
//   valign="top"
//   style="padding:0 6px 0 0;"
// >

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="
//     background:#f0fdf4;
//     border:1px solid #d1fae5;
//     border-radius:8px;
//   "
// >
// <tr>
// <td
//   align="center"
//   style="padding:18px 10px 20px 10px;"
// >

// <div
//   style="
//     font-size:42px;
//     font-weight:700;
//     color:#ea580c;
//     line-height:1;
//     margin-bottom:4px;
//   "
// >
//   ${esgCapTemplateData.complianceRating.grade}%
// </div>

// <div
//   style="
//     font-size:12px;
//     color:#ea580c;
//     margin-bottom:18px;
//   "
// >
//   ${esgCapTemplateData.complianceRating.label}
// </div>

// <div
//   style="
//     width:40px;
//     height:1px;
//     background:#bbf7d0;
//     margin:0 auto 14px auto;
//   "
// ></div>

// <div
//   style="
//     font-size:14px;
//     font-weight:700;
//     color:#52698a;
//   "
// >
//   Compliance Score
// </div>

// </td>
// </tr>
// </table>

// </td>


// <!-- SPACE -->
// <td width="1%" style="font-size:0;">
//   &nbsp;
// </td>


// <!-- PRIORITY TABLE -->
// <td
//   width="74%"
//   valign="top"
// >

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="
//     border:1px solid #d1fae5;
//     border-radius:8px;
//     overflow:hidden;
//   "
// >

// <!-- HEADER -->
// <tr style="background:#f0fdf4;">

// <td
//   style="
//     padding:10px 5px;
//     font-size:9px;
//     font-weight:700;
//     color:#52698a;
//     text-align:center;
//   "
// >
//   PRIORITY
// </td>

// <td
//   style="
//     padding:10px 5px;
//     font-size:9px;
//     font-weight:700;
//     color:#059669;
//     text-align:center;
//   "
// >
//   Completed in Time
// </td>

// <td
//   style="
//     padding:10px 5px;
//     font-size:9px;
//     font-weight:700;
//     color:#65a30d;
//     text-align:center;
//   "
// >
//   Completed in Buffer Time
// </td>



// <td
//   style="
//     padding:10px 5px;
//     font-size:9px;
//     font-weight:700;
//     color:#ef4444;
//     text-align:center;
//   "
// >
//   Not completed / Completed after Buffer Time
// </td>

// <td
//   style="
//     padding:10px 5px;
//     font-size:9px;
//     font-weight:700;
//     color:#52698a;
//     text-align:center;
//   "
// >
//   Total
// </td>

// </tr>


// <!-- HIGH -->
// <tr>

// <td
//   style="
//     border-top:1px solid #e5e7eb;
//     padding:10px 5px;
//     text-align:center;
//     font-size:11px;
//     font-weight:600;
//     color:#dc2626;
//   "
// >
//   High
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.high.ontime}
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.high.buffer1}
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.high.over3}
// </td>

// <td
//   style="
//     border-top:1px solid #e5e7eb;
//     text-align:center;
//     font-size:11px;
//     color:#ef4444;
//   "
// >
//   ${esgCapTemplateData.priorityScore.high.total}
// </td>

// </tr>


// <!-- MEDIUM -->
// <tr>

// <td
//   style="
//     border-top:1px solid #e5e7eb;
//     padding:10px 5px;
//     text-align:center;
//     font-size:11px;
//     font-weight:600;
//     color:#d97706;
//   "
// >
//   Medium
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.medium.ontime}
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.medium.buffer1}
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.medium.under3}
// </td>

// <td
//   style="
//     border-top:1px solid #e5e7eb;
//     text-align:center;
//     font-size:11px;
//     color:#ef4444;
//   "
// >
//   ${esgCapTemplateData.priorityScore.medium.total}
// </td>

// </tr>


// <!-- LOW -->
// <tr>

// <td
//   style="
//     border-top:1px solid #e5e7eb;
//     padding:10px 5px;
//     text-align:center;
//     font-size:11px;
//     font-weight:600;
//     color:#64748b;
//   "
// >
//   Low
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.low.ontime}
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.low.buffer1}
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.low.under3}
// </td>

// <td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
//   ${esgCapTemplateData.priorityScore.low.total}
// </td>

// </tr>


// <!-- TOTAL -->
// <tr style="background:#ecfdf5;">

// <td
//   style="
//     border-top:1px solid #a7f3d0;
//     padding:11px 5px;
//     text-align:center;
//     font-size:11px;
//     font-weight:700;
//     color:#374151;
//   "
// >
//   Total
// </td>

// <td
//   style="
//     border-top:1px solid #a7f3d0;
//     text-align:center;
//     font-size:11px;
//     font-weight:700;
//     color:#059669;
//   "
// >
//   ${esgCapTemplateData.priorityScore.high.ontime + esgCapTemplateData.priorityScore.medium.ontime + esgCapTemplateData.priorityScore.low.ontime}
// </td>

// <td
//   style="
//     border-top:1px solid #a7f3d0;
//     text-align:center;
//     font-size:11px;
//     font-weight:700;
//     color:#059669;
//   "
// >
//   ${esgCapTemplateData.priorityScore.high.buffer1 + esgCapTemplateData.priorityScore.medium.buffer1 + esgCapTemplateData.priorityScore.low.buffer1}
// </td>



// <td
//   style="
//     border-top:1px solid #a7f3d0;
//     text-align:center;
//     font-size:11px;
//     font-weight:700;
//     color:#059669;
//   "
// >
//   ${esgCapTemplateData.priorityScore.high.under3 + esgCapTemplateData.priorityScore.medium.under3 + esgCapTemplateData.priorityScore.low.under3}
// </td>

// <td
//   style="
//     border-top:1px solid #a7f3d0;
//     text-align:center;
//     font-size:11px;
//     font-weight:700;
//     color:#059669;
//   "
// >
//   <span
//     style="
//       display:inline-block;
//       background:#a7f3d0;
//       border-radius:20px;
//       padding:4px 9px;
//     "
//   >
//     ${esgCapTemplateData.priorityScore.high.total + esgCapTemplateData.priorityScore.medium.total + esgCapTemplateData.priorityScore.low.total}
//   </span>
// </td>

// </tr>

// </table>

// </td>

// </tr>
// </table>


// <!-- ========================================================= -->
// <!-- STATUS SUMMARY                                            -->
// <!-- ========================================================= -->

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="
//     margin:0 0 18px 0;
//     border:1px solid #e5e7eb;
//     border-radius:8px;
//   "
// >
// <tr>

// <!-- DUE -->
// <td width="16.66%" style="padding:10px 4px;">

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="background:#fff7ed;border-radius:8px;"
// >
// <tr>
// <td align="center" style="padding:9px 3px;">

// <div style="font-size:18px;font-weight:700;color:#ea580c;">
//   ${esgCapTemplateData?.esgMetrics?.dueThisMonth}
// </div>

// <div style="font-size:8px;color:#ea580c;">
//   Due in this Month
// </div>

// </td>
// </tr>
// </table>

// </td>


// <!-- OVERDUE -->
// <td width="16.66%" style="padding:10px 4px;">

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="background:#fff1f2;border-radius:8px;"
// >
// <tr>
// <td align="center" style="padding:9px 3px;">

// <div style="font-size:18px;font-weight:700;color:#dc2626;">
//   ${esgCapTemplateData?.esgMetrics?.overdue}
// </div>

// <div style="font-size:8px;color:#dc2626;">
//   Overdue
// </div>

// </td>
// </tr>
// </table>

// </td>


// <!-- PARTIALLY SUBMITTED -->
// <td width="16.66%" style="padding:10px 4px;">

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="background:#eff6ff;border-radius:8px;"
// >
// <tr>
// <td align="center" style="padding:9px 3px;">

// <div style="font-size:18px;font-weight:700;color:#2563eb;">
//   ${esgCapTemplateData?.esgMetrics?.partlySubmitted}
// </div>

// <div style="font-size:8px;color:#2563eb;">
//   Partly Submitted
// </div>

// </td>
// </tr>
// </table>

// </td>


// <!-- RESUBMIT -->
// <td width="16.66%" style="padding:10px 4px;">

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="background:#fffbeb;border-radius:8px;"
// >
// <tr>
// <td align="center" style="padding:9px 3px;">

// <div style="font-size:18px;font-weight:700;color:#d97706;">
//   ${esgCapTemplateData?.esgMetrics?.resubmitRequested}
// </div>

// <div style="font-size:8px;color:#d97706;">
//   Re-submit Requested
// </div>

// </td>
// </tr>
// </table>

// </td>


// <!-- PENDING REVIEW -->
// <td width="16.66%" style="padding:10px 4px;">

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="background:#faf5ff;border-radius:8px;"
// >
// <tr>
// <td align="center" style="padding:9px 3px;">

// <div style="font-size:18px;font-weight:700;color:#9333ea;">
//   ${esgCapTemplateData?.esgMetrics?.submittedPendingReview}
// </div>

// <div style="font-size:8px;color:#9333ea;">
//   Submitted Pending Review
// </div>

// </td>
// </tr>
// </table>

// </td>


// <!-- CLOSED -->
// <td width="16.66%" style="padding:10px 4px;">

// <table
//   width="100%"
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="background:#f0fdf4;border-radius:8px;"
// >
// <tr>
// <td align="center" style="padding:9px 3px;">

// <div style="font-size:18px;font-weight:700;color:#16a34a;">
//   ${esgCapTemplateData?.esgMetrics?.closed} 
// </div>

// <div style="font-size:8px;color:#16a34a;">
//   Closed
// </div>

// </td>
// </tr>
// </table>

// </td>

// </tr>
// </table>








// <!-- ========================================================= -->
// <!-- LOGIN / INFORMATION                                       -->
// <!-- ========================================================= -->

// <div
//   style="
//     background:#eff6ff;
//     border:1px solid #bfdbfe;
//     border-radius:8px;
//     padding:12px 14px;
//     margin-top:20px;
//   "
// >

// <p
//   style="
//     margin:0 0 8px 0;
//     font-style:italic;
//     color:#374151;
//     font-size:14px;
//   "
// >
//   Curious how your metrics are calculated and how you compare with your
//   sector and revenue peers?
//   Log in to view your results and tailored ESG recommendations.
// </p>

// <p style="margin:0 0 6px 0;font-size:14px;">

// <strong>URL :</strong>

// <a
//   href="https://fireside.fandoro.ai/"
//   style="color:#2563eb;font-weight:600;"
// >
//   https://fireside.fandoro.ai/
// </a>

// </p>

// <table
//   cellpadding="0"
//   cellspacing="0"
//   border="0"
//   style="margin-top:4px;"
// >

// <tr>

// <td
//   style="
//     font-weight:600;
//     color:#374151;
//     padding:2px 12px 2px 0;
//     font-size:14px;
//   "
// >
//   Login ID:
// </td>

// <td>

// <span
//   style="
//     font-family:'Courier New',monospace;
//     background:#fff;
//     padding:2px 8px;
//     border-radius:4px;
//     border:1px solid #d1d5db;
//     font-size:14px;
//   "
// >
//   ${company.companyCode}
// </span>

// </td>

// </tr>


// <tr>

// <td
//   style="
//     font-weight:600;
//     color:#374151;
//     padding:2px 12px 2px 0;
//     font-size:14px;
//   "
// >
//   Password:
// </td>

// <td>

// <span
//   style="
//     font-family:'Courier New',monospace;
//     background:#fff;
//     padding:2px 8px;
//     border-radius:4px;
//     border:1px solid #d1d5db;
//     font-size:14px;
//   "
// >
//   ${m.password.replace(/&/g, '&amp;')}
// </span>

// </td>

// </tr>

// </table>

// </div>


// <!-- ========================================================= -->
// <!-- FOOTER                                                    -->
// <!-- ========================================================= -->

// <div
//   style="
//     margin-top:24px;
//     font-size:12px;
//     color:#9ca3af;
//     border-top:1px solid #e5e7eb;
//     padding-top:10px;
//   "
// >

// Fireside Ventures &mdash; ESG Reporting Platform
// <br>
// This is a confidential communication intended solely for the recipient.

// </div>


// </body>
// </html>`;
// }

// ─────────────────────────────────────────────────────────────────────────
// DOCX EMAIL — now just renders, doesn't compute. Uses the SAME m.* values
// as the HTML version above, so the two will always agree.
// ─────────────────────────────────────────────────────────────────────────



function generateEmailHTMLV4(
  company,
  allRankings,
  m,
  esgCapTemplateData
) {


  console.log('computeEsgMetrics :: m :: => ', m)
  // const dummyCapItems = [
  //   {
  //     sno: 1,
  //     capItem: 'PoSH, H&S & CoC Training',
  //     priority: 'High',
  //     targetDate: '22 Feb 2023',
  //     companyStatus: 'Submitted',
  //     investorStatus: 'Under Review',
  //     completedOn: '',
  //   },
  //   {
  //     sno: 2,
  //     capItem: 'Plastic Reduction in Packaging',
  //     priority: 'High',
  //     targetDate: '24 Nov 2023',
  //     companyStatus: 'Overdue',
  //     investorStatus: '-',
  //     completedOn: '',
  //   },
  //   {
  //     sno: 3,
  //     capItem: 'HR Policy Development',
  //     priority: 'Medium',
  //     targetDate: '13 Jun 2024',
  //     companyStatus: 'Submitted',
  //     investorStatus: 'Under Review',
  //     completedOn: '',
  //   },
  //   {
  //     sno: 4,
  //     capItem: 'Human Rights Policy',
  //     priority: 'Medium',
  //     targetDate: '13 Jun 2024',
  //     companyStatus: 'Overdue',
  //     investorStatus: '-',
  //     completedOn: '',
  //   },
  //   {
  //     sno: 5,
  //     capItem: 'Standalone ESG Policy',
  //     priority: 'Medium',
  //     targetDate: '13 Jun 2024',
  //     companyStatus: 'Submitted',
  //     investorStatus: 'Under Review',
  //     completedOn: '',
  //   },
  //   {
  //     sno: 6,
  //     capItem: 'Supplier Code of Conduct',
  //     priority: 'Low',
  //     targetDate: '30 Jun 2024',
  //     companyStatus: 'Closed',
  //     investorStatus: 'Approved',
  //     completedOn: '28 Jun 2024',
  //   },
  // ];
  // const dummyCapItems = esgCapTemplateData.plan.filter(item => item.dealCondition == 'CS');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ESG Progress - ${company.brand}</title>
</head>

<body
  style="
    font-family:Arial,Helvetica,sans-serif;
    color:#1e1e1e;
    line-height:1.5;
    max-width:900px;
    margin:0 auto;
    padding:24px;
    background:#ffffff;
  "
>

<h1 style="font-size:20px;color:#1a1a1a;margin:0 0 4px 0;">
  ${company.brand}
</h1>

<h2
  style="
    font-size:17px;
    color:#2d2d2d;
    margin:8px 0 4px 0;
    border-bottom:2px solid #e5e7eb;
    padding-bottom:6px;
  "
>
  Progress (Data Reporting)
</h2>

<p
  style="
    color:#6b7280;
    font-size:14px;
    margin:0 0 16px 0;
  "
>
  See how your ESG reporting compares to other portfolio companies
  (n=${41}).
</p>



<!-- ========================================================= -->
<!-- YOUR EXISTING ESG SCORE CARDS CAN START HERE             -->
<!-- ========================================================= -->


<!-- ── ESG Score Cards ───────────────────────────────────── -->

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="margin:12px 0 20px 0;"
>
<tr>

<td
  width="24%"
  valign="top"
  style="
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:8px;
    padding:12px 8px;
    text-align:center;
  "
>

<div
  style="
    font-size:15px;
    font-weight:600;
    color:#6b7280;
    text-transform:uppercase;
    letter-spacing:0.4px;
    margin-bottom:6px;
  "
>
  Responsiveness Score
</div>

<div
  style="
    font-size:20px;
    font-weight:700;
    color:${getGrade(m.overallPercentile)?.color};
    line-height:1.2;
  "
>
  ${m.fmtScore(m.overallPercentile)}
  ${getTrendIcon(m.indicators?.overallPercentile?.trend)}
</div>

<div
  style="
    font-size:11px;
    color:#6b7280;
    margin-top:2px;
  "
>
  grade
</div>

<div style="margin-top:8px;">
<span
  style="
    display:inline-block;
    background:#e5e7eb;
    color:${getGrade(m.overallPercentile)?.color};
    font-size:9px;
    padding:3px 7px;
    border-radius:10px;
  "
>
  n=${m.esgPoolSize}
</span>
</div>

</td>


<td width="1%"></td>


<td
  width="24%"
  valign="top"
  style="
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:8px;
    padding:12px 8px;
    text-align:center;
  "
>

<div
  style="
    font-size:10px;
    font-weight:600;
    color:#6b7280;
    text-transform:uppercase;
    letter-spacing:0.4px;
    margin-bottom:6px;
  "
>
  Completeness
</div>

<div
  style="
    font-size:20px;
    font-weight:700;
    color:${getGrade(m.completenessPercentile)?.color};
    line-height:1.2;
  "
>
${m.fmtScore(m.completenessPercentile)}
${getTrendIcon(m.indicators?.completenessPercentile?.trend)}

</div>

<div
  style="
    font-size:11px;
    color:#6b7280;
    margin-top:2px;
  "
>
  grade
</div>

<div style="margin-top:8px;">
<span
  style="
    display:inline-block;
    background:#e5e7eb;
    color:${getGrade(m.completenessPercentile)?.color};
    font-size:9px;
    padding:3px 7px;
    border-radius:10px;
  "
>
  n=${m.esgPoolSize}
</span>
</div>

</td>


<td width="1%"></td>


<td
  width="24%"
  valign="top"
  style="
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:8px;
    padding:12px 8px;
    text-align:center;
  "
>

<div
  style="
    font-size:10px;
    font-weight:600;
    color:#6b7280;
    text-transform:uppercase;
    letter-spacing:0.4px;
    margin-bottom:6px;
  "
>
  Consistency
</div>

<div
  style="
    font-size:20px;
    font-weight:700;
    color:${getGrade(m.consistencyPercentile)?.color};
    line-height:1.2;
  "
>
${m.fmtScore(m.consistencyPercentile)}
${getTrendIcon(m.indicators?.consistencyPercentile?.trend)}

</div>

<div
  style="
    font-size:11px;
    color:#6b7280;
    margin-top:2px;
  "
>
  grade
</div>

<div style="margin-top:8px;">
<span
  style="
    display:inline-block;
    background:#e5e7eb;
    color:${getGrade(m.consistencyPercentile)?.color};
    font-size:9px;
    padding:3px 7px;
    border-radius:10px;
  "
>
  n=${m.esgPoolSize}
</span>
</div>

</td>


<td width="1%"></td>


<td
  width="24%"
  valign="top"
  style="
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:8px;
    padding:12px 8px;
    text-align:center;
  "
>

<div
  style="
    font-size:10px;
    font-weight:600;
    color:#6b7280;
    text-transform:uppercase;
    letter-spacing:0.4px;
    margin-bottom:6px;
  "
>
  Timeliness
</div>

<div
  style="
    font-size:20px;
    font-weight:700;
    color:${getGrade(m.timelinessPercentile)?.color};
    line-height:1.2;
  "
>
${m.fmtScore(m.timelinessPercentile)} 
${getTrendIcon(m.indicators?.timelinessPercentile?.trend)}
</div>

<div
  style="
    font-size:11px;
    color:#6b7280;
    margin-top:2px;
  "
>
  grade
</div>

<div style="margin-top:8px;">
<span
  style="
    display:inline-block;
    background:#e5e7eb;
    color:${getGrade(m.timelinessPercentile)?.color};
    font-size:9px;
    padding:3px 7px;
    border-radius:10px;
  "
>
  n=${m.esgPoolSize}
</span>
</div>

</td>

</tr>
</table>
<div style="font-family: Arial, sans-serif; font-size: 11px; color: #111; line-height: 15px; margin-top: -16px;">
  <strong>*Responsiveness Score:</strong> Measures the completeness, consistency, and timeliness of ESG data reporting, benchmarked to the Fireside Portfolio.
</div>

<!-- ========================================================= -->
<!-- EXISTING CONTENT CAN CONTINUE BELOW                      -->
<!-- ========================================================= -->


<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="margin:12px 0 20px 0;"
>
<tr>

<td
  width="24%"
  style="
    background:#ffffff;
    border:1px solid #bbf7d0;
    border-radius:8px;
    padding:12px 8px;
    text-align:center;
  "
>



<div
  style="
    font-size:15px;
    font-weight:600;
    color:#6b7280;
    text-transform:uppercase;
  "
>
  ESG Performance Score
</div>

<div
  style="
    font-size:20px;
    font-weight:700;
    color:${getGrade(m.esgCompositePercentile)?.color}; 
  "
>
  ${m.fmtScore(m.esgCompositePercentile)} 
  ${getTrendIcon(m.indicators?.esgCompositePercentile?.trend)}
 
</div>

<div style="font-size:10px;color:#6b7280;">
  grade
</div>

<div style="margin-top:8px;">
<span
  style="
    display:inline-block;
    background:#e5e7eb;
    color:${getGrade(m.esgCompositePercentile)?.color}; 
    font-size:9px;
    font-weight:600;
    padding:3px 8px;
    border-radius:10px;
  "
>
  n=${m.esgPoolSize}
</span>
</div>

</td>


<td width="1%"></td>


<td
  width="24%"
  style="
    background:#ffffff;
    border:1px solid #bfdbfe;
    border-radius:8px;
    padding:12px 8px;
    text-align:center;
  "
>



<div
  style="
    font-size:10px;
    font-weight:600;
    color:#6b7280;
    text-transform:uppercase;
  "
>
  Environment Score
</div>

<div
  style="
    font-size:20px;
    font-weight:700;
    color:${m.indicators?.pillars[0]?.enabled
      ? getGrade(m.pillars[0].companyPctile)?.color
      : '#6B7280'}; 
  "
>
  ${m.indicators?.pillars[0]?.enabled ? m.fmtScore(m.pillars[0].companyPctile) : `N/A`}
   ${m.indicators?.pillars[0]?.enabled ? getTrendIcon(m.indicators?.pillars[0]?.companyPctileTrend) : ``}
    
</div>

<div style="font-size:10px;color:#6b7280;">
  grade
</div>

<div style="margin-top:8px;">
<span
  style="
    display:inline-block;
    background:#e5e7eb;
    color:${m.indicators?.pillars[0]?.enabled
      ? getGrade(m.pillars[0].companyPctile)?.color
      : '#6B7280'}; 
    font-size:9px;
    font-weight:600;
    padding:3px 8px;
    border-radius:10px;
  "
>
  n=${m.pillars[0].n}
</span>
</div>

</td>


<td width="1%"></td>


<td
  width="24%"
  style="
    background:#ffffff;
    border:1px solid #ddd6fe;
    border-radius:8px;
    padding:12px 8px;
    text-align:center;
  "
>



<div
  style="
    font-size:10px;
    font-weight:600;
    color:#6b7280;
    text-transform:uppercase;
  "
>
  Social Score
</div>

<div
  style="
    font-size:20px;
    font-weight:700;
    color:${m.indicators?.pillars[1]?.enabled
      ? getGrade(m.pillars[1].companyPctile)?.color
      : '#6B7280'}; 
  "
>

 ${m.indicators?.pillars[1]?.enabled ? m.fmtScore(m.pillars[1].companyPctile) : `N/A`}
   ${m.indicators?.pillars[1]?.enabled ? getTrendIcon(m.indicators?.pillars[1]?.companyPctileTrend) : ``}
</div>

<div style="font-size:10px;color:#6b7280;">
  grade
</div>

<div style="margin-top:8px;">
<span
  style="
    display:inline-block;
    background:#e5e7eb;
    color:${m.indicators?.pillars[1]?.enabled
      ? getGrade(m.pillars[1].companyPctile)?.color
      : '#6B7280'}; 
    font-size:9px;
    font-weight:600;
    padding:3px 8px;
    border-radius:10px;
  "
>
  n=${m.pillars[1].n}
</span>
</div>

</td>


<td width="1%"></td>


<td
  width="24%"
  style="
    background:#ffffff;
    border:1px solid #fde68a;
    border-radius:8px;
    padding:12px 8px;
    text-align:center;
  "
>



<div
  style="
    font-size:10px;
    font-weight:600;
    color:#6b7280;
    text-transform:uppercase;
  "
>
  Governance Score
</div>

<div
  style="
    font-size:20px;
    font-weight:700;
    color:${m.indicators?.pillars[2]?.enabled
      ? getGrade(m.pillars[2].companyPctile)?.color
      : '#6B7280'}; 
  "
>


 ${m.indicators?.pillars[2]?.enabled ? m.fmtScore(m.pillars[2].companyPctile) : `N/A`}
   ${m.indicators?.pillars[2]?.enabled ? getTrendIcon(m.indicators?.pillars[2]?.companyPctileTrend) : ``}
</div>

<div style="font-size:10px;color:#6b7280;">
  grade
</div>

<div style="margin-top:8px;">
<span
  style="
    display:inline-block;
    background:#e5e7eb;
    color:${m.indicators?.pillars[2]?.enabled
      ? getGrade(m.pillars[2].companyPctile)?.color
      : '#6B7280'}; 
    font-size:9px;
    font-weight:600;
    padding:3px 8px;
    border-radius:10px;
  "
>
  n=${m.pillars[2].n}
</span>
</div>

</td>

</tr>
</table>
<p style="font-family: Arial, sans-serif; font-size: 11px; color: #111; line-height: 15px; margin-top: -16px;">
  <strong>*ESG Performance Score:</strong> Measures overall performance across Environmental, Social, and Governance KPIs, benchmarked to the Fireside Portfolio.
</p>

<!-- ========================================================= -->
<!-- COMPLIANCE SCORE + PRIORITY SUMMARY                       -->
<!-- ========================================================= -->
${esgCapTemplateData ? `<h2 style="font-size:17px;color:#2d2d2d;margin:8px 0 4px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">ESGCAP Report</h2>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="margin:18px 0 16px 0;"
>
<tr>

<!-- COMPLIANCE SCORE -->
<td
  width="25%"
  valign="top"
  style="padding:0 6px 0 0;"
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    background:#f0fdf4;
    border:1px solid #d1fae5;
    border-radius:8px;
  "
>
<tr>
<td
  align="center"
  style="padding:18px 10px 20px 10px;"
>

<div
  style="
    font-size:42px;
    font-weight:700;
    color:#ea580c;
    line-height:1;
    margin-bottom:4px;
  "
>
  ${esgCapTemplateData.complianceRating.grade}
</div>

<div
  style="
    font-size:12px;
    color:#ea580c;
    margin-bottom:18px;
  "
>
  ${esgCapTemplateData.complianceRating.label}
</div>

<div
  style="
    width:40px;
    height:1px;
    background:#bbf7d0;
    margin:0 auto 14px auto;
  "
></div>

<div
  style="
    font-size:14px;
    font-weight:700;
    color:#52698a;
  "
>
  Compliance Score
</div>

</td>
</tr>
</table>

</td>


<!-- SPACE -->
<td width="1%" style="font-size:0;">
  &nbsp;
</td>


<!-- PRIORITY TABLE -->
<td
  width="74%"
  valign="top"
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    border:1px solid #d1fae5;
    border-radius:8px;
    overflow:hidden;
  "
>

<!-- HEADER -->
<tr style="background:#f0fdf4;">

<td
  style="
    padding:10px 5px;
    font-size:9px;
    font-weight:700;
    color:#111827;
    text-align:center;
  "
>
  PRIORITY
</td>

<td
  style="
    padding:10px 5px;
    font-size:9px;
    font-weight:700;
    color:#111827;
    text-align:center;
  "
>
  Completed in Time
</td>

<td
  style="
    padding:10px 5px;
    font-size:9px;
    font-weight:700;
    color:#111827;
    text-align:center;
  "
>
  Completed in Buffer Time
</td>



<td
  style="
    padding:10px 5px;
    font-size:9px;
    font-weight:700;
    color:#111827;
    text-align:center;
  "
>
  Completed After Buffer Time
</td>
<td
  style="
    padding:10px 5px;
    font-size:9px;
    font-weight:700;
    color:#111827;
    text-align:center;
  "
>
  Overdue
</td>
<td
  style="
    padding:10px 5px;
    font-size:9px;
    font-weight:700;
    color:#111827;
    text-align:center;
  "
>
  Upcoming
</td>

<td
  style="
    padding:10px 5px;
    font-size:9px;
    font-weight:700;
    color:#111827;
    text-align:center;
  "
>
  Total
</td>

</tr>


<!-- HIGH -->
<tr>

<td
  style="
    border-top:1px solid #e5e7eb;
    padding:10px 5px;
    text-align:center;
    font-size:11px;
    font-weight:600;
    color:#dc2626;
  "
>
  High
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.high.ontime}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.high.buffer1 + esgCapTemplateData.priorityScore.high.buffer2 + esgCapTemplateData.priorityScore.high.buffer3}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.high.afterBufer}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.high.overdue}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.high.upcoming}
</td>


<td
  style="
    border-top:1px solid #e5e7eb;
    text-align:center;
    font-size:11px;
    color:#ef4444;
  "
>
  ${esgCapTemplateData.priorityScore.high.total}
</td>

</tr>


<!-- MEDIUM -->
<tr>

<td
  style="
    border-top:1px solid #e5e7eb;
    padding:10px 5px;
    text-align:center;
    font-size:11px;
    font-weight:600;
    color:#d97706;
  "
>
  Medium
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.medium.ontime}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.medium.buffer1 + esgCapTemplateData.priorityScore.medium.buffer2 + esgCapTemplateData.priorityScore.medium.buffer3}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.medium.afterBufer}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.medium.overdue}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.medium.upcoming}
</td>


<td
  style="
    border-top:1px solid #e5e7eb;
    text-align:center;
    font-size:11px;
    color:#ef4444;
  "
>
    ${esgCapTemplateData.priorityScore.medium.total}
</td>

</tr>


<!-- LOW -->
<tr>

<td
  style="
    border-top:1px solid #e5e7eb;
    padding:10px 5px;
    text-align:center;
    font-size:11px;
    font-weight:600;
    color:#64748b;
  "
>
  Low
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.low.ontime}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.low.buffer1 + esgCapTemplateData.priorityScore.low.buffer2 + esgCapTemplateData.priorityScore.low.buffer3}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.low.afterBufer}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.low.overdue}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.low.upcoming}
</td>

<td style="border-top:1px solid #e5e7eb;text-align:center;font-size:11px;">
  ${esgCapTemplateData.priorityScore.low.total}
</td>

</tr>


<!-- TOTAL -->
<tr style="background:#ecfdf5;">

<td
  style="
    border-top:1px solid #a7f3d0;
    padding:11px 5px;
    text-align:center;
    font-size:11px;
    font-weight:700;
    color:#374151;
  "
>
  Total
</td>

<td
  style="
    border-top:1px solid #a7f3d0;
    text-align:center;
    font-size:11px;
    font-weight:700;
    color:#059669;
  "
>
  ${esgCapTemplateData.priorityScore.low.ontime +
      esgCapTemplateData.priorityScore.medium.ontime +
      esgCapTemplateData.priorityScore.high.ontime}
</td>

<td
  style="
    border-top:1px solid #a7f3d0;
    text-align:center;
    font-size:11px;
    font-weight:700;
    color:#059669;
  "
>
  ${esgCapTemplateData.priorityScore.high.buffer1 +
      esgCapTemplateData.priorityScore.medium.buffer1 +
      esgCapTemplateData.priorityScore.low.buffer1 +
      esgCapTemplateData.priorityScore.high.buffer2 +
      esgCapTemplateData.priorityScore.medium.buffer2 +
      esgCapTemplateData.priorityScore.low.buffer2 +
      esgCapTemplateData.priorityScore.high.buffer3 +
      esgCapTemplateData.priorityScore.medium.buffer3 +
      esgCapTemplateData.priorityScore.low.buffer3
      }
</td>



<td
  style="
    border-top:1px solid #a7f3d0;
    text-align:center;
    font-size:11px;
    font-weight:700;
    color:#059669;
  "
>
  ${esgCapTemplateData.priorityScore.high.afterBufer +
      esgCapTemplateData.priorityScore.medium.afterBufer +
      esgCapTemplateData.priorityScore.low.afterBufer
      }
</td>

<td
  style="
    border-top:1px solid #a7f3d0;
    text-align:center;
    font-size:11px;
    font-weight:700;
    color:#059669;
  "
>
  ${esgCapTemplateData.priorityScore.high.overdue +
      esgCapTemplateData.priorityScore.medium.overdue +
      esgCapTemplateData.priorityScore.low.overdue
      }
</td>

<td
  style="
    border-top:1px solid #a7f3d0;
    text-align:center;
    font-size:11px;
    font-weight:700;
    color:#059669;
  "
>
  ${esgCapTemplateData.priorityScore.high.upcoming +
      esgCapTemplateData.priorityScore.medium.upcoming +
      esgCapTemplateData.priorityScore.low.upcoming
      }
</td>

<td
  style="
    border-top:1px solid #a7f3d0;
    text-align:center;
    font-size:11px;
    font-weight:700;
    color:#059669;
  "
>
  <span
    style="
      display:inline-block;
      background:#a7f3d0;
      border-radius:20px;
      padding:4px 9px;
    "
  >
    ${esgCapTemplateData.priorityScore.high.total + esgCapTemplateData.priorityScore.medium.total + esgCapTemplateData.priorityScore.low.total}
  </span>
</td>

</tr>

</table>

</td>

</tr>
</table>


`: ""
    }







<!-- ========================================================= -->
<!-- LOGIN / INFORMATION                                       -->
<!-- ========================================================= -->

<div
  style="
    background:#eff6ff;
    border:1px solid #bfdbfe;
    border-radius:8px;
    padding:12px 14px;
    margin-top:20px;
  "
>

<p
  style="
    margin:0 0 8px 0;
    font-style:italic;
    color:#374151;
    font-size:14px;
  "
>
  Curious how your metrics are calculated and how you compare with your
  sector and revenue peers?
  Log in to view your results and tailored ESG recommendations.
</p>

<p style="margin:0 0 6px 0;font-size:14px;">

<strong>URL :</strong>

<a
  href="https://fireside.fandoro.com/"
  style="color:#2563eb;font-weight:600;"
>
  https://fireside.fandoro.com/
</a>

</p>

<table
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="margin-top:4px;"
>

<tr>

<td
  style="
    font-weight:600;
    color:#374151;
    padding:2px 12px 2px 0;
    font-size:14px;
  "
>
  Login ID:
</td>

<td>

<span
  style="
    font-family:'Courier New',monospace;
    background:#fff;
    padding:2px 8px;
    border-radius:4px;
    border:1px solid #d1d5db;
    font-size:14px;
  "
>
  ${company.companyCode}
</span>

</td>

</tr>


<tr>

<td
  style="
    font-weight:600;
    color:#374151;
    padding:2px 12px 2px 0;
    font-size:14px;
  "
>
  Password:
</td>

<td>

<span
  style="
    font-family:'Courier New',monospace;
    background:#fff;
    padding:2px 8px;
    border-radius:4px;
    border:1px solid #d1d5db;
    font-size:14px;
  "
>
  ${m.password.replace(/&/g, '&amp;')}
</span>

</td>

</tr>

</table>

</div>


<!-- ========================================================= -->
<!-- FOOTER                                                    -->
<!-- ========================================================= -->

<div
  style="
    margin-top:24px;
    font-size:12px;
    color:#9ca3af;
    border-top:1px solid #e5e7eb;
    padding-top:10px;
  "
>

Fireside Ventures &mdash; ESG Reporting Platform
<br>
This is a confidential communication intended solely for the recipient.

</div>


</body>
</html>`;
}

async function generateEmailDOCXV1(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  overallProgress: { filled: number; total: number; percentage: number },
  scoreFormat: ScoreFormat = 'percentile',
) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, ShadingType, BorderStyle } = await import('docx');

  const m = computeEsgMetrics(company, ranking, companyRaw, allCompaniesRaw, allRankings, scoreFormat);
  const isCat = scoreFormat === 'category';

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  const makeBarRow = (label: string, value: number, color: string) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: label, size: 18, color: '6B7280', font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 5500, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 0, right: 80 },
          children: [
            new Table({
              width: { size: 5000, type: WidthType.DXA },
              columnWidths: [Math.round(value * 50), Math.round((100 - value) * 50)],
              rows: [new TableRow({
                height: { value: 220, rule: 'exact' as any },
                children: [
                  new TableCell({
                    width: { size: Math.round(value * 50), type: WidthType.DXA },
                    shading: { fill: color, type: ShadingType.CLEAR },
                    borders: noBorders,
                    children: [new Paragraph({ children: [] })],
                  }),
                  new TableCell({
                    width: { size: Math.round((100 - value) * 50), type: WidthType.DXA },
                    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                    borders: noBorders,
                    children: [new Paragraph({ children: [] })],
                  }),
                ],
              })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 700, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: m.fmtBarLabel(value), size: 18, bold: true, color: '374151', font: 'Arial' })] })],
        }),
      ],
    });

  const pillarSections = m.pillars.flatMap(p => {
    if (p.isNA) {
      return [
        new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: p.label, size: 24, bold: true, color: '374151', font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'NA — not applicable', size: 22, italics: true, color: '9CA3AF', font: 'Arial' })] }),
      ];
    }
    return [
      new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: `${p.label} (n=${p.n})`, size: 24, bold: true, color: '374151', font: 'Arial' })] }),
      new Table({
        width: { size: 8200, type: WidthType.DXA },
        columnWidths: [2000, 5500, 700],
        rows: [
          makeBarRow(`Your ${isCat ? 'Category' : 'Percentile'}`, p.companyPctile, '3B82F6'),
          makeBarRow('Sector Avg', p.indAvg, '22C55E'),
          makeBarRow('Revenue Cohort Avg', p.revAvg, 'F59E0B'),
        ],
      }),
    ];
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: company.brand, size: 34, bold: true, color: '1A1A1A', font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Progress (Data Reporting)', size: 30, bold: true, color: '1A1A1A', font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: `See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).`, size: 24, color: '6B7280', font: 'Arial' })] }),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [2250, 2250, 2250, 2250],
          rows: [new TableRow({
            children: [
              { label: 'OVERALL', value: m.fmtScore(m.overallPercentile) },
              { label: 'COMPLETENESS', value: m.fmtScore(m.completenessPercentile) },
              { label: 'CONSISTENCY', value: m.fmtScore(m.consistencyPercentile) },
              { label: 'TIMELINESS', value: m.fmtScore(m.timelinessPercentile) },
            ].map(card => new TableCell({
              width: { size: 2250, type: WidthType.DXA },
              borders: cellBorders,
              shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
                    // new TextRun({ text: card.label, size: 16, bold: true, color: '6B7280', font: 'Arial' }),
                    new TextRun({
                      text: card.value,
                      size: card.label === 'OVERALL' ? 40 : 30,
                      bold: true,
                      color: '059669',
                      font: 'Arial',
                    })
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER, children: [
                    new TextRun({ text: card.value, size: 20, bold: true, color: '059669', font: 'Arial' }),
                  ]
                }),
              ],
            })),
          })],
        }),
        new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: `See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).`, size: 24, color: '6B7280', font: 'Arial' })] }),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        new Paragraph({
          spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB', space: 4 } }, children: [
            new TextRun({ text: `ESG Composite Score: ${m.fmtScore(m.esgCompositePercentile)} (n=${m.esgPoolSize}) — ${isCat ? 'Category' : 'Percentile'} Comparison`, size: 30, bold: true, color: '2D2D2D', font: 'Arial' }),
          ]
        }),

        new Table({
          width: { size: 8200, type: WidthType.DXA },
          columnWidths: [2700, 2700, 2800],
          rows: [new TableRow({
            children: [
              new TableCell({
                borders: noBorders, width: { size: 2700, type: WidthType.DXA }, children: [new Paragraph({
                  children: [
                    new TextRun({ text: '■ ', color: '3B82F6', size: 20, font: 'Arial' }),
                    new TextRun({ text: `Your ${isCat ? 'Category' : 'Percentile'}`, color: '6B7280', size: 20, font: 'Arial' }),
                  ]
                })]
              }),
              new TableCell({
                borders: noBorders, width: { size: 2700, type: WidthType.DXA }, children: [new Paragraph({
                  children: [
                    new TextRun({ text: '■ ', color: '22C55E', size: 20, font: 'Arial' }),
                    new TextRun({ text: 'Sector Avg', color: '6B7280', size: 20, font: 'Arial' }),
                  ]
                })]
              }),
              new TableCell({
                borders: noBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({
                  children: [
                    new TextRun({ text: '■ ', color: 'F59E0B', size: 20, font: 'Arial' }),
                    new TextRun({ text: 'Revenue Cohort Avg', color: '6B7280', size: 20, font: 'Arial' }),
                  ]
                })]
              }),
            ],
          })],
        }),

        new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: '📊 ESG\u00A0Composite', size: 24, bold: true, color: '374151', font: 'Arial' })] }),
        new Table({
          width: { size: 8200, type: WidthType.DXA },
          columnWidths: [2000, 5500, 700],
          rows: [
            makeBarRow(`Your ${isCat ? 'Category' : 'Percentile'}`, m.esgCompositePercentile, '3B82F6'),
            makeBarRow('Sector Avg', m.esgCompositeIndAvg, '22C55E'),
            makeBarRow('Revenue Cohort Avg', m.esgCompositeRevAvg, 'F59E0B'),
          ],
        }),

        ...pillarSections,

        new Paragraph({
          shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, spacing: { before: 400, after: 60 }, children: [
            new TextRun({ text: 'Curious how your metrics are calculated and how you compare with your sector and revenue peers? Log in to view your results and tailored ESG recommendations.', size: 22, italics: true, color: '374151', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, spacing: { after: 60 }, children: [
            new TextRun({ text: 'URL : ', size: 22, bold: true, color: '374151', font: 'Arial' }),
            new TextRun({ text: 'https://fireside.fandoro.com/', size: 22, bold: true, color: '2563EB', font: 'Arial' }),
          ]
        }),
        new Table({
          width: { size: 5000, type: WidthType.DXA },
          columnWidths: [1800, 3200],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: 'Login ID:', size: 22, bold: true, color: '374151', font: 'Arial' })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: company.companyCode, size: 22, font: 'Courier New' })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: 'Password:', size: 22, bold: true, color: '374151', font: 'Arial' })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: m.password, size: 22, font: 'Courier New' })] })] }),
              ]
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 300, after: 60 }, shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, children: [
            new TextRun({ text: 'For technical issues faced:', size: 22, bold: true, color: '374151', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 100 }, children: [
            new TextRun({ text: 'Contact Smita Mishra — sm@fandoro.com', size: 22, color: '374151', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 60 }, children: [
            new TextRun({ text: 'For data related issues:', size: 22, bold: true, color: '374151', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 200 }, children: [
            new TextRun({ text: 'Contact Tarak Doshi — tarak@firesideventures.com', size: 22, color: '374151', font: 'Arial' }),
          ]
        }),

        new Paragraph({
          spacing: { before: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB', space: 8 } }, children: [
            new TextRun({ text: 'Fireside Ventures — ESG Reporting Platform', size: 20, color: '9CA3AF', font: 'Arial' }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'This is a confidential communication intended solely for the recipient.', size: 20, color: '9CA3AF', font: 'Arial' }),
          ]
        }),
      ],
    }],
  });

  return Packer.toBlob(doc);
}

async function generateEmailDOCXV2(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  overallProgress: { filled: number; total: number; percentage: number },
  scoreFormat: ScoreFormat = 'percentile',
) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, ShadingType, BorderStyle } = await import('docx');

  const m = computeEsgMetrics(company, ranking, companyRaw, allCompaniesRaw, allRankings, scoreFormat);
  const isCat = scoreFormat === 'category';

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
  const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  const makeBarRow = (label: string, value: number, color: string) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: label, size: 18, color: '6B7280', font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: 5500, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 0, right: 80 },
          children: [
            new Table({
              width: { size: 5000, type: WidthType.DXA },
              columnWidths: [Math.round(value * 50), Math.round((100 - value) * 50)],
              rows: [new TableRow({
                height: { value: 220, rule: 'exact' as any },
                children: [
                  new TableCell({
                    width: { size: Math.round(value * 50), type: WidthType.DXA },
                    shading: { fill: color, type: ShadingType.CLEAR },
                    borders: noBorders,
                    children: [new Paragraph({ children: [] })],
                  }),
                  new TableCell({
                    width: { size: Math.round((100 - value) * 50), type: WidthType.DXA },
                    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                    borders: noBorders,
                    children: [new Paragraph({ children: [] })],
                  }),
                ],
              })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 700, type: WidthType.DXA },
          borders: noBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: m.fmtBarLabel(value), size: 18, bold: true, color: '374151', font: 'Arial' })] })],
        }),
      ],
    });

  const pillarSections = m.pillars.flatMap(p => {
    if (p.isNA) {
      return [
        new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: p.label, size: 24, bold: true, color: '374151', font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'NA — not applicable', size: 22, italics: true, color: '9CA3AF', font: 'Arial' })] }),
      ];
    }
    return [
      new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: `${p.label} (n=${p.n})`, size: 24, bold: true, color: '374151', font: 'Arial' })] }),
      new Table({
        width: { size: 8200, type: WidthType.DXA },
        columnWidths: [2000, 5500, 700],
        rows: [
          makeBarRow(`Your ${isCat ? 'Category' : 'Percentile'}`, p.companyPctile, '3B82F6'),
          makeBarRow('Sector Avg', p.indAvg, '22C55E'),
          makeBarRow('Revenue Cohort Avg', p.revAvg, 'F59E0B'),
        ],
      }),
    ];
  });

  // ─────────────────────────────────────────────────────────────
  // SCORE CARD DATA
  // ─────────────────────────────────────────────────────────────

  const scoreCards = [
    {
      label: 'RESPONSIVENESS SCORE',
      value: m.fmtScore(m.overallPercentile),
      color: '059669',
      fill: 'F0FDF4',
    },
    {
      label: 'COMPLETENESS',
      value: m.fmtScore(m.completenessPercentile),
      color: '2563EB',
      fill: 'EFF6FF',
    },
    {
      label: 'CONSISTENCY',
      value: m.fmtScore(m.consistencyPercentile),
      color: '7C3AED',
      fill: 'F5F3FF',
    },
    {
      label: 'TIMELINESS',
      value: m.fmtScore(m.timelinessPercentile),
      color: 'D97706',
      fill: 'FFFBEB',
    },
  ];

  const compositeCards = [
    {
      label: 'ESG PERFORMANCE SCORE',
      value: m.fmtScore(m.overallPercentile),
    },
    {
      label: 'ENVIRONMENT',
      value: m.fmtScore(m.completenessPercentile),
    },
    {
      label: 'SOCIAL',
      value: m.fmtScore(m.consistencyPercentile),
    },
    {
      label: 'GOVERNANCE',
      value: m.fmtScore(m.timelinessPercentile),
    },
  ];

  // Same-height card helper for both rows.
  const makeScoreCard = (
    label: string,
    value: string,
    color: string,
    fill: string,
    showGrade = true,
  ) =>
    new TableCell({
      width: { size: 2250, type: WidthType.DXA },
      borders: cellBorders,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 140, bottom: 140, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60, line: 220 },
          children: [
            new TextRun({
              text: label,
              size: 16,
              bold: true,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: showGrade ? 10 : 40, line: 260 },
          children: [
            new TextRun({
              text: value,
              size: showGrade ? 24 : 20,
              bold: true,
              color,
              font: 'Arial',
            }),
          ],
        }),

        ...(showGrade
          ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 25, line: 210 },
              children: [
                new TextRun({
                  text: 'grade',
                  size: 16,
                  color: '6B7280',
                  font: 'Arial',
                }),
              ],
            }),
          ]
          : []),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0, line: 190 },
          children: [
            new TextRun({
              text: `n=${allRankings.length}`,
              size: 14,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        }),
      ],
    });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: company.brand,
              size: 34,
              bold: true,
              color: '1A1A1A',
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: 'Progress (Data Reporting)',
              size: 30,
              bold: true,
              color: '1A1A1A',
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: `See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).`,
              size: 24,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        }),

        // ─────────────────────────────────────────────────────
        // ROW 1 — ESG SCORE CARDS
        // ─────────────────────────────────────────────────────
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [2250, 2250, 2250, 2250],
          rows: [
            new TableRow({
              height: { value: 1150, rule: 'atLeast' as any },
              children: scoreCards.map(card =>
                makeScoreCard(
                  card.label,
                  card.value,
                  card.color,
                  card.fill,
                  true,
                )
              ),
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [],
        }),

        // ─────────────────────────────────────────────────────
        // ROW 2 — COMPOSITE SCORE CARDS
        // ─────────────────────────────────────────────────────
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [2250, 2250, 2250, 2250],
          rows: [
            new TableRow({
              height: { value: 1150, rule: 'atLeast' as any },
              children: compositeCards.map(card =>
                makeScoreCard(
                  card.label,
                  card.value,
                  '059669',
                  'F0FDF4',
                  false,
                )
              ),
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 250, after: 200 },
          children: [],
        }),

        new Paragraph({
          spacing: { before: 300, after: 100 },
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 2,
              color: 'E5E7EB',
              space: 4,
            },
          },
          children: [
            new TextRun({
              text: `ESG Composite Score: ${m.fmtScore(m.esgCompositePercentile)} (n=${m.esgPoolSize}) — ${isCat ? 'Category' : 'Percentile'} Comparison`,
              size: 30,
              bold: true,
              color: '2D2D2D',
              font: 'Arial',
            }),
          ],
        }),

        new Table({
          width: { size: 8200, type: WidthType.DXA },
          columnWidths: [2700, 2700, 2800],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 2700, type: WidthType.DXA },
                  children: [new Paragraph({
                    children: [
                      new TextRun({ text: '■ ', color: '3B82F6', size: 20, font: 'Arial' }),
                      new TextRun({ text: `Your ${isCat ? 'Category' : 'Percentile'}`, color: '6B7280', size: 20, font: 'Arial' }),
                    ],
                  })],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 2700, type: WidthType.DXA },
                  children: [new Paragraph({
                    children: [
                      new TextRun({ text: '■ ', color: '22C55E', size: 20, font: 'Arial' }),
                      new TextRun({ text: 'Sector Avg', color: '6B7280', size: 20, font: 'Arial' }),
                    ],
                  })],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 2800, type: WidthType.DXA },
                  children: [new Paragraph({
                    children: [
                      new TextRun({ text: '■ ', color: 'F59E0B', size: 20, font: 'Arial' }),
                      new TextRun({ text: 'Revenue Cohort Avg', color: '6B7280', size: 20, font: 'Arial' }),
                    ],
                  })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [
            new TextRun({
              text: '📊 ESG\u00A0Composite',
              size: 24,
              bold: true,
              color: '374151',
              font: 'Arial',
            }),
          ],
        }),

        new Table({
          width: { size: 8200, type: WidthType.DXA },
          columnWidths: [2000, 5500, 700],
          rows: [
            makeBarRow(`Your ${isCat ? 'Category' : 'Percentile'}`, m.esgCompositePercentile, '3B82F6'),
            makeBarRow('Sector Avg', m.esgCompositeIndAvg, '22C55E'),
            makeBarRow('Revenue Cohort Avg', m.esgCompositeRevAvg, 'F59E0B'),
          ],
        }),

        ...pillarSections,

        new Paragraph({
          shading: { fill: 'EFF6FF', type: ShadingType.CLEAR },
          spacing: { before: 400, after: 60 },
          children: [
            new TextRun({
              text: 'Curious how your metrics are calculated and how you compare with your sector and revenue peers? Log in to view your results and tailored ESG recommendations.',
              size: 22,
              italics: true,
              color: '374151',
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          shading: { fill: 'EFF6FF', type: ShadingType.CLEAR },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'URL : ', size: 22, bold: true, color: '374151', font: 'Arial' }),
            new TextRun({ text: 'https://fireside.fandoro.com/', size: 22, bold: true, color: '2563EB', font: 'Arial' }),
          ],
        }),

        new Table({
          width: { size: 5000, type: WidthType.DXA },
          columnWidths: [1800, 3200],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1800, type: WidthType.DXA },
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Login ID:', size: 22, bold: true, color: '374151', font: 'Arial' })],
                  })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3200, type: WidthType.DXA },
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: [new Paragraph({
                    children: [new TextRun({ text: company.companyCode, size: 22, font: 'Courier New' })],
                  })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1800, type: WidthType.DXA },
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: [new Paragraph({
                    children: [new TextRun({ text: 'Password:', size: 22, bold: true, color: '374151', font: 'Arial' })],
                  })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3200, type: WidthType.DXA },
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: [new Paragraph({
                    children: [new TextRun({ text: m.password, size: 22, font: 'Courier New' })],
                  })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 300, after: 60 },
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
          children: [
            new TextRun({ text: 'For technical issues faced:', size: 22, bold: true, color: '374151', font: 'Arial' }),
          ],
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
          spacing: { after: 100 },
          children: [
            new TextRun({ text: 'Contact Smita Mishra — sm@fandoro.com', size: 22, color: '374151', font: 'Arial' }),
          ],
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'For data related issues:', size: 22, bold: true, color: '374151', font: 'Arial' }),
          ],
        }),
        new Paragraph({
          shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
          spacing: { after: 200 },
          children: [
            new TextRun({ text: 'Contact Tarak Doshi — tarak@firesideventures.com', size: 22, color: '374151', font: 'Arial' }),
          ],
        }),

        new Paragraph({
          spacing: { before: 400 },
          border: {
            top: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: 'E5E7EB',
              space: 8,
            },
          },
          children: [
            new TextRun({ text: 'Fireside Ventures — ESG Reporting Platform', size: 20, color: '9CA3AF', font: 'Arial' }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'This is a confidential communication intended solely for the recipient.',
              size: 20,
              color: '9CA3AF',
              font: 'Arial',
            }),
          ],
        }),
      ],
    }],
  });

  return Packer.toBlob(doc);
}


async function generateEmailDOCXV3(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  overallProgress: {
    filled: number;
    total: number;
    percentage: number;
  },
  scoreFormat: ScoreFormat = 'percentile',
  esgCapTemplateData: {
    complianceScore: number;
    complianceRating: { grade: string; label: string; color: string };
    priorityScore: {
      high: {
        ontime: number,
        buffer1: number,
        buffer2: number,
        buffer3: number,
        under3: number,
        over3: number,
        total: number
      },
      medium: {
        ontime: number,
        buffer1: number,
        buffer2: number,
        buffer3: number,
        under3: number,
        over3: number,
        total: number
      },
      low: {
        ontime: number,
        buffer1: number,
        buffer2: number,
        buffer3: number,
        under3: number,
        over3: number,
        total: number
      }
    },
    plan: ESGCapItem[],
    esgMetrics: {
      dueThisMonth: number,
      overdue: number,
      partlySubmitted: number,
      resubmitRequested: number,
      submittedPendingReview: number,
      closed: number,
    }
  }
) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    WidthType,
    ShadingType,
    BorderStyle,
  } = await import('docx');

  // ============================================================
  // ESG METRICS
  // ============================================================

  const m = computeEsgMetrics(
    company,
    ranking,
    companyRaw,
    allCompaniesRaw,
    allRankings,
    scoreFormat,
  );

  const isCat = scoreFormat === 'category';

  // ============================================================
  // COMMON BORDERS
  // ============================================================

  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  };

  const noBorders = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
  };

  const cellBorder = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'E5E7EB',
  };

  const cellBorders = {
    top: cellBorder,
    bottom: cellBorder,
    left: cellBorder,
    right: cellBorder,
  };

  const capBorder = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'D9E2EC',
  };

  const capBorders = {
    top: capBorder,
    bottom: capBorder,
    left: capBorder,
    right: capBorder,
  };

  // ============================================================
  // BAR ROW
  // ============================================================

  const makeBarRow = (
    label: string,
    value: number,
    color: string,
  ) =>
    new TableRow({
      children: [
        new TableCell({
          width: {
            size: 2000,
            type: WidthType.DXA,
          },

          borders: noBorders,

          margins: {
            top: 40,
            bottom: 40,
            left: 80,
            right: 80,
          },

          children: [
            new Paragraph({
              spacing: {
                before: 0,
                after: 0,
              },

              children: [
                new TextRun({
                  text: label,
                  size: 18,
                  color: '6B7280',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),

        new TableCell({
          width: {
            size: 5500,
            type: WidthType.DXA,
          },

          borders: noBorders,

          margins: {
            top: 40,
            bottom: 40,
            left: 0,
            right: 80,
          },

          children: [
            new Table({
              width: {
                size: 5000,
                type: WidthType.DXA,
              },

              columnWidths: [
                Math.max(
                  1,
                  Math.round(value * 50),
                ),
                Math.max(
                  1,
                  Math.round((100 - value) * 50),
                ),
              ],

              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: Math.max(
                          1,
                          Math.round(value * 50),
                        ),
                        type: WidthType.DXA,
                      },

                      shading: {
                        fill: color,
                        type: ShadingType.CLEAR,
                      },

                      borders: noBorders,

                      children: [
                        new Paragraph({
                          children: [],
                        }),
                      ],
                    }),

                    new TableCell({
                      width: {
                        size: Math.max(
                          1,
                          Math.round((100 - value) * 50),
                        ),
                        type: WidthType.DXA,
                      },

                      shading: {
                        fill: 'F3F4F6',
                        type: ShadingType.CLEAR,
                      },

                      borders: noBorders,

                      children: [
                        new Paragraph({
                          children: [],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new TableCell({
          width: {
            size: 700,
            type: WidthType.DXA,
          },

          borders: noBorders,

          margins: {
            top: 40,
            bottom: 40,
            left: 40,
            right: 80,
          },

          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: m.fmtBarLabel(value),
                  size: 18,
                  bold: true,
                  color: '374151',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
      ],
    });

  // ============================================================
  // ESG PILLARS
  // ============================================================

  const pillarSections = m.pillars.flatMap((p) => {
    if (p.isNA) {
      return [
        new Paragraph({
          spacing: {
            before: 200,
            after: 60,
          },

          children: [
            new TextRun({
              text: p.label,
              size: 24,
              bold: true,
              color: '374151',
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          spacing: {
            after: 100,
          },

          children: [
            new TextRun({
              text: 'NA — not applicable',
              size: 22,
              italics: true,
              color: '9CA3AF',
              font: 'Arial',
            }),
          ],
        }),
      ];
    }

    return [
      new Paragraph({
        spacing: {
          before: 200,
          after: 60,
        },

        children: [
          new TextRun({
            text: `${p.label} (n=${p.n})`,
            size: 24,
            bold: true,
            color: '374151',
            font: 'Arial',
          }),
        ],
      }),

      new Table({
        width: {
          size: 8200,
          type: WidthType.DXA,
        },

        columnWidths: [
          2000,
          5500,
          700,
        ],

        rows: [
          makeBarRow(
            `Your ${isCat ? 'Category' : 'Percentile'
            }`,
            p.companyPctile,
            '3B82F6',
          ),

          makeBarRow(
            'Sector Avg',
            p.indAvg,
            '22C55E',
          ),

          makeBarRow(
            'Revenue Cohort Avg',
            p.revAvg,
            'F59E0B',
          ),
        ],
      }),
    ];
  });

  // ============================================================
  // ESG SCORE CARDS
  // ============================================================

  const scoreCards = [
    {
      label: 'RESPONSIVENESS SCORE',
      value: m.fmtScore(
        m.overallPercentile,
      ),
      color: '059669',
      fill: 'F0FDF4',
    },

    {
      label: 'COMPLETENESS',
      value: m.fmtScore(
        m.completenessPercentile,
      ),
      color: '2563EB',
      fill: 'EFF6FF',
    },

    {
      label: 'CONSISTENCY',
      value: m.fmtScore(
        m.consistencyPercentile,
      ),
      color: '7C3AED',
      fill: 'F5F3FF',
    },

    {
      label: 'TIMELINESS',
      value: m.fmtScore(
        m.timelinessPercentile,
      ),
      color: 'D97706',
      fill: 'FFFBEB',
    },
  ];

  // ============================================================
  // COMPOSITE CARDS
  // ============================================================

  const compositeCards = [
    {
      label: 'COMPOSITE SCORE',
      value: m.fmtScore(
        m.esgCompositePercentile,
      ),
    },

    {
      label: 'ENVIRONMENT',
      value: m.fmtScore(
        m.pillars[0].companyPctile,
      ),
    },

    {
      label: 'SOCIAL',
      value: m.fmtScore(
        m.pillars[1].companyPctile,
      ),
    },

    {
      label: 'GOVERNANCE',
      value: m.fmtScore(
        m.pillars[2].companyPctile,
      ),
    },
  ];

  // ============================================================
  // SCORE CARD HELPER
  // ============================================================

  const makeScoreCard = (
    label: string,
    value: string,
    color: string,
    fill: string,
    showGrade = true,
  ) =>
    new TableCell({
      width: {
        size: 2250,
        type: WidthType.DXA,
      },

      borders: cellBorders,

      shading: {
        fill,
        type: ShadingType.CLEAR,
      },

      margins: {
        top: 140,
        bottom: 140,
        left: 100,
        right: 100,
      },

      verticalAlign: 'center' as any,

      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,

          spacing: {
            before: 0,
            after: 60,
            line: 220,
          },

          children: [
            new TextRun({
              text: label,
              size: 16,
              bold: true,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,

          spacing: {
            before: 0,
            after: showGrade ? 10 : 40,
            line: 260,
          },

          children: [
            new TextRun({
              text: value,
              size: showGrade ? 24 : 20,
              bold: true,
              color,
              font: 'Arial',
            }),
          ],
        }),

        ...(showGrade
          ? [
            new Paragraph({
              alignment:
                AlignmentType.CENTER,

              spacing: {
                before: 0,
                after: 25,
                line: 210,
              },

              children: [
                new TextRun({
                  text: 'grade',
                  size: 16,
                  color: '6B7280',
                  font: 'Arial',
                }),
              ],
            }),
          ]
          : []),

        new Paragraph({
          alignment: AlignmentType.CENTER,

          spacing: {
            before: 0,
            after: 0,
            line: 190,
          },

          children: [
            new TextRun({
              text: `n=${allRankings.length}`,
              size: 14,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        }),
      ],
    });

  // ============================================================
  // ESCAP DUMMY DATA
  // ============================================================

  const dummyCapItems = [
    {
      sno: 1,
      capItem:
        'PoSH, H&S & CoC Training',
      priority: 'High',
      targetDate: '22 Feb 2023',
      companyStatus: 'Submitted',
      investorStatus: 'Under Review',
      completedOn: '',
    },

    {
      sno: 2,
      capItem:
        'Plastic Reduction in Packaging',
      priority: 'High',
      targetDate: '24 Nov 2023',
      companyStatus: 'Overdue',
      investorStatus: '-',
      completedOn: '',
    },

    {
      sno: 3,
      capItem:
        'HR Policy Development',
      priority: 'Medium',
      targetDate: '13 Jun 2024',
      companyStatus: 'Submitted',
      investorStatus: 'Under Review',
      completedOn: '',
    },

    {
      sno: 4,
      capItem:
        'Human Rights Policy',
      priority: 'Medium',
      targetDate: '13 Jun 2024',
      companyStatus: 'Overdue',
      investorStatus: '-',
      completedOn: '',
    },

    {
      sno: 5,
      capItem:
        'Standalone ESG Policy',
      priority: 'Medium',
      targetDate: '13 Jun 2024',
      companyStatus: 'Submitted',
      investorStatus: 'Under Review',
      completedOn: '',
    },

    {
      sno: 6,
      capItem:
        'Supplier Code of Conduct',
      priority: 'Low',
      targetDate: '30 Jun 2024',
      companyStatus: 'Closed',
      investorStatus: 'Approved',
      completedOn: '28 Jun 2024',
    },
  ];

  // ============================================================
  // ESCAP PRIORITY SUMMARY
  // ============================================================

  const prioritySummary = [
    {
      priority: 'High',
      color: 'DC2626',
      completedInTime: esgCapTemplateData.priorityScore.high.ontime,
      buffer1: esgCapTemplateData.priorityScore.high.buffer1,
      notCompleted: esgCapTemplateData.priorityScore.high.under3,
      total: esgCapTemplateData.priorityScore.high.total,
    },

    {
      priority: 'Medium',
      color: 'D97706',
      completedInTime: esgCapTemplateData.priorityScore.medium.ontime,
      buffer1: esgCapTemplateData.priorityScore.medium.buffer1,
      notCompleted: esgCapTemplateData.priorityScore.medium.under3,
      total: esgCapTemplateData.priorityScore.medium.total,
    },

    {
      priority: 'Low',
      color: '64748B',
      completedInTime: esgCapTemplateData.priorityScore.low.ontime,
      buffer1: esgCapTemplateData.priorityScore.low.buffer1,
      notCompleted: esgCapTemplateData.priorityScore.low.under3,
      total: esgCapTemplateData.priorityScore.low.total,
    },
  ];

  // ============================================================
  // ESCAP HEADER CELL
  // ============================================================

  const capHeaderCell = (
    text: string,
    width: number,
    align: any = AlignmentType.CENTER,
  ) =>
    new TableCell({
      width: {
        size: width,
        type: WidthType.DXA,
      },

      shading: {
        fill: 'F1F5F9',
        type: ShadingType.CLEAR,
      },

      borders: capBorders,

      margins: {
        top: 80,
        bottom: 80,
        left: 25,
        right: 25,
      },

      verticalAlign: 'center' as any,

      children: [
        new Paragraph({
          alignment: align,

          spacing: {
            before: 0,
            after: 0,
            line: 240,
          },

          children: [
            new TextRun({
              text,
              size: 9,
              bold: true,
              color: '111827',
              font: 'Arial',
            }),
          ],
        }),
      ],
    });

  // ============================================================
  // ESCAP PRIORITY ROW
  // ============================================================

  const makePriorityRow = (
    item: typeof prioritySummary[number],
  ) =>
    new TableRow({
      cantSplit: true,

      children: [
        // PRIORITY
        new TableCell({
          width: {
            size: 700,
            type: WidthType.DXA,
          },

          borders: capBorders,

          margins: {
            top: 55,
            bottom: 55,
            left: 15,
            right: 15,
          },

          verticalAlign: 'center' as any,

          children: [
            new Paragraph({
              alignment:
                AlignmentType.CENTER,

              spacing: {
                before: 0,
                after: 0,
              },

              children: [
                new TextRun({
                  text: item.priority,
                  size: 11,
                  bold: true,
                  color: '111827',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),

        // DATA VALUES
        ...[
          item.completedInTime,
          item.buffer1,
          item.notCompleted,
          item.total
        ].map(
          (value, index) =>
            new TableCell({
              width: {
                size:
                  index === 4
                    ? 1650
                    : 950,
                type: WidthType.DXA,
              },

              borders: capBorders,

              margins: {
                top: 55,
                bottom: 55,
                left: 15,
                right: 15,
              },

              verticalAlign:
                'center' as any,

              children: [
                new Paragraph({
                  alignment:
                    AlignmentType.CENTER,

                  spacing: {
                    before: 0,
                    after: 0,
                  },

                  children: [
                    new TextRun({
                      text: String(value),
                      size: 11,
                      color:
                        index === 4
                          ? 'EF4444'
                          : '111827',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
        ),

        // TOTAL
        // new TableCell({
        //   width: {
        //     size: 850,
        //     type: WidthType.DXA,
        //   },

        //   borders: capBorders,

        //   margins: {
        //     top: 55,
        //     bottom: 55,
        //     left: 15,
        //     right: 15,
        //   },

        //   verticalAlign:
        //     'center' as any,

        //   children: [
        //     new Paragraph({
        //       alignment:
        //         AlignmentType.CENTER,

        //       spacing: {
        //         before: 0,
        //         after: 0,
        //       },

        //       children: [
        //         new TextRun({
        //           text: String(item.total),
        //           size: 11,
        //           color:
        //             item.notCompleted > 0
        //               ? 'EF4444'
        //               : '111827',
        //           font: 'Arial',
        //         }),
        //       ],
        //     }),
        //   ],
        // }),
      ],
    });

  // ============================================================
  // CAP ITEM ROW
  // ============================================================

  // const makeCapItemRow = (
  //   item: typeof dummyCapItems[number],
  // ) => {
  //   const priorityStyle =
  //     item.priority === 'High'
  //       ? {
  //         fill: 'FECACA',
  //         color: 'DC2626',
  //       }
  //       : item.priority === 'Medium'
  //         ? {
  //           fill: 'FEF08A',
  //           color: 'A16207',
  //         }
  //         : {
  //           fill: 'E2E8F0',
  //           color: '475569',
  //         };

  //   const companyStatusStyle =
  //     item.companyStatus === 'Overdue'
  //       ? {
  //         fill: 'FEE2E2',
  //         color: 'DC2626',
  //       }
  //       : item.companyStatus === 'Closed'
  //         ? {
  //           fill: 'DCFCE7',
  //           color: '15803D',
  //         }
  //         : {
  //           fill: 'F3E8FF',
  //           color: '9333EA',
  //         };

  //   const investorStatusStyle =
  //     item.investorStatus ===
  //       'Under Review'
  //       ? {
  //         fill: 'DBEAFE',
  //         color: '1D4ED8',
  //       }
  //       : item.investorStatus ===
  //         'Approved'
  //         ? {
  //           fill: 'DCFCE7',
  //           color: '15803D',
  //         }
  //         : {
  //           fill: 'F1F5F9',
  //           color: '64748B',
  //         };

  //   const itemColor =
  //     item.companyStatus === 'Overdue'
  //       ? 'DC2626'
  //       : '111827';

  //   return new TableRow({
  //     cantSplit: true,

  //     children: [
  //       // S.NO
  //       new TableCell({
  //         width: {
  //           size: 450,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 75,
  //           bottom: 75,
  //           left: 15,
  //           right: 15,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: String(item.sno),
  //                 size: 11,
  //                 color: itemColor,
  //                 font: 'Arial',
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // CAP ITEM
  //       new TableCell({
  //         width: {
  //           size: 2350,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 75,
  //           bottom: 75,
  //           left: 40,
  //           right: 25,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: item.capItem,
  //                 size: 11,
  //                 color: itemColor,
  //                 font: 'Arial',
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // PRIORITY
  //       new TableCell({
  //         width: {
  //           size: 800,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 60,
  //           bottom: 60,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: item.priority,
  //                 size: 9,
  //                 bold: true,
  //                 color:
  //                   priorityStyle.color,
  //                 font: 'Arial',

  //                 shading: {
  //                   fill:
  //                     priorityStyle.fill,
  //                   type:
  //                     ShadingType.CLEAR,
  //                 },
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // TARGET DATE
  //       new TableCell({
  //         width: {
  //           size: 1100,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 75,
  //           bottom: 75,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: item.targetDate,
  //                 size: 10,
  //                 color: itemColor,
  //                 font: 'Arial',
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // COMPANY STATUS
  //       new TableCell({
  //         width: {
  //           size: 1200,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 60,
  //           bottom: 60,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text:
  //                   item.companyStatus ===
  //                     'Overdue'
  //                     ? '× Overdue'
  //                     : item.companyStatus ===
  //                       'Closed'
  //                       ? '✓ Closed'
  //                       : '◷ Submitted',

  //                 size: 8,
  //                 bold: true,
  //                 color:
  //                   companyStatusStyle.color,
  //                 font: 'Arial',

  //                 shading: {
  //                   fill:
  //                     companyStatusStyle.fill,
  //                   type:
  //                     ShadingType.CLEAR,
  //                 },
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // INVESTOR STATUS
  //       new TableCell({
  //         width: {
  //           size: 1350,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 60,
  //           bottom: 60,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text:
  //                   item.investorStatus ===
  //                     '-'
  //                     ? '-'
  //                     : item.investorStatus ===
  //                       'Approved'
  //                       ? '✓ Approved'
  //                       : '◷ Under Review',

  //                 size: 8,
  //                 bold: true,
  //                 color:
  //                   investorStatusStyle.color,
  //                 font: 'Arial',

  //                 shading: {
  //                   fill:
  //                     investorStatusStyle.fill,
  //                   type:
  //                     ShadingType.CLEAR,
  //                 },
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // COMPLETED ON
  //       new TableCell({
  //         width: {
  //           size: 900,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 75,
  //           bottom: 75,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text:
  //                   item.completedOn ||
  //                   '',
  //                 size: 9,
  //                 color: '475569',
  //                 font: 'Arial',
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // ACTIONS
  //       new TableCell({
  //         width: {
  //           size: 850,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 60,
  //           bottom: 60,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: '✎ Update',
  //                 size: 8,
  //                 bold: true,
  //                 color: 'FFFFFF',
  //                 font: 'Arial',

  //                 shading: {
  //                   fill: '34B882',
  //                   type:
  //                     ShadingType.CLEAR,
  //                 },
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //     ],
  //   });
  // };

  // ============================================================
  // ESCAP STATUS CARDS
  // ============================================================

  const capStatusCards = [
    {
      value: '0',
      label: 'Due in this Month',
      color: 'EA580C',
      fill: 'FFF7ED',
    },

    {
      value: '3',
      label: 'Overdue',
      color: 'DC2626',
      fill: 'FFF1F2',
    },

    {
      value: '1',
      label: 'Partly Submitted',
      color: '2563EB',
      fill: 'EFF6FF',
    },

    {
      value: '0',
      label: 'Re-submit Requested',
      color: 'D97706',
      fill: 'FFFBEB',
    },

    {
      value: '3',
      label: 'Submitted Pending Review',
      color: '9333EA',
      fill: 'FAF5FF',
    },

    {
      value: '3',
      label: 'Closed',
      color: '16A34A',
      fill: 'F0FDF4',
    },
  ];

  // ============================================================
  // DOCUMENT
  // ============================================================

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22,
          },
        },
      },
    },

    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },

        children: [
          // ======================================================
          // COMPANY
          // ======================================================

          new Paragraph({
            spacing: {
              after: 60,
            },

            children: [
              new TextRun({
                text: company.brand,
                size: 34,
                bold: true,
                color: '1A1A1A',
                font: 'Arial',
              }),
            ],
          }),

          // ======================================================
          // 1. OVERALL RANKING
          // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 80,
          //     after: 60,
          //   },

          //   border: {
          //     bottom: {
          //       style: BorderStyle.SINGLE,
          //       size: 2,
          //       color: 'E5E7EB',
          //       space: 4,
          //     },
          //   },

          //   children: [
          //     new TextRun({
          //       text: 'Overall Ranking',
          //       size: 30,
          //       bold: true,
          //       color: '1A1A1A',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // new Paragraph({
          //   spacing: {
          //     after: 180,
          //   },

          //   children: [
          //     new TextRun({
          //       text:
          //         `See how your ESG reporting compares to other portfolio companies (n=${allRankings.length}).`,
          //       size: 20,
          //       color: '6B7280',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // new Table({
          //   width: {
          //     size: 9000,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     3000,
          //     3000,
          //     3000,
          //   ],

          //   rows: [
          //     new TableRow({
          //       cantSplit: true,

          //       children: [
          //         new TableCell({
          //           width: {
          //             size: 3000,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F0FDF4',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: cellBorders,

          //           margins: {
          //             top: 160,
          //             bottom: 160,
          //             left: 80,
          //             right: 80,
          //           },

          //           verticalAlign:
          //             'center' as any,

          //           children: [
          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text: 'OVERALL',
          //                   size: 15,
          //                   bold: true,
          //                   color: '6B7280',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),

          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               spacing: {
          //                 before: 40,
          //                 after: 20,
          //               },

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     m.fmtScore(
          //                       m.overallPercentile,
          //                     ),
          //                   size: 28,
          //                   bold: true,
          //                   color: '059669',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),

          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     `${isCat
          //                       ? 'Category'
          //                       : 'Percentile'
          //                     } Score`,
          //                   size: 14,
          //                   color: '6B7280',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           width: {
          //             size: 3000,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'EFF6FF',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: cellBorders,

          //           margins: {
          //             top: 160,
          //             bottom: 160,
          //             left: 80,
          //             right: 80,
          //           },

          //           verticalAlign:
          //             'center' as any,

          //           children: [
          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text: 'PORTFOLIO',
          //                   size: 15,
          //                   bold: true,
          //                   color: '6B7280',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),

          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               spacing: {
          //                 before: 40,
          //                 after: 20,
          //               },

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     `n=${allRankings.length}`,
          //                   size: 28,
          //                   bold: true,
          //                   color: '2563EB',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),

          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     'Companies Compared',
          //                   size: 14,
          //                   color: '6B7280',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           width: {
          //             size: 3000,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'FFFBEB',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: cellBorders,

          //           margins: {
          //             top: 160,
          //             bottom: 160,
          //             left: 80,
          //             right: 80,
          //           },

          //           verticalAlign:
          //             'center' as any,

          //           children: [
          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     'DATA REPORTING',
          //                   size: 15,
          //                   bold: true,
          //                   color: '6B7280',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),

          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               spacing: {
          //                 before: 40,
          //                 after: 20,
          //               },

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     `${overallProgress.percentage}%`,
          //                   size: 28,
          //                   bold: true,
          //                   color: 'D97706',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),

          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     `${overallProgress.filled}/${overallProgress.total} completed`,
          //                   size: 14,
          //                   color: '6B7280',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),
          //       ],
          //     }),
          //   ],
          // }),

          // ======================================================
          // 2. ESG SCORE CARDS
          // ======================================================

          new Paragraph({
            spacing: {
              before: 280,
              after: 90,
            },

            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 2,
                color: 'E5E7EB',
                space: 4,
              },
            },

            children: [
              new TextRun({
                text: 'Progress (Data Reporting)',
                size: 28,
                bold: true,
                color: '2D2D2D',
                font: 'Arial',
              }),
            ],
          }),

          new Table({
            width: {
              size: 9000,
              type: WidthType.DXA,
            },

            columnWidths: [
              2250,
              2250,
              2250,
              2250,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children:
                  scoreCards.map(
                    (card) =>
                      makeScoreCard(
                        card.label,
                        card.value,
                        card.color,
                        card.fill,
                        true,
                      ),
                  ),
              }),
            ],
          }),

          // ======================================================
          // 3. COMPOSITE CARDS
          // ======================================================

          new Paragraph({
            spacing: {
              before: 100,
              after: 60,
            },

            children: [],
          }),

          new Table({
            width: {
              size: 9000,
              type: WidthType.DXA,
            },

            columnWidths: [
              2250,
              2250,
              2250,
              2250,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children:
                  compositeCards.map(
                    (card) =>
                      makeScoreCard(
                        card.label,
                        card.value,
                        '059669',
                        'F0FDF4',
                        false,
                      ),
                  ),
              }),
            ],
          }),

          // ======================================================
          // 4. ESG COMPOSITE SCORE
          // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 280,
          //     after: 100,
          //   },

          //   border: {
          //     bottom: {
          //       style: BorderStyle.SINGLE,
          //       size: 2,
          //       color: 'E5E7EB',
          //       space: 4,
          //     },
          //   },

          //   children: [
          //     new TextRun({
          //       text:
          //         `ESG Composite Score: ${m.fmtScore(
          //           m.esgCompositePercentile,
          //         )} (n=${m.esgPoolSize}) — ${isCat
          //           ? 'Category'
          //           : 'Percentile'
          //         } Comparison`,
          //       size: 28,
          //       bold: true,
          //       color: '2D2D2D',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // new Table({
          //   width: {
          //     size: 8200,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     2700,
          //     2700,
          //     2800,
          //   ],

          //   rows: [
          //     new TableRow({
          //       children: [
          //         new TableCell({
          //           borders: noBorders,

          //           width: {
          //             size: 2700,
          //             type: WidthType.DXA,
          //           },

          //           children: [
          //             new Paragraph({
          //               children: [
          //                 new TextRun({
          //                   text: '■ ',
          //                   color: '3B82F6',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),

          //                 new TextRun({
          //                   text:
          //                     `Your ${isCat
          //                       ? 'Category'
          //                       : 'Percentile'
          //                     }`,
          //                   color: '6B7280',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           borders: noBorders,

          //           width: {
          //             size: 2700,
          //             type: WidthType.DXA,
          //           },

          //           children: [
          //             new Paragraph({
          //               children: [
          //                 new TextRun({
          //                   text: '■ ',
          //                   color: '22C55E',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),

          //                 new TextRun({
          //                   text:
          //                     'Sector Avg',
          //                   color: '6B7280',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           borders: noBorders,

          //           width: {
          //             size: 2800,
          //             type: WidthType.DXA,
          //           },

          //           children: [
          //             new Paragraph({
          //               children: [
          //                 new TextRun({
          //                   text: '■ ',
          //                   color: 'F59E0B',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),

          //                 new TextRun({
          //                   text:
          //                     'Revenue Cohort Avg',
          //                   color: '6B7280',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),
          //       ],
          //     }),
          //   ],
          // }),

          // new Paragraph({
          //   spacing: {
          //     before: 160,
          //     after: 60,
          //   },

          //   children: [
          //     new TextRun({
          //       text: 'ESG Composite',
          //       size: 23,
          //       bold: true,
          //       color: '374151',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // new Table({+
          //   width: {
          //     size: 8200,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     2000,
          //     5500,
          //     700,
          //   ],

          //   rows: [
          //     makeBarRow(
          //       `Your ${isCat
          //         ? 'Category'
          //         : 'Percentile'
          //       }`,
          //       m.esgCompositePercentile,
          //       '3B82F6',
          //     ),

          //     makeBarRow(
          //       'Sector Avg',
          //       m.esgCompositeIndAvg,
          //       '22C55E',
          //     ),

          //     makeBarRow(
          //       'Revenue Cohort Avg',
          //       m.esgCompositeRevAvg,
          //       'F59E0B',
          //     ),
          //   ],
          // }),

          // // ======================================================
          // // 5. ESG PILLARS
          // // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 280,
          //     after: 90,
          //   },

          //   border: {
          //     bottom: {
          //       style: BorderStyle.SINGLE,
          //       size: 2,
          //       color: 'E5E7EB',
          //       space: 4,
          //     },
          //   },

          //   children: [
          //     new TextRun({
          //       text: 'ESG Pillars',
          //       size: 28,
          //       bold: true,
          //       color: '2D2D2D',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // ...pillarSections,

          // // ======================================================
          // // 6. ESCAP SCORE
          // // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 350,
          //     after: 70,
          //   },

          //   border: {
          //     bottom: {
          //       style: BorderStyle.SINGLE,
          //       size: 2,
          //       color: 'E5E7EB',
          //       space: 4,
          //     },
          //   },

          //   children: [
          //     new TextRun({
          //       text: 'eSCAP Score',
          //       size: 30,
          //       bold: true,
          //       color: '2D2D2D',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // new Paragraph({
          //   spacing: {
          //     after: 120,
          //   },

          //   children: [
          //     new TextRun({
          //       text:
          //         'Compliance and action-plan status across ESG requirements',
          //       size: 20,
          //       color: '6B7280',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [],
          }),

          // ======================================================
          // 7. COMPLIANCE SCORE + PRIORITY TABLE
          // ======================================================

          new Table({
            width: {
              size: 9000,
              type: WidthType.DXA,
            },

            columnWidths: [
              1900,
              7100,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children: [
                  // ==================================================
                  // COMPLIANCE SCORE
                  // ==================================================

                  new TableCell({
                    width: {
                      size: 1900,
                      type: WidthType.DXA,
                    },

                    borders: capBorders,

                    shading: {
                      fill: 'F0FDF4',
                      type:
                        ShadingType.CLEAR,
                    },

                    margins: {
                      top: 130,
                      bottom: 130,
                      left: 60,
                      right: 60,
                    },

                    verticalAlign:
                      'center' as any,

                    children: [
                      new Paragraph({
                        alignment:
                          AlignmentType.CENTER,

                        spacing: {
                          before: 0,
                          after: 5,
                        },

                        children: [
                          new TextRun({
                            text: esgCapTemplateData.complianceRating.grade,
                            size: 48,
                            bold: true,
                            color: 'EA580C',
                            font: 'Arial',
                          }),
                        ],
                      }),

                      new Paragraph({
                        alignment:
                          AlignmentType.CENTER,

                        spacing: {
                          before: 0,
                          after: 35,
                        },

                        children: [
                          new TextRun({
                            text: esgCapTemplateData.complianceRating.label,
                            size: 14,
                            color: 'EA580C',
                            font: 'Arial',
                          }),
                        ],
                      }),

                      new Paragraph({
                        alignment:
                          AlignmentType.CENTER,

                        spacing: {
                          before: 0,
                          after: 35,
                        },

                        children: [
                          new TextRun({
                            text: '────────',
                            size: 8,
                            color: 'BBF7D0',
                            font: 'Arial',
                          }),
                        ],
                      }),

                      new Paragraph({
                        alignment:
                          AlignmentType.CENTER,

                        children: [
                          new TextRun({
                            text:
                              'Compliance Score',
                            size: 15,
                            bold: true,
                            color: '52698A',
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                  }),

                  // ==================================================
                  // PRIORITY TABLE
                  // ==================================================

                  new TableCell({
                    width: {
                      size: 7100,
                      type: WidthType.DXA,
                    },

                    borders: capBorders,

                    margins: {
                      top: 10,
                      bottom: 10,
                      left: 10,
                      right: 10,
                    },

                    children: [
                      new Table({
                        width: {
                          size: 7000,
                          type: WidthType.DXA,
                        },

                        columnWidths: [
                          700,
                          950,
                          950,
                          950,
                          950,
                          1650,
                          850,
                        ],

                        rows: [
                          // =================================================
                          // PRIORITY HEADER
                          // NO FIXED HEIGHT
                          // =================================================

                          new TableRow({
                            cantSplit: true,

                            children: [
                              capHeaderCell(
                                'PRIORITY',
                                700,
                              ),

                              capHeaderCell(
                                'Completed\nin Time',
                                950,
                              ),

                              capHeaderCell(
                                'Completed\nin\nBuffer Time',
                                950,
                              ),

                              // capHeaderCell(
                              //   'Completed\nwithin 2\nBuffer Time',
                              //   950,
                              // ),

                              // capHeaderCell(
                              //   'Completed\nwithin 3\nBuffer Time',
                              //   950,
                              // ),

                              capHeaderCell(
                                'Not completed\n/Completed after Buffer Time',
                                1650,
                              ),
                              capHeaderCell(
                                'Upcoming',
                                1650,
                              ),

                              capHeaderCell(
                                'Total',
                                850,
                              ),
                            ],
                          }),

                          // =================================================
                          // DATA
                          // =================================================

                          ...prioritySummary.map(
                            makePriorityRow,
                          ),

                          // =================================================
                          // TOTAL
                          // =================================================

                          new TableRow({
                            cantSplit: true,

                            children: [
                              new TableCell({
                                width: {
                                  size: 700,
                                  type: WidthType.DXA,
                                },

                                shading: {
                                  fill: 'ECFDF5',
                                  type:
                                    ShadingType.CLEAR,
                                },

                                borders:
                                  capBorders,

                                margins: {
                                  top: 55,
                                  bottom: 55,
                                  left: 15,
                                  right: 15,
                                },

                                verticalAlign:
                                  'center' as any,

                                children: [
                                  new Paragraph({
                                    alignment:
                                      AlignmentType.CENTER,

                                    spacing: {
                                      before: 0,
                                      after: 0,
                                    },

                                    children: [
                                      new TextRun({
                                        text:
                                          'Total',
                                        size: 11,
                                        bold: true,
                                        color:
                                          '374151',
                                        font:
                                          'Arial',
                                      }),
                                    ],
                                  }),
                                ],
                              }),

                              ...[
                                {
                                  value: esgCapTemplateData.priorityScore.high.ontime + esgCapTemplateData.priorityScore.medium.ontime + esgCapTemplateData.priorityScore.low.ontime,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                {
                                  value: esgCapTemplateData.priorityScore.high.buffer1 + esgCapTemplateData.priorityScore.medium.buffer1 + esgCapTemplateData.priorityScore.low.buffer1,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                {
                                  value: esgCapTemplateData.priorityScore.high.over3 + esgCapTemplateData.priorityScore.medium.over3 + esgCapTemplateData.priorityScore.low.over3,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                {
                                  value: esgCapTemplateData.priorityScore.high.total + esgCapTemplateData.priorityScore.medium.total + esgCapTemplateData.priorityScore.low.total,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                // {
                                //   value: '8',
                                //   width: 1650,
                                //   color:
                                //     'EF4444',
                                // },
                                // {
                                //   value: '8',
                                //   width: 850,
                                //   color:
                                //     '059669',
                                // },
                              ].map(
                                (item) =>
                                  new TableCell({
                                    width: {
                                      size:
                                        item.width,
                                      type:
                                        WidthType.DXA,
                                    },

                                    shading: {
                                      fill:
                                        'ECFDF5',
                                      type:
                                        ShadingType.CLEAR,
                                    },

                                    borders:
                                      capBorders,

                                    margins: {
                                      top: 55,
                                      bottom: 55,
                                      left: 15,
                                      right: 15,
                                    },

                                    verticalAlign:
                                      'center' as any,

                                    children: [
                                      new Paragraph({
                                        alignment:
                                          AlignmentType.CENTER,

                                        spacing: {
                                          before: 0,
                                          after: 0,
                                        },

                                        children: [
                                          new TextRun({
                                            text:
                                              item.value.toString(),
                                            size: 11,
                                            bold: true,
                                            color:
                                              item.color,
                                            font:
                                              'Arial',
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                              ),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ======================================================
          // 8. ESCAP STATUS CARDS
          // ======================================================

          new Paragraph({
            spacing: {
              before: 100,
              after: 60,
            },

            children: [],
          }),

          new Table({
            width: {
              size: 9000,
              type: WidthType.DXA,
            },

            columnWidths: [
              1500,
              1500,
              1500,
              1500,
              1500,
              1500,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children:
                  capStatusCards.map(
                    (card) =>
                      new TableCell({
                        width: {
                          size: 1500,
                          type: WidthType.DXA,
                        },

                        shading: {
                          fill: card.fill,
                          type:
                            ShadingType.CLEAR,
                        },

                        borders: noBorders,

                        margins: {
                          top: 80,
                          bottom: 80,
                          left: 25,
                          right: 25,
                        },

                        verticalAlign:
                          'center' as any,

                        children: [
                          new Paragraph({
                            alignment:
                              AlignmentType.CENTER,

                            spacing: {
                              after: 5,
                            },

                            children: [
                              new TextRun({
                                text:
                                  card.value,
                                size: 22,
                                bold: true,
                                color:
                                  card.color,
                                font: 'Arial',
                              }),
                            ],
                          }),

                          new Paragraph({
                            alignment:
                              AlignmentType.CENTER,

                            spacing: {
                              before: 0,
                              after: 0,
                            },

                            children: [
                              new TextRun({
                                text:
                                  card.label,
                                size: 8,
                                color:
                                  card.color,
                                font: 'Arial',
                              }),
                            ],
                          }),
                        ],
                      }),
                  ),
              }),
            ],
          }),

          // ======================================================
          // 9. CONDITIONS PRECEDENT
          // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 100,
          //     after: 0,
          //   },

          //   children: [],
          // }),

          // new Table({
          //   width: {
          //     size: 9000,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     8500,
          //     500,
          //   ],

          //   rows: [
          //     new TableRow({
          //       cantSplit: true,

          //       children: [
          //         new TableCell({
          //           width: {
          //             size: 8500,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F8FAFC',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: capBorders,

          //           margins: {
          //             top: 90,
          //             bottom: 90,
          //             left: 80,
          //             right: 50,
          //           },

          //           children: [
          //             new Paragraph({
          //               spacing: {
          //                 before: 0,
          //                 after: 0,
          //               },

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     'CP – Conditions Precedent',
          //                   size: 19,
          //                   bold: true,
          //                   color: '1E293B',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           width: {
          //             size: 500,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F8FAFC',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: capBorders,

          //           children: [
          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text: '▼',
          //                   size: 14,
          //                   color: '64748B',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),
          //       ],
          //     }),
          //   ],
          // }),

          // ======================================================
          // 10. CONDITIONS SUBSEQUENT
          // ======================================================

          // new Table({
          //   width: {
          //     size: 9000,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     8500,
          //     500,
          //   ],

          //   rows: [
          //     new TableRow({
          //       cantSplit: true,

          //       children: [
          //         new TableCell({
          //           width: {
          //             size: 8500,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F8FAFC',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: capBorders,

          //           margins: {
          //             top: 90,
          //             bottom: 90,
          //             left: 80,
          //             right: 50,
          //           },

          //           children: [
          //             new Paragraph({
          //               spacing: {
          //                 before: 0,
          //                 after: 0,
          //               },

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     'CS – Conditions Subsequent',
          //                   size: 19,
          //                   bold: true,
          //                   color: '1E293B',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           width: {
          //             size: 500,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F8FAFC',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: capBorders,

          //           children: [
          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text: '▶',
          //                   size: 14,
          //                   color: '2563EB',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),
          //       ],
          //     }),
          //   ],
          // }),

          // ======================================================
          // 11. CAP ITEMS TABLE
          // ======================================================

          // new Table({
          //   width: {
          //     size: 9000,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     450,
          //     2350,
          //     800,
          //     1100,
          //     1200,
          //     1350,
          //     900,
          //     850,
          //   ],

          //   rows: [
          //     // =================================================
          //     // CAP HEADER
          //     // NO FIXED HEIGHT
          //     // =================================================

          //     new TableRow({
          //       cantSplit: true,

          //       children: [
          //         capHeaderCell(
          //           'S.\nNo',
          //           450,
          //         ),

          //         capHeaderCell(
          //           'CAP Item',
          //           2350,
          //           AlignmentType.LEFT,
          //         ),

          //         capHeaderCell(
          //           'Priority ↓',
          //           800,
          //         ),

          //         capHeaderCell(
          //           'Target Date ↑',
          //           1100,
          //         ),

          //         capHeaderCell(
          //           'Company\nStatus',
          //           1200,
          //         ),

          //         capHeaderCell(
          //           'Investor\nStatus',
          //           1350,
          //         ),

          //         capHeaderCell(
          //           'Completed\nOn',
          //           900,
          //         ),

          //         capHeaderCell(
          //           'Actions',
          //           850,
          //         ),
          //       ],
          //     }),

          //     // =================================================
          //     // ARRAY ITERATION
          //     // =================================================

          //     // ...dummyCapItems.map(
          //     //   makeCapItemRow,
          //     // ),
          //   ],
          // }),

          // ======================================================
          // 12. LOGIN / INFORMATION
          // ======================================================

          new Paragraph({
            shading: {
              fill: 'EFF6FF',
              type: ShadingType.CLEAR,
            },

            spacing: {
              before: 350,
              after: 50,
            },

            children: [
              new TextRun({
                text:
                  'Curious how your metrics are calculated and how you compare with your sector and revenue peers? Log in to view your results and tailored ESG recommendations.',
                size: 19,
                italics: true,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            shading: {
              fill: 'EFF6FF',
              type: ShadingType.CLEAR,
            },

            spacing: {
              after: 50,
            },

            children: [
              new TextRun({
                text: 'URL : ',
                size: 19,
                bold: true,
                color: '374151',
                font: 'Arial',
              }),

              new TextRun({
                text:
                  'https://fireside.fandoro.com/',
                size: 19,
                bold: true,
                color: '2563EB',
                font: 'Arial',
              }),
            ],
          }),

          // ======================================================
          // LOGIN DETAILS
          // ======================================================

          new Table({
            width: {
              size: 5000,
              type: WidthType.DXA,
            },

            columnWidths: [
              1800,
              3200,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children: [
                  new TableCell({
                    borders: cellBorders,

                    width: {
                      size: 1800,
                      type: WidthType.DXA,
                    },

                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 80,
                      right: 80,
                    },

                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              'Login ID:',
                            size: 19,
                            bold: true,
                            color: '374151',
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                  }),

                  new TableCell({
                    borders: cellBorders,

                    width: {
                      size: 3200,
                      type: WidthType.DXA,
                    },

                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 80,
                      right: 80,
                    },

                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              company.companyCode,
                            size: 19,
                            font: 'Courier New',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new TableRow({
                cantSplit: true,

                children: [
                  new TableCell({
                    borders: cellBorders,

                    width: {
                      size: 1800,
                      type: WidthType.DXA,
                    },

                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 80,
                      right: 80,
                    },

                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              'Password:',
                            size: 19,
                            bold: true,
                            color: '374151',
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                  }),

                  new TableCell({
                    borders: cellBorders,

                    width: {
                      size: 3200,
                      type: WidthType.DXA,
                    },

                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 80,
                      right: 80,
                    },

                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              m.password,
                            size: 19,
                            font: 'Courier New',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ======================================================
          // 13. SUPPORT
          // ======================================================

          new Paragraph({
            spacing: {
              before: 250,
              after: 50,
            },

            shading: {
              fill: 'F3F4F6',
              type: ShadingType.CLEAR,
            },

            children: [
              new TextRun({
                text:
                  'For technical issues faced:',
                size: 19,
                bold: true,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            shading: {
              fill: 'F3F4F6',
              type: ShadingType.CLEAR,
            },

            spacing: {
              after: 80,
            },

            children: [
              new TextRun({
                text:
                  'Contact Smita Mishra — sm@fandoro.com',
                size: 19,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            shading: {
              fill: 'F3F4F6',
              type: ShadingType.CLEAR,
            },

            spacing: {
              after: 50,
            },

            children: [
              new TextRun({
                text:
                  'For data related issues:',
                size: 19,
                bold: true,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            shading: {
              fill: 'F3F4F6',
              type: ShadingType.CLEAR,
            },

            spacing: {
              after: 150,
            },

            children: [
              new TextRun({
                text:
                  'Contact Tarak Doshi — tarak@firesideventures.com',
                size: 19,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }), new Paragraph({
            spacing: {
              before: 280,
              after: 90,
            },

            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 2,
                color: 'E5E7EB',
                space: 4,
              },
            },

            children: [
              new TextRun({
                text: 'Progress (Data Reporting)',
                size: 28,
                bold: true,
                color: '2D2D2D',
                font: 'Arial',
              }),
            ],
          }),

          // ======================================================
          // 14. FOOTER
          // ======================================================

          new Paragraph({
            spacing: {
              before: 350,
            },

            border: {
              top: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: 'E5E7EB',
                space: 8,
              },
            },

            children: [
              new TextRun({
                text:
                  'Fireside Ventures — ESG Reporting Platform',
                size: 18,
                color: '9CA3AF',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              before: 0,
              after: 0,
            },

            children: [
              new TextRun({
                text:
                  'This is a confidential communication intended solely for the recipient.',
                size: 18,
                color: '9CA3AF',
                font: 'Arial',
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

async function generateEmailDOCXV4(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  currentQuarterAnalytics: any,
  prevQuarterAnalytics: any,
  overallProgress: {
    filled: number;
    total: number;
    percentage: number;
  },
  scoreFormat: ScoreFormat = 'percentile',
  esgCapTemplateData: {
    complianceScore: number;
    complianceRating: { grade: string; label: string; color: string };
    priorityScore: {
      high: {
        ontime: number,
        buffer1: number,
        buffer2: number,
        buffer3: number,
        afterBufer: number,
        overdue:number,
        upcoming: number,
        total: number
      },
      medium: {
        ontime: number,
        buffer1: number,
        buffer2: number,
        buffer3: number,
        afterBufer: number,
        overdue:number,
        upcoming: number,
        total: number
      },
      low: {
        ontime: number,
        buffer1: number,
        buffer2: number,
        buffer3: number,
        afterBufer: number,
        overdue:number,
        upcoming: number,
        total: number
      }
    },
    plan: ESGCapItem[],
    esgMetrics: {
      dueThisMonth: number,
      overdue: number,
      partlySubmitted: number,
      resubmitRequested: number,
      submittedPendingReview: number,
      closed: number,
    }
  }
) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    WidthType,
    ShadingType,
    BorderStyle,
  } = await import('docx');

  // ============================================================
  // ESG METRICS
  // ============================================================
  console.log("esgCapTemplateData", esgCapTemplateData)
  const m = computeEsgMetrics(
    company,
    ranking,
    companyRaw,
    allCompaniesRaw,
    allRankings,
    scoreFormat,
  );

  const isCat = scoreFormat === 'category';

  // ============================================================
  // QUARTER-OVER-QUARTER TREND HELPERS
  // ============================================================

  type Trend = 'up' | 'down' | 'stable';

  const getTrend = (
    current: number | undefined | null,
    previous: number | undefined | null,
  ): Trend => {
    if (
      current == null ||
      previous == null ||
      Number.isNaN(Number(current)) ||
      Number.isNaN(Number(previous))
    ) {
      return 'stable';
    }

    if (Number(current) > Number(previous)) {
      return 'up';
    }

    if (Number(current) < Number(previous)) {
      return 'down';
    }

    return 'stable';
  };

  const getTrendIcon = (trend: Trend): string => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '—';
    }
  };

  const getTrendColor = (trend: Trend): string => {
    switch (trend) {
      case 'up':
        return '16A34A';
      case 'down':
        return 'DC2626';
      default:
        return '9CA3AF';
    }
  };

  const currentAnalytics = currentQuarterAnalytics || {};
  const previousAnalytics = prevQuarterAnalytics || {};

  const overallTrend = getTrend(
    currentAnalytics.overallPercentile,
    previousAnalytics.overallPercentile,
  );

  const completenessTrend = getTrend(
    currentAnalytics.completenessPercentile,
    previousAnalytics.completenessPercentile,
  );

  const consistencyTrend = getTrend(
    currentAnalytics.consistencyPercentile,
    previousAnalytics.consistencyPercentile,
  );

  const timelinessTrend = getTrend(
    currentAnalytics.timelinessPercentile,
    previousAnalytics.timelinessPercentile,
  );

  const esgCompositeTrend = getTrend(
    currentAnalytics.esgCompositePercentile,
    previousAnalytics.esgCompositePercentile,
  );

  const getPillarTrend = (key: string): Trend => {
    const currentPillar = currentAnalytics.pillars?.find(
      (p: any) => p.key === key,
    );

    const previousPillar = previousAnalytics.pillars?.find(
      (p: any) => p.key === key,
    );

    return getTrend(
      currentPillar?.companyPctile,
      previousPillar?.companyPctile,
    );
  };

  const environmentTrend = getPillarTrend(
    'circularEconomyIndex',
  );

  const socialTrend = getPillarTrend(
    'socialScore',
  );

  const governanceTrend = getPillarTrend(
    'governanceScore',
  );

  // ============================================================
  // COMMON BORDERS
  // ============================================================

  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  };

  const noBorders = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
  };

  const cellBorder = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'E5E7EB',
  };

  const cellBorders = {
    top: cellBorder,
    bottom: cellBorder,
    left: cellBorder,
    right: cellBorder,
  };

  const capBorder = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'D9E2EC',
  };

  const capBorders = {
    top: capBorder,
    bottom: capBorder,
    left: capBorder,
    right: capBorder,
  };

  // ============================================================
  // BAR ROW
  // ============================================================

  const makeBarRow = (
    label: string,
    value: number,
    color: string,
  ) =>
    new TableRow({
      children: [
        new TableCell({
          width: {
            size: 2000,
            type: WidthType.DXA,
          },

          borders: noBorders,

          margins: {
            top: 40,
            bottom: 40,
            left: 80,
            right: 80,
          },

          children: [
            new Paragraph({
              spacing: {
                before: 0,
                after: 0,
              },

              children: [
                new TextRun({
                  text: label,
                  size: 18,
                  color: '6B7280',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),

        new TableCell({
          width: {
            size: 5500,
            type: WidthType.DXA,
          },

          borders: noBorders,

          margins: {
            top: 40,
            bottom: 40,
            left: 0,
            right: 80,
          },

          children: [
            new Table({
              width: {
                size: 5000,
                type: WidthType.DXA,
              },

              columnWidths: [
                Math.max(
                  1,
                  Math.round(value * 50),
                ),
                Math.max(
                  1,
                  Math.round((100 - value) * 50),
                ),
              ],

              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: Math.max(
                          1,
                          Math.round(value * 50),
                        ),
                        type: WidthType.DXA,
                      },

                      shading: {
                        fill: color,
                        type: ShadingType.CLEAR,
                      },

                      borders: noBorders,

                      children: [
                        new Paragraph({
                          children: [],
                        }),
                      ],
                    }),

                    new TableCell({
                      width: {
                        size: Math.max(
                          1,
                          Math.round((100 - value) * 50),
                        ),
                        type: WidthType.DXA,
                      },

                      shading: {
                        fill: 'F3F4F6',
                        type: ShadingType.CLEAR,
                      },

                      borders: noBorders,

                      children: [
                        new Paragraph({
                          children: [],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new TableCell({
          width: {
            size: 700,
            type: WidthType.DXA,
          },

          borders: noBorders,

          margins: {
            top: 40,
            bottom: 40,
            left: 40,
            right: 80,
          },

          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: m.fmtBarLabel(value),
                  size: 18,
                  bold: true,
                  color: '374151',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
      ],
    });

  // ============================================================
  // ESG PILLARS
  // ============================================================

  const pillarSections = m.pillars.flatMap((p) => {
    if (p.isNA) {
      return [
        new Paragraph({
          spacing: {
            before: 200,
            after: 60,
          },

          children: [
            new TextRun({
              text: p.label,
              size: 24,
              bold: true,
              color: '374151',
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          spacing: {
            after: 100,
          },

          children: [
            new TextRun({
              text: 'NA — not applicable',
              size: 22,
              italics: true,
              color: '9CA3AF',
              font: 'Arial',
            }),
          ],
        }),
      ];
    }

    return [
      new Paragraph({
        spacing: {
          before: 200,
          after: 60,
        },

        children: [
          new TextRun({
            text: `${p.label} (n=${p.n})`,
            size: 24,
            bold: true,
            color: '374151',
            font: 'Arial',
          }),
        ],
      }),

      new Table({
        width: {
          size: 8200,
          type: WidthType.DXA,
        },

        columnWidths: [
          2000,
          5500,
          700,
        ],

        rows: [
          makeBarRow(
            `Your ${isCat ? 'Category' : 'Percentile'
            }`,
            p.companyPctile,
            '3B82F6',
          ),

          makeBarRow(
            'Sector Avg',
            p.indAvg,
            '22C55E',
          ),

          makeBarRow(
            'Revenue Cohort Avg',
            p.revAvg,
            'F59E0B',
          ),
        ],
      }),
    ];
  });

  // ============================================================
  // ESG SCORE CARDS
  // ============================================================

  const scoreCards = [
    {
      label: 'Responsiveness Score',
      value: m.fmtScore(m.overallPercentile),
      color: getGrade(m.overallPercentile).color,
      fill: 'FFFFFF',
      trend: overallTrend,
      companyCount:41,
      labelSize: 16,
      valueSize: 32,
      trendSize: 20,
      gradeSize: 16,
      countSize: 14,
    },

    {
      label: 'Completeness',
      value: m.fmtScore(m.completenessPercentile),
      color: getGrade(m.completenessPercentile).color,
      companyCount:41,
      fill: 'FFFFFF',
      trend: completenessTrend,
      labelSize: 12,
      valueSize: 18,
      trendSize: 12,
      gradeSize: 12,
      countSize: 12,
    },

    {
      label: 'Consistency',
      value: m.fmtScore(m.consistencyPercentile),
      color: getGrade(m.consistencyPercentile).color,
      fill: 'FFFFFF',
      companyCount:41,
      trend: consistencyTrend,
      labelSize: 12,
      valueSize: 18,
      trendSize: 12,
      gradeSize: 12,
      countSize: 12,
    },

    {
      label: 'Timeliness',
      value: m.fmtScore(m.timelinessPercentile),
      color: getGrade(m.timelinessPercentile).color,
      fill: 'FFFFFF',
      trend: timelinessTrend,
      labelSize: 12,
      valueSize: 18,
      trendSize: 12,
      gradeSize: 12,
      companyCount:41,
      countSize: 12,
    },
  ];

  // ============================================================
  // COMPOSITE CARDS
  // ============================================================

  const compositeCards = [
    {
      label: 'ESG Performance Score',
      value: m.fmtScore(m.esgCompositePercentile),
      color: getGrade(m.esgCompositePercentile).color,
      fill: 'FFFFFF',
      trend: esgCompositeTrend,
      companyCount:41,
      labelSize: 16,
      valueSize: 32,
      trendSize: 20,
      gradeSize: 16,
      countSize: 14,
    },

    {
      label: 'Environment',
      value: m.fmtScore(m.pillars[0].companyPctile),
      color: getGrade(m.pillars[0].companyPctile).color,
      fill: 'FFFFFF',
      trend: environmentTrend,
      companyCount:m.pillars[0].n,
      labelSize: 12,
      valueSize: 18,
      trendSize: 12,
      gradeSize: 12,
      countSize: 12,
    },

    {
      label: 'Social',
      value: m.fmtScore(m.pillars[1].companyPctile),
      color: getGrade(m.pillars[1].companyPctile).color,
      companyCount:m.pillars[1].n,
      fill: 'FFFFFF',
      trend: socialTrend,
      labelSize: 12,
      valueSize: 18,
      trendSize: 12,
      gradeSize: 12,
      countSize: 12,
    },

    {
      label: 'Governance',
      value: m.fmtScore(m.pillars[2].companyPctile),
      color: getGrade(m.pillars[2].companyPctile).color,
      fill: 'FFFFFF',
      trend: governanceTrend,
      companyCount:m.pillars[2].n,
      labelSize: 12,
      valueSize: 18,
      trendSize: 12,
      gradeSize: 12,
      countSize: 12,
    },
  ];

  // ============================================================
  // SCORE CARD HELPER
  // ============================================================

  const makeScoreCard = (
    label: string,
    value: string,
    color: string,
    fill: string,
    showGrade = true,
    trend: Trend = 'stable',
    companyCount: number,
    labelSize?: number,
    valueSize?: number,
    trendSize?: number,
    gradeSize?: number,
    countSize?: number,
    
  ) =>
    new TableCell({
      width: {
        size: 2250,
        type: WidthType.DXA,
      },

      borders: cellBorders,

      shading: {
        fill,
        type: ShadingType.CLEAR,
      },

      margins: {
        top: 140,
        bottom: 140,
        left: 100,
        right: 100,
      },

      verticalAlign: 'center' as any,

      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,

          spacing: {
            before: 0,
            after: 60,
            line: 220,
          },

          children: [
            new TextRun({
              text: label,
              size: labelSize ?? 16,
              bold: true,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,

          spacing: {
            before: 0,
            after: showGrade ? 10 : 40,
            line: 260,
          },

          children: [
            new TextRun({
              text: value,
              size: valueSize ?? (showGrade ? 24 : 20),
              bold: true,
              color,
              font: 'Arial',
            }),

            new TextRun({
              text: ` ${getTrendIcon(trend)}`,
              size: trendSize ?? (showGrade ? 18 : 16),
              bold: true,
              color: getTrendColor(trend),
              font: 'Arial',
            }),
          ],
        }),

        ...(showGrade
          ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,

              spacing: {
                before: 0,
                after: 25,
                line: 210,
              },

              children: [
                new TextRun({
                  text: 'grade',
                  size: gradeSize ?? 16,
                  color: '6B7280',
                  font: 'Arial',
                }),
              ],
            }),
          ]
          : []),

        new Paragraph({
          alignment: AlignmentType.CENTER,

          spacing: {
            before: 0,
            after: 0,
            line: 190,
          },

          children: [
            new TextRun({
              text: `n=${companyCount}`,
              size: countSize ?? 14,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        }),
      ],
    });

  // ============================================================
  // ESCAP DUMMY DATA
  // ============================================================

  const dummyCapItems = [
    {
      sno: 1,
      capItem:
        'PoSH, H&S & CoC Training',
      priority: 'High',
      targetDate: '22 Feb 2023',
      companyStatus: 'Submitted',
      investorStatus: 'Under Review',
      completedOn: '',
    },

    {
      sno: 2,
      capItem:
        'Plastic Reduction in Packaging',
      priority: 'High',
      targetDate: '24 Nov 2023',
      companyStatus: 'Overdue',
      investorStatus: '-',
      completedOn: '',
    },

    {
      sno: 3,
      capItem:
        'HR Policy Development',
      priority: 'Medium',
      targetDate: '13 Jun 2024',
      companyStatus: 'Submitted',
      investorStatus: 'Under Review',
      completedOn: '',
    },

    {
      sno: 4,
      capItem:
        'Human Rights Policy',
      priority: 'Medium',
      targetDate: '13 Jun 2024',
      companyStatus: 'Overdue',
      investorStatus: '-',
      completedOn: '',
    },

    {
      sno: 5,
      capItem:
        'Standalone ESG Policy',
      priority: 'Medium',
      targetDate: '13 Jun 2024',
      companyStatus: 'Submitted',
      investorStatus: 'Under Review',
      completedOn: '',
    },

    {
      sno: 6,
      capItem:
        'Supplier Code of Conduct',
      priority: 'Low',
      targetDate: '30 Jun 2024',
      companyStatus: 'Closed',
      investorStatus: 'Approved',
      completedOn: '28 Jun 2024',
    },
  ];

  // ============================================================
  // ESCAP PRIORITY SUMMARY
  // ============================================================

  const prioritySummary = esgCapTemplateData ? [
    {
      priority: 'High',
      color: 'DC2626',
      completedInTime: esgCapTemplateData.priorityScore.high.ontime,
      buffer1: esgCapTemplateData.priorityScore.high.buffer1 + esgCapTemplateData.priorityScore.high.buffer2 + esgCapTemplateData.priorityScore.high.buffer3,
      afterBuffer: esgCapTemplateData.priorityScore.high.afterBufer,
      overdue: esgCapTemplateData.priorityScore.high.overdue,
      upcoming: esgCapTemplateData.priorityScore.high.upcoming,
      total: esgCapTemplateData.priorityScore.high.total,
    },

    {
      priority: 'Medium',
      color: 'D97706',
      completedInTime: esgCapTemplateData.priorityScore.medium.ontime,
      buffer1: esgCapTemplateData.priorityScore.medium.buffer1 + esgCapTemplateData.priorityScore.medium.buffer2 + esgCapTemplateData.priorityScore.medium.buffer3,
      afterBuffer: esgCapTemplateData.priorityScore.medium.afterBufer,
      overdue: esgCapTemplateData.priorityScore.medium.overdue,
      upcoming: esgCapTemplateData.priorityScore.medium.upcoming,
      total: esgCapTemplateData.priorityScore.medium.total,
    },

    {
      priority: 'Low',
      color: '64748B',
      completedInTime: esgCapTemplateData.priorityScore.low.ontime,
      buffer1: esgCapTemplateData.priorityScore.low.buffer1 + esgCapTemplateData.priorityScore.low.buffer2 + esgCapTemplateData.priorityScore.low.buffer3,
      afterBuffer: esgCapTemplateData.priorityScore.low.afterBufer,
      overdue: esgCapTemplateData.priorityScore.low.overdue,
      upcoming: esgCapTemplateData.priorityScore.low.upcoming,
      total: esgCapTemplateData.priorityScore.low.total,
    },
  ] : [];

  console.log("prioritySummary", prioritySummary)

  // ============================================================
  // ESCAP HEADER CELL
  // ============================================================

  const capHeaderCell = (
    text: string,
    width: number,
    align: any = AlignmentType.CENTER,
  ) =>
    new TableCell({
      width: {
        size: width,
        type: WidthType.DXA,
      },

      shading: {
        fill: 'F1F5F9',
        type: ShadingType.CLEAR,
      },

      borders: capBorders,

      margins: {
        top: 80,
        bottom: 80,
        left: 25,
        right: 25,
      },

      verticalAlign: 'center' as any,

      children: [
        new Paragraph({
          alignment: align,

          spacing: {
            before: 0,
            after: 0,
            line: 240,
          },

          children: [
            new TextRun({
              text,
              size: 9,
              bold: true,
              color: '111827',
              font: 'Arial',
            }),
          ],
        }),
      ],
    });

  // ============================================================
  // ESCAP PRIORITY ROW
  // ============================================================

  const makePriorityRow = (
    item: typeof prioritySummary[number],
  ) =>
    new TableRow({
      cantSplit: true,

      children: [
        // PRIORITY
        new TableCell({
          width: {
            size: 700,
            type: WidthType.DXA,
          },

          borders: capBorders,

          margins: {
            top: 55,
            bottom: 55,
            left: 15,
            right: 15,
          },

          verticalAlign: 'center' as any,

          children: [
            new Paragraph({
              alignment:
                AlignmentType.CENTER,

              spacing: {
                before: 0,
                after: 0,
              },

              children: [
                new TextRun({
                  text: item.priority,
                  size: 11,
                  bold: true,
                  color: item.color,
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),

        // DATA VALUES
        ...[
          item.completedInTime,
          item.buffer1,
          item.afterBuffer,
          item.overdue,
          item.upcoming,
          item.total
        ].map(
          (value, index) =>
            new TableCell({
              width: {
                size:
                  index === 4
                    ? 1650
                    : 950,
                type: WidthType.DXA,
              },

              borders: capBorders,

              margins: {
                top: 55,
                bottom: 55,
                left: 15,
                right: 15,
              },

              verticalAlign:
                'center' as any,

              children: [
                new Paragraph({
                  alignment:
                    AlignmentType.CENTER,

                  spacing: {
                    before: 0,
                    after: 0,
                  },

                  children: [
                    new TextRun({
                      text: String(value),
                      size: 11,
                      color:
                        index === 4
                          ? 'EF4444'
                          : '111827',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
        ),

        // TOTAL
        // new TableCell({
        //   width: {
        //     size: 850,
        //     type: WidthType.DXA,
        //   },

        //   borders: capBorders,

        //   margins: {
        //     top: 55,
        //     bottom: 55,
        //     left: 15,
        //     right: 15,
        //   },

        //   verticalAlign:
        //     'center' as any,

        //   children: [
        //     new Paragraph({
        //       alignment:
        //         AlignmentType.CENTER,

        //       spacing: {
        //         before: 0,
        //         after: 0,
        //       },

        //       children: [
        //         new TextRun({
        //           text: String(item.total),
        //           size: 11,
        //           color:
        //             item.notCompleted > 0
        //               ? 'EF4444'
        //               : '111827',
        //           font: 'Arial',
        //         }),
        //       ],
        //     }),
        //   ],
        // }),
      ],
    });

  // ============================================================
  // CAP ITEM ROW
  // ============================================================

  // const makeCapItemRow = (
  //   item: typeof dummyCapItems[number],
  // ) => {
  //   const priorityStyle =
  //     item.priority === 'High'
  //       ? {
  //         fill: 'FECACA',
  //         color: 'DC2626',
  //       }
  //       : item.priority === 'Medium'
  //         ? {
  //           fill: 'FEF08A',
  //           color: 'A16207',
  //         }
  //         : {
  //           fill: 'E2E8F0',
  //           color: '475569',
  //         };

  //   const companyStatusStyle =
  //     item.companyStatus === 'Overdue'
  //       ? {
  //         fill: 'FEE2E2',
  //         color: 'DC2626',
  //       }
  //       : item.companyStatus === 'Closed'
  //         ? {
  //           fill: 'DCFCE7',
  //           color: '15803D',
  //         }
  //         : {
  //           fill: 'F3E8FF',
  //           color: '9333EA',
  //         };

  //   const investorStatusStyle =
  //     item.investorStatus ===
  //       'Under Review'
  //       ? {
  //         fill: 'DBEAFE',
  //         color: '1D4ED8',
  //       }
  //       : item.investorStatus ===
  //         'Approved'
  //         ? {
  //           fill: 'DCFCE7',
  //           color: '15803D',
  //         }
  //         : {
  //           fill: 'F1F5F9',
  //           color: '64748B',
  //         };

  //   const itemColor =
  //     item.companyStatus === 'Overdue'
  //       ? 'DC2626'
  //       : '111827';

  //   return new TableRow({
  //     cantSplit: true,

  //     children: [
  //       // S.NO
  //       new TableCell({
  //         width: {
  //           size: 450,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 75,
  //           bottom: 75,
  //           left: 15,
  //           right: 15,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: String(item.sno),
  //                 size: 11,
  //                 color: itemColor,
  //                 font: 'Arial',
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // CAP ITEM
  //       new TableCell({
  //         width: {
  //           size: 2350,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 75,
  //           bottom: 75,
  //           left: 40,
  //           right: 25,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: item.capItem,
  //                 size: 11,
  //                 color: itemColor,
  //                 font: 'Arial',
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // PRIORITY
  //       new TableCell({
  //         width: {
  //           size: 800,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 60,
  //           bottom: 60,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: item.priority,
  //                 size: 9,
  //                 bold: true,
  //                 color:
  //                   priorityStyle.color,
  //                 font: 'Arial',

  //                 shading: {
  //                   fill:
  //                     priorityStyle.fill,
  //                   type:
  //                     ShadingType.CLEAR,
  //                 },
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // TARGET DATE
  //       new TableCell({
  //         width: {
  //           size: 1100,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 75,
  //           bottom: 75,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: item.targetDate,
  //                 size: 10,
  //                 color: itemColor,
  //                 font: 'Arial',
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // COMPANY STATUS
  //       new TableCell({
  //         width: {
  //           size: 1200,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 60,
  //           bottom: 60,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text:
  //                   item.companyStatus ===
  //                     'Overdue'
  //                     ? '× Overdue'
  //                     : item.companyStatus ===
  //                       'Closed'
  //                       ? '✓ Closed'
  //                       : '◷ Submitted',

  //                 size: 8,
  //                 bold: true,
  //                 color:
  //                   companyStatusStyle.color,
  //                 font: 'Arial',

  //                 shading: {
  //                   fill:
  //                     companyStatusStyle.fill,
  //                   type:
  //                     ShadingType.CLEAR,
  //                 },
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // INVESTOR STATUS
  //       new TableCell({
  //         width: {
  //           size: 1350,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 60,
  //           bottom: 60,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text:
  //                   item.investorStatus ===
  //                     '-'
  //                     ? '-'
  //                     : item.investorStatus ===
  //                       'Approved'
  //                       ? '✓ Approved'
  //                       : '◷ Under Review',

  //                 size: 8,
  //                 bold: true,
  //                 color:
  //                   investorStatusStyle.color,
  //                 font: 'Arial',

  //                 shading: {
  //                   fill:
  //                     investorStatusStyle.fill,
  //                   type:
  //                     ShadingType.CLEAR,
  //                 },
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // COMPLETED ON
  //       new TableCell({
  //         width: {
  //           size: 900,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 75,
  //           bottom: 75,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text:
  //                   item.completedOn ||
  //                   '',
  //                 size: 9,
  //                 color: '475569',
  //                 font: 'Arial',
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),

  //       // ACTIONS
  //       new TableCell({
  //         width: {
  //           size: 850,
  //           type: WidthType.DXA,
  //         },

  //         borders: capBorders,

  //         margins: {
  //           top: 60,
  //           bottom: 60,
  //           left: 10,
  //           right: 10,
  //         },

  //         verticalAlign:
  //           'center' as any,

  //         children: [
  //           new Paragraph({
  //             alignment:
  //               AlignmentType.CENTER,

  //             spacing: {
  //               before: 0,
  //               after: 0,
  //             },

  //             children: [
  //               new TextRun({
  //                 text: '✎ Update',
  //                 size: 8,
  //                 bold: true,
  //                 color: 'FFFFFF',
  //                 font: 'Arial',

  //                 shading: {
  //                   fill: '34B882',
  //                   type:
  //                     ShadingType.CLEAR,
  //                 },
  //               }),
  //             ],
  //           }),
  //         ],
  //       }),
  //     ],
  //   });
  // };

  // ============================================================
  // ESCAP STATUS CARDS
  // ============================================================

  const capStatusCards = [
    {
      value: '0',
      label: 'Due in this Month',
      color: 'EA580C',
      fill: 'FFF7ED',
    },

    {
      value: '3',
      label: 'Overdue',
      color: 'DC2626',
      fill: 'FFF1F2',
    },

    {
      value: '1',
      label: 'Partly Submitted',
      color: '2563EB',
      fill: 'EFF6FF',
    },

    {
      value: '0',
      label: 'Re-submit Requested',
      color: 'D97706',
      fill: 'FFFBEB',
    },

    {
      value: '3',
      label: 'Submitted Pending Review',
      color: '9333EA',
      fill: 'FAF5FF',
    },

    {
      value: '3',
      label: 'Closed',
      color: '16A34A',
      fill: 'F0FDF4',
    },
  ];

  // ============================================================
  // DOCUMENT
  // ============================================================

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22,
          },
        },
      },
    },

    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },

        children: [
          // ======================================================
          // COMPANY
          // ======================================================

          new Paragraph({
            spacing: {
              after: 60,
            },

            children: [
              new TextRun({
                text: company.brand,
                size: 34,
                bold: true,
                color: '1A1A1A',
                font: 'Arial',
              }),
            ],
          }),

          
          // ======================================================
          // 2. ESG SCORE CARDS
          // ======================================================

          new Paragraph({
            spacing: {
              before: 280,
              after: 90,
            },

            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 2,
                color: 'E5E7EB',
                space: 4,
              },
            },

            children: [
              new TextRun({
                text: 'Progress (Data Reporting)',
                size: 28,
                bold: true,
                color: '2D2D2D',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              before: 0,    // removes/reduces the gap above this line
              after: 200,   // increases the gap below this line
            },
            children: [
              new TextRun({
                text: 'See how your ESG reporting compares to other portfolio companies (n=41).',
                size: 15,
                bold: false,
                color: '1A1A1A',
                font: 'Arial',
              }),
            ],
          }),

          new Table({
            width: {
              size: 9000,
              type: WidthType.DXA,
            },

            columnWidths: [
              2250,
              2250,
              2250,
              2250,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children:
                  scoreCards.map(
                    (card) =>
                      makeScoreCard(
                        card.label,
                        card.value,
                        card.color,
                        card.fill,
                        true,
                        card.trend,
                        card.companyCount,
                        card.labelSize,
                        card.valueSize,
                        card.trendSize,
                        card.gradeSize,
                        card.countSize,
                      ),
                  ),
              }),
            ],
          }),
          new Paragraph({
            spacing: {
              after: 60,
            },

            children: [
              new TextRun({
                text: '*Responsiveness Score: Measures the completeness, consistency, and timeliness of ESG data reporting, benchmarked to the Fireside Portfolio.',
                size: 12,
                bold: true,
                color: '1A1A1A',
                font: 'Arial',
              }),
            ],
          }),
                


          // ======================================================
          // 3. COMPOSITE CARDS
          // ======================================================

          new Paragraph({
            spacing: {
              before: 100,
              after: 60,
            },

            children: [],
          }),

          new Table({
            width: {
              size: 9000,
              type: WidthType.DXA,
            },

            columnWidths: [
              2250,
              2250,
              2250,
              2250,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children:
                  compositeCards.map(
                    (card) =>
                      makeScoreCard(
                        card.label,
                        card.value,
                        card.color,
                        card.fill,
                        false,
                        card.trend,
                        card.companyCount,
                        card.labelSize,
                        card.valueSize,
                        card.trendSize,
                        card.gradeSize,
                        card.countSize,
                      ),
                  ),
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              after: 60,
            },

            children: [
              new TextRun({
                text: 'ESG Performance Score: Measures overall performance across Environmental, Social, and Governance KPIs, benchmarked to the Fireside Portfolio.',
                size: 12,
                bold: true,
                color: '1A1A1A',
                font: 'Arial',
              }),
            ],
          }),

          // ======================================================
          // 4. ESG COMPOSITE SCORE
          // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 280,
          //     after: 100,
          //   },

          //   border: {
          //     bottom: {
          //       style: BorderStyle.SINGLE,
          //       size: 2,
          //       color: 'E5E7EB',
          //       space: 4,
          //     },
          //   },

          //   children: [
          //     new TextRun({
          //       text:
          //         `ESG Composite Score: ${m.fmtScore(
          //           m.esgCompositePercentile,
          //         )} (n=${m.esgPoolSize}) — ${isCat
          //           ? 'Category'
          //           : 'Percentile'
          //         } Comparison`,
          //       size: 28,
          //       bold: true,
          //       color: '2D2D2D',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // new Table({
          //   width: {
          //     size: 8200,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     2700,
          //     2700,
          //     2800,
          //   ],

          //   rows: [
          //     new TableRow({
          //       children: [
          //         new TableCell({
          //           borders: noBorders,

          //           width: {
          //             size: 2700,
          //             type: WidthType.DXA,
          //           },

          //           children: [
          //             new Paragraph({
          //               children: [
          //                 new TextRun({
          //                   text: '■ ',
          //                   color: '3B82F6',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),

          //                 new TextRun({
          //                   text:
          //                     `Your ${isCat
          //                       ? 'Category'
          //                       : 'Percentile'
          //                     }`,
          //                   color: '6B7280',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           borders: noBorders,

          //           width: {
          //             size: 2700,
          //             type: WidthType.DXA,
          //           },

          //           children: [
          //             new Paragraph({
          //               children: [
          //                 new TextRun({
          //                   text: '■ ',
          //                   color: '22C55E',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),

          //                 new TextRun({
          //                   text:
          //                     'Sector Avg',
          //                   color: '6B7280',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           borders: noBorders,

          //           width: {
          //             size: 2800,
          //             type: WidthType.DXA,
          //           },

          //           children: [
          //             new Paragraph({
          //               children: [
          //                 new TextRun({
          //                   text: '■ ',
          //                   color: 'F59E0B',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),

          //                 new TextRun({
          //                   text:
          //                     'Revenue Cohort Avg',
          //                   color: '6B7280',
          //                   size: 18,
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),
          //       ],
          //     }),
          //   ],
          // }),

          // new Paragraph({
          //   spacing: {
          //     before: 160,
          //     after: 60,
          //   },

          //   children: [
          //     new TextRun({
          //       text: 'ESG Composite',
          //       size: 23,
          //       bold: true,
          //       color: '374151',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // new Table({+
          //   width: {
          //     size: 8200,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     2000,
          //     5500,
          //     700,
          //   ],

          //   rows: [
          //     makeBarRow(
          //       `Your ${isCat
          //         ? 'Category'
          //         : 'Percentile'
          //       }`,
          //       m.esgCompositePercentile,
          //       '3B82F6',
          //     ),

          //     makeBarRow(
          //       'Sector Avg',
          //       m.esgCompositeIndAvg,
          //       '22C55E',
          //     ),

          //     makeBarRow(
          //       'Revenue Cohort Avg',
          //       m.esgCompositeRevAvg,
          //       'F59E0B',
          //     ),
          //   ],
          // }),

          // // ======================================================
          // // 5. ESG PILLARS
          // // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 280,
          //     after: 90,
          //   },

          //   border: {
          //     bottom: {
          //       style: BorderStyle.SINGLE,
          //       size: 2,
          //       color: 'E5E7EB',
          //       space: 4,
          //     },
          //   },

          //   children: [
          //     new TextRun({
          //       text: 'ESG Pillars',
          //       size: 28,
          //       bold: true,
          //       color: '2D2D2D',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // ...pillarSections,

          // // ======================================================
          // // 6. ESCAP SCORE
          // // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 350,
          //     after: 70,
          //   },

          //   border: {
          //     bottom: {
          //       style: BorderStyle.SINGLE,
          //       size: 2,
          //       color: 'E5E7EB',
          //       space: 4,
          //     },
          //   },

          //   children: [
          //     new TextRun({
          //       text: 'eSCAP Score',
          //       size: 30,
          //       bold: true,
          //       color: '2D2D2D',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          // new Paragraph({
          //   spacing: {
          //     after: 120,
          //   },

          //   children: [
          //     new TextRun({
          //       text:
          //         'Compliance and action-plan status across ESG requirements',
          //       size: 20,
          //       color: '6B7280',
          //       font: 'Arial',
          //     }),
          //   ],
          // }),

          new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [],
          }),

          // ======================================================
          // 7. COMPLIANCE SCORE + PRIORITY TABLE
          // ======================================================
          ...(esgCapTemplateData ? [new Paragraph({
            spacing: {
              before: 280,
              after: 90,
            },

            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 2,
                color: 'E5E7EB',
                space: 4,
              },
            },

            children: [
              new TextRun({
                text: 'ESGCAP Report',
                size: 28,
                bold: true,
                color: '2D2D2D',
                font: 'Arial',
              }),
            ],
          }),
          new Table({
            width: {
              size: 9000,
              type: WidthType.DXA,
            },

            columnWidths: [
              1900,
              7100,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children: [
                  // ==================================================
                  // COMPLIANCE SCORE
                  // ==================================================

                  new TableCell({
                    width: {
                      size: 1900,
                      type: WidthType.DXA,
                    },

                    borders: capBorders,

                    shading: {
                      fill: 'F0FDF4',
                      type:
                        ShadingType.CLEAR,
                    },

                    margins: {
                      top: 130,
                      bottom: 130,
                      left: 60,
                      right: 60,
                    },

                    verticalAlign:
                      'center' as any,

                    children: [
                      new Paragraph({
                        alignment:
                          AlignmentType.CENTER,

                        spacing: {
                          before: 0,
                          after: 5,
                        },

                        children: [
                          new TextRun({
                            text: esgCapTemplateData.complianceRating.grade,
                            size: 48,
                            bold: true,
                            color: 'EA580C',
                            font: 'Arial',
                          }),
                        ],
                      }),

                      new Paragraph({
                        alignment:
                          AlignmentType.CENTER,

                        spacing: {
                          before: 0,
                          after: 35,
                        },

                        children: [
                          new TextRun({
                            text: esgCapTemplateData.complianceRating.label,
                            size: 14,
                            color: 'EA580C',
                            font: 'Arial',
                          }),
                        ],
                      }),

                      new Paragraph({
                        alignment:
                          AlignmentType.CENTER,

                        spacing: {
                          before: 0,
                          after: 35,
                        },

                        children: [
                          new TextRun({
                            text: '────────',
                            size: 8,
                            color: 'BBF7D0',
                            font: 'Arial',
                          }),
                        ],
                      }),

                      new Paragraph({
                        alignment:
                          AlignmentType.CENTER,

                        children: [
                          new TextRun({
                            text:
                              'Compliance Score',
                            size: 15,
                            bold: true,
                            color: '52698A',
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                  }),

                  // ==================================================
                  // PRIORITY TABLE
                  // ==================================================

                  new TableCell({
                    width: {
                      size: 7100,
                      type: WidthType.DXA,
                    },

                    borders: capBorders,

                    margins: {
                      top: 10,
                      bottom: 10,
                      left: 10,
                      right: 10,
                    },

                    children: [
                      new Table({
                        width: {
                          size: 7000,
                          type: WidthType.DXA,
                        },

                        columnWidths: [
                          700,
                          950,
                          950,
                          950,
                          950,
                          1650,
                          850,
                        ],

                        rows: [
                          // =================================================
                          // PRIORITY HEADER
                          // NO FIXED HEIGHT
                          // =================================================

                          new TableRow({
                            cantSplit: true,

                            children: [
                              capHeaderCell(
                                'PRIORITY',
                                700,
                              ),

                              capHeaderCell(
                                'Completed\nin Time',
                                950,
                              ),

                              capHeaderCell(
                                'Completed\nin\nBuffer Time',
                                950,
                              ),

                              // capHeaderCell(
                              //   'Completed\nwithin 2\nBuffer Time',
                              //   950,
                              // ),

                              // capHeaderCell(
                              //   'Completed\nwithin 3\nBuffer Time',
                              //   950,
                              // ),

                              capHeaderCell(
                                'Completed after Buffer Time',
                                1650,
                              ),
                              capHeaderCell(
                                'Overdue',
                                1650,
                              ),
                              capHeaderCell(
                                'Upcoming',
                                1650,
                              ),

                              capHeaderCell(
                                'Total',
                                850,
                              ),
                            ],
                          }),

                          // =================================================
                          // DATA
                          // =================================================

                          ...prioritySummary.map(
                            makePriorityRow,
                          ),

                          // =================================================
                          // TOTAL
                          // =================================================

                          new TableRow({
                            cantSplit: true,

                            children: [
                              new TableCell({
                                width: {
                                  size: 700,
                                  type: WidthType.DXA,
                                },

                                shading: {
                                  fill: 'ECFDF5',
                                  type:
                                    ShadingType.CLEAR,
                                },

                                borders:
                                  capBorders,

                                margins: {
                                  top: 55,
                                  bottom: 55,
                                  left: 15,
                                  right: 15,
                                },

                                verticalAlign:
                                  'center' as any,

                                children: [
                                  new Paragraph({
                                    alignment:
                                      AlignmentType.CENTER,

                                    spacing: {
                                      before: 0,
                                      after: 0,
                                    },

                                    children: [
                                      new TextRun({
                                        text:
                                          'Total',
                                        size: 11,
                                        bold: true,
                                        color:
                                          '374151',
                                        font:
                                          'Arial',
                                      }),
                                    ],
                                  }),
                                ],
                              }),

                              ...[
                                {
                                  value: esgCapTemplateData.priorityScore.high.ontime + esgCapTemplateData.priorityScore.medium.ontime + esgCapTemplateData.priorityScore.low.ontime,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                {
                                  value: esgCapTemplateData.priorityScore.high.buffer1 + esgCapTemplateData.priorityScore.medium.buffer1 + esgCapTemplateData.priorityScore.low.buffer1,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                {
                                  value: esgCapTemplateData.priorityScore.high.afterBufer + esgCapTemplateData.priorityScore.medium.afterBufer + esgCapTemplateData.priorityScore.low.afterBufer,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                {
                                  value: esgCapTemplateData.priorityScore.high.overdue + esgCapTemplateData.priorityScore.medium.overdue + esgCapTemplateData.priorityScore.low.overdue,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                {
                                  value: esgCapTemplateData.priorityScore.high.upcoming + esgCapTemplateData.priorityScore.medium.upcoming + esgCapTemplateData.priorityScore.low.upcoming,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                {
                                  value: esgCapTemplateData.priorityScore.high.total + esgCapTemplateData.priorityScore.medium.total + esgCapTemplateData.priorityScore.low.total,
                                  width: 950,
                                  color:
                                    '059669',
                                },
                                // {
                                //   value: '8',
                                //   width: 1650,
                                //   color:
                                //     'EF4444',
                                // },
                                // {
                                //   value: '8',
                                //   width: 850,
                                //   color:
                                //     '059669',
                                // },
                              ].map(
                                (item) =>
                                  new TableCell({
                                    width: {
                                      size:
                                        item.width,
                                      type:
                                        WidthType.DXA,
                                    },

                                    shading: {
                                      fill:
                                        'ECFDF5',
                                      type:
                                        ShadingType.CLEAR,
                                    },

                                    borders:
                                      capBorders,

                                    margins: {
                                      top: 55,
                                      bottom: 55,
                                      left: 15,
                                      right: 15,
                                    },

                                    verticalAlign:
                                      'center' as any,

                                    children: [
                                      new Paragraph({
                                        alignment:
                                          AlignmentType.CENTER,

                                        spacing: {
                                          before: 0,
                                          after: 0,
                                        },

                                        children: [
                                          new TextRun({
                                            text:
                                              item.value.toString(),
                                            size: 11,
                                            bold: true,
                                            color:
                                              item.color,
                                            font:
                                              'Arial',
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                              ),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ======================================================
          // 8. ESCAP STATUS CARDS
          // ======================================================

          new Paragraph({
            spacing: {
              before: 100,
              after: 60,
            },

            children: [],
          }),

          ] : []),



          // ======================================================
          // 9. CONDITIONS PRECEDENT
          // ======================================================

          // new Paragraph({
          //   spacing: {
          //     before: 100,
          //     after: 0,
          //   },

          //   children: [],
          // }),

          // new Table({
          //   width: {
          //     size: 9000,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     8500,
          //     500,
          //   ],

          //   rows: [
          //     new TableRow({
          //       cantSplit: true,

          //       children: [
          //         new TableCell({
          //           width: {
          //             size: 8500,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F8FAFC',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: capBorders,

          //           margins: {
          //             top: 90,
          //             bottom: 90,
          //             left: 80,
          //             right: 50,
          //           },

          //           children: [
          //             new Paragraph({
          //               spacing: {
          //                 before: 0,
          //                 after: 0,
          //               },

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     'CP – Conditions Precedent',
          //                   size: 19,
          //                   bold: true,
          //                   color: '1E293B',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           width: {
          //             size: 500,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F8FAFC',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: capBorders,

          //           children: [
          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text: '▼',
          //                   size: 14,
          //                   color: '64748B',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),
          //       ],
          //     }),
          //   ],
          // }),

          // ======================================================
          // 10. CONDITIONS SUBSEQUENT
          // ======================================================

          // new Table({
          //   width: {
          //     size: 9000,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     8500,
          //     500,
          //   ],

          //   rows: [
          //     new TableRow({
          //       cantSplit: true,

          //       children: [
          //         new TableCell({
          //           width: {
          //             size: 8500,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F8FAFC',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: capBorders,

          //           margins: {
          //             top: 90,
          //             bottom: 90,
          //             left: 80,
          //             right: 50,
          //           },

          //           children: [
          //             new Paragraph({
          //               spacing: {
          //                 before: 0,
          //                 after: 0,
          //               },

          //               children: [
          //                 new TextRun({
          //                   text:
          //                     'CS – Conditions Subsequent',
          //                   size: 19,
          //                   bold: true,
          //                   color: '1E293B',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),

          //         new TableCell({
          //           width: {
          //             size: 500,
          //             type: WidthType.DXA,
          //           },

          //           shading: {
          //             fill: 'F8FAFC',
          //             type:
          //               ShadingType.CLEAR,
          //           },

          //           borders: capBorders,

          //           children: [
          //             new Paragraph({
          //               alignment:
          //                 AlignmentType.CENTER,

          //               children: [
          //                 new TextRun({
          //                   text: '▶',
          //                   size: 14,
          //                   color: '2563EB',
          //                   font: 'Arial',
          //                 }),
          //               ],
          //             }),
          //           ],
          //         }),
          //       ],
          //     }),
          //   ],
          // }),

          // ======================================================
          // 11. CAP ITEMS TABLE
          // ======================================================

          // new Table({
          //   width: {
          //     size: 9000,
          //     type: WidthType.DXA,
          //   },

          //   columnWidths: [
          //     450,
          //     2350,
          //     800,
          //     1100,
          //     1200,
          //     1350,
          //     900,
          //     850,
          //   ],

          //   rows: [
          //     // =================================================
          //     // CAP HEADER
          //     // NO FIXED HEIGHT
          //     // =================================================

          //     new TableRow({
          //       cantSplit: true,

          //       children: [
          //         capHeaderCell(
          //           'S.\nNo',
          //           450,
          //         ),

          //         capHeaderCell(
          //           'CAP Item',
          //           2350,
          //           AlignmentType.LEFT,
          //         ),

          //         capHeaderCell(
          //           'Priority ↓',
          //           800,
          //         ),

          //         capHeaderCell(
          //           'Target Date ↑',
          //           1100,
          //         ),

          //         capHeaderCell(
          //           'Company\nStatus',
          //           1200,
          //         ),

          //         capHeaderCell(
          //           'Investor\nStatus',
          //           1350,
          //         ),

          //         capHeaderCell(
          //           'Completed\nOn',
          //           900,
          //         ),

          //         capHeaderCell(
          //           'Actions',
          //           850,
          //         ),
          //       ],
          //     }),

          //     // =================================================
          //     // ARRAY ITERATION
          //     // =================================================

          //     // ...dummyCapItems.map(
          //     //   makeCapItemRow,
          //     // ),
          //   ],
          // }),

          // ======================================================
          // 12. LOGIN / INFORMATION
          // ======================================================

          new Paragraph({
            shading: {
              fill: 'EFF6FF',
              type: ShadingType.CLEAR,
            },

            spacing: {
              before: 350,
              after: 50,
            },

            children: [
              new TextRun({
                text:
                  'Curious how your metrics are calculated and how you compare with your sector and revenue peers? Log in to view your results and tailored ESG recommendations.',
                size: 19,
                italics: true,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            shading: {
              fill: 'EFF6FF',
              type: ShadingType.CLEAR,
            },

            spacing: {
              after: 50,
            },

            children: [
              new TextRun({
                text: 'URL : ',
                size: 19,
                bold: true,
                color: '374151',
                font: 'Arial',
              }),

              new TextRun({
                text:
                  'https://fireside.fandoro.com/',
                size: 19,
                bold: true,
                color: '2563EB',
                font: 'Arial',
              }),
            ],
          }),

          // ======================================================
          // LOGIN DETAILS
          // ======================================================

          new Table({
            width: {
              size: 5000,
              type: WidthType.DXA,
            },

            columnWidths: [
              1800,
              3200,
            ],

            rows: [
              new TableRow({
                cantSplit: true,

                children: [
                  new TableCell({
                    borders: cellBorders,

                    width: {
                      size: 1800,
                      type: WidthType.DXA,
                    },

                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 80,
                      right: 80,
                    },

                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              'Login ID:',
                            size: 19,
                            bold: true,
                            color: '374151',
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                  }),

                  new TableCell({
                    borders: cellBorders,

                    width: {
                      size: 3200,
                      type: WidthType.DXA,
                    },

                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 80,
                      right: 80,
                    },

                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              company.companyCode,
                            size: 19,
                            font: 'Courier New',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new TableRow({
                cantSplit: true,

                children: [
                  new TableCell({
                    borders: cellBorders,

                    width: {
                      size: 1800,
                      type: WidthType.DXA,
                    },

                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 80,
                      right: 80,
                    },

                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              'Password:',
                            size: 19,
                            bold: true,
                            color: '374151',
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                  }),

                  new TableCell({
                    borders: cellBorders,

                    width: {
                      size: 3200,
                      type: WidthType.DXA,
                    },

                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 80,
                      right: 80,
                    },

                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              m.password,
                            size: 19,
                            font: 'Courier New',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // ======================================================
          // 13. SUPPORT
          // ======================================================

          new Paragraph({
            spacing: {
              before: 250,
              after: 50,
            },

            shading: {
              fill: 'F3F4F6',
              type: ShadingType.CLEAR,
            },

            children: [
              new TextRun({
                text:
                  'For technical issues faced:',
                size: 19,
                bold: true,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            shading: {
              fill: 'F3F4F6',
              type: ShadingType.CLEAR,
            },

            spacing: {
              after: 80,
            },

            children: [
              new TextRun({
                text:
                  'Contact Smita Mishra — sm@fandoro.com',
                size: 19,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            shading: {
              fill: 'F3F4F6',
              type: ShadingType.CLEAR,
            },

            spacing: {
              after: 50,
            },

            children: [
              new TextRun({
                text:
                  'For data related issues:',
                size: 19,
                bold: true,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            shading: {
              fill: 'F3F4F6',
              type: ShadingType.CLEAR,
            },

            spacing: {
              after: 150,
            },

            children: [
              new TextRun({
                text:
                  'Contact Tarak Doshi — tarak@firesideventures.com',
                size: 19,
                color: '374151',
                font: 'Arial',
              }),
            ],
          }),

          // ======================================================
          // 14. FOOTER
          // ======================================================

          new Paragraph({
            spacing: {
              before: 350,
            },

            border: {
              top: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: 'E5E7EB',
                space: 8,
              },
            },

            children: [
              new TextRun({
                text:
                  'Fireside Ventures — ESG Reporting Platform',
                size: 18,
                color: '9CA3AF',
                font: 'Arial',
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              before: 0,
              after: 0,
            },

            children: [
              new TextRun({
                text:
                  'This is a confidential communication intended solely for the recipient.',
                size: 18,
                color: '9CA3AF',
                font: 'Arial',
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

const getEffectiveStatus = (item: ESGCapItem): CAPStatus => {
  const companyStatus = (item.companyStatus || item.status || "").toLowerCase();
  const investorStatus = normalize(item.investorStatus);

  // 3. Check company status
  if (companyStatus === "closed") {
    return "closed" as CAPStatus;
  }

  if (companyStatus === "partly-submitted") {
    return "partly-submitted" as CAPStatus;
  }

  if (companyStatus === "submitted") {
    return "submitted" as CAPStatus;
  }

  if (companyStatus === "submitted-pending-review") {
    return "submitted-pending-review" as CAPStatus;
  }

  if (companyStatus === "due-in-this-month") {
    return "due-in-this-month" as CAPStatus;
  }

  if (companyStatus === "overdue") {
    return "overdue" as CAPStatus;
  }

  // 1. Check investor status first (investor overrides)
  if (investorStatus === "closed") {
    return "closed" as CAPStatus;
  }

  // 2. Check if investor has marked as re-submit
  if (investorStatus === "re-submit requested") {
    return "re-submit-requested" as CAPStatus;
  }

  if (
    (investorStatus === "under-review" || investorStatus === "under review") &&
    (companyStatus === "submitted")
  ) {
    return "submitted-pending-review" as CAPStatus;
  }

  // 4. If no target date, return empty
  if (!item.targetDate) {
    return "" as CAPStatus;
  }

  // 5. Derive from targetDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(item.targetDate);
  target.setHours(0, 0, 0, 0);

  const isCurrentMonth =
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth();

  if (isCurrentMonth) {
    return "due-in-this-month" as CAPStatus;
  }

  if (target < today) {
    return "overdue" as CAPStatus;
  }

  return "upcoming" as CAPStatus;
};

const getCSCategory = (item: ESGCapItem) => {
  const CUTOFF_DATE = new Date('2026-06-30T23:59:59.999');

  if (!item.targetDate) {
    return null;
  }

  const targetDate = new Date(item.targetDate);

  if (isNaN(targetDate.getTime())) {
    return null;
  }
  const rawStatus = getEffectiveStatus(item);
  const companyStatus = normalize(rawStatus);
  // =====================================================
  // GET LATEST uploadedAt
  // =====================================================

  const uploadedDates = (item.completionIndicators || [])
    .map(indicator => indicator.uploadedAt)
    .filter(Boolean)
    .map(date => new Date(date as string))
    .filter(date => !isNaN(date.getTime()));

  const updatedDate =
    uploadedDates.length > 0
      ? new Date(
        Math.max(
          ...uploadedDates.map(date => date.getTime())
        )
      )
      : null;

  // =====================================================
  // TARGET DATE <= 30 JUNE 2026
  // =====================================================

  if (targetDate <= CUTOFF_DATE) {

    // ---------------------------------------------------
    // uploadedAt EXISTS
    // ---------------------------------------------------

    if (updatedDate) {

      // Uploaded on or before target date
      if (
        (companyStatus === 'submitted' || companyStatus === 'closed') &&
        updatedDate <= targetDate
      ) {
        return 'ontime';
      }

      // Uploaded after target date
      const months = getMonthDifference(
        targetDate,
        updatedDate
      );

      if (months === 1) return 'buffer1';
      if (months === 2) return 'buffer2';
      if (months === 3) return 'buffer3';
      if (months > 3) return 'over3';

      return null;
    }

    // ---------------------------------------------------
    // uploadedAt DOES NOT EXIST
    // ---------------------------------------------------

    // Old target + submitted = On Time
    if ((companyStatus === 'submitted' || companyStatus === 'closed')) {
      return 'ontime';
    }

    // ---------------------------------------------------
    // NOT COMPLETED
    // ---------------------------------------------------

    const today = new Date();

    const months = getMonthDifference(
      targetDate,
      today
    );

    if (months <= 3) {
      return 'under3';
    }

    return 'over3';
  }

  // =====================================================
  // TARGET DATE > 30 JUNE 2026
  // =====================================================

  const submitDate = getSubmitDate(item);

  if (submitDate) {

    // Submitted on or before target
    if (
      (companyStatus === 'submitted' || companyStatus === 'closed') &&
      submitDate <= targetDate
    ) {
      return 'ontime';
    }

    // Submitted after target
    const months = getMonthDifference(
      targetDate,
      submitDate
    );

    if (months === 1) return 'buffer1';
    if (months === 2) return 'buffer2';
    if (months === 3) return 'buffer3';
    if (months > 3) return 'over3';

    return null;
  }

  // =====================================================
  // NOT SUBMITTED
  // =====================================================

  const today = new Date();

  const months = getMonthDifference(
    targetDate,
    today
  );

  if (months <= 3) {
    return 'under3';
  }

  return 'over3';
};

const getCSCount = (
  priority: 'High' | 'Medium' | 'Low',
  type:
    | 'ontime'
    | 'buffer1'
    | 'buffer2'
    | 'buffer3'
    | 'under3'
    | 'over3'
    | 'upcoming',
  items: ESGCapItem[]
) => {

  let csItems = items.filter(item => item.dealCondition === 'CS');
  return csItems.filter(item => {
    if ((item.priority || 'Medium') !== priority) {
      return false;
    }

    return getCSCategory(item) === type;
  }).length;
};


// const getCSCount = (
//   priority: 'High' | 'Medium' | 'Low',
//   type:
//     | 'ontime'
//     | 'buffer1'
//     | 'buffer2'
//     | 'buffer3'
//     | 'under3'
//     | 'over3',
//   items: ESGCapItem[]
// ) => {
//   let csItems = items.filter(item => item.dealCondition === 'CS');
//   return csItems.filter(item => {

//     if ((item.priority || 'Medium') !== priority) {
//       return false;
//     }

//     if (!item.targetDate) {
//       return false;
//     }

//     const targetDate = new Date(item.targetDate);

//     if (isNaN(targetDate.getTime())) {
//       return false;
//     }

//     const submitDate = getSubmitDate(item);

//     // -----------------------------------------
//     // SUBMITTED
//     // -----------------------------------------
//     if (submitDate) {
//       const months = getMonthDifference(
//         targetDate,
//         submitDate
//       );

//       switch (type) {
//         case 'ontime':
//           return months <= 0;

//         case 'buffer1':
//           return months === 1;

//         case 'buffer2':
//           return months === 2;

//         case 'buffer3':
//           return months === 3;

//         case 'under3':
//           return false;

//         case 'over3':
//           return months > 3;

//         default:
//           return false;
//       }
//     }

//     // -----------------------------------------
//     // NOT SUBMITTED
//     // -----------------------------------------
//     const today = new Date();

//     const months = getMonthDifference(
//       targetDate,
//       today
//     );

//     // Target date has not passed
//     if (months <= 0) {
//       return false;
//     }

//     // Not submitted + overdue <= 3 months
//     if (type === 'under3') {
//       return months >= 1 && months <= 3;
//     }

//     // Not submitted + overdue > 3 months
//     if (type === 'over3') {
//       return months > 3;
//     }

//     return false;
//   }).length;
// };




const getSubmitDate = (item: any): Date | null => {
  // 1. Get latest uploadedAt from completionIndicators
  const uploadedDates = (item.completionIndicators || [])
    .map(indicator => indicator.uploadedAt)
    .filter(Boolean)
    .map(date => new Date(date as string))
    .filter(date => !isNaN(date.getTime()));

  if (uploadedDates.length > 0) {
    return new Date(
      Math.max(...uploadedDates.map(date => date.getTime()))
    );
  }

  // 2. If no uploadedAt and company is submitted,
  //    use item's createdAt
  if (normalize(item.companyStatus) === 'submitted') {
    if (item.createdAt) {
      const createdDate = new Date(item.createdAt);

      if (!isNaN(createdDate.getTime())) {
        return createdDate;
      }
    }
  }

  return null;
};

const getMonthDifference = (
  startDate: Date,
  endDate: Date
): number => {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  );
};

const normalize = (s?: string) => (s ?? '').trim().toLowerCase();

const calculateEsgMetrics = (items: ESGCapItem[]) => {
  let filteredItems = items.filter(item => item.dealCondition === 'CS' || item.dealCondition === 'CP');
  const dueThisMonthCount = filteredItems.filter(
    item => {
      const effectiveStatus = getEffectiveCompanyStatus(item);
      return effectiveStatus === 'due-in-this-month' && !isClosed(item);
    }
  ).length;

  const overdueCount = filteredItems.filter(
    item => getEffectiveCompanyStatus(item) === 'overdue' && !isClosed(item)
  ).length;

  const partlySubmittedCount = filteredItems.filter(
    item => getInvestorStatus(item) === 'partly-submitted'
  ).length;

  const resubmitRequestedCount = filteredItems.filter(
    item => getInvestorStatus(item) === 're-submit-requested'
  ).length;

  const submittedPendingReviewCount = filteredItems.filter(
    item => {
      const companyStatus = normalize(item.companyStatus ?? item.status);
      console.log('companyStatus', companyStatus);
      const investorStatus = normalize(item.investorStatus);
      // Company has submitted AND investor hasn't closed it yet
      return (companyStatus === 'submitted') &&
        (investorStatus === "under-review" ||
          investorStatus === "under review");
    }
  ).length;

  const closedCount = filteredItems.filter(
    item => isClosed(item)
  ).length;

  return {
    dueThisMonth: dueThisMonthCount,
    overdue: overdueCount,
    partlySubmitted: partlySubmittedCount,
    resubmitRequested: resubmitRequestedCount,
    submittedPendingReview: submittedPendingReviewCount,
    closed: closedCount,
  };

}

const getEffectiveCompanyStatus = (item: ESGCapItem): string => {
  const companyStatus = normalize(item.companyStatus ?? item.status);
  const investorStatus = normalize(item.investorStatus);

  // 🔥 1. INVESTOR STATUS TAKES PRIORITY - CHECK FIRST
  if (investorStatus === 'closed') {
    return 'closed';
  }
  if (investorStatus === 're-submit-requested' || investorStatus === 're-submit requested') {
    return 're-submit-requested';
  }
  if (investorStatus === 'partly-submitted' || investorStatus === 'partly submitted') {
    return 'partly-submitted';
  }
  if ((companyStatus === 'submitted' || companyStatus === 'submitted-pending-review') &&
    (investorStatus === 'under-review' || investorStatus === 'under review')) {
    return 'submitted-pending-review';
  }

  // 2. Check company status (only if investor status is not closed or overriding)
  if (companyStatus === 'closed') {
    return 'closed';
  }
  if (companyStatus === 'partly-submitted' || companyStatus === 'partly submitted') {
    return 'partly-submitted';
  }
  if (companyStatus === 'submitted' || companyStatus === 'submitted') {
    return 'submitted';
  }
  if ((companyStatus === 'submitted' || companyStatus === 'submitted-pending-review') &&
    (investorStatus === 'under-review' || investorStatus === 'under review')) {
    return 'submitted-pending-review';
  }
  if (companyStatus === 're-submit-required' || companyStatus === 're-submit required') {
    return 're-submit-requested';
  }
  if (companyStatus === 'overdue') {
    return 'overdue';
  }

  // 3. If no target date, return empty
  if (!item.targetDate) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(item.targetDate);
  target.setHours(0, 0, 0, 0);

  if (target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()) {
    return 'due-in-this-month';
  }

  if (target < today) {
    return 'overdue';
  }

  return 'upcoming';
};

const getInvestorStatus = (item: ESGCapItem): string => {
  const investorStatus = normalize(item.investorStatus);
  const companyStatus = normalize(item.companyStatus ?? item.status);

  // 🔥 1. Check investor status FIRST (handles both formats)
  if (investorStatus === 'closed') {
    return 'closed';
  }
  if (investorStatus === 're-submit-requested' || investorStatus === 're-submit requested') {
    return 're-submit-requested';
  }
  if (investorStatus === 'partly-submitted' || investorStatus === 'partly submitted') {
    return 'partly-submitted';
  }
  if (investorStatus === 'submitted-pending-review' || investorStatus === 'submitted pending review') {
    return 'submitted-pending-review';
  }

  // 2. Check company status (only if investor status is not set)
  if (companyStatus === 'closed') {
    return 'closed';
  }
  if (companyStatus === 'partly-submitted' || companyStatus === 'partly submitted') {
    return 'partly-submitted';
  }
  if (companyStatus === 'submitted-pending-review' || companyStatus === 'submitted pending review') {
    return 'submitted-pending-review';
  }
  if (companyStatus === 're-submit-required' || companyStatus === 're-submit required') {
    return 're-submit-requested';
  }

  // 3. Check high priority overdue
  if (companyStatus === 'overdue' &&
    (normalize(item.priority) === 'high' || normalize(item.priority) === 'high priority')) {
    return 'high-priority-overdue';
  }

  // 4. Return the effective status
  return getEffectiveCompanyStatus(item);
};

// Check if item is closed
const isClosed = (item: ESGCapItem): boolean => {
  return getInvestorStatus(item) === 'closed';
};

const getComplianceRating = (score: number = 0): { grade: string; label: string; color: string } => {
  if (score >= 81) {
    return { grade: "AA", label: "On Track", color: "text-green-600" };
  }
  if (score >= 61) {
    return { grade: "A", label: "Stable", color: "text-emerald-600" };
  }
  if (score >= 41) {
    return { grade: "BB", label: "Needs Attention", color: "text-yellow-600" };
  }
  if (score >= 21) {
    return { grade: "B", label: "At Risk", color: "text-orange-600" };
  }

  return { grade: "C", label: "Critical", color: "text-red-600" };
};

const getPriorityTotal = (
  priority: "High" | "Medium" | "Low",
  csItems: ESGCapItem[]
) => {
  return csItems.filter(
    item => (item.priority || "Medium") === priority && item.dealCondition == "CS"
  ).length;
};

const isCompanySubmitted = (item: ESGCapItem): boolean => {
  return normalize(item.companyStatus ?? item.status) === 'submitted';
};

const getCompletedOver3Count = (priority: 'High' | 'Medium' | 'Low', items: ESGCapItem[]) => {
  let csItems = items.filter(item => item.dealCondition === 'CS');
  return csItems.filter(item => {
    if ((item.priority || 'Medium') !== priority) return false;
    if (getCSCategory(item) !== 'over3') return false;
    return isCompanySubmitted(item);
  }).length;
};

const getNotCompletedOver3Count = (priority: 'High' | 'Medium' | 'Low', items: ESGCapItem[]) => {
  let csItems = items.filter(item => item.dealCondition === 'CS');
  return csItems.filter(item => {
    if ((item.priority || 'Medium') !== priority) return false;
    if (getCSCategory(item) !== 'over3') return false;
    return !isCompanySubmitted(item);
  }).length;
};







