// components/dashboard/tabs/SDGTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SDGStrategyData {
  goal?: string;
  what_goal?: string;
  what_target?: string;
  what_text?: string | null;
  what_img?: string;
  who?: string;
  abc_goal?: string | null;
  abc_goal_description?: string;
  impact_thesis?: string;
  baseline_metric?: string;
  target_metric?: string;
  current_status?: string;
  count?: number;
}

interface SDGTabProps {
  data?: SDGStrategyData[];
  selectedPortfolio?: string;
  dashboardTopics?: string[];
}

export function SDGTab({ 
  data, 
  selectedPortfolio = "fundwise", 
  dashboardTopics = [] 
}: SDGTabProps) {
  console.log('SDGTab received data:', data);
  
  const sdgData = data || [];
  const hasData = sdgData.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SDG Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <h3 className="text-lg">No data available.</h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to get full image URL
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}${imagePath}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SDG Strategy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="table mb-0 table-bordered table-striped" style={{ tableLayout: "fixed", width: "100%" }}>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: "410px" }} className="font-bold">WHAT</TableHead>
                <TableHead style={{ width: "310px" }} className="font-bold">WHO</TableHead>
                <TableHead style={{ width: "310px" }} className="font-bold uppercase">ABC Goal</TableHead>
                <TableHead style={{ width: "310px" }} className="font-bold uppercase">Impact Thesis</TableHead>
                <TableHead style={{ width: "310px" }} className="font-bold uppercase">Baseline Metric</TableHead>
                <TableHead style={{ width: "310px" }} className="font-bold uppercase">Target Metric</TableHead>
                <TableHead style={{ width: "310px" }} className="font-bold uppercase">Current Status</TableHead>
              </TableRow>
              <TableRow className="bg-primary/10">
                <TableCell className="text-sm">SDG Goal, Target, and Indicator</TableCell>
                <TableCell className="text-sm">Stakeholders that experience change as a result of your activities</TableCell>
                <TableCell className="text-sm">The level of impact you are targeting</TableCell>
                <TableCell className="text-sm">If we …….., then we believe will happen.</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdgData.map((item, index) => {
                const imageUrl = getFullImageUrl(item.what_img || '');
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="d-flex" style={{ display: 'flex' }}>
                        <div>
                          {item?.what_goal}
                          <br />
                          <br />
                          {item?.what_target}
                          <br />
                          <br />
                          {item?.what_text}
                        </div>
                        {imageUrl && (
                          <div className="imageUrl d-flex align-items-start mt-0 ms-4" style={{ display: 'flex', alignItems: 'flex-start', marginTop: 0, marginLeft: '1rem' }}>
                            <img
                              src={imageUrl}
                              alt="SDG"
                              style={{ width: "90px", maxWidth: "90px" }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <textarea
                        className="w-full p-2 border rounded-md bg-muted/20 text-sm resize-none form-control"
                        placeholder="who"
                        rows={4}
                        value={item?.who || ''}
                        readOnly
                        style={{ minHeight: '100px' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        {item?.abc_goal}
                        <br />
                        <br />
                        <textarea
                          className="w-full p-2 border rounded-md bg-muted/20 text-sm resize-none form-control"
                          placeholder="Description"
                          rows={4}
                          value={item?.abc_goal_description || ''}
                          readOnly
                          style={{ minHeight: '100px' }}
                        />
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <textarea
                        className="w-full p-2 border rounded-md bg-muted/20 text-sm resize-none form-control"
                        placeholder=""
                        rows={4}
                        value={item?.impact_thesis || ''}
                        readOnly
                        style={{ minHeight: '100px' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <textarea
                        className="w-full p-2 border rounded-md bg-muted/20 text-sm resize-none form-control"
                        placeholder=""
                        rows={4}
                        value={item?.baseline_metric || ''}
                        readOnly
                        style={{ minHeight: '100px' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <textarea
                        className="w-full p-2 border rounded-md bg-muted/20 text-sm resize-none form-control"
                        placeholder=""
                        rows={4}
                        value={item?.target_metric || ''}
                        readOnly
                        style={{ minHeight: '100px' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <textarea
                        className="w-full p-2 border rounded-md bg-muted/20 text-sm resize-none form-control"
                        placeholder=""
                        rows={4}
                        value={item?.current_status || ''}
                        readOnly
                        style={{ minHeight: '100px' }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}