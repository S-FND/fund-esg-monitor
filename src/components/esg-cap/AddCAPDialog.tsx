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
import { EsgddAPIs,esgddChangePlan } from "@/network/esgdd";
import Papa from 'papaparse';
interface Company {
    id: string;
    name: string;
    email: string;
}

interface AddCAPDialogProps {
    onAddItem: (item: ESGCapItem) => void;
    onAddMultipleItems: (items: ESGCapItem[]) => void;
}

interface CAPFormRow {
    id: string;
    item: string;
    category: CAPCategory;
    priority: CAPPriority;
    issue: string;
    relatedFinding: string;
    measures: string;
    resource: string;
    deliverable: string;
    timelineMonth: number;
    dealCondition: CAPType;
    statusUpdate: string;
    investorStatusUpdate: string;
    reviewRemarks: string;
    lastReviewDate: string;
    implementationSupportNeeded: string;
    closureVerifiedBy: string;
    actualDate: string;
    status: CAPStatus;
    targetDate: string;
    esgLever: string;
    capSource: string;
    progressPercentage: number;
    assignedTo: string;
    remarks: string;
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
        const aprilFirstCurrentYear = new Date(currentYear, 3, 1);

        const financialYear = currentDate < aprilFirstCurrentYear
            ? `${currentYear - 1}-${currentYear.toString().slice(-2)}`
            : `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

        setFinancialYear(financialYear);
    }, []);

    const parseToDateInput = (value: any): string => {
        if (!value) return '';
        // If already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        // Try to parse as Date
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const parseDateDMY = (dateStr: string): string => {
        if (!dateStr) return '';
        const [day, month, year] = dateStr.split('-');
        if (!day || !month || !year) return '';
        return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
      };

    const [formRows, setFormRows] = useState<CAPFormRow[]>([{
        id: "1",
        item: "",
        category: "environmental",
        priority: "Medium",
        issue: "",
        relatedFinding: "",
        measures: "",
        resource: "",
        deliverable: "",
        timelineMonth: 0,
        dealCondition: "none",
        statusUpdate: "",
        investorStatusUpdate: "",
        reviewRemarks: "",
        lastReviewDate: "",
        implementationSupportNeeded: "",
        closureVerifiedBy: "",
        actualDate: "",
        status: "pending",
        targetDate: "",
        esgLever: "",
        capSource: "",
        progressPercentage: 0,
        assignedTo: "",
        remarks: "",
    }]);

    useEffect(() => {
        if (open && companies.length === 0) {
            fetchCompanies();
        }
    }, [open]);

    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        try {
            const [res, error] = await EsgddAPIs.getCompanyList();
            if (error) throw new Error(error);
            if (!res || res.status === false) throw new Error(`API error: ${res?.message || 'Unknown error'}`);

            const jsondata = res?.data || res;
            let mappedCompanies: Company[] = [];

            if (jsondata && Array.isArray(jsondata)) {
                mappedCompanies = jsondata.map(company => ({
                    id: company._id || company.id,
                    name: company.companyName || company.name,
                    email: company.email || company.companyEmail || "",
                    user: company.user || ''
                })).filter(company => company.id && company.name);
            } else if (jsondata && Array.isArray(jsondata.data)) {
                mappedCompanies = jsondata.data.map(company => ({
                    id: company._id || company.id,
                    name: company.companyName || company.name,
                    email: company.email || company.companyEmail || "",
                    user: company.user || ''
                })).filter(company => company.id && company.name);
            }

            setCompanies(mappedCompanies);
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
        const nextId = (formRows.length + 1).toString();
        setFormRows([...formRows, {
            id: nextId,
            item: "",
            category: "environmental",
            priority: "Medium",
            issue: "",
            relatedFinding: "",
            measures: "",
            resource: "",
            deliverable: "",
            timelineMonth: 0,
            dealCondition: "none",
            statusUpdate: "",
            investorStatusUpdate: "",
            reviewRemarks: "",
            lastReviewDate: "",
            implementationSupportNeeded: "",
            closureVerifiedBy: "",
            actualDate: "",
            status: "pending",
            targetDate: "",
            esgLever: "",
            capSource: "",
            progressPercentage: 0,
            assignedTo: "",
            remarks: "",
        }]);
    };

    const removeRow = (id: string) => {
        if (formRows.length <= 1) return;
        setFormRows(formRows.filter(row => row.id !== id));
    };

    const updateRow = (id: string, field: keyof CAPFormRow, value: any) => {
        setFormRows(formRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCompany) {
            toast({ title: "Company Required", description: "Please select a company.", variant: "destructive" });
            return;
        }

        const invalidRows = formRows.filter(row => !row.item || !row.measures);
        if (invalidRows.length > 0) {
            toast({ title: "Missing Required Fields", description: "Please fill in all required fields (Item, Measures) for all rows.", variant: "destructive" });
            return;
        }

        for (let i = 0; i < formRows.length; i++) {
            const row = formRows[i];
            if (row.targetDate && isNaN(new Date(row.targetDate).getTime())) {
                toast({ title: "Invalid Date", description: `Invalid target date in row ${i + 1}`, variant: "destructive" });
                return;
            }
            if (row.actualDate && isNaN(new Date(row.actualDate).getTime())) {
                toast({ title: "Invalid Date", description: `Invalid actual date in row ${i + 1}`, variant: "destructive" });
                return;
            }
        }

        const company = companies.find(c => c.id === selectedCompany);
        if (!company) {
            toast({ title: "Invalid Company", description: "Selected company is not valid.", variant: "destructive" });
            return;
        }

        const newItems: ESGCapItem[] = [];
        for (let i = 0; i < formRows.length; i++) {
            const row = formRows[i];
            const newItem = {
                reportId: selectedCompany,
                item: row.item,
                category: row.category,
                priority: row.priority,
                issue: row.issue || undefined,
                relatedFinding: row.relatedFinding || undefined,
                measures: row.measures,
                resource: row.resource || undefined,
                deliverable: row.deliverable || undefined,
                timelineMonth: row.timelineMonth || undefined,
                CS: row.dealCondition,
                statusUpdate: row.statusUpdate || undefined,
                investorStatusUpdate: row.investorStatusUpdate || undefined,
                reviewRemarks: row.reviewRemarks || undefined,
                lastReviewDate: parseToDateInput(row.lastReviewDate) || undefined,
                implementationSupportNeeded: row.implementationSupportNeeded || undefined,
                closureVerifiedBy: row.closureVerifiedBy || undefined,
                actualDate: parseToDateInput(row.actualDate) || undefined,
                status: row.status,
                targetDate: parseToDateInput(row.targetDate) || undefined,
                esgLever: row.esgLever || undefined,
                capSource: row.capSource || undefined,
                progressPercentage: row.progressPercentage || undefined,
                assignedTo: row.assignedTo || undefined,
                remarks: row.remarks || undefined,
                dealCondition: row.dealCondition,
                createdAt: new Date().toISOString(),
                id: `${Date.now()}-${i}`
            } as ESGCapItem;
            newItems.push(newItem);
        }

        try {
            // Get entityId from the selected company (same as in upload)
            const entityId = company?.user?.entityId;
            if (!entityId) throw new Error("Entity ID missing");
        
            // Fetch existing plan
            const [existingData] = await EsgddAPIs.getEsgCapPlan({ entityId: `${entityId}?financialYear=${financialYear}` });
            const existingPlan = existingData?.plan || [];
        
            // Merge existing + new items
            const mergedPlan = [...existingPlan, ...newItems];
            let plan = mergedPlan; // could be object or array
            if (!Array.isArray(plan)) {
                plan = [plan];
            }
        
            if (existingPlan.length > 0) {
                // Use change request API
                const [res, err] = await EsgddAPIs.esgddChangePlan({
                    changeRequest: { plan: plan },
                    comment: 'Add items via manual entry',
                    entityId,
                });
                if (!res) throw new Error(err || "Change request failed");
            } else {
                // Create new plan
                const [res, err] = await EsgddAPIs.saveEscap({
                    plan: plan,
                    email: company.email,
                    financialYear,
                    finalAcceptance: { founderAcceptance: false, investorAcceptance: false }
                });
                if (!res) throw new Error(err || "Failed to create plan");
            }
        
            // Update local UI
            onAddMultipleItems(newItems);
            toast({ title: "CAP Items Added", description: `Successfully added ${newItems.length} CAP items.` });
            
            // Reset form and close
            setFormRows([/* initial empty row */]);
            setSelectedCompany("");
            setOpen(false);
        } catch (error) {
            console.error("Error adding CAP items:", error);
            toast({ title: "Error", description: "Failed to add CAP items. Please try again.", variant: "destructive" });
        }
    };

    // const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (!selectedCompany) {
    //         toast({ title: "Company Required", description: "Please select a company before uploading CSV.", variant: "destructive" });
    //         return;
    //     }

    //     const file = event.target.files?.[0];
    //     if (!file) return;
    //     if (!file.name.endsWith('.csv')) {
    //         toast({ title: "Invalid File Format", description: "Please upload a CSV file.", variant: "destructive" });
    //         return;
    //     }

    //     const MAX_FILE_SIZE = 5 * 1024 * 1024;
    //     if (file.size > MAX_FILE_SIZE) {
    //         toast({ title: "File Too Large", description: "Please upload a file smaller than 5MB.", variant: "destructive" });
    //         return;
    //     }

    //     const company = companies.find(c => c.id === selectedCompany);
    //     if (!company) {
    //         toast({ title: "Invalid Company", description: "Selected company not found.", variant: "destructive" });
    //         return;
    //     }

    //     setUploading(true);

    //     try {
    //         const text = await file.text();
    //         const allLines = text.split('\n');
    //         // Filter out empty lines and lines that start with '#'
    //         const lines = allLines.filter(line => {
    //             const trimmed = line.trim();
    //             return trimmed && !trimmed.startsWith('#');
    //         });
    //         if (lines.length < 2) throw new Error("File must contain at least one data row (after removing comments)");

    //         // FIX 1: Better header parsing - remove BOM, trim, lowercase
    //         const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, '').toLowerCase());

    //         const getHeaderIndex = (possibleNames: string[]) => {
    //             for (const name of possibleNames) {
    //                 const exactIdx = rawHeaders.findIndex(h => h === name);
    //                 if (exactIdx !== -1) return exactIdx;
    //             }
    //             let bestIdx = -1;
    //             let bestLength = 0;
    //             for (let i = 0; i < rawHeaders.length; i++) {
    //                 const h = rawHeaders[i];
    //                 for (const name of possibleNames) {
    //                     if (h.includes(name) || name.includes(h)) {
    //                         const matchLen = Math.max(h.length, name.length);
    //                         if (matchLen > bestLength) {
    //                             bestLength = matchLen;
    //                             bestIdx = i;
    //                         }
    //                     }
    //                 }
    //             }
    //             return bestIdx;
    //         };

    //         const idxItem = getHeaderIndex(['item']);
    //         const idxMeasures = getHeaderIndex(['measures', 'Measures & Corrective Actions']);

    //         if (idxItem === -1 || idxMeasures === -1) {
    //             throw new Error(`Required columns 'Item' and 'Measures' not found. Found: ${rawHeaders.join(', ')}`);
    //         }

    //         const newItems: ESGCapItem[] = [];

    //         for (let i = 1; i < lines.length; i++) {
    //             // FIX 3: Handle quoted values properly
    //             const values: string[] = [];
    //             let current = '';
    //             let inQuotes = false;
    //             const line = lines[i];

    //             for (let j = 0; j < line.length; j++) {
    //                 const char = line[j];
    //                 if (char === '"') {
    //                     inQuotes = !inQuotes;
    //                 } else if (char === ',' && !inQuotes) {
    //                     values.push(current.trim());
    //                     current = '';
    //                 } else {
    //                     current += char;
    //                 }
    //             }
    //             values.push(current.trim());

    //             const itemValue = values[idxItem]?.replace(/^"|"$/g, '') || '';
    //             const measuresValue = values[idxMeasures]?.replace(/^"|"$/g, '') || '';

    //             if (!itemValue || !measuresValue) continue;

    //             // Helper to get value by common header names
    //             const getVal = (names: string[]) => {
    //                 const idx = getHeaderIndex(names);
    //                 return idx !== -1 ? values[idx]?.replace(/^"|"$/g, '') || '' : '';
    //             };

    //             const category = getVal(['category'])?.toLowerCase() as CAPCategory;
    //             const validCategories: CAPCategory[] = ['environmental', 'social', 'governance'];
    //             const validCategory = validCategories.includes(category) ? category : 'environmental';

    //             const priority = getVal(['priority']) as CAPPriority;
    //             const validPriorities: CAPPriority[] = ['High', 'Medium', 'Low'];
    //             const validPriority = validPriorities.includes(priority) ? priority : 'Medium';

    //             let statusRaw = getVal(['status'])?.toLowerCase() || '';
    //             // Replace spaces with underscores (e.g., "in progress" -> "in_progress")
    //             statusRaw = statusRaw.replace(/\s+/g, '_');
    //             const status = statusRaw as CAPStatus;
    //             const validStatuses: CAPStatus[] = ['pending', 'in_review', 'accepted', 'completed', 'overdue'];
    //             const validStatus = validStatuses.includes(status) ? status : 'pending';

    //             const dealCondition = getVal(['cp/cs', 'cpcs', 'dealcondition']) as CAPType;
    //             const validDealConditions: CAPType[] = ['CP', 'CS', 'none'];
    //             const validDealCondition = validDealConditions.includes(dealCondition) ? dealCondition : 'none';

    //             const progressPercentage = getVal(['progress percentage', 'progresspercentage', 'progress%']);
    //             const progressPercentNum = progressPercentage ? Math.min(100, Math.max(0, Number(progressPercentage))) : undefined;

    //             const newItem = {
    //                 reportId: selectedCompany,
    //                 item: itemValue,
    //                 measures: measuresValue,
    //                 category: validCategory,
    //                 priority: validPriority,
    //                 resource: getVal(['resource', 'resource & responsibility']) || undefined,
    //                 deliverable: getVal(['indicator', 'completion indicator']) || undefined,
    //                 targetDate: getVal(['target date', 'targetdate']) || undefined,
    //                 progressPercentage: progressPercentNum,
    //                 CS: validDealCondition,
    //                 actualDate: getVal(['actual date', 'actualdate']) || undefined,
    //                 status: validStatus,
    //                 assignedTo: getVal(['assigned to', 'assignedto']) || undefined,
    //                 dealCondition: validDealCondition,
    //                 createdAt: new Date().toISOString(),
    //                 issue: getVal(['issue']) || undefined,
    //                 relatedFinding: getVal(['related finding', 'relatedfinding']) || undefined,
    //                 esgLever: getVal(['esg lever', 'esglever']) || undefined,
    //                 capSource: getVal(['cap source', 'capsource']) || undefined,
    //                 timelineMonth: getVal(['timeline month', 'timelinemonth']) ? Math.max(0, Number(getVal(['timeline month', 'timelinemonth']))) : undefined,
    //                 statusUpdate: getVal(['company current status update', 'comapny current status update', 'company status update', 'statusupdate_company']) || undefined,
    //                 investorStatusUpdate: getVal(['investor current status update', 'investorstatus update', 'investor_status_update', 'statusupdate_investor']) || undefined,
    //                 reviewRemarks: getVal(['review remarks', 'reviewremarks']) || undefined,
    //                 lastReviewDate: getVal(['last review date', 'lastreviewdate']) || undefined,
    //                 implementationSupportNeeded: getVal(['implementation support', 'implementation support needed', 'implementationsupportneeded']) || undefined,
    //                 closureVerifiedBy: getVal(['closure verified', 'closure verified by', 'closureverifiedby']) || undefined,
    //                 remarks: getVal(['remarks']) || undefined,
    //                 id: `${Date.now()}-${i}`
    //             } as ESGCapItem;

    //             newItems.push(newItem);
    //         }

    //         if (newItems.length === 0) throw new Error("No valid items found in file");

    //         const entityId = company?.user?.entityId;
    //         if (!entityId) throw new Error("Entity ID missing");

    //         // Fetch existing plan
    //         const [existingData] = await EsgddAPIs.getEsgCapPlan({ entityId: `${entityId}?financialYear=${financialYear}` });
    //         const existingPlan = existingData?.plan || [];

    //         // Merge
    //         const mergedPlan = [...existingPlan, ...newItems];

    //         if (existingPlan.length > 0) {
    //             // Use change request API
    //             const [res, err] = await EsgddAPIs.esgddChangePlan({
    //                 changeRequest: { plan: mergedPlan },
    //                 comment: 'Add items via CSV',
    //                 entityId,
    //             });
    //             if (!res) throw new Error(err || "Change request failed");
    //         } else {
    //             // Create new plan
    //             const [res, err] = await EsgddAPIs.saveEscap({
    //                 plan: mergedPlan,
    //                 email: company.email,
    //                 financialYear,
    //                 finalAcceptance: { founderAcceptance: false, investorAcceptance: false }
    //             });
    //             if (!res) throw new Error(err || "Failed to create plan");
    //         }

    //         // Update UI
    //         onAddMultipleItems(newItems);
    //         toast({ title: "CAP Items Imported", description: `Imported ${newItems.length} items.` });
    //         setSelectedCompany("");
    //         setOpen(false);
    //     } catch (error) {
    //         console.error("Import error:", error);
    //         toast({ title: "Import Failed", description: error instanceof Error ? error.message : "Failed to process file", variant: "destructive" });
    //     } finally {
    //         setUploading(false);
    //         event.target.value = '';
    //     }
    // };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedCompany) {
          toast({ title: "Company Required", description: "Please select a company.", variant: "destructive" });
          return;
        }
        const file = event.target.files?.[0];
        if (!file || !file.name.endsWith('.csv')) {
          toast({ title: "Invalid File", description: "Please upload a CSV file.", variant: "destructive" });
          return;
        }
        const company = companies.find(c => c.id === selectedCompany);
        if (!company) return;
      
        setUploading(true);
      
        try {
          let text = await file.text();
      
          // Remove BOM
          if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
          }
      
          const lines = text.split(/\r?\n/);
      
          // Find header line (contains both 'Item*' and 'Measures*')
          let headerIndex = -1;
          for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed.includes('Item*') && trimmed.includes('Measures*')) {
              headerIndex = i;
              break;
            }
          }
      
          if (headerIndex === -1) {
            throw new Error("Could not find header row with 'Item*' and 'Measures*'");
          }
      
          // Take from header line onward
          const relevantLines = lines.slice(headerIndex);
          const cleanCSV = relevantLines.join('\n');
      
          Papa.parse(cleanCSV, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim().toLowerCase(),
            complete: async (results) => {
              try {
                const fields = results.meta.fields;
                console.log("Parsed headers:", fields);
      
                const rows = results.data as any[];
                const newItems: ESGCapItem[] = [];
      
                const getField = (row: any, possibleNames: string[]): string => {
                  for (const name of possibleNames) {
                    const val = row[name];
                    if (val !== undefined && val !== null && val !== "") {
                      return String(val).trim();
                    }
                  }
                  return "";
                };
      
                for (const row of rows) {
                  const item = getField(row, ["item*", "item"]);
                  const measures = getField(row, ["measures*", "measures"]);
      
                  if (!item || !measures) continue;
      
                  // Status mapping
                  let statusRaw = getField(row, ["status"]).toLowerCase().replace(/\s+/g, "_");
                  const statusMap: Record<string, CAPStatus> = {
                    not_started: "pending",
                    in_progress: "in_review",
                    completed: "completed",
                    overdue: "overdue",
                    accepted: "accepted",
                  };
                  const status = statusMap[statusRaw] || "pending";
      
                  // Parse DD-MM-YYYY dates
                  const parseDateDMY = (d: string) => {
                    if (!d) return "";
                    const parts = d.split("-");
                    if (parts.length === 3) {
                      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
                    }
                    return d;
                  };
      
                  const targetDateRaw = getField(row, ["target date", "targetdate"]);
                  const actualDateRaw = getField(row, ["actual date", "actualdate"]);
                  const lastReviewRaw = getField(row, ["last review date", "lastreviewdate"]);
      
                  const category = getField(row, ["category"]).toLowerCase();
                  const validCategory: CAPCategory = ["environmental", "social", "governance"].includes(category)
                    ? (category as CAPCategory)
                    : "environmental";
      
                  const priorityRaw = getField(row, ["priority"]);
                  const validPriority: CAPPriority = ["high", "medium", "low"].includes(priorityRaw.toLowerCase())
                    ? (priorityRaw as CAPPriority)
                    : "Medium";
      
                  const dealConditionRaw = getField(row, ["cp/cs", "cpcs", "dealcondition"]).toUpperCase();
                  const validDealCondition: CAPType = ["CP", "CS", "NONE"].includes(dealConditionRaw)
                    ? (dealConditionRaw as CAPType)
                    : "none";
      
                  const progressRaw = getField(row, ["progress percentage", "progresspercentage", "progress%"]);
                  const progressPercentage = progressRaw ? Math.min(100, Math.max(0, Number(progressRaw))) : undefined;
      
                  newItems.push({
                    reportId: selectedCompany,
                    id: `${Date.now()}-${Math.random()}`,
                    item,
                    measures,
                    category: validCategory,
                    priority: validPriority,
                    issue: getField(row, ["issue"]) || undefined,
                    relatedFinding: getField(row, ["related finding", "relatedfinding"]) || undefined,
                    resource: getField(row, ["resource & responsibility", "resource", "resource_responsibility"]) || undefined,
                    deliverable: getField(row, ["completion indicator", "indicator", "completionindicator"]) || undefined,
                    timelineMonth: (() => {
                      const val = getField(row, ["timeline month", "timelinemonth"]);
                      return val ? Math.max(0, Number(val)) : undefined;
                    })(),
                    targetDate: parseDateDMY(targetDateRaw),
                    actualDate: parseDateDMY(actualDateRaw),
                    status,
                    dealCondition: validDealCondition,
                    progressPercentage,
                    assignedTo: getField(row, ["assigned to", "assignedto"]) || undefined,
                    esgLever: getField(row, ["esg lever", "esglever"]) || undefined,
                    capSource: getField(row, ["cap source", "capsource"]) || undefined,
                    statusUpdate: getField(row, ["company current status update", "comapny current status update", "companycurrentstatusupdate"]) || undefined,
                    investorStatusUpdate: getField(row, ["investor current status update", "investorcurrentstatusupdate"]) || undefined,
                    reviewRemarks: getField(row, ["review remarks", "reviewremarks"]) || undefined,
                    lastReviewDate: parseDateDMY(lastReviewRaw),
                    implementationSupportNeeded: getField(row, ["implementation support needed", "implementationsupportneeded"]) || undefined,
                    closureVerifiedBy: getField(row, ["closure verified by", "closureverifiedby"]) || undefined,
                    remarks: getField(row, ["remarks"]) || undefined,
                    createdAt: new Date().toISOString(),
                  } as ESGCapItem);
                }
      
                if (newItems.length === 0) {
                  throw new Error("No valid items found. Make sure 'Item*' and 'Measures*' columns contain data.");
                }
      
                const entityId = (company as any).user?.entityId || (company as any).entityId;
                if (!entityId) throw new Error("Entity ID missing");
      
                const [existingData, fetchError] = await EsgddAPIs.getEsgCapPlan({ entityId, financialYear });
                if (fetchError) throw new Error(fetchError);
      
                const existingPlan = existingData?.plan || [];
                const mergedPlan = [...existingPlan, ...newItems];
                let plan = mergedPlan; // could be object or array
                if (!Array.isArray(plan)) {
                    plan = [plan];
                }
      
                if (existingPlan.length > 0) {
                  const [res, err] = await EsgddAPIs.esgddChangePlan({
                    changeRequest: { plan: plan },
                    comment: "Add items via CSV",
                    entityId,
                  });
                  if (!res) throw new Error(err || "Change request failed");
                } else {
                  const [res, err] = await EsgddAPIs.saveEscap({
                    plan: plan,
                    email: company.email,
                    financialYear,
                    finalAcceptance: { founderAcceptance: false, investorAcceptance: false },
                  });
                  if (!res) throw new Error(err || "Failed to create plan");
                }
      
                onAddMultipleItems(newItems);
                toast({ title: "Success", description: `Imported ${newItems.length} items.` });
                setOpen(false);
              } catch (err: any) {
                console.error("Import error:", err);
                toast({ title: "Import Failed", description: err.message, variant: "destructive" });
              } finally {
                setUploading(false);
                event.target.value = "";
              }
            },
            error: (err) => {
              console.error("CSV parse error:", err);
              toast({ title: "CSV Parse Error", description: err.message, variant: "destructive" });
              setUploading(false);
            },
          });
        } catch (err: any) {
          console.error("File read error:", err);
          toast({ title: "Error", description: err.message, variant: "destructive" });
          setUploading(false);
        }
      };

    const downloadTemplate = () => {
        const template = [
            // Optional comment row (starting with #) – many CSV readers skip it
            '# INSTRUCTIONS:',
            '# - "Status" must be one of: Pending/ In Review/ Accepted/ Completed/ Overdue',
            '# - "Category" must be one of: environmental/ social/ Governance',
            '# - "Priority" must be one of: High/ Medium/ Low',
            '# - Required columns: Item and Measures',
            '#',
            'Item*,Category,Priority,Issue,Related Finding,ESG Lever,CAP Source,Measures*,Resource & Responsibility,Completion Indicator,Timeline Month,Target Date,Progress Percentage,Actual Date,CP/CS,Status,Company Current Status Update,Investor Current Status Update,Review Remarks,Last Review Date,Implementation Support Needed,Closure Verified By,Assigned To,Remarks',
            '"Example: Improve emissions",environmental,High,"Carbon reporting gaps","Audit finding 2024-01","Policy development","Training material","Implement tracking system","ESG Manager","Monthly report",6,2024-12-31,75,2024-12-31,CP,"In Progress","System implementation 50% complete","System complete","Approved",2024-03-01,"IT support needed","John Doe","jane@example.com","Priority item"'
        ].join('\n');

        const blob = new Blob(["\uFEFF" + template], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'esg_cap_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({ title: "Template Downloaded", description: "CSV template with instructions downloaded successfully." });
    };

    const handleCancel = () => {
        setOpen(false);
        setSelectedCompany("");
        setFormRows([{
            id: "1", item: "", category: "environmental", priority: "Medium", issue: "", relatedFinding: "",
            measures: "", resource: "", deliverable: "", timelineMonth: 0, dealCondition: "none",
            statusUpdate: "",investorStatusUpdate: "", reviewRemarks: "", lastReviewDate: "", implementationSupportNeeded: "",
            closureVerifiedBy: "", actualDate: "", status: "pending", targetDate: "", esgLever: "", capSource: "",
            progressPercentage: 0, assignedTo: "", remarks: "",
        }]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add CAP Items</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add New CAP Items</DialogTitle></DialogHeader>

                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        <TabsTrigger value="upload">Upload Template</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Add Multiple CAP Items</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="company">Company *</Label>
                                        <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={loadingCompanies}>
                                            <SelectTrigger><SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Select company"} /></SelectTrigger>
                                            <SelectContent>
                                                {companies.map((company, index) => (
                                                    <SelectItem
                                                        key={`${company.id}-${index}-${company.email}`}
                                                        value={company.id.toString()}
                                                    >
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="button" variant="outline" onClick={addRow}>
                                            <Plus className="h-4 w-4 mr-2" />Add Another Item
                                        </Button>
                                    </div>

                                    {formRows.map((row, index) => (
                                        <div key={row.id} className="border rounded-lg p-4 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold">Item {index + 1}</h3>
                                                {formRows.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeRow(row.id)}
                                                        className="text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* 1. Item */}
                                            <div>
                                                <Label>Item *</Label>
                                                <Textarea
                                                    value={row.item}
                                                    onChange={(e) => updateRow(row.id, "item", e.target.value)}
                                                    className="min-h-[60px]"
                                                    placeholder="Enter CAP item description"
                                                />
                                            </div>

                                            {/* 2. Category & 3. Priority */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Category</Label>
                                                    <Select
                                                        value={row.category}
                                                        onValueChange={(value: CAPCategory) => updateRow(row.id, "category", value)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="environmental">Environmental</SelectItem>
                                                            <SelectItem value="social">Social</SelectItem>
                                                            <SelectItem value="governance">Governance</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Priority</Label>
                                                    <Select
                                                        value={row.priority}
                                                        onValueChange={(value: CAPPriority) => updateRow(row.id, "priority", value)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="High">High</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* 4. Issue & 5. Related Finding */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Issue</Label>
                                                    <Textarea
                                                        value={row.issue}
                                                        onChange={(e) => updateRow(row.id, "issue", e.target.value)}
                                                        placeholder="Describe the issue"
                                                        className="min-h-[60px]"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Related Finding</Label>
                                                    <Textarea
                                                        value={row.relatedFinding}
                                                        onChange={(e) => updateRow(row.id, "relatedFinding", e.target.value)}
                                                        placeholder="Related audit findings"
                                                        className="min-h-[60px]"
                                                    />
                                                </div>
                                            </div>

                                            {/* 6. ESG Lever */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>ESG Lever</Label>
                                                    <Input
                                                        value={row.esgLever}
                                                        onChange={(e) => updateRow(row.id, "esgLever", e.target.value)}
                                                        placeholder="e.g., Policy, Training, Technology"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>CAP Source</Label>
                                                    <Input
                                                        value={row.capSource}
                                                        onChange={(e) => updateRow(row.id, "capSource", e.target.value)}
                                                        placeholder="e.g., Policy, Training, Technology"
                                                    />
                                                </div>
                                            </div>

                                            {/* 7. Measures */}
                                            <div>
                                                <Label>Measures & Corrective Actions *</Label>
                                                <Textarea
                                                    value={row.measures}
                                                    onChange={(e) => updateRow(row.id, "measures", e.target.value)}
                                                    className="min-h-[80px]"
                                                    placeholder="Describe the corrective actions to be taken"
                                                />
                                            </div>

                                            {/* 8. Resource & 9. Deliverable */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Resource & Responsibility</Label>
                                                    <Input
                                                        value={row.resource}
                                                        onChange={(e) => updateRow(row.id, "resource", e.target.value)}
                                                        placeholder="Who is responsible?"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Completion Indicator</Label>
                                                    <Textarea
                                                        value={row.deliverable}
                                                        onChange={(e) => updateRow(row.id, "deliverable", e.target.value)}
                                                        placeholder="What will be delivered?"
                                                        className="min-h-[60px]"
                                                    />
                                                </div>
                                            </div>

                                            {/* 10. Timeline Month & 11. Target Date & 12. Actual Date */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <Label>Timeline Month</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={row.timelineMonth}
                                                        onChange={(e) => updateRow(row.id, "timelineMonth", Math.max(0, Number(e.target.value)))}
                                                        placeholder="e.g., 3"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Target Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={row.targetDate}
                                                        onChange={(e) => updateRow(row.id, "targetDate", e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Actual Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={row.actualDate}
                                                        onChange={(e) => updateRow(row.id, "actualDate", e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* 13. CP/CS & 14. Status */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>CP/CS/ESG FORWARD AREAS</Label>
                                                    <Select
                                                        value={row.dealCondition}
                                                        onValueChange={(value: CAPType) => updateRow(row.id, "dealCondition", value)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="CP">CP</SelectItem>
                                                            <SelectItem value="CS">CS</SelectItem>
                                                            <SelectItem value="ESG_FORWARD_AREAS">ESG Forward areas</SelectItem>
                                                            <SelectItem value="none">None</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Status</Label>
                                                    <Select
                                                        value={row.status}
                                                        onValueChange={(value: CAPStatus) => updateRow(row.id, "status", value)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="in_review">In Review</SelectItem>
                                                            <SelectItem value="accepted">Accepted</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                            <SelectItem value="overdue">Overdue</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* 15. Current Status Update */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                            <div>
                                                <Label>Current Status Update (Company)</Label>
                                                <Textarea
                                                    value={row.statusUpdate}
                                                    onChange={(e) => updateRow(row.id, "statusUpdate", e.target.value)}
                                                    disabled
                                                    placeholder="Latest update on this action item"
                                                    className="min-h-[60px]"
                                                />
                                            </div>

                                             {/* 15.1 Current Status Update Investor*/}
                                             <div>
                                                <Label>Current Status Update (Investor)</Label>
                                                <Textarea
                                                    value={row.investorStatusUpdate}
                                                    onChange={(e) => updateRow(row.id, "investorStatusUpdate", e.target.value)}
                                                    placeholder="Latest update on this action item"
                                                    className="min-h-[60px]"
                                                />
                                            </div>
                                            </div>

                                            {/* 16. Review Remarks & 17. Last Review Date */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Review Remarks</Label>
                                                    <Textarea
                                                        value={row.reviewRemarks}
                                                        onChange={(e) => updateRow(row.id, "reviewRemarks", e.target.value)}
                                                        placeholder="Reviewer comments"
                                                        className="min-h-[60px]"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Last Review Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={row.lastReviewDate}
                                                        onChange={(e) => updateRow(row.id, "lastReviewDate", e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* 18. Implementation Support & 19. Closure Verified */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Implementation Support Needed</Label>
                                                    <Textarea
                                                        value={row.implementationSupportNeeded}
                                                        onChange={(e) => updateRow(row.id, "implementationSupportNeeded", e.target.value)}
                                                        placeholder="What support is required?"
                                                        className="min-h-[60px]"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Closure Verified By</Label>
                                                    <Input
                                                        value={row.closureVerifiedBy}
                                                        onChange={(e) => updateRow(row.id, "closureVerifiedBy", e.target.value)}
                                                        placeholder="Name of verifier"
                                                    />
                                                </div>
                                            </div>

                                            {/* 20. Assigned To & 21. Remarks */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Assigned To</Label>
                                                    <Input
                                                        value={row.assignedTo}
                                                        onChange={(e) => updateRow(row.id, "assignedTo", e.target.value)}
                                                        placeholder="Person responsible"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                        <Button onClick={handleSubmit} disabled={loadingCompanies}>Add CAP Items</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Upload CAP Items from Template</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Company *</Label>
                                    <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={loadingCompanies}>
                                        <SelectTrigger><SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Select company"} /></SelectTrigger>
                                        <SelectContent>
                                            {companies.map(company => (
                                                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={downloadTemplate}>
                                        <Download className="h-4 w-4 mr-2" />Download Template
                                    </Button>
                                </div>

                                <div className="border-2 border-dashed rounded-lg p-6">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <label htmlFor="file-upload" className="cursor-pointer mt-4 block">
                                            <span className="text-sm">Drop CSV here or <span className="text-primary underline">browse</span></span>
                                            <input id="file-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileUpload} disabled={uploading || !selectedCompany} />
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">CSV files only (max 5MB)</p>
                                    </div>
                                </div>

                                {uploading && <div className="text-center text-sm">Processing file...</div>}

                                {/* <div className="text-xs space-y-1">
                                    <p><strong>Required columns:</strong> item, measures</p>
                                    <p><strong>All columns in order:</strong> item, category, priority, issue, relatedfinding, measures, resource, deliverable, timelinemonth, dealcondition, statusupdate, investorStatusUpdate, reviewremarks, lastreviewdate, implementationsupportneeded, closureverifiedby, actualdate, status, targetdate, esglever, capSource, progresspercentage, assignedto, remarks</p>
                                </div> */}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}