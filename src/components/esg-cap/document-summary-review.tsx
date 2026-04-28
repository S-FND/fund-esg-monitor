import React, { useEffect, useState } from "react";
import { IDocumentValidation } from "./CAPTable";
import { Eye } from "lucide-react";
import { http } from "@/utils/httpInterceptor";
import { toast } from "sonner";

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
  }[];

  onClose: () => void;
  onSubmit?: (data: {
    index: number;
    status: "Accepted" | "Rejected";
    reason?: string;
    fileName: string
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

  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setStatus(null);
      setReason("");
    }
  }, [open]);

  if (!open) return null;

  const selectedFile = files[selectedIndex];
  const ai = selectedFile?.aiSummary;

  const isReject = status === "Rejected";
  const isValid = !!status && (!isReject || reason.trim());

  const handleSubmit = () => {
    if (!status) return;
    if (isReject && !reason.trim()) return;

    onSubmit({
      index: selectedIndex,
      status,
      reason: isReject ? reason : undefined,
      fileName: files[selectedIndex].filename
    });
  };

  const handleView = async (doc: {filename:string;s3Link:string}) => {
    try {
      const getSignedUrl=await http.get('esgdd/escap/uploaded/evidence-files/signed-urls?key='+doc.filename)
      if(getSignedUrl.data){
        window.open(getSignedUrl.data['signedUrl'])
      }
      // if (error) throw error;
      // if (data?.signedUrl) {
      //   window.open(data.signedUrl, '_blank');
      // }
    } catch (error) {
      console.error("View error:", error);
      toast("Failed to view document");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl flex">

        {/* LEFT PANEL (FILES) */}
        <div className="w-1/3 border-r p-4 overflow-y-auto">
          <p className="font-semibold mb-3">Documents</p>

          {files.map((file, idx) => (
            // <div
            //   key={idx}
            //   onClick={() => {
            //     setSelectedIndex(idx);
            //     setStatus(null);
            //     setReason("");
            //   }}
            //   className={`p-3 rounded-lg cursor-pointer mb-2 border ${
            //     idx === selectedIndex
            //       ? "bg-blue-50 border-blue-400"
            //       : "hover:bg-gray-50"
            //   }`}
            // >
            //   <p className="text-sm font-medium">{file.filename}</p>
            //   <p className="text-xs text-gray-500">{file.status || "Pending"}</p>
            // </div>

            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border ${idx === selectedIndex
                  ? "bg-blue-50 border-blue-400"
                  : "hover:bg-gray-50"
                }`}
            >
              {/* LEFT: File Info */}
              <div
                onClick={() => {
                  setSelectedIndex(idx);
                  setStatus(null);
                  setReason("");
                }}
                className="flex-1"
              >
                <p className="text-sm font-medium">{file.filename}</p>
                <p className="text-xs text-gray-500">{file.status || "Pending"}</p>
              </div>

              {/* RIGHT: VIEW ICON */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ✅ prevent row select
                  handleView(file)
                }}
                className="p-2 hover:bg-gray-200 rounded"
                title="View Document"
              >
               <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* RIGHT PANEL (AI REVIEW) */}
        <div className="w-2/3 p-6 overflow-y-auto">

          <h2 className="text-lg font-semibold">{selectedFile?.filename}</h2>

          {ai && (
            <>
              {/* 🔴 Validation Card */}
              <div className="border border-red-300 bg-red-50 rounded-xl p-4 mt-4">
                <p className="font-semibold text-red-700">
                  {ai.valid ? "✅ Validation Passed" : "⚠️ Validation Failed"}
                </p>

                <div className="mt-2 text-sm space-y-1">
                  <p><b>Overall Score:</b> {ai.overallScore ?? "-"}%</p>
                  <p><b>Improvement Needed:</b> {ai.improvementPercentage ?? "-"}%</p>
                  <p><b>Confidence:</b> {ai.confidence ?? "-"}%</p>
                </div>
              </div>

              {/* 🟦 Score Breakdown */}
              {ai.scores && (
                <div className="border rounded-xl p-4 mt-4 bg-gray-50">
                  <p className="font-semibold mb-2">Score Breakdown</p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(ai.scores).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key}</span>
                        <span>{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🟥 Missing Sections */}
              {ai.missingSections?.length ? (
                <div className="mt-4">
                  <p className="text-red-600 font-semibold mb-2">
                    Missing Sections
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {ai.missingSections.map((sec, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full"
                      >
                        {sec.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* ⚠️ Issues */}
              {ai.issues?.length ? (
                <div className="mt-4">
                  <p className="font-semibold">Issues</p>

                  <ul className="list-disc ml-5 text-sm mt-2 space-y-1">
                    {ai.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* 💡 Improvements */}
              {ai.suggestedImprovements?.length ? (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Suggested Improvements</p>

                  <div className="space-y-2">
                    {ai.suggestedImprovements.map((imp, i) => (
                      <div key={i} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between">
                          <p className="font-medium">{imp.section}</p>
                          <span className="text-xs text-red-600">
                            {imp.priority}
                          </span>
                        </div>

                        <p className="text-sm mt-1 text-gray-600">
                          {imp.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* ✅ ACTION SECTION */}
          <div className="mt-6 border-t pt-4">
            <p className="font-semibold mb-2">Select Status</p>

            <div className="flex gap-4">
              <label>
                <input
                  type="radio"
                  checked={status === "Accepted"}
                  onChange={() => setStatus("Accepted")}
                />{" "}
                Accept
              </label>

              <label>
                <input
                  type="radio"
                  checked={status === "Rejected"}
                  onChange={() => setStatus("Rejected")}
                />{" "}
                Reject
              </label>
            </div>

            {status === "Rejected" && (
              <textarea
                className="w-full mt-3 border rounded-lg p-2"
                placeholder="Enter reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}