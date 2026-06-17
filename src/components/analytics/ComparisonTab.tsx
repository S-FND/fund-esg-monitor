import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, GitCompare, Target, Calendar, Building2 } from 'lucide-react';

const PlaceholderCard = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => (
  <Card className="border-dashed border-2 hover:border-primary/30 transition-colors">
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 rounded-full bg-muted mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">{description}</p>
      <Badge variant="outline" className="mt-4 text-xs">
        <Lock className="w-3 h-3 mr-1" />
        Coming Soon
      </Badge>
    </CardContent>
  </Card>
);

export const ComparisonTab = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 border border-dashed border-border p-4">
        <h2 className="text-sm font-semibold mb-1">Comparison Layer – Coming Soon</h2>
        <p className="text-xs text-muted-foreground">
          This section will enable peer comparison, industry benchmarking, portfolio-level views, 
          target vs actual tracking, and year-on-year delta analysis. The backend schema is ready 
          to plug in benchmarking datasets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Peer Comparison"
          description="Compare individual company ESG performance against cohort peers"
          icon={GitCompare}
        />
        <PlaceholderCard
          title="Industry Benchmarking"
          description="Benchmark portfolio companies against industry-standard ESG indices"
          icon={Building2}
        />
        <PlaceholderCard
          title="Portfolio Comparison (VC View)"
          description="Fund-level consolidated ESG performance across all portfolio companies"
          icon={Building2}
        />
        <PlaceholderCard
          title="Target vs Actual"
          description="Track KPI targets set at investment time versus actual reported values"
          icon={Target}
        />
        <PlaceholderCard
          title="Year-on-Year Delta %"
          description="Automated calculation of improvement or regression across all ESG metrics"
          icon={Calendar}
        />
      </div>
    </div>
  );
};
