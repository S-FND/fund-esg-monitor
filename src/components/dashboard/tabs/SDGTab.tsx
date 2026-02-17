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
}

export function SDGTab({ data }: SDGTabProps) {
  console.log('SDGTab received data:', data);

  const sdgData = data || [];

  if (!sdgData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SDG Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No SDG strategy data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SDG Strategy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="w-[410px] font-bold">WHAT</TableHead>
                <TableHead className="w-[310px] font-bold">WHO</TableHead>
                <TableHead className="w-[310px] font-bold">ABC Goal</TableHead>
                <TableHead className="w-[310px] font-bold">Impact Thesis</TableHead>
                <TableHead className="w-[310px] font-bold">Baseline Metric</TableHead>
                <TableHead className="w-[310px] font-bold">Target Metric</TableHead>
                <TableHead className="w-[310px] font-bold">Current Status</TableHead>
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
              {sdgData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-2">
                      {/* Goal */}
                      {item.goal && (
                        <div className="font-medium">{item.goal}</div>
                      )}
                      
                      {/* What Goal */}
                      {item.what_goal && item.what_goal !== item.goal && (
                        <div>{item.what_goal}</div>
                      )}
                      
                      {/* Target */}
                      {item.what_target && (
                        <>
                          <br />
                          <div>{item.what_target}</div>
                        </>
                      )}
                      
                      {/* Text */}
                      {item.what_text && (
                        <>
                          <br />
                          <div>{item.what_text}</div>
                        </>
                      )}
                      
                      {/* Image */}
                      {item.what_img && (
                        <div className="mt-2">
                          <img 
                            src={item.what_img} 
                            alt="SDG" 
                            className="w-[90px] h-[90px] object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <textarea
                      className="w-full min-h-[100px] p-2 border rounded-md bg-muted/20 text-sm resize-none"
                      value={item.who || ''}
                      readOnly
                      placeholder="No data"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      {item.abc_goal && (
                        <div>{item.abc_goal}</div>
                      )}
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md bg-muted/20 text-sm resize-none"
                        value={item.abc_goal_description || ''}
                        readOnly
                        placeholder="No description"
                      />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <textarea
                      className="w-full min-h-[100px] p-2 border rounded-md bg-muted/20 text-sm resize-none"
                      value={item.impact_thesis || ''}
                      readOnly
                      placeholder="No data"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <textarea
                      className="w-full min-h-[100px] p-2 border rounded-md bg-muted/20 text-sm resize-none"
                      value={item.baseline_metric || ''}
                      readOnly
                      placeholder="No data"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <textarea
                      className="w-full min-h-[100px] p-2 border rounded-md bg-muted/20 text-sm resize-none"
                      value={item.target_metric || ''}
                      readOnly
                      placeholder="No data"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <textarea
                      className="w-full min-h-[100px] p-2 border rounded-md bg-muted/20 text-sm resize-none"
                      value={item.current_status || ''}
                      readOnly
                      placeholder="No data"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}