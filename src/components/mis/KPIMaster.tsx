import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPITable } from '@/components/KPITable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockKPIs } from '@/data/mockData';
import { Plus, Upload, Search, FileSpreadsheet, Leaf, Users, Scale, Download, Loader2 } from 'lucide-react';
import { downloadKPITemplate } from '@/lib/excelTemplateDownload';
import { KPI } from '@/types/esg';
import { AddKPIDialog, NewKPIData } from '@/components/AddKPIDialog';
import { EditKPIDialog } from '@/components/EditKPIDialog';
import { DeleteKPIDialog } from '@/components/DeleteKPIDialog';
import { UploadKPIExcelDialog } from '@/components/UploadKPIExcelDialog';
import { useKPIMaster } from '@/hooks/useKPIMaster';
import { EDIT_RIGHTS_PAUSED } from '@/lib/companyAccessControl';

const KPIMaster = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [coreFilter, setCoreFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);

  const { kpis: dbKPIs, loading, addKPI, updateKPI, deleteKPI, importKPIs } = useKPIMaster();

  // Combine database KPIs with mock KPIs (mock KPIs as fallback when DB is empty)
  const allKPIs = dbKPIs.length > 0 ? dbKPIs : mockKPIs;

  const handleImportKPIs = async (importedKPIs: KPI[], replaceAll: boolean) => {
    await importKPIs(importedKPIs, replaceAll);
  };

  const handleAddKPI = async (newKPIData: NewKPIData) => {
    await addKPI(newKPIData);
  };

  const handleEditKPI = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setIsEditDialogOpen(true);
  };

  const handleSaveKPI = async (updatedKPI: KPI) => {
    await updateKPI(updatedKPI);
  };

  const handleDeleteKPI = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteKPI = async () => {
    if (selectedKPI) {
      await deleteKPI(selectedKPI.id);
      setIsDeleteDialogOpen(false);
      setSelectedKPI(null);
    }
  };
  const filteredKPIs = allKPIs.filter((kpi) => {
    const matchesSearch = kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || kpi.category === categoryFilter;
    const matchesCore = coreFilter === 'all' || kpi.coreLevel.toString() === coreFilter;
    const matchesTab = activeTab === 'all' || kpi.esg === activeTab;
    
    return matchesSearch && matchesCategory && matchesCore && matchesTab;
  });

  const categories = [...new Set(allKPIs.map(k => k.category))];
  
  const stats = {
    total: allKPIs.length,
    e: allKPIs.filter(k => k.esg === 'E').length,
    s: allKPIs.filter(k => k.esg === 'S').length,
    g: allKPIs.filter(k => k.esg === 'G').length,
    core1: allKPIs.filter(k => k.coreLevel === 1).length,
    core2: allKPIs.filter(k => k.coreLevel === 2).length,
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="KPI Master"
        subtitle="Configure and manage ESG metrics for Q4 2025-26"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadKPITemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)} disabled={EDIT_RIGHTS_PAUSED}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Excel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} disabled={EDIT_RIGHTS_PAUSED}>
              <Plus className="w-4 h-4 mr-2" />
              Add KPI
            </Button>
          </div>
        }
      />

      

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('all')}>
          <CardContent className="p-4 text-center">
            <FileSpreadsheet className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total KPIs</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-esg-environmental/50 transition-colors" onClick={() => setActiveTab('E')}>
          <CardContent className="p-4 text-center">
            <Leaf className="w-6 h-6 mx-auto mb-2 text-esg-environmental" />
            <p className="text-2xl font-bold">{stats.e}</p>
            <p className="text-xs text-muted-foreground">Environmental</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-esg-social/50 transition-colors" onClick={() => setActiveTab('S')}>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-esg-social" />
            <p className="text-2xl font-bold">{stats.s}</p>
            <p className="text-xs text-muted-foreground">Social</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-esg-governance/50 transition-colors" onClick={() => setActiveTab('G')}>
          <CardContent className="p-4 text-center">
            <Scale className="w-6 h-6 mx-auto mb-2 text-esg-governance" />
            <p className="text-2xl font-bold">{stats.g}</p>
            <p className="text-xs text-muted-foreground">Governance</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setCoreFilter('1')}>
          <CardContent className="p-4 text-center">
            <Badge variant="core1" className="mb-2">Mandatory</Badge>
            <p className="text-2xl font-bold">{stats.core1}</p>
            <p className="text-xs text-muted-foreground">Required</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-muted-foreground/50 transition-colors" onClick={() => setCoreFilter('2')}>
          <CardContent className="p-4 text-center">
            <Badge variant="core2" className="mb-2">Optional</Badge>
            <p className="text-2xl font-bold">{stats.core2}</p>
            <p className="text-xs text-muted-foreground">Good to have</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search KPIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={coreFilter} onValueChange={setCoreFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="1">Mandatory</SelectItem>
            <SelectItem value="2">Optional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ESG Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All KPIs</TabsTrigger>
          <TabsTrigger value="E" className="data-[state=active]:bg-esg-environmental data-[state=active]:text-white">
            <Leaf className="w-4 h-4 mr-1" /> Environmental
          </TabsTrigger>
          <TabsTrigger value="S" className="data-[state=active]:bg-esg-social data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-1" /> Social
          </TabsTrigger>
          <TabsTrigger value="G" className="data-[state=active]:bg-esg-governance data-[state=active]:text-white">
            <Scale className="w-4 h-4 mr-1" /> Governance
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading KPIs...</span>
        </div>
      ) : (
        <>
          <KPITable 
            kpis={filteredKPIs} 
            showActions 
            onEdit={handleEditKPI}
            onDelete={handleDeleteKPI}
          />

          {filteredKPIs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No KPIs found matching your criteria.</p>
            </div>
          )}
        </>
      )}

      <AddKPIDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onAddKPI={handleAddKPI}
      />

      <EditKPIDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        kpi={selectedKPI}
        onSave={handleSaveKPI}
      />

      <DeleteKPIDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        kpi={selectedKPI}
        onConfirm={confirmDeleteKPI}
      />

      <UploadKPIExcelDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        existingKPIs={allKPIs}
        onImport={handleImportKPIs}
      />
    </DashboardLayout>
  );
};

export default KPIMaster;
