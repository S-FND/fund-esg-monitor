
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Valuation = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Valuation</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Valuation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section will contain valuation data and analytics for your portfolio.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Valuation;
