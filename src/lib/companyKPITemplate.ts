import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { QUARTERLY_FEATURES, ANNUAL_FEATURES } from '@/hooks/useCompanyFeatures';
import { getFeatureKPIs } from '@/lib/featureKPITemplate';

export interface DownloadTemplateOptions {
  companyId: string;
  companyName: string;
  quarter: string;
  year: number;
  type: 'quarterly' | 'annual' | 'all';
  featureModule?: string; // Optional: filter to specific feature
}

export const downloadCompanyKPITemplate = async (options: DownloadTemplateOptions): Promise<void> => {
  const { companyId, companyName, year, type } = options;

  // 1. Fetch enabled features for this company
  const { data: featuresData } = await supabase
    .from('company_feature_settings')
    .select('feature_key, feature_type')
    .eq('company_id', companyId)
    .eq('enabled', true);

  const enabledFeatures = (featuresData || []).map(f => ({
    key: f.feature_key,
    type: f.feature_type,
  }));

  // 2. Determine which features to include based on type filter
  let featuresToInclude: { key: string; label: string; type: string }[] = [];
  
  const allQuarterlyFeatures = QUARTERLY_FEATURES.map(f => ({ key: f.key, label: f.label, type: 'quarterly' }));
  const allAnnualFeatures = ANNUAL_FEATURES.map(f => ({ key: f.key, label: f.label, type: 'annual' }));
  
  if (type === 'quarterly') {
    featuresToInclude = allQuarterlyFeatures.filter(f => 
      enabledFeatures.some(ef => ef.key === f.key)
    );
  } else if (type === 'annual') {
    featuresToInclude = allAnnualFeatures.filter(f => 
      enabledFeatures.some(ef => ef.key === f.key)
    );
  } else {
    // 'all' - include both quarterly and annual
    featuresToInclude = [
      ...allQuarterlyFeatures.filter(f => enabledFeatures.some(ef => ef.key === f.key)),
      ...allAnnualFeatures.filter(f => enabledFeatures.some(ef => ef.key === f.key)),
    ];
  }

  // 3. Create workbook
  const wb = XLSX.utils.book_new();

  // Headers for data sheets
  const headers = [
    'Sno',
    'Feature Module',
    'KPI ID',
    'KPI Name',
    'Unit',
    'Q1 Value',
    'Q2 Value',
    'Q3 Value',
    'Q4 Value',
  ];

  // Separate features by type
  const quarterlyFeatures = featuresToInclude.filter(f => f.type === 'quarterly');
  const annualFeatures = featuresToInclude.filter(f => f.type === 'annual');

  // Helper function to build sheet data
  const buildSheetData = (features: typeof featuresToInclude, isAnnual: boolean = false): (string | number)[][] => {
    const dataRows: (string | number)[][] = [];
    
    // Adjust headers for annual (no quarters)
    const sheetHeaders = isAnnual 
      ? ['Sno', 'Feature Module', 'KPI ID', 'KPI Name', 'Unit', 'FY Value']
      : headers;
    
    dataRows.push(sheetHeaders);

    let rowNumber = 1;

    features.forEach(feature => {
      const featureKPIs = getFeatureKPIs(feature.key);
      
      if (featureKPIs.length === 0) {
        if (isAnnual) {
          dataRows.push([
            rowNumber++,
            feature.label,
            `${feature.key}_placeholder`,
            `[No KPIs defined for ${feature.label}]`,
            '',
            '',
          ]);
        } else {
          dataRows.push([
            rowNumber++,
            feature.label,
            `${feature.key}_placeholder`,
            `[No KPIs defined for ${feature.label}]`,
            '',
            '',
            '',
            '',
            '',
          ]);
        }
        return;
      }
      
      featureKPIs.forEach(kpi => {
        if (isAnnual) {
          dataRows.push([
            rowNumber++,
            feature.label,
            kpi.key,
            kpi.name,
            kpi.unit || '',
            '', // FY Value
          ]);
        } else {
          dataRows.push([
            rowNumber++,
            feature.label,
            kpi.key,
            kpi.name,
            kpi.unit || '',
            '', // Q1 Value
            '', // Q2 Value
            '', // Q3 Value
            '', // Q4 Value
          ]);
        }
      });
    });

    return dataRows;
  };

  // Create Quarterly sheet if there are quarterly features
  if (quarterlyFeatures.length > 0) {
    const quarterlyData = buildSheetData(quarterlyFeatures, false);
    const wsQuarterly = XLSX.utils.aoa_to_sheet(quarterlyData);
    wsQuarterly['!cols'] = [
      { wch: 6 },   // Sno
      { wch: 30 },  // Feature Module
      { wch: 40 },  // KPI ID
      { wch: 50 },  // KPI Name
      { wch: 15 },  // Unit
      { wch: 15 },  // Q1 Value
      { wch: 15 },  // Q2 Value
      { wch: 15 },  // Q3 Value
      { wch: 15 },  // Q4 Value
    ];
    XLSX.utils.book_append_sheet(wb, wsQuarterly, 'Quarterly KPIs');
  }

  // Create Annual sheet if there are annual features
  if (annualFeatures.length > 0) {
    const annualData = buildSheetData(annualFeatures, true);
    const wsAnnual = XLSX.utils.aoa_to_sheet(annualData);
    wsAnnual['!cols'] = [
      { wch: 6 },   // Sno
      { wch: 30 },  // Feature Module
      { wch: 40 },  // KPI ID
      { wch: 50 },  // KPI Name
      { wch: 15 },  // Unit
      { wch: 15 },  // FY Value
    ];
    XLSX.utils.book_append_sheet(wb, wsAnnual, 'Annual KPIs');
  }

  // Add instructions sheet
  const typeLabel = type === 'quarterly' ? 'Quarterly KPIs' : type === 'annual' ? 'Annual KPIs' : 'All KPIs';
  const instructionsData = [
    ['KPI Data Entry Template - Instructions'],
    [''],
    [`Company: ${companyName}`],
    [`Year: FY ${year}-${(year + 1).toString().slice(-2)}`],
    [`Type: ${typeLabel}`],
    [`Features Included: ${featuresToInclude.map(f => f.label).join(', ')}`],
    [''],
    ['How to fill this template:'],
    ['1. Enter your values in the Q1, Q2, Q3, Q4 columns (Columns F, G, H, I)'],
    ['2. Do NOT modify other columns - they are used for identification'],
    ['3. For Yes/No questions, enter "Yes" or "No"'],
    ['4. For numeric values, enter numbers only (no symbols or units)'],
    ['5. For percentages, enter as decimal (e.g., 25 for 25%)'],
    ['6. Leave cells empty if data is not available'],
    [''],
    ['Column Descriptions:'],
    ['- Sno: Row number (DO NOT EDIT)'],
    ['- Feature Module: The feature category this KPI belongs to'],
    ['- KPI ID: Unique identifier (DO NOT EDIT)'],
    ['- KPI Name: Name of the metric'],
    ['- Unit: Expected unit of measurement'],
    ['- Q1/Q2/Q3/Q4 Value: Enter your data for each quarter'],
    [''],
    ['After filling, upload this file back in the KPI Entry page.'],
    [''],
    ['Note: Q4 data will appear in current data entry fields.'],
    ['Q1, Q2, Q3 data will appear as historical reference values.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Generate filename
  const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_KPI_Template_FY${year}.xlsx`;

  // Download
  XLSX.writeFile(wb, filename);
};

export interface ParsedKPIEntry {
  kpiId: string;
  value: string;
  kpiName: string;
  featureModule: string;
  category: string;
  quarter: string; // Q1, Q2, Q3, or Q4
}

export interface ParseKPITemplateResult {
  entries: ParsedKPIEntry[];
  errors: string[];
  totalRows: number;
  validRows: number;
  quarterCounts: Record<string, number>; // Count of entries per quarter
}

// Normalize boolean values from Excel
const normalizeBooleanValue = (value: string | number | boolean | undefined | null): string => {
  if (value === undefined || value === null) return '';
  
  const strValue = String(value).trim().toLowerCase();
  
  // Check for Yes/True variants
  if (['yes', 'y', 'true', '1', 'on'].includes(strValue)) {
    return 'true';
  }
  
  // Check for No/False variants
  if (['no', 'n', 'false', '0', 'off'].includes(strValue)) {
    return 'false';
  }
  
  // Return original value if not a boolean
  return String(value).trim();
};

// Check if a KPI key is for a Yes/No field
const isYesNoField = (kpiId: string): boolean => {
  const yesNoPatterns = [
    '_in_place', '_training', '_na', '_resolved', '_board_informed',
    'policy_', 'sri_msme_status', 'sri_women_led'
  ];
  return yesNoPatterns.some(pattern => kpiId.toLowerCase().includes(pattern));
};

export const parseKPITemplateUpload = async (file: File): Promise<ParseKPITemplateResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const entries: ParsedKPIEntry[] = [];
        const errors: string[] = [];
        let totalRows = 0;
        const quarterCounts: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, FY: 0 };
        
        // Process ALL sheets in the workbook
        for (const sheetName of workbook.SheetNames) {
          // Skip instruction sheets
          if (sheetName.toLowerCase().includes('instruction')) continue;
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
          
          if (jsonData.length < 2) continue;
          
          // Find column indices
          const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
          const kpiIdIndex = headers.findIndex(h => h.includes('kpi id') || h === 'kpi_id');
          const nameIndex = headers.findIndex(h => h.includes('kpi name') || h === 'name');
          const featureIndex = headers.findIndex(h => h.includes('feature'));
          const categoryIndex = headers.findIndex(h => h === 'category');
          
          // Determine if this is an annual or quarterly sheet
          const isAnnualSheet = sheetName.toLowerCase().includes('annual');
          
          // Find quarter value columns for quarterly sheets
          const q1Index = headers.findIndex(h => h.includes('q1') && h.includes('value'));
          const q2Index = headers.findIndex(h => h.includes('q2') && h.includes('value'));
          const q3Index = headers.findIndex(h => h.includes('q3') && h.includes('value'));
          const q4Index = headers.findIndex(h => h.includes('q4') && h.includes('value'));
          
          // Find FY value column for annual sheets
          const fyIndex = headers.findIndex(h => h.includes('fy') && h.includes('value'));
          
          // Also check for legacy single "your value" column
          const legacyValueIndex = headers.findIndex(h => h.includes('your value') || h === 'value');
          
          if (kpiIdIndex === -1) {
            errors.push(`Sheet "${sheetName}": Could not find KPI ID column`);
            continue;
          }
          
          // Check if we have value columns
          const hasQuarterlyColumns = q1Index !== -1 || q2Index !== -1 || q3Index !== -1 || q4Index !== -1;
          const hasFYColumn = fyIndex !== -1;
          
          if (!hasQuarterlyColumns && !hasFYColumn && legacyValueIndex === -1) {
            errors.push(`Sheet "${sheetName}": Could not find value columns`);
            continue;
          }
          
          // Process data rows
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            totalRows++;
            
            const kpiId = row[kpiIdIndex];
            const kpiName = nameIndex !== -1 ? row[nameIndex] : '';
            const featureModule = featureIndex !== -1 ? row[featureIndex] : '';
            const category = categoryIndex !== -1 ? row[categoryIndex] : '';
            
            if (!kpiId) {
              continue;
            }
            
            const kpiIdStr = String(kpiId);
            const shouldNormalizeBool = isYesNoField(kpiIdStr);
            
            if (isAnnualSheet || hasFYColumn) {
              // Process FY column for annual KPIs
              const valueIdx = fyIndex !== -1 ? fyIndex : legacyValueIndex;
              if (valueIdx !== -1) {
                const value = row[valueIdx];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                  const normalizedValue = shouldNormalizeBool 
                    ? normalizeBooleanValue(value)
                    : String(value).trim();
                  
                  entries.push({
                    kpiId: kpiIdStr,
                    value: normalizedValue,
                    kpiName: String(kpiName || ''),
                    featureModule: String(featureModule || ''),
                    category: String(category || ''),
                    quarter: 'FY',
                  });
                  quarterCounts['FY']++;
                }
              }
            } else if (hasQuarterlyColumns) {
              // Process each quarter column
              const quarters = [
                { index: q1Index, quarter: 'Q1' },
                { index: q2Index, quarter: 'Q2' },
                { index: q3Index, quarter: 'Q3' },
                { index: q4Index, quarter: 'Q4' },
              ];
              
              for (const { index, quarter } of quarters) {
                if (index === -1) continue;
                
                const value = row[index];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                  const normalizedValue = shouldNormalizeBool 
                    ? normalizeBooleanValue(value)
                    : String(value).trim();
                  
                  entries.push({
                    kpiId: kpiIdStr,
                    value: normalizedValue,
                    kpiName: String(kpiName || ''),
                    featureModule: String(featureModule || ''),
                    category: String(category || ''),
                    quarter,
                  });
                  quarterCounts[quarter]++;
                }
              }
            } else {
              // Legacy single value column - treat as Q4
              const value = row[legacyValueIndex];
              if (value !== undefined && value !== null && String(value).trim() !== '') {
                const normalizedValue = shouldNormalizeBool 
                  ? normalizeBooleanValue(value)
                  : String(value).trim();
                
                entries.push({
                  kpiId: kpiIdStr,
                  value: normalizedValue,
                  kpiName: String(kpiName || ''),
                  featureModule: String(featureModule || ''),
                  category: String(category || ''),
                  quarter: 'Q4',
                });
                quarterCounts['Q4']++;
              }
            }
          }
        }
        
        resolve({
          entries,
          errors,
          totalRows,
          validRows: entries.length,
          quarterCounts,
        });
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const saveKPIEntriesFromTemplate = async (
  entries: ParsedKPIEntry[],
  companyId: string,
  year: number
): Promise<{ success: number; failed: number; byQuarter: Record<string, number> }> => {
  let success = 0;
  let failed = 0;
  const byQuarter: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  
  for (const entry of entries) {
    try {
      const { error } = await supabase
        .from('kpi_entries')
        .upsert({
          company_id: companyId,
          kpi_id: entry.kpiId,
          quarter: entry.quarter,
          year,
          value: entry.value,
          submitted_at: new Date().toISOString(),
        }, {
          onConflict: 'company_id,kpi_id,quarter,year',
        });
      
      if (error) {
        failed++;
      } else {
        success++;
        byQuarter[entry.quarter] = (byQuarter[entry.quarter] || 0) + 1;
      }
    } catch {
      failed++;
    }
  }
  
  return { success, failed, byQuarter };
};
