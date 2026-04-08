
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

const pricingPlans = [
  {
    name: "Base",
    audience: "Inv + Startups",
    price: "Rs. 2L",
    category: "Machine Reading, AI Enabled SaaS",
    features: [
      { label: "ESG DD", color: "bg-green-500/80" },
      { label: "ESG CAP Tracker", color: "bg-green-500/80" },
    ],
  },
  {
    name: "Advance",
    audience: "Startups",
    price: "Rs. 6L",
    category: "Machine Reading, AI Enabled SaaS",
    popular: true,
    features: [
      { label: "Portfolio Monitoring", color: "bg-yellow-600/80" },
      { label: "ESG DD", color: "bg-green-500/80" },
      { label: "ESG CAP Tracker", color: "bg-green-500/80" },
    ],
  },
  {
    name: "Pro",
    audience: "Investors",
    price: "Rs. 8L",
    category: "Agentic AI – Workflows",
    features: [
      { label: "Realtime Valuation Impact Modeling", color: "bg-yellow-600/80" },
      { label: "Portfolio Monitoring", color: "bg-yellow-600/80" },
      { label: "ESG DD", color: "bg-green-500/80" },
      { label: "ESG CAP Tracker", color: "bg-green-500/80" },
    ],
  },
];

const Pricing = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pricing Model</h1>
        <div className="h-1 w-32 bg-destructive mt-2 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${
              plan.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {plan.category}
              </p>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">({plan.audience})</p>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 items-center gap-6">
              <div className="w-full rounded-lg bg-destructive/85 text-destructive-foreground text-center py-3 px-4">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-sm ml-1">/ year</span>
              </div>

              <div className="w-full space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <div
                    key={feature.label}
                    className={`flex items-center gap-2 rounded-md px-4 py-3 text-white font-medium text-sm ${feature.color}`}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
