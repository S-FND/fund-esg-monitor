import { useState, useEffect, useMemo } from 'react';
// import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mockCompanies } from '@/data/mockData';
import { useCompanyFeatures, QUARTERLY_FEATURES, ANNUAL_FEATURES, ALL_FEATURES } from '@/hooks/useCompanyFeatures';
import { Leaf, Users, Building2, Package, AlertCircle, FileText, Trash2, Award, Truck, Factory, Shield, AlertTriangle, Target, Droplets, Zap, PackageOpen, Save, RotateCcw, Download, ChevronDown, ChevronRight, Briefcase, Recycle, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { FEATURE_FIELD_MAPPINGS, KPIDefinition, FeatureFieldMapping } from '@/lib/featureFieldMapping';

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  businessInformation: Briefcase,
  sourcingFulfillment: Truck,
  social: Users,
  primarySecondaryPackaging: Package,
  fashionMaterials: Package,
  incidentLog: AlertCircle,
  productServiceCertifications: Award,
  healthCare: Heart,
  
  operations: Factory,
  certifications: Award,
  governancePolicies: Shield,
  waterManagement: Droplets,
  energyManagement: Zap,
  wasteManagement: Recycle,
  csr: Users,
  externalReporting: FileText,
  sri: Target,
};

// Type for KPI with reference values (from database)
interface KPIWithRefs {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  period: string;
  ref1Value: string;
  ref2Value: string;
  ref1Label: string;
  ref2Label: string;
}

// Type for grouped KPIs by feature (from database)
interface FeatureKPIData {
  [featureKey: string]: KPIWithRefs[];
}

const FeatureManagement = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const { 
    features, 
    loading, 
    saving, 
    toggleFeature, 
    setFeatureOptional, 
    isFeatureEnabled, 
    isFeatureOptional,
    saveChanges,
    discardChanges,
    hasUnsavedChanges 
  } = useCompanyFeatures(selectedCompanyId);

  const investedCompanies = mockCompanies.filter(c => c.investmentStatus === 'Invested');

  // Select first company by default
  useEffect(() => {
    if (investedCompanies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(investedCompanies[0].id);
    }
  }, [selectedCompanyId]);

  const selectedCompany = investedCompanies.find((c) => c.id === selectedCompanyId);

  // Mapping from database feature_module values to app feature keys
  const dbFeatureModuleToAppKey: Record<string, string> = {
    // Direct matches
    'sourcingFulfillment': 'sourcingFulfillment',
    'incidentLog': 'incidentLog',
    'certifications': 'certifications',
    'governancePolicies': 'governancePolicies',
    'fashionMaterials': 'fashionMaterials',
    'healthCare': 'healthCare',
    'businessInformation': 'businessInformation',
    'social': 'social',
    'operations': 'operations',
    'waterManagement': 'waterManagement',
    'wasteManagement': 'wasteManagement',
    'csr': 'csr',
    'externalReporting': 'externalReporting',
    'productServiceCertifications': 'productServiceCertifications',
    // Database values -> App feature keys
    'packagingBasic': 'primarySecondaryPackaging',
    'packagingDetailed': 'primarySecondaryPackaging',
    'packagingTertiary': 'primarySecondaryPackaging',
    'primarySecondaryPackaging': 'primarySecondaryPackaging',
    'energyDetailed': 'energyManagement',
    'energyManagement': 'energyManagement',
    'socialDetailed': 'social',
    'environmental': 'businessInformation',
    'marketing': 'productServiceCertifications',
  };

  // Fetch KPIs with their entries for reference display
  const { data: featureKPIData, isLoading: kpisLoading } = useQuery({
    queryKey: ['feature-kpis-with-refs', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return {} as FeatureKPIData;

      // Fetch all KPIs
      const { data: kpis, error: kpisError } = await supabase
        .from('kpi_master')
        .select('id, name, category, sub_category, feature_module, period')
        .not('feature_module', 'is', null);

      if (kpisError) throw kpisError;

      // Fetch KPI entries for this company
      const { data: entries, error: entriesError } = await supabase
        .from('kpi_entries')
        .select('kpi_id, value, quarter, year')
        .eq('company_id', selectedCompanyId);

      if (entriesError) throw entriesError;

      // Create entries map
      const entriesMap = new Map<string, { quarter: string; year: number; value: string }[]>();
      (entries || []).forEach(entry => {
        if (!entriesMap.has(entry.kpi_id)) {
          entriesMap.set(entry.kpi_id, []);
        }
        entriesMap.get(entry.kpi_id)!.push({
          quarter: entry.quarter,
          year: entry.year,
          value: entry.value || ''
        });
      });

      // Calculate reference periods
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Quarterly reference periods
      let currentQ: number;
      let currentFY: number;
      if (currentMonth >= 3 && currentMonth <= 5) {
        currentQ = 1; currentFY = currentYear;
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        currentQ = 2; currentFY = currentYear;
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        currentQ = 3; currentFY = currentYear;
      } else {
        currentQ = 4; currentFY = currentYear - 1;
      }

      const lastTwoQuarters: { quarter: string; year: number; label: string }[] = [];
      for (let i = 1; i <= 2; i++) {
        let q = currentQ - i;
        let fy = currentFY;
        while (q <= 0) { q += 4; fy -= 1; }
        lastTwoQuarters.push({ quarter: `Q${q}`, year: fy, label: `Q${q} ${fy}-${(fy + 1).toString().slice(-2)}` });
      }

      // Annual reference periods
      const annualFY = currentMonth >= 3 ? currentYear : currentYear - 1;
      const lastTwoYears = [
        { year: annualFY - 1, label: `FY ${annualFY - 1}-${annualFY.toString().slice(-2)}` },
        { year: annualFY - 2, label: `FY ${annualFY - 2}-${(annualFY - 1).toString().slice(-2)}` }
      ];

      // Group KPIs by feature with reference values
      // Use app feature keys instead of database feature_module
      const result: FeatureKPIData = {};
      
      (kpis || []).forEach(kpi => {
        const dbFeatureModule = kpi.feature_module;
        if (!dbFeatureModule) return;

        // Map database feature_module to app feature key
        const appFeatureKey = dbFeatureModuleToAppKey[dbFeatureModule] || dbFeatureModule;

        if (!result[appFeatureKey]) {
          result[appFeatureKey] = [];
        }

        const kpiEntries = entriesMap.get(kpi.id) || [];
        let ref1Value = '-';
        let ref2Value = '-';
        let ref1Label = '';
        let ref2Label = '';

        if (kpi.period === 'Annual') {
          ref1Label = lastTwoYears[0].label;
          ref2Label = lastTwoYears[1].label;
          ref1Value = kpiEntries.find(e => e.year === lastTwoYears[0].year)?.value || '-';
          ref2Value = kpiEntries.find(e => e.year === lastTwoYears[1].year)?.value || '-';
        } else {
          ref1Label = lastTwoQuarters[0].label;
          ref2Label = lastTwoQuarters[1].label;
          ref1Value = kpiEntries.find(e => e.quarter === lastTwoQuarters[0].quarter && e.year === lastTwoQuarters[0].year)?.value || '-';
          ref2Value = kpiEntries.find(e => e.quarter === lastTwoQuarters[1].quarter && e.year === lastTwoQuarters[1].year)?.value || '-';
        }

        result[appFeatureKey].push({
          id: kpi.id,
          name: kpi.name,
          category: kpi.category || 'General',
          subCategory: kpi.sub_category || '',
          period: kpi.period || 'Quarterly',
          ref1Value,
          ref2Value,
          ref1Label,
          ref2Label
        });
      });

      return result;
    },
    enabled: !!selectedCompanyId
  });

  const toggleFeatureExpand = (featureKey: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureKey)) {
        newSet.delete(featureKey);
      } else {
        newSet.add(featureKey);
      }
      return newSet;
    });
  };
  // Helper to get last 2 quarters based on current date
  const getLastTwoQuarters = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Determine current quarter (financial year: April-March)
    // Q1: Apr-Jun (3-5), Q2: Jul-Sep (6-8), Q3: Oct-Dec (9-11), Q4: Jan-Mar (0-2)
    let currentQ: number;
    let currentFY: number;
    
    if (currentMonth >= 3 && currentMonth <= 5) {
      currentQ = 1;
      currentFY = currentYear;
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      currentQ = 2;
      currentFY = currentYear;
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      currentQ = 3;
      currentFY = currentYear;
    } else {
      currentQ = 4;
      currentFY = currentYear - 1;
    }
    
    // Get previous 2 quarters
    const quarters: { quarter: string; year: number; label: string }[] = [];
    for (let i = 1; i <= 2; i++) {
      let q = currentQ - i;
      let fy = currentFY;
      while (q <= 0) {
        q += 4;
        fy -= 1;
      }
      const qLabel = `Q${q} ${fy}-${(fy + 1).toString().slice(-2)}`;
      quarters.push({ quarter: `Q${q}`, year: fy, label: qLabel });
    }
    return quarters;
  };

  // Helper to get last 2 financial years
  const getLastTwoYears = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Financial year: April-March
    const currentFY = currentMonth >= 3 ? currentYear : currentYear - 1;
    
    return [
      { year: currentFY - 1, label: `FY ${currentFY - 1}-${currentFY.toString().slice(-2)}` },
      { year: currentFY - 2, label: `FY ${currentFY - 2}-${(currentFY - 1).toString().slice(-2)}` }
    ];
  };

  // Export features with sub-categories to Excel
  const handleExportFeatures = async () => {
    if (!selectedCompanyId || !selectedCompany) {
      toast.error('Please select a company first');
      return;
    }

    try {
      setIsExporting(true);

      // Get enabled features for this company
      const enabledFeatureKeys = ALL_FEATURES
        .filter(f => isFeatureEnabled(f.key))
        .map(f => f.key);

      // Fetch KPIs grouped by feature module
      const { data: kpis, error } = await supabase
        .from('kpi_master')
        .select('id, name, category, sub_category, feature_module, esg, core_level, period')
        .in('feature_module', enabledFeatureKeys)
        .order('feature_module')
        .order('category')
        .order('sub_category');

      if (error) throw error;

      // Fetch KPI entries for this company
      const { data: entries, error: entriesError } = await supabase
        .from('kpi_entries')
        .select('kpi_id, value, quarter, year')
        .eq('company_id', selectedCompanyId);

      if (entriesError) throw entriesError;

      // Create a map of KPI entries by kpi_id
      const entriesMap = new Map<string, { quarter: string; year: number; value: string }[]>();
      (entries || []).forEach(entry => {
        if (!entriesMap.has(entry.kpi_id)) {
          entriesMap.set(entry.kpi_id, []);
        }
        entriesMap.get(entry.kpi_id)!.push({
          quarter: entry.quarter,
          year: entry.year,
          value: entry.value || ''
        });
      });

      const lastTwoQuarters = getLastTwoQuarters();
      const lastTwoYears = getLastTwoYears();

      // Group KPIs by feature -> category -> sub-category
      type KPIInfo = { id: string; name: string; period: string };
      type CategoryData = Map<string, KPIInfo[]>; // sub_category -> kpi info
      type FeatureData = { 
        label: string; 
        type: string; 
        optional: boolean; 
        categories: Map<string, CategoryData>;
      };
      const featureMap = new Map<string, FeatureData>();

      // Initialize with enabled features
      ALL_FEATURES.forEach(f => {
        if (isFeatureEnabled(f.key)) {
          featureMap.set(f.key, {
            label: f.label,
            type: f.type,
            optional: isFeatureOptional(f.key),
            categories: new Map()
          });
        }
      });

      // Group KPIs into their features, categories, and sub-categories
      (kpis || []).forEach(kpi => {
        const featureData = featureMap.get(kpi.feature_module || '');
        if (featureData) {
          const category = kpi.category || 'General';
          const subCategory = kpi.sub_category || '';
          
          if (!featureData.categories.has(category)) {
            featureData.categories.set(category, new Map());
          }
          const categoryData = featureData.categories.get(category)!;
          
          if (!categoryData.has(subCategory)) {
            categoryData.set(subCategory, []);
          }
          categoryData.get(subCategory)!.push({ 
            id: kpi.id, 
            name: kpi.name, 
            period: kpi.period || 'Quarterly' 
          });
        }
      });

      // Helper to get reference values for a KPI
      const getRefValues = (kpiId: string, period: string): { ref1: string; ref2: string; label1: string; label2: string } => {
        const kpiEntries = entriesMap.get(kpiId) || [];
        
        if (period === 'Annual') {
          // For annual, get last 2 years' values
          const year1 = lastTwoYears[0];
          const year2 = lastTwoYears[1];
          
          const val1 = kpiEntries.find(e => e.year === year1.year)?.value || '-';
          const val2 = kpiEntries.find(e => e.year === year2.year)?.value || '-';
          
          return { 
            ref1: val1, 
            ref2: val2, 
            label1: year1.label, 
            label2: year2.label 
          };
        } else {
          // For quarterly, get last 2 quarters
          const q1 = lastTwoQuarters[0];
          const q2 = lastTwoQuarters[1];
          
          const val1 = kpiEntries.find(e => e.quarter === q1.quarter && e.year === q1.year)?.value || '-';
          const val2 = kpiEntries.find(e => e.quarter === q2.quarter && e.year === q2.year)?.value || '-';
          
          return { 
            ref1: val1, 
            ref2: val2, 
            label1: q1.label, 
            label2: q2.label 
          };
        }
      };

      // Determine column headers for reference periods
      const refCol1 = lastTwoQuarters[0].label;
      const refCol2 = lastTwoQuarters[1].label;

      // Build export data with proper hierarchy
      const exportData: any[] = [];
      
      featureMap.forEach((featureData, featureKey) => {
        // Add feature header row
        exportData.push({
          'Feature Module': featureData.label,
          'Type': featureData.type.charAt(0).toUpperCase() + featureData.type.slice(1),
          'Status': featureData.optional ? 'Optional' : 'Mandatory',
          'Category': '',
          'Sub-Category': '',
          'KPI Name': '',
          [refCol1]: '',
          [refCol2]: ''
        });

        // Add categories, sub-categories and KPIs
        featureData.categories.forEach((subCategories, category) => {
          let isFirstCategoryRow = true;
          
          subCategories.forEach((kpiInfos, subCategory) => {
            kpiInfos.forEach((kpiInfo, idx) => {
              const refValues = getRefValues(kpiInfo.id, kpiInfo.period);
              
              exportData.push({
                'Feature Module': '',
                'Type': '',
                'Status': '',
                'Category': isFirstCategoryRow ? category : '',
                'Sub-Category': idx === 0 ? (subCategory || '-') : '',
                'KPI Name': kpiInfo.name,
                [refCol1]: kpiInfo.period === 'Annual' ? `${refValues.label1}: ${refValues.ref1}` : refValues.ref1,
                [refCol2]: kpiInfo.period === 'Annual' ? `${refValues.label2}: ${refValues.ref2}` : refValues.ref2
              });
              isFirstCategoryRow = false;
            });
          });
        });

        // Add empty row between features
        exportData.push({
          'Feature Module': '',
          'Type': '',
          'Status': '',
          'Category': '',
          'Sub-Category': '',
          'KPI Name': '',
          [refCol1]: '',
          [refCol2]: ''
        });
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Feature Module
        { wch: 12 }, // Type
        { wch: 12 }, // Status
        { wch: 35 }, // Category
        { wch: 40 }, // Sub-Category
        { wch: 60 }, // KPI Name
        { wch: 20 }, // Ref Period 1
        { wch: 20 }, // Ref Period 2
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Features & KPIs');

      // Download file
      const fileName = `${selectedCompany.brand.replace(/\s+/g, '_')}_Features_KPIs.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Features exported successfully');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Failed to export features');
    } finally {
      setIsExporting(false);
    }
  };

  const renderFeatureCard = (feature: { key: string; label: string; type: 'quarterly' | 'annual' }) => {
    const Icon = FEATURE_ICONS[feature.key] || FileText;
    const enabled = isFeatureEnabled(feature.key);
    const optional = isFeatureOptional(feature.key);
    const isExpanded = expandedFeatures.has(feature.key);
    
    // Use FEATURE_FIELD_MAPPINGS as primary source of truth (matches company user view)
    const featureMapping = FEATURE_FIELD_MAPPINGS[feature.key];
    const mappedKPIs = featureMapping?.kpis || [];
    
    // Calculate total field count for features (each KPI can have multiple fields)
    const kpiCount = mappedKPIs.length;

    // Group KPIs by their labels for display (computed inline, no useMemo in render function)
    const groupedKPIs: { [category: string]: { id: string; name: string; fields: { id: string; label: string }[] }[] } = {};
    if (featureMapping) {
      groupedKPIs[featureMapping.featureLabel] = [];
      mappedKPIs.forEach((kpi: KPIDefinition) => {
        groupedKPIs[featureMapping.featureLabel].push({
          id: kpi.id,
          name: `${kpi.number}. ${kpi.label}`,
          fields: kpi.fields.map(f => ({ id: f.id, label: `${kpi.number}${f.letterIndex}. ${f.label}` }))
        });
      });
    }

    return (
      <Card key={feature.key} className={`transition-all overflow-hidden ${enabled ? 'border-primary/30' : 'opacity-60'}`}>
        <CardContent className="p-4">
          <Collapsible open={isExpanded} onOpenChange={() => toggleFeatureExpand(feature.key)}>
            {/* Header row - contained layout */}
            <div className="flex items-center justify-between gap-3">
              {/* Left side: Icon + Label */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`p-1.5 rounded-lg shrink-0 ${enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`w-4 h-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <Label htmlFor={feature.key} className="text-sm font-medium cursor-pointer block truncate">
                    {feature.label}
                  </Label>
                </div>
              </div>
              
              {/* Right side: Switch only */}
              <Switch
                id={feature.key}
                checked={enabled}
                onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
                disabled={loading}
                className="shrink-0"
              />
            </div>

            {/* Badges row - separate line for badges */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap pl-8">
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize">
                {feature.type}
              </Badge>
              {enabled && (
                <Badge variant={optional ? 'secondary' : 'default'} className="text-[10px] py-0 px-1.5">
                  {optional ? 'Optional' : 'Mandatory'}
                </Badge>
              )}
              {kpiCount > 0 && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                  {kpiCount} KPIs
                </Badge>
              )}
            </div>

            {/* Controls row - Optional checkbox and expand button */}
            {enabled && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id={`${feature.key}-optional`}
                    checked={optional}
                    onCheckedChange={(checked) => setFeatureOptional(feature.key, checked === true)}
                    disabled={loading}
                  />
                  <Label htmlFor={`${feature.key}-optional`} className="text-xs text-muted-foreground cursor-pointer">
                    Mark as Optional
                  </Label>
                </div>
                {kpiCount > 0 && (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      {isExpanded ? (
                        <>
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                          Hide KPIs
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-3.5 w-3.5 mr-1" />
                          View KPIs
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>
            )}

            <CollapsibleContent className="mt-3">
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2 bg-muted/20">
                {Object.entries(groupedKPIs).map(([category, kpis]) => (
                  <div key={category} className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded sticky top-0">
                      {category}
                    </div>
                    <div className="space-y-0.5">
                      {kpis.map((kpi: { id: string; name: string; fields: { id: string; label: string }[] }) => (
                        <div key={kpi.id} className="px-2 py-1.5 text-xs hover:bg-muted/30 rounded">
                          <div className="font-medium text-[11px] leading-tight text-foreground">{kpi.name}</div>
                          {kpi.fields.length > 0 && (
                            <div className="ml-3 mt-1 space-y-0.5">
                              {kpi.fields.map(field => (
                                <div key={field.id} className="text-muted-foreground text-[10px]">
                                  {field.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedKPIs).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No KPIs assigned to this feature
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <PageHeader
          title="Feature Management"
          subtitle="Enable or disable KPI modules for each portfolio company"
        />

        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Company</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {investedCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <span>{company.brand}</span>
                      <Badge variant="outline" className="text-xs">
                        {company.fund}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCompany && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">
                    Features for {selectedCompany.brand}
                  </CardTitle>
                  <Badge variant="secondary">{selectedCompany.firesideCategory}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportFeatures}
                    disabled={isExporting || loading}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>
                  {hasUnsavedChanges && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={discardChanges}
                      disabled={saving}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Discard
                    </Button>
                  )}
                  <Button
                    onClick={saveChanges}
                    disabled={!hasUnsavedChanges || saving}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
              {hasUnsavedChanges && (
                <p className="text-sm text-amber-600 mt-2">You have unsaved changes</p>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="quarterly" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="quarterly">Quarterly Metrics</TabsTrigger>
                  <TabsTrigger value="annual">Annual Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="quarterly">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {QUARTERLY_FEATURES.map(renderFeatureCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="annual">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ANNUAL_FEATURES.map(renderFeatureCard)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FeatureManagement;
