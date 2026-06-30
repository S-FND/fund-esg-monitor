import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPage: (p: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPage,
}) => {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const btnStyle = (active = false): React.CSSProperties => ({
    padding: "5px 12px",
    border: "0.5px solid #d1d5db",
    borderRadius: 8,
    background: active ? "#EFF6FF" : "#fff",
    color: active ? "#1D4ED8" : "#6b7280",
    borderColor: active ? "#BFDBFE" : "#d1d5db",
    cursor: "pointer",
    fontSize: 13,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "1.25rem",
        fontSize: 13,
        color: "#6b7280",
      }}
    >
      <span>
        {totalItems === 0
          ? "No results"
          : `Showing ${start}–${end} of ${totalItems} logs`}
      </span>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 6 }}>
          {page > 1 && (
            <button style={btnStyle()} onClick={() => onPage(page - 1)}>
              ← Prev
            </button>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} style={btnStyle(p === page)} onClick={() => onPage(p)}>
              {p}
            </button>
          ))}
          {page < totalPages && (
            <button style={btnStyle()} onClick={() => onPage(page + 1)}>
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
