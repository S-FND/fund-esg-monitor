import React from "react";
import { AuditLog } from "../types";
import { TypeBadge } from "./TypeBadge";

interface LogCardProps {
  log: AuditLog;
  onClick: (id: number) => void;
}

export const LogCard: React.FC<LogCardProps> = ({ log, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={() => onClick(log.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `0.5px solid ${hovered ? "#9ca3af" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "border-color 0.15s, transform 0.1s",
      }}
    >
      <TypeBadge type={log.type} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{log.action}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>by {log.actor}</div>
      </div>

      <div style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
        {log.time}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick(log.id);
        }}
        style={{
          fontSize: 12,
          padding: "5px 12px",
          borderRadius: 8,
          border: "0.5px solid #d1d5db",
          background: "transparent",
          color: "#6b7280",
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          transition: "background 0.12s, color 0.12s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#EFF6FF";
          (e.currentTarget as HTMLButtonElement).style.color = "#1D4ED8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
        }}
      >
        View details
      </button>
    </div>
  );
};
