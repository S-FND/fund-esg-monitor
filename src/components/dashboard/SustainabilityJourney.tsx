// components/dashboard/SustainabilityJourney.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
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
    what_text?: string;
  }>;
  boardMeetingsData?: Array<{
    _id: string;
    date_of_meeting: string;
    attendance: number;
  }>;
  selectedPortfolio: string;
}

export function SustainabilityJourney({
  esgMeterData,
  nonComplianceData,
  riskData,
  sdgData,
  boardMeetingsData,
  selectedPortfolio
}: SustainabilityJourneyProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const getSpeedometerValue = (category: 'environment' | 'social' | 'governance') => {
    return esgMeterData?.[category]?.percentage ?? 0;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Environment Meter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Environment</span>
              <span>{Math.round(getSpeedometerValue('environment'))}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
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
            </div>
          </CardContent>
        </Card>

        {/* Social Meter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Social</span>
              <span>{Math.round(getSpeedometerValue('social'))}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {/* <ReactSpeedometer
                needleHeightRatio={0.8}
                segments={1000}
                minValue={0}
                maxValue={100}
                value={getSpeedometerValue('social')}
                needleTransition="easeElastic"
                textColor="#FFF"
                startColor="red"
                endColor="green"
                maxSegmentLabels={0}
                width={300}
                height={200}
              /> */}
            </div>
          </CardContent>
        </Card>

        {/* Governance Meter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Governance</span>
              <span>{Math.round(getSpeedometerValue('governance'))}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {/* <ReactSpeedometer
                needleHeightRatio={0.8}
                segments={1000}
                minValue={0}
                maxValue={100}
                value={getSpeedometerValue('governance')}
                needleTransition="easeElastic"
                textColor="#FFF"
                startColor="red"
                endColor="green"
                maxSegmentLabels={0}
                width={300}
                height={200}
              /> */}
            </div>
          </CardContent>
        </Card>

        {/* Non-Compliance */}
        <Card className="col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle>Non-Compliance</CardTitle>
          </CardHeader>
          <CardContent className="relative h-[250px] overflow-hidden">
            {nonComplianceData && nonComplianceData.length > 0 ? (
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
                    {nonComplianceData.slice(0, 3).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{item.area}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {nonComplianceData.length > 3 && (
                  <div className="absolute bottom-4 right-4">
                    <Badge
                      className="cursor-pointer"
                      onClick={() => setActiveModal('non-compliance')}
                    >
                      Read More
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center mt-8">No non-compliance data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Risks Identified */}
        <Card className="col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle>Risks Identified</CardTitle>
          </CardHeader>
          <CardContent className="relative h-[250px] overflow-hidden">
            {riskData && Object.keys(riskData).length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(riskData).slice(0, 3).map((category) => {
                      const items = riskData[category as keyof typeof riskData]?.filter((item: any) => item.value);
                      if (!items?.length) return null;

                      return items.slice(0, 1).map((item: any, idx: number) => (
                        <TableRow key={`${category}-${idx}`}>
                          <TableCell className="capitalize">{category}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.value}</TableCell>
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
                <div className="absolute bottom-4 right-4">
                  <Badge
                    className="cursor-pointer"
                    onClick={() => setActiveModal('risks')}
                  >
                    Read More
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-center mt-8">No risk data available.</p>
            )}
          </CardContent>
        </Card>

        {/* SDG Impact */}
<Card className="h-[300px]">
  <CardHeader>
    <CardTitle>SDG Impact</CardTitle>
  </CardHeader>
  <CardContent className="relative h-[calc(100%-80px)] overflow-hidden">
    {sdgData && sdgData.length > 0 ? (
      <>
        <div className="space-y-4">
          {sdgData.slice(0, 2).map((item, index) => {
            const goalText = item?.goal || item?.what_goal || 'SDG Goal';
            const imageUrl = item?.what_img;
            const targetText = item?.what_target;
            
            // Construct full image URL if needed
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const fullImageUrl = imageUrl?.startsWith('http') 
              ? imageUrl 
              : imageUrl ? `${baseUrl}${imageUrl}` : '';
            
            return (
              <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                {fullImageUrl ? (
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={fullImageUrl}
                      alt={goalText.substring(0, 30)}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        // Hide image and show fallback
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center';
                          fallback.innerHTML = '<span class="text-xs font-medium text-primary">SDG</span>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">
                      SDG
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {goalText}
                  </p>
                  {targetText && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {targetText.substring(0, 60)}...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {sdgData.length > 2 && (
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
      </>
    ) : (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No SDG strategy data available.</p>
          <p className="text-xs mt-1">Add SDG strategies to see impact</p>
        </div>
      </div>
    )}
  </CardContent>
</Card>

        {/* Board Meetings - Only for individual company */}
        {selectedPortfolio === 'individual-company' && (
          <Card className="col-span-1 md:col-span-1">
            <CardHeader>
              <CardTitle>Board Meetings</CardTitle>
            </CardHeader>
            <CardContent className="relative h-[250px] overflow-hidden">
              {boardMeetingsData && boardMeetingsData.length > 0 ? (
                <>
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
                        .filter(item => item.date_of_meeting && item.attendance > 0)
                        .slice(0, 2)
                        .map((item, index) => (
                          <TableRow key={item._id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.date_of_meeting}</TableCell>
                            <TableCell>{item.attendance}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {boardMeetingsData.filter(item => item.date_of_meeting && item.attendance > 0).length > 2 && (
                    <div className="absolute bottom-4 right-4">
                      <Badge
                        className="cursor-pointer"
                        onClick={() => setActiveModal('board-meetings')}
                      >
                        Read More
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center mt-8">No Board Meetings data available.</p>
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
                  <TableCell>{item.area}</TableCell>
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
            <DialogTitle>Risks Identified Details</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskData && Object.keys(riskData).map((category) => (
                <TableRow key={category}>
                  <TableCell className="capitalize">{category}</TableCell>
                  <TableCell>
                    {riskData[category as keyof typeof riskData]?.map((item: any, idx: number) => (
                      <div key={idx}>{item.value}</div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* SDG Impact Modal */}
      <Dialog open={activeModal === 'sdg'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SDG Impact Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sdgData?.map((item, index) => {
              const goalText = item.goal || item.what_goal || '';
              const imageUrl = item.what_img;

              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {imageUrl && (
                        <img
                          src={imageUrl}
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
                            <span className="font-medium">Target:</span> {item?.what_target}
                          </div>
                        )}
                        {item?.what_text && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Indicator:</span> {item?.what_text}
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
            <DialogTitle>Board Meetings Details</DialogTitle>
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
                    <TableCell>{item.attendance}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}