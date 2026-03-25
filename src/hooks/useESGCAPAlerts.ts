import { useEffect, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { ESGCapItem } from "@/components/esg-cap/CAPTable";

interface AlertsState {
  overdueItems: ESGCapItem[];
  approachingDeadlines: ESGCapItem[];
  statusChanges: Array<{ item: ESGCapItem; previousStatus: string; newStatus: string }>;
}

export const useESGCAPAlerts = (
  capItems: ESGCapItem[],
  previousCapItems?: ESGCapItem[]
) => {
  const [alerts, setAlerts] = useState<AlertsState>({
    overdueItems: [],
    approachingDeadlines: [],
    statusChanges: []
  });

  const previousAlertsRef = useRef<AlertsState>({
    overdueItems: [],
    approachingDeadlines: [],
    statusChanges: []
  });

  const checkOverdueItems = (items: ESGCapItem[]) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return items.filter(item => {
      if (item.status === "completed") return false;

      const deadlineDate = new Date(item.targetDate || "");
      if (isNaN(deadlineDate.getTime())) return false;

      deadlineDate.setHours(0,0,0,0);
      return deadlineDate < today;
    });
  };

  const checkApproachingDeadlines = (items: ESGCapItem[]) => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return items.filter(item => {
      if (item.status === "completed") return false;

      const deadlineDate = new Date(item.targetDate || "");
      if (isNaN(deadlineDate.getTime())) return false;

      return deadlineDate >= today && deadlineDate <= sevenDaysFromNow;
    });
  };

  const checkStatusChanges = (current: ESGCapItem[], previous: ESGCapItem[] = []) => {
    const changes: Array<{ item: ESGCapItem; previousStatus: string; newStatus: string }> = [];

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

    const previousAlerts = previousAlertsRef.current;

    const newOverdueItems = overdueItems.filter(item =>
      !previousAlerts.overdueItems.find(prev => prev.id === item.id)
    );

    const newApproachingItems = approachingDeadlines.filter(item =>
      !previousAlerts.approachingDeadlines.find(prev => prev.id === item.id)
    );

    if (newOverdueItems.length > 0) {
      toast({
        title: "⚠️ Overdue CAP Items",
        description: `${newOverdueItems.length} CAP item(s) are overdue.`,
        variant: "destructive",
      });
    }

    if (newApproachingItems.length > 0) {
      toast({
        title: "📅 Upcoming Deadlines",
        description: `${newApproachingItems.length} CAP item(s) due in 7 days.`,
      });
    }

    statusChanges.forEach(change => {
      toast({
        title: "📋 Status Updated",
        description: `"${change.item.item}" changed from ${change.previousStatus} to ${change.newStatus}`,
      });
    });

    previousAlertsRef.current = {
      overdueItems,
      approachingDeadlines,
      statusChanges
    };

  }, [capItems, previousCapItems]);

  return alerts;
};