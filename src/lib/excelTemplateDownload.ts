import * as XLSX from 'xlsx';

export const downloadKPITemplate = () => {
  // Define the template headers matching the expected KPI structure
  const headers = [
    'KPI Name',
    'ESG Category (E/S/G)',
    'Category',
    'Sub-Category',
    'Metric Type',
    'Reporting Period (Quarterly/Annual)',
    'Definition',
    'Core Level (1/2/3)',
    'Revenue Stages (comma-separated: Pre-revenue,<1M,1-10M,10-50M,50-100M,>100M)',
    'Industries (comma-separated: Technology,Healthcare,Finance,Manufacturing,Retail,Energy,Other)',
  ];

  // Sample data rows to guide the user
  const sampleData = [
    [
      'Total Energy Consumption',
      'E',
      'Energy',
      'Energy Usage',
      'Quantitative',
      'Quarterly',
      'Total energy consumed in MWh during the reporting period',
      '1',
      'Pre-revenue,<1M,1-10M,10-50M,50-100M,>100M',
      'Technology,Healthcare,Finance,Manufacturing,Retail,Energy,Other',
    ],
    [
      'Employee Diversity Ratio',
      'S',
      'Workforce',
      'Diversity & Inclusion',
      'Quantitative',
      'Annual',
      'Percentage of employees from underrepresented groups',
      '2',
      '1-10M,10-50M,50-100M,>100M',
      'Technology,Healthcare,Finance',
    ],
    [
      'Board Independence',
      'G',
      'Board Composition',
      'Independence',
      'Qualitative',
      'Annual',
      'Whether the board has a majority of independent directors',
      '1',
      '10-50M,50-100M,>100M',
      'Technology,Healthcare,Finance,Manufacturing,Retail,Energy,Other',
    ],
  ];

  // Create worksheet with headers and sample data
  const wsData = [headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  ws['!cols'] = [
    { wch: 30 }, // KPI Name
    { wch: 20 }, // ESG Category
    { wch: 20 }, // Category
    { wch: 20 }, // Sub-Category
    { wch: 15 }, // Metric Type
    { wch: 25 }, // Reporting Period
    { wch: 50 }, // Definition
    { wch: 15 }, // Core Level
    { wch: 55 }, // Revenue Stages
    { wch: 60 }, // Industries
  ];

  // Create workbook and add the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KPI Template');

  // Add an instructions sheet
  const instructionsData = [
    ['KPI Import Template Instructions'],
    [''],
    ['Column Descriptions:'],
    ['KPI Name', 'Required. The name of the KPI metric.'],
    ['ESG Category', 'Required. Must be E (Environmental), S (Social), or G (Governance).'],
    ['Category', 'Required. The main category of the KPI (e.g., Energy, Workforce, Board Composition).'],
    ['Sub-Category', 'Optional. A more specific classification within the category.'],
    ['Metric Type', 'Required. Either "Quantitative" or "Qualitative".'],
    ['Reporting Period', 'Required. Either "Quarterly" or "Annual".'],
    ['Definition', 'Required. A clear description of what the KPI measures.'],
    ['Core Level', 'Required. "Mandatory" or "Optional".'],
    ['Revenue Stages', 'Required. Comma-separated list of applicable revenue stages.'],
    ['Industries', 'Required. Comma-separated list of applicable industries.'],
    [''],
    ['Valid Revenue Stages:'],
    ['Pre-revenue, <1M, 1-10M, 10-50M, 50-100M, >100M'],
    [''],
    ['Valid Industries:'],
    ['Technology, Healthcare, Finance, Manufacturing, Retail, Energy, Other'],
    [''],
    ['Notes:'],
    ['- Delete the sample data rows before importing your own KPIs.'],
    ['- Ensure all required fields are filled in.'],
    ['- ESG Category must be exactly E, S, or G (case-sensitive).'],
    ['- Core Level must be 1, 2, or 3.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 25 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Generate and download the file
  XLSX.writeFile(wb, 'KPI_Import_Template.xlsx');
};
