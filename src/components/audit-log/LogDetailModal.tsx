import React, { useEffect } from "react";
import { AuditLog } from "../types";
import { TypeBadge } from "./TypeBadge";
import { ChangesList } from "./ChangesList";

interface LogDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 10,
};

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = log ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [log]);

  if (!log) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 100,
        padding: "2rem 1rem",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "0.5px solid #e5e7eb",
          width: "100%",
          maxWidth: 580,
          overflow: "hidden",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "0.5px solid #e5e7eb",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <TypeBadge type={log.type} />
              <span style={{ fontSize: 16, fontWeight: 500, color: "#111827" }}>{log.action}</span>
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {log.actor} · {log.time}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "#6b7280",
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
          <div style={SECTION_TITLE}>Changes</div>
          <ChangesList changes={log.changes} />

          <div style={SECTION_TITLE}>Raw data</div>
          <pre
            style={{
              background: "#f9fafb",
              border: "0.5px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              fontFamily: "monospace",
              fontSize: 12,
              color: "#111827",
              overflowX: "auto",
              whiteSpace: "pre",
              lineHeight: 1.6,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {JSON.stringify(log.raw, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "0.5px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 18px",
              border: "0.5px solid #d1d5db",
              borderRadius: 8,
              background: "transparent",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
