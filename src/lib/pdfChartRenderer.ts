/**
 * Programmatic chart renderer for jsPDF.
 * Draws horizontal bar charts directly using jsPDF primitives,
 * enabling all-feature chart export without DOM rendering.
 */
import jsPDF from 'jspdf';
import { FEATURE_FIELD_MAPPINGS } from '@/lib/featureFieldMapping';
import { FEATURE_INSIGHT_METRICS } from '@/lib/featureInsightMetrics';
import { CompanyRawMetrics, InsightMetrics } from '@/hooks/useAnalyticsDashboardData';

const BAR_COLORS = [
  [34, 197, 94],   // green
  [59, 130, 246],  // blue
  [245, 158, 11],  // amber
  [168, 85, 247],  // purple
  [239, 68, 68],   // red
  [20, 184, 166],  // teal
  [249, 115, 22],  // orange
  [139, 92, 246],  // violet
  [236, 72, 153],  // pink
  [6, 182, 212],   // cyan
];

interface ChartBarData {
  label: string;
  value: number;
}

/**
 * Draw a horizontal bar chart directly on the PDF.
 * Returns the y position after the chart.
 */
const drawHorizontalBarChart = (
  doc: jsPDF,
  chartTitle: string,
  bars: ChartBarData[],
  startY: number,
  margin: number,
  pageW: number,
  pageH: number,
  unit: string = '',
): number => {
  let y = startY;
  const barH = 5;
  const labelW = 50;
  const chartW = pageW - 2 * margin - labelW - 25;
  const maxVal = Math.max(...bars.map(b => Math.abs(b.value)), 1);

  // Check if chart fits on current page
  const chartHeight = bars.length * (barH + 2) + 12;
  if (y + chartHeight > pageH - margin) {
    doc.addPage();
    y = margin;
  }

  // Chart title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(chartTitle, margin, y + 3);
  y += 7;

  // Draw bars
  bars.slice(0, 10).forEach((bar, i) => {
    const color = BAR_COLORS[i % BAR_COLORS.length];
    const barWidth = Math.max((bar.value / maxVal) * chartW, 1);

    // Label
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const truncLabel = bar.label.length > 22 ? bar.label.slice(0, 20) + '…' : bar.label;
    doc.text(truncLabel, margin, y + barH - 1);

    // Bar
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(margin + labelW, y, barWidth, barH, 1, 1, 'F');

    // Value
    doc.setFontSize(6);
    doc.setTextColor(40, 40, 40);
    const valText = `${Math.round(bar.value * 100) / 100}${unit}`;
    doc.text(valText, margin + labelW + barWidth + 2, y + barH - 1);

    y += barH + 2;
  });

  return y + 3;
};

export interface FeatureChartSection {
  featureLabel: string;
  charts: { title: string; bars: ChartBarData[]; unit: string }[];
}

/**
 * Build chart data for all features from raw company data.
 */
export const buildAllFeatureCharts = (
  companyRawData: CompanyRawMetrics[],
  features: { key: string; label: string }[],
): FeatureChartSection[] => {
  const sections: FeatureChartSection[] = [];

  for (const feature of features) {
    const mapping = FEATURE_FIELD_MAPPINGS[feature.key];
    if (!mapping) continue;

    const charts: { title: string; bars: ChartBarData[]; unit: string }[] = [];

    // 1. Aggregation charts: For numeric KPIs, build a bar chart per KPI showing company values
    for (const kpi of mapping.kpis) {
      // Try fields first, then fall back to kpi.id
      const fieldsToChart = kpi.fields && kpi.fields.length > 0
        ? kpi.fields.filter(f => {
            // Skip categorical/text fields
            const id = f.id.toLowerCase();
            return !id.includes('_list') && !id.includes('_names') && !id.includes('description') &&
              !id.includes('_note') && !id.includes('_comments') && !id.includes('weblinks') &&
              !id.includes('_initiatives') && !id.includes('partner_name') && !id.includes('classification');
          })
        : [{ id: kpi.id, label: kpi.label }];

      for (const field of fieldsToChart) {
        const bars: ChartBarData[] = [];
        for (const company of companyRawData) {
          const rawVal = company.kpis[field.id];
          if (!rawVal || rawVal.trim() === '') continue;
          const num = parseFloat(rawVal);
          if (isNaN(num)) continue;
          bars.push({ label: company.brand, value: num });
        }
        // Only create chart if we have 2+ data points
        if (bars.length >= 2) {
          bars.sort((a, b) => b.value - a.value);
          charts.push({
            title: field.label,
            bars: bars.slice(0, 10),
            unit: '',
          });
        }
      }
    }

    // 2. Insight charts: company-wise insight metric values
    const insightMetrics = FEATURE_INSIGHT_METRICS[feature.key] || [];
    for (const metric of insightMetrics) {
      const bars: ChartBarData[] = [];
      for (const company of companyRawData) {
        const val = company.insights?.[metric.key];
        if (val != null && typeof val === 'number' && val !== 0 && isFinite(val)) {
          bars.push({ label: company.brand, value: val });
        }
      }
      if (bars.length >= 2) {
        bars.sort((a, b) => b.value - a.value);
        charts.push({
          title: `${metric.label} (Insight)`,
          bars: bars.slice(0, 10),
          unit: metric.unit,
        });
      }
    }

    if (charts.length > 0) {
      sections.push({ featureLabel: feature.label, charts });
    }
  }

  return sections;
};

/**
 * Render all feature chart sections into a jsPDF document.
 * Returns the y position after rendering.
 */
export const renderFeatureChartsInPDF = (
  doc: jsPDF,
  sections: FeatureChartSection[],
  startY: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = startY;

  for (const section of sections) {
    // Feature header
    if (y + 20 > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    // Feature separator line
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    // Feature title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(section.featureLabel, margin, y + 4);
    y += 8;

    // Render each chart
    for (const chart of section.charts) {
      y = drawHorizontalBarChart(doc, chart.title, chart.bars, y, margin, pageW, pageH, chart.unit);
    }

    y += 2;
  }

  return y;
};
