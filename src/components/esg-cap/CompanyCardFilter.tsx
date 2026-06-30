import { Loader2, Building2, Mail, CheckCircle, XCircle, Clock, AlertCircle, FileText, AlertTriangle } from "lucide-react";

// Match the Company interface from the main page
interface Company {
    email: string;
    companyName: string;
    esgStatus?: 'open' | 'closed' | 'pending' | 'not_started' | 'submitted' | 'overdue' | 'upcoming' | 'under_review';
    sector?: string;
    fundCompany?: Array<{ fundName: string; stageOfInvestment?: string }>;
    assignedTeamMembers?: Array<{ teamMemberName: string; teamMemberEmail: string; designation?: string }>;
    entityId?: string;
    esgPlanCount?: number;
    esgCompletedCount?: number;
    esgOverdueCount?: number;
    esgOpenCount?: number;
    esgPendingCount?: number; 
}

interface CompanyCardFilterProps {
    companies: Company[];
    selectedCompany: string;
    onCompanyChange: (value: string) => void;
    loading?: boolean;
    showESGStatus?: boolean;
}

const colorPalette = [
    {
        name: "emerald",
        border: "border-emerald-200",
        hoverBorder: "hover:border-emerald-400",
        selectedBorder: "border-emerald-500",
        selectedBg: "bg-emerald-50",
        selectedRing: "ring-emerald-200",
        iconDefault: "text-gray-400",
        iconSelected: "text-emerald-600",
        hoverShadow: "hover:shadow-emerald-100",
    },
    {
        name: "teal",
        border: "border-teal-200",
        hoverBorder: "hover:border-teal-400",
        selectedBorder: "border-teal-500",
        selectedBg: "bg-teal-50",
        selectedRing: "ring-teal-200",
        iconDefault: "text-gray-400",
        iconSelected: "text-teal-600",
        hoverShadow: "hover:shadow-teal-100",
    },
    {
        name: "amber",
        border: "border-amber-200",
        hoverBorder: "hover:border-amber-400",
        selectedBorder: "border-amber-500",
        selectedBg: "bg-amber-50",
        selectedRing: "ring-amber-200",
        iconDefault: "text-gray-400",
        iconSelected: "text-amber-600",
        hoverShadow: "hover:shadow-amber-100",
    },
    {
        name: "purple",
        border: "border-purple-200",
        hoverBorder: "hover:border-purple-400",
        selectedBorder: "border-purple-500",
        selectedBg: "bg-purple-50",
        selectedRing: "ring-purple-200",
        iconDefault: "text-gray-400",
        iconSelected: "text-purple-600",
        hoverShadow: "hover:shadow-purple-100",
    },
    {
        name: "rose",
        border: "border-rose-200",
        hoverBorder: "hover:border-rose-400",
        selectedBorder: "border-rose-500",
        selectedBg: "bg-rose-50",
        selectedRing: "ring-rose-200",
        iconDefault: "text-gray-400",
        iconSelected: "text-rose-600",
        hoverShadow: "hover:shadow-rose-100",
    },
    {
        name: "indigo",
        border: "border-indigo-200",
        hoverBorder: "hover:border-indigo-400",
        selectedBorder: "border-indigo-500",
        selectedBg: "bg-indigo-50",
        selectedRing: "ring-indigo-200",
        iconDefault: "text-gray-400",
        iconSelected: "text-indigo-600",
        hoverShadow: "hover:shadow-indigo-100",
    },
];

export function CompanyCardFilter({
    companies,
    selectedCompany,
    onCompanyChange,
    loading = false,
    showESGStatus = false,
}: CompanyCardFilterProps) {
    const getStatusIcon = (status?: string) => {
        if (!status) return <AlertCircle className="h-4 w-4 text-blue-400" />;
        
        // Map all possible statuses to icons
        const statusMap: Record<string, React.ReactNode> = {
            'closed': <CheckCircle className="h-4 w-4 text-emerald-500" />,
            'pending': <Clock className="h-4 w-4 text-yellow-500" />,
            'open': <AlertCircle className="h-4 w-4 text-orange-400" />,
            'not_started': <AlertCircle className="h-4 w-4 text-blue-400" />,
            'submitted': <CheckCircle className="h-4 w-4 text-emerald-400" />,
            'overdue': <AlertTriangle className="h-4 w-4 text-red-500" />,
            'upcoming': <Clock className="h-4 w-4 text-blue-400" />,
            'under_review': <Clock className="h-4 w-4 text-yellow-500" />,
        };
        
        return statusMap[status] || <AlertCircle className="h-4 w-4 text-gray-400" />;
    };

    const getStatusLabel = (status?: string) => {
        if (!status) return 'Not Started';
        
        const labelMap: Record<string, string> = {
            'closed': 'Closed',
            'pending': 'Pending',
            'open': 'Open',
            'not_started': 'Not Started',
            'submitted': 'Submitted',
            'overdue': 'Overdue',
            'upcoming': 'Upcoming',
            'under_review': 'Under Review',
        };
        
        return labelMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getStatusColor = (status?: string) => {
        if (!status) return 'text-blue-400';
        
        const colorMap: Record<string, string> = {
            'closed': 'text-emerald-600',
            'pending': 'text-yellow-600',
            'open': 'text-orange-500',
            'not_started': 'text-blue-400',
            'submitted': 'text-emerald-400',
            'overdue': 'text-red-500',
            'upcoming': 'text-blue-400',
            'under_review': 'text-yellow-500',
        };
        
        return colorMap[status] || 'text-gray-400';
    };

    const getStatusBgColor = (status?: string) => {
        if (!status) return 'bg-blue-50';
        
        const bgMap: Record<string, string> = {
            'closed': 'bg-emerald-50',
            'pending': 'bg-yellow-50',
            'open': 'bg-orange-50',
            'not_started': 'bg-blue-50',
            'submitted': 'bg-emerald-50',
            'overdue': 'bg-red-50',
            'upcoming': 'bg-blue-50',
            'under_review': 'bg-yellow-50',
        };
        
        return bgMap[status] || 'bg-gray-50';
    };

    // Determine if status should be shown as a simplified version
    const getDisplayStatus = (status?: string): 'closed' | 'pending' | 'open' | 'not_started' => {
        if (!status) return 'not_started';
        
        // Map detailed statuses to simplified ones for display
        if (status === 'submitted' || status === 'closed') return 'closed';
        if (status === 'under_review' || status === 'pending') return 'pending';
        if (status === 'overdue' || status === 'open') return 'open';
        if (status === 'upcoming') return 'pending';
        
        return status as 'closed' | 'pending' | 'open' | 'not_started';
    };

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading companies...
                </div>
            ) : companies.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    No companies found matching your filters
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {companies.map((company, index) => {
                        const isSelected = selectedCompany === company.email;
                        const colorScheme = colorPalette[index % colorPalette.length];
                        const displayStatus = getDisplayStatus(company.esgStatus);
                        
                        return (
                            <button
                                key={company.email}
                                type="button"
                                onClick={() => onCompanyChange(company.email)}
                                className={`
                                    group relative flex flex-col items-start p-5 rounded-2xl border-2 
                                    transition-all duration-200 ease-out text-left
                                    bg-white
                                    ${colorScheme.border}
                                    ${!isSelected && colorScheme.hoverBorder}
                                    ${!isSelected && "hover:shadow-lg hover:-translate-y-0.5"}
                                    ${isSelected ? colorScheme.selectedBorder : ""}
                                    ${isSelected ? colorScheme.selectedBg : ""}
                                    ${isSelected ? `ring-2 ${colorScheme.selectedRing}` : ""}
                                    dark:bg-gray-900 dark:border-gray-700
                                `}
                            >
                                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5" />

                                <div className="relative z-10 w-full">
                                    <div className="flex items-start justify-between gap-2">
                                        <Building2
                                            className={`h-5 w-5 flex-shrink-0 transition-colors ${
                                                isSelected ? colorScheme.iconSelected : colorScheme.iconDefault
                                            }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate dark:text-gray-100">
                                                {company.companyName}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="truncate">{company.email}</span>
                                    </div>

                                    {company.sector && (
                                        <div className="mt-2 text-xs text-gray-400 truncate">
                                            {company.sector}
                                        </div>
                                    )}

                                    {company.fundCompany && company.fundCompany.length > 0 && (
                                        <div className="mt-1 text-xs text-gray-400 truncate">
                                            Fund: {company.fundCompany.map(f => f.fundName).join(', ')}
                                        </div>
                                    )}
                                    {showESGStatus && (
                                        <div className="mt-3 w-full">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Item counts */}
                                                {company.esgPlanCount !== undefined && company.esgPlanCount > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <span>{company.esgPlanCount} items</span>

                                                        {company.esgCompletedCount !== undefined && company.esgCompletedCount > 0 && (
                                                            <span className="text-emerald-600">{company.esgCompletedCount} closed</span>
                                                        )}

                                                        {company.esgOpenCount !== undefined && company.esgOpenCount > 0 && (
                                                            <span className="text-orange-500">{company.esgOpenCount} open</span>
                                                        )}

                                                        {company.esgPendingCount !== undefined && company.esgPendingCount > 0 && (
                                                            <span className="text-yellow-500">{company.esgPendingCount} pending</span>
                                                        )}

                                                        {company.esgOverdueCount > 0 && (
                                                            <span className="text-red-500 flex items-center gap-1">
                                                                {company.esgOverdueCount} overdue
                                                            </span>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}