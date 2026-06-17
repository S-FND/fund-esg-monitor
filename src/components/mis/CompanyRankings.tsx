import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioRankings } from '@/hooks/usePortfolioRankings';
import { ArrowLeft, ArrowUpDown, Trophy, CheckCircle2, RefreshCw, Clock, Users, BarChart3 } from 'lucide-react';

type SortColumn = 'completeness' | 'consistency' | 'timeliness' | 'average';
type SortDirection = 'asc' | 'desc';

const getOrdinalSuffix = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const PercentileBadge = ({ value, type }: { value: number; type: 'completeness' | 'consistency' | 'timeliness' | 'average' }) => {
  const colorMap = {
    completeness: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-400' },
    consistency: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-400' },
    timeliness: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', bar: 'bg-blue-400' },
    average: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', bar: 'bg-purple-400' },
  };
  const c = colorMap[type];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${c.bg}`}>
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-sm font-semibold ${c.text}`}>{value}{getOrdinalSuffix(value)}</span>
    </div>
  );
};

const CompanyRankings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const year = parseInt(searchParams.get('year') || '2025');
  const quarter = searchParams.get('quarter') || 'Q4';

  const { rankings, isLoading } = usePortfolioRankings(year, quarter);
  const [sortColumn, setSortColumn] = useState<SortColumn>('completeness');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Compute average percentile for each company
  const rankingsWithAvg = rankings.map(r => ({
    ...r,
    averagePercentile: Math.round((r.completenessPercentile + r.consistencyPercentile + r.timelinessPercentile) / 3),
  }));

  const sortedRankings = [...rankingsWithAvg].sort((a, b) => {
    const keyMap: Record<SortColumn, string> = {
      completeness: 'completenessPercentile',
      consistency: 'consistencyPercentile',
      timeliness: 'timelinessPercentile',
      average: 'averagePercentile',
    };
    const key = keyMap[sortColumn];
    const diff = (a as any)[key] - (b as any)[key];
    return sortDirection === 'desc' ? -diff : diff;
  });

  const SortableHeader = ({ column, label, icon: Icon, iconColor }: { column: SortColumn; label: string; icon: typeof CheckCircle2; iconColor: string }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center justify-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-xs font-medium">{label}</span>
        <ArrowUpDown className={`w-3 h-3 ${sortColumn === column ? 'text-foreground' : 'text-muted-foreground/50'}`} />
        {sortColumn === column && (
          <span className="text-[10px] text-muted-foreground">
            {sortDirection === 'desc' ? '↓' : '↑'}
          </span>
        )}
      </div>
    </TableHead>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-semibold">Company Rankings</h1>
          </div>
          <Badge variant="outline" className="text-xs">
            {quarter} {year}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {rankings.length} companies
          </Badge>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 flex-wrap">
          {([
            { col: 'completeness' as SortColumn, label: 'Completeness', icon: CheckCircle2, color: 'text-amber-500', activeBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
            { col: 'consistency' as SortColumn, label: 'Consistency', icon: RefreshCw, color: 'text-emerald-500', activeBg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
            { col: 'timeliness' as SortColumn, label: 'Timeliness', icon: Clock, color: 'text-blue-500', activeBg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
            { col: 'average' as SortColumn, label: 'Average Score', icon: BarChart3, color: 'text-purple-500', activeBg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' },
          ]).map(({ col, label, icon: Icon, color, activeBg }) => (
            <Button
              key={col}
              variant="outline"
              size="sm"
              className={`gap-1.5 ${sortColumn === col ? activeBg : ''}`}
              onClick={() => handleSort(col)}
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              {label}
              {sortColumn === col && (
                <span className="text-[10px]">{sortDirection === 'desc' ? '↓' : '↑'}</span>
              )}
            </Button>
          ))}
        </div>

        {/* Rankings Table */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : rankings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No company data available for rankings.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-xs text-center">Rank</TableHead>
                      <TableHead className="text-xs min-w-[160px]">Company</TableHead>
                      <TableHead className="text-xs">Industry</TableHead>
                      <SortableHeader column="average" label="Average Score" icon={BarChart3} iconColor="text-purple-500" />
                      <SortableHeader column="completeness" label="Completeness" icon={CheckCircle2} iconColor="text-amber-500" />
                      <SortableHeader column="consistency" label="Consistency" icon={RefreshCw} iconColor="text-emerald-500" />
                      <SortableHeader column="timeliness" label="Timeliness" icon={Clock} iconColor="text-blue-500" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRankings.map((company, i) => (
                      <TableRow key={company.companyId} className="hover:bg-muted/30">
                        <TableCell className="text-center">
                          <span className={`text-sm font-semibold ${i < 3 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                            {i + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{company.brand}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {company.industry}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <PercentileBadge value={company.averagePercentile} type="average" />
                        </TableCell>
                        <TableCell className="text-center">
                          <PercentileBadge value={company.completenessPercentile} type="completeness" />
                        </TableCell>
                        <TableCell className="text-center">
                          <PercentileBadge value={company.consistencyPercentile} type="consistency" />
                        </TableCell>
                        <TableCell className="text-center">
                          <PercentileBadge value={company.timelinessPercentile} type="timeliness" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CompanyRankings;
