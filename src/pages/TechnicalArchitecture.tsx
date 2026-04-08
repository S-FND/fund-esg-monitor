
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cloud, Database, Lock, ShieldCheck, Server } from 'lucide-react';

const platformFeatures = [
  "Cloud-based SaaS platform (AMS), modular & secure",
  "Role-based access control",
  "Integrations with ERP, HRMS, IoT",
  "Mobile-ready dashboards",
];

const architectureCards = [
  {
    title: "Virtual Private Cloud on AWS",
    description:
      "Increased security and manageability with dedicated VPC hosting in a segmented non-promiscuous mode.",
    icon: Cloud,
    tags: ["AWS", "Isolated network", "Non-promiscuous"],
  },
  {
    title: "Data Back Up",
    description:
      "Near real-time backups across AWS Availability Zones. Daily Cloud Snapshots retained for 7 days — zero data loss.",
    icon: Database,
    tags: ["Multi-AZ", "7-day snapshots", "Real-time"],
  },
  {
    title: "Encryption",
    description:
      "AES 256-bit encryption for data at rest. HTTPS with TLS 1.2 for all data in transit.",
    icon: Lock,
    tags: ["AES-256", "TLS 1.2", "At rest & in transit"],
  },
  {
    title: "Database Compliance",
    description:
      "MongoDB Atlas with enterprise-grade compliance covering ISO 27001, SOX, GDPR, HIPAA, PCI, and VAPTs.",
    icon: ShieldCheck,
    tags: ["ISO 27001", "GDPR", "HIPAA", "PCI", "SOX"],
  },
];

function BrandedArchitectureWidget() {
  return (
    <div className="rounded-2xl p-6 space-y-3" style={{ background: '#0d1a14' }}>
      <div>
        <p className="text-lg font-semibold text-white">Technical Architecture</p>
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4ade80' }}>
          fandoro.ai · Security &amp; Infrastructure
        </p>
      </div>

      {architectureCards.map((item, idx) => {
        const Icon = item.icon;
        return (
          <React.Fragment key={item.title}>
            {idx > 0 && (
              <div className="flex items-center ml-8">
                <div className="w-px h-3" style={{ background: '#2a4030' }} />
              </div>
            )}
            <div className="flex items-stretch gap-0">
              <div
                className="flex flex-col items-center justify-center gap-1 rounded-l-lg border border-r-0 px-2 py-3"
                style={{
                  width: 60,
                  minWidth: 60,
                  background: '#1a2e20',
                  borderColor: '#2a4030',
                }}
              >
                <Icon className="h-5 w-5" style={{ color: '#4ade80' }} />
                <span
                  className="text-[9px] font-semibold uppercase tracking-wide text-center leading-tight"
                  style={{ color: '#4ade80' }}
                >
                  {item.title.split(' ')[0]}
                </span>
              </div>
              <div
                className="flex-1 rounded-r-lg border p-3"
                style={{ background: '#132019', borderColor: '#2a4030' }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: '#f0fdf4' }}>
                  {item.title}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: '#86a892' }}>
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: '#0d2b1a',
                        border: '1px solid #2a4030',
                        color: '#4ade80',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <div
        className="flex justify-between items-center pt-3 mt-2"
        style={{ borderTop: '1px solid #1e3025' }}
      >
        <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>
          fandoro.ai
        </span>
      </div>
    </div>
  );
}

const TechnicalArchitecture = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b bg-card">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/fandoro-logo.png" alt="Fandoro Technologies" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight text-foreground">Fandoro</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Top section: Title + Branded Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Technical Architecture</h1>
              <div className="h-1 w-32 bg-primary mt-2 rounded" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Platform Highlights</h2>
              </div>
              <ul className="space-y-3">
                {platformFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-foreground font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Branded widget top-right */}
          <BrandedArchitectureWidget />
        </div>

        {/* Detailed cards below */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Infrastructure Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architectureCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-l-4 border-l-primary/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TechnicalArchitecture;
