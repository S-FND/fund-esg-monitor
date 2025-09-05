import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Download, Trash2 } from "lucide-react";
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

// Define a single row in the form
interface CAPFormRow {
    id: string;
    item: string;
    category: CAPCategory;
    priority: CAPPriority;
    measures: string;
    resource: string;
    deliverable: string;
    targetDate: string;
    dealCondition: CAPType;
    actualDate: string;
    status: CAPStatus;
    assignedTo: string;
}

export function AddCAPDialog({ onAddItem, onAddMultipleItems }: AddCAPDialogProps) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [financialYear, setFinancialYear] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<string>("");

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

    // Initialize with one empty row
    const [formRows, setFormRows] = useState<CAPFormRow[]>([
        {
            id: "1", // Start with ID "1"
            item: "",
            category: "environmental",
            priority: "Medium",
            measures: "",
            resource: "",
            deliverable: "",
            targetDate: "",
            dealCondition: "none",
            actualDate: "",
            status: "pending",
            assignedTo: "",
        }
    ]);

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

    const addRow = () => {
        // Calculate next ID based on current rows count
        const nextId = (formRows.length + 1).toString();
        setFormRows([
            ...formRows,
            {
                id: nextId,
                item: "",
                category: "environmental",
                priority: "Medium",
                measures: "",
                resource: "",
                deliverable: "",
                targetDate: "",
                dealCondition: "none",
                actualDate: "",
                status: "pending",
                assignedTo: "",
            }
        ]);
    };

    const removeRow = (id: string) => {
        if (formRows.length <= 1) return;
        setFormRows(formRows.filter(row => row.id !== id));
    };

    const updateRow = (id: string, field: keyof CAPFormRow, value: any) => {
        setFormRows(
            formRows.map(row => 
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate company selection
        if (!selectedCompany) {
            toast({
                title: "Company Required",
                description: "Please select a company.",
                variant: "destructive",
            });
            return;
        }

        // Validate all rows
        const invalidRows = formRows.filter(row => 
            !row.item || !row.measures
        );

        if (invalidRows.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: "Please fill in all required fields (Item, Measures) for all rows.",
                variant: "destructive",
            });
            return;
        }

        // Find the selected company details
        const company = companies.find(c => c.id === selectedCompany);
        if (!company) {
            toast({
                title: "Invalid Company",
                description: "Selected company is not valid.",
                variant: "destructive",
            });
            return;
        }

        // Prepare items for submission with sequential IDs
        const newItems: ESGCapItem[] = [];

        for (let i = 0; i < formRows.length; i++) {
            const row = formRows[i];
            // Create item without id first
            const itemWithoutId: Omit<ESGCapItem, 'id'> = {
                reportId: selectedCompany,
                item: row.item,
                category: row.category,
                priority: row.priority,
                measures: row.measures,
                resource: row.resource,
                deliverable: row.deliverable,
                targetDate: row.targetDate,
                CS: row.dealCondition,
                actualDate: row.actualDate,
                status: row.status,
                assignedTo: row.assignedTo,
                dealCondition: row.dealCondition,
                createdAt: new Date().toISOString(),
            };
            
            // Add ID separately to avoid TypeScript error
            const newItem = {
                ...itemWithoutId,
                id: (i + 1).toString()
            } as ESGCapItem;

            newItems.push(newItem);
        }

        try {
            const finalData = {
                plan: newItems,
                email: company.email,
                financialYear: financialYear
            };

            // Call API to save the plan
            const [result, error] = await EsgddAPIs.saveEscap(finalData);

            if (result) {
                // Add to local state after successful API call
                const savedItems: ESGCapItem[] = newItems.map(item => ({
                    ...item,
                    id: item.id // Keep the sequential ID
                }));
                
                onAddMultipleItems(savedItems);
                
                toast({
                    title: "CAP Items Added",
                    description: `Successfully added ${newItems.length} CAP items.`,
                });

                // Reset form with sequential IDs
                setFormRows([
                    {
                        id: "1",
                        item: "",
                        category: "environmental",
                        priority: "Medium",
                        measures: "",
                        resource: "",
                        deliverable: "",
                        targetDate: "",
                        dealCondition: "none",
                        actualDate: "",
                        status: "pending",
                        assignedTo: "",
                    }
                ]);
                setSelectedCompany("");
                setOpen(false);
            } else {
                throw new Error(error || "Failed to save CAP items");
            }
        } catch (error) {
            console.error("Error adding CAP items:", error);
            toast({
                title: "Error",
                description: "Failed to add CAP items. Please try again.",
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

                // Create item without id first
                const itemWithoutId: Omit<ESGCapItem, 'id'> = {
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
                
                // Add ID separately to avoid TypeScript error
                const newItem = {
                    ...itemWithoutId,
                    id: i.toString()
                } as ESGCapItem;

                newItems.push(newItem);
            }

            if (newItems.length > 0) {
                // Group items by company for API calls
                const itemsByCompany: Record<string, ESGCapItem[]> = {};
                
                newItems.forEach(item => {
                    if (!itemsByCompany[item.reportId]) {
                        itemsByCompany[item.reportId] = [];
                    }
                    itemsByCompany[item.reportId].push(item);
                });

                // Process each company's items
                for (const [companyId, items] of Object.entries(itemsByCompany)) {
                    const company = companies.find(c => c.id === companyId);
                    if (!company) {
                        throw new Error(`Company not found for uploaded items`);
                    }

                    const finalData = {
                        plan: items,
                        email: company.email,
                        financialYear: financialYear
                    };

                    const [result, error] = await EsgddAPIs.saveEscap(finalData);

                    if (result) {
                        // Update IDs for saved items (keep sequential IDs)
                        const savedItems: ESGCapItem[] = items.map(item => ({
                            ...item,
                            id: item.id // Keep the sequential ID
                        }));
                        
                        onAddMultipleItems(savedItems);
                    } else {
                        throw new Error(error || "Failed to save CAP items");
                    }
                }

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
                                <CardTitle>Add Multiple CAP Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Company Selection */}
                                    <div>
                                        <Label htmlFor="company">Company *</Label>
                                        <Select
                                            value={selectedCompany}
                                            onValueChange={setSelectedCompany}
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

                                    {/* Add Row Button */}
                                    <div className="flex justify-end">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={addRow}
                                            className="flex items-center"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Another Item
                                        </Button>
                                    </div>

                                    {/* Form Rows */}
                                    {formRows.map((row, index) => (
                                        <div key={row.id} className="border rounded-lg p-4 space-y-4">
                                            {formRows.length > 1 && (
                                                <div className="flex justify-end">
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => removeRow(row.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            <div>
                                                <Label htmlFor={`item-${index}`}>Item *</Label>
                                                <Textarea
                                                    id={`item-${index}`}
                                                    value={row.item}
                                                    onChange={(e) => updateRow(row.id, 'item', e.target.value)}
                                                    placeholder="Describe the CAP item..."
                                                    className="min-h-[60px]"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor={`measures-${index}`}>Measures *</Label>
                                                <Textarea
                                                    id={`measures-${index}`}
                                                    value={row.measures}
                                                    onChange={(e) => updateRow(row.id, 'measures', e.target.value)}
                                                    placeholder="Describe the measures..."
                                                    className="min-h-[60px]"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor={`resource-${index}`}>Resource</Label>
                                                    <Input
                                                        id={`resource-${index}`}
                                                        value={row.resource}
                                                        onChange={(e) => updateRow(row.id, 'resource', e.target.value)}
                                                        placeholder="Who is responsible?"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor={`assignedTo-${index}`}>Assigned To</Label>
                                                    <Input
                                                        id={`assignedTo-${index}`}
                                                        value={row.assignedTo}
                                                        onChange={(e) => updateRow(row.id, 'assignedTo', e.target.value)}
                                                        placeholder="Who is responsible?"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <Label htmlFor={`category-${index}`}>Category</Label>
                                                    <Select
                                                        value={row.category}
                                                        onValueChange={(value: CAPCategory) => updateRow(row.id, 'category', value)}
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
                                                    <Label htmlFor={`dealCondition-${index}`}>CP/CS</Label>
                                                    <Select
                                                        value={row.dealCondition}
                                                        onValueChange={(value: CAPType) => updateRow(row.id, 'dealCondition', value)}
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
                                                    <Label htmlFor={`priority-${index}`}>Priority</Label>
                                                    <Select
                                                        value={row.priority}
                                                        onValueChange={(value: CAPPriority) => updateRow(row.id, 'priority', value)}
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
                                                <Label htmlFor={`targetDate-${index}`}>Target Date</Label>
                                                <Input
                                                    id={`targetDate-${index}`}
                                                    type="date"
                                                    value={row.targetDate}
                                                    onChange={(e) => updateRow(row.id, 'targetDate', e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor={`status-${index}`}>Status</Label>
                                                <Select
                                                    value={row.status}
                                                    onValueChange={(value: CAPStatus) => updateRow(row.id, 'status', value)}
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
                                                        <SelectItem value="rejected">Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor={`actualDate-${index}`}>Actual Date</Label>
                                                <Input
                                                    id={`actualDate-${index}`}
                                                    type="date"
                                                    value={row.actualDate}
                                                    onChange={(e) => updateRow(row.id, 'actualDate', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" onClick={handleSubmit} disabled={loadingCompanies}>
                                            Add CAP Items
                                        </Button>
                                    </div>
                                </div>
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