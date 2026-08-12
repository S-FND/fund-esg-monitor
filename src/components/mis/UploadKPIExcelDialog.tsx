import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2,
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import { KPI, ESGCategory, CoreLevel, RevenueStage, KPIIndustry } from '@/types/esg';
import { toast } from 'sonner';

interface UploadKPIExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingKPIs: KPI[];
  onImport: (kpis: KPI[], replaceAll: boolean) => void;
}

interface ParsedKPI {
  name: string;
  esg: ESGCategory;
  category: string;
  subCategory: string;
  metricType: string;
  period: 'Quarterly' | 'Annual';
  definition: string;
  coreLevel: CoreLevel;
  revenueStages: RevenueStage[];
  industries: KPIIndustry[];
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

type ImportStep = 'upload' | 'preview' | 'confirm';

const ALL_REVENUE_STAGES: RevenueStage[] = ['0-50', '50-100', '100-500', '500+'];
const ALL_INDUSTRIES: KPIIndustry[] = [
  'F&B',
  'Beauty & Personal Care',
  'Fashion',
  'Devices',
  'Home',
  'Services',
  'Gaming/Platform/Others',
  'Offline Stores',
];

// Map exact revenue stage values
const REVENUE_STAGE_MAP: Record<string, RevenueStage[]> = {
  'pre-revenue': ['0-50'],
  '<1m': ['0-50'],
  '1-10m': ['0-50'],
  '10-50m': ['50-100'],
  '50-100m': ['100-500'],
  '>100m': ['500+'],
  '0-50': ['0-50'],
  '50-100': ['50-100'],
  '100-500': ['100-500'],
  '500+': ['500+'],
  '500-1000': ['500+'],
  '1000+': ['500+'],
  // Handle "+" notation: e.g., "50+" means all stages >= 50
  '50+': ['50-100', '100-500', '500+'],
  '100+': ['100-500', '500+'],
};

const INDUSTRY_MAP: Record<string, KPIIndustry> = {
  'technology': 'Services',
  'healthcare': 'Services',
  'finance': 'Services',
  'manufacturing': 'Devices',
  'retail': 'Offline Stores',
  'energy': 'Services',
  'other': 'Services',
  'f&b': 'F&B',
  'beauty & personal care': 'Beauty & Personal Care',
  'fashion': 'Fashion',
  'devices': 'Devices',
  'home': 'Home',
  'services': 'Services',
  'gaming/platform/others': 'Gaming/Platform/Others',
  'offline stores': 'Offline Stores',
};

// Detect industry from column headers (e.g., "F&B (incl. nutra health)")
const detectIndustryFromHeader = (header: string): KPIIndustry | null => {
  const h = header.toLowerCase();
  if (h.includes('f&b') || h.includes('food') || h.includes('beverage') || h.includes('nutra')) return 'F&B';
  if (h.includes('beauty') || h.includes('bpc') || h.includes('personal care')) return 'Beauty & Personal Care';
  if (h.includes('fashion')) return 'Fashion';
  if (h.includes('device')) return 'Devices';
  if (h.includes('home')) return 'Home';
  if (h.includes('service')) return 'Services';
  if (h.includes('gaming') || h.includes('platform')) return 'Gaming/Platform/Others';
  if (h.includes('offline') || h.includes('store')) return 'Offline Stores';
  return null;
};

// Parse core level from a cell value like "Mandatory", "Optional", "Core 1", "Core 2", "Core 3"
const parseCoreLevel = (value: string): CoreLevel | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('mandatory') || normalized.includes('core 1') || normalized === '1') return 1;
  if (normalized.includes('optional') || normalized.includes('core 2') || normalized.includes('core 3') || normalized === '2' || normalized === '3') return 2;
  return null;
};

export const UploadKPIExcelDialog = ({
  open,
  onOpenChange,
  existingKPIs,
  onImport,
}: UploadKPIExcelDialogProps) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedKPIs, setParsedKPIs] = useState<ParsedKPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setStep('upload');
    setParsedKPIs([]);
    setFileName('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const parseRevenueStages = (value: string): RevenueStage[] => {
    if (!value || value.trim() === '') return ALL_REVENUE_STAGES;
    
    const stages: RevenueStage[] = [];
    const parts = value.split(',').map(s => s.trim().toLowerCase());
    
    for (const part of parts) {
      const mapped = REVENUE_STAGE_MAP[part];
      if (mapped) {
        // mapped is now RevenueStage[], so spread it and add unique ones
        for (const stage of mapped) {
          if (!stages.includes(stage)) {
            stages.push(stage);
          }
        }
      }
    }
    
    return stages.length > 0 ? stages : ALL_REVENUE_STAGES;
  };

  const parseIndustries = (value: string): KPIIndustry[] => {
    if (!value || value.trim() === '') return ALL_INDUSTRIES;
    
    const industries: KPIIndustry[] = [];
    const parts = value.split(',').map(s => s.trim().toLowerCase());
    
    for (const part of parts) {
      const mapped = INDUSTRY_MAP[part];
      if (mapped && !industries.includes(mapped)) {
        industries.push(mapped);
      }
    }
    
    return industries.length > 0 ? industries : ALL_INDUSTRIES;
  };

  const parseExcelFile = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

      if (jsonData.length < 2) {
        toast.error('Excel file is empty or has no data rows');
        setIsLoading(false);
        return;
      }

      const headerRow = (jsonData[0] || []).map(h => String(h || '').toLowerCase().trim());
      const originalHeaderRow = (jsonData[0] || []).map(h => String(h || '').trim());
      
      // Find column indices
      const findCol = (keywords: string[]) => 
        headerRow.findIndex(h => keywords.some(k => h.includes(k)));

      // Standard columns detection
      const esgCol = findCol(['esg', 'e/s/g', 'category (e/s/g)']);
      const categoryCol = findCol(['category']);
      const subCategoryCol = findCol(['sub-category', 'subcategory', 'sub category']);
      const metricTypeCol = findCol(['metric type', 'type']);
      const periodCol = findCol(['period', 'reporting period']);
      const definitionCol = findCol(['definition', 'description']);
      const frequencyCol = findCol(['frequency']);
      const revenueStagesCol = findCol(['revenue stage', 'revenue']);
      
      // Detect industry columns by their header names (columns after Revenue Stage)
      // These columns contain Core level values like "Core 1", "Core 2", "Core 3"
      const industryColumns: { index: number; industry: KPIIndustry }[] = [];
      for (let colIdx = 0; colIdx < originalHeaderRow.length; colIdx++) {
        const header = originalHeaderRow[colIdx];
        const detectedIndustry = detectIndustryFromHeader(header);
        if (detectedIndustry && colIdx > revenueStagesCol) {
          industryColumns.push({ index: colIdx, industry: detectedIndustry });
        }
      }

      // Legacy name column detection (for standard format)
      const nameCol = findCol(['kpi name', 'name', 'kpi', 'metric']);
      const coreLevelCol = findCol(['core level', 'core', 'level']);

      const parsed: ParsedKPI[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] || [];
        if (!row || row.length === 0) continue;

        const errors: string[] = [];
        
        // Parse ESG - handle full words like "Environment", "Social", "Governance"
        let esg: ESGCategory = 'E';
        if (esgCol >= 0 && row[esgCol]) {
          const esgValue = String(row[esgCol]).toUpperCase().trim();
          if (['E', 'S', 'G'].includes(esgValue)) {
            esg = esgValue as ESGCategory;
          } else if (esgValue.startsWith('ENVIRONMENT') || esgValue.startsWith('ENV')) {
            esg = 'E';
          } else if (esgValue.startsWith('SOCIAL') || esgValue.startsWith('SOC')) {
            esg = 'S';
          } else if (esgValue.startsWith('GOVERNANCE') || esgValue.startsWith('GOV')) {
            esg = 'G';
          } else if (esgValue === 'ANALYSIS') {
            // Skip "Analysis" rows as they are not ESG KPIs - treat as Environment for now
            esg = 'E';
          } else {
            errors.push('Invalid ESG category');
          }
        } else {
          errors.push('Missing ESG category');
        }

        // Parse category
        const category = categoryCol >= 0 ? String(row[categoryCol] || '').trim() : '';
        if (!category) {
          errors.push('Missing category');
        }

        // Parse sub-category - this is the KPI name in the F&B format
        const subCategory = subCategoryCol >= 0 ? String(row[subCategoryCol] || '').trim() : '';
        
        // Determine KPI name: prefer sub-category (F&B format), fallback to name column
        let name = subCategory || (nameCol >= 0 ? String(row[nameCol] || '').trim() : '');
        if (!name) {
          // Skip rows without a name
          continue;
        }

        // Parse metric type - handle various formats
        let metricType = 'Quantitative';
        if (metricTypeCol >= 0 && row[metricTypeCol]) {
          const typeValue = String(row[metricTypeCol]).trim().toLowerCase();
          if (typeValue.includes('descriptive') || typeValue.includes('qualitative')) {
            metricType = 'Descriptive';
          } else if (typeValue.includes('ton') || typeValue.includes('inr') || typeValue.includes('cost') || typeValue.includes('number') || typeValue.includes('%')) {
            metricType = typeValue;
          } else {
            metricType = String(row[metricTypeCol]).trim();
          }
        }

        // Parse period/frequency
        let period: 'Quarterly' | 'Annual' = 'Quarterly';
        const frequencyValue = frequencyCol >= 0 ? String(row[frequencyCol] || '').trim().toLowerCase() : '';
        const periodValue = periodCol >= 0 ? String(row[periodCol] || '').trim().toLowerCase() : '';
        if (frequencyValue.includes('annual') || periodValue.includes('annual') || periodValue.includes('n/a')) {
          period = 'Annual';
        }

        // Parse definition
        const definition = definitionCol >= 0 ? String(row[definitionCol] || '').trim() : '';

        // Parse revenue stages
        const revenueStagesValue = revenueStagesCol >= 0 ? String(row[revenueStagesCol] || '') : '';
        const revenueStages = parseRevenueStages(revenueStagesValue);

        // Determine core level and industries from industry columns
        let coreLevel: CoreLevel = 2;
        const industries: KPIIndustry[] = [];
        
        if (industryColumns.length > 0) {
          // F&B format: industry columns contain core level values
          for (const { index, industry } of industryColumns) {
            const cellValue = row[index] ? String(row[index]).trim() : '';
            if (cellValue) {
              const parsedCore = parseCoreLevel(cellValue);
              if (parsedCore) {
                coreLevel = parsedCore;
                if (!industries.includes(industry)) {
                  industries.push(industry);
                }
              }
            }
          }
        } else if (coreLevelCol >= 0 && row[coreLevelCol]) {
          // Standard format: dedicated core level column
          const levelValue = parseInt(String(row[coreLevelCol]), 10);
          if ([1, 2, 3].includes(levelValue)) {
            coreLevel = levelValue as CoreLevel;
          } else {
            const parsedCore = parseCoreLevel(String(row[coreLevelCol]));
            if (parsedCore) {
              coreLevel = parsedCore;
            }
          }
        }

        // If no industries detected from columns, use ALL_INDUSTRIES
        const finalIndustries = industries.length > 0 ? industries : ALL_INDUSTRIES;

        // Check for duplicates
        const isDuplicate = existingKPIs.some(
          k => k.name.toLowerCase() === name.toLowerCase()
        );

        // Only add if we have at least a name and some content
        if (name && (industries.length > 0 || category)) {
          parsed.push({
            name,
            esg,
            category,
            subCategory,
            metricType,
            period,
            definition: definition || '-',
            coreLevel,
            revenueStages,
            industries: finalIndustries,
            isValid: errors.length === 0,
            errors,
            isDuplicate,
          });
        }
      }

      if (parsed.length === 0) {
        toast.error('No valid KPIs found in the file');
        setIsLoading(false);
        return;
      }

      setParsedKPIs(parsed);
      setStep('preview');
    } catch (error) {
      toast.error('Failed to parse Excel file');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      parseExcelFile(file);
    } else {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
    }
  };

  const handleImport = (replaceAll: boolean) => {
    const validKPIs = parsedKPIs.filter(k => k.isValid);
    const kpisToImport: KPI[] = validKPIs
      .filter(k => replaceAll || !k.isDuplicate)
      .map(k => ({
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: k.name,
        esg: k.esg,
        category: k.category,
        subCategory: k.subCategory,
        metricType: k.metricType,
        period: k.period,
        definition: k.definition,
        frequency: k.period,
        revenueStages: k.revenueStages,
        industries: k.industries,
        coreLevel: k.coreLevel,
        createdAt: new Date().toISOString(),
        quarter: 'Q4',
        year: 2025,
      }));

    onImport(kpisToImport, replaceAll);
    toast.success(
      replaceAll 
        ? `Replaced all KPIs with ${kpisToImport.length} imported KPIs`
        : `Added ${kpisToImport.length} new KPIs`
    );
    handleClose();
  };

  const validCount = parsedKPIs.filter(k => k.isValid).length;
  const duplicateCount = parsedKPIs.filter(k => k.isDuplicate).length;
  const newCount = parsedKPIs.filter(k => k.isValid && !k.isDuplicate).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Upload KPI Excel File'}
            {step === 'preview' && 'Preview Imported KPIs'}
            {step === 'confirm' && 'Confirm Import'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload an Excel file containing KPI definitions to import.'}
            {step === 'preview' && `Found ${parsedKPIs.length} KPIs in ${fileName}`}
            {step === 'confirm' && 'Choose how to handle the imported KPIs'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground">Parsing Excel file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Drop your Excel file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports .xlsx and .xls files
                </p>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted text-center">
                <p className="text-2xl font-bold">{parsedKPIs.length}</p>
                <p className="text-xs text-muted-foreground">Total Found</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                <p className="text-2xl font-bold text-green-600">{validCount}</p>
                <p className="text-xs text-muted-foreground">Valid</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
                <p className="text-2xl font-bold text-yellow-600">{duplicateCount}</p>
                <p className="text-xs text-muted-foreground">Duplicates</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                <p className="text-2xl font-bold text-blue-600">{newCount}</p>
                <p className="text-xs text-muted-foreground">New KPIs</p>
              </div>
            </div>

            {/* Table */}
            <ScrollArea className="h-[300px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>KPI Name</TableHead>
                    <TableHead className="w-[60px]">ESG</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[80px]">Core</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedKPIs.map((kpi, index) => (
                    <TableRow key={index} className={!kpi.isValid ? 'opacity-50' : ''}>
                      <TableCell>
                        {kpi.isValid ? (
                          kpi.isDuplicate ? (
                            <Badge variant="outline" className="text-yellow-600">
                              Dup
                            </Badge>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )
                        ) : (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          {kpi.name}
                          {kpi.errors.length > 0 && (
                            <p className="text-xs text-destructive">{kpi.errors.join(', ')}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={kpi.esg === 'E' ? 'esg_e' : kpi.esg === 'S' ? 'esg_s' : 'esg_g'}
                        >
                          {kpi.esg}
                        </Badge>
                      </TableCell>
                      <TableCell>{kpi.category}</TableCell>
                      <TableCell>
                        <Badge variant={kpi.coreLevel === 1 ? 'core1' : 'core2'}>
                          {kpi.coreLevel === 1 ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetDialog}>
                Upload Different File
              </Button>
              <Button onClick={() => setStep('confirm')} disabled={validCount === 0}>
                Continue ({validCount} valid)
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              You have {validCount} valid KPIs ready to import. {duplicateCount > 0 && `${duplicateCount} of these already exist in your KPI Master.`}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div 
                className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-colors group"
                onClick={() => handleImport(true)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                    <RefreshCw className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="font-semibold">Replace All</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Delete all existing KPIs and replace with {validCount} imported KPIs. This creates a fresh KPI Master.
                </p>
              </div>

              <div 
                className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-colors group"
                onClick={() => handleImport(false)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Add New Only</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep existing KPIs and add only {newCount} new KPIs that don't already exist in the master list.
                </p>
              </div>
            </div>

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep('preview')}>
                Back to Preview
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
