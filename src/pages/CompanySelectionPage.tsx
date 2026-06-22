import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyCardFilter } from "@/components/esg-cap/CompanyCardFilter";
import { Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockCompanies } from "@/data/mockData";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type ESGStatus = 'open' | 'closed' | 'pending' | 'not_started' | 'submitted' | 'overdue' | 'upcoming' | 'under_review';

interface Company {
    _id?: string;
    email: string;
    companyName: string;
    entityId?: string;
    companyId?: string;
    firesidePoc?: string;
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
    esgStatus?: ESGStatus;
    esgData?: any;
    esgPlanCount?: number;
    esgCompletedCount?: number;
    esgOverdueCount?: number;
    esgEntityId?: string;
    hasESGData?: boolean;
    isLoadingESG?: boolean;
}

interface ESGPlanResponse {
    status: boolean;
    plan: Array<{
        status: string;
        investorStatus?: string;
        category?: string;
        [key: string]: any;
    }>;
    entityId: string;
}

export default function CompanySelectionPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingESG, setLoadingESG] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    
    // Use ref to track if ESG data has been fetched for each company
    const esgFetchedRef = useRef<Set<string>>(new Set());
    const isFetchingRef = useRef(false);
    
    const industryOptions = [
      "All Industries",
      "Beauty & Personal Care",
      "Fashion & Lifestyle",
      "Health & Wellness",
      "Food & Beverage",
      "Home & Décor",
      "Platform Enablers",
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

    // Fetch companies
    useEffect(() => {
        const fetchCompanies = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/companyInfo`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
                });
                const json = await res.json();
                const apiCompanies = json.data || [];

                const mappedCompanies: Company[] = apiCompanies.map((apiCompany: any) => {
                    const mockMatch = mockCompanies.find(
                        (m) => m.contactEmail === apiCompany.email
                    );

                    const fundNames = apiCompany.fundCompany?.map((f: any) => f.fundName) || [];
                    const teamMembers = apiCompany.assignedTeamMembers?.map((tm: any) => tm.teamMemberName) || [];

                    const esgEntityId = apiCompany.user?.entityId || apiCompany.companyId || apiCompany._id;

                    return {
                        _id: apiCompany._id,
                        email: apiCompany.email || "",
                        companyName: apiCompany.companyName || "",
                        companyId: apiCompany.companyId,
                        entityId: apiCompany.user?.entityId,
                        esgEntityId: esgEntityId,
                        firesidePoc: mockMatch?.fl || teamMembers[0] || "",
                        sector: apiCompany.sector || "",
                        opportunityStatus: apiCompany.opportunityStatus || "",
                        fundCompany: apiCompany.fundCompany || [],
                        assignedTeamMembers: apiCompany.assignedTeamMembers || [],
                        companyDetails: {
                            industry: apiCompany.sector || mockMatch?.industry || "",
                            fund: fundNames[0] || mockMatch?.fund || "",
                            revenue_stage: mockMatch?.revenueStage || "",
                            q_category: mockMatch?.qCategory || "",
                            fireside_category: mockMatch?.firesideCategory || "",
                        },
                        hasESGData: false,
                        esgStatus: 'not_started' as ESGStatus,
                        esgPlanCount: 0,
                        esgCompletedCount: 0,
                        esgOverdueCount: 0,
                        isLoadingESG: false,
                    };
                });

                setCompanies(mappedCompanies);
                setIsInitialLoad(false);
            } catch (error) {
                console.error("Failed to load API, using mock data", error);
                const fallback: Company[] = mockCompanies.map((mock) => ({
                    email: mock.contactEmail || "",
                    companyName: mock.name || "",
                    entityId: mock.id || "",
                    esgEntityId: mock.id || "",
                    firesidePoc: mock.fl || "",
                    companyDetails: {
                        industry: mock.industry || "",
                        fund: mock.fund || "",
                        revenue_stage: mock.revenueStage || "",
                        q_category: mock.qCategory || "",
                        fireside_category: mock.firesideCategory || "",
                    },
                    hasESGData: false,
                    esgStatus: 'not_started' as ESGStatus,
                    esgPlanCount: 0,
                    esgCompletedCount: 0,
                    esgOverdueCount: 0,
                    isLoadingESG: false,
                }));
                setCompanies(fallback);
                setIsInitialLoad(false);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
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

            const matchesFireside = filters.firesidePoc === "All POCs" || 
                company.firesidePoc === filters.firesidePoc ||
                company.assignedTeamMembers?.some((tm: any) => tm.teamMemberName === filters.firesidePoc);

            return (
                matchesSearch &&
                matchesIndustry &&
                matchesFund &&
                matchesRevenue &&
                matchesQCat &&
                matchesFireside
            );
        });
    }, [companies, searchTerm, filters]);

    // Get current page companies
    const getCurrentPageCompanies = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredCompanies.slice(startIndex, endIndex);
    };

    const totalItems = filteredCompanies.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const currentPageCompanies = getCurrentPageCompanies();

    // Fetch ESG data ONLY for companies on the current page
    useEffect(() => {
        const fetchESGDataForCurrentPage = async () => {
            // Prevent multiple simultaneous fetches
            if (isFetchingRef.current) return;
            if (loading || isInitialLoad || currentPageCompanies.length === 0) return;
            
            // Find companies on current page that need ESG data
            const companiesToFetch = currentPageCompanies.filter(c => 
                !c.hasESGData && 
                !c.isLoadingESG && 
                !esgFetchedRef.current.has(c.email)
            );
            
            if (companiesToFetch.length === 0) {
                return;
            }

            isFetchingRef.current = true;
            setLoadingESG(true);
            
            try {
                // Mark companies as loading
                setCompanies(prevCompanies => 
                    prevCompanies.map(company => {
                        if (companiesToFetch.some(c => c.email === company.email)) {
                            return { ...company, isLoadingESG: true };
                        }
                        return company;
                    })
                );

                const promises = companiesToFetch.map(async (company) => {
                    const esgId = company.esgEntityId || company.entityId || company.companyId || company._id;
                    
                    if (!esgId) {
                        esgFetchedRef.current.add(company.email);
                        return {
                            email: company.email,
                            status: 'not_started' as ESGStatus,
                            hasData: false,
                            planCount: 0,
                            completedCount: 0,
                            overdueCount: 0,
                        };
                    }

                    try {
                        const res = await fetch(
                            `${import.meta.env.VITE_API_URL}/investor/esgdd/escap/plan/${esgId}`,
                            {
                                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
                            }
                        );
                        
                        esgFetchedRef.current.add(company.email);
                        
                        if (res.ok) {
                            const data: ESGPlanResponse = await res.json();
                            
                            if (data.status && data.plan && data.plan.length > 0) {
                                const plan = data.plan;
                                const completed = plan.filter((item: any) => 
                                    item.status === 'submitted' || 
                                    item.investorStatus === 'closed' ||
                                    item.status === 'closed'
                                ).length;
                                
                                const overdue = plan.filter((item: any) => 
                                    item.status === 'overdue'
                                ).length;
                                
                                const underReview = plan.filter((item: any) => 
                                    item.investorStatus === 'under review' ||
                                    item.status === 'under review'
                                ).length;
                                
                                let overallStatus: ESGStatus = 'not_started';
                                if (completed === plan.length) {
                                    overallStatus = 'closed';
                                } else if (completed > 0 || underReview > 0) {
                                    overallStatus = 'pending';
                                } else if (overdue > 0) {
                                    overallStatus = 'open';
                                } else {
                                    overallStatus = 'open';
                                }
                                
                                return {
                                    email: company.email,
                                    status: overallStatus,
                                    hasData: true,
                                    planCount: plan.length,
                                    completedCount: completed,
                                    overdueCount: overdue,
                                };
                            }
                        }
                        
                        return {
                            email: company.email,
                            status: 'not_started' as ESGStatus,
                            hasData: false,
                            planCount: 0,
                            completedCount: 0,
                            overdueCount: 0,
                        };
                    } catch (error) {
                        console.warn(`No ESG data for ${company.companyName}:`, error);
                        return {
                            email: company.email,
                            status: 'not_started' as ESGStatus,
                            hasData: false,
                            planCount: 0,
                            completedCount: 0,
                            overdueCount: 0,
                        };
                    }
                });

                const results = await Promise.all(promises);
                
                // Update companies with ESG data
                setCompanies(prevCompanies => 
                    prevCompanies.map(company => {
                        const result = results.find(r => r.email === company.email);
                        if (result) {
                            return { 
                                ...company, 
                                esgStatus: result.status,
                                hasESGData: result.hasData,
                                esgPlanCount: result.planCount,
                                esgCompletedCount: result.completedCount,
                                esgOverdueCount: result.overdueCount,
                                isLoadingESG: false,
                            };
                        }
                        return { ...company, isLoadingESG: false };
                    })
                );
            } catch (error) {
                console.error("Failed to fetch ESG data", error);
                setCompanies(prevCompanies => 
                    prevCompanies.map(company => ({ ...company, isLoadingESG: false }))
                );
            } finally {
                setLoadingESG(false);
                isFetchingRef.current = false;
            }
        };

        fetchESGDataForCurrentPage();
    }, [currentPageCompanies, loading, isInitialLoad, currentPage, itemsPerPage]);

    // Calculate ESG stats for ALL filtered companies (using cached data)
    const esgStats = useMemo(() => {
        const allFiltered = filteredCompanies;
        const open = allFiltered.filter(c => c.esgStatus === 'open').length;
        const closed = allFiltered.filter(c => c.esgStatus === 'closed').length;
        const pending = allFiltered.filter(c => c.esgStatus === 'pending').length;
        const notStarted = allFiltered.filter(c => c.esgStatus === 'not_started' || !c.esgStatus).length;
        const totalPlans = allFiltered.reduce((sum, c) => sum + (c.esgPlanCount || 0), 0);
        const totalCompleted = allFiltered.reduce((sum, c) => sum + (c.esgCompletedCount || 0), 0);
        const totalOverdue = allFiltered.reduce((sum, c) => sum + (c.esgOverdueCount || 0), 0);
        
        return {
            total: allFiltered.length,
            open,
            closed,
            pending,
            notStarted,
            totalPlans,
            totalCompleted,
            totalOverdue,
            completionRate: totalPlans > 0 ? Math.round((totalCompleted / totalPlans) * 100) : 0,
        };
    }, [filteredCompanies]);

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
    }, [searchTerm, filters]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
            <div className="container mx-auto py-12 px-4">
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

                {/* Eco-friendly heading with ESG Stats */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 p-1.5 rounded-full">
                            <Leaf className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-emerald-800">Select a Company</h1>
                            <p className="text-xs text-emerald-600/70">Choose a company to view its ESG CAP</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-emerald-600">
                            {filteredCompanies.length} total companies
                        </span>
                        {!loadingESG && filteredCompanies.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                                <span className="text-xs font-medium text-gray-600">ESG Status:</span>
                                <span className="text-xs">
                                    <span className="text-emerald-600 font-medium">● Closed {esgStats.closed}</span>
                                    <span className="mx-1 text-gray-300">|</span>
                                    <span className="text-yellow-500 font-medium">● Pending {esgStats.pending}</span>
                                    <span className="mx-1 text-gray-300">|</span>
                                    <span className="text-orange-400 font-medium">● Open {esgStats.open}</span>
                                    <span className="mx-1 text-gray-300">|</span>
                                    <span className="text-blue-400 font-medium">● Not Started {esgStats.notStarted}</span>
                                </span>
                                {esgStats.totalPlans > 0 && (
                                    <span className="text-xs text-gray-400 border-l pl-2">
                                        {/* Plans: {esgStats.totalPlans} | Done: {esgStats.totalCompleted} ({esgStats.completionRate}%) */}
                                        {esgStats.totalOverdue > 0 && (
                                            <span className="text-red-500 ml-1">⚠ {esgStats.totalOverdue} overdue</span>
                                        )}
                                    </span>
                                )}
                            </div>
                        )}
                        {loadingESG && (
                            <span className="text-xs text-gray-400 animate-pulse">Loading ESG data...</span>
                        )}
                    </div>
                </div>

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