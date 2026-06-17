import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompanyScore {
  brand: string;
  score: number;
}

interface ESGCategoryBreakdownProps {
  title: string;
  companies: CompanyScore[];
  onClose: () => void;
  onCategoryClick?: (categoryKey: string, categoryLabel: string, companyBrands: string[]) => void;
  lowCompletenessBrands?: Set<string>;
}

const CATEGORIES = [
  { key: 'AA', label: 'AA', range: '80–100', min: 80, max: 100, color: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700', headerBg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  { key: 'A', label: 'A', range: '60–79', min: 60, max: 79.99, color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700', headerBg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  { key: 'BB', label: 'BB', range: '40–59', min: 40, max: 59.99, color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700', headerBg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  { key: 'B', label: 'B', range: '20–39', min: 20, max: 39.99, color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700', headerBg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  { key: 'C', label: 'C', range: '0–19', min: 0, max: 19.99, color: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700', headerBg: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
];

/**
 * Compute percentile rank for each company within the cohort.
 * Highest scorer → 99th percentile, lowest → distributed accordingly.
 */
const assignPercentiles = (companies: CompanyScore[]): (CompanyScore & { percentile: number })[] => {
  if (companies.length === 0) return [];
  if (companies.length === 1) return [{ ...companies[0], percentile: 99 }];

  // Sort ascending by score, then by brand alphabetically for deterministic tie-breaking
  const sorted = [...companies].sort((a, b) => {
    const diff = a.score - b.score;
    return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
  });
  const n = sorted.length;

  return sorted.map((c, idx) => {
    const percentile = Math.round(((idx + 1) / n) * 99);
    return { ...c, percentile: Math.max(1, Math.min(99, percentile)) };
  });
};

const getCategoryForPercentile = (percentile: number): string => {
  if (percentile >= 80) return 'AA';
  if (percentile >= 60) return 'A';
  if (percentile >= 40) return 'BB';
  if (percentile >= 20) return 'B';
  return 'C';
};

export const ESGCategoryBreakdown = ({ title, companies, onClose, onCategoryClick, lowCompletenessBrands }: ESGCategoryBreakdownProps) => {
  const [showScores, setShowScores] = useState(false);

  const withPercentiles = assignPercentiles(companies);

  const categorized = CATEGORIES.map(cat => ({
    ...cat,
    companies: withPercentiles
      .filter(c => getCategoryForPercentile(c.percentile) === cat.key)
      .sort((a, b) => b.percentile - a.percentile),
  }));

  return (
    <Card className="border-primary/20 shadow-md animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{title} — Category Breakdown</CardTitle>
            <Badge variant="secondary" className="text-[10px]">n={companies.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="show-scores" checked={showScores} onCheckedChange={setShowScores} />
              <Label htmlFor="show-scores" className="text-xs cursor-pointer">Show Scores</Label>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {categorized.map(cat => (
            <div key={cat.key} className={`rounded-lg border ${cat.color} overflow-hidden`}>
              {/* Header */}
              <div
                className={`${cat.headerBg} px-3 py-2 text-white text-center ${showScores && onCategoryClick && cat.companies.length > 0 ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                onClick={() => {
                  if (showScores && onCategoryClick && cat.companies.length > 0) {
                    onCategoryClick(cat.key, cat.label, cat.companies.map(c => c.brand));
                  }
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-bold">{cat.label}</span>
                  {showScores && onCategoryClick && cat.companies.length > 0 && (
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  )}
                </div>
                {showScores && <div className="text-[10px] opacity-90">{cat.range}</div>}
              </div>
              {/* Company list */}
              <div className="p-2 space-y-1 min-h-[60px]">
                {cat.companies.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-2 italic">No companies</p>
                ) : (
                  cat.companies.map(c => {
                    const isLowCompleteness = lowCompletenessBrands?.has(c.brand);
                    return (
                      <div
                        key={c.brand}
                        className="flex items-center justify-between px-2 py-1 rounded text-xs bg-background/60 hover:bg-background transition-colors"
                        title={isLowCompleteness ? 'Less than 30% KPI completeness' : undefined}
                      >
                        <span className={`truncate font-medium ${isLowCompleteness ? 'text-red-600 dark:text-red-400' : ''}`}>{c.brand}</span>
                        {showScores && (
                          <span className={`ml-1 text-[10px] font-semibold ${isLowCompleteness ? 'text-red-600 dark:text-red-400' : cat.text} shrink-0`}>
                            {c.score.toFixed(1)} <span className="opacity-70">P{c.percentile}</span>
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                {cat.companies.length > 0 && (
                  <div className="text-center pt-1">
                    <Badge variant="outline" className="text-[9px]">{cat.companies.length} companies</Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
