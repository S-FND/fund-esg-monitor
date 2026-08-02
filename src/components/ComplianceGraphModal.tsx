import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ReferenceLine
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from 'sonner';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { http } from '@/utils/httpInterceptor';

interface SnapshotData {
  year: number;
  month: number;
  monthLabel: string;
  score: number;
}

interface ComplianceGraphModalProps {
  entityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getComplianceRating = (score: number = 0) => {
  if (score >= 81) return { grade: "AA", label: "On Track", color: "text-green-600", bgColor: "bg-green-100", minScore: 85 };
  if (score >= 61) return { grade: "A", label: "Stable", color: "text-emerald-600", bgColor: "bg-emerald-100", minScore: 61 };
  if (score >= 41) return { grade: "BB", label: "Needs Attention", color: "text-yellow-600", bgColor: "bg-yellow-100", minScore: 41 };
  if (score >= 21) return { grade: "B", label: "At Risk", color: "text-orange-600", bgColor: "bg-orange-100", minScore: 21 };
  return { grade: "C", label: "Critical", color: "text-red-600", bgColor: "bg-red-100", minScore: 0 };
};

const CHART_COLOR = '#10b77f';

export const ComplianceGraphModal: React.FC<ComplianceGraphModalProps> = ({
  entityId,
  open,
  onOpenChange,
}) => {
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [viewType, setViewType] = useState<'monthly' | 'quarterly'>('quarterly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && entityId) {
      fetchData(selectedYear);
    }
  }, [open, entityId]);

  useEffect(() => {
    if (open && entityId && selectedYear) {
      fetchData(selectedYear);
    }
  }, [selectedYear]);

  const fetchData = async (year: number | 'all') => {
    if (!entityId) {
      setError('No entity ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url = `esgdd/escap/compliance-snapshot/${entityId}`;

      if (year !== "all") {
        url += `?year=${year}`;
      }

      const response = await http.get(url);
  
      const data = response.data;

      // ✅ Flatten nested data into flat array
      const flatSnapshots: SnapshotData[] = [];
      data.snapshots?.forEach((yearData: any) => {
        yearData.months?.forEach((monthData: any) => {
          if (monthData.score !== null) {
            flatSnapshots.push({
              year: yearData.year,
              month: monthData.month,
              monthLabel: monthData.monthLabel,
              score: monthData.score,
            });
          }
        });
      });

      setSnapshots(flatSnapshots);
      setYears(data.years || []);
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
      setError(error.message || 'Failed to load data');
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  // Convert monthly data to quarterly
  const getQuarterlyData = useMemo(() => {
    const quarters = [
      { label: 'Q1', months: [1, 2, 3] },
      { label: 'Q2', months: [4, 5, 6] },
      { label: 'Q3', months: [7, 8, 9] },
      { label: 'Q4', months: [10, 11, 12] }
    ];

    if (selectedYear === 'all') {
      const yearsList = [...new Set(snapshots.map(d => d.year))];
      return quarters.map(quarter => {
        const entry: any = { quarter: quarter.label };
        yearsList.forEach(year => {
          const quarterScores = snapshots.filter(d => 
            d.year === year && quarter.months.includes(d.month)
          );
          const avgScore = quarterScores.length > 0 
            ? Math.round((quarterScores.reduce((sum, d) => sum + d.score, 0) / quarterScores.length) * 10) / 10
            : null;
          entry[`${year}`] = avgScore;
        });
        return entry;
      });
    } else {
      const year = selectedYear as number;
      return quarters.map(quarter => {
        const quarterScores = snapshots.filter(d => 
          d.year === year && quarter.months.includes(d.month)
        );
        const avgScore = quarterScores.length > 0 
          ? Math.round((quarterScores.reduce((sum, d) => sum + d.score, 0) / quarterScores.length) * 10) / 10
          : null;
        const rating = avgScore !== null ? getComplianceRating(avgScore) : null;
        return {
          quarter: quarter.label,
          score: avgScore,
          grade: rating?.grade || null,
          color: rating?.color || null,
          bgColor: rating?.bgColor || null,
          label: rating?.label || null,
        };
      });
    }
  }, [snapshots, selectedYear]);

  // Prepare chart data based on view type
  const chartData = useMemo(() => {
    if (viewType === 'quarterly') {
      return getQuarterlyData;
    } else {
      if (selectedYear === 'all') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const grouped = months.map((label, index) => {
          const monthNum = index + 1;
          const entry: any = { month: label };
          snapshots.filter(d => d.month === monthNum).forEach(d => {
            entry[`${d.year}`] = d.score;
          });
          return entry;
        });
        return grouped;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map((label, index) => {
          const found = snapshots.find(d => d.month === index + 1);
          const score = found?.score ?? null;
          const rating = score !== null ? getComplianceRating(score) : null;
          return {
            month: label,
            score: score,
            grade: rating?.grade || null,
            color: rating?.color || null,
          };
        });
      }
    }
  }, [snapshots, selectedYear, viewType, getQuarterlyData]);

  const seriesKeys = useMemo(() => {
    if (selectedYear === 'all') {
      const uniqueYears = [...new Set(snapshots.map(d => d.year))];
      const sortedYears = uniqueYears.sort((a, b) => a - b);
      // return sortedYears.map((year) => ({
      //   key: `${year}`,
      //   name: `${year}`,
      //   color: CHART_COLOR,
      // }));
      return [{ key: 'score', name: 'Compliance Score', color: CHART_COLOR }];
    } else {
      return [{ key: 'score', name: 'Compliance Score', color: CHART_COLOR }];
    }
  }, [snapshots, selectedYear]);

  const formatYAxisTick = (value: number) => {
    if (value >= 81) return 'AA';
    if (value >= 61) return 'A';
    if (value >= 41) return 'BB';
    if (value >= 21) return 'B';
    return 'C';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0]?.value;
      const rating = score !== null && score !== undefined ? getComplianceRating(score) : null;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border min-w-[150px]">
          <p className="font-medium text-sm text-gray-600">{label}</p>
          {score !== null && score !== undefined && (
            <div className="mt-1">
              <p className="text-sm">
                {/* Score: <span className="font-bold">{score.toFixed(1)}%</span> */}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-lg font-bold ${rating?.color}`}>{rating?.grade}</span>
                <Badge className={`${rating?.bgColor} ${rating?.color} border-0 text-xs`}>{rating?.label}</Badge>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const currentScore = snapshots.length > 0 ? snapshots[snapshots.length - 1]?.score : null;
  const previousScore = snapshots.length > 1 ? snapshots[snapshots.length - 2]?.score : null;
  const trend = currentScore !== null && previousScore !== null ? currentScore - previousScore : null;
  const currentRating = currentScore !== null ? getComplianceRating(currentScore) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Compliance Score Trend</DialogTitle>
            {currentScore !== null && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${currentRating?.color}`}>{currentRating?.grade}</span>
                  <span className="text-sm text-muted-foreground">Grade</span>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex items-center gap-2">
                  {/* <span className="text-2xl font-bold text-green-600">{currentScore?.toFixed(1)}%</span> */}
                  {trend !== null && (
                    <span className={`text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {trend > 0 ? <TrendingUp className="h-4 w-4 inline" /> : trend < 0 ? <TrendingDown className="h-4 w-4 inline" /> : <Minus className="h-4 w-4 inline" />}
                      {trend > 0 ? '+' : ''}{trend?.toFixed(1)}%
                    </span>
                  )}
                </div>
                <Badge className={`${currentRating?.bgColor} ${currentRating?.color} border-0`}>{currentRating?.label}</Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-4 items-center mb-4">
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(val === 'all' ? 'all' : parseInt(val))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1 border rounded-md p-1">
            <Button variant={viewType === 'monthly' ? 'default' : 'ghost'} size="sm" onClick={() => setViewType('monthly')} className="h-8">Monthly</Button>
            <Button variant={viewType === 'quarterly' ? 'default' : 'ghost'} size="sm" onClick={() => setViewType('quarterly')} className="h-8">Quarterly</Button>
          </div>

          <div className="flex gap-1 border rounded-md p-1">
            <Button variant={chartType === 'line' ? 'default' : 'ghost'} size="sm" onClick={() => setChartType('line')} className="h-8">Line</Button>
            <Button variant={chartType === 'bar' ? 'default' : 'ghost'} size="sm" onClick={() => setChartType('bar')} className="h-8">Bar</Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => fetchData(selectedYear)} className="ml-auto">Refresh</Button>
        </div>

        {viewType === 'quarterly' && selectedYear !== 'all' && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {getQuarterlyData.map((q, index) => (
              <Card key={index} className={`text-center p-3 ${q.bgColor || 'bg-gray-50'} border-0 shadow-sm`}>
                <CardContent className="p-0">
                  <div className="text-xs text-muted-foreground">{q.quarter}</div>
                  <div className={`text-2xl font-bold ${q.color || 'text-gray-400'}`}>{q.grade || '—'}</div>
                  {/* <div className="text-xs font-medium text-muted-foreground">{q.score !== null ? `${q.score}%` : 'No data'}</div> */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error ? (
          <div className="h-64 flex items-center justify-center text-red-500">Error: {error}</div>
        ) : loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : snapshots.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">No data available. Compliance scores will appear after the first monthly snapshot.</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={viewType === 'quarterly' ? 'quarter' : 'month'} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={formatYAxisTick} ticks={[0, 21, 41, 61, 81, 100]} label={{ value: 'Grade', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#666' } }} />
                <ReferenceLine y={81} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={61} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={41} stroke="#eab308" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={21} stroke="#f97316" strokeDasharray="3 3" strokeWidth={1} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {seriesKeys.map(({ key, name, color }) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={color} name={name} connectNulls strokeWidth={2.5} dot={{ r: 5, strokeWidth: 2, fill: color }} activeDot={{ r: 7, fill: color }} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={viewType === 'quarterly' ? 'quarter' : 'month'} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={formatYAxisTick} ticks={[0, 21, 41, 61, 81, 100]} label={{ value: 'Grade', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#666' } }} />
                <ReferenceLine y={81} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={61} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={41} stroke="#eab308" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={21} stroke="#f97316" strokeDasharray="3 3" strokeWidth={1} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {seriesKeys.map(({ key, name, color }) => (
                  <Bar key={key} dataKey={key} fill={color} name={name} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}

      </DialogContent>
    </Dialog>
  );
};