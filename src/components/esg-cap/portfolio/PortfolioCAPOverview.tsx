import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileClock,
  RotateCcw,
  Eye,
  CalendarClock,
  Gauge,
  Filter as FilterIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { portfolioCompanies as defaultCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import { ESGCapItem } from "../CAPTable";


/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface PortfolioCompanyLite {
  id: number | string;
  name: string;
  sector: string;
  fundId: number;
  fundName: string;
  stage?: string;
  employees?: {
    founders?: { male: number; female: number; others: number };
    others?: { male: number; female: number; others: number };
  };
}

export interface PortfolioCAPOverviewProps {
  companies?: PortfolioCompanyLite[];
  capItems?: ESGCapItem[];
  storageKey?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Reusable sub-components                                             */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  suffix?: string;
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, tone = "default", suffix }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {value}
            {suffix && <span className="text-sm text-muted-foreground ml-0.5">{suffix}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  stroke?: number;
}

export function CircularProgress({ value, size = 44, stroke = 4 }: CircularProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color =
    pct >= 75 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-red-500";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-muted"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all", color)}
          fill="none"
          stroke="currentColor"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold tabular-nums">{pct}%</span>
    </div>
  );
}

interface PortfolioFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  funds: { id: number; name: string }[];
  fundValue: string;
  onFundChange: (v: string) => void;
  industries: string[];
  industryValue: string;
  onIndustryChange: (v: string) => void;
  revenueBuckets: string[];
  revenueValue: string;
  onRevenueChange: (v: string) => void;
  onClear: () => void;
}

export function PortfolioFilterBar(props: PortfolioFilterBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <FilterIcon className="h-4 w-4" />
          <span>Filters</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={props.onClear}>
            Clear
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Search Company</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={props.search}
                onChange={(e) => props.onSearchChange(e.target.value)}
                placeholder="Search by name..."
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fund</Label>
            <Select value={props.fundValue} onValueChange={props.onFundChange}>
              <SelectTrigger><SelectValue placeholder="All Funds" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {props.funds.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Industry</Label>
            <Select value={props.industryValue} onValueChange={props.onIndustryChange}>
              <SelectTrigger><SelectValue placeholder="All Industries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {props.industries.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Revenue</Label>
            <Select value={props.revenueValue} onValueChange={props.onRevenueChange}>
              <SelectTrigger><SelectValue placeholder="All Revenue" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Revenue</SelectItem>
                {props.revenueBuckets.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "esg-cap-items";

function loadCapItems(key: string): ESGCapItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ESGCapItem[]) : [];
  } catch {
    return [];
  }
}

function totalEmployees(c: PortfolioCompanyLite): number {
  const e = c.employees;
  if (!e) return 0;
  const sum = (o?: { male: number; female: number; others: number }) =>
    o ? o.male + o.female + o.others : 0;
  return sum(e.founders) + sum(e.others);
}

/** Deterministic revenue bucket derived from headcount so filter is dynamic
 *  yet consistent (no hardcoded per-company revenue data available). */
function revenueBucketFor(c: PortfolioCompanyLite): string {
  const n = totalEmployees(c);
  if (n < 25) return "< ₹1 Cr";
  if (n < 50) return "₹1 – 10 Cr";
  if (n < 100) return "₹10 – 50 Cr";
  return "₹50 Cr+";
}

const BUCKET_ORDER = ["< ₹1 Cr", "₹1 – 10 Cr", "₹10 – 50 Cr", "₹50 Cr+"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

interface CompanyCAPStats {
  total: number;
  closed: number;
  open: number;      // In Progress
  pending: number;   // Pending
  overdue: number;   // targetDate < today && !Completed
  progress: number;  // 0-100
}

function statsForItems(items: ESGCapItem[]): CompanyCAPStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let closed = 0, open = 0, pending = 0, overdue = 0;
  for (const it of items) {
    if (it.status === "completed") closed++;
    else if (it.status === "in_progress") open++;
    else if (it.status === "pending") pending++;
    if (it.status !== "completed" && it.targetDate) {
      const d = new Date(it.targetDate);
      if (!Number.isNaN(d.getTime()) && d < today) overdue++;
    }
  }
  const total = items.length;
  const progress = total ? Math.round((closed / total) * 100) : 0;
  return { total, closed, open, pending, overdue, progress };
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

type SortKey = "name" | "fund" | "industry" | "progress" | "open" | "pending" | "overdue";

export default function PortfolioCAPOverview({
  companies = defaultCompanies as PortfolioCompanyLite[],
  capItems,
  storageKey = STORAGE_KEY,
  title = "Portfolio",
  subtitle = "Track ESG CAP progress across all portfolio companies.",
  className,
}: PortfolioCAPOverviewProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ESGCapItem[]>(() => capItems ?? loadCapItems(storageKey));

  // Keep in sync with localStorage updates from ESG CAP page.
  useEffect(() => {
    if (capItems) { setItems(capItems); return; }
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) setItems(loadCapItems(storageKey));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [capItems, storageKey]);

  // Filter state
  const [search, setSearch] = useState("");
  const [fund, setFund] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [revenue, setRevenue] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  // Dynamic filter options
  const funds = useMemo(() => {
    const map = new Map<number, string>();
    companies.forEach((c) => map.set(c.fundId, c.fundName));
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [companies]);

  const industries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.sector))).sort(),
    [companies],
  );

  const revenueBuckets = useMemo(() => {
    const present = new Set(companies.map(revenueBucketFor));
    return BUCKET_ORDER.filter((b) => present.has(b));
  }, [companies]);

  // Per-company stats
  const rows = useMemo(() => {
    return companies.map((c) => {
      const cItems = items.filter((i) => i.companyId === c.id);
      const stats = statsForItems(cItems);
      return {
        company: c,
        revenue: revenueBucketFor(c),
        ...stats,
      };
    });
  }, [companies, items]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (q && !r.company.name.toLowerCase().includes(q)) return false;
      if (fund !== "all" && String(r.company.fundId) !== fund) return false;
      if (industry !== "all" && r.company.sector !== industry) return false;
      if (revenue !== "all" && r.revenue !== revenue) return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sort.key) {
        case "name": return a.company.name.localeCompare(b.company.name) * dir;
        case "fund": return a.company.fundName.localeCompare(b.company.fundName) * dir;
        case "industry": return a.company.sector.localeCompare(b.company.sector) * dir;
        case "progress": return (a.progress - b.progress) * dir;
        case "open": return (a.open - b.open) * dir;
        case "pending": return (a.pending - b.pending) * dir;
        case "overdue": return (a.overdue - b.overdue) * dir;
      }
    });
    return list;
  }, [rows, search, fund, industry, revenue, sort]);

  // Dashboard summary (across filtered items so it reflects filters)
  const filteredCompanyIds = new Set(filteredRows.map((r) => r.company.id));
  const scopedItems = items.filter((i) => filteredCompanyIds.has(i.companyId));

  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);

    let closed = 0, pendingReview = 0, resubmit = 0, overdue = 0, dueMonth = 0, partly = 0;
    scopedItems.forEach((it) => {
      if (it.status === "completed") closed++;
      if (it.status === "pending") pendingReview++;
      if (it.status === "rejected") resubmit++;
      if (it.targetDate && it.status !== "completed") {
        const d = new Date(it.targetDate);
        if (!Number.isNaN(d.getTime())) {
          if (d < today) overdue++;
          else if (d <= in30) dueMonth++;
        }
      }
    });
    filteredRows.forEach((r) => {
      if (r.total > 0 && r.closed > 0 && r.closed < r.total) partly++;
    });
    const compliance = scopedItems.length
      ? Math.round((closed / scopedItems.length) * 100)
      : 0;

    return {
      compliance,
      dueMonth,
      overdue,
      partly,
      resubmit,
      pendingReview,
      closed,
      totalCompanies: filteredRows.length,
    };
  }, [scopedItems, filteredRows]);

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const clearFilters = () => {
    setSearch(""); setFund("all"); setIndustry("all"); setRevenue("all");
  };

  const sortIndicator = (key: SortKey) => (sort.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "");

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Dashboard summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard label="Compliance Score" value={summary.compliance} suffix="%" icon={Gauge} tone="default" />
        <StatCard label="Due in Month" value={summary.dueMonth} icon={CalendarClock} tone="warning" />
        <StatCard label="Overdue" value={summary.overdue} icon={AlertTriangle} tone="danger" />
        <StatCard label="Partly Submitted" value={summary.partly} icon={FileClock} tone="info" />
        <StatCard label="Re-submit Requested" value={summary.resubmit} icon={RotateCcw} tone="warning" />
        <StatCard label="Pending Review" value={summary.pendingReview} icon={Clock} tone="muted" />
        <StatCard label="Closed" value={summary.closed} icon={CheckCircle2} tone="success" />
        <StatCard label="Total Companies" value={summary.totalCompanies} icon={Building2} tone="default" />
      </div>

      {/* Filters */}
      <PortfolioFilterBar
        search={search}
        onSearchChange={setSearch}
        funds={funds}
        fundValue={fund}
        onFundChange={setFund}
        industries={industries}
        industryValue={industry}
        onIndustryChange={setIndustry}
        revenueBuckets={revenueBuckets}
        revenueValue={revenue}
        onRevenueChange={setRevenue}
        onClear={clearFilters}
      />

      {/* Companies table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Portfolio Companies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No companies match the selected filters.</p>
              <Button variant="link" onClick={clearFilters}>Clear filters</Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>Company{sortIndicator("name")}</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("fund")}>Fund{sortIndicator("fund")}</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("industry")}>Industry{sortIndicator("industry")}</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("progress")}>Progress{sortIndicator("progress")}</TableHead>
                    <TableHead>Items Filled</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("open")}>Open{sortIndicator("open")}</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("pending")}>Pending{sortIndicator("pending")}</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("overdue")}>Overdue{sortIndicator("overdue")}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map(({ company, ...s }) => (
                    <TableRow key={company.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                              {initials(company.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{company.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {company.stage ?? "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{company.fundName}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{company.sector}</TableCell>
                      <TableCell><CircularProgress value={s.progress} /></TableCell>
                      <TableCell className="tabular-nums">
                        <span className="font-medium">{s.closed}</span>
                        <span className="text-muted-foreground"> / {s.total}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{s.open}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.pending}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.overdue > 0 ? (
                          <Badge variant="destructive" className="font-normal">{s.overdue}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/esg-dd/cap?company=${company.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
