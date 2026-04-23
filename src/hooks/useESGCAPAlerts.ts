import { useMemo } from "react";
import { ESGCapItem } from "@/components/esg-cap/CAPTable";

export const useESGCAPAlerts = (
  items: ESGCapItem[],
  previousItems: ESGCapItem[],
  finalPlan?: boolean
) => {
  return useMemo(() => {
    const today = new Date();

    const overdueItems: ESGCapItem[] = [];
    const approachingDeadlines: ESGCapItem[] = [];

    items.forEach((item) => {
      if (!item.targetDate) return;

      const target = new Date(item.targetDate);
      const diff = Math.ceil(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 🔴 ONLY show overdue when finalPlan = true
      if (diff < 0 && finalPlan === true) {
        overdueItems.push(item);
      }

      // 🟡 Always show approaching
      else if (diff >= 0 && diff <= 30) {
        approachingDeadlines.push(item);
      }
    });

    return {
      overdueItems,
      approachingDeadlines,
    };
  }, [items, finalPlan]);
};