import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CompanyCardFilter } from "@/components/esg-cap/CompanyCardFilter";
import {Bell} from "lucide-react";
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

// NEW IMPORTS: scoring utilities
import { ESGCapItem } from "@/components/esg-cap/CAPTable";
import { mapESGCapItems } from "./mapESGCapItem";
import { ComplianceScoreEngine } from "./compliance-score-engine";
import AuditDrawer, { AuditLog } from "./AuditDrawer";
import { History } from "lucide-react";
import { http } from "@/utils/httpInterceptor";
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
    if (!item) return '';

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
        if (companyStatus === 'submitted' || companyStatus === 'partly-submitted') {
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
    if (!item) return '';
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
    if (!item) return false;
    return getInvestorStatus(item) === 'closed';
};

interface Company {
    firesidePoc: any;
    fund: string;
    category: any;
    industry: any;
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

type ScoringFilterType = 'all' | 'hasCap' | 'due-in-this-month' | 'overdue' | 'partly-submitted' |
    're-submit-requested' | 'submitted-pending-review' | 'closed';

export default function CompanySelectionPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    // const [searchTerm, setSearchTerm] = useState("");
    // const [scoringFilter, setScoringFilter] = useState<ScoringFilterType>('all');
    const [auditOpen, setAuditOpen] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get('search') || '';
    const [summary, setSummary] = useState<DashboardResponse['summary'] | null>(null);
    const scoringFilter = (searchParams.get('scoring') as ScoringFilterType) || 'all';
    const industry = searchParams.get('industry') || 'All Industries';
    const fund = searchParams.get('fund') || 'All Funds';
    const revenue = searchParams.get('revenue') || 'All Revenue';
    const qCat = searchParams.get('qCat') || 'All Q Cat';
    const firesidePoc = searchParams.get('firesidePoc') || 'All POCs';
    const industryOptions = [
        "All Industries",
        "Beauty & Personal Care",
        "Fashion & Lifestyle",
        "Health & Wellness",
        "Food & Beverage",
        "Home & Décor",
        "Platform Enablers"
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

    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        const fetchUnreadCount = async () => {
        try {
            const response: any = await http.get('notification');
            if (response?.data?.status === true && response.data?.data) {
            const unread = response.data.data.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
        };
        fetchUnreadCount();
    }, []);

    const getAuditLogs = async () => {
        let logs: any = await http.get('audit');
        console.log("audit logs ", logs?.data);
        if (logs?.data?.status == true) {
          setLogs(logs.data['data']);
        }
      }
    
      useEffect(() => {
        getAuditLogs();
      }, []);

    // const [filters, setFilters] = useState({
    //     industry: "All Industries",
    //     fund: "All Funds",
    //     revenue: "All Revenue",
    //     qCat: "All Q Cat",
    //     firesidePoc: "All POCs",
    // });

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
                console.error("Failed to fetch dashboard summary data:", error);
                setCompanies([]);
                setSummary(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    useEffect(() => {
        //console.log("Summary updated:", summary);
    },[summary])

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

    const totalWithCap = useMemo(() => {
        return companies.filter(c => c._planItems && c._planItems.length > 0).length;
    }, [companies]);

    // Apply all filters
    const filteredCompanies = useMemo(() => {
        return companies.filter((company) => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                company.companyName?.toLowerCase().includes(searchLower) ||
                company.email?.toLowerCase().includes(searchLower);

            const matchesIndustry = industry === "All Industries" ||
                company.companyDetails?.industry === industry ||
                company.sector === industry;

            const matchesFund = fund === "All Funds" ||
                company.companyDetails?.fund === fund ||
                company.fundCompany?.some((f: any) => f.fundName === fund);

            const matchesRevenue = revenue === "All Revenue" ||
                company.companyDetails?.revenue_stage === revenueMap[revenue as keyof typeof revenueMap];

            const matchesQCat = qCat === "All Q Cat" ||
                company.companyDetails?.q_category === qCat;

            const matchesFireside =
                firesidePoc === "All POCs" ||
                company.firesidePoc?.toLowerCase().trim() === firesidePoc.toLowerCase().trim() ||
                company.companyDetails?.fireside_category?.toLowerCase().trim() === firesidePoc.toLowerCase().trim() ||
                company.assignedTeamMembers?.some((tm: any) =>
                    tm.teamMemberName?.toLowerCase().trim() === firesidePoc.toLowerCase().trim()
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

                        case 'hasCap':
                            matchesScoring = company._planItems && company._planItems.length > 0;
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
    }, [companies, searchTerm, scoringFilter, industry, fund, revenue, qCat, firesidePoc]);

    useEffect(() => {
        console.log("Filters updated:", filterCounts);
    }, [filterCounts]);

    const handleCompanySelect = (companyEmail: string) => {
        const queryString = searchParams.toString();
        const url = `/esg-dd/cap/${encodeURIComponent(companyEmail)}${queryString ? '?' + queryString : ''}`;
        navigate(url);
    };

    const handleScoringClick = (filter: ScoringFilterType) => {
        const newParams = new URLSearchParams(searchParams);
        if (scoringFilter === filter) {
            newParams.delete('scoring'); // toggle off
        } else {
            newParams.set('scoring', filter);
        }
        setSearchParams(newParams);
    };

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

    const enrichedCompanies = useMemo(() => {
        return filteredCompanies.map(company => {
            const plans = company._planItems || [];
            const totalItems = plans.length;

            let completedItems = 0;
            let overdueItems = 0;
            let openItems = 0;
            let pendingItems = 0;

            plans.forEach(p => {
                try {
                    if (!p) return;
                    if (isClosed(p)) {
                        completedItems++;
                        return;
                    }
                    // if (p.companyStatus || p.status === 'overdue') {
                    //     overdueItems++;
                    // }
                    const eff = getEffectiveCompanyStatus(p);
                    const inv = getInvestorStatus(p);

                    if (eff === 'overdue') {
                        overdueItems++;
                    }
                    // if (inv === 'partly-submitted' || inv === 'submitted-pending-review' ||
                    //     inv === 're-submit-requested' || inv === 'high-priority-overdue') {
                    if (eff === 'upcoming' || eff === 'due-in-this-month') {
                        pendingItems++;
                    } else if (eff === 'submitted-pending-review') {
                        openItems++;
                    }
                } catch (e) {
                    // Skip this item if there's an error
                }
            });

            return {
                ...company,
                displayFund: company.fund || company.companyDetails?.fund || 'N/A',
                displayCategory: company.category || company.industry || company.sector ||
                    company.companyDetails?.industry || company.companyDetails?.fireside_category || 'N/A',
                esgPlanCount: totalItems,
                esgCompletedCount: completedItems,
                esgOverdueCount: overdueItems,
                esgOpenCount: openItems,
                esgPendingCount: pendingItems,
            };
        });
    }, [filteredCompanies]);

    const averageComplianceScore = useMemo(() => {
        const companiesWithPlan = companies.filter(c => c._planItems && c._planItems.length > 0);
        if (companiesWithPlan.length === 0) return 0;
      
        const engine = new ComplianceScoreEngine();
        const scores: number[] = [];
      
        companiesWithPlan.forEach((company) => {
          try {
            // Directly pass the raw items as PlanItem[] – the engine reads the fields it needs.
            // Type assertion is safe because the runtime shape matches.
            const planItems = company._planItems as any as PlanItem[];
            const result = engine.calculateComplianceScore(planItems);
            const score = result?.overallComplianceScore ?? 0;
            scores.push(score);
            console.log(`📊 ${company.companyName} → Score: ${score}`);
          } catch (e) {
            console.error(`❌ Error for ${company.companyName}:`, e);
            scores.push(0);
          }
        });
      
        const sum = scores.reduce((a, b) => a + b, 0);
        const avg = scores.length > 0 ? Math.round(sum / scores.length) : 0;
        console.log(`📈 Total companies: ${scores.length}, Sum: ${sum}, Average: ${avg}%`);
        return avg;
      }, [companies]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
            <div className="container mx-auto py-8 px-4">
                {/* ESG Scoring Cards */}
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Portfolio Companies
                            </h1>
                            <p className="text-muted-foreground">
                                Manage and track ESG data across your portfolio.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 mb-3 md:mb-0">
                        {/* Notifications */}
                        <Button
                            variant="outline"
                            onClick={() => navigate('/notifications')}
                            className="group relative px-3 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="ml-2 hidden group-hover:inline whitespace-nowrap">
                            Notifications
                            </span>

                            {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {unreadCount}
                            </span>
                            )}
                        </Button>

                        {/* Audit Logs */}
                        <Button
                            variant="outline"
                            onClick={() => setAuditOpen(true)}
                            className="group px-3 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                        >
                            <History className="w-4 h-4" />
                            <span className="ml-2 hidden group-hover:inline whitespace-nowrap">
                            Audit Logs
                            </span>
                        </Button>
                       </div>
                    </div>

                    <Card>
                        <CardContent className="py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
                                {/* 1. Average Compliance Score - computed */}
                                <div className="text-center p-2 rounded-lg bg-green-50 cursor-default">
                                    <div className="text-lg font-bold text-green-600">
                                        {averageComplianceScore}%
                                    </div>
                                    <div className="text-[10px] text-muted-foreground leading-tight">
                                        Compliance Score
                                    </div>
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

                                {/* 8. Total Companies - clickable to show only companies with CAP */}
                                <div
                                    className={getCardClass('hasCap', "bg-gray-50", false, totalWithCap)}
                                    onClick={() => totalWithCap > 0 && handleScoringClick('hasCap')}
                                >
                                    <div className="text-lg font-bold text-gray-700">{totalWithCap}</div>
                                    <div className="text-[10px] text-gray-600 font-medium leading-tight">Total Companies</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <Input
                        placeholder="Search company by name or email..."
                        value={searchTerm}
                        className="md:w-[789px]"
                        onChange={(e) => {
                            const newParams = new URLSearchParams(searchParams);
                            if (e.target.value) {
                                newParams.set('search', e.target.value);
                            } else {
                                newParams.delete('search');
                            }
                            setSearchParams(newParams);
                        }}
                    />
                    <div className="flex flex-wrap items-center gap-5">
                        <Select
                            value={industry}
                            onValueChange={(val) => {
                                const newParams = new URLSearchParams(searchParams);
                                if (val === "All Industries") {
                                    newParams.delete('industry');
                                } else {
                                    newParams.set('industry', val);
                                }
                                setSearchParams(newParams);
                            }}
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
                            value={fund}
                            onValueChange={(val) => {
                                const newParams = new URLSearchParams(searchParams);
                                if (val === "All Funds") {
                                    newParams.delete('fund');
                                } else {
                                    newParams.set('fund', val);
                                }
                                setSearchParams(newParams);
                            }}
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
                    </div>
                    {/* <Select
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
                    </Select> */}
                </div>

                {/* Company List - all companies, no pagination */}
                <CompanyCardFilter
                    companies={enrichedCompanies}
                    selectedCompany=""
                    onCompanyChange={handleCompanySelect}
                    loading={loading}
                    showESGStatus={true}
                />
                <AuditDrawer open={auditOpen} onClose={() => setAuditOpen(false)} logs={logs} />
            </div>
        </div>
    );
}