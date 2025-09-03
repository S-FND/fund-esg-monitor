import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Download } from "lucide-react";
import { ESGCapItem, CAPStatus, CAPCategory, CAPPriority, CAPType } from "./CAPTable";
import { toast } from "@/hooks/use-toast";
import { EsgddAPIs } from "@/network/esgdd";

interface Company {
    id: string;
    name: string;
    email: string;
}

interface AddCAPDialogProps {
    onAddItem: (item: ESGCapItem) => void;
    onAddMultipleItems: (items: ESGCapItem[]) => void;
}

export function AddCAPDialog({ onAddItem, onAddMultipleItems }: AddCAPDialogProps) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);

    const [financialYear, setFinancialYear] = useState("");

    useEffect(() => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const aprilFirstCurrentYear = new Date(currentYear, 3, 1); // April 1st of the current year

        // Check if the current date is before April 1st of the current year
        const financialYear =
            currentDate < aprilFirstCurrentYear
                ? `${currentYear - 1}-${currentYear.toString().slice(-2)}`
                : `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

        setFinancialYear(financialYear);
    }, []);

    // Keep form state exactly as provided BUT replace CS with dealCondition
    const [formData, setFormData] = useState({
        companyId: "",
        item: "",
        category: "environmental" as CAPCategory,
        priority: "Medium" as CAPPriority,
        measures: "",
        resource: "",
        deliverable: "",
        targetDate: "",
        dealCondition: "none" as CAPType, // Replace CS with dealCondition
        actualDate: "",
        status: "pending" as CAPStatus,
        assignedTo: "",
    });

    // Fetch companies from API when dialog opens
    useEffect(() => {
        if (open) {
            fetchCompanies();
        }
    }, [open]);

    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        try {
            const [res, error] = await EsgddAPIs.getCompanyList();
            console.log('API response:', res);

            if (error) {
                throw new Error(error);
            }

            if (!res || res.status === false) {
                throw new Error(`API error: ${res?.message || 'Unknown error'}`);
            }

            const jsondata = res?.data || res;
            if (jsondata && Array.isArray(jsondata)) {
                const mappedCompanies = jsondata.map(company => ({
                    id: company._id || company.id,
                    name: company.companyName || company.name,
                    email: company.email || company.companyEmail || ""
                })).filter(company => company.id && company.name);

                setCompanies(mappedCompanies);
            } else if (jsondata && Array.isArray(jsondata.data)) {
                const mappedCompanies = jsondata.data.map(company => ({
                    id: company._id || company.id,
                    name: company.companyName || company.name,
                    email: company.email || company.companyEmail || ""
                })).filter(company => company.id && company.name);

                console.log('mappedCompanies',mappedCompanies);
                setCompanies(mappedCompanies);
            } else {
                console.error("Unexpected API response structure:", jsondata);
                setCompanies([]);
                toast({
                    title: "Error",
                    description: "Unexpected response format from server",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
            setCompanies([]);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to load companies",
                variant: "destructive",
            });
        } finally {
            setLoadingCompanies(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
      
        if (!formData.item || !formData.measures || !formData.companyId) {
          toast({
            title: "Missing Required Fields",
            description: "Please fill in all required fields (Company, Item, Measures).",
            variant: "destructive",
          });
          return;
        }
      
        const selectedCompany = companies.find(c => c.id === formData.companyId);
        if (!selectedCompany) {
          toast({
            title: "Company Not Selected",
            description: "Please select a valid company.",
            variant: "destructive",
          });
          return;
        }
      
        const newItem: Omit<ESGCapItem, 'id'> = {
          reportId: formData.companyId,
          item: formData.item,
          category: formData.category,
          priority: formData.priority,
          measures: formData.measures,
          resource: formData.resource,
          deliverable: formData.deliverable,
          targetDate: formData.targetDate,
          CS: formData.dealCondition,
          actualDate: formData.actualDate,
          status: formData.status,
          assignedTo: formData.assignedTo,
          dealCondition: formData.dealCondition,
          createdAt: new Date().toISOString(),
        };
      
        try {
          // Get the current plan from the parent component state
          // This assumes you pass the current plan items as a prop
          // If not, you'll need to fetch the current plan first
          
          // For now, let's assume you have access to the current plan
          const currentPlan = []; // This should be the current plan items
          
          const updatedPlan = [...currentPlan, newItem];
          
          const finalData = {
            plan: updatedPlan,
            email: selectedCompany.email,
            financialYear: financialYear
          };
      
          console.log('finalData', finalData);
          
          // Call API to save the updated plan
          const [result, error] = await EsgddAPIs.saveEscap(finalData);
      
          if (result) {
            // Add to local state after successful API call
            const savedItem: ESGCapItem = {
              ...newItem,
              id: result.id || result._id // Use server-generated ID
            };
            
            onAddItem(savedItem);
            toast({
              title: "CAP Item Added",
              description: "New CAP item has been successfully added.",
            });
            
            // Reset form
            setFormData({
              companyId: "",
              item: "",
              category: "environmental" as CAPCategory,
              priority: "Medium" as CAPPriority,
              measures: "",
              resource: "",
              deliverable: "",
              targetDate: "",
              dealCondition: "none" as CAPType,
              actualDate: "",
              status: "pending" as CAPStatus,
              assignedTo: "",
            });
      
            setOpen(false);
          } else {
            throw new Error(error || "Failed to save CAP item");
          }
        } catch (error) {
          console.error("Error adding CAP item:", error);
          toast({
            title: "Error",
            description: "Failed to add CAP item. Please try again.",
            variant: "destructive",
          });
        }
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

            // Updated required headers to match ESGCapItem interface
            const requiredHeaders = ['company', 'item', 'measures', 'category', 'resource', 'targetdate', 'dealcondition', 'actualdate', 'status', 'assignedto'];

            const missingHeaders = requiredHeaders.filter(header =>
                !headers.some(h => h.includes(header.toLowerCase()))
            );

            if (missingHeaders.length > 0) {
                throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
            }

            const newItems: ESGCapItem[] = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

                if (values.length < headers.length) continue;

                const companyName = values[headers.findIndex(h => h.includes('company'))];
                const company = companies.find(c =>
                    c.name.toLowerCase().includes(companyName.toLowerCase())
                );

                if (!company) {
                    console.warn(`Company "${companyName}" not found, skipping row ${i + 1}`);
                    continue;
                }

                const item: Omit<ESGCapItem, 'id'> = {
                    reportId: company.id,
                    item: values[headers.findIndex(h => h.includes('item'))] || "",
                    category: (values[headers.findIndex(h => h.includes('category'))] as CAPCategory) || "environmental",
                    priority: (values[headers.findIndex(h => h.includes('priority'))] as CAPPriority) || "Medium",
                    measures: values[headers.findIndex(h => h.includes('measures'))] || "",
                    resource: values[headers.findIndex(h => h.includes('resource'))] || "",
                    deliverable: values[headers.findIndex(h => h.includes('deliverable'))] || "",
                    targetDate: values[headers.findIndex(h => h.includes('targetdate'))] || "",
                    CS: values[headers.findIndex(h => h.includes('dealcondition'))] || "none", // Use dealcondition for CS
                    actualDate: values[headers.findIndex(h => h.includes('actualdate'))] || "",
                    status: (values[headers.findIndex(h => h.includes('status'))] as CAPStatus) || "pending",
                    assignedTo: values[headers.findIndex(h => h.includes('assignedto'))] || "",
                    dealCondition: (values[headers.findIndex(h => h.includes('dealcondition'))] || "") as CAPType,
                    createdAt: new Date().toISOString(),
                };

                newItems.push(item as ESGCapItem);
            }

            if (newItems.length > 0) {
                // Call API to save multiple CAP items
                try {
                    const firstItem = newItems[0];
                    const company = companies.find(c => c.id === firstItem.reportId);
                    if (!company) {
                        throw new Error("Company not found for uploaded items");
                    }

                    const finalData = {
                        plan: newItems,
                        email: company.email,
                        financialYear: "2024-25"
                    };

                    const [result, error] = await EsgddAPIs.saveEscap(finalData);

                    if (result) {
                        onAddMultipleItems(newItems);
                        setOpen(false);
                        toast({
                            title: "CAP Items Imported",
                            description: `Successfully imported ${newItems.length} CAP items.`,
                        });
                    } else {
                        throw new Error(error || "Failed to save CAP items");
                    }
                } catch (apiError) {
                    console.error("API Error:", apiError);
                    throw new Error("Failed to save CAP items to server");
                }
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
        // Use actual company names from the API in the template
        const companyNames = companies.slice(0, 2).map(c => c.name);
        const template = [
            'Company,Item,Measures,Category,Resource,TargetDate,DealCondition,ActualDate,Status,AssignedTo',
            `${companyNames[0] || 'TechCorp Inc'},Improve carbon emissions reporting,Implement new carbon tracking system,environmental,Monthly carbon reports,2024-03-15,CP,2024-03-20,in_progress,ESG Manager`,
            `${companyNames[1] || 'GreenStart Ltd'},Enhance worker safety protocols,Develop comprehensive safety training program,social,Updated safety manual,2024-04-01,CS,2024-04-15,in_review,HR Director`
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
                                                value={formData.companyId} // This is still problematic - needs fixing
                                                onValueChange={(value) => {
                                                    // This is a simplified approach - you'd want proper company handling
                                                    setFormData(prev => ({ ...prev, companyId: value }));
                                                }}
                                                disabled={loadingCompanies}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Select company"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {companies.map(company => (
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
                                        <Label htmlFor="item">Item *</Label>
                                        <Textarea
                                            id="item"
                                            value={formData.item}
                                            onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
                                            placeholder="Describe the CAP item..."
                                            className="min-h-[60px]"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="measures">Measures *</Label>
                                        <Textarea
                                            id="measures"
                                            value={formData.measures}
                                            onChange={(e) => setFormData(prev => ({ ...prev, measures: e.target.value }))}
                                            placeholder="Describe the measures..."
                                            className="min-h-[60px]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="resource">Resource</Label>
                                            <Input
                                                id="resource"
                                                value={formData.resource}
                                                onChange={(e) => setFormData(prev => ({ ...prev, resource: e.target.value }))}
                                                placeholder="Who is responsible?"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="assignedTo">Assigned To</Label>
                                            <Input
                                                id="assignedTo"
                                                value={formData.assignedTo}
                                                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                                                placeholder="Who is responsible?"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="category">Category</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value: CAPCategory) => setFormData(prev => ({ ...prev, category: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="environmental">Environmental</SelectItem>
                                                    <SelectItem value="social">Social</SelectItem>
                                                    <SelectItem value="governance">Governance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="dealCondition">CP/CS</Label>
                                            <Select
                                                value={formData.dealCondition}
                                                onValueChange={(value: CAPType) => setFormData(prev => ({ ...prev, dealCondition: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CP">CP</SelectItem>
                                                    <SelectItem value="CS">CS</SelectItem>
                                                    <SelectItem value="none">None</SelectItem>
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
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="in_review">In Review</SelectItem>
                                                <SelectItem value="accepted">Accepted</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="delayed">Delayed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={loadingCompanies}>
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
                                                    disabled={uploading || loadingCompanies}
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
                                    <p>• Company, Item, Measures, Category, Resource, TargetDate, DealCondition, ActualDate, Status, AssignedTo</p>
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