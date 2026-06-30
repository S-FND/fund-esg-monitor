export type LogType = "DATA_CHANGE" | "REQUEST" | "ERROR";

export interface FieldChange {
  field: string;
  old: string | null;
  nw: string | null;
}

export interface AuditLog {
  id: number;
  type: LogType;
  action: string;
  actor: string;
  time: string;
  ts: string;
  changes: FieldChange[];
  raw: Record<string, unknown>;
}

export interface Filters {
  search: string;
  type: LogType | "";
  user: string;
  dateFrom: string;
}
