
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoricalComponentProps } from "./types";
import { ESGPerformanceChart } from "./ESGPerformanceChart";
import { FinancialPerformanceChart } from "./FinancialPerformanceChart";
import { LongTermChart } from "./LongTermChart";

export function CompanyMatrixHistorical({ company }: HistoricalComponentProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Tabs defaultValue="esg">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="esg">ESG Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial Comparison</TabsTrigger>
          <TabsTrigger value="longterm">Long-term Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="esg">
          <ESGPerformanceChart company={company} />
        </TabsContent>
        
        <TabsContent value="financial">
          <FinancialPerformanceChart company={company} />
        </TabsContent>
        
        <TabsContent value="longterm">
          <LongTermChart company={company} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
