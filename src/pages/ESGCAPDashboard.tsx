import ComplianceScoreOverview from "@/components/esg-cap/dashboard/ComplianceScoreOverview";


export default function ESGCAPDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Score Overview</h1>
        <p className="text-muted-foreground">
          Portfolio-wide ESG CAP compliance dashboard with grade breakdown and scoring methodology.
        </p>
      </div>
      <ComplianceScoreOverview />
    </div>
  );
}