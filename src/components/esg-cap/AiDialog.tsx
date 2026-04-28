// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";

// export function AiDialog({ isViewAiOpen, onOpenChange, item }: any) {
//   const [editableAi, setEditableAi] = useState<any>(item?.aiResponseRaw);

//   useEffect(() => {
//     setEditableAi(item?.aiResponseRaw);
//   }, [item]);

//   return (
//     <Dialog open={isViewAiOpen} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">

//         <DialogHeader>
//           <DialogTitle>{item?.item}</DialogTitle>
//           <DialogDescription>
//             ESG Action Plan Details
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-6">

//           <div className="border rounded-lg p-4 bg-muted/10">
//             <h3 className="font-semibold mb-3">Action Overview</h3>

//             <div className="grid grid-cols-2 gap-4 text-sm">

//               <div>
//                 <p className="text-muted-foreground">Item</p>
//                 <p className="font-medium">{item?.item}</p>
//               </div>

//               <div>
//                 <p className="text-muted-foreground">Category</p>
//                 <p className="font-medium capitalize">{item?.category}</p>
//               </div>

//               <div className="col-span-2">
//                 <p className="text-muted-foreground">Measures</p>
//                 <p className="font-medium whitespace-pre-line">
//                   {item?.measures}
//                 </p>
//               </div>

//               <div className="col-span-2">
//                 <p className="text-muted-foreground">Deliverable</p>
//                 <p className="font-medium whitespace-pre-line">
//                   {item?.deliverable}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div>
//             <h3 className="font-semibold mb-2">AI Summary</h3>
//             <p className="text-sm text-muted-foreground">
//               {editableAi?.reasoning}
//             </p>
//             <p className="text-xs mt-1">
//               Confidence: {(editableAi?.confidence * 100).toFixed(0)}%
//             </p>
//           </div>

//           {editableAi?.executionSummary && (
//             <div>
//               <h3 className="font-semibold mb-2">Execution Summary</h3>
//               <p className="text-sm text-muted-foreground">
//                 {editableAi.executionSummary}
//               </p>
//             </div>
//           )}

//           {editableAi?.documentRequired && <div>
//             <h3 className="font-semibold mb-2">Document Details</h3>
//             <div className="grid grid-cols-2 gap-3 text-sm">
//               <p><b>Document/Policy Required:</b> {editableAi?.documentRequired ? "Yes" : "No"}</p>
//               <p><b>Document Type:</b> {editableAi?.documentType || "-"}</p>
//               <p><b>Source Type:</b> {editableAi?.sourceType || "-"}</p>
//             </div>
//           </div>}

//           {editableAi?.requiredEvidence && (
//             <div>
//               <h3 className="font-semibold mb-2">Required Evidence</h3>

//               <div className="flex flex-wrap gap-2 mb-2">
//                 {editableAi.requiredEvidence.types?.map((type: string, i: number) => (
//                   <span
//                     key={i}
//                     className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
//                   >
//                     {type}
//                   </span>
//                 ))}
//               </div>

//               <p className="text-xs text-muted-foreground">
//                 {editableAi.requiredEvidence.reasoning}
//               </p>
//             </div>
//           )}

//           {editableAi?.documentRequired && editableAi?.sections?.length > 0 && (
//             <div>
//               <h3 className="font-semibold mb-2">
//                 {editableAi.documentType
//                   ? `${editableAi.documentType} Sections`
//                   : "Suggested Sections"}
//               </h3>

//               <div className="flex flex-wrap gap-2">
//                 {editableAi.sections.map((sec: string, i: number) => (
//                   <span
//                     key={i}
//                     className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
//                   >
//                     {sec}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}

//           {editableAi?.templates?.length > 0 && (
//             <div>
//               <h3 className="font-semibold mb-2">Templates</h3>

//               <div className="space-y-4">
//                 {editableAi.templates.map((template: any, index: number) => {

//                   const isTabular =
//                     template.format === "excel" ||
//                     template.type === "data";

//                   return (
//                     <div
//                       key={index}
//                       className="border rounded-lg p-4 bg-muted/20"
//                     >
//                       <p className="font-medium">{template.name}</p>

//                       <p className="text-xs text-muted-foreground mb-3">
//                         Type: {template.type} • Format: {template.format} • Mandatory:{" "}
//                         {template.isMandatory ? "Yes" : "No"}
//                       </p>

//                       {isTabular ? (
//                         <div className="overflow-x-auto">
//                           <table className="min-w-full text-sm border">
//                             <thead>
//                               <tr className="bg-gray-100">
//                                 {Object.keys(template.structure || {}).map((col: string) => (
//                                   <th key={col} className="border px-3 py-2 text-left">
//                                     {col}
//                                   </th>
//                                 ))}
//                               </tr>
//                             </thead>
//                             <tbody>
//                               <tr>
//                                 {Object.values(template.structure || {}).map((val: any, i) => (
//                                   <td key={i} className="border px-3 py-2 text-muted-foreground">
//                                     {val}
//                                   </td>
//                                 ))}
//                               </tr>
//                             </tbody>
//                           </table>
//                         </div>
//                       ) : (
//                         <div className="grid grid-cols-2 gap-2 text-sm">
//                           {Object.entries(template.structure || {}).map(
//                             ([key, value]: any) => (
//                               <div
//                                 key={key}
//                                 className="flex justify-between border-b pb-1"
//                               >
//                                 <span className="text-muted-foreground">{key}</span>
//                                 <span className="font-medium">{value}</span>
//                               </div>
//                             )
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//         </div>

//         <DialogFooter className="mt-6">
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Close
//           </Button>
//         </DialogFooter>

//       </DialogContent>
//     </Dialog>
//   );
// }
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
import { DiffView } from "./DiffView";
import { http } from "@/utils/httpInterceptor";
import { AiResponse, ESGCapItem } from "./CAPTable";
import { toast } from "sonner";

type AiDialogProps = {
  isViewAiOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ESGCapItem;
  companyEntityId: string;
  setReloadData?: (reload: boolean) => void;
};

export function AiDialog({
  isViewAiOpen,
  onOpenChange,
  item,
  companyEntityId,
  setReloadData
}: Partial<AiDialogProps>) {
  if (!item?.aiResponseRaw) {
    return;
  }
  const [editableAi, setEditableAi] = useState<any>(item?.aiResponseRaw);
  const [originalAi, setOriginalAi] = useState<any>(item?.aiResponseRaw);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [insights,setInsights]=useState<AiResponse>(null)

  const [openSections, setOpenSections] = useState<any>({
    overview: true,
    summary: true,
    evidence: true,
    sections: true,
    templates: true,
  });

  useEffect(() => {
    setEditableAi(item?.aiResponseRaw);
    setOriginalAi(item?.aiResponseRaw);
    setIsEditMode(false);
    setIsDiffMode(false);
  }, [item]);

  const toggleSection = (key: string) => {
    setOpenSections((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isChanged = (a: any, b: any) =>
    JSON.stringify(a) !== JSON.stringify(b);

  const SectionHeader = ({ title, count, sectionKey }: any) => (
    <div
      className="flex justify-between items-center cursor-pointer border-b pb-2"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex gap-2 items-center">
        <h3 className="font-semibold">{title}</h3>
        {count !== undefined && (
          <span className="text-xs bg-gray-200 px-2 rounded">{count}</span>
        )}
      </div>
      <span>{openSections[sectionKey] ? "▲" : "▼"}</span>
    </div>
  );

  const handleSave = async () =>{
    console.log("Editable ai",editableAi)
    if (!companyEntityId) {
      alert("Entity Id is required")
    }
    let approveItemRes = await http.post('investor/esgdd/escap/insights/override', {
      manualInsights:editableAi,
      approve:false,
      reportId: item.reportId,
      itemIndexId: item.tempId,
      companyEntityId: companyEntityId,
      capItemId: item._id,
      item:item.item
    });
    console.log('approveItemRes', approveItemRes)
    if (approveItemRes.data.status) {
      console.log("APPROVED DATA:", editableAi);
      toast.success("Item insights updated");
      setReloadData(true)
      onOpenChange(false);
      setIsEditMode(false)
    }
    else {
      toast.error("Insights approval failed")
    }
    
  };

  const handleApprove = async () => {
    if (!companyEntityId) {
      alert("Entity Id is required")
    }
    let approveItemRes = await http.post('investor/esgdd/escap/insights/approve', {
      reportId: item.reportId,
      itemIndexId: item.tempId,
      approveAll: false,
      companyEntityId: companyEntityId,
      capItemId: item._id,
      item:item.item
    });
    if (approveItemRes.data.status) {
      toast.success("Item insights approved");
      setReloadData(true)
      onOpenChange(false);
    }
    else {
      toast.error("Insights approval failed")
    }

  };

  useEffect(()=>{
    if(item.manualInsights){
      setInsights(item.manualInsights);
      setEditableAi(item.manualInsights)
    }
    else if(item.aiResponseRaw){
      setInsights(item.aiResponseRaw)
    }
  },[item])

  return (
    <Dialog open={isViewAiOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <DialogHeader>
          <DialogTitle>{item?.item}</DialogTitle>
          <DialogDescription>AI Review & Override</DialogDescription>
        </DialogHeader>

        {/* ACTION BAR */}
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            {!isEditMode ? (
              <Button disabled={item.insightsApproved} onClick={() => setIsEditMode(true)}>Edit</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button disabled={item.insightsApproved} variant="outline" onClick={() => setIsDiffMode(!isDiffMode)}>
              {isDiffMode ? "Hide Diff" : "Compare"}
            </Button>
            {/* <Button disabled={item.insightsApproved} onClick={handleApprove}>item.insightsApproved?'Approved':Approve</Button> */}
            <Button
              disabled={item?.insightsApproved}
              onClick={() => {
                if (!item?.insightsApproved) handleApprove();
              }}
            >
              {item?.insightsApproved ? "Approved" : "Approve"}
            </Button>
          </div>
        </div>

        {/* DIFF MODE */}
        {isDiffMode && (
          <DiffView
            originalAi={originalAi}
            editableAi={editableAi}
          />
        )}

        {/* CONTENT */}
        <div className="space-y-6">

          {/* OVERVIEW */}
          <div>
            <SectionHeader title="Action Overview" sectionKey="overview" />
            {openSections.overview && (
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div><b>Category:</b> {item.category}</div>
                <div><b>Item:</b> {item.item}</div>
                <div className="col-span-2"><b>Measures:</b> {item.measures}</div>
                <div className="col-span-2"><b>Deliverable:</b> {item.deliverable}</div>
              </div>
            )}
          </div>

          {/* AI SUMMARY */}
          <div>
            <SectionHeader title="AI Summary" sectionKey="summary" />
            {openSections.summary && (
              isEditMode ? (
                <textarea
                  className="w-full border p-2 bg-yellow-50"
                  value={editableAi.reasoning}
                  onChange={(e) =>
                    setEditableAi((prev: any) => ({
                      ...prev,
                      reasoning: e.target.value,
                    }))
                  }
                />
              ) : (
                <p>{editableAi.reasoning}</p>
              )
            )}
          </div>

          {/* EVIDENCE */}
          {/* <div>
            <SectionHeader
              title="Evidence"
              count={editableAi?.requiredEvidence?.types?.length}
              sectionKey="evidence"
            />
            {openSections.evidence && (
              <div className="flex flex-wrap gap-2 mt-2">
                {editableAi.requiredEvidence.types.map((t: string, i: number) =>
                  isEditMode ? (
                    <input
                      key={i}
                      value={t}
                      className="border px-2 py-1 text-xs"
                      onChange={(e) => {
                        const updated = [...editableAi.requiredEvidence.types];
                        updated[i] = e.target.value;
                        setEditableAi((prev: any) => ({
                          ...prev,
                          requiredEvidence: { ...prev.requiredEvidence, types: updated },
                        }));
                      }}
                    />
                  ) : (
                    <span key={i} className="px-2 py-1 text-xs bg-blue-100 rounded">
                      {t}
                    </span>
                  )
                )}
              </div>
            )}
          </div> */}

          {/* TEMPLATES */}
          {/* <div>
            <SectionHeader
              title="Templates"
              count={editableAi.templates?.length}
              sectionKey="templates"
            />

            {openSections.templates &&
              editableAi.templates.map((t: any, index: number) => (
                <div key={index} className="border p-3 rounded mt-2">
                  {isEditMode ? (
                    <input
                      value={t.name}
                      className="border p-1 w-full"
                      onChange={(e) => {
                        const updated = [...editableAi.templates];
                        updated[index].name = e.target.value;
                        setEditableAi({ ...editableAi, templates: updated });
                      }}
                    />
                  ) : (
                    <p className="font-medium">{t.name}</p>
                  )}

                  {Object.entries(t.structure || {}).map(([k, v]: any) => (
                    <div key={k} className="flex gap-2 mt-1">
                      {isEditMode ? (
                        <>
                          <input
                            className="border text-xs px-1"
                            value={k}
                            readOnly
                          />
                          <input
                            className="border text-xs px-1"
                            value={v}
                            onChange={(e) => {
                              const updated = [...editableAi.templates];
                              updated[index].structure[k] = e.target.value;
                              setEditableAi({ ...editableAi, templates: updated });
                            }}
                          />
                        </>
                      ) : (
                        <span className="text-xs">{k}: {v}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
          </div> */}
          {/* ================= EVIDENCE ================= */}
          <div>
            <SectionHeader
              title="Evidence"
              count={editableAi?.requiredEvidence?.types?.length}
              sectionKey="evidence"
            />

            {openSections.evidence && (
              <div className="mt-3 space-y-2">

                <div className="flex flex-wrap gap-2">
                  {editableAi?.requiredEvidence?.types?.map((type: string, i: number) => (
                    <div key={i} className="flex items-center gap-1">

                      {isEditMode ? (
                        <>
                          <input
                            value={type}
                            className="border px-2 py-1 text-xs rounded bg-yellow-50"
                            onChange={(e) => {
                              const updated = [...editableAi.requiredEvidence.types];
                              updated[i] = e.target.value;

                              setEditableAi((prev: any) => ({
                                ...prev,
                                requiredEvidence: {
                                  ...prev.requiredEvidence,
                                  types: updated,
                                },
                              }));
                            }}
                          />

                          {/* ❌ DELETE */}
                          <button
                            className="text-red-500 text-xs"
                            onClick={() => {
                              const updated = editableAi.requiredEvidence.types.filter(
                                (_: any, idx: number) => idx !== i
                              );

                              setEditableAi((prev: any) => ({
                                ...prev,
                                requiredEvidence: {
                                  ...prev.requiredEvidence,
                                  types: updated,
                                },
                              }));
                            }}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-blue-100 rounded">
                          {type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* ➕ ADD */}
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditableAi((prev: any) => ({
                        ...prev,
                        requiredEvidence: {
                          ...prev.requiredEvidence,
                          types: [...prev.requiredEvidence.types, ""],
                        },
                      }))
                    }
                  >
                    + Add Evidence
                  </Button>
                )}
              </div>
            )}
          </div>


          {/* ================= TEMPLATES ================= */}
          <div>
            <SectionHeader
              title="Templates"
              count={editableAi?.templates?.length}
              sectionKey="templates"
            />

            {openSections.templates && (
              <div className="space-y-4 mt-3">

                {editableAi?.templates?.map((template: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">

                    {/* TEMPLATE NAME */}
                    {isEditMode ? (
                      <input
                        value={template.name}
                        className="border p-2 w-full rounded mb-2 bg-yellow-50"
                        onChange={(e) => {
                          const updated = [...editableAi.templates];
                          updated[index].name = e.target.value;
                          setEditableAi({ ...editableAi, templates: updated });
                        }}
                      />
                    ) : (
                      <p className="font-medium">{template.name}</p>
                    )}

                    {/* META */}
                    <p className="text-xs text-muted-foreground mb-2">
                      Type: {template.type} • Format: {template.format}
                    </p>

                    {/* ================= STRUCTURE ================= */}
                    {/* <div className="space-y-2">

                      {Object.entries(template.structure || {}).map(([key, value]: any) => (
                        <div key={key} className="flex items-center gap-2">

                          {isEditMode ? (
                            <input
                              className="border px-2 py-1 text-xs w-1/3 bg-yellow-50 rounded"
                              value={key}
                              onChange={(e) => {
                                const newKey = e.target.value;

                                const updated = [...editableAi.templates];
                                const oldStructure = updated[index].structure;

                                const newStructure: any = {};

                                Object.entries(oldStructure).forEach(([k, v]: any) => {
                                  newStructure[k === key ? newKey : k] = v;
                                });

                                updated[index].structure = newStructure;

                                setEditableAi({ ...editableAi, templates: updated });
                              }}
                            />
                          ) : (
                            <span className="text-xs w-1/3 text-muted-foreground">
                              {key}
                            </span>
                          )}

                          {isEditMode ? (
                            <input
                              className="border px-2 py-1 text-xs w-1/2 bg-yellow-50 rounded"
                              value={value}
                              onChange={(e) => {
                                const updated = [...editableAi.templates];
                                updated[index].structure[key] = e.target.value;

                                setEditableAi({ ...editableAi, templates: updated });
                              }}
                            />
                          ) : (
                            <span className="text-xs w-1/2">{value}</span>
                          )}

                          {isEditMode && (
                            <button
                              className="text-red-500 text-xs"
                              onClick={() => {
                                const updated = [...editableAi.templates];
                                const newStructure = { ...updated[index].structure };

                                delete newStructure[key];

                                updated[index].structure = newStructure;

                                setEditableAi({ ...editableAi, templates: updated });
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}

                      {isEditMode && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const updated = [...editableAi.templates];

                            updated[index].structure = {
                              ...updated[index].structure,
                              [`new_field_${Date.now()}`]: "",
                            };

                            setEditableAi({ ...editableAi, templates: updated });
                          }}
                        >
                          + Add Field
                        </Button>
                      )}
                    </div> */}
                    {/* ================= STRUCTURE EDIT ================= */}
                    <div className="space-y-2 mt-2">

                      {Object.entries(template.structure || {}).map(([key, value]: any, idx) => (
                        <div key={idx} className="flex gap-2 items-center">

                          {/* 🔑 KEY */}
                          {isEditMode ? (
                            <input
                              className="border px-2 py-1 text-xs w-1/3 bg-yellow-50 rounded"
                              defaultValue={key}
                              onBlur={(e) => {
                                const newKey = e.target.value.trim();

                                if (!newKey || newKey === key) return;

                                const updated = [...editableAi.templates];
                                const structure = updated[index].structure;

                                // prevent duplicate
                                if (structure[newKey]) {
                                  alert("Field already exists");
                                  return;
                                }

                                const newStructure: any = {};
                                Object.entries(structure).forEach(([k, v]: any) => {
                                  newStructure[k === key ? newKey : k] = v;
                                });

                                updated[index].structure = newStructure;
                                setEditableAi({ ...editableAi, templates: updated });
                              }}
                            />
                          ) : (
                            <span className="w-1/3 text-xs text-muted-foreground">{key}</span>
                          )}

                          {/* 🔹 VALUE */}
                          {isEditMode ? (
                            <input
                              className="border px-2 py-1 text-xs w-1/2 bg-yellow-50 rounded"
                              value={value}
                              onChange={(e) => {
                                const updated = [...editableAi.templates];
                                updated[index].structure[key] = e.target.value;

                                setEditableAi({ ...editableAi, templates: updated });
                              }}
                            />
                          ) : (
                            <span className="text-xs w-1/2">{value}</span>
                          )}

                          {/* ❌ DELETE FIELD */}
                          {isEditMode && (
                            <button
                              className="text-red-500 text-xs"
                              onClick={() => {
                                const updated = [...editableAi.templates];
                                const newStructure = { ...updated[index].structure };

                                delete newStructure[key];

                                updated[index].structure = newStructure;
                                setEditableAi({ ...editableAi, templates: updated });
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}

                      {/* ➕ ADD FIELD */}
                      {isEditMode && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const updated = [...editableAi.templates];

                            updated[index].structure = {
                              ...updated[index].structure,
                              [`field_${Date.now()}`]: "",
                            };

                            setEditableAi({ ...editableAi, templates: updated });
                          }}
                        >
                          + Add Field
                        </Button>
                      )}
                    </div>

                    {/* ❌ DELETE TEMPLATE */}
                    {isEditMode && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="mt-3"
                        onClick={() => {
                          const updated = editableAi.templates.filter(
                            (_: any, i: number) => i !== index
                          );
                          setEditableAi({ ...editableAi, templates: updated });
                        }}
                      >
                        Delete Template
                      </Button>
                    )}
                  </div>
                ))}

                {/* ➕ ADD TEMPLATE */}
                {isEditMode && (
                  <Button
                    onClick={() =>
                      setEditableAi((prev: any) => ({
                        ...prev,
                        templates: [
                          ...prev.templates,
                          {
                            name: "New Template",
                            type: "policy",
                            format: "document",
                            structure: {},
                          },
                        ],
                      }))
                    }
                  >
                    + Add Template
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}