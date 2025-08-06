import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { CAPItem } from "@/components/esg-cap/CAPTable";

interface AlertsState {
  overdueItems: CAPItem[];
  approachingDeadlines: CAPItem[];
  statusChanges: Array<{ item: CAPItem; previousStatus: string; newStatus: string }>;
}

export const useESGCAPAlerts = (
  capItems: CAPItem[],
  previousCapItems?: CAPItem[]
) => {
  const [alerts, setAlerts] = useState<AlertsState>({
    overdueItems: [],
    approachingDeadlines: [],
    statusChanges: []
  });

  const checkOverdueItems = (items: CAPItem[]): CAPItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return items.filter(item => {
      if (item.status === "Completed") return false;
      const targetDate = new Date(item.targetDate);
      targetDate.setHours(0, 0, 0, 0);
      return targetDate < today;
    });
  };

  const checkApproachingDeadlines = (items: CAPItem[]): CAPItem[] => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    return items.filter(item => {
      if (item.status === "Completed") return false;
      const targetDate = new Date(item.targetDate);
      return targetDate >= today && targetDate <= sevenDaysFromNow;
    });
  };

  const checkStatusChanges = (current: CAPItem[], previous: CAPItem[] = []) => {
    const changes: Array<{ item: CAPItem; previousStatus: string; newStatus: string }> = [];
    
    current.forEach(currentItem => {
      const previousItem = previous.find(p => p.id === currentItem.id);
      if (previousItem && previousItem.status !== currentItem.status) {
        changes.push({
          item: currentItem,
          previousStatus: previousItem.status,
          newStatus: currentItem.status
        });
      }
    });
    
    return changes;
  };

  useEffect(() => {
    const overdueItems = checkOverdueItems(capItems);
    const approachingDeadlines = checkApproachingDeadlines(capItems);
    const statusChanges = previousCapItems ? checkStatusChanges(capItems, previousCapItems) : [];

    setAlerts({
      overdueItems,
      approachingDeadlines,
      statusChanges
    });

    // Show toast notifications for new alerts
    if (overdueItems.length > 0) {
      toast({
        title: "⚠️ Overdue Items Alert",
        description: `${overdueItems.length} CAP item(s) are overdue and require immediate attention.`,
        variant: "destructive",
      });
    }

    if (approachingDeadlines.length > 0) {
      toast({
        title: "📅 Approaching Deadlines",
        description: `${approachingDeadlines.length} CAP item(s) have deadlines within the next 7 days.`,
      });
    }

    // Show status change notifications
    statusChanges.forEach(change => {
      const statusColor = change.newStatus === "Completed" ? "default" : 
                         change.newStatus === "Rejected" ? "destructive" : "default";
      
      toast({
        title: "📋 Status Updated",
        description: `"${change.item.item}" changed from ${change.previousStatus} to ${change.newStatus}`,
        variant: statusColor === "destructive" ? "destructive" : "default",
      });
    });
  }, [capItems, previousCapItems]);

  return alerts;
};