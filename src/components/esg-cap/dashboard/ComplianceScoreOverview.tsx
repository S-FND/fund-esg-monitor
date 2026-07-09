import { useMemo, useState, useEffect } from "react";
import { ChevronDown, Info, Users, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CAPPriority, ESGCapItem } from "@/components/esg-cap/CAPTable";

/* ==================================================================
 * Grade configuration — single source of truth for colors + ranges
 * ================================================================== */

export interface GradeConfig {
  key: "AA" | "A" | "BB" | "B" | "C";
  min: number;
  max: number;
  status: string;
  bg: string;
  border: string;
  text: string;
  headerBg: string;
  chipBg: string;
}

export const GRADE_CONFIG: GradeConfig[] = [
  {
    key: "AA", min: 85, max: 100, status: "On Track",
    bg: "bg-[#d5f0de] dark:bg-emerald-950/30",
    border: "border-[#bfe6cc] dark:border-emerald-900",
    text: "text-[#1f7a44] dark:text-emerald-300",
    headerBg: "bg-[#4ec37a]",
    chipBg: "bg-[#eaf7ef] dark:bg-emerald-950/50",
  },
  {
    key: "A", min: 70, max: 84, status: "Stable",
    bg: "bg-[#dbe7fb] dark:bg-blue-950/30",
    border: "border-[#c3d6f5] dark:border-blue-900",
    text: "text-[#2559c4] dark:text-blue-300",
    headerBg: "bg-[#4a80eb]",
    chipBg: "bg-[#ecf2fd] dark:bg-blue-950/50",
  },
  {
    key: "BB", min: 55, max: 69, status: "Needs Attention",
    bg: "bg-[#fbeac2] dark:bg-amber-950/30",
    border: "border-[#f5dfa2] dark:border-amber-900",
    text: "text-[#a06b12] dark:text-amber-300",
    headerBg: "bg-[#e9a635]",
    chipBg: "bg-[#fdf5df] dark:bg-amber-950/50",
  },
  {
    key: "B", min: 40, max: 54, status: "At Risk",
    bg: "bg-[#fbd8bf] dark:bg-orange-950/30",
    border: "border-[#f7c9a3] dark:border-orange-900",
    text: "text-[#a94a13] dark:text-orange-300",
    headerBg: "bg-[#ea7a2b]",
    chipBg: "bg-[#fdeadb] dark:bg-orange-950/50",
  },
  {
    key: "C", min: 0, max: 39, status: "Critical",
    bg: "bg-[#f9d3d8] dark:bg-red-950/30",
    border: "border-[#f4b8bf] dark:border-red-900",
    text: "text-[#b8283a] dark:text-red-300",
    headerBg: "bg-[#e64a5e]",
    chipBg: "bg-[#fce6e9] dark:bg-red-950/50",
  },
];

export function gradeFor(score: number): GradeConfig {
  return GRADE_CONFIG.find((g) => score >= g.min && score <= g.max) ?? GRADE_CONFIG[GRADE_CONFIG.length - 1];
}

/* ==================================================================
 * Compliance Score calculation (FIXED)
 * ================================================================== */

export const PRIORITY_WEIGHT: Record<CAPPriority, number> = {
  High: 60,
  Medium: 30,
  Low: 10,
};

const ASSUMED_TIMELINE_DAYS = 90;
const MS_DAY = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / MS_DAY);
}

/** Item score: 100 if completed, otherwise 0 */
export function calcItemScore(item: ESGCapItem): number {
  // Check if item is completed based on status
  const isComplete = item.status === "completed" || 
                     item.investorStatus === "closed" ||
                     item.companyStatus === "closed";
  return isComplete ? 100 : 0;
}

/** Overall compliance score - only CS items count */
export function calcComplianceScore(items: ESGCapItem[]): { score: number; applicable: number } {
  // Filter only CS items
  const applicable = items.filter((i) => i.dealCondition === "CS" || i.CS === "CS");
  
  if (applicable.length === 0) {
    return { score: 0, applicable: 0 };
  }

  let weighted = 0;
  let weightSum = 0;
  
  for (const item of applicable) {
    const w = PRIORITY_WEIGHT[item.priority] ?? 30;
    const score = calcItemScore(item);
    weighted += score * w;
    weightSum += w;
  }
  
  return {
    score: weightSum > 0 ? Math.round(weighted / weightSum) : 0,
    applicable: applicable.length,
  };
}

/* ==================================================================
 * Types
 * ================================================================== */

export interface ComplianceCompany {
  id: number | string;
  name: string;
}

export interface ComplianceScoreOverviewProps {
  companies?: ComplianceCompany[];
  capItems?: ESGCapItem[];
  scores?: Record<string | number, number>;
  className?: string;
}

/* ==================================================================
 * Sub-components
 * ================================================================== */

interface GradeColumnProps {
  grade: GradeConfig;
  entries: { id: string | number; name: string; score: number }[];
  showScores: boolean;
}

function GradeColumn({ grade, entries, showScores }: GradeColumnProps) {
  return (
    <div className={cn("rounded-lg border overflow-hidden flex flex-col", grade.border, grade.bg)}>
      <div className={cn("px-3 py-2 text-white font-bold text-center text-base tracking-wide", grade.headerBg)}>
        {grade.key}
      </div>
      <div className="p-1.5 flex-1 space-y-1 min-h-[120px]">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No companies</p>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className={cn(
                "rounded-md border px-2 py-1 text-sm flex items-center justify-between gap-2 transition-colors hover:shadow-sm",
                grade.chipBg, grade.border,
              )}
            >
              <span className="truncate font-medium text-black dark:text-white">{e.name}</span>
              {showScores && (
                <span className={cn("text-xs font-semibold tabular-nums shrink-0", grade.text)}>
                  {e.score}
                </span>
              )}
            </div>
          ))
        )}
      </div>
      <div className="px-3 py-2 text-center text-xs text-muted-foreground">
        {entries.length} {entries.length === 1 ? "Company" : "Companies"}
      </div>
    </div>
  );
}

function PriorityWeightCards() {
  const rows: { priority: CAPPriority; weight: number; tone: string }[] = [
    { priority: "High", weight: PRIORITY_WEIGHT.High, tone: "border-red-200 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300" },
    { priority: "Medium", weight: PRIORITY_WEIGHT.Medium, tone: "border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300" },
    { priority: "Low", weight: PRIORITY_WEIGHT.Low, tone: "border-sky-200 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {rows.map((r) => (
        <div key={r.priority} className={cn("rounded-lg border p-3 text-center", r.tone)}>
          <div className="text-xs uppercase tracking-wide opacity-80">{r.priority}</div>
          <div className="text-2xl font-bold tabular-nums">{r.weight}</div>
        </div>
      ))}
    </div>
  );
}

function StatusCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {GRADE_CONFIG.map((g) => (
        <div key={g.key} className={cn("rounded-md border p-2.5", g.border, g.bg)}>
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-sm font-bold", g.text)}>{g.key}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{g.min}–{g.max}</span>
          </div>
          <div className={cn("text-xs font-medium", g.text)}>{g.status}</div>
        </div>
      ))}
    </div>
  );
}

function MethodologyContent() {
  return (
    <div className="space-y-6 pt-2">
      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">1</span>
          Applicable Items
        </h3>
        <p className="text-sm text-muted-foreground">Only <b>CS (Compliance Score)</b> items contribute to the score.</p>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
          <li>Excluded: CP items</li>
          <li>Excluded: Roadmap items</li>
          <li>Excluded: Upcoming items</li>
          <li>Excluded: Dropped items</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">2</span>
          Completion Rules
        </h3>
        <p className="text-sm text-muted-foreground">A CS item is considered complete when:</p>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
          <li>Status is <b>completed</b> or <b>closed</b></li>
          <li>Investor status is <b>closed</b></li>
          <li>Company status is <b>closed</b></li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">3</span>
          Priority Weightage
        </h3>
        <PriorityWeightCards />
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">4</span>
          Overall Compliance Formula
        </h3>
        <div className="rounded-md border-l-4 border-primary bg-muted/40 p-4">
          <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
{`Overall Compliance Score =
    Σ(Item Score × Priority Weight)
  ÷
    Σ(Priority Weight of applicable CS items)`}
          </pre>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">5</span>
          Status Interpretation
        </h3>
        <StatusCards />
      </section>
    </div>
  );
}

/* ==================================================================
 * Main component
 * ================================================================== */

export default function ComplianceScoreOverview({
  companies: propCompanies,
  capItems: propCapItems,
  scores: propScores,
  className,
}: ComplianceScoreOverviewProps) {
  const [showScores, setShowScores] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiCompanies, setApiCompanies] = useState<ComplianceCompany[]>([]);
  const [apiCapItems, setApiCapItems] = useState<ESGCapItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const hasExternalData = propCompanies !== undefined && propCapItems !== undefined;

  // Fetch data from API if no external data provided
  useEffect(() => {
    if (hasExternalData) return;

    const fetchData = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/companyInfo/dashboard/esgcap`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        if (!json.status) throw new Error("API returned status false");

        const rawCompanies = json.data || [];
        const mapped = rawCompanies.map((c: any) => ({
          id: c._id,
          name: c.companyName,
        }));

        const allItems: ESGCapItem[] = [];
        rawCompanies.forEach((c: any) => {
          if (c._planItems && c._planItems.length) {
            c._planItems.forEach((item: any) => {
              allItems.push({
                ...item,
                companyId: c._id,
              } as ESGCapItem);
            });
          }
        });

        setApiCompanies(mapped);
        setApiCapItems(allItems);
      } catch (err: any) {
        console.error("Failed to fetch compliance data:", err);
        setApiError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasExternalData]);

  const companies = hasExternalData ? propCompanies! : apiCompanies;
  const capItems = hasExternalData ? propCapItems! : apiCapItems;
  const scores = propScores || {};

  const graded = useMemo(() => {
    if (companies.length === 0) return [];

    return companies.map((c) => {
      const companyItems = capItems.filter((i) => i.companyId === c.id);
      const result = calcComplianceScore(companyItems);
      const score = scores?.[c.id] ?? result.score;
      return { id: c.id, name: c.name, score, grade: gradeFor(score) };
    });
  }, [companies, capItems, scores]);

  const byGrade = useMemo(() => {
    const map = new Map<GradeConfig["key"], typeof graded>();
    GRADE_CONFIG.forEach((g) => map.set(g.key, []));
    graded.forEach((e) => {
      const arr = map.get(e.grade.key)!;
      arr.push(e);
    });
    map.forEach((arr) => arr.sort((a, b) => b.score - a.score));
    return map;
  }, [graded]);

  const total = graded.length;

  // Loading state
  if (loading && !hasExternalData) {
    return (
      <div className={cn("flex justify-center items-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading compliance data...</span>
      </div>
    );
  }

  // Error state
  if (apiError && !hasExternalData) {
    return (
      <div className={cn("text-center py-12 text-destructive", className)}>
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Failed to load compliance data</p>
        <p className="text-sm text-muted-foreground">{apiError}</p>
      </div>
    );
  }

  // Empty state
  if (total === 0 && !loading && !hasExternalData) {
    return (
      <div className={cn("text-center py-12 text-muted-foreground", className)}>
        <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>No companies found</p>
      </div>
    );
  }

  // Main render
  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2 flex-wrap">
              <TrendingUp className="h-5 w-5 text-primary" />
              Compliance Score → Grade Breakdown
              <Badge variant="secondary" className="font-normal tabular-nums">n={total}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Portfolio companies grouped by Compliance Score category.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor="show-scores" className="text-sm text-muted-foreground cursor-pointer">
              Show Scores
            </Label>
            <Switch id="show-scores" checked={showScores} onCheckedChange={setShowScores} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {GRADE_CONFIG.map((g) => (
              <GradeColumn
                key={g.key}
                grade={g}
                entries={byGrade.get(g.key) ?? []}
                showScores={showScores}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Accordion type="single" collapsible defaultValue="method">
            <AccordionItem value="method" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <Info className="h-5 w-5 text-primary" />
                  <span className="text-base font-semibold">How Compliance Score is Calculated</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <MethodologyContent />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

void ChevronDown; void AlertTriangle;