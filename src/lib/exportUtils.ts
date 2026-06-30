/**
 * Shared export utilities for XLSX, CSV and PDF generation.
 * Used by AdminDashboard and AnalyticsDetail pages.
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { FeatureChartSection, renderFeatureChartsInPDF } from './pdfChartRenderer';

// ─── CSV Export ───

const escapeCell = (cell: string) => {
  const clean = String(cell ?? '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
  return `"${clean}"`;
};

export interface ExportColumn {
  header: string;
  accessor: (row: any) => string;
}

export const exportCSV = (
  filename: string,
  columns: ExportColumn[],
  rows: any[],
) => {
  const headers = columns.map(c => c.header);
  const csvRows = rows.map(row => columns.map(c => escapeCell(c.accessor(row))));
  const csv = [headers.map(escapeCell), ...csvRows].map(r => r.join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Export a transposed CSV: KPI fields as rows, companies as columns.
 * Takes the same columns/rows structure as exportCSV but pivots the output.
 */
export const exportTransposedCSV = (
  filename: string,
  columns: ExportColumn[],
  rows: any[],
) => {
  // First column header is "KPI Field", remaining are company brands
  const companyNames = rows.map(r => columns[0].accessor(r)); // Brand names from first column
  const headerRow = ['KPI Field', ...companyNames].map(escapeCell);

  // Each non-brand column becomes a row
  const dataRows = columns.slice(1).map(col => {
    const fieldName = col.header;
    const values = rows.map(r => col.accessor(r));
    return [fieldName, ...values].map(escapeCell);
  });

  const csv = [headerRow, ...dataRows].map(r => r.join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── XLSX Export ───

/**
 * Export data as a proper XLSX file with formatting, headers, and summary formulas.
 * Supports transposed layout (KPIs as rows, companies as columns) used by admin dashboard.
 */
export const exportXLSX = (
  filename: string,
  columns: ExportColumn[],
  rows: any[],
  options?: { transposed?: boolean; sheetName?: string; summaryCards?: { label: string; value: string }[] },
) => {
  const wb = XLSX.utils.book_new();
  const transposed = options?.transposed ?? false;
  const sheetName = options?.sheetName || 'Data';

  if (transposed) {
    // Transposed: KPI fields as rows, companies as columns
    const companyNames = rows.map(r => columns[0].accessor(r));
    const headerRow = ['KPI Field', ...companyNames];
    const dataRows = columns.slice(1).map(col => {
      const fieldName = col.header;
      const values = rows.map(r => {
        const raw = col.accessor(r);
        const num = parseFloat(raw);
        return raw !== '' && !isNaN(num) && raw.trim() === String(num) ? num : raw;
      });
      return [fieldName, ...values];
    });

    const wsData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style: freeze first column and first row
    ws['!freeze'] = { xSplit: 1, ySplit: 1 };

    // Column widths
    ws['!cols'] = [
      { wch: 45 }, // KPI Field column
      ...companyNames.map(() => ({ wch: 18 })),
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  } else {
    // Standard: companies as rows, columns as headers
    const headerRow = columns.map(c => c.header);
    const dataRows = rows.map(row =>
      columns.map(col => {
        const raw = col.accessor(row);
        const num = parseFloat(raw);
        return raw !== '' && !isNaN(num) && raw.trim() === String(num) ? num : raw;
      })
    );

    const wsData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Freeze header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Column widths based on header length
    ws['!cols'] = columns.map(col => ({
      wch: Math.min(40, Math.max(12, col.header.length + 2)),
    }));

    // Add summary row with formulas if numeric data
    if (rows.length > 0) {
      const summaryRowIdx = rows.length + 1; // 0-indexed after header
      const summaryRow: any[] = columns.map((col, colIdx) => {
        if (colIdx === 0) return 'TOTAL / AVG';
        // Check if this column has numeric data
        const sampleVal = col.accessor(rows[0]);
        const isNum = sampleVal !== '' && !isNaN(parseFloat(sampleVal));
        if (isNum) {
          const colLetter = XLSX.utils.encode_col(colIdx);
          return { f: `AVERAGE(${colLetter}2:${colLetter}${rows.length + 1})` };
        }
        return '';
      });

      // Add the summary row
      XLSX.utils.sheet_add_aoa(ws, [summaryRow.map(v => typeof v === 'object' ? 0 : v)], { origin: summaryRowIdx });
      // Set formulas for numeric columns
      summaryRow.forEach((v, colIdx) => {
        if (typeof v === 'object' && v.f) {
          const cellRef = XLSX.utils.encode_cell({ r: summaryRowIdx, c: colIdx });
          if (!ws[cellRef]) ws[cellRef] = {};
          ws[cellRef].f = v.f;
          ws[cellRef].t = 'n';
        }
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Add Summary sheet if summary cards provided
  if (options?.summaryCards && options.summaryCards.length > 0) {
    const summaryData = [
      ['Metric', 'Value'],
      ...options.summaryCards.map(c => {
        const num = parseFloat(c.value.replace(/[₹,%]/g, '').replace(/,/g, ''));
        return [c.label, !isNaN(num) ? num : c.value];
      }),
      [],
      ['Export Date', new Date().toLocaleString()],
      ['Source', 'Fireside Ventures — ESG MIS Platform'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Export detail view data as XLSX with proper formatting.
 */
export const exportDetailXLSX = (
  filename: string,
  columns: ExportColumn[],
  rows: any[],
  options?: { title?: string; summaryCards?: { label: string; value: string }[] },
) => {
  exportXLSX(filename, columns, rows, {
    transposed: false,
    sheetName: 'Detail Data',
    summaryCards: options?.summaryCards,
  });
};



/**
 * Capture all visible Recharts containers within a given root element (or document).
 * Returns an array of { title, dataUrl, width, height } for embedding into PDFs.
 */
export const captureCharts = async (
  rootSelector?: string,
): Promise<{ title: string; dataUrl: string; width: number; height: number }[]> => {
  const root = rootSelector ? document.querySelector(rootSelector) : document.body;
  if (!root) return [];

  // Find all recharts wrapper containers
  const rechartsEls = root.querySelectorAll('.recharts-responsive-container');
  const results: { title: string; dataUrl: string; width: number; height: number }[] = [];

  for (const el of Array.from(rechartsEls)) {
    // Walk up to find the parent Card element for title context
    const card = el.closest('[class*="card"]');
    let title = '';
    if (card) {
      const titleEl = card.querySelector('[class*="card-title"]');
      if (titleEl) title = titleEl.textContent?.trim() || '';
    }

    try {
      const canvas = await html2canvas(el as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      results.push({
        title,
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      });
    } catch (e) {
      console.warn('Failed to capture chart:', title, e);
    }
  }

  return results;
};

// ─── PDF Export ───

export interface PDFDetailTable {
  sectionTitle: string;
  metricTitle: string;
  unit: string;
  rows: { brand: string; value: string }[];
  summary?: { label: string; value: string };
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  filterSummary: string;
  columns: ExportColumn[];
  rows: any[];
  summaryCards?: { label: string; value: string }[];
  /** Chart images captured via captureCharts() */
  chartImages?: { title: string; dataUrl: string; width: number; height: number }[];
  /** Programmatically generated feature chart sections */
  featureChartSections?: FeatureChartSection[];
  /** Per-metric detail tables (derived insights + aggregation breakdowns) */
  detailTables?: PDFDetailTable[];
}

export const exportPDF = (filename: string, options: PDFExportOptions) => {
  const { title, subtitle, filterSummary, columns, rows, summaryCards, chartImages, featureChartSections, detailTables } = options;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = margin;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  y += 7;

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, margin, y);
    y += 5;
  }

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Filters: ${filterSummary}`, margin, y);
  y += 4;
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
  y += 6;

  // Summary cards
  if (summaryCards && summaryCards.length > 0) {
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 248, 248);
    const cardW = Math.min(50, (pageW - 2 * margin) / summaryCards.length - 2);
    summaryCards.forEach((card, i) => {
      const cx = margin + i * (cardW + 3);
      doc.roundedRect(cx, y, cardW, 14, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(card.label, cx + 3, y + 5);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(card.value, cx + 3, y + 11);
    });
    y += 18;
  }

  // ─── Charts Section ───
  if (chartImages && chartImages.length > 0) {
    chartImages.forEach((chart) => {
      // Calculate image dimensions to fit page width
      const availW = pageW - 2 * margin;
      const aspectRatio = chart.height / chart.width;
      const imgW = Math.min(availW, 250);
      const imgH = imgW * aspectRatio;

      // Check if chart fits on current page
      if (y + imgH + 10 > pageH - margin) {
        doc.addPage();
        y = margin;
      }

      // Chart title
      if (chart.title) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text(chart.title, margin, y + 4);
        y += 7;
      }

      // Draw chart image
      doc.addImage(chart.dataUrl, 'PNG', margin, y, imgW, imgH);
      y += imgH + 6;
    });

    // Add separator before table
    if (rows.length > 0) {
      if (y + 20 > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }
  }

  // ─── Programmatic Feature Charts ───
  if (featureChartSections && featureChartSections.length > 0) {
    y = renderFeatureChartsInPDF(doc, featureChartSections, y);

    // Add separator before table
    if (rows.length > 0) {
      if (y + 20 > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }
  }

  // ─── Detail Tables (Derived Insights + Aggregation per-company breakdowns) ───
  if (detailTables && detailTables.length > 0) {
    let currentSection = '';
    const dtColW3 = [(pageW - 2 * margin) * 0.45, (pageW - 2 * margin) * 0.30, (pageW - 2 * margin) * 0.25];
    const dtRowH = 5;

    for (const dt of detailTables) {
      // Section header
      if (dt.sectionTitle !== currentSection) {
        currentSection = dt.sectionTitle;
        if (y + 15 > pageH - margin) { doc.addPage(); y = margin; }
        doc.setDrawColor(180, 180, 180);
        doc.line(margin, y, pageW - margin, y);
        y += 3;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(dt.sectionTitle, margin, y + 4);
        y += 8;
      }

      // Metric title
      const tableH = (dt.rows.length + 2) * dtRowH + 12;
      if (y + Math.min(tableH, 40) > pageH - margin) { doc.addPage(); y = margin; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${dt.metricTitle}${dt.unit ? ` (${dt.unit})` : ''}`, margin, y + 3);
      y += 6;

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, pageW - 2 * margin, dtRowH, 'F');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Company', margin + 1, y + 3.5);
      doc.text('Value', margin + dtColW3[0] + 1, y + 3.5);
      y += dtRowH;

      // Rows (limit to 35 per metric for space)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      const displayRows = dt.rows.slice(0, 35);
      displayRows.forEach((row, ri) => {
        if (y + dtRowH > pageH - margin) { doc.addPage(); y = margin; }
        if (ri % 2 === 1) {
          doc.setFillColor(252, 252, 252);
          doc.rect(margin, y, pageW - 2 * margin, dtRowH, 'F');
        }
        doc.setTextColor(50, 50, 50);
        const brandText = row.brand.length > 30 ? row.brand.slice(0, 28) + '…' : row.brand;
        doc.text(brandText, margin + 1, y + 3.5);
        const valText = row.value.length > 20 ? row.value.slice(0, 18) + '…' : row.value;
        doc.text(valText, margin + dtColW3[0] + 1, y + 3.5);
        y += dtRowH;
      });

      // Summary row
      if (dt.summary) {
        doc.setFillColor(235, 235, 235);
        doc.rect(margin, y, pageW - 2 * margin, dtRowH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(dt.summary.label, margin + 1, y + 3.5);
        doc.text(dt.summary.value, margin + dtColW3[0] + 1, y + 3.5);
        y += dtRowH;
      }

      y += 3;
    }

    // Separator before main data table
    if (rows.length > 0) {
      if (y + 20 > pageH - margin) { doc.addPage(); y = margin; }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }
  }

  // Table
  doc.setTextColor(0, 0, 0);
  const colCount = Math.min(columns.length, 20); // increased from 12 for better coverage
  const colW = (pageW - 2 * margin) / colCount;
  const rowH = 6;

  // Table header — use smaller font for many columns
  const headerFontSize = colCount > 12 ? 5 : colCount > 8 ? 6 : 7;
  const cellFontSize = colCount > 12 ? 5 : colCount > 8 ? 6 : 7;
  const maxHeaderChars = colCount > 12 ? 14 : colCount > 8 ? 18 : 22;
  const maxCellChars = colCount > 12 ? 16 : colCount > 8 ? 20 : 24;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageW - 2 * margin, rowH, 'F');
  doc.setFontSize(headerFontSize);
  doc.setFont('helvetica', 'bold');
  columns.slice(0, colCount).forEach((col, i) => {
    const text = col.header.length > maxHeaderChars ? col.header.slice(0, maxHeaderChars - 2) + '…' : col.header;
    doc.text(text, margin + i * colW + 1, y + 4);
  });
  y += rowH;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(cellFontSize);
  rows.forEach((row, rowIdx) => {
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
      // Re-draw header on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageW - 2 * margin, rowH, 'F');
      doc.setFontSize(headerFontSize);
      doc.setFont('helvetica', 'bold');
      columns.slice(0, colCount).forEach((col, i) => {
        const text = col.header.length > maxHeaderChars ? col.header.slice(0, maxHeaderChars - 2) + '…' : col.header;
        doc.text(text, margin + i * colW + 1, y + 4);
      });
      y += rowH;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(cellFontSize);
    }
    // Alternate row shading
    if (rowIdx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageW - 2 * margin, rowH, 'F');
    }
    columns.slice(0, colCount).forEach((col, i) => {
      const val = col.accessor(row);
      const text = val.length > maxCellChars ? val.slice(0, maxCellChars - 2) + '…' : val;
      doc.text(text, margin + i * colW + 1, y + 4);
    });
    y += rowH;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin - 20, pageH - 5);
    doc.text('Fireside Ventures — Confidential', margin, pageH - 5);
  }

  doc.save(`${filename}.pdf`);
};

// ─── Filter summary builder ───

export const buildFilterSummary = (filters: any): string => {
  const parts: string[] = [];
  if (filters?.period === 'quarterly') {
    parts.push(`${filters.quarter || 'Q1'} ${filters.year || 2025}`);
  } else if (filters?.quarterlyKpiCombined) {
    parts.push(`Q1-Q4 Combined ${filters.year || 2025}`);
  } else {
    parts.push(`Annual ${filters.year || 2025}`);
  }
  if (filters?.industry) parts.push(`Industry: ${filters.industry}`);
  if (filters?.fund) parts.push(`Fund: ${filters.fund}`);
  if (filters?.revenueStage) parts.push(`Revenue: ₹${filters.revenueStage} Cr`);
  if (filters?.companyId) parts.push(`Company: ${filters.companyId}`);
  return parts.join(' · ');
};
