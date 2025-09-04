import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ESGCapItem } from "./CAPTable";
import { useState } from "react";

interface AlertsPanelProps {
  overdueItems: ESGCapItem[];
  approachingDeadlines: ESGCapItem[];
  onItemClick: (item: ESGCapItem) => void;
}

export const AlertsPanel = ({ overdueItems, approachingDeadlines, onItemClick }: AlertsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalAlerts = overdueItems.length + approachingDeadlines.length;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (totalAlerts === 0) {
    return null; // Don't show anything when there are no alerts
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardHeader className="cursor-pointer p-3" onClick={toggleExpand}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <Badge 
              variant="secondary" 
              className="bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100"
            >
              {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-800/50"
            onClick={toggleExpand}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-3 space-y-3">
          {overdueItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-3 w-3 text-red-500" />
                <h4 className="text-sm font-medium text-red-700 dark:text-red-300">
                  Overdue ({overdueItems.length})
                </h4>
              </div>
              <div className="space-y-2">
                {overdueItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-900 dark:text-red-100">{item.issue}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">Due: {item.deadline}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      className="text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50 h-6 px-2"
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {approachingDeadlines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3 w-3 text-yellow-500" />
                <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Approaching ({approachingDeadlines.length})
                </h4>
              </div>
              <div className="space-y-2">
                {approachingDeadlines.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">{item.issue}</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Due: {item.deadline}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      className="text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/50 h-6 px-2"
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};