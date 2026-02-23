// components/dashboard/SustainabilityJourney.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Leaf, AlertTriangle, AlertCircle, Target, Calendar, Users, Shield, ChevronRight, ExternalLink } from "lucide-react";
import ReactSpeedometer from "react-d3-speedometer";

interface SustainabilityJourneyProps {
  esgMeterData?: {
    environment?: { percentage: number };
    social?: { percentage: number };
    governance?: { percentage: number };
  };
  nonComplianceData?: Array<{
    area: string;
    description: string;
  }>;
  riskData?: {
    environmental?: Array<{ value: string }>;
    social?: Array<{ value: string }>;
    governance?: Array<{ value: string }>;
  };
  sdgData?: Array<{
    what_img?: string;
    goal?: string;
    what_goal?: string;
    what_target?: string;
    what_text?: string;
  }>;
  boardMeetingsData?: Array<{
    _id: string;
    date_of_meeting: string;
    attendance: number;
  }>;
  selectedPortfolio: string;
  selectedFund?: string;
  selectedCompany?: string;
  selectedYear?: string;
}

export function SustainabilityJourney({
  esgMeterData,
  nonComplianceData,
  riskData,
  sdgData,
  boardMeetingsData,
  selectedPortfolio,
  selectedFund,
  selectedCompany,
  selectedYear
}: SustainabilityJourneyProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [hasESGData, setHasESGData] = useState(false);
  const [hasNonCompliance, setHasNonCompliance] = useState(false);
  const [hasRisks, setHasRisks] = useState(false);
  const [hasSDG, setHasSDG] = useState(false);
  const [hasBoardMeetings, setHasBoardMeetings] = useState(false);

  useEffect(() => {
    // Check ESG data
    setHasESGData(
      (esgMeterData?.environment?.percentage ?? 0) > 0 ||
      (esgMeterData?.social?.percentage ?? 0) > 0 ||
      (esgMeterData?.governance?.percentage ?? 0) > 0
    );

    // Check non-compliance
    setHasNonCompliance(nonComplianceData && nonComplianceData.length > 0);

    // Check risks
    setHasRisks(riskData && Object.keys(riskData).length > 0);

    // Check SDG
    setHasSDG(sdgData && sdgData.length > 0);

    // Check board meetings
    setHasBoardMeetings(
      boardMeetingsData && 
      boardMeetingsData.filter(item => item.date_of_meeting && item.attendance > 0).length > 0
    );
  }, [esgMeterData, nonComplianceData, riskData, sdgData, boardMeetingsData]);

  const getSpeedometerValue = (category: 'environment' | 'social' | 'governance') => {
    return esgMeterData?.[category]?.percentage ?? 0;
  };

  // Get color based on SDG number
  const getSdgColor = (goalText: string) => {
    const match = goalText.match(/Goal (\d+)/);
    const num = match ? parseInt(match[1]) : 0;
    
    const colors: Record<number, { bg: string, text: string }> = {
      1: { bg: 'bg-red-500', text: 'text-red-500' },
      2: { bg: 'bg-amber-500', text: 'text-amber-500' },
      3: { bg: 'bg-green-500', text: 'text-green-500' },
      4: { bg: 'bg-red-600', text: 'text-red-600' },
      5: { bg: 'bg-orange-500', text: 'text-orange-500' },
      6: { bg: 'bg-cyan-500', text: 'text-cyan-500' },
      7: { bg: 'bg-yellow-500', text: 'text-yellow-500' },
      8: { bg: 'bg-rose-700', text: 'text-rose-700' },
      9: { bg: 'bg-orange-600', text: 'text-orange-600' },
      10: { bg: 'bg-pink-600', text: 'text-pink-600' },
      11: { bg: 'bg-amber-600', text: 'text-amber-600' },
      12: { bg: 'bg-amber-700', text: 'text-amber-700' },
      13: { bg: 'bg-green-600', text: 'text-green-600' },
      14: { bg: 'bg-blue-500', text: 'text-blue-500' },
      15: { bg: 'bg-green-700', text: 'text-green-700' },
      16: { bg: 'bg-blue-700', text: 'text-blue-700' },
      17: { bg: 'bg-purple-700', text: 'text-purple-700' }
    };
    return colors[num] || { bg: 'bg-primary', text: 'text-primary' };
  };

  // If absolutely no data at all
  if (!hasESGData && !hasNonCompliance && !hasRisks && !hasSDG && !hasBoardMeetings) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Leaf className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">No sustainability data available</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              {selectedPortfolio === "fundwise" 
                ? selectedFund !== "all" 
                  ? "No sustainability data found for the selected fund" 
                  : "Select a fund to view sustainability data"
                : selectedCompany !== "all"
                  ? "No sustainability data found for this company"
                  : "Select a company to view sustainability data"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ESG Meters Row - Always show, with empty state if no data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Environment Meter */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span>Environment</span>
              </span>
              {hasESGData && (
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                  {Math.round(getSpeedometerValue('environment'))}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-[180px]">
              <ReactSpeedometer
                value={getSpeedometerValue('environment')}
                minValue={0}
                maxValue={100}
                width={200}
                height={140}
                needleColor="#22c55e"
                needleTransitionDuration={1000}
                needleTransition="easeElastic"
                segments={5}
                segmentColors={['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']}
                currentValueText=" "
                textColor="#22c55e"
                maxSegmentLabels={0}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {hasESGData 
                ? `Environmental Score: ${Math.round(getSpeedometerValue('environment'))}%`
                : "Environmental data not available"}
            </p>
          </CardContent>
        </Card>

        {/* Social Meter */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Social</span>
              </span>
              {hasESGData && (
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  {Math.round(getSpeedometerValue('social'))}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-[180px]">
              <ReactSpeedometer
                value={getSpeedometerValue('social')}
                minValue={0}
                maxValue={100}
                width={200}
                height={140}
                needleColor="#3b82f6"
                needleTransitionDuration={1000}
                needleTransition="easeElastic"
                segments={5}
                segmentColors={['#ef4444', '#f97316', '#eab308', '#84cc16', '#3b82f6']}
                currentValueText=" "
                textColor="#3b82f6"
                maxSegmentLabels={0}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {hasESGData 
                ? `Social Score: ${Math.round(getSpeedometerValue('social'))}%`
                : "Social data not available"}
            </p>
          </CardContent>
        </Card>

        {/* Governance Meter */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Governance</span>
              </span>
              {hasESGData && (
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                  {Math.round(getSpeedometerValue('governance'))}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-[180px]">
              <ReactSpeedometer
                value={getSpeedometerValue('governance')}
                minValue={0}
                maxValue={100}
                width={200}
                height={140}
                needleColor="#8b5cf6"
                needleTransitionDuration={1000}
                needleTransition="easeElastic"
                segments={5}
                segmentColors={['#ef4444', '#f97316', '#eab308', '#84cc16', '#8b5cf6']}
                currentValueText=" "
                textColor="#8b5cf6"
                maxSegmentLabels={0}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {hasESGData 
                ? `Governance Score: ${Math.round(getSpeedometerValue('governance'))}%`
                : "Governance data not available"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Row - Always show all cards, with empty states when no data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Non-Compliance - Always show, with empty state */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Non-Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="relative h-[250px] overflow-hidden">
            {hasNonCompliance ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">S.No.</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonComplianceData?.slice(0, 3).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{item.area}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {nonComplianceData && nonComplianceData.length > 3 && (
                  <div className="absolute bottom-4 right-4">
                    <Badge
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setActiveModal('non-compliance')}
                    >
                      View All ({nonComplianceData.length})
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No non-compliance issues</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  All compliance requirements are being met
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risks Identified - Always show, with empty state */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Risks Identified
            </CardTitle>
          </CardHeader>
          <CardContent className="relative h-[250px] overflow-hidden">
            {hasRisks ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskData && Object.keys(riskData).slice(0, 3).map((category) => {
                      const items = riskData[category as keyof typeof riskData]?.filter((item: any) => item.value);
                      if (!items?.length) return null;

                      return items.slice(0, 1).map((item: any, idx: number) => (
                        <TableRow key={`${category}-${idx}`}>
                          <TableCell className="capitalize font-medium">{category}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.value}</TableCell>
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
                <div className="absolute bottom-4 right-4">
                  <Badge
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setActiveModal('risks')}
                  >
                    View Details
                  </Badge>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No risks identified</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  All risk factors are within acceptable limits
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SDG Impact - Always show, with empty state */}
        <Card className="col-span-1 overflow-hidden border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-base font-semibold">SDG Impact</span>
              </CardTitle>
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                {sdgData?.length || 0} Goals
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="relative h-[280px] overflow-hidden p-4">
            {hasSDG ? (
              <>
                <div className="space-y-3">
                  {sdgData?.slice(0, 3).map((item, index) => {
                    const goalText = item?.goal || item?.what_goal || 'SDG Goal';
                    const goalNumber = goalText.match(/Goal (\d+)/)?.[1] || (index + 1).toString();
                    const sdgColor = getSdgColor(goalText);
                    
                    return (
                      <div 
                        key={index} 
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 group cursor-pointer border border-transparent hover:border-border"
                        onClick={() => setActiveModal('sdg')}
                      >
                        {/* SDG Colored Circle - Always use colored background */}
                        <div className={`w-10 h-10 rounded-lg ${sdgColor.bg} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                          {goalNumber}
                        </div>
                        
                        {/* Goal Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium line-clamp-2 text-foreground/90 group-hover:text-foreground">
                              {goalText.length > 60 ? goalText.substring(0, 60) + '...' : goalText}
                            </p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                          </div>
                          
                          {/* Target Preview */}
                          {item?.what_target && (
                            <div className="flex items-start gap-1.5 mt-1">
                              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.what_target.length > 50 ? item.what_target.substring(0, 50) + '...' : item.what_target}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Gradient Fade Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                
                {/* View All Button */}
                {sdgData && sdgData.length > 3 && (
                  <div className="absolute bottom-3 right-3 z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1 bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm"
                      onClick={() => setActiveModal('sdg')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View {sdgData.length - 3} more
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Target className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No SDG goals available</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  SDG impact data will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Board Meetings - Only for individual company, always show with empty state */}
        {selectedPortfolio === 'individual-company' && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Board Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="relative h-[250px] overflow-hidden">
              {hasBoardMeetings ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Attendance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boardMeetingsData
                        ?.filter(item => item.date_of_meeting && item.attendance > 0)
                        .slice(0, 2)
                        .map((item, index) => (
                          <TableRow key={item._id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.date_of_meeting}</TableCell>
                            <TableCell>{item.attendance}%</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {boardMeetingsData?.filter(item => item.date_of_meeting && item.attendance > 0).length > 2 && (
                    <div className="absolute bottom-4 right-4">
                      <Badge
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setActiveModal('board-meetings')}
                      >
                        View All
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No board meetings data</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Board meeting records will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Dialog open={activeModal === 'non-compliance'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Non-Compliance Details</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonComplianceData?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.area}</TableCell>
                  <TableCell>{item.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'risks'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Risks Identified</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Risk Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskData && Object.keys(riskData).map((category) => (
                riskData[category as keyof typeof riskData]?.map((item: any, idx: number) => (
                  <TableRow key={`${category}-${idx}`}>
                    <TableCell className="capitalize font-medium">{category}</TableCell>
                    <TableCell>{item.value}</TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'sdg'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SDG Impact Goals</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sdgData?.map((item, index) => {
              const goalText = item.goal || item.what_goal || '';
              const goalNumber = goalText.match(/Goal (\d+)/)?.[1] || (index + 1).toString();
              const sdgColor = getSdgColor(goalText);

              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* SDG Colored Circle */}
                      <div className={`w-12 h-12 rounded-lg ${sdgColor.bg} flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0`}>
                        {goalNumber}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-2">
                          {goalText}
                        </h3>
                        {item?.what_target && (
                          <div className="text-xs text-muted-foreground mb-1">
                            <span className="font-medium">Target:</span> {item.what_target}
                          </div>
                        )}
                        {item?.what_text && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Indicator:</span> {item.what_text}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'board-meetings'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Board Meetings</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No.</TableHead>
                <TableHead>Date of Meeting</TableHead>
                <TableHead>Attendance (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boardMeetingsData
                ?.filter(item => item.date_of_meeting && item.attendance > 0)
                .map((item, index) => (
                  <TableRow key={item._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.date_of_meeting}</TableCell>
                    <TableCell>{item.attendance}%</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}