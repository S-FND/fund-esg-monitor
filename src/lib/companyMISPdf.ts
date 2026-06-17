/**
 * Generates a downloadable MIS Scores PDF for a company's ESG dashboard.
 * Includes grouped bar charts for each metric showing Company vs Industry Avg vs Revenue Cohort Avg.
 */
import jsPDF from 'jspdf';

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};
import { CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';
import { CompanyRanking } from '@/hooks/usePortfolioRankings';
import {
  applyEnvironmentPercentileNormalization,
  applySocialScorePercentileNormalization,
  EnvCompanyData,
} from '@/lib/envScorePercentile';
import { RATIO_COMPONENT_COLUMNS } from '@/lib/ratioComponentColumns';
import { getMetricDisplayName } from '@/lib/metricDisplayNames';

export interface MISPdfParams {
  companyName: string;
  industry: string;
  revenueStage: string;
  companyId: string;
  companyRaw: CompanyRawMetrics;
  allCompaniesRaw: CompanyRawMetrics[];
  ranking: CompanyRanking;
  overallProgress: { filled: number; total: number; percentage: number };
}

const M = 12; // margin (tighter)

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need > doc.internal.pageSize.getHeight() - M) {
    doc.addPage();
    return M;
  }
  return y;
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  y += 6; // breathing room before section headings
  y = ensureSpace(doc, y, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(text, M, y);
  y += 1.5;
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.line(M, y, M + doc.getTextWidth(text), y);
  return y + 4;
}

function labelValue(doc: jsPDF, label: string, value: string, y: number, x: number = M): number {
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(value, x + doc.getTextWidth(label) + 2, y);
  return y + 4.5;
}

interface CalcRow { metric: string; rawValue: number; weight: number; contribution: number }

function drawCalcTable(doc: jsPDF, rows: CalcRow[], finalScore: number, y: number, pageW: number): number {
  y = ensureSpace(doc, y, rows.length * 5 + 20);
  const colX = [M, M + 80, M + 110, M + 135];
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  ['Metric', 'Score', 'Weight', 'Contribution'].forEach((h, i) => doc.text(h, colX[i], y));
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, pageW - M, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (const r of rows) {
    y = ensureSpace(doc, y, 6);
    doc.setTextColor(60, 60, 60);
    doc.text(r.metric, colX[0], y);
    doc.setTextColor(30, 30, 30);
    doc.text(r.rawValue.toFixed(1), colX[1], y);
    doc.text(`${r.weight}%`, colX[2], y);
    doc.text(r.contribution.toFixed(1), colX[3], y);
    y += 5;
  }
  y += 1;
  doc.setDrawColor(180, 180, 180);
  doc.line(M, y, pageW - M, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total Score:', colX[0], y);
  doc.text(finalScore.toFixed(1) + ' / 100', colX[3], y);
  return y + 5;
}

function drawPerformanceMetric(doc: jsPDF, title: string, description: string, percentile: number, explanation: string, y: number): number {
  y = ensureSpace(doc, y, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`${title}: ${percentile}${getOrdinalSuffix(percentile)} percentile`, M, y);
  y += 3.5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const lines = doc.splitTextToSize(description, 175);
  doc.text(lines, M, y);
  y += lines.length * 3 + 1;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const explLines = doc.splitTextToSize('Calculation: ' + explanation, 175);
  doc.text(explLines, M, y);
  y += explLines.length * 3 + 3;
  return y;
}

// ─── Percentile computation helpers (mirroring ESGScoreDetailDialog) ───

function buildEnvCompanyData(allCompanies: CompanyRawMetrics[]): EnvCompanyData[] {
  return allCompanies.map(c => ({
    companyId: c.companyId,
    kpis: c.kpis,
    insights: { ...c.insights },
    usesFashionPackaging: c.usesFashionPackaging,
    hasWaterFeature: (c as any).hasWaterFeature,
    hasEnvironmentFeature: c.hasEnvironmentFeature,
  }));
}

function computeEnvPercentiles(allCompanies: CompanyRawMetrics[]): Map<string, Record<string, number>> {
  return applyEnvironmentPercentileNormalization(buildEnvCompanyData(allCompanies));
}

function computeSocialPercentiles(allCompanies: CompanyRawMetrics[], sourcingIds: Set<string>): Map<string, Record<string, number>> {
  const envData = buildEnvCompanyData(allCompanies);
  applySocialScorePercentileNormalization(envData, sourcingIds);
  const result = new Map<string, Record<string, number>>();
  envData.forEach(c => {
    const sp = (c.insights as any)?._socialPercentiles;
    if (sp) {
      result.set(c.companyId, {
        'Supplier CoC In Place': sp.cocInPlace ?? 0,
        'Supplier CoC Training': sp.cocTraining ?? 0,
        'DEI Vendor %': sp.deiPctile ?? 0,
        'Gender Ratio': sp.genderRatioPctile ?? 0,
        'Women Leadership %': sp.womenLeadPctile ?? 0,
        'Pay Parity': sp.payParityPctile ?? 0,
      });
    }
  });
  return result;
}

function computeGovPercentiles(allCompanies: CompanyRawMetrics[]): Map<string, Record<string, number>> {
  const metricNames = ['Policy Adoption %', 'Training Coverage %', 'High Impact Unresolved %'];
  const rawMap = new Map<string, Record<string, number>>();
  allCompanies.forEach(c => {
    const govComps = RATIO_COMPONENT_COLUMNS.governanceScore.getValues(c);
    const vals: Record<string, number> = {};
    metricNames.forEach(m => { vals[m] = parseFloat(govComps[m] || '0') || 0; });
    rawMap.set(c.companyId, vals);
  });
  const result = new Map<string, Record<string, number>>();
  allCompanies.forEach(c => result.set(c.companyId, {}));
  metricNames.forEach(metric => {
    const vals = Array.from(rawMap.values()).map(v => v[metric]).filter(v => v > 0);
    const min = vals.length > 0 ? Math.min(...vals) : 0;
    const max = vals.length > 0 ? Math.max(...vals) : 0;
    const range = max - min;
    const inverted = metric === 'High Impact Unresolved %';
    rawMap.forEach((raw, cId) => {
      const v = raw[metric];
      let pctile = 0;
      if (v > 0 && range > 0) {
        pctile = inverted ? ((max - v) / range) * 100 : ((v - min) / range) * 100;
      } else if (v > 0 && range === 0) {
        pctile = 100;
      }
      result.get(cId)![metric] = Math.round(pctile * 10) / 10;
    });
  });
  return result;
}

function getGroupAvg(
  percMap: Map<string, Record<string, number>>,
  allCos: CompanyRawMetrics[],
  metric: string,
  groupType: 'industry' | 'revenue',
  groupValue: string,
): number {
  const group = allCos.filter(c =>
    groupType === 'industry' ? c.industry === groupValue : c.revenueStage === groupValue
  );
  const vals = group.map(c => percMap.get(c.companyId)?.[metric] ?? 0).filter(v => v > 0);
  return vals.length > 0 ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
}

// ─── Grouped bar chart drawing ───

const BAR_COLORS = {
  company: [59, 130, 246],   // blue
  industry: [34, 197, 94],   // green
  revenue: [245, 158, 11],   // amber
};

interface GroupedBarData {
  label: string;
  company: number;
  industryAvg: number;
  revenueAvg: number;
}

/**
 * Draws a grouped horizontal bar chart with 3 bars per metric.
 */
function drawGroupedBarChart(
  doc: jsPDF,
  title: string,
  bars: GroupedBarData[],
  startY: number,
  pageW: number,
): number {
  const barH = 3.5;
  const groupGap = 2;
  const groupHeight = barH * 3 + groupGap;
  const chartHeight = bars.length * groupHeight + 18;
  let y = ensureSpace(doc, startY, chartHeight);

  // Chart title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(title, M, y);
  y += 4;

  // Legend
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  const legendItems = [
    { label: 'Your Percentile', color: BAR_COLORS.company },
    { label: 'Industry Avg', color: BAR_COLORS.industry },
    { label: 'Revenue Cohort Avg', color: BAR_COLORS.revenue },
  ];
  let lx = M;
  for (const item of legendItems) {
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(lx, y - 2.5, 3, 3, 0.5, 0.5, 'F');
    lx += 4;
    doc.setTextColor(80, 80, 80);
    doc.text(item.label, lx, y);
    lx += doc.getTextWidth(item.label) + 4;
  }
  y += 3;

  const labelW = 55;
  const chartW = pageW - 2 * M - labelW - 20;
  const maxVal = Math.max(...bars.flatMap(b => [b.company, b.industryAvg, b.revenueAvg]), 1);

  for (const bar of bars) {
    y = ensureSpace(doc, y, groupHeight + 2);

    // Label
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const truncLabel = bar.label.length > 24 ? bar.label.slice(0, 22) + '…' : bar.label;
    doc.text(truncLabel, M, y + barH);

    // Draw 3 bars
    const entries: [number, number[]][] = [
      [bar.company, BAR_COLORS.company],
      [bar.industryAvg, BAR_COLORS.industry],
      [bar.revenueAvg, BAR_COLORS.revenue],
    ];

    for (let i = 0; i < entries.length; i++) {
      const [val, color] = entries[i];
      const barWidth = Math.max((val / maxVal) * chartW, 0.5);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(M + labelW, y + i * barH, barWidth, barH - 0.5, 0.8, 0.8, 'F');
      // Value label
      doc.setFontSize(5.5);
      doc.setTextColor(40, 40, 40);
      doc.text(String(Math.round(val)), M + labelW + barWidth + 1, y + i * barH + barH - 1);
    }

    y += groupHeight;
  }

  return y + 1;
}

// ─── Cohort percentile computation (mirrors CompanyDashboard.cohortPercentile) ───

function cohortPercentile(value: number, pool: CompanyRawMetrics[], key: string): number {
  const validScores = pool
    .filter(c => { const v = (c.insights as any)?.[key]; return v !== undefined && v !== null && !isNaN(v); })
    .map(c => (c.insights as any)[key] as number);
  if (validScores.length <= 1) return 99;
  const sorted = [...validScores].sort((a, b) => a - b);
  let idx = sorted.findIndex(v => v >= value);
  if (idx === -1) idx = sorted.length - 1;
  return Math.max(1, Math.min(99, Math.round(((idx + 1) / sorted.length) * 99)));
}

function drawESGCompositeChart(
  doc: jsPDF,
  companyId: string,
  industry: string,
  revenueStage: string,
  allCos: CompanyRawMetrics[],
  y: number,
  pageW: number,
): number {
  const bars: GroupedBarData[] = [];
  const submitting = allCos.filter(c => Object.keys(c.kpis).length > 0);
  const envEligible = submitting.filter(c => (c as any).hasEnvironmentFeature);
  const metrics = [
    { label: 'Environment', key: 'circularEconomyIndex', pool: envEligible },
    { label: 'Social', key: 'socialScore', pool: submitting },
    { label: 'Governance', key: 'governanceScore', pool: submitting },
  ];

  const companyData = allCos.find(c => c.companyId === companyId);

  for (const m of metrics) {
    const companyPctile = cohortPercentile(companyData?.insights?.[m.key as keyof typeof companyData.insights] as number ?? 0, m.pool, m.key);

    const indGroup = allCos.filter(c => c.industry === industry);
    const indPctiles = indGroup.map(c => cohortPercentile((c.insights as any)?.[m.key] ?? 0, m.pool, m.key));
    const indAvg = indPctiles.length > 0 ? Math.round(indPctiles.reduce((s, v) => s + v, 0) / indPctiles.length) : 0;

    const revGroup = allCos.filter(c => c.revenueStage === revenueStage);
    const revPctiles = revGroup.map(c => cohortPercentile((c.insights as any)?.[m.key] ?? 0, m.pool, m.key));
    const revAvg = revPctiles.length > 0 ? Math.round(revPctiles.reduce((s, v) => s + v, 0) / revPctiles.length) : 0;

    bars.push({ label: m.label, company: companyPctile, industryAvg: indAvg, revenueAvg: revAvg });
  }

  return drawGroupedBarChart(doc, 'ESG Composite — Percentile Comparison', bars, y, pageW);
}

// ─── Main PDF generation ───

export function generateCompanyMISPdf(params: MISPdfParams) {
  const { companyName, industry, revenueStage, companyId, companyRaw, allCompaniesRaw, ranking, overallProgress } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = M;

  // ─── Title ───
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('MIS Scores for ESG', M, y + 4);
  y += 11;

  y = labelValue(doc, 'Company Name:', companyName, y);
  y = labelValue(doc, 'Industry:', industry, y);
  y = labelValue(doc, 'Date of Download:', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), y);
  y = labelValue(doc, 'Period Covered:', 'January 2025 to December 2025', y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, pageW - M, y);
  y += 4;

  // ─── Progress Report (before Analytics) ───
  y = sectionTitle(doc, 'Progress Report', y);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('See how your ESG reporting compares to other portfolio companies.', M, y);
  y += 5;

  y = drawPerformanceMetric(doc, 'Completeness',
    `Your KPI completion rate is ${ranking.completionPct.toFixed(1)}% across all periods. This places you in the ${ranking.completenessPercentile}${getOrdinalSuffix(ranking.completenessPercentile)} percentile among portfolio companies.`,
    ranking.completenessPercentile,
    `Total filled KPIs ÷ Total assigned KPIs across Q1–Q4 and Annual. Percentile rank computed against all Invested companies.`,
    y);
  y = drawPerformanceMetric(doc, 'Consistency',
    `Your quarterly consistency score is ${ranking.consistencyPct.toFixed(1)}%. This places you in the ${ranking.consistencyPercentile}${getOrdinalSuffix(ranking.consistencyPercentile)} percentile among portfolio companies.`,
    ranking.consistencyPercentile,
    `For each KPI group, count how many eligible quarters have data, then average across all KPI groups. Percentile rank computed against all Invested companies.`,
    y);
  y = drawPerformanceMetric(doc, 'Timeliness',
    `Your timeliness score is ${ranking.timelinessScore.toFixed(1)}. This places you in the ${ranking.timelinessPercentile}${getOrdinalSuffix(ranking.timelinessPercentile)} percentile among portfolio companies.`,
    ranking.timelinessPercentile,
    `Based on the latest first-submission date across all periods. 100 = submitted by Feb 4; tiered decay to Mar 3 cutoff. Percentile rank computed against all Invested companies.`,
    y);

  // ─── Overall KPI Progress ───
  y = sectionTitle(doc, 'Overall KPI Progress', y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`${overallProgress.filled} of ${overallProgress.total} KPIs completed (${overallProgress.percentage}%)`, M, y);
  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const progExpl = `Progress is calculated as: (Number of filled KPI groups across Q1–Q4 and Annual Year) ÷ (Total assigned KPI groups based on company features and revenue stage) × 100.`;
  const progLines = doc.splitTextToSize(progExpl, 175);
  doc.text(progLines, M, y);
  y += progLines.length * 3 + 3;

  // ─── Analytics ───
  y = sectionTitle(doc, 'Analytics', y);
  const insights = companyRaw.insights || {} as any;
  const esgRawScore = insights.esgCompositeScore ?? 0;
  const envRawScore = insights.circularEconomyIndex ?? 0;
  const socRawScore = insights.socialScore ?? 0;
  const govRawScore = insights.governanceScore ?? 0;

  // Compute proper cohort percentile ranks (matching CompanyDashboard logic)
  const submitting = allCompaniesRaw.filter(c => Object.keys(c.kpis).length > 0);
  const envEligible = submitting.filter(c => (c as any).hasEnvironmentFeature);
  const envPercentile = cohortPercentile(envRawScore, envEligible, 'circularEconomyIndex');
  const socPercentile = cohortPercentile(socRawScore, submitting, 'socialScore');
  const govPercentile = cohortPercentile(govRawScore, submitting, 'governanceScore');
  const esgPercentile = cohortPercentile(esgRawScore, submitting, 'esgCompositeScore');

  // ESG Composite
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`ESG Composite Score: ${esgPercentile}${getOrdinalSuffix(esgPercentile)} percentile`, M, y);
  y += 4;
  y += 2;

  // ESG Composite chart
  y += 4; // space before chart
  y = drawESGCompositeChart(doc, companyId, industry, revenueStage, allCompaniesRaw, y, pageW);

  // ─── Environment Score Breakdown ───
  y = sectionTitle(doc, `Environment Percentile: ${envPercentile}${getOrdinalSuffix(envPercentile)}`, y);
  const isFashion = companyRaw.usesFashionPackaging === true;
  
  let envRows: CalcRow[] = [];
  // Compute percentile map once for both calc table and chart
  const envPercMap = computeEnvPercentiles(allCompaniesRaw);
  const compPerc = envPercMap.get(companyId) || {};
  const r2p = (v: number) => Math.round(v * 100) / 100;

  if (isFashion) {
    const rmPerc = compPerc['Recyclable Materials %'] ?? 0;
    const rpPerc = compPerc['Recyclable Packaging %'] ?? 0;
    const fwPerc = compPerc['Fresh Water Consumed %'] ?? 0;
    const wrPerc = compPerc['Water Recycled %'] ?? 0;
    envRows = [
      { metric: 'Recyclable Materials %', rawValue: r2p(rmPerc), weight: 40, contribution: r2p(rmPerc * 0.40) },
      { metric: 'Recyclable Packaging %', rawValue: r2p(rpPerc), weight: 40, contribution: r2p(rpPerc * 0.40) },
      { metric: 'Fresh Water Consumed %', rawValue: r2p(fwPerc), weight: 10, contribution: r2p(fwPerc * 0.10) },
      { metric: 'Water Recycled %', rawValue: r2p(wrPerc), weight: 10, contribution: r2p(wrPerc * 0.10) },
    ];
  } else {
    const vpPerc = compPerc['Virgin Plastic Reduction %'] ?? 0;
    const piPerc = compPerc['Plastic Intensity Score'] ?? 0;
    const mrPerc = compPerc['Material Recycled %'] ?? 0;
    const evPerc = compPerc['EPR/VPN %'] ?? 0;
    const psPerc = compPerc['P&S Recycled/Pkg %'] ?? 0;
    const rcPerc = compPerc['Recyclable %'] ?? 0;
    envRows = [
      { metric: 'Virgin Plastic Reduction %', rawValue: r2p(vpPerc), weight: 20, contribution: r2p(vpPerc * 0.20) },
      { metric: 'Plastic Intensity Score', rawValue: r2p(piPerc), weight: 30, contribution: r2p(piPerc * 0.30) },
      { metric: 'Material Recycled %', rawValue: r2p(mrPerc), weight: 20, contribution: r2p(mrPerc * 0.20) },
      { metric: 'EPR/VPN %', rawValue: r2p(evPerc), weight: 10, contribution: r2p(evPerc * 0.10) },
      { metric: 'P&S Recycled/Pkg %', rawValue: r2p(psPerc), weight: 10, contribution: r2p(psPerc * 0.10) },
      { metric: 'Recyclable %', rawValue: r2p(rcPerc), weight: 10, contribution: r2p(rcPerc * 0.10) },
    ];
  }

  // Environment metric charts (reuse the envPercMap computed above)
  const envMetricNames = envRows.map(r => r.metric);
  const envChartBars: GroupedBarData[] = envMetricNames.map(metric => ({
    label: getMetricDisplayName(metric),
    company: envPercMap.get(companyId)?.[metric] ?? 0,
    industryAvg: getGroupAvg(envPercMap, allCompaniesRaw, metric, 'industry', industry),
    revenueAvg: getGroupAvg(envPercMap, allCompaniesRaw, metric, 'revenue', revenueStage),
  }));
  y += 4; // space before chart
  y = drawGroupedBarChart(doc, 'Environment — Percentile Comparison', envChartBars, y, pageW);

  // ─── Social Score Breakdown ───
  y = sectionTitle(doc, `Social Percentile: ${socPercentile}${getOrdinalSuffix(socPercentile)}`, y);
  let socRows: CalcRow[] = [];
  const sp = (companyRaw.insights as any)?._socialPercentiles;
  if (sp) {
    if (sp.hasSourcing) {
      socRows = [
        { metric: 'Supplier CoC In Place', rawValue: sp.cocInPlace ?? 0, weight: 10, contribution: (sp.cocInPlace ?? 0) * 0.10 },
        { metric: 'Supplier CoC Training', rawValue: sp.cocTraining ?? 0, weight: 10, contribution: (sp.cocTraining ?? 0) * 0.10 },
        { metric: 'DEI Vendor %', rawValue: sp.deiPctile ?? 0, weight: 10, contribution: (sp.deiPctile ?? 0) * 0.10 },
        { metric: 'Gender Ratio', rawValue: sp.genderRatioPctile ?? 0, weight: 25, contribution: (sp.genderRatioPctile ?? 0) * 0.25 },
        { metric: 'Women Leadership %', rawValue: sp.womenLeadPctile ?? 0, weight: 25, contribution: (sp.womenLeadPctile ?? 0) * 0.25 },
        { metric: 'Pay Parity', rawValue: sp.payParityPctile ?? 0, weight: 20, contribution: (sp.payParityPctile ?? 0) * 0.20 },
      ];
    } else {
      socRows = [
        { metric: 'Gender Ratio', rawValue: sp.genderRatioPctile ?? 0, weight: 35, contribution: (sp.genderRatioPctile ?? 0) * 0.35 },
        { metric: 'Women Leadership %', rawValue: sp.womenLeadPctile ?? 0, weight: 35, contribution: (sp.womenLeadPctile ?? 0) * 0.35 },
        { metric: 'Pay Parity', rawValue: sp.payParityPctile ?? 0, weight: 30, contribution: (sp.payParityPctile ?? 0) * 0.30 },
      ];
    }
  }

  // Social metric charts
  const sourcingIds = new Set<string>();
  allCompaniesRaw.forEach(c => {
    const csp = (c.insights as any)?._socialPercentiles;
    if (csp?.hasSourcing) sourcingIds.add(c.companyId);
  });
  const socPercMap = computeSocialPercentiles(allCompaniesRaw, sourcingIds);
  const socMetricNames = socRows.map(r => r.metric);
  const socChartBars: GroupedBarData[] = socMetricNames.map(metric => ({
    label: getMetricDisplayName(metric),
    company: socPercMap.get(companyId)?.[metric] ?? 0,
    industryAvg: getGroupAvg(socPercMap, allCompaniesRaw, metric, 'industry', industry),
    revenueAvg: getGroupAvg(socPercMap, allCompaniesRaw, metric, 'revenue', revenueStage),
  }));
  y += 4; // space before chart
  y = drawGroupedBarChart(doc, 'Social — Percentile Comparison', socChartBars, y, pageW);

  // ─── Governance Score Breakdown ───
  y = sectionTitle(doc, `Governance Percentile: ${govPercentile}${getOrdinalSuffix(govPercentile)}`, y);
  const govComps = RATIO_COMPONENT_COLUMNS.governanceScore.getValues(companyRaw);
  const policyAdopt = parseFloat(govComps['Policy Adoption %'] || '0') || 0;
  const trainingCov = parseFloat(govComps['Training Coverage %'] || '0') || 0;
  const highImpact = parseFloat(govComps['High Impact Unresolved %'] || '0') || 0;
  const govRows: CalcRow[] = [
    { metric: 'Policy Adoption %', rawValue: policyAdopt, weight: 40, contribution: policyAdopt * 0.40 },
    { metric: 'Training Coverage %', rawValue: trainingCov, weight: 40, contribution: trainingCov * 0.40 },
    { metric: 'High Impact Unresolved %', rawValue: highImpact, weight: 20, contribution: Math.max(0, 100 - highImpact) * 0.20 },
  ];

  // Governance metric charts
  const govPercMap = computeGovPercentiles(allCompaniesRaw);
  const govMetricNames = govRows.map(r => r.metric);
  const govChartBars: GroupedBarData[] = govMetricNames.map(metric => ({
    label: getMetricDisplayName(metric),
    company: govPercMap.get(companyId)?.[metric] ?? 0,
    industryAvg: getGroupAvg(govPercMap, allCompaniesRaw, metric, 'industry', industry),
    revenueAvg: getGroupAvg(govPercMap, allCompaniesRaw, metric, 'revenue', revenueStage),
  }));
  y += 4; // space before chart
  y = drawGroupedBarChart(doc, 'Governance — Percentile Comparison', govChartBars, y, pageW);


  // ─── Footer ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Fireside Ventures • MIS Scores for ESG • Page ${i} of ${totalPages}`, M, doc.internal.pageSize.getHeight() - 7);
  }

  doc.save(`MIS_Scores_ESG_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
