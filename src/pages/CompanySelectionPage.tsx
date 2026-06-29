import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyCardFilter } from "@/components/esg-cap/CompanyCardFilter";
import { 
    Leaf, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, 
    Clock, FileText, RefreshCw, Building2 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Helper: Normalize status
const normalize = (s?: string) => (s ?? '').trim().toLowerCase();

// Helper: Check if target date is in current month
const isInCurrentMonth = (targetDate?: string): boolean => {
    if (!targetDate) return false;
    const today = new Date();
    const target = new Date(targetDate);
    return target.getMonth() === today.getMonth() &&
        target.getFullYear() === today.getFullYear();
};

// Get effective status (matches ESGCapScoring logic)
const getEffectiveCompanyStatus = (item: any): string => {
    const companyStatus = normalize(item.companyStatus ?? item.status);
    const investorStatus = normalize(item.investorStatus);

    // 1. INVESTOR STATUS TAKES PRIORITY
    if (investorStatus === 'closed') return 'closed';
    if (investorStatus === 're-submit-requested' || investorStatus === 're-submit requested') {
        return 're-submit-requested';
    }
    if (investorStatus === 'partly-submitted' || investorStatus === 'partly submitted') {
        return 'partly-submitted';
    }
    if (investorStatus === 'submitted-pending-review' || investorStatus === 'submitted pending review') {
        return 'submitted-pending-review';
    }
    if (investorStatus === 'under-review' || investorStatus === 'under review') {
        if (companyStatus === 'submitted' || companyStatus === 'submitted-pending-review') {
            return 'submitted-pending-review';
        }
    }

    // 2. Check company status
    if (companyStatus === 'closed') return 'closed';
    if (companyStatus === 'partly-submitted' || companyStatus === 'partly submitted') {
        return 'partly-submitted';
    }
    if (companyStatus === 'submitted' || companyStatus === 'submitted') {
        return 'submitted';
    }
    if (companyStatus === 'submitted-pending-review' || companyStatus === 'submitted pending review') {
        return 'submitted-pending-review';
    }
    if (companyStatus === 're-submit-required' || companyStatus === 're-submit required') {
        return 're-submit-requested';
    }
    if (companyStatus === 'overdue') return 'overdue';

    // 3. Check target date
    if (!item.targetDate) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(item.targetDate);
    target.setHours(0, 0, 0, 0);

    if (target.getMonth() === today.getMonth() &&
        target.getFullYear() === today.getFullYear()) {
        return 'due-in-this-month';
    }
    if (target < today) return 'overdue';
    return 'upcoming';
};

// Get investor status
const getInvestorStatus = (item: any): string => {
    const investorStatus = normalize(item.investorStatus);
    const companyStatus = normalize(item.companyStatus ?? item.status);

    if (investorStatus === 'closed') return 'closed';
    if (investorStatus === 're-submit-requested' || investorStatus === 're-submit requested') {
        return 're-submit-requested';
    }
    if (investorStatus === 'partly-submitted' || investorStatus === 'partly submitted') {
        return 'partly-submitted';
    }
    if (investorStatus === 'submitted-pending-review' || investorStatus === 'submitted pending review') {
        return 'submitted-pending-review';
    }

    if (companyStatus === 'closed') return 'closed';
    if (companyStatus === 'partly-submitted' || companyStatus === 'partly submitted') {
        return 'partly-submitted';
    }
    if (companyStatus === 'submitted-pending-review' || companyStatus === 'submitted pending review') {
        return 'submitted-pending-review';
    }
    if (companyStatus === 're-submit-required' || companyStatus === 're-submit required') {
        return 're-submit-requested';
    }

    if (companyStatus === 'overdue' &&
        (normalize(item.priority) === 'high' || normalize(item.priority) === 'high priority')) {
        return 'high-priority-overdue';
    }

    return getEffectiveCompanyStatus(item);
};

// Check if item is closed
const isClosed = (item: any): boolean => {
    return getInvestorStatus(item) === 'closed';
};

interface Company {
    _id: string;
    email: string;
    companyName: string;
    sector?: string;
    opportunityStatus?: string;
    fundCompany?: Array<{ fundName: string; stageOfInvestment?: string }>;
    assignedTeamMembers?: Array<{ teamMemberName: string; teamMemberEmail: string; designation?: string }>;
    companyDetails?: {
        industry?: string;
        fund?: string;
        revenue_stage?: string;
        q_category?: string;
        fireside_category?: string;
    };
    esgStatus: 'open' | 'closed' | 'pending' | 'not_started';
    user?: {
        entityId: string;
        name: string;
    };
    esgSummary?: {
        totalItems: number;
        completedItems: number;
        overdueItems: number;
        pendingItems: number;
        hasPlan: boolean;
        status: string;
    };
    _planItems?: any[];
}

interface DashboardResponse {
    status: boolean;
    summary: {
        total: number;
        closed: number;
        pending: number;
        open: number;
        notStarted: number;
        complianceScore?: number;
        dueThisMonth?: number;
        overdue?: number;
        partlySubmitted?: number;
        resubmitRequested?: number;
        submittedPendingReview?: number;
        closedCount?: number;
        totalItems?: number;
        completedItems?: number;
        progressPercentage?: number;
    };
    data: Company[];
}

type ScoringFilterType = 'all' | 'due-in-this-month' | 'overdue' | 'partly-submitted' | 
                         're-submit-requested' | 'submitted-pending-review' | 'closed';

export default function CompanySelectionPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [summary, setSummary] = useState<DashboardResponse['summary'] | null>(null);
    const [scoringFilter, setScoringFilter] = useState<ScoringFilterType>('all');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    
    const industryOptions = [
        "All Industries",
        "ClimateTech",
        "FinTech",
        "Quick Commerce",
        "Ecomm",
        "Technology / Software Development",
        "Financial Services / Digital Payments",
        "Logistics / Supply Chain Management",
        "Environmental Technology / Waste Management",
        "Others",
    ];
    
    const fundOptions = ["All Funds", "Fund I", "Fund II", "Fund III", "Fund IV"];
    
    const revenueOptions = [
        "All Revenue",
        "₹0–50 Cr",
        "₹50–100 Cr",
        "₹100–500 Cr",
        "₹500+ Cr",
    ];
    
    const qCatOptions = ["All Q Cat", "Q", "Q1", "Q2", "Q3", "Q4", "Early"];
    
    const firesideOptions = [
        "All POCs",
        "Aashish Mirchandani",
        "Amit Kulkarni",
        "Ankita Balotia",
        "Ankur Khaitan",
        "Nandika Pradeep",
        "Prayag Mohanty",
        "Shuchi Pandya",
        "Swati Kulkarni",
        "TBD",
        "Varun Varma",
    ];
    
    const [filters, setFilters] = useState({
        industry: "All Industries",
        fund: "All Funds",
        revenue: "All Revenue",
        qCat: "All Q Cat",
        firesidePoc: "All POCs",
    });
    
    const navigate = useNavigate();

    const revenueMap: Record<string, string> = {
        "₹0–50 Cr": "0-50",
        "₹50–100 Cr": "50-100",
        "₹100–500 Cr": "100-500",
        "₹500+ Cr": "500+",
    };

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/companyInfo/dashboard/esgcap`, {
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const json: DashboardResponse = await res.json();
                console.log('Dashboard response:', json);
                
                if (json.status) {
                    setCompanies(json.data || []);
                    setSummary(json.summary);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard:", error);
                setCompanies([]);
                setSummary(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    // Calculate filter counts for each scoring category
    const filterCounts = useMemo(() => {
        const counts = {
            'due-in-this-month': 0,
            'overdue': 0,
            'partly-submitted': 0,
            're-submit-requested': 0,
            'submitted-pending-review': 0,
            'closed': 0,
        };

        companies.forEach((company) => {
            if (!company._planItems || company._planItems.length === 0) return;
            
            const planItems = company._planItems;
            const filteredItems = planItems.filter(
                (item: any) => item.dealCondition === 'CP' || item.dealCondition === 'CS'
            );
            
            if (filteredItems.length === 0) return;

            // Check each filter category
            const hasDueThisMonth = filteredItems.some((item: any) => {
                const effectiveStatus = getEffectiveCompanyStatus(item);
                return effectiveStatus === 'due-in-this-month' && !isClosed(item);
            });
            if (hasDueThisMonth) counts['due-in-this-month']++;

            const hasOverdue = filteredItems.some((item: any) => {
                const effectiveStatus = getEffectiveCompanyStatus(item);
                return effectiveStatus === 'overdue' && !isClosed(item);
            });
            if (hasOverdue) counts['overdue']++;

            const hasPartlySubmitted = filteredItems.some((item: any) => 
                getInvestorStatus(item) === 'partly-submitted'
            );
            if (hasPartlySubmitted) counts['partly-submitted']++;

            const hasResubmit = filteredItems.some((item: any) => 
                getInvestorStatus(item) === 're-submit-requested'
            );
            if (hasResubmit) counts['re-submit-requested']++;

            const hasPendingReview = filteredItems.some((item: any) => {
                const companyStatus = normalize(item.companyStatus ?? item.status);
                const investorStatus = normalize(item.investorStatus);
                return (companyStatus === 'submitted' || companyStatus === 'submitted-pending-review') &&
                    (investorStatus === 'under-review' || investorStatus === 'under review');
            });
            if (hasPendingReview) counts['submitted-pending-review']++;

            const allClosed = filteredItems.every((item: any) => isClosed(item));
            if (allClosed) counts['closed']++;
        });

        return counts;
    }, [companies]);

    // Apply all filters
    const filteredCompanies = useMemo(() => {
        return companies.filter((company) => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                company.companyName?.toLowerCase().includes(searchLower) ||
                company.email?.toLowerCase().includes(searchLower);

            const matchesIndustry = filters.industry === "All Industries" || 
                company.companyDetails?.industry === filters.industry ||
                company.sector === filters.industry;

            const matchesFund = filters.fund === "All Funds" || 
                company.companyDetails?.fund === filters.fund ||
                company.fundCompany?.some((f: any) => f.fundName === filters.fund);

            const matchesRevenue = filters.revenue === "All Revenue" || 
                company.companyDetails?.revenue_stage === revenueMap[filters.revenue as keyof typeof revenueMap];

            const matchesQCat = filters.qCat === "All Q Cat" || 
                company.companyDetails?.q_category === filters.qCat;

            const matchesFireside =
                filters.firesidePoc === "All POCs" ||
                company.firesidePoc?.toLowerCase().trim() === filters.firesidePoc.toLowerCase().trim() ||
                company.companyDetails?.fireside_category?.toLowerCase().trim() === filters.firesidePoc.toLowerCase().trim() ||
                company.assignedTeamMembers?.some((tm: any) =>
                    tm.teamMemberName?.toLowerCase().trim() === filters.firesidePoc.toLowerCase().trim()
                );

            // Apply scoring filter
            let matchesScoring = true;
            if (scoringFilter !== 'all' && company._planItems && company._planItems.length > 0) {
                const planItems = company._planItems;
                const filteredItems = planItems.filter(
                    (item: any) => item.dealCondition === 'CP' || item.dealCondition === 'CS'
                );
                
                if (filteredItems.length === 0) {
                    matchesScoring = false;
                } else {
                    switch (scoringFilter) {
                        case 'closed':
                            const allClosed = filteredItems.every((item: any) => isClosed(item));
                            matchesScoring = allClosed;
                            break;
                            
                        case 'due-in-this-month':
                            const hasDueThisMonth = filteredItems.some((item: any) => {
                                const effectiveStatus = getEffectiveCompanyStatus(item);
                                return effectiveStatus === 'due-in-this-month' && !isClosed(item);
                            });
                            matchesScoring = hasDueThisMonth;
                            break;
                            
                        case 'overdue':
                            const hasOverdue = filteredItems.some((item: any) => {
                                const effectiveStatus = getEffectiveCompanyStatus(item);
                                return effectiveStatus === 'overdue' && !isClosed(item);
                            });
                            matchesScoring = hasOverdue;
                            break;
                            
                        case 'partly-submitted':
                            const hasPartlySubmitted = filteredItems.some((item: any) => 
                                getInvestorStatus(item) === 'partly-submitted'
                            );
                            matchesScoring = hasPartlySubmitted;
                            break;
                            
                        case 're-submit-requested':
                            const hasResubmit = filteredItems.some((item: any) => 
                                getInvestorStatus(item) === 're-submit-requested'
                            );
                            matchesScoring = hasResubmit;
                            break;
                            
                        case 'submitted-pending-review':
                            const hasPendingReview = filteredItems.some((item: any) => {
                                const companyStatus = normalize(item.companyStatus ?? item.status);
                                const investorStatus = normalize(item.investorStatus);
                                return (companyStatus === 'submitted' || companyStatus === 'submitted-pending-review') &&
                                    (investorStatus === 'under-review' || investorStatus === 'under review');
                            });
                            matchesScoring = hasPendingReview;
                            break;
                            
                        default:
                            matchesScoring = true;
                    }
                }
            } else if (scoringFilter !== 'all' && (!company._planItems || company._planItems.length === 0)) {
                matchesScoring = false;
            }

            return (
                matchesSearch &&
                matchesIndustry &&
                matchesFund &&
                matchesRevenue &&
                matchesQCat &&
                matchesFireside &&
                matchesScoring
            );
        });
    }, [companies, searchTerm, filters, scoringFilter]);

    // Get current page companies
    const getCurrentPageCompanies = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredCompanies.slice(startIndex, endIndex);
    };

    const totalItems = filteredCompanies.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const currentPageCompanies = getCurrentPageCompanies();

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleItemsPerPageChange = (value: string) => {
        const newItemsPerPage = Number(value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const handleCompanySelect = (companyEmail: string) => {
        navigate(`/esg-dd/cap/${encodeURIComponent(companyEmail)}`);
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, scoringFilter]);

    // Click handler for scoring cards
    const handleScoringClick = (filter: ScoringFilterType) => {
        setScoringFilter(scoringFilter === filter ? 'all' : filter);
        setCurrentPage(1);
    };

    // Get card style based on active filter
    const getCardClass = (filterKey: string, defaultBg: string, isStatic: boolean = false, count: number = 0) => {
        const baseClass = "text-center p-2 rounded-lg transition-all";
        if (isStatic) {
            return `${baseClass} ${defaultBg} cursor-default`;
        }
        const clickableClass = "cursor-pointer hover:shadow-md hover:scale-105";
        const disabledClass = count === 0 ? "opacity-50 cursor-not-allowed hover:shadow-none hover:scale-100" : "";
        if (scoringFilter === filterKey && count > 0) {
            return `${baseClass} ${clickableClass} ring-2 ring-primary bg-primary/10 shadow-lg`;
        }
        return `${baseClass} ${clickableClass} ${disabledClass} ${defaultBg}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
            <div className="container mx-auto py-8 px-4">
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Input
                        placeholder="Search company by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-96"
                    />
                    <Select
                        value={filters.industry}
                        onValueChange={(val) => setFilters((prev) => ({ ...prev, industry: val }))}
                    >
                        <SelectTrigger className="w-[128px]">
                            <SelectValue placeholder="All Industries" />
                        </SelectTrigger>
                        <SelectContent>
                            {industryOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.fund}
                        onValueChange={(val) => setFilters((prev) => ({ ...prev, fund: val }))}
                    >
                        <SelectTrigger className="w-[128px]">
                            <SelectValue placeholder="All Funds" />
                        </SelectTrigger>
                        <SelectContent>
                            {fundOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.revenue}
                        onValueChange={(val) => setFilters((prev) => ({ ...prev, revenue: val }))}
                    >
                        <SelectTrigger className="w-[128px]">
                            <SelectValue placeholder="All Revenue" />
                        </SelectTrigger>
                        <SelectContent>
                            {revenueOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.qCat}
                        onValueChange={(val) => setFilters((prev) => ({ ...prev, qCat: val }))}
                    >
                        <SelectTrigger className="w-[128px]">
                            <SelectValue placeholder="All Q Cat" />
                        </SelectTrigger>
                        <SelectContent>
                            {qCatOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.firesidePoc}
                        onValueChange={(val) => setFilters((prev) => ({ ...prev, firesidePoc: val }))}
                    >
                        <SelectTrigger className="w-[128px]">
                            <SelectValue placeholder="All POCs" />
                        </SelectTrigger>
                        <SelectContent>
                            {firesideOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* ESG Scoring Cards */}
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        <h2 className="text-sm font-semibold text-gray-700">ESG Dashboard</h2>
                        <span className="text-xs text-gray-400 ml-2">
                            Click on any card to filter companies
                        </span>
                        {scoringFilter !== 'all' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleScoringClick('all')}
                                className="text-xs text-emerald-600 hover:text-emerald-700"
                            >
                                Clear Filter ✕
                            </Button>
                        )}
                    </div>

                    <Card>
                        <CardContent className="py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
                                {/* 1. Compliance Score - STATIC */}
                                <div className="text-center p-2 rounded-lg bg-green-50 cursor-default">
                                    <div className="text-lg font-bold text-green-600">
                                        {summary?.complianceScore ?? 0}%
                                    </div>
                                    <div className="text-[10px] text-muted-foreground leading-tight">Compliance Score</div>
                                </div>

                                {/* 2. Due This Month - Shows company count */}
                                <div
                                    className={getCardClass('due-in-this-month', "bg-orange-50", false, filterCounts['due-in-this-month'])}
                                    onClick={() => filterCounts['due-in-this-month'] > 0 && handleScoringClick('due-in-this-month')}
                                >
                                    <div className="text-lg font-bold text-orange-600">{filterCounts['due-in-this-month']}</div>
                                    <div className="text-[10px] text-orange-600 font-medium leading-tight">Due in Month</div>
                                </div>

                                {/* 3. Overdue - Shows company count */}
                                <div
                                    className={getCardClass('overdue', "bg-red-50", false, filterCounts['overdue'])}
                                    onClick={() => filterCounts['overdue'] > 0 && handleScoringClick('overdue')}
                                >
                                    <div className="text-lg font-bold text-red-600">{filterCounts['overdue']}</div>
                                    <div className="text-[10px] text-red-600 font-medium leading-tight">Overdue</div>
                                </div>

                                {/* 4. Partly Submitted - Shows company count */}
                                <div
                                    className={getCardClass('partly-submitted', "bg-blue-50", false, filterCounts['partly-submitted'])}
                                    onClick={() => filterCounts['partly-submitted'] > 0 && handleScoringClick('partly-submitted')}
                                >
                                    <div className="text-lg font-bold text-blue-600">{filterCounts['partly-submitted']}</div>
                                    <div className="text-[10px] text-blue-600 font-medium leading-tight">Partly Submitted</div>
                                </div>

                                {/* 5. Re-submit Requested - Shows company count */}
                                <div
                                    className={getCardClass('re-submit-requested', "bg-amber-50", false, filterCounts['re-submit-requested'])}
                                    onClick={() => filterCounts['re-submit-requested'] > 0 && handleScoringClick('re-submit-requested')}
                                >
                                    <div className="text-lg font-bold text-amber-600">{filterCounts['re-submit-requested']}</div>
                                    <div className="text-[10px] text-amber-600 font-medium leading-tight">Re-submit Requested</div>
                                </div>

                                {/* 6. Submitted Pending Review - Shows company count */}
                                <div
                                    className={getCardClass('submitted-pending-review', "bg-purple-50", false, filterCounts['submitted-pending-review'])}
                                    onClick={() => filterCounts['submitted-pending-review'] > 0 && handleScoringClick('submitted-pending-review')}
                                >
                                    <div className="text-lg font-bold text-purple-600">{filterCounts['submitted-pending-review']}</div>
                                    <div className="text-[10px] text-purple-600 font-medium leading-tight">Pending Review</div>
                                </div>

                                {/* 7. Closed - Shows company count */}
                                <div
                                    className={getCardClass('closed', "bg-green-50", false, filterCounts['closed'])}
                                    onClick={() => filterCounts['closed'] > 0 && handleScoringClick('closed')}
                                >
                                    <div className="text-lg font-bold text-green-600">{filterCounts['closed']}</div>
                                    <div className="text-[10px] text-green-600 font-medium leading-tight">Closed</div>
                                </div>

                                {/* 8. Total Companies - STATIC */}
                                <div className="text-center p-2 rounded-lg bg-gray-50 cursor-default">
                                    <div className="text-lg font-bold text-gray-700">{summary?.total ?? 0}</div>
                                    <div className="text-[10px] text-gray-600 font-medium leading-tight">Total Companies</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {/* {(summary?.totalItems ?? 0) > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border">
                                    <span>📊 Total Items: <strong>{summary?.totalItems ?? 0}</strong></span>
                                    <span>✅ Completed: <strong className="text-emerald-600">{summary?.completedItems ?? 0}</strong></span>
                                    <span>📈 Progress: <strong className="text-emerald-600">{summary?.progressPercentage ?? 0}%</strong></span>
                                    <div className="flex-1 min-w-[100px]">
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${summary?.progressPercentage ?? 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )} */}
                        </CardContent>
                    </Card>
                </div>

                {/* Company List */}
                <CompanyCardFilter
                    companies={currentPageCompanies}
                    selectedCompany=""
                    onCompanyChange={handleCompanySelect}
                    loading={loading}
                    showESGStatus={true}
                />

                {/* Pagination Controls */}
                {filteredCompanies.length > 0 && (
                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>Rows per page:</span>
                            <Select
                                value={String(itemsPerPage)}
                                onValueChange={handleItemsPerPageChange}
                            >
                                <SelectTrigger className="w-[70px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[4, 8, 12, 16, 24].map((num) => (
                                        <SelectItem key={num} value={String(num)}>
                                            {num}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="ml-2">
                                {filteredCompanies.length > 0 ? 
                                    `${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, filteredCompanies.length)} of ${filteredCompanies.length}` :
                                    '0 of 0'
                                }
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <div className="flex items-center gap-1">
                                {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`h-8 w-8 p-0 ${
                                                currentPage === pageNum 
                                                    ? "bg-emerald-600 hover:bg-emerald-700" 
                                                    : ""
                                            }`}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}