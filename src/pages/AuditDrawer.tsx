import { analyzeEscapChanges, getDiff } from "@/hooks/get-diff";
import { get } from "http";
import React, { useEffect, useState } from "react";

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

  oldData?: Record<string, unknown> | null; // ✅ ADDED
  newData?: Record<string, unknown> | null;

  metadata?: Record<string, unknown>;
  context?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  userActionFor:{
    message:string;
    companyName?: string;
  }
}

export default function AuditDrawer({ open, onClose, logs }: {
  open: boolean;
  onClose: () => void;
  logs: AuditLog[];
}) {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    if (logs?.length > 0) {
      logs.forEach(log => {
        if (log.oldData && log.newData) {
          console.log(`Diff for log ${log._id}:`, analyzeEscapChanges(log.oldData, log.newData));
        }
      });

    }
  }, [logs]);

  // 🔥 Replace this with API data later
  // const logs = [
  //   {
  //     id: "1",
  //     type: "DATA_CHANGE",
  //     action: "UPDATE_PLAN",
  //     actor: { name: "Abhishek" },
  //     time: "2 min ago",
  //     changes: {
  //       name: { from: "Old Plan", to: "New Plan" },
  //       status: { from: "Pending", to: "Approved" },
  //     },
  //     newData: { name: "New Plan" },
  //   },
  //   {
  //     id: "2",
  //     type: "DATA_CHANGE",
  //     action: "CREATE_PLAN",
  //     actor: { name: "Abhishek" },
  //     time: "5 min ago",
  //     changes: null,
  //     newData: { name: "Created Plan" },
  //   },
  // ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-[720px] bg-gray-50 h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Audit Logs</h2>
            <p className="text-xs text-gray-500">
              Track all changes for CAP items
            </p>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Filters */}
        {/* <div className="p-4 bg-white border-b flex gap-2">
          <input
            placeholder="Search..."
            className="border p-2 rounded w-full text-sm"
          />
          <select className="border p-2 rounded text-sm">
            <option>All</option>
            <option>DATA_CHANGE</option>
            <option>REQUEST</option>
            <option>ERROR</option>
          </select>
        </div> */}

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2 p-4">
          <MiniCard title="Changes" value={logs.filter((log) => log.action.includes("CHANGE")).length} color="from-green-500 to-emerald-600" />
          <MiniCard title="Create" value={logs.filter((log) => log.action.includes("CREATE")).length} color="from-blue-500 to-blue-600" />
          <MiniCard title="Reminders" value={logs.filter((log) => log.action.includes("REMINDER")).length} color="from-red-500 to-red-600" />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: Logs */}
          <div className="w-1/2 border-r overflow-y-auto p-3 space-y-2 bg-white">
            {logs?.map((log) => (
              <div
                key={log._id}
                onClick={() => setSelectedLog(log)}
                className={`p-3 rounded-lg border cursor-pointer transition relative
                  ${
                    selectedLog?.id === log._id
                      ? "bg-blue-50 border-blue-400 shadow-sm"
                      : "hover:bg-gray-50"
                  }
                `}
              >
                {/* Selected indicator */}
                {selectedLog?.id === log._id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                    {log.type}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>

                <p className="font-medium mt-1">{log.action.split("::")[0]}</p>
                
                <p className="text-xs text-gray-500">
                  {log.actor.name} •{" "}
                  changes for {log.userActionFor?.companyName }
                  {/* {log.changes
                    ? `Changed ${Object.keys(log.changes).length} fields`
                    : "Created record"} */}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT: Details */}
          <div className="w-1/2 p-4 overflow-y-auto bg-gray-50">
            {!selectedLog ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                <span className="text-3xl mb-2">🕘</span>
                Select a log to view details
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-4 border-b pb-3">
                  <h3 className="text-md font-semibold">
                    {selectedLog.action}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedLog.actor?.name} • {selectedLog.time}
                  </p>
                </div>

                {/* {JSON.stringify(getDiff(selectedLog.oldData, selectedLog.newData, "")) === "[]" ? (
                  <p className="text-xs text-gray-500">
                    No newwww changes (record created)
                  </p>
                ) : null} */}

                {/* Changes */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Changes</h4>
                {
                  selectedLog.userActionFor?.message ? (
                    <p className="text-xs text-gray-500">
                      {selectedLog.userActionFor.message}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {selectedLog.changes
                        ? `Changed ${Object.keys(selectedLog.changes).length} fields`
                        : "No changes (record created)"}
                    </p>
                  )
                }
                  {/* {selectedLog.changes ? (
                    <div className="space-y-2">
                      {Object.entries(selectedLog.changes).map(
                        ([key, val]: any) => (
                          <div key={key} className="text-sm">
                            <p className="font-medium">{key}</p>

                            <div className="flex items-center gap-2">
                              <span className="text-red-500 line-through text-xs">
                                {String(val.from)}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="text-green-600 text-xs">
                                {String(val.to)}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No changes (record created)
                    </p>
                  )} */}
                </div>

                {/* Raw Data */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Raw Data</h4>

                  <pre className="bg-white border p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedLog.newData || {}, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🔥 KPI Card Component
function MiniCard({ title, value, color }: any) {
  return (
    <div className={`p-3 rounded-lg text-white bg-gradient-to-br ${color}`}>
      <p className="text-xs">{title}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}