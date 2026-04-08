
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
  },
  {
    title: "Data Back Up",
    description:
      "Enhanced reliability with near real-time backups maintained in another AWS Availability Zone. Every day, Cloud Snapshots are taken and stored for the previous seven days to ensure no data loss ever.",
    icon: Database,
  },
  {
    title: "Encryption",
    description:
      "AES 256 bit encryption for data at Rest and HTTPS with TLS 1.2 encryption for data in transit.",
    icon: Lock,
  },
  {
    title: "Database Compliance",
    description:
      "Enhanced security mechanism using MongoDB Atlas, which is compliant with ISO 27001, SOX, GDPR, Health Insurance Portability, and HIPAA, PCI, VAPTs, etc.",
    icon: ShieldCheck,
  },
];

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
        <div>
          <h1 className="text-3xl font-bold">Technical Architecture</h1>
          <div className="h-1 w-32 bg-destructive mt-2 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Platform Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Platform Highlights</h2>
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

          {/* Right: Architecture Details */}
          <div className="lg:col-span-2 space-y-4">
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
