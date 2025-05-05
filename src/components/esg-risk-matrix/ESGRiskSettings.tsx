
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { useState } from "react";

export function ESGRiskSettings() {
  const [environmentalWeight, setEnvironmentalWeight] = useState([40]);
  const [socialWeight, setSocialWeight] = useState([30]);
  const [governanceWeight, setGovernanceWeight] = useState([30]);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>ESG Risk Matrix Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="weights">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weights">Pillar Weights</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="export">Export Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weights" className="space-y-4">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="environmental-weight">Environmental</Label>
                  <span className="text-sm">{environmentalWeight}%</span>
                </div>
                <Slider
                  id="environmental-weight"
                  min={10}
                  max={80}
                  step={5}
                  value={environmentalWeight}
                  onValueChange={(value) => {
                    setEnvironmentalWeight(value);
                    // Adjust other weights to ensure total is 100%
                    const remaining = 100 - value[0];
                    const ratio = socialWeight[0] / (socialWeight[0] + governanceWeight[0]);
                    setSocialWeight([Math.round(remaining * ratio)]);
                    setGovernanceWeight([Math.round(remaining * (1 - ratio))]);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="social-weight">Social</Label>
                  <span className="text-sm">{socialWeight}%</span>
                </div>
                <Slider
                  id="social-weight"
                  min={10}
                  max={80}
                  step={5}
                  value={socialWeight}
                  onValueChange={(value) => {
                    setSocialWeight(value);
                    // Adjust environmental and governance to ensure total is 100%
                    const remaining = 100 - value[0];
                    const ratio = environmentalWeight[0] / (environmentalWeight[0] + governanceWeight[0]);
                    setEnvironmentalWeight([Math.round(remaining * ratio)]);
                    setGovernanceWeight([Math.round(remaining * (1 - ratio))]);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="governance-weight">Governance</Label>
                  <span className="text-sm">{governanceWeight}%</span>
                </div>
                <Slider
                  id="governance-weight"
                  min={10}
                  max={80}
                  step={5}
                  value={governanceWeight}
                  onValueChange={(value) => {
                    setGovernanceWeight(value);
                    // Adjust environmental and social to ensure total is 100%
                    const remaining = 100 - value[0];
                    const ratio = environmentalWeight[0] / (environmentalWeight[0] + socialWeight[0]);
                    setEnvironmentalWeight([Math.round(remaining * ratio)]);
                    setSocialWeight([Math.round(remaining * (1 - ratio))]);
                  }}
                />
              </div>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Total: {environmentalWeight[0] + socialWeight[0] + governanceWeight[0]}% (should equal 100%)
              </div>
            </div>
            
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline">Reset to Defaults</Button>
              <Button>Apply Changes</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="parameters" className="space-y-4">
            <div className="text-sm space-y-4">
              <p>
                Configure the specific ESG parameters used in the risk assessment and their respective weights within each pillar.
              </p>
              
              <div className="space-y-1">
                <Label>Standard</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="sm">SASB</Button>
                  <Button variant="outline" size="sm">GRI</Button>
                  <Button variant="outline" size="sm">Custom</Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label>Parameter Sets</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="sm">Default</Button>
                  <Button variant="outline" size="sm">VC/Startup Focus</Button>
                  <Button variant="outline" size="sm">Impact Investing</Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline">Advanced Settings</Button>
              <Button>Apply Changes</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="text-sm space-y-4">
              <p>
                Configure export options for ESG risk reports and valuation impact assessments.
              </p>
              
              <div className="space-y-1">
                <Label>Report Format</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="sm">PDF</Button>
                  <Button variant="outline" size="sm">Excel</Button>
                  <Button variant="outline" size="sm">CSV</Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label>Report Content</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="sm">Summary</Button>
                  <Button variant="outline" size="sm">Detailed</Button>
                  <Button variant="outline" size="sm">LP Report</Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button>Export Data</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
