import React from "react";
import { FieldChange } from "../types";

interface ChangesListProps {
  changes: FieldChange[];
}

export const ChangesList: React.FC<ChangesListProps> = ({ changes }) => {
  if (!changes.length) {
    return (
      <p style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic", padding: "8px 0", marginBottom: "1.5rem" }}>
        No field changes — new record created.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
      {changes.map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, flexWrap: "wrap" }}>
          <span style={{ color: "#6b7280", minWidth: 110, flexShrink: 0 }}>{c.field}</span>

          {c.old && (
            <>
              <span
                style={{
                  color: "#A32D2D",
                  textDecoration: "line-through",
                  background: "#FCEBEB",
                  padding: "2px 7px",
                  borderRadius: 4,
                }}
              >
                {c.old}
              </span>
              <span style={{ color: "#9ca3af", fontSize: 14 }}>→</span>
            </>
          )}

          {c.nw ? (
            <span style={{ color: "#3B6D11", background: "#EAF3DE", padding: "2px 7px", borderRadius: 4 }}>
              {c.nw}
            </span>
          ) : (
            <span style={{ color: "#A32D2D", fontSize: 13 }}>(deleted)</span>
          )}
        </div>
      ))}
    </div>
  );
};
