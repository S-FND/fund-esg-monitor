import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ESGCategory, CoreLevel, RevenueStage, KPIIndustry, FeatureModule } from '@/types/esg';
import { mockCompanies } from '@/data/mockData';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface AddKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddKPI: (kpi: NewKPIData) => void;
}

export interface NewKPIData {
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
  targetCompanies?: string[];
  featureModule?: FeatureModule;
}

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

const METRIC_TYPES = ['Number', 'Yes/No', 'Descriptive', 'Percentage', 'Currency'];

const QUARTERLY_MODULES: { value: FeatureModule; label: string }[] = [
  { value: 'environmental', label: 'Environmental' },
  { value: 'social', label: 'Social' },
  { value: 'governance', label: 'Governance' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'incidentLog', label: 'Incident Log' },
  { value: 'policies', label: 'Policies' },
  
];

const ANNUAL_MODULES: { value: FeatureModule; label: string }[] = [
  { value: 'certifications', label: 'Certifications' },
  { value: 'sourcingFulfillment', label: 'Sourcing & Fulfillment' },
  { value: 'operations', label: 'Operations' },
  { value: 'governancePolicies', label: 'Governance Policies' },
];

export const AddKPIDialog = ({ open, onOpenChange, onAddKPI }: AddKPIDialogProps) => {
  const [formData, setFormData] = useState<NewKPIData>({
    name: '',
    esg: 'E',
    category: '',
    subCategory: '',
    metricType: 'Number',
    period: 'Quarterly',
    definition: '',
    coreLevel: 1,
    revenueStages: [...ALL_REVENUE_STAGES],
    industries: [...ALL_INDUSTRIES],
    targetCompanies: [],
    featureModule: undefined,
  });

  const [selectAllRevenue, setSelectAllRevenue] = useState(true);
  const [selectAllIndustry, setSelectAllIndustry] = useState(true);
  const [selectAllCompanies, setSelectAllCompanies] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  const availableModules = formData.period === 'Quarterly' ? QUARTERLY_MODULES : ANNUAL_MODULES;

  const filteredCompanies = mockCompanies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('KPI name is required');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }
    if (!formData.definition.trim()) {
      toast.error('Definition is required');
      return;
    }
    if (formData.revenueStages.length === 0) {
      toast.error('At least one revenue stage must be selected');
      return;
    }
    if (formData.industries.length === 0) {
      toast.error('At least one industry must be selected');
      return;
    }

    onAddKPI(formData);
    toast.success('KPI added successfully');
    
    // Reset form
    setFormData({
      name: '',
      esg: 'E',
      category: '',
      subCategory: '',
      metricType: 'Number',
      period: 'Quarterly',
      definition: '',
      coreLevel: 1,
      revenueStages: [...ALL_REVENUE_STAGES],
      industries: [...ALL_INDUSTRIES],
      targetCompanies: [],
      featureModule: undefined,
    });
    setSelectAllRevenue(true);
    setSelectAllIndustry(true);
    setSelectAllCompanies(false);
    setCompanySearch('');
    onOpenChange(false);
  };

  const toggleRevenueStage = (stage: RevenueStage) => {
    const updated = formData.revenueStages.includes(stage)
      ? formData.revenueStages.filter(s => s !== stage)
      : [...formData.revenueStages, stage];
    setFormData({ ...formData, revenueStages: updated });
    setSelectAllRevenue(updated.length === ALL_REVENUE_STAGES.length);
  };

  const toggleIndustry = (industry: KPIIndustry) => {
    const updated = formData.industries.includes(industry)
      ? formData.industries.filter(i => i !== industry)
      : [...formData.industries, industry];
    setFormData({ ...formData, industries: updated });
    setSelectAllIndustry(updated.length === ALL_INDUSTRIES.length);
  };

  const toggleCompany = (companyId: string) => {
    const current = formData.targetCompanies || [];
    const updated = current.includes(companyId)
      ? current.filter(id => id !== companyId)
      : [...current, companyId];
    setFormData({ ...formData, targetCompanies: updated });
    setSelectAllCompanies(updated.length === mockCompanies.length);
  };

  const handleSelectAllRevenue = (checked: boolean) => {
    setSelectAllRevenue(checked);
    setFormData({
      ...formData,
      revenueStages: checked ? [...ALL_REVENUE_STAGES] : [],
    });
  };

  const handleSelectAllIndustry = (checked: boolean) => {
    setSelectAllIndustry(checked);
    setFormData({
      ...formData,
      industries: checked ? [...ALL_INDUSTRIES] : [],
    });
  };

  const handleSelectAllCompanies = (checked: boolean) => {
    setSelectAllCompanies(checked);
    setFormData({
      ...formData,
      targetCompanies: checked ? mockCompanies.map(c => c.id) : [],
    });
  };

  const removeCompany = (companyId: string) => {
    const updated = (formData.targetCompanies || []).filter(id => id !== companyId);
    setFormData({ ...formData, targetCompanies: updated });
    setSelectAllCompanies(false);
  };

  const getCompanyName = (companyId: string) => {
    return mockCompanies.find(c => c.id === companyId)?.name || companyId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New KPI</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">KPI Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter KPI name"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="esg">ESG Category *</Label>
              <Select
                value={formData.esg}
                onValueChange={(value: ESGCategory) => setFormData({ ...formData, esg: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E">Environmental</SelectItem>
                  <SelectItem value="S">Social</SelectItem>
                  <SelectItem value="G">Governance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="coreLevel">Core Level *</Label>
              <Select
                value={formData.coreLevel.toString()}
                onValueChange={(value) => setFormData({ ...formData, coreLevel: parseInt(value) as CoreLevel })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mandatory</SelectItem>
                  <SelectItem value="2">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Energy, Water, Labour"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="subCategory">Sub-Category</Label>
              <Input
                id="subCategory"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                placeholder="e.g., Consumption, Emissions"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="metricType">Metric Type *</Label>
              <Select
                value={formData.metricType}
                onValueChange={(value) => setFormData({ ...formData, metricType: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="period">Reporting Period *</Label>
              <Select
                value={formData.period}
                onValueChange={(value: 'Quarterly' | 'Annual') => setFormData({ 
                  ...formData, 
                  period: value,
                  featureModule: undefined // Reset module when period changes
                })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="definition">Definition *</Label>
              <Textarea
                id="definition"
                value={formData.definition}
                onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                placeholder="Describe what this KPI measures and how it should be reported"
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>

          {/* Feature Module Selection */}
          <div>
            <Label htmlFor="featureModule">Feature Module</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select which module this KPI will appear under in the data entry screen
            </p>
            <Select
              value={formData.featureModule || ''}
              onValueChange={(value: FeatureModule) => setFormData({ ...formData, featureModule: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a module (optional)" />
              </SelectTrigger>
              <SelectContent>
                {availableModules.map((module) => (
                  <SelectItem key={module.value} value={module.value}>
                    {module.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Companies */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label>Target Companies (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Leave empty to apply globally based on revenue stage and industry
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="selectAllCompanies"
                  checked={selectAllCompanies}
                  onCheckedChange={handleSelectAllCompanies}
                />
                <Label htmlFor="selectAllCompanies" className="text-sm font-normal cursor-pointer">
                  Select All
                </Label>
              </div>
            </div>
            
            {/* Selected Companies */}
            {(formData.targetCompanies?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.targetCompanies?.map((companyId) => (
                  <Badge key={companyId} variant="secondary" className="gap-1">
                    {getCompanyName(companyId)}
                    <button
                      type="button"
                      onClick={() => removeCompany(companyId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Company Search and Selection */}
            <Input
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {filteredCompanies.map((company) => (
                  <div key={company.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`company-${company.id}`}
                      checked={formData.targetCompanies?.includes(company.id) || false}
                      onCheckedChange={() => toggleCompany(company.id)}
                    />
                    <Label htmlFor={`company-${company.id}`} className="text-sm font-normal cursor-pointer truncate">
                      {company.brand}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Revenue Stages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Applicable Revenue Stages *</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="selectAllRevenue"
                  checked={selectAllRevenue}
                  onCheckedChange={handleSelectAllRevenue}
                />
                <Label htmlFor="selectAllRevenue" className="text-sm font-normal cursor-pointer">
                  Select All
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ALL_REVENUE_STAGES.map((stage) => (
                <div key={stage} className="flex items-center gap-2">
                  <Checkbox
                    id={`revenue-${stage}`}
                    checked={formData.revenueStages.includes(stage)}
                    onCheckedChange={() => toggleRevenueStage(stage)}
                  />
                  <Label htmlFor={`revenue-${stage}`} className="text-sm font-normal cursor-pointer">
                    {stage} Cr
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Industries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Applicable Industries *</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="selectAllIndustry"
                  checked={selectAllIndustry}
                  onCheckedChange={handleSelectAllIndustry}
                />
                <Label htmlFor="selectAllIndustry" className="text-sm font-normal cursor-pointer">
                  Select All
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_INDUSTRIES.map((industry) => (
                <div key={industry} className="flex items-center gap-2">
                  <Checkbox
                    id={`industry-${industry}`}
                    checked={formData.industries.includes(industry)}
                    onCheckedChange={() => toggleIndustry(industry)}
                  />
                  <Label htmlFor={`industry-${industry}`} className="text-sm font-normal cursor-pointer">
                    {industry}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add KPI</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
