import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ESGCategory, CoreLevel, RevenueStage, KPIIndustry, KPI } from '@/types/esg';
import { toast } from 'sonner';

interface EditKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: KPI | null;
  onSave: (kpi: KPI) => void;
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

export const EditKPIDialog = ({ open, onOpenChange, kpi, onSave }: EditKPIDialogProps) => {
  const [formData, setFormData] = useState<KPI | null>(null);

  useEffect(() => {
    if (kpi) {
      setFormData({ ...kpi });
    }
  }, [kpi]);

  if (!formData) return null;

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
    if (formData.revenueStages.length === 0) {
      toast.error('At least one revenue stage must be selected');
      return;
    }
    if (formData.industries.length === 0) {
      toast.error('At least one industry must be selected');
      return;
    }

    onSave(formData);
    toast.success('KPI updated successfully');
    onOpenChange(false);
  };

  const toggleRevenueStage = (stage: RevenueStage) => {
    const updated = formData.revenueStages.includes(stage)
      ? formData.revenueStages.filter(s => s !== stage)
      : [...formData.revenueStages, stage];
    setFormData({ ...formData, revenueStages: updated });
  };

  const toggleIndustry = (industry: KPIIndustry) => {
    const updated = formData.industries.includes(industry)
      ? formData.industries.filter(i => i !== industry)
      : [...formData.industries, industry];
    setFormData({ ...formData, industries: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit KPI</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">KPI Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="subCategory">Sub-Category</Label>
              <Input
                id="subCategory"
                value={formData.subCategory || ''}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
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
                onValueChange={(value: 'Quarterly' | 'Annual') => setFormData({ ...formData, period: value })}
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
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Applicable Revenue Stages *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ALL_REVENUE_STAGES.map((stage) => (
                <div key={stage} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-revenue-${stage}`}
                    checked={formData.revenueStages.includes(stage)}
                    onCheckedChange={() => toggleRevenueStage(stage)}
                  />
                  <Label htmlFor={`edit-revenue-${stage}`} className="text-sm font-normal cursor-pointer">
                    {stage} Cr
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Applicable Industries *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_INDUSTRIES.map((industry) => (
                <div key={industry} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-industry-${industry}`}
                    checked={formData.industries.includes(industry)}
                    onCheckedChange={() => toggleIndustry(industry)}
                  />
                  <Label htmlFor={`edit-industry-${industry}`} className="text-sm font-normal cursor-pointer">
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
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
