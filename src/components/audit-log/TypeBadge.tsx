import React from "react";
import { LogType } from "../types";

interface TypeBadgeProps {
  type: LogType;
}

const BADGE_STYLES: Record<LogType, React.CSSProperties> = {
  DATA_CHANGE: {
    background: "#EAF3DE",
    color: "#3B6D11",
  },
  REQUEST: {
    background: "#E6F1FB",
    color: "#185FA5",
  },
  ERROR: {
    background: "#FCEBEB",
    color: "#A32D2D",
  },
};

const BADGE_LABELS: Record<LogType, string> = {
  DATA_CHANGE: "Data change",
  REQUEST: "Request",
  ERROR: "Error",
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => (
  <span
    style={{
      ...BADGE_STYLES[type],
      fontSize: 11,
      fontWeight: 500,
      padding: "3px 9px",
      borderRadius: 20,
      whiteSpace: "nowrap",
      flexShrink: 0,
      display: "inline-block",
    }}
  >
    {BADGE_LABELS[type]}
  </span>
);
