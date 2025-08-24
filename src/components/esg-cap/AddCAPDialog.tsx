import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Download } from "lucide-react";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { CAPItem, CAPStatus, CAPType, CAPPriority } from "./CAPTable";
import { toast } from "@/hooks/use-toast";

interface AddCAPDialogProps {
  onAddItem: (item: CAPItem) => void;
  onAddMultipleItems: (items: CAPItem[]) => void;
}

export function AddCAPDialog({ onAddItem, onAddMultipleItems }: AddCAPDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Manual form state
  const [formData, setFormData] = useState({
    companyId: "",
    item: "",
    actions: "",
    responsibility: "",
    deliverable: "",
    targetDate: "",
    type: "CP" as CAPType,
    priority: "Medium" as CAPPriority,
    status: "Pending" as CAPStatus
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId || !formData.item || !formData.actions) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields (Company, Item, Actions).",
        variant: "destructive",
      });
      return;
    }

    const newItem: CAPItem = {
      id: `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId: parseInt(formData.companyId),
      item: formData.item,
      actions: formData.actions,
      responsibility: formData.responsibility,
      deliverable: formData.deliverable,
      targetDate: formData.targetDate,
      type: formData.type,
      priority: formData.priority,
      status: formData.status
    };

    onAddItem(newItem);
    
    // Reset form
    setFormData({
      companyId: "",
      item: "",
      actions: "",
      responsibility: "",
      deliverable: "",
      targetDate: "",
      type: "CP",
      priority: "Medium",
      status: "Pending"
    });
    
    setOpen(false);
    
    toast({
      title: "CAP Item Added",
      description: "New CAP item has been successfully added.",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Format",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("File must contain at least a header row and one data row");
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['company', 'item', 'actions', 'responsibility', 'deliverable', 'targetdate', 'type', 'priority'];
      
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.includes(header.toLowerCase()))
      );
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const newItems: CAPItem[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < headers.length) continue;
        
        const companyName = values[headers.findIndex(h => h.includes('company'))];
        const company = portfolioCompanies.find(c => 
          c.name.toLowerCase().includes(companyName.toLowerCase())
        );
        
        if (!company) {
          console.warn(`Company "${companyName}" not found, skipping row ${i + 1}`);
          continue;
        }

        const item: CAPItem = {
          id: `cap_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          companyId: company.id,
          item: values[headers.findIndex(h => h.includes('item'))] || "",
          actions: values[headers.findIndex(h => h.includes('actions'))] || "",
          responsibility: values[headers.findIndex(h => h.includes('responsibility'))] || "",
          deliverable: values[headers.findIndex(h => h.includes('deliverable'))] || "",
          targetDate: values[headers.findIndex(h => h.includes('targetdate'))] || "",
          type: (values[headers.findIndex(h => h.includes('type'))] as CAPType) || "CP",
          priority: (values[headers.findIndex(h => h.includes('priority'))] as CAPPriority) || "Medium",
          status: "Pending"
        };
        
        newItems.push(item);
      }

      if (newItems.length > 0) {
        onAddMultipleItems(newItems);
        setOpen(false);
        toast({
          title: "CAP Items Imported",
          description: `Successfully imported ${newItems.length} CAP items.`,
        });
      } else {
        throw new Error("No valid items found in the file");
      }
      
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to process the file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      'Company,Item,Actions,Responsibility,Deliverable,Target Date,Type,Priority',
      'TechCorp Inc,Improve carbon emissions reporting,Implement new carbon tracking system,ESG Manager,Monthly carbon reports,2024-03-15,CP,High',
      'GreenStart Ltd,Enhance worker safety protocols,Develop comprehensive safety training program,HR Director,Updated safety manual,2024-04-01,CS,Medium'
    ].join('\n');
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esg_cap_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "ESG CAP template has been downloaded to your device.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add CAP Items
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New CAP Items</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Single CAP Item</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company *</Label>
                      <Select 
                        value={formData.companyId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {portfolioCompanies.map(company => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="targetDate">Target Date</Label>
                      <Input
                        id="targetDate"
                        type="date"
                        value={formData.targetDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="item">Item Description *</Label>
                    <Textarea
                      id="item"
                      value={formData.item}
                      onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
                      placeholder="Describe the CAP item..."
                      className="min-h-[60px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="actions">Measures and/or Corrective Actions *</Label>
                    <Textarea
                      id="actions"
                      value={formData.actions}
                      onChange={(e) => setFormData(prev => ({ ...prev, actions: e.target.value }))}
                      placeholder="Describe the required actions..."
                      className="min-h-[60px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="responsibility">Resource & Responsibility</Label>
                      <Input
                        id="responsibility"
                        value={formData.responsibility}
                        onChange={(e) => setFormData(prev => ({ ...prev, responsibility: e.target.value }))}
                        placeholder="Who is responsible?"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="deliverable">Expected Deliverable</Label>
                      <Input
                        id="deliverable"
                        value={formData.deliverable}
                        onChange={(e) => setFormData(prev => ({ ...prev, deliverable: e.target.value }))}
                        placeholder="What should be delivered?"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value: CAPType) => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CP">CP</SelectItem>
                          <SelectItem value="CS">CS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value: CAPPriority) => setFormData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: CAPStatus) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Delayed">Delayed</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Add CAP Item
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload CAP Items from Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Upload a CSV file with your CAP items. Make sure your file includes the required columns.
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium">
                          Drop your CSV file here, or{" "}
                          <span className="text-primary underline">browse</span>
                        </span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        CSV files only
                      </p>
                    </div>
                  </div>
                </div>
                
                {uploading && (
                  <div className="text-center text-sm text-muted-foreground">
                    Processing file...
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Required columns:</strong></p>
                  <p>• Company, Item, Actions, Responsibility, Deliverable, Target Date, Type, Priority</p>
                  <p><strong>Note:</strong> Company names must match existing portfolio companies</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}