
import * as React from "react";
import * as RechartsPrimitive from "recharts";

// Format: { THEME_NAME: CSS_SELECTOR }
export const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

export type ChartContextProps = {
  config: ChartConfig;
};

// Fix the interface to avoid the conflict with 'content' property
export interface ChartTooltipContentProps
  extends Omit<React.ComponentProps<typeof RechartsPrimitive.Tooltip>, 'content'>,
    React.HTMLAttributes<HTMLDivElement> {
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
}

export interface ChartLegendContentProps
  extends React.ComponentProps<"div">,
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> {
  hideIcon?: boolean;
  nameKey?: string;
}
