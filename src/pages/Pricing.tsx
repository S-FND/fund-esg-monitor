
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Mail, ArrowLeft, Zap } from 'lucide-react';

type FeatureType = "core" | "advanced";

const pricingPlans = [
  {
    name: "Base",
    audience: "Inv + Startups",
    price: "Rs. 2L",
    category: "Machine Reading, AI Enabled SaaS",
    cta: "Get Started",
    ctaAction: "signup",
    features: [
      { label: "ESG DD", type: "core" as FeatureType },
      { label: "ESG CAP Tracker", type: "core" as FeatureType },
    ],
  },
  {
    name: "Advance",
    audience: "Startups",
    price: "Rs. 6L",
    category: "Machine Reading, AI Enabled SaaS",
    popular: true,
    cta: "Get Started",
    ctaAction: "signup",
    features: [
      { label: "Portfolio Monitoring", type: "advanced" as FeatureType },
      { label: "ESG DD", type: "core" as FeatureType },
      { label: "ESG CAP Tracker", type: "core" as FeatureType },
    ],
  },
  {
    name: "Pro",
    audience: "Investors",
    price: "Rs. 8L",
    category: "Agentic AI – Workflows",
    cta: "Contact Sales",
    ctaAction: "contact",
    features: [
      { label: "Realtime Valuation Impact Modeling", type: "advanced" as FeatureType },
      { label: "Portfolio Monitoring", type: "advanced" as FeatureType },
      { label: "ESG DD", type: "core" as FeatureType },
      { label: "ESG CAP Tracker", type: "core" as FeatureType },
    ],
  },
];

function BrandedPricingSummary() {
  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0d1a14' }}>
      <div>
        <p className="text-lg font-semibold text-white">Pricing Model</p>
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4ade80' }}>
          fandoro.ai · Plans &amp; Pricing
        </p>
      </div>

      {pricingPlans.map((plan, idx) => (
        <React.Fragment key={plan.name}>
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
              <Zap className="h-5 w-5" style={{ color: '#4ade80' }} />
              <span
                className="text-[9px] font-semibold uppercase tracking-wide text-center leading-tight"
                style={{ color: '#4ade80' }}
              >
                {plan.name}
              </span>
            </div>
            <div
              className="flex-1 rounded-r-lg border p-3"
              style={{ background: '#132019', borderColor: '#2a4030' }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold" style={{ color: '#f0fdf4' }}>
                  {plan.name} ({plan.audience})
                </p>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ background: '#15803d', color: '#f0fdf4' }}
                >
                  {plan.price}/yr
                </span>
              </div>
              <p className="text-[10px] mb-2" style={{ color: '#86a892' }}>
                {plan.category}
              </p>
              <div className="flex flex-wrap gap-1">
                {plan.features.map((f) => (
                  <span
                    key={f.label}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: f.type === 'advanced' ? '#1a2e20' : '#0d2b1a',
                      border: '1px solid #2a4030',
                      color: f.type === 'advanced' ? '#fbbf24' : '#4ade80',
                    }}
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}

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

const Pricing = () => {
  const navigate = useNavigate();

  const handleCtaClick = (action: string) => {
    if (action === "signup") {
      navigate("/auth");
    } else if (action === "contact") {
      window.location.href = "mailto:sales@fandoro.com?subject=Enterprise%20Inquiry%20-%20Pro%20Plan";
    }
  };

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
        {/* Top: Title + Branded Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Pricing Model</h1>
            <div className="h-1 w-32 bg-primary mt-2 rounded" />
            <p className="text-muted-foreground mt-4">
              Choose the plan that fits your organization. All plans include machine reading and AI-enabled SaaS capabilities.
            </p>
          </div>
          <div className="lg:col-span-2">
            <BrandedPricingSummary />
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              onClick={() => handleCtaClick(plan.ctaAction)}
              className={`relative flex flex-col cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-border ${
                plan.popular
                  ? 'border-primary shadow-lg ring-2 ring-primary/20'
                  : 'hover:border-primary/40'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">({plan.audience})</p>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 items-center gap-6">
                <div className="w-full rounded-lg bg-primary text-primary-foreground text-center py-3 px-4">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-sm ml-1 opacity-80">/ year</span>
                </div>

                <div className="w-full space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <div
                      key={feature.label}
                      className={`flex items-center gap-2 rounded-md px-4 py-3 font-medium text-sm ${
                        feature.type === "advanced"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${
                        feature.type === "advanced" ? "text-secondary-foreground/80" : "text-primary"
                      }`} />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full mt-auto"
                  variant={plan.ctaAction === "contact" ? "outline" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCtaClick(plan.ctaAction);
                  }}
                >
                  {plan.ctaAction === "contact" ? (
                    <Mail className="h-4 w-4 mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;
