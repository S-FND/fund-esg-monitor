import React, { useEffect, useState } from "react";
import { Eye, X, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { http } from "@/utils/httpInterceptor";
import { toast } from "sonner";
import { IDocumentValidation } from "./CAPTable";

type SuggestedImprovement = {
  section: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
};

type AiSummary = {
  overallScore?: number;
  improvementPercentage?: number;
  confidence?: number;
  valid?: boolean;
  scores?: Record<string, number>;
  missingSections?: string[];
  issues?: string[];
  suggestedImprovements?: SuggestedImprovement[];
  summary?: string;
};

type FileItem = {
  filename: string;
  status?: "Accepted" | "Rejected" | "Pending";
  aiSummary?: AiSummary;
};

type Props = {
  open: boolean;
  files: {
    filename: string;
    mimetype: string;
    size: number;
    s3Link: string;
    status: 'Accepted' | 'Rejected' | 'Pending';
    aiSummary: IDocumentValidation;
    reason?: string;
  }[];
  onClose: () => void;
  onSubmit?: (data: {
    index: number;
    status: "Accepted" | "Rejected";
    reason?: string;
    fileName: string;
  }) => void;
};

export default function DocumentSummaryDialog({
  open,
  files,
  onClose,
  onSubmit,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<"Accepted" | "Rejected" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);

  // Reset selection when modal opens or files change
  useEffect(() => {
    if (open && files.length > 0) {
      setSelectedIndex(0);
      const firstFile = files[0];
      if (firstFile.status === "Accepted" || firstFile.status === "Rejected") {
        setStatus(firstFile.status);
        setReason(firstFile.reason || "");
      } else {
        setStatus(null);
        setReason("");
      }
    }
  }, [open, files]);

  // Preselect status when selected file changes
  useEffect(() => {
    if (open && files.length > 0) {
      const currentFile = files[selectedIndex];
      if (currentFile.status === "Accepted" || currentFile.status === "Rejected") {
        setStatus(currentFile.status);
        setReason(currentFile.reason || "");
      } else {
        setStatus(null);
        setReason("");
      }
    }
  }, [open, selectedIndex, files]);

  if (!open) return null;

  const selectedFile = files[selectedIndex];
  const ai = selectedFile?.aiSummary;

  const isReject = status === "Rejected";
  const isValid = !!status && (!isReject || reason.trim());

  const handleSubmit = async () => {
    if (!status || isSubmitting) return;
    if (isReject && !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.({
        index: selectedIndex,
        status,
        reason: isReject ? reason : undefined,
        fileName: files[selectedIndex].filename,
      });
      // Close dialog after successful submit
      onClose();
      toast.success(`Document ${status === "Accepted" ? "accepted" : "marked for re-submission"}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = async (doc: { filename: string; s3Link: string }) => {
    if (isViewLoading) return;
    setIsViewLoading(true);
    try {
      // Use s3Link if available and not expired, otherwise fetch signed URL
      const response = await http.get(
        `esgdd/escap/upload/evidence-files/signed-urls?key=${encodeURIComponent(doc.filename)}`
      );
      if (response?.data?.signedUrl) {
        window.open(response.data.signedUrl, "_blank");
      } else {
        throw new Error("No signed URL returned");
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to open document. Please try again.");
    } finally {
      setIsViewLoading(false);
    }
  };

  const getStatusBadge = (fileStatus: string) => {
    switch (fileStatus) {
      case "Accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" /> Accepted
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" /> Re-submit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL – File list */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <p className="font-semibold mb-3">Documents ({files.length})</p>
            {files.map((file, idx) => (
              <div
                key={file.filename} // Better to use filename if unique, else idx is fine
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border mb-2 transition-colors ${
                  idx === selectedIndex
                    ? "bg-blue-50 border-blue-400"
                    : "hover:bg-gray-50"
                }`}
            >
              {/* LEFT: File Info */}
                <div
                  onClick={() => setSelectedIndex(idx)}
                  className="flex-1 min-w-0"
                >
                  <div className="relative group">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded z-50 whitespace-nowrap">
                      {file.filename}
                    </div>
                  </div>
                  <div className="mt-1">{getStatusBadge(file.status)}</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(file);
                  }}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="View Document"
                  disabled={isViewLoading}
                >
                  {isViewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>

          {/* RIGHT PANEL – AI review + status selection */}
          <div className="w-2/3 p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold break-words">{selectedFile?.filename}</h2>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">Current status:</span>
              {getStatusBadge(selectedFile.status)}
            </div>

            {ai && (
              <>
                {/* Validation Card */}
                <div
                  className={`border rounded-xl p-4 mt-4 ${
                    ai.valid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                  }`}
                >
                  <p className="font-semibold">
                    {ai.valid ? "✅ Validation Passed" : "⚠️ Validation Failed"}
                  </p>
                  <div className="mt-2 text-sm space-y-1">
                    <p><b>Overall Score:</b> {ai.overallScore ?? "-"}%</p>
                    <p><b>Improvement Needed:</b> {ai.improvementPercentage ?? "-"}%</p>
                    <p><b>Confidence:</b> {ai.confidence ?? "-"}%</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                {ai.scores && Object.keys(ai.scores).length > 0 && (
                  <div className="border rounded-xl p-4 mt-4 bg-gray-50">
                    <p className="font-semibold mb-2">Score Breakdown</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(ai.scores).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/_/g, " ")}</span>
                          <span>{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Sections */}
                {ai.missingSections && ai.missingSections.length > 0 && (
                  <div className="mt-4">
                    <p className="text-red-600 font-semibold mb-2">Missing Sections</p>
                    <div className="flex flex-wrap gap-2">
                      {ai.missingSections.map((sec, i) => (
                        <span key={i} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                          {sec.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issues */}
                {ai.issues && ai.issues.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold">Issues</p>
                    <ul className="list-disc ml-5 text-sm mt-2 space-y-1">
                      {ai.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Improvements */}
                {ai.suggestedImprovements && ai.suggestedImprovements.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Suggested Improvements</p>
                    <div className="space-y-2">
                      {ai.suggestedImprovements.map((imp, i) => (
                        <div key={i} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{imp.section}</p>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                imp.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : imp.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {imp.priority}
                            </span>
                          </div>
                          <p className="text-sm mt-1 text-gray-600">{imp.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STATUS SELECTION */}
            <div className="mt-6 border-t pt-4">
              <p className="font-semibold mb-3">Update Status</p>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="documentStatus"
                    checked={status === "Accepted"}
                    onChange={() => setStatus("Accepted")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">✅ Accept</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="documentStatus"
                    checked={status === "Rejected"}
                    onChange={() => setStatus("Rejected")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">🔄 Re‑submit</span>
                </label>
              </div>

              {status === "Rejected" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    Reason for re‑submission <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Please explain why this document is not accepted..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}