import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Package, Droplet, Zap, Trash2, ShieldAlert, HandHeart, Leaf, TrendingUp } from 'lucide-react';
import type { AnalyticsResult } from '../lib/portfolio-helpers';

interface Props {
  result: AnalyticsResult;
  label: string;
  scoreAverages?: {
    compositeScore: number;
    environmentScore: number;
    socialScore: number;
    governanceScore: number;
  };
}

const fmt = (n: number, digits = 0) =>
  n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

interface Stat {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'positive' | 'negative';
}

export const PortfolioStatCards = ({ result, label, scoreAverages }: Props) => {
  const t = result.totals;
  const a = result.averages;
  const scoreSource = scoreAverages ?? a;

  const aggregations: Stat[] = [
    { label: 'Companies Reporting', value: fmt(t.companyCount), icon: Building2 },
    { label: 'Total Net Revenue', value: `₹${fmt(t.netRevenue, 1)} Cr`, icon: TrendingUp },
    { label: 'Total Employees', value: fmt(t.totalEmployees), hint: `${fmt(t.femaleEmployees)} female`, icon: Users },
    { label: 'CSR Spend', value: `₹${fmt(t.csrSpendINR)}`, icon: HandHeart },
    { label: 'Packaging Used', value: `${fmt(t.totalPackagingMT, 1)} MT`, hint: `Virgin ${fmt(t.virginPlasticMT, 1)} MT`, icon: Package },
    { label: 'Water Consumed', value: `${fmt(t.totalWaterKL, 1)} KL`, icon: Droplet },
    { label: 'Energy Consumed', value: `${fmt(t.totalEnergyKWh, 1)} kWh`, icon: Zap },
    { label: 'Waste Generated', value: `${fmt(t.totalWasteMT, 1)} MT`, icon: Trash2 },
    { label: 'Total Incidents', value: fmt(t.incidentsTotal), icon: ShieldAlert },
  ];

  const scores: Stat[] = [
    { label: 'ESG Composite (avg)', value: fmt(scoreSource.compositeScore, 1), icon: Leaf },
    { label: 'Environment (avg)', value: fmt(scoreSource.environmentScore, 1), icon: Leaf },
    { label: 'Social (avg)', value: fmt(scoreSource.socialScore, 1), icon: Users },
    { label: 'Governance (avg)', value: fmt(scoreSource.governanceScore, 1), icon: ShieldAlert },
  ];

  const rates: Stat[] = [
    { label: 'Gender Diversity', value: `${fmt(a.genderDiversityPct, 1)}%`, icon: Users },
    { label: 'Women in Leadership', value: `${fmt(a.womenInLeadershipPct, 1)}%`, icon: Users },
    { label: 'Recycled Content', value: `${fmt(a.recycledContentPct, 1)}%`, icon: Package },
    { label: 'Water Recycling', value: `${fmt(a.waterRecyclingPct, 1)}%`, icon: Droplet },
    { label: 'Renewable Energy', value: `${fmt(a.renewableEnergyPct, 1)}%`, icon: Zap },
    { label: 'Waste Diversion', value: `${fmt(a.wasteDiversionPct, 1)}%`, icon: Trash2 },
    { label: 'Policy Adoption', value: `${fmt(a.policyAdoptionPct, 1)}%`, icon: ShieldAlert },
    { label: 'Training Coverage', value: `${fmt(a.trainingCoveragePct, 1)}%`, icon: ShieldAlert },
  ];

  const Section = ({ title, items }: { title: string; items: Stat[] }) => (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                {s.hint && <div className="text-[10px] text-muted-foreground mt-0.5">{s.hint}</div>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground">
        Snapshot for <span className="font-medium text-foreground">{label}</span> across {t.companyCount} invested companies.
      </div>
      <Section title="Portfolio Aggregations" items={aggregations} />
      <Section title="ESG Scores" items={scores} />
      <Section title="Sustainability & Governance Rates" items={rates} />
    </div>
  );
};
