import React from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  accent: string; // hex color for left border
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, accent }) => (
  <div
    style={{
      background: "#fff",
      border: "0.5px solid #e5e7eb",
      borderRadius: 12,
      padding: "1rem 1.25rem",
      borderLeft: `3px solid ${accent}`,
    }}
  >
    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 500, color: "#111827", lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: 11, color: accent, marginTop: 5 }}>{sub}</div>
  </div>
);
