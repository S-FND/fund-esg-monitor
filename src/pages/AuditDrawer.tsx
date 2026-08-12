import { http } from "@/utils/httpInterceptor";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export interface AuditChange {
  from: unknown;
  to: unknown;
}

export interface AuditLog {
  _id: string;
  action: string;
  type: 'REQUEST' | 'DATA_CHANGE' | 'ERROR' | 'EVENT';
  timestamp: Date;
  tenantId: string;
  tenantName?: string | null;
  actor: {
    id: string;
    name?: string | null;
    type: 'user' | 'system' | 'PARENT_USER' | 'CHILD_USER';
  };
  changes?: Record<string, AuditChange> | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  context?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  userActionFor?: {
    message: string;
    companyName?: string;
  };
}

// ---- Helper: Parse file upload with rich details ----
function parseFileUploadDetails(log: AuditLog) {
  if (!log.changes) return null;

  const indicatorKey = Object.keys(log.changes).find(k => k.includes('completionIndicators'));
  const fileKey = Object.keys(log.changes).find(k => k.includes('fileUploadedData'));
  const statusKey = Object.keys(log.changes).find(k => k.includes('status'));

  const hasFile = (item: any) => item.fileUploadUrl || item.fileName || item.s3Link || item.filename;

  let fileInfo: any = null;
  let oldFileInfo: any = null;
  let indicatorLabel = '';
  let indicatorResponse = '';
  let indicatorNote = '';
  let statusChange: { from: string; to: string } | null = null;

  // Extract status change
  if (statusKey) {
    const change: any = log.changes[statusKey];
    statusChange = {
      from: change.from || '',
      to: change.to || '',
    };
  }

  // Extract completionIndicators
  if (indicatorKey) {
    const change = log.changes[indicatorKey];
    const fromVal = change.from;
    const toVal = change.to;
    if (Array.isArray(toVal) && toVal.length > 0) {
      const item = toVal[0];
      indicatorLabel = item.indicatorLabel || '';
      indicatorResponse = item.indicatorResponse || '';
      indicatorNote = item.indicatorNote || '';

      if (hasFile(item)) {
        fileInfo = {
          fileName: item.fileName || item.filename || '',
          fileUrl: item.fileUploadUrl || item.s3Link || '',
          fileSize: item.size ? `${(item.size / 1024).toFixed(1)} KB` : '',
          status: item.status || '',
          mimetype: item.mimetype || '',
          uploadedAt: item.uploadedAt || '',
          aiSummary: item.aiSummary || null,
        };
      }
    }
    // Check from array for old file
    if (Array.isArray(fromVal) && fromVal.length > 0) {
      const oldItem = fromVal[0];
      if (hasFile(oldItem)) {
        oldFileInfo = {
          fileName: oldItem.fileName || oldItem.filename || '',
          fileUrl: oldItem.fileUploadUrl || oldItem.s3Link || '',
          fileSize: oldItem.size ? `${(oldItem.size / 1024).toFixed(1)} KB` : '',
          status: oldItem.status || '',
          mimetype: oldItem.mimetype || '',
        };
      }
    }
  }

  // Fallback: extract from fileUploadedData
  if (!fileInfo && fileKey) {
    const change = log.changes[fileKey];
    const fromVal = change.from;
    const toVal = change.to;
    if (Array.isArray(toVal) && toVal.length > 0) {
      const file = toVal[0];
      if (hasFile(file)) {
        fileInfo = {
          fileName: file.filename || file.fileName || '',
          fileUrl: file.s3Link || file.fileUploadUrl || '',
          fileSize: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '',
          status: file.status || '',
          mimetype: file.mimetype || '',
          uploadedAt: file.uploadedAt || '',
          aiSummary: file.aiSummary || null,
        };
      }
    }
    if (Array.isArray(fromVal) && fromVal.length > 0) {
      const oldFile = fromVal[0];
      if (hasFile(oldFile)) {
        oldFileInfo = {
          fileName: oldFile.filename || oldFile.fileName || '',
          fileUrl: oldFile.s3Link || oldFile.fileUploadUrl || '',
          fileSize: oldFile.size ? `${(oldFile.size / 1024).toFixed(1)} KB` : '',
          status: oldFile.status || '',
          mimetype: oldFile.mimetype || '',
        };
      }
    }
  }

  // If indicatorResponse is 'no' and no file, return no-response info
  if (indicatorResponse === 'no' && !fileInfo) {
    return {
      type: 'no',
      indicatorLabel,
      note: indicatorNote,
      statusChange,
    };
  }

  // If we have file info, return rich file details
  if (fileInfo) {
    return {
      type: 'file',
      indicatorLabel,
      fileInfo,
      oldFileInfo,
      statusChange,
    };
  }

  return null;
}

// ---- Helper: Format change values ----
function formatValue(val: any): string {
  if (val === null || val === undefined) return "—";

  // Date object
  if (val instanceof Date) {
    return val.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ISO date string
  if (
    typeof val === "string" &&
    /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(val) &&
    !isNaN(Date.parse(val))
  ) {
    return new Date(val).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "Yes" : "No";

  if (Array.isArray(val) || typeof val === "object") {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
      const item = val[0];

      if (item.indicatorResponse) {
        return `Response: ${item.indicatorResponse}${
          item.indicatorNote ? `, Note: ${item.indicatorNote}` : ""
        }`;
      }

      if (item.filename || item.fileName) {
        return `File: ${item.filename || item.fileName}`;
      }
    }

    return JSON.stringify(val, null, 2);
  }

  return String(val);
}

// ---- Helper: Truncate S3 URL ----
function truncateUrl(url: string, maxLen = 50): string {
  if (!url) return '—';
  if (url.length <= maxLen) return url;
  const parts = url.split('/');
  if (parts.length > 3) {
    return parts.slice(0, 3).join('/') + '/.../' + parts[parts.length - 1];
  }
  return url.slice(0, maxLen) + '...';
}

// ---- File Details Card component ----
function FileDetailsCard({ info }: { info: any }) {
  const { fileInfo, oldFileInfo, indicatorLabel, statusChange } = info;
  const aiSummary = fileInfo.aiSummary;
  const [loading, setLoading] = useState(false);

  const handleView = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fileInfo.fileName) return;
    setLoading(true);
    try {
      const res: any = await http.get(
        `esgdd/escap/uploaded/evidence-files/signed-urls?key=${fileInfo.fileName}`
      );
      const signedUrl = res.data?.signedUrl;
      if (signedUrl) window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Failed to get signed URL:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span className="text-green-600">📄</span> File Upload Details
      </h4>

      {/* Indicator */}
      <div className="grid grid-cols-2 gap-1 text-sm border-b pb-2">
        <span className="font-medium text-gray-500">Indicator</span>
        <span className="text-gray-800">{indicatorLabel || '—'}</span>
      </div>

      {/* File info */}
      <div className="space-y-1 text-sm">
        <div className="grid grid-cols-2 gap-1">
          <span className="font-medium text-gray-500">File Name</span>
          <span className="text-gray-800 font-medium truncate" title={fileInfo.fileName}>
            {fileInfo.fileName || '—'}
          </span>
        </div>
        {fileInfo.uploadedAt && (
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium text-gray-500">Uploaded At</span>
            <span className="text-gray-800">{new Date(fileInfo.uploadedAt).toLocaleString()}</span>
          </div>
        )}
        {fileInfo.fileUrl && (
          <div className="grid grid-cols-2 gap-1">
            <span className="font-medium text-gray-500">Doc Link</span>
            <span className="text-xs text-blue-600 truncate" title={fileInfo.fileUrl}>
              <a
                href="#"
                onClick={handleView}
                className="hover:underline"
                style={{ pointerEvents: loading ? 'none' : 'auto' }}
              >
                {loading ? 'Loading...' : truncateUrl(fileInfo.fileUrl)}
              </a>
            </span>
          </div>
        )}
      </div>

      {/* Status change */}
      {statusChange && (
        <div className="border-t pt-2">
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="font-medium text-gray-500">CAP Status</span>
            <div>
              <span className="line-through text-red-500 text-xs mr-2">{statusChange.from || '—'}</span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600 text-xs ml-2">{statusChange.to || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Old file (if replaced) */}
      {oldFileInfo && (
        <div className="border-t pt-2">
          <h5 className="text-xs font-semibold text-gray-500 mb-1">🔁 Replaced File</h5>
          <div className="space-y-1 text-xs text-gray-600 pl-2">
            <div><span className="font-medium">Name:</span> {oldFileInfo.fileName || '—'}</div>
            <div><span className="font-medium">Size:</span> {oldFileInfo.fileSize || '—'}</div>
            {oldFileInfo.status && <div><span className="font-medium">Status:</span> {oldFileInfo.status}</div>}
          </div>
        </div>
      )}

      {/* AI Validation Summary */}
      {aiSummary && (
        <div className="border-t pt-2">
          <h5 className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <span>🤖</span> AI Validation
          </h5>
          <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-2">
              <span className="font-medium">Score:</span>
              <span className={`font-bold ${aiSummary.overallScore >= 60 ? 'text-green-600' : aiSummary.overallScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {aiSummary.overallScore}%
              </span>
              <span className="text-gray-400">|</span>
              <span className="font-medium">Confidence:</span>
              <span className="font-bold">{aiSummary.confidence}%</span>
              <span className="text-gray-400">|</span>
              <span className="font-medium">Valid:</span>
              <span className={`font-bold ${aiSummary.valid ? 'text-green-600' : 'text-red-600'}`}>
                {aiSummary.valid ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            {aiSummary.summary && (
              <p className="text-gray-600 text-xs mt-1 border-t pt-1">{aiSummary.summary}</p>
            )}
            {aiSummary.missingSections && aiSummary.missingSections.length > 0 && (
              <div className="mt-1">
                <span className="font-medium text-red-500">Missing Sections:</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {aiSummary.missingSections.map((s: string, i: number) => (
                    <span key={i} className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {aiSummary.issues && aiSummary.issues.length > 0 && (
              <div className="mt-1">
                <span className="font-medium text-orange-500">Issues:</span>
                <ul className="list-disc list-inside text-gray-600 mt-0.5 pl-2">
                  {aiSummary.issues.slice(0, 2).map((issue: string, i: number) => (
                    <li key={i} className="text-xs">{issue}</li>
                  ))}
                  {aiSummary.issues.length > 2 && (
                    <li className="text-xs text-gray-400">+{aiSummary.issues.length - 2} more issues</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- "No" Response Card ----
function NoResponseCard({ info }: { info: any }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
        <span>⚠️</span> Indicator Response
      </h4>
      <p className="text-sm">
        <span className="font-medium">Indicator:</span> {info.indicatorLabel || '—'}
      </p>
      <p className="text-sm">
        <span className="font-medium">Response:</span> <span className="text-red-600 font-semibold">No</span>
      </p>
      <p className="text-sm">
        <span className="font-medium">Note:</span> {info.note || '—'}
      </p>
      {info.statusChange && (
        <p className="text-sm border-t pt-1 mt-1">
          <span className="font-medium">CAP Status:</span> {info.statusChange.from || '—'} → <span className="text-green-600 font-medium">{info.statusChange.to || '—'}</span>
        </p>
      )}
    </div>
  );
}

export default function AuditDrawer({ open, onClose, logs }: {
  open: boolean;
  onClose: () => void;
  logs: AuditLog[];
}) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const getActionCategory = (action: string) => {
    const actionName = action?.split("::")[0]?.trim();
    switch (actionName) {
      case "EDIT_FINALIZED_PLAN": return "DATA_CHANGE";
      case "REQUEST_CHANGE": return "REQUEST_CHANGE";
      case "UPLOAD_ESG_CAP_EVIDENCE": return "FILE_UPLOAD";
      default: return "OTHER";
    }
  };

  const dataChangesCount = logs.filter(l => getActionCategory(l.action) === "DATA_CHANGE").length;
  const requestsCount = logs.filter(l => getActionCategory(l.action) === "REQUEST_CHANGE").length;
  const fileUploadCount = logs.filter(l => getActionCategory(l.action) === "FILE_UPLOAD").length;

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.action?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.actor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.userActionFor?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const actionCategory = getActionCategory(log.action);
    const matchesType = typeFilter === "ALL" || actionCategory === typeFilter;
    return matchesSearch && matchesType;
  });

  const getPlanItemName = (log: AuditLog) => {
    if (!log.changes) return null;
    const firstKey = Object.keys(log.changes)[0];
    const match = firstKey.match(/^plan\.(.*?)\./);
    return match?.[1] || null;
  };

  const getReportIdAndItem = (log: AuditLog) => {
    const planItemName = getPlanItemName(log);
    if (!planItemName) return { reportId: null, item: null };

    // Try to get data from newData or oldData
    const data = log.newData || log.oldData;
    if (data?.plan && Array.isArray(data.plan)) {
      const found = data.plan.find((p: any) => p.item === planItemName);
      if (found) {
        return { reportId: found.reportId, item: found.item };
      }
    }
    // Fallback: if reportId is missing, hide the link
    return { reportId: null, item: planItemName };
  };

  if (!open) return null;

  function formatFieldName(key: string) {
    // plan.Training Records System.highlights
    const parts = key.split(".");
  
    if (parts.length >= 3 && parts[0] === "plan") {
      return `${parts[1]} → ${parts[2]}`;
    }
  
    return key
      .replace(/_/g, " ")
      .replace(/\./g, " → ");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[720px] bg-gray-50 h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Audit Logs</h2>
            <p className="text-xs text-gray-500">Track all changes for CAP items</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white border-b flex gap-2">
          <input
            placeholder="Search by action, actor, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-full text-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border p-2 rounded text-sm bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="DATA_CHANGE">Data Changes</option>
            <option value="REQUEST_CHANGE">Request Changes</option>
            <option value="FILE_UPLOAD">File Uploads</option>
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-2 p-4">
          <MiniCard title="All Types" value={logs.length} color={typeFilter === "ALL" ? "from-slate-700 to-slate-800" : "from-slate-500 to-slate-700"} onClick={() => setTypeFilter("ALL")} />
          <MiniCard title="Data Changes" value={dataChangesCount} color={typeFilter === "DATA_CHANGE" ? "from-green-700 to-green-800" : "from-green-500 to-green-700"} onClick={() => setTypeFilter("DATA_CHANGE")} />
          <MiniCard title="Request Changes" value={requestsCount} color={typeFilter === "REQUEST_CHANGE" ? "from-blue-700 to-blue-800" : "from-blue-500 to-blue-700"} onClick={() => setTypeFilter("REQUEST_CHANGE")} />
          <MiniCard title="File Uploads" value={fileUploadCount} color={typeFilter === "FILE_UPLOAD" ? "from-purple-700 to-purple-800" : "from-purple-500 to-purple-700"} onClick={() => setTypeFilter("FILE_UPLOAD")} />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Logs list */}
          <div className="w-1/2 border-r overflow-y-auto bg-white">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">No matching logs</div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log._id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 border-b cursor-pointer transition hover:bg-gray-50 ${selectedLog?._id === log._id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                    }`}
                >
                  <div className="flex justify-between items-start">
                    {(() => {
                      const actionCategory = getActionCategory(log.action);
                      return (
                        <span className={`text-xs px-2 py-1 rounded ${actionCategory === "DATA_CHANGE" ? "bg-green-100 text-green-700" :
                            actionCategory === "REQUEST_CHANGE" ? "bg-blue-100 text-blue-700" :
                              actionCategory === "FILE_UPLOAD" ? "bg-purple-100 text-purple-700" :
                                "bg-gray-100 text-gray-700"
                          }`}>
                          {actionCategory}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* 👇 Updated block with link */}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-blue-600 font-medium truncate max-w-[60%]">
                      {getPlanItemName(log)}
                    </p>
                    {(() => {
                      const { reportId, item } = getReportIdAndItem(log);
                      const planItemName = getPlanItemName(log);

                      if (!reportId) return null;
                      return (
                        <Link
                          to={`/esg-cap/review/${reportId}?itemName=${encodeURIComponent(planItemName)}&companyEntityId=${reportId}&companyEmail=${encodeURIComponent(item)}`}
                          className="text-xs text-blue-500 hover:text-blue-700 underline ml-2 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                        >
                          View CAP
                        </Link>
                      );
                    })()}
                  </div>
                  <div style={{ textAlign: "left" }}>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {log.actor.name || "System"}
                    {log.userActionFor?.companyName && ` • ${log.userActionFor.companyName}`}
                  </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {Object.keys(log.changes).length} field(s) changed
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT: Details panel */}
          <div className="w-1/2 overflow-y-auto p-4 bg-gray-50">
            {!selectedLog ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                <span className="text-3xl mb-2">🕘</span>
                Select a log to view details
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                {/* <div className="border-b pb-2">
                  <p className="text-xs text-gray-500">
                    {selectedLog.actor?.name || "System"} • {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div> */}

                {/* User action message */}
                {selectedLog.userActionFor?.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-700">
                    {selectedLog.userActionFor.message}
                  </div>
                )}

                {/* Special handling for UPLOAD_ESG_CAP_EVIDENCE */}
                {selectedLog.action.includes('UPLOAD_ESG_CAP_EVIDENCE') && (() => {
                  const info = parseFileUploadDetails(selectedLog);
                  if (!info) return null;

                  if (info.type === 'file') {
                    return <FileDetailsCard info={info} />;
                  }

                  if (info.type === 'no') {
                    return <NoResponseCard info={info} />;
                  }

                  return null;
                })()}

                {/* Generic Changes – hidden when file upload or indicator card is shown */}
                {!(selectedLog.action.includes('UPLOAD_ESG_CAP_EVIDENCE') && parseFileUploadDetails(selectedLog)) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Changes</h4>
                    {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {Object.entries(selectedLog.changes).map(([key, val]: [string, any]) => (
                          <div key={key} className="bg-white border rounded p-2 text-sm shadow-sm">
                            <p className="font-medium text-gray-700 capitalize"> {formatFieldName(key)}</p>
                            <div className="flex flex-col gap-1 mt-1 text-xs">
                              <div>
                                <span className="font-semibold text-red-600">Old:</span>
                                <pre className="bg-red-50 px-2 py-1 rounded whitespace-pre-wrap break-all">
                                  {formatValue(val.from)}
                                </pre>
                              </div>
                              <div>
                                <span className="font-semibold text-green-600">New:</span>
                                <pre className="bg-green-50 px-2 py-1 rounded whitespace-pre-wrap break-all">
                                  {formatValue(val.to)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        {selectedLog.type === 'DATA_CHANGE'
                          ? "No field‑level changes recorded"
                          : "No changes (request only)"}
                      </p>
                    )}
                  </div>
                )}

                {/* Context (optional) */}
                {selectedLog.context && (
                  <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                    <p>IP: {selectedLog.context.ip || "—"}</p>
                    <p>Request ID: {selectedLog.context.requestId || "—"}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCard({
  title,
  value,
  color,
  onClick,
}: {
  title: string;
  value: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg text-white bg-gradient-to-br ${color} shadow-sm cursor-pointer hover:opacity-90 transition`}
    >
      <p className="text-xs opacity-90">{title}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}