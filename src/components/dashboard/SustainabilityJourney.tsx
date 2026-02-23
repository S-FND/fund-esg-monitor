// components/dashboard/SustainabilityJourney.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Leaf, AlertTriangle, AlertCircle, Target, Calendar, Users, Shield } from "lucide-react";
// import ReactSpeedometer from "react-d3-speedometer";

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

  const getBaseUrl = () => {
    return import.meta.env.VITE_API_URL || '';
  };

  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = getBaseUrl();
    return `${baseUrl}${url}`;
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Environment Meter */}
        {hasESGData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  Environment
                </span>
                <span>{Math.round(getSpeedometerValue('environment'))}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center h-[200px] items-center">
                {/* <ReactSpeedometer
                  needleHeightRatio={0.8}
                  segments={1000}
                  minValue={0}
                  maxValue={100}
                  value={getSpeedometerValue('environment')}
                  needleTransition="easeElastic"
                  textColor="#FFF"
                  startColor="red"
                  endColor="green"
                  maxSegmentLabels={0}
                  width={300}
                  height={200}
                /> */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500">
                    {Math.round(getSpeedometerValue('environment'))}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Environmental Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Meter */}
        {hasESGData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Social
                </span>
                <span>{Math.round(getSpeedometerValue('social'))}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center h-[200px] items-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-500">
                    {Math.round(getSpeedometerValue('social'))}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Social Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Governance Meter */}
        {hasESGData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  Governance
                </span>
                <span>{Math.round(getSpeedometerValue('governance'))}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center h-[200px] items-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-500">
                    {Math.round(getSpeedometerValue('governance'))}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Governance Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Non-Compliance */}
        {hasNonCompliance && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Non-Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="relative h-[250px] overflow-hidden">
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
            </CardContent>
          </Card>
        )}

        {/* Risks Identified */}
        {hasRisks && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Risks Identified
              </CardTitle>
            </CardHeader>
            <CardContent className="relative h-[250px] overflow-hidden">
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
            </CardContent>
          </Card>
        )}

        {/* SDG Impact */}
        {hasSDG && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                SDG Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="relative h-[250px] overflow-hidden">
              <div className="space-y-4">
                {sdgData?.slice(0, 2).map((item, index) => {
                  const goalText = item?.goal || item?.what_goal || 'SDG Goal';
                  const imageUrl = item?.what_img;
                  const fullImageUrl = getFullImageUrl(imageUrl || '');
                  
                  return (
                    <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      {fullImageUrl ? (
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            src={fullImageUrl}
                            alt={goalText}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">SDG</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {goalText}
                        </p>
                        {item?.what_target && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            Target: {item.what_target}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {sdgData && sdgData.length > 2 && (
                <div className="absolute bottom-4 right-4">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setActiveModal('sdg')}
                  >
                    View All ({sdgData.length})
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Board Meetings - Only for individual company */}
        {selectedPortfolio === 'individual-company' && hasBoardMeetings && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Board Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="relative h-[250px] overflow-hidden">
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
              const imageUrl = item.what_img;
              const fullImageUrl = getFullImageUrl(imageUrl || '');

              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {fullImageUrl && (
                        <img
                          src={fullImageUrl}
                          alt={`SDG ${index + 1}`}
                          className="w-16 h-16 object-contain flex-shrink-0"
                        />
                      )}
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