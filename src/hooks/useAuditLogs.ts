import { useState, useMemo, useEffect } from "react";
import { AUDIT_LOGS } from "../data/auditLogs";
import { AuditLog, Filters } from "@/types/audit-log";
import { http } from "@/utils/httpInterceptor";

const PAGE_SIZE = 8;

export function useAuditLogs() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    type: "",
    user: "",
    dateFrom: "",
  });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return AUDIT_LOGS.filter((log) => {
      const q = filters.search.toLowerCase();
      if (q && !log.action.toLowerCase().includes(q) && !log.actor.toLowerCase().includes(q))
        return false;
      if (filters.type && log.type !== filters.type) return false;
      if (filters.user && log.actor !== filters.user) return false;
      if (filters.dateFrom && log.ts.slice(0, 10) < filters.dateFrom) return false;
      return true;
    });
  }, [filters]);

  const getAuditLogs=async ()=>{
    let logs= await http.get('audit');
    //console.log('Fetched logs:', logs);
  }

  useEffect(() => {
    getAuditLogs();
  }, []);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getLogById = (id: number): AuditLog | undefined =>
    AUDIT_LOGS.find((l) => l.id === id);

  return {
    filters,
    updateFilter,
    page,
    setPage,
    paginated,
    filtered,
    totalPages,
    getLogById,
    PAGE_SIZE,
  };
}
