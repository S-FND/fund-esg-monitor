import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Download, Trash2, X } from "lucide-react";
import { ESGCapItem, CAPStatus, CAPCategory, CAPPriority, CAPType } from "./CAPTable";
import { toast } from "@/hooks/use-toast";
import { EsgddAPIs } from "@/network/esgdd";
import Papa from 'papaparse';

interface Company {
    id: string;
    name: string;
    email: string;
}

interface AddCAPDialogProps {
    onAddItem: (item: ESGCapItem) => void;
    onAddMultipleItems: (items: ESGCapItem[]) => void;
    existingPlan?: ESGCapItem[];
    entityId?: string;
    onRefresh?: () => void;
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
    // statusUpdate: string;
    addUpdate: string;
    // investorStatusUpdate: string;
    reviewRemarks: string;
    lastReviewDate: string;
    implementationSupportNeeded: string;
    closureVerifiedBy: string;
    actualDate: string;
    status: CAPStatus;
    investorStatus: string;
    targetDate: string;
    esgLever: string;
    capSource: string;
    progressPercentage: number;
    assignedTo: string;
    remarks: string;
}

export function AddCAPDialog({ onAddItem, onAddMultipleItems, existingPlan = [], entityId: propEntityId, onRefresh }: AddCAPDialogProps) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [financialYear, setFinancialYear] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [informFounder, setInformFounder] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
        // statusUpdate: "",
        addUpdate: "",
        // investorStatusUpdate: "",
        reviewRemarks: "",
        lastReviewDate: "",
        implementationSupportNeeded: "",
        closureVerifiedBy: "",
        actualDate: "",
        status: "pending",
        investorStatus: "",
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
            // statusUpdate: "",
            addUpdate: "",
            // investorStatusUpdate: "",
            reviewRemarks: "",
            lastReviewDate: "",
            implementationSupportNeeded: "",
            closureVerifiedBy: "",
            actualDate: "",
            status: "pending",
            investorStatus: "",
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

    const buildNewItems = (): ESGCapItem[] => {
        return formRows.map((row, i) => ({
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
            // statusUpdate: row.statusUpdate || undefined,
            addUpdate: row.addUpdate || undefined,
            // investorStatusUpdate: row.investorStatusUpdate || undefined,
            reviewRemarks: row.reviewRemarks || undefined,
            lastReviewDate: parseToDateInput(row.lastReviewDate) || undefined,
            implementationSupportNeeded: row.implementationSupportNeeded || undefined,
            closureVerifiedBy: row.closureVerifiedBy || undefined,
            actualDate: parseToDateInput(row.actualDate) || undefined,
            status: row.status,
            investorStatus: row.investorStatus,
            targetDate: parseToDateInput(row.targetDate) || undefined,
            esgLever: row.esgLever || undefined,
            capSource: row.capSource || undefined,
            progressPercentage: row.progressPercentage || undefined,
            assignedTo: row.assignedTo || undefined,
            remarks: row.remarks || undefined,
            dealCondition: row.dealCondition,
            createdAt: new Date().toISOString(),
            id: `${Date.now()}-${i}`
        } as ESGCapItem));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!selectedCompany) {
            toast({ title: "Company Required", description: "Please select a company.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const invalidRows = formRows.filter(row => !row.item || !row.measures);
        if (invalidRows.length > 0) {
            toast({ title: "Missing Required Fields", description: "Please fill in all required fields (Item, Measures) for all rows.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        for (let i = 0; i < formRows.length; i++) {
            const row = formRows[i];
            if (row.targetDate && isNaN(new Date(row.targetDate).getTime())) {
                toast({ title: "Invalid Date", description: `Invalid target date in row ${i + 1}`, variant: "destructive" });
                setIsSubmitting(false);
                return;
            }
            if (row.actualDate && isNaN(new Date(row.actualDate).getTime())) {
                toast({ title: "Invalid Date", description: `Invalid actual date in row ${i + 1}`, variant: "destructive" });
                setIsSubmitting(false);
                return;
            }
        }

        const company = companies.find(c => c.id === selectedCompany);
        if (!company) {
            toast({ title: "Invalid Company", description: "Selected company is not valid.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const newItems = buildNewItems();

        try {
            if (replaceExisting) {
                const finalData = {
                    plan: newItems,
                    email: company.email,
                    financialYear,
                    finalAcceptance: { founderAcceptance: false, investorAcceptance: false },
                    informFounder, // ✅ Pass to backend
                };
                const [result, error] = await EsgddAPIs.saveEscap(finalData);
                if (!result) throw new Error(error || "Replace failed");
                onAddMultipleItems(newItems);
                toast({ title: "CAP Items Replaced", description: `Replaced existing plan with ${newItems.length} items.` });
                if (onRefresh) await onRefresh();
            } else {
                const entityId = propEntityId || (company as any).user?.entityId;
                if (!entityId) throw new Error("Entity ID missing");

                if (!existingPlan || existingPlan.length === 0) {
                    const finalData = {
                        plan: newItems,
                        email: company.email,
                        financialYear,
                        finalAcceptance: { founderAcceptance: false, investorAcceptance: false },
                        informFounder, // ✅ Pass to backend
                    };
                    const [result, error] = await EsgddAPIs.saveEscap(finalData);
                    if (!result) throw new Error(error || "Creation failed");
                    onAddMultipleItems(newItems);
                    toast({
                        title: "CAP Items Created",
                        description: `${newItems.length} items added as a new plan.`,
                    });
                } else {
                    const mergedPlan = [...existingPlan, ...newItems];
                    const payload = {
                        changeRequest: { plan: mergedPlan },
                        comment: 'Add items via manual entry',
                        entityId,
                        informFounder, // ✅ Pass to backend
                    };
                    const response: any = await EsgddAPIs.esgddChangePlan(payload);

                    if (response?.[0]?.status !== 201) {
                        throw new Error("Change request failed");
                    }
                    onAddMultipleItems(newItems);
                    toast({ title: "CAP Items Added", description: `${newItems.length} items added. Request submitted.` });
                }
            }

            if (onRefresh) await onRefresh();

            setFormRows([{
                id: "1", item: "", category: "environmental", priority: "Medium", issue: "", relatedFinding: "",
                measures: "", resource: "", deliverable: "", timelineMonth: 0, dealCondition: "none",
                addUpdate: "", reviewRemarks: "", lastReviewDate: "", implementationSupportNeeded: "",
                closureVerifiedBy: "", actualDate: "", status: "pending", investorStatus: "", targetDate: "", esgLever: "", capSource: "",
                progressPercentage: 0, assignedTo: "", remarks: "",
            }]);
            setSelectedFile(null);
            setSelectedCompany("");
            setInformFounder(true); // ✅ Reset to default
            setOpen(false);
            setIsSubmitting(false);
        } catch (error) {
            console.error("Error adding CAP items:", error);
            toast({ title: "Error", description: "Operation failed. Please try again.", variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            setSelectedFile(file);
            e.target.value = '';
        } else if (file) {
            toast({ title: "Invalid File", description: "Please upload a CSV file.", variant: "destructive" });
            setSelectedFile(null);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedCompany) {
            toast({ title: "Company Required", description: "Please select a company.", variant: "destructive" });
            return;
        }
        if (!selectedFile) {
            toast({ title: "No File", description: "Please select a CSV file first.", variant: "destructive" });
            return;
        }
        const company = companies.find(c => c.id === selectedCompany);
        if (!company) return;
    
        setUploading(true);
    
        try {
            let text = await selectedFile.text();
            if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    
            const lines = text.split(/\r?\n/);
    
            // Find header row
            let headerIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                const trimmed = lines[i].trim().toLowerCase();
                if (trimmed.includes('cap item') && trimmed.includes('measures') && trimmed.includes('corrective')) {
                    headerIndex = i;
                    break;
                }
            }
    
            if (headerIndex === -1) {
                throw new Error("Could not find header row with 'CAP Item' and 'Measures & Corrective Actions'");
            }
    
            const cleanCSV = lines.slice(headerIndex).join('\n');
    
            Papa.parse(cleanCSV, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''),
                complete: async (results) => {
                    try {
                        const rows = results.data as any[];
                        const newItems: ESGCapItem[] = [];
    
                        const getField = (row: any, possibleNames: string[]): string => {
                            for (const rawName of possibleNames) {
                                const key = rawName.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                                const val = row[key];
                                if (val !== undefined && val !== null && val !== "") {
                                    return String(val).trim();
                                }
                            }
                            return "";
                        };
    
                        for (const row of rows) {
                            const item = getField(row, ["CAP Item", "capitem", "item"]);
                            const measures = getField(row, ["Measures & Corrective Actions", "measures&correctiveactions", "measures"]);
    
                            if (!item || !measures) {
                                console.log(`[CSV] Skipping row - missing item or measures`);
                                continue;
                            }
    
                            // Parse DD-MMM-YY dates
                            const parseDateDMY = (d: string): string => {
                                if (!d) return "";
                                const months: Record<string, string> = {
                                    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
                                    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                                };
                                const match = d.match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{2})$/);
                                if (match) {
                                    const day = match[1].padStart(2, '0');
                                    const month = months[match[2].toLowerCase()] || '01';
                                    const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
                                    return `${year}-${month}-${day}`;
                                }
                                const date = new Date(d);
                                if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
                                return d;
                            };
    
                            // ✅ Company Status → maps to `status` field
                            let companyStatusRaw = getField(row, ["Company Status", "companystatus"]).toLowerCase();
                            const statusMap: Record<string, string> = {
                                'upcoming': "upcoming",
                                'due in <1 month': "due in <1 month",
                                'overdue': "overdue",
                                'submitted': "submitted",
                                'request to re-submit': "request to re-submit",
                                'request to resubmit': "request to re-submit",
                            };

                            const status = statusMap[companyStatusRaw] || "upcoming";
    
                            // ✅ Investor Status → maps to `investorStatus` field (raw text)
                            const investorStatusRaw = getField(row, ["Investor Status", "investorstatus"]).toLowerCase().trim();
                            const investorStatusMap: Record<string, string> = {
                                '': "",
                                'blank': "",
                                '—': "",
                                'under review': "Under Review",
                                'under_review': "Under Review",
                                'reviewed with comments': "Reviewed with Comments",
                                'reviewed_with_comments': "Reviewed with Comments",
                                'closed': "Closed",
                                'deferred': "Deferred",
                            };
                            const investorStatus = investorStatusMap[investorStatusRaw] || "";
    
                            const targetDateRaw = getField(row, ["Target Date", "targetdate"]);
                            const actualDateRaw = getField(row, ["Completed On", "completedon", "actualdate"]);
                            const lastReviewRaw = getField(row, ["Last Review Date", "lastreviewdate"]);
    
                            // Deal condition from CP/CS/ESG Roadmap
                            const roadmapRaw = getField(row, ["CP/CS/ESG Roadmap", "cpcsesgroadmap", "cpcs", "dealcondition"]).toUpperCase().replace(/\s+/g, '_');
                            // const validDealCondition: CAPType = ["CP", "CS" , "ESG_Roadmap"].includes(roadmapRaw) ? roadmapRaw as CAPType : "none";
                            const validDealCondition: CAPType = 
                            roadmapRaw.toUpperCase() === "CP" ? "CP" :
                            roadmapRaw.toUpperCase() === "CS" ? "CS" :
                            roadmapRaw.toUpperCase() === "ESG ROADMAP" || roadmapRaw.toUpperCase() === "ESG_ROADMAP" ? "ESG_Roadmap" :
                            "none";
    
                            // Category mapping
                            const categoryRaw = getField(row, ["Category", "category"]).toLowerCase();
                            const categoryMap: Record<string, CAPCategory> = {
                                'environment': 'environmental',
                                'environmental': 'environmental',
                                'social': 'social',
                                'governance': 'governance',
                                'environmentalmonitoring': 'environmental',
                                'packagingplasticscircularity': 'environmental',
                                'esgmanagementsystems': 'governance',
                                'governanceethics': 'governance',
                                'occupationalhealthsafetyohs': 'social',
                                'hrcomplianceworkplacepractices': 'social',
                            };
                            const category = categoryMap[categoryRaw] || "environmental";
    
                            // Priority
                            const priorityRaw = getField(row, ["Priority", "priority"]).toLowerCase();
                            const validPriority: CAPPriority = ["high", "medium", "low"].includes(priorityRaw)
                                ? (priorityRaw.charAt(0).toUpperCase() + priorityRaw.slice(1) as CAPPriority)
                                : "High";
    
                            // Timeline
                            const timelineRaw = getField(row, ["Timeline Month", "timelinemonth"]);
                            const timelineMonth = timelineRaw ? Math.max(0, Number(timelineRaw)) : undefined;
    
                            newItems.push({
                                reportId: selectedCompany,
                                id: `${Date.now()}-${Math.random()}`,
                                item,
                                measures,
                                category,
                                priority: validPriority,
                                issue: getField(row, ["Issue and Related Finding", "issueandrelatedfinding", "issue"]) || undefined,
                                relatedFinding: undefined,
                                // resource: getField(row, ["Assigned To", "assignedto"]) || undefined,
                                deliverable: getField(row, ["Completion Indicator", "completionindicator"]) || undefined,
                                timelineMonth,
                                targetDate: parseDateDMY(targetDateRaw),
                                actualDate: parseDateDMY(actualDateRaw),
                                status,
                                investorStatus: investorStatusRaw,
                                dealCondition: validDealCondition,
                                progressPercentage: undefined,
                                assignedTo: getField(row, ["Assigned To", "assignedto"]) || undefined,
                                esgLever: getField(row, ["ESG Lever", "esglever"]) || undefined,
                                capSource: getField(row, ["CAP Source", "capsource"]) || undefined,
                                addUpdate: getField(row, ["Add Update", "addupdate", "statusupdate"]) || undefined,
                                reviewRemarks: getField(row, ["Review Comments", "reviewcomments", "reviewremarks"]) || undefined,
                                lastReviewDate: parseDateDMY(lastReviewRaw),
                                implementationSupportNeeded: getField(row, ["Implementation Support Needed", "implementationsupportneeded"]) || undefined,
                                closureVerifiedBy: getField(row, ["Closure Verified By", "closureverifiedby"]) || undefined,
                                remarks: undefined,
                                createdAt: new Date().toISOString(),
                            } as ESGCapItem);
                        }
    
                        if (newItems.length === 0) {
                            throw new Error("No valid items found. Check console for debug info.");
                        }
    
                        // Submit logic
                        if (replaceExisting) {
                            const finalData = {
                                plan: newItems,
                                email: company.email,
                                financialYear,
                                finalAcceptance: { founderAcceptance: false, investorAcceptance: false },
                                informFounder,
                            };
                            const [result, error] = await EsgddAPIs.saveEscap(finalData);
                            if (!result) throw new Error(error || "Replace failed");
                            onAddMultipleItems(newItems);
                            toast({ title: "CAP Items Replaced", description: `Replaced with ${newItems.length} items.` });
                            if (onRefresh) await onRefresh();
                        } else {
                            const entityId = propEntityId || (company as any).user?.entityId;
                            if (!entityId) throw new Error("Entity ID missing");
    
                            if (!existingPlan || existingPlan.length === 0) {
                                const finalData = {
                                    plan: newItems,
                                    email: company.email,
                                    financialYear,
                                    finalAcceptance: { founderAcceptance: false, investorAcceptance: false },
                                    informFounder,
                                };
                                const [result, error] = await EsgddAPIs.saveEscap(finalData);
                                if (!result) throw new Error(error || "Creation failed");
                                onAddMultipleItems(newItems);
                                toast({ title: "CAP Items Created", description: `${newItems.length} items added as a new plan.` });
                            } else {
                                const mergedPlan = [...existingPlan, ...newItems];
                                const payload = {
                                    changeRequest: { plan: mergedPlan },
                                    comment: 'Add items via CSV',
                                    entityId,
                                    informFounder,
                                };
                                const response: any = await EsgddAPIs.esgddChangePlan(payload);
                                if (response?.[0]?.status !== 201) throw new Error("Change request failed");
                                onAddMultipleItems(newItems);
                                toast({ title: "CAP Items Added", description: `${newItems.length} items added via change request.` });
                            }
                        }
    
                        if (onRefresh) await onRefresh();
                        setSelectedFile(null);
                        setSelectedCompany("");
                        setInformFounder(true);
                        setOpen(false);
                    } catch (err: any) {
                        console.error("Import error:", err);
                        toast({ title: "Import Failed", description: err.message, variant: "destructive" });
                    } finally {
                        setUploading(false);
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
            '# INSTRUCTIONS:',
            '# - "Priority" must be: High/Medium/Low',
            '# - "Category" must be: environmental/social/governance',
            '# - "Company Status" and "Investor Status" can be: Pending/In Review/Accepted/Completed/Overdue',
            '# - Required columns: CAP Item, Measures & Corrective Actions',
            '#',
            'CAP Item,Priority,Target Date,Company Status,Investor Status,Completed On,CP/CS/ESG Roadmap,Category,"Issue and Related Finding","Measures & Corrective Actions",Completion Indicator,"Timeline Month","Add Update","Review Comments","Last Review Date","Closure Verified By","Assigned To","Implementation Support Needed","ESG Lever","CAP Source"',
            '"Example: Improve emissions",High,16-May-24,"In Progress","In Progress",16-May-24,CP,environmental,"Carbon reporting gaps","Implement tracking system","ESG Manager",6,"Approved","Review comments",01-Nov-23,"John Doe","jane@example.com","IT support needed","Policy development","Training material"'
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
        setSelectedFile(null);
        setInformFounder(true); // ✅ Reset to default
        setFormRows([{
            id: "1", item: "", category: "environmental", priority: "Medium", issue: "", relatedFinding: "",
            measures: "", resource: "", deliverable: "", timelineMonth: 0, dealCondition: "none",
            addUpdate: "", reviewRemarks: "", lastReviewDate: "", implementationSupportNeeded: "",
            closureVerifiedBy: "", actualDate: "", status: "pending", investorStatus: "", targetDate: "", esgLever: "", capSource: "",
            progressPercentage: 0, assignedTo: "", remarks: "",
        }]);
    };

    // ✅ Reusable checkbox component
    const InformFounderCheckbox = () => (
        <div className="flex items-center space-x-2">
            <input
                type="checkbox"
                id="informFounder"
                checked={informFounder}
                onChange={(e) => setInformFounder(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label
                htmlFor="informFounder"
                className="text-sm font-normal cursor-pointer"
            >
                Inform Founder (send email notification)
            </Label>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add CAP Items</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add New CAP Items</DialogTitle></DialogHeader>

                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="w-full flex gap-4 bg-transparent p-0 mb-6">
                        <TabsTrigger
                            value="manual"
                            className="flex-1 rounded-md border data-[state=active]:bg-primary data-[state=active]:text-white"
                        >
                            Manual Entry
                        </TabsTrigger>

                        <TabsTrigger
                            value="upload"
                            className="flex-1 rounded-md border data-[state=active]:bg-primary data-[state=active]:text-white"
                        >
                            Upload Template
                        </TabsTrigger>
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

                                            <div>
                                                <Label>Item *</Label>
                                                <Textarea
                                                    value={row.item}
                                                    onChange={(e) => updateRow(row.id, "item", e.target.value)}
                                                    className="min-h-[60px]"
                                                    placeholder="Enter CAP item description"
                                                />
                                            </div>

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

                                            <div>
                                                <Label>Measures & Corrective Actions *</Label>
                                                <Textarea
                                                    value={row.measures}
                                                    onChange={(e) => updateRow(row.id, "measures", e.target.value)}
                                                    className="min-h-[80px]"
                                                    placeholder="Describe the corrective actions to be taken"
                                                />
                                            </div>

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

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>CP/CS/ESG Roadmap</Label>
                                                    <Select
                                                        value={row.dealCondition}
                                                        onValueChange={(value: CAPType) => updateRow(row.id, "dealCondition", value)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="CP">CP</SelectItem>
                                                            <SelectItem value="CS">CS</SelectItem>
                                                            <SelectItem value="ESG_Roadmap">ESG Roadmap</SelectItem>
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

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Current Status Update (Company)</Label>
                                                    <Textarea
                                                        value={row.addUpdate}
                                                        onChange={(e) => updateRow(row.id, "addUpdate", e.target.value)}
                                                        disabled
                                                        placeholder="Latest update on this action item"
                                                        className="min-h-[60px]"
                                                    />
                                                </div>
                                                {/* <div>
                                                    <Label>Current Status Update (Investor)</Label>
                                                    <Textarea
                                                        value={row.investorStatusUpdate}
                                                        onChange={(e) => updateRow(row.id, "investorStatusUpdate", e.target.value)}
                                                        placeholder="Latest update on this action item"
                                                        className="min-h-[60px]"
                                                    />
                                                </div> */}
                                            </div>

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
                                    <div className="space-y-4 pt-4 border-t mt-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center">
                                            {/* ✅ Inform Founder checkbox - Manual Entry */}
                                            <InformFounderCheckbox />
                                            
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="replaceExisting"
                                                    checked={replaceExisting}
                                                    onChange={(e) => setReplaceExisting(e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <Label
                                                    htmlFor="replaceExisting"
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    Replace existing items
                                                </Label>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={loadingCompanies || isSubmitting || !selectedCompany || formRows.some(row => !row.item?.trim() || !row.measures?.trim())}
                                            >
                                                {isSubmitting ? "Adding..." : "Add CAP Items"}
                                            </Button>
                                        </div>
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
                                            <input id="file-upload" type="file" accept=".csv" className="sr-only" onChange={onFileSelect} disabled={uploading || !selectedCompany} />
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">CSV files only (max 5MB)</p>
                                    </div>
                                </div>

                                {selectedFile && (
                                    <div className="flex items-center justify-between text-sm text-green-600 mt-2 bg-green-50 p-2 rounded-md">
                                        <span className="truncate">Selected file: {selectedFile.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                                                if (fileInput) fileInput.value = "";
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove file</span>
                                        </Button>
                                    </div>
                                )}

                                {uploading && <div className="text-center text-sm">Processing file...</div>}

                                <div className="space-y-4 pt-4 border-t mt-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center">
                                        {/* ✅ Inform Founder checkbox - Upload */}
                                        <InformFounderCheckbox />
                                        
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="replaceExistingUpload"
                                                checked={replaceExisting}
                                                onChange={(e) => setReplaceExisting(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <Label htmlFor="replaceExistingUpload" className="text-sm font-normal cursor-pointer">
                                                Replace existing items
                                            </Label>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                        <Button onClick={handleFileUpload} disabled={uploading || !selectedCompany || !selectedFile}>
                                            {uploading ? "Uploading..." : "Upload"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}