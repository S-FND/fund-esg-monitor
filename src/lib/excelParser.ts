import * as XLSX from 'xlsx';
import { ESGCategory, CoreLevel, RevenueStage, Industry, KPI } from '@/types/esg';

export interface ParsedKPIData {
  kpiName: string;
  esg: ESGCategory | null;
  category: string;
  subCategory: string;
  value: string | number | boolean;
  matchedKpiId?: string;
  matchConfidence: number;
  sheetName: string;
  rowIndex: number;
}

export interface ParseResult {
  success: boolean;
  data: ParsedKPIData[];
  sheets: string[];
  errors: string[];
  summary: {
    totalRows: number;
    parsedKPIs: number;
    matchedKPIs: number;
    unmatchedKPIs: number;
  };
}

// Common ESG-related keywords for detection
const ESG_KEYWORDS: Record<ESGCategory, string[]> = {
  E: ['environmental', 'environment', 'emission', 'carbon', 'energy', 'waste', 'water', 'packaging', 'plastic', 'recycl', 'renewable', 'ghg', 'co2'],
  S: ['social', 'employee', 'workforce', 'diversity', 'female', 'women', 'training', 'safety', 'health', 'community', 'labor', 'human rights', 'welfare'],
  G: ['governance', 'board', 'ethics', 'compliance', 'audit', 'policy', 'risk', 'transparency', 'independent', 'director', 'committee'],
};

function detectESGCategory(text: string): ESGCategory | null {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(ESG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category as ESGCategory;
      }
    }
  }
  return null;
}

function calculateMatchConfidence(parsedName: string, kpi: KPI): number {
  const parsedLower = parsedName.toLowerCase();
  const kpiNameLower = kpi.name.toLowerCase();
  const kpiCategoryLower = kpi.category.toLowerCase();
  const kpiSubCategoryLower = kpi.subCategory.toLowerCase();
  
  let confidence = 0;
  
  // Exact name match
  if (parsedLower === kpiNameLower) {
    return 100;
  }
  
  // Contains full name
  if (parsedLower.includes(kpiNameLower) || kpiNameLower.includes(parsedLower)) {
    confidence += 60;
  }
  
  // Word overlap
  const parsedWords = parsedLower.split(/\s+/);
  const kpiWords = kpiNameLower.split(/\s+/);
  const commonWords = parsedWords.filter(w => kpiWords.includes(w));
  confidence += (commonWords.length / Math.max(parsedWords.length, kpiWords.length)) * 30;
  
  // Category match
  if (parsedLower.includes(kpiCategoryLower) || parsedLower.includes(kpiSubCategoryLower)) {
    confidence += 10;
  }
  
  return Math.min(confidence, 100);
}

function findBestKPIMatch(parsedName: string, kpis: KPI[]): { kpiId: string | undefined; confidence: number } {
  let bestMatch: { kpiId: string | undefined; confidence: number } = { kpiId: undefined, confidence: 0 };
  
  for (const kpi of kpis) {
    const confidence = calculateMatchConfidence(parsedName, kpi);
    if (confidence > bestMatch.confidence && confidence >= 40) {
      bestMatch = { kpiId: kpi.id, confidence };
    }
  }
  
  return bestMatch;
}

export function parseExcelFile(file: File, masterKPIs: KPI[]): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const parsedData: ParsedKPIData[] = [];
        const errors: string[] = [];
        const sheets = workbook.SheetNames;
        
        for (const sheetName of sheets) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
          
          if (jsonData.length < 2) continue;
          
          // Try to detect header row
          const headerRow = jsonData[0] || [];
          const headerLower = headerRow.map(h => String(h || '').toLowerCase());
          
          // Find relevant columns
          const kpiNameCol = headerLower.findIndex(h => 
            h.includes('kpi') || h.includes('metric') || h.includes('indicator') || h.includes('name') || h.includes('description')
          );
          const valueCol = headerLower.findIndex(h => 
            h.includes('value') || h.includes('data') || h.includes('response') || h.includes('answer') || h.includes('q4') || h.includes('q3') || h.includes('2024') || h.includes('2023')
          );
          const categoryCol = headerLower.findIndex(h => 
            h.includes('category') || h.includes('type') || h.includes('pillar')
          );
          const esgCol = headerLower.findIndex(h => 
            h.includes('esg') || h.includes('e/s/g') || h === 'e' || h === 's' || h === 'g'
          );
          
          // Parse data rows
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] || [];
            if (!row || row.length === 0) continue;
            
            // Get KPI name - try detected column or first non-empty cell
            let kpiName = '';
            if (kpiNameCol >= 0 && row[kpiNameCol]) {
              kpiName = String(row[kpiNameCol]);
            } else {
              // Find first string cell as potential KPI name
              for (const cell of row) {
                if (cell && typeof cell === 'string' && cell.length > 3) {
                  kpiName = cell;
                  break;
                }
              }
            }
            
            if (!kpiName) continue;
            
            // Get value
            let value: string | number | boolean = '';
            if (valueCol >= 0 && row[valueCol] !== undefined) {
              value = row[valueCol] as string | number | boolean;
            } else {
              // Find first numeric or meaningful value
              for (let j = 0; j < row.length; j++) {
                if (j !== kpiNameCol && row[j] !== undefined && row[j] !== '') {
                  const cellValue = row[j];
                  if (typeof cellValue === 'number' || (typeof cellValue === 'string' && cellValue.length > 0)) {
                    value = cellValue as string | number;
                    break;
                  }
                }
              }
            }
            
            // Get category
            const category = categoryCol >= 0 && row[categoryCol] ? String(row[categoryCol]) : '';
            
            // Detect ESG
            let esg: ESGCategory | null = null;
            if (esgCol >= 0 && row[esgCol]) {
              const esgValue = String(row[esgCol]).toUpperCase().trim();
              if (['E', 'S', 'G'].includes(esgValue)) {
                esg = esgValue as ESGCategory;
              }
            }
            if (!esg) {
              esg = detectESGCategory(kpiName + ' ' + category + ' ' + sheetName);
            }
            
            // Match with master KPIs
            const match = findBestKPIMatch(kpiName, masterKPIs);
            
            parsedData.push({
              kpiName,
              esg,
              category,
              subCategory: '',
              value,
              matchedKpiId: match.kpiId,
              matchConfidence: match.confidence,
              sheetName,
              rowIndex: i,
            });
          }
        }
        
        const matchedCount = parsedData.filter(d => d.matchedKpiId).length;
        
        resolve({
          success: true,
          data: parsedData,
          sheets,
          errors,
          summary: {
            totalRows: parsedData.length,
            parsedKPIs: parsedData.length,
            matchedKPIs: matchedCount,
            unmatchedKPIs: parsedData.length - matchedCount,
          },
        });
      } catch (error) {
        resolve({
          success: false,
          data: [],
          sheets: [],
          errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          summary: {
            totalRows: 0,
            parsedKPIs: 0,
            matchedKPIs: 0,
            unmatchedKPIs: 0,
          },
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        sheets: [],
        errors: ['Failed to read file'],
        summary: {
          totalRows: 0,
          parsedKPIs: 0,
          matchedKPIs: 0,
          unmatchedKPIs: 0,
        },
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
}
