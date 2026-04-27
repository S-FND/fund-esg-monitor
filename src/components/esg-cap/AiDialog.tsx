import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AiDialog({ isViewAiOpen, onOpenChange, item }: any) {
  const [editableAi, setEditableAi] = useState<any>(item?.aiResponseRaw);

  useEffect(() => {
    setEditableAi(item?.aiResponseRaw);
  }, [item]);

  return (
    <Dialog open={isViewAiOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">

        {/* 🔹 HEADER */}
        <DialogHeader>
          <DialogTitle>{item?.item}</DialogTitle>
          <DialogDescription>
            ESG Action Plan Details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          {/* 🔹 ACTION OVERVIEW */}
          <div className="border rounded-lg p-4 bg-muted/10">
            <h3 className="font-semibold mb-3">Action Overview</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">

              <div>
                <p className="text-muted-foreground">Item</p>
                <p className="font-medium">{item?.item}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium capitalize">{item?.category}</p>
              </div>

              <div className="col-span-2">
                <p className="text-muted-foreground">Measures</p>
                <p className="font-medium whitespace-pre-line">
                  {item?.measures}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-muted-foreground">Deliverable</p>
                <p className="font-medium whitespace-pre-line">
                  {item?.deliverable}
                </p>
              </div>
            </div>
          </div>

          {/* 🔹 AI SUMMARY */}
          <div>
            <h3 className="font-semibold mb-2">AI Summary</h3>
            <p className="text-sm text-muted-foreground">
              {editableAi?.reasoning}
            </p>
            <p className="text-xs mt-1">
              Confidence: {(editableAi?.confidence * 100).toFixed(0)}%
            </p>
          </div>

          {/* 🔹 EXECUTION SUMMARY */}
          {editableAi?.executionSummary && (
            <div>
              <h3 className="font-semibold mb-2">Execution Summary</h3>
              <p className="text-sm text-muted-foreground">
                {editableAi.executionSummary}
              </p>
            </div>
          )}

          {/* 🔹 DOCUMENT DETAILS */}
          {editableAi?.documentRequired && <div>
            <h3 className="font-semibold mb-2">Document Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><b>Document/Policy Required:</b> {editableAi?.documentRequired ? "Yes" : "No"}</p>
              <p><b>Document Type:</b> {editableAi?.documentType || "-"}</p>
              <p><b>Source Type:</b> {editableAi?.sourceType || "-"}</p>
            </div>
          </div>}

          {/* 🔹 REQUIRED EVIDENCE */}
          {editableAi?.requiredEvidence && (
            <div>
              <h3 className="font-semibold mb-2">Required Evidence</h3>

              <div className="flex flex-wrap gap-2 mb-2">
                {editableAi.requiredEvidence.types?.map((type: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    {type}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {editableAi.requiredEvidence.reasoning}
              </p>
            </div>
          )}

          {/* 🔹 SECTIONS (ONLY IF DOCUMENT REQUIRED) */}
          {editableAi?.documentRequired && editableAi?.sections?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">
                {editableAi.documentType
                  ? `${editableAi.documentType} Sections`
                  : "Suggested Sections"}
              </h3>

              <div className="flex flex-wrap gap-2">
                {editableAi.sections.map((sec: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                  >
                    {sec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 🔹 TEMPLATES */}
          {editableAi?.templates?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Templates</h3>

              <div className="space-y-4">
                {editableAi.templates.map((template: any, index: number) => {

                  const isTabular =
                    template.format === "excel" ||
                    template.type === "data";

                  return (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-muted/20"
                    >
                      <p className="font-medium">{template.name}</p>

                      <p className="text-xs text-muted-foreground mb-3">
                        Type: {template.type} • Format: {template.format} • Mandatory:{" "}
                        {template.isMandatory ? "Yes" : "No"}
                      </p>

                      {/* 🔥 TABLE VIEW */}
                      {isTabular ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm border">
                            <thead>
                              <tr className="bg-gray-100">
                                {Object.keys(template.structure || {}).map((col: string) => (
                                  <th key={col} className="border px-3 py-2 text-left">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {Object.values(template.structure || {}).map((val: any, i) => (
                                  <td key={i} className="border px-3 py-2 text-muted-foreground">
                                    {val}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        /* 🔥 DOCUMENT VIEW */
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(template.structure || {}).map(
                            ([key, value]: any) => (
                              <div
                                key={key}
                                className="flex justify-between border-b pb-1"
                              >
                                <span className="text-muted-foreground">{key}</span>
                                <span className="font-medium">{value}</span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* 🔻 FOOTER */}
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}