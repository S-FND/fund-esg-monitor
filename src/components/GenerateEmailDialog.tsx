import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Download, Loader2, FileText, Code } from 'lucide-react';
import { mockCompanies, generateUniquePassword } from '@/data/mockData';
import { usePortfolioRankings, CompanyRanking } from '@/hooks/usePortfolioRankings';
import { useAnalyticsDashboardData, CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';
import { useAllQuartersProgress } from '@/hooks/useAllQuartersProgress';
import { isCompanyExcluded } from '@/lib/companyExclusions';
import { toast } from 'sonner';

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

type ScoreFormat = 'percentile' | 'category';

const percentileToCategory = (p: number): string => {
  if (p >= 80) return 'AA';
  if (p >= 60) return 'A';
  if (p >= 40) return 'BB';
  if (p >= 20) return 'B';
  return 'C';
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

function generateEmailHTML(
  company: typeof mockCompanies[0],
  ranking: CompanyRanking,
  companyRaw: CompanyRawMetrics | undefined,
  allCompaniesRaw: CompanyRawMetrics[],
  allRankings: CompanyRanking[],
  overallProgress: { filled: number; total: number; percentage: number },
  scoreFormat: ScoreFormat = 'percentile',
) {
  const insights = companyRaw?.insights || {} as any;
  const industry = companyRaw?.industry || company.industry || '';
  const revenueStage = companyRaw?.revenueStage || company.revenueStage || '';

  // ─── Performance metric percentiles (using raw scores + cohort ranking, matching ESGCategoryBreakdown) ───
  const allAvgScores = allRankings.map(r => Math.round((r.completionPct + r.consistencyPct + r.timelinessScore) / 3 * 10) / 10);
  const allComplScores = allRankings.map(r => r.completionPct);
  const allConsScores = allRankings.map(r => r.consistencyPct);
  const allTimeScores = allRankings.map(r => r.timelinessScore);
  const myAvgScore = Math.round((ranking.completionPct + ranking.consistencyPct + ranking.timelinessScore) / 3 * 10) / 10;
  const overallPercentile = cohortPercentile(myAvgScore, allAvgScores);
  const completenessPercentile = cohortPercentile(ranking.completionPct, allComplScores);
  const consistencyPercentile = cohortPercentile(ranking.consistencyPct, allConsScores);
  const timelinessPercentile = cohortPercentile(ranking.timelinessScore, allTimeScores);

  // ─── ESG pillar percentiles (matching Category Breakdown filtering: only companies with valid scores) ───
  const pillarKeys = ['circularEconomyIndex', 'socialScore', 'governanceScore'] as const;
  // Filter to only companies with submitted data (at least one KPI)
  const submittingRaw = allCompaniesRaw.filter(c => Object.keys(c.kpis).length > 0);
  // For environment, further filter to companies with active env features
  const envEligibleRaw = submittingRaw.filter(c => (c as any).hasEnvironmentFeature);

  const getValidScores = (pool: CompanyRawMetrics[], key: string): number[] =>
    pool.filter(c => {
      const v = (c.insights as any)?.[key];
      return v !== undefined && v !== null && !isNaN(v);
    }).map(c => (c.insights as any)[key] as number);

  const envPool = getValidScores(envEligibleRaw, 'circularEconomyIndex');
  const socPool = getValidScores(submittingRaw, 'socialScore');
  const govPool = getValidScores(submittingRaw, 'governanceScore');
  const esgPool = getValidScores(submittingRaw, 'esgCompositeScore');

  const envPercentile = cohortPercentile(insights.circularEconomyIndex ?? 0, envPool);
  const socPercentile = cohortPercentile(insights.socialScore ?? 0, socPool);
  const govPercentile = cohortPercentile(insights.governanceScore ?? 0, govPool);
  const esgCompositePercentile = cohortPercentile(insights.esgCompositeScore ?? 0, esgPool);

  const allPillarPools = [envPool, socPool, govPool];
  const pillarData = pillarKeys.map((key, i) => {
    const companyPctile = [envPercentile, socPercentile, govPercentile][i];
    const pool = allPillarPools[i];

    // Sector avg: average of cohort percentiles for companies in same industry
    const indGroup = (i === 0 ? envEligibleRaw : submittingRaw).filter(c => c.industry === industry && !isNaN((c.insights as any)?.[key] ?? NaN));
    const indAvg = indGroup.length > 0 ? Math.round(indGroup.reduce((s, c) => s + cohortPercentile((c.insights as any)?.[key] ?? 0, pool), 0) / indGroup.length) : 0;

    // Revenue cohort avg: average of cohort percentiles for companies in same revenue stage
    const revGroup = (i === 0 ? envEligibleRaw : submittingRaw).filter(c => c.revenueStage === revenueStage && !isNaN((c.insights as any)?.[key] ?? NaN));
    const revAvg = revGroup.length > 0 ? Math.round(revGroup.reduce((s, c) => s + cohortPercentile((c.insights as any)?.[key] ?? 0, pool), 0) / revGroup.length) : 0;

    return { companyPctile, indAvg, revAvg };
  });

  // ESG Composite sector/revenue cohort averages
  const esgIndGroup = submittingRaw.filter(c => c.industry === industry && !isNaN((c.insights as any)?.esgCompositeScore ?? NaN));
  const esgCompositeIndAvg = esgIndGroup.length > 0 ? Math.round(esgIndGroup.reduce((s, c) => s + cohortPercentile((c.insights as any)?.esgCompositeScore ?? 0, esgPool), 0) / esgIndGroup.length) : 0;
  const esgRevGroup = submittingRaw.filter(c => c.revenueStage === revenueStage && !isNaN((c.insights as any)?.esgCompositeScore ?? NaN));
  const esgCompositeRevAvg = esgRevGroup.length > 0 ? Math.round(esgRevGroup.reduce((s, c) => s + cohortPercentile((c.insights as any)?.esgCompositeScore ?? 0, esgPool), 0) / esgRevGroup.length) : 0;

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
      <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;"><strong>Overall</strong></div>
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

<h2 style="font-size:17px;color:#2d2d2d;margin:28px 0 8px 0;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">ESG&nbsp;Composite&nbsp;Score: ${fmtScore(esgCompositePercentile)} (n=${esgPool.length})</h2>

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
  <p style="margin:0 0 6px 0;font-size:14px;"><strong>URL :</strong> <a href="https://fireside.fandoro.ai/" style="color:#2563eb;font-weight:600;">https://fireside.fandoro.ai/</a></p>
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
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
                  new TextRun({ text: card.label, size: 16, bold: true, color: '6B7280', font: 'Arial' }),
                ]}),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: card.value, size: 22, bold: true, color: '059669', font: 'Arial' }),
                ]}),
              ],
            })),
          })],
        }),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // ESG Chart heading
        new Paragraph({ spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB', space: 4 } }, children: [
          new TextRun({ text: `ESG Composite Score: ${fmtScore(esgCompositePercentile)} (n=${allEsgScores.length}) — ${isCat ? 'Category' : 'Percentile'} Comparison`, size: 30, bold: true, color: '2D2D2D', font: 'Arial' }),
        ]}),

        // Legend
        new Table({
          width: { size: 8200, type: WidthType.DXA },
          columnWidths: [2700, 2700, 2800],
          rows: [new TableRow({
            children: [
              new TableCell({ borders: noBorders, width: { size: 2700, type: WidthType.DXA }, children: [new Paragraph({ children: [
                new TextRun({ text: '■ ', color: '3B82F6', size: 20, font: 'Arial' }),
                new TextRun({ text: `Your ${isCat ? 'Category' : 'Percentile'}`, color: '6B7280', size: 20, font: 'Arial' }),
              ]})] }),
              new TableCell({ borders: noBorders, width: { size: 2700, type: WidthType.DXA }, children: [new Paragraph({ children: [
                new TextRun({ text: '■ ', color: '22C55E', size: 20, font: 'Arial' }),
                new TextRun({ text: 'Sector Avg', color: '6B7280', size: 20, font: 'Arial' }),
              ]})] }),
              new TableCell({ borders: noBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [
                new TextRun({ text: '■ ', color: 'F59E0B', size: 20, font: 'Arial' }),
                new TextRun({ text: 'Revenue Cohort Avg', color: '6B7280', size: 20, font: 'Arial' }),
              ]})] }),
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
        new Paragraph({ shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, spacing: { before: 400, after: 60 }, children: [
          new TextRun({ text: 'Curious how your metrics are calculated and how you compare with your sector and revenue peers? Log in to view your results and tailored ESG recommendations.', size: 22, italics: true, color: '374151', font: 'Arial' }),
        ]}),
        // URL line
        new Paragraph({ shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, spacing: { after: 60 }, children: [
          new TextRun({ text: 'URL : ', size: 22, bold: true, color: '374151', font: 'Arial' }),
          new TextRun({ text: 'https://fireside.fandoro.ai/', size: 22, bold: true, color: '2563EB', font: 'Arial' }),
        ]}),
        new Table({
          width: { size: 5000, type: WidthType.DXA },
          columnWidths: [1800, 3200],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: 'Login ID:', size: 22, bold: true, color: '374151', font: 'Arial' })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: company.companyCode, size: 22, font: 'Courier New' })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: 'Password:', size: 22, bold: true, color: '374151', font: 'Arial' })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: password, size: 22, font: 'Courier New' })] })] }),
            ]}),
          ],
        }),

        // Contact block
        new Paragraph({ spacing: { before: 300, after: 60 }, shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, children: [
          new TextRun({ text: 'For technical issues faced:', size: 22, bold: true, color: '374151', font: 'Arial' }),
        ]}),
        new Paragraph({ shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 100 }, children: [
          new TextRun({ text: 'Contact Smita Mishra — sm@fandoro.com', size: 22, color: '374151', font: 'Arial' }),
        ]}),
        new Paragraph({ shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 60 }, children: [
          new TextRun({ text: 'For data related issues:', size: 22, bold: true, color: '374151', font: 'Arial' }),
        ]}),
        new Paragraph({ shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, spacing: { after: 200 }, children: [
          new TextRun({ text: 'Contact Tarak Doshi — tarak@firesideventures.com', size: 22, color: '374151', font: 'Arial' }),
        ]}),

        // Footer
        new Paragraph({ spacing: { before: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB', space: 8 } }, children: [
          new TextRun({ text: 'Fireside Ventures — ESG Reporting Platform', size: 20, color: '9CA3AF', font: 'Arial' }),
        ]}),
        new Paragraph({ children: [
          new TextRun({ text: 'This is a confidential communication intended solely for the recipient.', size: 20, color: '9CA3AF', font: 'Arial' }),
        ]}),
      ],
    }],
  });

  return Packer.toBlob(doc);
}

type ExportFormat = 'html' | 'docx';

interface Props {
  year?: number;
  quarter?: string;
}

export const GenerateEmailDialog = ({ year = 2026, quarter = 'Q1' }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('html');
  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>('percentile');

  const { rankings, isLoading: rankingsLoading } = usePortfolioRankings(year, quarter);

  // Use annual combined view — aggregates Q1-Q4 data with percentile normalization across all companies
  const analyticsData = useAnalyticsDashboardData({
    period: 'annual',
    year,
  });

  const eligibleCompanies = mockCompanies.filter(c => !isCompanyExcluded(c.id, quarter, year));

  // We need overall progress for each company — use selected company's progress for preview
  const selectedProgress = useAllQuartersProgress(selectedCompanyId || 'none', year, 0, true);

  const handleDownload = async (companyId: string) => {
    const company = mockCompanies.find(c => c.id === companyId);
    if (!company) return false;

    const ranking = rankings.find(r => r.companyId === companyId);
    if (!ranking) return false;

    const rawData = analyticsData.data?.quarterlyCombinedRawData || analyticsData.data?.companyRawData || [];
    const companyRaw = rawData.find(c => c.companyId === companyId);

    const overallProgress = {
      filled: Math.round((ranking.completionPct / 100) * 100),
      total: 100,
      percentage: Math.round(ranking.completionPct),
    };

    const brandSlug = company.brand.replace(/\s+/g, '_');

    if (format === 'docx') {
      const blob = await generateEmailDOCX(company, ranking, companyRaw, rawData, rankings, overallProgress, scoreFormat);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brandSlug}_ESG_Email.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const html = generateEmailHTML(company, ranking, companyRaw, rawData, rankings, overallProgress, scoreFormat);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brandSlug}_ESG_Email.html`;
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
