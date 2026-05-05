import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, CheckCircle, XCircle } from "lucide-react";
import { ESGCapItem } from "./CAPTable";

interface AlertsPanelProps {
  overdueItems: ESGCapItem[];
  approachingDeadlines: ESGCapItem[];
  onItemClick: (item: ESGCapItem) => void;
  finalPlan?: boolean;
}

export const AlertsPanel = ({
  overdueItems,
  approachingDeadlines,
  onItemClick,
}: AlertsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const totalAlerts = overdueItems.length + approachingDeadlines.length;

  if (totalAlerts === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">All Clear</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      {/* 🔥 COLLAPSIBLE HEADER */}
      <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Active Alerts</CardTitle>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-100 text-orange-800">{totalAlerts}</Badge>
            <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* 🔥 SUMMARY (VISIBLE WHEN COLLAPSED) */}
        {!isOpen && (
          <div className="text-xs text-orange-700 mt-1">
            Overdue: {overdueItems.length} • Upcoming: {approachingDeadlines.length}
          </div>
        )}
      </CardHeader>

      {/* 🔥 EXPANDED CONTENT */}
      {isOpen && (
        <CardContent className="space-y-4">
          {/* 🔴 OVERDUE */}
          {overdueItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <h4 className="font-medium text-red-700">
                  Overdue ({overdueItems.length})
                </h4>
              </div>

              <div className="space-y-2">
                {overdueItems.map((item) => {
                  const priorityColor =
                    {
                      High: "bg-red-100 text-red-800",
                      Medium: "bg-yellow-100 text-yellow-800",
                      Low: "bg-green-100 text-green-800",
                    }[item.priority] || "bg-gray-100 text-gray-800";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-red-900">{item.item}</p>
                        <Badge className={`${priorityColor} text-xs`}>
                          {item.priority}
                        </Badge>
                        <p className="text-xs text-red-600">
                          Due:{" "}
                          {item.targetDate
                            ? new Date(item.targetDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onItemClick(item)}
                        className="text-xs"
                      >
                        Review
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🟡 APPROACHING */}
          {approachingDeadlines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium text-yellow-700">
                  Upcoming ({approachingDeadlines.length})
                </h4>
              </div>

              <div className="space-y-2">
                {approachingDeadlines.map((item) => {
                  const priorityColor =
                    {
                      High: "bg-red-100 text-red-800",
                      Medium: "bg-yellow-100 text-yellow-800",
                      Low: "bg-green-100 text-green-800",
                    }[item.priority] || "bg-gray-100 text-gray-800";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-yellow-900">{item.item}</p>
                        <Badge className={`${priorityColor} text-xs`}>
                          {item.priority}
                        </Badge>
                        <p className="text-xs text-yellow-600">
                          Due:{" "}
                          {item.targetDate
                            ? new Date(item.targetDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onItemClick(item)}
                        className="text-xs"
                      >
                        Review
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};