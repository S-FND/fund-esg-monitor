import { Loader2, Building2, Mail, CheckCircle, XCircle, Clock, AlertCircle, FileText, AlertTriangle, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Updated Company interface to match the API response
interface Company {
    _id?: string;
    email: string;
    companyName: string;
    esgStatus?: 'open' | 'closed' | 'pending' | 'not_started' | 'submitted' | 'overdue' | 'upcoming' | 'under_review';
    sector?: string;
    // New fields from API
    fund?: string;
    category?: string;
    industry?: string;
    fireside_category?: string;
    internal_category?: string;
    fundCompany?: Array<{ fundName: string; stageOfInvestment?: string }>;
    assignedTeamMembers?: Array<{ teamMemberName: string; teamMemberEmail: string; designation?: string }>;
    entityId?: string;
    esgPlanCount?: number;
    esgCompletedCount?: number;
    esgOverdueCount?: number;
    esgOpenCount?: number;
    esgPendingCount?: number;
    // Display fields
    displayFund?: string;
    displayCategory?: string;
}

interface CompanyCardFilterProps {
    companies: Company[];
    selectedCompany: string;
    onCompanyChange: (value: string) => void;
    loading?: boolean;
    showESGStatus?: boolean;
}

// Helper: initials
const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map(s => s[0])
        .join('')
        .toUpperCase();
};

// Circular progress (reused from the main page)
const CircularProgress = ({ value, size = 44, stroke = 4 }: { value: number; size?: number; stroke?: number }) => {
    const pct = Math.max(0, Math.min(100, value));
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (pct / 100) * circ;
    const color = pct >= 75 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-red-500";
    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={radius} strokeWidth={stroke} className="stroke-muted" fill="none" />
                <circle cx={size/2} cy={size/2} r={radius} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className={cn("transition-all", color)} fill="none" stroke="currentColor" />
            </svg>
            <span className="absolute text-[10px] font-semibold tabular-nums">{pct}%</span>
        </div>
    );
};

export function CompanyCardFilter({
    companies,
    selectedCompany,
    onCompanyChange,
    loading = false,
    showESGStatus = false,
}: CompanyCardFilterProps) {
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
                <div className="rounded-md border">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead>Fund</TableHead>
                                <TableHead>Industry</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Items Filled</TableHead>
                                <TableHead className="text-right">Open</TableHead>
                                <TableHead className="text-right">Pending</TableHead>
                                <TableHead className="text-right">Overdue</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.map((company) => {
                                const isSelected = selectedCompany === company.email;
                                const total = company.esgPlanCount || 0;
                                const closed = company.esgCompletedCount || 0;
                                const progress = total ? Math.round((closed / total) * 100) : 0;
                                
                                // Get fund name - try multiple sources
                                const fundName = company.displayFund || 
                                                company.fund || 
                                                company.fundCompany?.[0]?.fundName || 
                                                company.companyDetails?.fund ||
                                                '—';
                                
                                // Get industry/category - try multiple sources
                                const industry = company.displayCategory ||
                                                company.category || 
                                                company.industry || 
                                                company.sector || 
                                                company.fireside_category ||
                                                company.internal_category ||
                                                company.companyDetails?.industry ||
                                                company.companyDetails?.fireside_category ||
                                                '—';
                                
                                const open = company.esgOpenCount || 0;
                                const pending = company.esgPendingCount || 0;
                                const overdue = company.esgOverdueCount || 0;

                                return (
                                    <TableRow
                                        key={company.email || company._id}
                                        className={cn(
                                            "hover:bg-muted/50 cursor-pointer",
                                            isSelected && "bg-muted/30"
                                        )}
                                        onClick={() => onCompanyChange(company.email)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                                        {getInitials(company.companyName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="font-medium truncate">{company.companyName}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {company.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">
                                                {fundName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{industry}</TableCell>
                                        <TableCell><CircularProgress value={progress} /></TableCell>
                                        <TableCell className="tabular-nums">
                                            <span className="font-medium">{closed}</span>
                                            <span className="text-muted-foreground"> / {total}</span>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{open}</TableCell>
                                        <TableCell className="text-right tabular-nums">{pending}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {overdue > 0 ? (
                                                <Badge variant="destructive" className="font-normal">{overdue}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCompanyChange(company.email);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}