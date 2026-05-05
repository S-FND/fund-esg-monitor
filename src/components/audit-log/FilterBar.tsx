import { USERS } from "@/data/auditLogs";
import { Filters, LogType } from "@/types/audit-log";
import React from "react";


interface FilterBarProps {
  filters: Filters;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
}

const inputStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "6px 10px",
  border: "0.5px solid #d1d5db",
  borderRadius: 8,
  background: "#f9fafb",
  color: "#111827",
  height: 34,
  outline: "none",
};

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => (
  <div
    style={{
      background: "#fff",
      border: "0.5px solid #e5e7eb",
      borderRadius: 12,
      padding: "1rem 1.25rem",
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      marginBottom: "1.25rem",
    }}
  >
    <input
      type="text"
      placeholder="Search by action or user…"
      value={filters.search}
      onChange={(e) => onChange("search", e.target.value)}
      style={{ ...inputStyle, flex: 1, minWidth: 160 }}
    />

    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>Type</span>
      <select
        value={filters.type}
        onChange={(e) => onChange("type", e.target.value as LogType | "")}
        style={{ ...inputStyle, minWidth: 130 }}
      >
        <option value="">All types</option>
        <option value="DATA_CHANGE">Data change</option>
        <option value="REQUEST">Request</option>
        <option value="ERROR">Error</option>
      </select>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>User</span>
      <select
        value={filters.user}
        onChange={(e) => onChange("user", e.target.value)}
        style={{ ...inputStyle, minWidth: 130 }}
      >
        <option value="">All users</option>
        {USERS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>From</span>
      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange("dateFrom", e.target.value)}
        style={{ ...inputStyle, minWidth: 130 }}
      />
    </div>
  </div>
);
