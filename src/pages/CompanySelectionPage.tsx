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
    // These will come from backend once added
    esgSummary?: {
        totalItems: number;
        completedItems: number;
        overdueItems: number;
        pendingItems: number;
        hasPlan: boolean;
        status: string;
    };
    statusBreakdown?: {
        highPriorityOverdue: number;
        partlySubmitted: number;
        submittedPendingReview: number;
        resubmitRequested: number;
        closedThisMonth: number;
    };
}

interface DashboardResponse {
    status: boolean;
    summary: {
        total: number;
        closed: number;
        pending: number;
        open: number;
        notStarted: number;
        statusBreakdown?: {
            highPriorityOverdue: number;
            partlySubmitted: number;
            submittedPendingReview: number;
            resubmitRequested: number;
            closedThisMonth: number;
        };
        totalPlans?: number;
        totalCompleted?: number;
        totalOverdue?: number;
        totalPending?: number;
        completionRate?: number;
    };
    data: Company[];
}

type FilterType = 'all' | 'closed' | 'pending' | 'open' | 'not_started' | 
                  'highPriorityOverdue' | 'partlySubmitted' | 'submittedPendingReview' | 
                  'resubmitRequested' | 'closedThisMonth';

export default function CompanySelectionPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [summary, setSummary] = useState<DashboardResponse['summary'] | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    
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

            // Apply ESG filter
            let matchesESG = true;
            if (activeFilter !== 'all') {
                switch (activeFilter) {
                    case 'closed':
                        matchesESG = company.esgStatus === 'closed';
                        break;
                    case 'pending':
                        matchesESG = company.esgStatus === 'pending';
                        break;
                    case 'open':
                        matchesESG = company.esgStatus === 'open';
                        break;
                    case 'not_started':
                        matchesESG = company.esgStatus === 'not_started';
                        break;
                    case 'highPriorityOverdue':
                        matchesESG = (company.statusBreakdown?.highPriorityOverdue || 0) > 0;
                        break;
                    case 'partlySubmitted':
                        matchesESG = (company.statusBreakdown?.partlySubmitted || 0) > 0;
                        break;
                    case 'submittedPendingReview':
                        matchesESG = (company.statusBreakdown?.submittedPendingReview || 0) > 0;
                        break;
                    case 'resubmitRequested':
                        matchesESG = (company.statusBreakdown?.resubmitRequested || 0) > 0;
                        break;
                    case 'closedThisMonth':
                        matchesESG = (company.statusBreakdown?.closedThisMonth || 0) > 0;
                        break;
                    default:
                        matchesESG = true;
                }
            }

            return (
                matchesSearch &&
                matchesIndustry &&
                matchesFund &&
                matchesRevenue &&
                matchesQCat &&
                matchesFireside &&
                matchesESG
            );
        });
    }, [companies, searchTerm, filters, activeFilter]);

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
    }, [searchTerm, filters, activeFilter]);

    // Click handler for status cards
    const handleStatusClick = (filter: FilterType) => {
        setActiveFilter(activeFilter === filter ? 'all' : filter);
        setCurrentPage(1);
    };

    // Get status card style
    const getStatusCardStyle = (filter: FilterType, count: number) => {
        const isActive = activeFilter === filter;
        const baseStyle = "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5";
        const activeStyle = isActive ? "ring-2 ring-emerald-500 shadow-lg bg-emerald-50/50" : "";
        const disabledStyle = count === 0 ? "opacity-50 cursor-not-allowed hover:shadow-none hover:-translate-y-0" : "";
        return `${baseStyle} ${activeStyle} ${disabledStyle}`;
    };

    // Format number with icon
    const formatStatusCard = (label: string, count: number, icon: React.ReactNode, color: string, filter: FilterType) => {
        return (
            <Card 
                className={getStatusCardStyle(filter, count)}
                onClick={() => count > 0 && handleStatusClick(filter)}
            >
                <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                        {icon}
                        <span className="text-xs text-gray-400">{label}</span>
                    </div>
                    <p className={`text-xl font-bold ${color}`}>{count}</p>
                    <p className="text-xs text-gray-500">{count === 1 ? 'Company' : 'Companies'}</p>
                </CardContent>
            </Card>
        );
    };

    // Calculate stats from the data
    const getStats = () => {
        if (summary) {
            return {
                total: summary.total || 0,
                closed: summary.closed || 0,
                pending: summary.pending || 0,
                open: summary.open || 0,
                notStarted: summary.notStarted || 0,
                highPriorityOverdue: summary.statusBreakdown?.highPriorityOverdue || 0,
                partlySubmitted: summary.statusBreakdown?.partlySubmitted || 0,
                submittedPendingReview: summary.statusBreakdown?.submittedPendingReview || 0,
                resubmitRequested: summary.statusBreakdown?.resubmitRequested || 0,
                closedThisMonth: summary.statusBreakdown?.closedThisMonth || 0,
                totalPlans: summary.totalPlans || 0,
                totalCompleted: summary.totalCompleted || 0,
                totalOverdue: summary.totalOverdue || 0,
                totalPending: summary.totalPending || 0,
                completionRate: summary.completionRate || 0,
            };
        }
        
        // Fallback: calculate from companies array
        const total = companies.length;
        const closed = companies.filter(c => c.esgStatus === 'closed').length;
        const pending = companies.filter(c => c.esgStatus === 'pending').length;
        const open = companies.filter(c => c.esgStatus === 'open').length;
        const notStarted = companies.filter(c => c.esgStatus === 'not_started').length;
        
        return {
            total,
            closed,
            pending,
            open,
            notStarted,
            highPriorityOverdue: 0,
            partlySubmitted: 0,
            submittedPendingReview: 0,
            resubmitRequested: 0,
            closedThisMonth: 0,
            totalPlans: 0,
            totalCompleted: 0,
            totalOverdue: 0,
            totalPending: 0,
            completionRate: 0,
        };
    };

    const stats = getStats();

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

                    {/* <Select
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
                    </Select> */}
                </div>

                {/* ESG Dashboard Cards */}
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        <h2 className="text-sm font-semibold text-gray-700">ESG Dashboard</h2>
                        <span className="text-xs text-gray-400 ml-2">
                            Click on any card to filter companies
                        </span>
                        {activeFilter !== 'all' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusClick('all')}
                                className="text-xs text-emerald-600 hover:text-emerald-700"
                            >
                                Clear Filter ✕
                            </Button>
                        )}
                    </div>
                    
                    {/* Row 1: Main Status Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {formatStatusCard('Total', stats.total, <FileText className="h-4 w-4 text-gray-400" />, 'text-gray-800', 'all')}
                        {formatStatusCard('Closed', stats.closed, <CheckCircle className="h-4 w-4 text-emerald-500" />, 'text-emerald-600', 'closed')}
                        {formatStatusCard('Pending', stats.pending, <Clock className="h-4 w-4 text-yellow-500" />, 'text-yellow-600', 'pending')}
                        {formatStatusCard('Open', stats.open, <AlertTriangle className="h-4 w-4 text-orange-400" />, 'text-orange-500', 'open')}
                        {formatStatusCard('Not Started', stats.notStarted, <FileText className="h-4 w-4 text-blue-400" />, 'text-blue-500', 'not_started')}
                    </div>

                    {/* Row 2: Detailed Status Breakdown - Only show if there's data */}
                    {(stats.highPriorityOverdue > 0 || stats.partlySubmitted > 0 || 
                      stats.submittedPendingReview > 0 || stats.resubmitRequested > 0 || 
                      stats.closedThisMonth > 0) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3">
                            <Card 
                                className={getStatusCardStyle('highPriorityOverdue', stats.highPriorityOverdue)}
                                onClick={() => stats.highPriorityOverdue > 0 && handleStatusClick('highPriorityOverdue')}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        <span className="text-xs text-gray-400">High Priority</span>
                                    </div>
                                    <p className="text-xl font-bold text-red-600">{stats.highPriorityOverdue}</p>
                                    <p className="text-xs text-gray-500">Overdue Items</p>
                                </CardContent>
                            </Card>

                            <Card 
                                className={getStatusCardStyle('partlySubmitted', stats.partlySubmitted)}
                                onClick={() => stats.partlySubmitted > 0 && handleStatusClick('partlySubmitted')}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <FileText className="h-4 w-4 text-purple-400" />
                                        <span className="text-xs text-gray-400">Partly</span>
                                    </div>
                                    <p className="text-xl font-bold text-purple-600">{stats.partlySubmitted}</p>
                                    <p className="text-xs text-gray-500">Submitted Items</p>
                                </CardContent>
                            </Card>

                            <Card 
                                className={getStatusCardStyle('submittedPendingReview', stats.submittedPendingReview)}
                                onClick={() => stats.submittedPendingReview > 0 && handleStatusClick('submittedPendingReview')}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <Clock className="h-4 w-4 text-yellow-400" />
                                        <span className="text-xs text-gray-400">Pending</span>
                                    </div>
                                    <p className="text-xl font-bold text-yellow-600">{stats.submittedPendingReview}</p>
                                    <p className="text-xs text-gray-500">Review Items</p>
                                </CardContent>
                            </Card>

                            <Card 
                                className={getStatusCardStyle('resubmitRequested', stats.resubmitRequested)}
                                onClick={() => stats.resubmitRequested > 0 && handleStatusClick('resubmitRequested')}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <RefreshCw className="h-4 w-4 text-orange-400" />
                                        <span className="text-xs text-gray-400">Re-submit</span>
                                    </div>
                                    <p className="text-xl font-bold text-orange-600">{stats.resubmitRequested}</p>
                                    <p className="text-xs text-gray-500">Requested</p>
                                </CardContent>
                            </Card>

                            <Card 
                                className={getStatusCardStyle('closedThisMonth', stats.closedThisMonth)}
                                onClick={() => stats.closedThisMonth > 0 && handleStatusClick('closedThisMonth')}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                        <span className="text-xs text-gray-400">Closed</span>
                                    </div>
                                    <p className="text-xl font-bold text-emerald-600">{stats.closedThisMonth}</p>
                                    <p className="text-xs text-gray-500">This Month</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Stats Summary Bar - Only if there are plans */}
                    {stats.totalPlans > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-white px-4 py-2 rounded-lg border">
                            <span>📊 Total Plans: <strong>{stats.totalPlans}</strong></span>
                            <span>✅ Completed: <strong className="text-emerald-600">{stats.totalCompleted}</strong></span>
                            <span>⏳ Pending: <strong className="text-yellow-600">{stats.totalPending}</strong></span>
                            <span>⚠️ Overdue: <strong className="text-red-600">{stats.totalOverdue}</strong></span>
                            <span>📈 Completion Rate: <strong className="text-emerald-600">{stats.completionRate}%</strong></span>
                            {/* Progress Bar */}
                            <div className="flex-1 min-w-[100px]">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.completionRate}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Show message when no ESG data */}
                    {/* {stats.totalPlans === 0 && stats.total > 0 && (
                        <div className="mt-3 text-center text-sm text-gray-400 bg-white px-4 py-3 rounded-lg border border-dashed">
                            📋 No ESG plans available yet. Click on a company to start creating ESG CAP.
                        </div>
                    )} */}
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