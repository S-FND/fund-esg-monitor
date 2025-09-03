import { useEffect, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { ESGCapItem } from "@/components/esg-cap/CAPTable"; // Import the correct interface

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
  
  // Track previous alert state to prevent duplicate toasts
  const previousAlertsRef = useRef<AlertsState>({
    overdueItems: [],
    approachingDeadlines: [],
    statusChanges: []
  });

  const checkOverdueItems = (items: ESGCapItem[]): ESGCapItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return items.filter(item => {
      if (item.status === "completed") return false; // Changed from "Completed" to "completed"
      const deadlineDate = new Date(item.deadline); // Changed from targetDate to deadline
      deadlineDate.setHours(0, 0, 0, 0);
      return deadlineDate < today;
    });
  };

  const checkApproachingDeadlines = (items: ESGCapItem[]): ESGCapItem[] => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    return items.filter(item => {
      if (item.status === "completed") return false; // Changed from "Completed" to "completed"
      const deadlineDate = new Date(item.deadline); // Changed from targetDate to deadline
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

    // Only show toast notifications when alerts actually change
    const previousAlerts = previousAlertsRef.current;
    
    // Check if overdue items have actually changed
    const newOverdueItems = overdueItems.filter(item => 
      !previousAlerts.overdueItems.find(prev => prev.id === item.id)
    );
    
    // Check if approaching deadlines have actually changed
    const newApproachingItems = approachingDeadlines.filter(item => 
      !previousAlerts.approachingDeadlines.find(prev => prev.id === item.id)
    );
    
    // Show toast only for new overdue items
    if (newOverdueItems.length > 0) {
      toast({
        title: "⚠️ Overdue Items Alert",
        description: `${newOverdueItems.length} CAP item(s) are now overdue and require immediate attention.`,
        variant: "destructive",
      });
    }

    // Show toast only for new approaching deadlines
    if (newApproachingItems.length > 0) {
      toast({
        title: "📅 Approaching Deadlines",
        description: `${newApproachingItems.length} CAP item(s) have deadlines within the next 7 days.`,
      });
    }

    // Show status change notifications (these are already new changes)
    statusChanges.forEach(change => {
      const statusColor = change.newStatus === "completed" ? "default" : 
                         change.newStatus === "delayed" ? "destructive" : "default"; // Updated status values
      
      toast({
        title: "📋 Status Updated",
        description: `"${change.item.issue}" changed from ${change.previousStatus} to ${change.newStatus}`, // Changed from item.item to item.issue
        variant: statusColor === "destructive" ? "destructive" : "default",
      });
    });
    
    // Update previous alerts reference
    previousAlertsRef.current = {
      overdueItems,
      approachingDeadlines,
      statusChanges
    };
  }, [capItems, previousCapItems]);

  return alerts;
};