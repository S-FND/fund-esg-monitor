import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AggregationMetrics, TimeSeriesPoint } from '@/hooks/useAnalyticsDashboardData';
import { TrendingUp, Users, Package, Droplets, Zap, Trash2, Heart, Building2 } from 'lucide-react';

interface AggregationTabProps {
  current: AggregationMetrics;
  timeSeries: TimeSeriesPoint[];
  byIndustry: Record<string, AggregationMetrics>;
  byFund: Record<string, AggregationMetrics>;
  byRevenueStage: Record<string, AggregationMetrics>;
  periodType: 'quarterly' | 'annual';
}

const fmt = (v: number, unit = '') => {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}K${unit}`;
  if (v % 1 !== 0) return `${v.toFixed(1)}${unit}`;
  return `${v}${unit}`;
};

const StatCardSmall = ({ label, value, unit, icon: Icon }: { label: string; value: number; unit: string; icon?: any }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      </div>
      <p className="text-xl font-bold">{fmt(value, unit === '%' ? '%' : '')}</p>
      {unit && unit !== '%' && <p className="text-xs text-muted-foreground">{unit}</p>}
    </CardContent>
  </Card>
);

export const AggregationTab = ({ current, timeSeries, byIndustry, byFund, byRevenueStage, periodType }: AggregationTabProps) => {
  // For annual view, aggregate quarterly time-series data
  const quarterlyInAnnual = periodType === 'annual' 
    ? timeSeries.filter(t => t.quarter !== 'FY' && t.quarter !== 'Annual')
    : [];

  return (
    <div className="space-y-6">
      {/* ─── Business Information ─── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Business Information</h2>
          <Badge variant="outline" className="text-xs">{periodType === 'quarterly' ? 'Quarterly' : 'Annual'}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCardSmall label="Net Revenue" value={current.netRevenue} unit="₹ Cr" icon={TrendingUp} />
          <StatCardSmall label="Revenue from Tier-2+" value={current.revenueTier2Plus} unit="%" />
          <StatCardSmall label="Total Customers" value={current.totalCustomersServed} unit="" />
          <StatCardSmall label="Female Customers" value={current.uniqueFemaleCustomersPct} unit="%" />
        </div>
      </section>

      {/* ─── Employment & Compensation ─── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-esg-social" />
          <h2 className="text-base font-semibold">Employment & Compensation</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCardSmall label="Total Employment" value={current.totalEmployment} unit="" icon={Users} />
          <StatCardSmall label="Total Wages" value={current.totalGrossWages} unit="₹ Cr" />
          <StatCardSmall label="WC Employees" value={current.totalWcEmployees} unit="" />
          <StatCardSmall label="WC Wages" value={current.totalWcWages} unit="₹ Cr" />
          <StatCardSmall label="BC Employees" value={current.totalBcEmployees} unit="" />
          <StatCardSmall label="BC Wages" value={current.totalBcWages} unit="₹ Cr" />
          <StatCardSmall label="WC Male" value={current.wcMale} unit="" />
          <StatCardSmall label="WC Female" value={current.wcFemale} unit="" />
          <StatCardSmall label="BC Male" value={current.bcMale} unit="" />
          <StatCardSmall label="BC Female" value={current.bcFemale} unit="" />
          <StatCardSmall label="PwD %" value={current.pwdPct} unit="%" />
          <StatCardSmall label="Attrition" value={current.attritionRate} unit="%" />
          <StatCardSmall label="C-Level Total" value={current.cLevelTotal} unit="" />
          <StatCardSmall label="C-Level Female" value={current.cLevelFemale} unit="" />
          <StatCardSmall label="Board Total" value={current.boardTotal} unit="" />
          <StatCardSmall label="Board Female" value={current.boardFemale} unit="" />
          <StatCardSmall label="Board Independent" value={current.boardIndependent} unit="" />
          <StatCardSmall label="Jobs per ₹ Cr" value={current.totalEmployment > 0 && current.netRevenue > 0 ? Math.round((current.totalEmployment / current.netRevenue) * 100) / 100 : 0} unit="" icon={TrendingUp} />
        </div>
      </section>

      {/* ─── Packaging ─── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-esg-environmental" />
          <h2 className="text-base font-semibold">Packaging (Primary & Secondary)</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCardSmall label="Total Packaging" value={current.totalPackagingMT} unit="MT" icon={Package} />
          <StatCardSmall label="Recycled" value={current.totalPackagingRecycledMT} unit="MT" />
          <StatCardSmall label="EPR Targets" value={current.eprTargetsMT} unit="MT" />
          <StatCardSmall label="Primary Total" value={current.primaryTotalMT} unit="MT" />
          <StatCardSmall label="Primary Recyclable" value={current.primaryRecyclablePct} unit="%" />
          <StatCardSmall label="Secondary Total" value={current.secondaryTotalMT} unit="MT" />
          <StatCardSmall label="Secondary Recyclable" value={current.secondaryRecyclablePct} unit="%" />
          <StatCardSmall label="Plastic (Virgin)" value={current.primaryPlasticVirgin + current.secondaryPlasticVirgin} unit="MT" />
          <StatCardSmall label="Plastic (Recycled)" value={current.primaryPlasticRecycled + current.secondaryPlasticRecycled} unit="MT" />
          <StatCardSmall label="Non-Plastic" value={current.primaryNonPlastic + current.secondaryNonPlastic} unit="MT" />
        </div>
      </section>

      {/* ─── Annual Environmental ─── */}
      {periodType === 'annual' && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-5 h-5 text-esg-environmental" />
            <h2 className="text-base font-semibold">Environmental Metrics</h2>
            <Badge variant="outline" className="text-xs">Annual</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCardSmall label="Water Consumed" value={current.totalWaterConsumed} unit="K m³" icon={Droplets} />
            <StatCardSmall label="Wastewater Recycled" value={current.avgWastewaterRecycledPct} unit="%" />
            <StatCardSmall label="Energy Consumed" value={current.totalEnergyConsumed} unit="MWh" icon={Zap} />
            <StatCardSmall label="Renewable Energy" value={current.avgRenewableEnergyPct} unit="%" />
            <StatCardSmall label="Waste Generated" value={current.totalWasteGenerated} unit="MT" icon={Trash2} />
            <StatCardSmall label="Waste Recycled" value={current.avgWasteRecycledPct} unit="%" />
          </div>
        </section>
      )}

      {/* ─── Quarterly KPIs Aggregated into Annual ─── */}
      {periodType === 'annual' && quarterlyInAnnual.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">Quarterly KPIs (Aggregated for Annual)</h2>
            <Badge variant="outline" className="text-xs">{quarterlyInAnnual.length} Quarters</Badge>
          </div>
          <div className="space-y-4">
            {quarterlyInAnnual.map(q => (
              <div key={q.period}>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">{q.period}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <StatCardSmall label="Net Revenue" value={q.aggregation.netRevenue} unit="₹ Cr" icon={TrendingUp} />
                  <StatCardSmall label="Total Employment" value={q.aggregation.totalEmployment} unit="" icon={Users} />
                  <StatCardSmall label="WC Employees" value={q.aggregation.totalWcEmployees} unit="" />
                  <StatCardSmall label="BC Employees" value={q.aggregation.totalBcEmployees} unit="" />
                  <StatCardSmall label="Total Wages" value={q.aggregation.totalGrossWages} unit="₹ Cr" />
                  <StatCardSmall label="Total Packaging" value={q.aggregation.totalPackagingMT} unit="MT" icon={Package} />
                  <StatCardSmall label="Total Customers" value={q.aggregation.totalCustomersServed} unit="" />
                  <StatCardSmall label="Companies" value={q.companyCount} unit="" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Healthcare ─── */}
      {(current.healthcareConsultations > 0 || current.healthcareProductsOffered > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-status-error" />
            <h2 className="text-base font-semibold">Healthcare</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCardSmall label="Consultations / Screenings" value={current.healthcareConsultations} unit="" icon={Heart} />
            <StatCardSmall label="Products / Services" value={current.healthcareProductsOffered} unit="" />
          </div>
        </section>
      )}
    </div>
  );
};
