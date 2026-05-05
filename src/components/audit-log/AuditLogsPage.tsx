import React, { useState } from "react";
import { KpiCard } from "./KpiCard";
import { FilterBar } from "./FilterBar";
import { LogCard } from "./LogCard";
import { LogDetailModal } from "./LogDetailModal";
import { Pagination } from "./Pagination";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { AuditLog } from "@/types/audit-log";
import { AUDIT_LOGS } from "@/data/auditLogs";

const KPI_DATA = [
  { label: "Total Logs", value: "2,847", sub: "+124 today", accent: "#378ADD" },
  { label: "Data Changes", value: "1,203", sub: "42% of total", accent: "#639922" },
  { label: "Requests", value: "1,419", sub: "50% of total", accent: "#BA7517" },
  { label: "Errors", value: "225", sub: "8% of total", accent: "#E24B4A" },
];

export const AuditLogsPage: React.FC = () => {
  const { filters, updateFilter, page, setPage, paginated, filtered, totalPages, PAGE_SIZE } =
    useAuditLogs();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const handleViewLog = (id: number) => {
    const log = AUDIT_LOGS.find((l) => l.id === id) ?? null;
    setSelectedLog(log);
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "#111827" }}>Audit Logs</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Track all system and data changes
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: "1.5rem",
        }}
      >
        {KPI_DATA.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={updateFilter} />

      {/* Log List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {paginated.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#6b7280", fontSize: 14 }}>
            No logs match your filters.
          </div>
        ) : (
          paginated.map((log) => (
            <LogCard key={log.id} log={log} onClick={handleViewLog} />
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
      />

      {/* Detail Modal */}
      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};
