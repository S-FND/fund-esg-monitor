import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    Plus,
    Send,
    FileText,
    Download,
    Eye,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    Info,
    UserPlus,
    ClipboardCheck,
    Loader2,
    Trash2,
    Pencil,
    Save,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { http } from "@/utils/httpInterceptor";
import { EsgddAPIs } from "@/network/esgdd";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// -------------------- Reusable UI components (unchanged) --------------------
const SectionCard: React.FC<{
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'primary' | 'muted';
    rightSlot?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, subtitle, icon, variant = 'default', rightSlot, children }) => {
    const headerClass =
        variant === 'primary'
            ? 'bg-[hsl(224_76%_28%)] text-white'
            : variant === 'muted'
                ? 'bg-slate-700 text-white'
                : 'bg-card text-foreground border-b';
    return (
        <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <header className={cn('flex items-center justify-between px-6 py-4', headerClass)}>
                <div className="flex items-center gap-3">
                    {icon && <span className="opacity-90">{icon}</span>}
                    <div>
                        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                        {subtitle && <p className={cn('text-xs', variant === 'default' ? 'text-muted-foreground' : 'text-white/70')}>{subtitle}</p>}
                    </div>
                </div>
                {rightSlot}
            </header>
            <div className="p-6">{children}</div>
        </section>
    );
};

const MetaPill: React.FC<{ label: string; tone?: 'default' | 'red' | 'amber' | 'green' | 'blue' | 'slate' }> = ({ label, tone = 'default' }) => {
    const map: Record<string, string> = {
        default: 'bg-muted text-foreground border-border',
        red: 'bg-red-50 text-red-700 border-red-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        slate: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium', map[tone])}>{label}</span>;
};

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm text-foreground">{value ?? '—'}</div>
    </div>
);

// -------------------- Main Component --------------------
const ESGCapDetailsPageInvestor: React.FC = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const itemName = searchParams.get('itemName');
    const companyEntityId = searchParams.get('companyEntityId');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [capItem, setCapItem] = useState<any>(null);
    const [fullPlan, setFullPlan] = useState<any[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [editedItem, setEditedItem] = useState<any>({});
    const [showUpdateNotes, setShowUpdateNotes] = useState(false);
    const [updateText, setUpdateText] = useState('');

    // Attachment states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [attachmentsOpen, setAttachmentsOpen] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ file: any; idx: number } | null>(null);
    const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
    const [financialYear, setFinancialYear] = useState("");

    // Financial year calculation
    useEffect(() => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const aprilFirst = new Date(currentYear, 3, 1);
        const fy = currentDate < aprilFirst
            ? `${currentYear - 1}-${currentYear.toString().slice(-2)}`
            : `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
        setFinancialYear(fy);
    }, []);

    const [entityId, setEntityId] = useState<string | null>(
        companyEntityId || null
    );

    useEffect(() => {
        try {
            const userData = localStorage.getItem('fandoro-user');

            if (userData && userData !== 'undefined') {
                const parsedUser = JSON.parse(userData);
                setEntityId(parsedUser?.entityId || null);
            }
        } catch (error) {
            console.error('Failed to parse user data', error);
        }
    }, []);

    // Helper: Normalize string for comparison
    const normalizeString = (str: string) => {
        return str?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
    };

    const loadData = async () => {
        if (!entityId ) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [data, error] = await EsgddAPIs.getEsgCapPlan({
                entityId: entityId
            });
            setLoading(false);
            if (data?.status && Array.isArray(data.plan)) {
                setFullPlan(data.plan);
                let matchedItem = null;
                if (itemName) {
                    const decodedItemName = decodeURIComponent(itemName);
                    const normalizedSearch = normalizeString(decodedItemName);
                    matchedItem = data.plan.find((i: any) =>
                        normalizeString(i.item) === normalizedSearch
                    );
                }
                if (!matchedItem && id) {
                    matchedItem = data.plan.find((i: any) => i.reportId === id);
                }
                if (!matchedItem && data.plan.length > 0) {
                    matchedItem = data.plan[0];
                    toast.warning(`Item "${itemName}" not found. Showing first CAP item.`);
                }
                setCapItem(matchedItem || null);
                if (matchedItem) {
                    setEditedItem({ ...matchedItem });
                }
            } else {
                toast.error(data?.message || "Failed to load ESG CAP data");
            }
        } catch (error) {
            toast.error("Error loading CAP data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (entityId) {
            loadData();
        }
    }, [id, itemName]);

    useEffect(() => {
        if (capItem) {
            setEditedItem({ ...capItem });
        }
    }, [capItem]);

    const handleSave = async () => {
        if (!capItem || !editedItem) return;
        setSaving(true);
        try {
            // Replace with your actual update API call
            // Example: await EsgddAPIs.updateCapItem({ entityId, itemId: capItem.id, updates: editedItem });
            // For now, simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));
            setCapItem({ ...editedItem });
            setEditMode(false);
            toast.success("CAP item updated successfully");
        } catch (error) {
            toast.error("Failed to save changes");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedItem({ ...capItem });
        setEditMode(false);
    };

    const handleViewDocument = async (file: any) => {
        try {
            const getSignedUrl: any = await http.get(`esgdd/escap/uploaded/evidence-files/signed-urls?key=${file.filename}`);
            if (getSignedUrl.status === 200) window.open(getSignedUrl.data.signedUrl, '_blank');
        } catch (error) {
            toast.error("Failed to view document");
        }
    };

    const handleDeleteDocument = (file: any, idx: number) => setConfirmDelete({ file, idx });
    const handleDeleteConfirmed = async () => {
        if (!confirmDelete) return;
        const { file } = confirmDelete;
        try {
            setDeleting(file.filename);
            const queryParams = new URLSearchParams({
                fileName: file.filename,
                actionItemId: file.aiSummary?.actionItemId || '',
                validationDocId: file.aiSummary?._id || '',
            }).toString();
            await http.delete(`esgdd/escap/delete-file-esgcap?${queryParams}`);
            toast.success('Document deleted');
            setCapItem((prev: any) => ({
                ...prev,
                fileUploadedData: prev?.fileUploadedData?.filter((f: any) => f.filename !== file.filename) || [],
            }));
            setConfirmDelete(null);
        } catch (error) {
            toast.error('Failed to delete document');
        } finally {
            setDeleting(null);
        }
    };

    const hasDocumentForIndicator = (indicatorLabel: string) =>
        capItem?.fileUploadedData?.some((file: any) => file.documentType === indicatorLabel);

    const openAttachments = () => setAttachmentsOpen(true);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    if (!capItem) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">No CAP item found.</p>
                {fullPlan.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-medium">Available items:</p>
                        <ul className="list-disc list-inside text-sm">
                            {fullPlan.map((item, idx) => (
                                <li key={idx}>{item.item}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <Button className="mt-4" variant="outline" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[hsl(220_25%_97%)] dark:bg-background">
            <div className="mx-auto max-w-[1440px] px-6 py-8 space-y-6">
                {/* Header with Edit Mode Toggle */}
                <div>
                    <Link to="/esg-dd/cap" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to CAP List
                    </Link>
                    <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                            {editMode ? (
                                <Input
                                    value={editedItem.item || ''}
                                    onChange={(e) => setEditedItem({ ...editedItem, item: e.target.value })}
                                    className="text-3xl font-bold h-auto py-2"
                                />
                            ) : (
                                <h5 className="text-3xl font-bold tracking-tight">{capItem.item}</h5>
                            )}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <MetaPill label={editMode ? (editedItem.dealCondition || "Not specified") : (capItem.dealCondition || "Not specified")} tone="slate" />
                                <MetaPill label={`${editMode ? (editedItem.priority || 'Medium') : (capItem.priority || 'Medium')} Priority`} />
                                <MetaPill label={`Due ${editMode && editedItem.targetDate ? new Date(editedItem.targetDate).toLocaleDateString() : (capItem.targetDate ? new Date(capItem.targetDate).toLocaleDateString() : 'Not set')}`} tone="blue" />
                                <MetaPill label={editMode ? (editedItem.category || 'General') : (capItem.category || 'General')} />
                                <MetaPill
                                    label={editMode ? (editedItem.status?.replaceAll('_', ' ') || 'Pending') : (capItem.status?.replaceAll('_', ' ') || 'Pending')}
                                    tone={capItem.status === 'completed' ? 'green' : capItem.status === 'pending' ? 'amber' : 'blue'}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border">
                                <span className="text-sm font-medium">Edit Mode</span>
                                <Switch checked={editMode} onCheckedChange={setEditMode} />
                            </div>
                            {editMode && (
                                <>
                                    <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                        {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                        Save
                                    </Button>
                                    <Button variant="outline" onClick={handleCancelEdit}>
                                        <X className="h-4 w-4" /> Cancel
                                    </Button>
                                </>
                            )}
                            <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
                        </div>
                    </div>
                </div>

                {/* Investor Actions - fully editable */}
                <SectionCard title="Investor Actions" subtitle="Operational updates – investor can edit and submit changes" icon={<ClipboardCheck className="h-4 w-4" />} variant="primary" rightSlot={<span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90">Editable</span>}>
                    <div className="space-y-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* <Button size="lg" onClick={openAttachments} className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"><Upload className="h-4 w-4" /> Upload Document</Button> */}
                            <Button size="lg" variant="outline" onClick={() => setShowUpdateNotes(v => !v)} className="h-11 rounded-xl"><Plus className="h-4 w-4" /> {showUpdateNotes ? 'Hide Update Notes' : 'Add Update'}</Button>
                        </div>
                        <div className={cn('grid overflow-hidden transition-all', showUpdateNotes ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                            <div className="min-h-0">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Update Notes</label>
                                <Textarea className="mt-2 min-h-[140px] rounded-lg bg-muted/40" placeholder="Status updates, blocker notes..." value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
                            </div>
                        </div>
                        {/* Editable Fields */}
                        <div className="rounded-xl border bg-muted/30 p-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <div className="text-sm font-semibold">Item / Title</div>
                                    {editMode ? (
                                        <Input value={editedItem.item || ''} onChange={(e) => setEditedItem({ ...editedItem, item: e.target.value })} className="mt-1" />
                                    ) : (
                                        <div className="mt-1 text-sm">{capItem.item}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">Category</div>
                                    {editMode ? (
                                        <Select value={editedItem.category} onValueChange={(val) => setEditedItem({ ...editedItem, category: val })}>
                                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="environmental">Environmental</SelectItem>
                                                <SelectItem value="social">Social</SelectItem>
                                                <SelectItem value="governance">Governance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="mt-1 text-sm">{capItem.category}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">Priority</div>
                                    {editMode ? (
                                        <Select value={editedItem.priority} onValueChange={(val) => setEditedItem({ ...editedItem, priority: val })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="Low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="mt-1 text-sm">{capItem.priority}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">Status</div>
                                    {editMode ? (
                                        <Select value={editedItem.status} onValueChange={(val) => setEditedItem({ ...editedItem, status: val })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                                <SelectItem value="due in <1 month">
                                                    Due in &lt;1 Month
                                                </SelectItem>
                                                <SelectItem value="overdue">Overdue</SelectItem>
                                                <SelectItem value="submitted">Submitted</SelectItem>
                                                <SelectItem value="request to re-submit">
                                                    Request to Re-submit
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="mt-1 text-sm">{capItem.status}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">Target Date</div>
                                    {editMode ? (
                                        <Input type="date" value={editedItem.targetDate ? editedItem.targetDate.split('T')[0] : ''} onChange={(e) => setEditedItem({ ...editedItem, targetDate: e.target.value })} />
                                    ) : (
                                        <div className="mt-1 text-sm">{capItem.targetDate ? new Date(capItem.targetDate).toLocaleDateString() : 'Not set'}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">Actual Date</div>
                                    {editMode ? (
                                        <Input type="date" value={editedItem.actualDate?.split('T')[0] || ''} onChange={(e) => setEditedItem({ ...editedItem, actualDate: e.target.value })} />
                                    ) : (
                                        <div className="mt-1 text-sm">{capItem.actualDate ? new Date(capItem.actualDate).toLocaleDateString() : 'Not set'}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">Assigned To</div>
                                    {editMode ? (
                                        <Input value={editedItem.assignedTo || ''} onChange={(e) => setEditedItem({ ...editedItem, assignedTo: e.target.value })} />
                                    ) : (
                                        <div className="mt-1 text-sm">{capItem.assignedTo || '—'}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">CP/CS/ESG Roadmap</div>

                                    {editMode ? (
                                        <Select
                                            value={editedItem.dealCondition || ""}
                                            onValueChange={(value) =>
                                                setEditedItem({
                                                    ...editedItem,
                                                    dealCondition: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Deal Condition" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="CP">CP</SelectItem>
                                                <SelectItem value="CS">CS</SelectItem>
                                                <SelectItem value="ESG_Roadmap">
                                                    ESG Roadmap
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="mt-1 text-sm">
                                            {capItem.dealCondition === "ESG_Roadmap"
                                                ? "ESG Roadmap"
                                                : capItem.dealCondition || "—"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Measures & Corrective Actions */}
                        <div className="rounded-xl border bg-muted/30 p-5">
                            <div className="text-sm font-semibold mb-2">Measures & Corrective Actions</div>
                            {editMode ? (
                                <Textarea value={editedItem.measures || ''} onChange={(e) => setEditedItem({ ...editedItem, measures: e.target.value })} rows={4} />
                            ) : (
                                <div className="text-sm whitespace-pre-wrap">{capItem.measures}</div>
                            )}
                        </div>

                        {/* Issue & Related Finding */}
                        <div className="rounded-xl border bg-muted/30 p-5">
                            <div className="text-sm font-semibold mb-2">Issue / Related Finding</div>
                            {editMode ? (
                                <Textarea value={editedItem.issue || ''} onChange={(e) => setEditedItem({ ...editedItem, issue: e.target.value })} rows={3} />
                            ) : (
                                <div className="text-sm whitespace-pre-wrap">{capItem.issue}</div>
                            )}
                        </div>

                        {/* Deliverable / Completion Indicators */}
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Completion Indicators</div>
                            <ul className="mt-4 space-y-3">
                                {(() => {
                                    const source = editMode ? editedItem.deliverable : capItem?.deliverable;
                                    if (!source) return <li className="text-sm text-muted-foreground">No indicators added yet.</li>;
                                    const items = source.includes('##') ? source.split('##') : [source];
                                    return items.filter(i => i.trim()).map((label, idx) => (
                                        <li key={idx} className="flex items-center justify-between rounded-lg border bg-card p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{label.trim()}</span>
                                                {hasDocumentForIndicator(label.trim()) && (
                                                    <Badge variant="outline" className="border-emerald-500 bg-emerald-50 text-emerald-700">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Uploaded
                                                    </Badge>
                                                )}
                                            </div>
                                            {hasDocumentForIndicator(label.trim()) && (
                                                <Button size="sm" variant="ghost" onClick={() => {
                                                    const file = capItem.fileUploadedData?.find(f => f.documentType === label.trim());
                                                    if (file) handleViewDocument(file);
                                                }}>
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </li>
                                    ));
                                })()}
                            </ul>
                        </div>
                    </div>
                </SectionCard>

                {/* Investor Actions - now fully editable */}
                <SectionCard title="Investor Actions" subtitle="Internal review and reviewer thread" icon={<MessageSquare className="h-4 w-4" />} variant="muted">
                    <div className="grid gap-8 lg:grid-cols-2">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Investor Status</div>
                            <div className="mt-2">
                                {editMode ? (
                                    <Select value={editedItem.investorStatus || 'Under Review'} onValueChange={(val) => setEditedItem({ ...editedItem, investorStatus: val })}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="under review">
                                                Under Review
                                            </SelectItem>
                                            <SelectItem value="reviewed with comments">
                                                Reviewed with Comments
                                            </SelectItem>
                                            <SelectItem value="closed">
                                                Closed
                                            </SelectItem>
                                            <SelectItem value="deferred">
                                                Deferred
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="mt-1 flex items-center gap-3 rounded-lg border bg-card p-4">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500 text-white"><CheckCircle2 className="h-4 w-4" /></span>
                                        <div>
                                            <div className="text-sm font-semibold">{capItem.investorStatus || 'Under Review'}</div>
                                            <div className="text-xs text-muted-foreground">{capItem.lastReviewDate ? new Date(capItem.lastReviewDate).toLocaleDateString() : 'Pending'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Review Comment</div>
                            <div className="mt-2">
                                {editMode ? (
                                    <Textarea
                                        value={editedItem.reviewRemarks || ''}
                                        onChange={(e) => setEditedItem({ ...editedItem, reviewRemarks: e.target.value })}
                                        rows={4}
                                        placeholder="Add review comments..."
                                    />
                                ) : (
                                    <div className="rounded-lg border bg-card p-3 text-sm">
                                        {capItem.reviewRemarks || 'No comments yet.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* Completion Tracking - Guidance & Resources now editable */}
                <SectionCard title="Completion Tracking" subtitle="Milestones and required artefacts" icon={<CheckCircle2 className="h-4 w-4" />}>
                    <div className="grid gap-8 lg:grid-cols-2">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Completion Indicators</div>
                            <ul className="mt-4 space-y-3">
                                {(capItem?.deliverable ? (capItem.deliverable.includes("##") ? capItem.deliverable.split("##") : [capItem.deliverable]) : []).filter(Boolean).map((label: string) => {
                                    const hasDoc = hasDocumentForIndicator(label);
                                    return (
                                        <li key={label} className="flex items-center justify-between rounded-lg border bg-card p-3">
                                            <div className="flex items-center gap-2"><span className="text-sm">{label}</span>{hasDoc && <Badge variant="outline" className="border-emerald-500 bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Uploaded</Badge>}</div>
                                            {hasDoc && <Button size="sm" variant="ghost" onClick={() => { const file = capItem.fileUploadedData?.find((f: any) => f.documentType === label); if (file) handleViewDocument(file); }}><Eye className="h-3 w-3" /></Button>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Guidance & Resources</div>
                            <div className="mt-2">
                                {editMode ? (
                                    <Textarea
                                        value={editedItem.resource || ''}
                                        onChange={(e) => setEditedItem({ ...editedItem, resource: e.target.value })}
                                        rows={4}
                                        placeholder="Add guidance or resource links..."
                                    />
                                ) : (
                                    <div className="rounded-lg border bg-card p-3 text-sm">
                                        {capItem?.resource || '—'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <Field label="Submission Date" value={capItem?.createdAt ? new Date(capItem.createdAt).toLocaleDateString() : '—'} />
                        <Field label="Target Date" value={capItem?.targetDate ? new Date(capItem.targetDate).toLocaleDateString() : 'Pending'} />
                        <Field label="Actual Completion" value={capItem?.actualDate ? new Date(capItem.actualDate).toLocaleDateString() : 'Pending'} />
                        <Field label="Last Review Date" value={capItem?.lastReviewDate ? new Date(capItem.lastReviewDate).toLocaleDateString() : 'Pending'} />
                        <Field label="Closure Verified By" value={capItem?.closureVerifiedBy || 'Upcoming'} />
                    </div>
                </SectionCard>

                {/* Attachments Modal (unchanged) */}
                <Dialog open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Attachments & Evidence</DialogTitle></DialogHeader>
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold mb-2">Completion Indicators</h3>
                            <div className="space-y-2">
                                {(capItem?.deliverable ? (capItem.deliverable.includes("##") ? capItem.deliverable.split("##") : [capItem.deliverable]) : []).filter(Boolean).map((label: string) => (
                                    <div key={label} className="flex items-center justify-between rounded-lg border p-3">
                                        <span className="text-sm">{label}</span>
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedIndicator(label); setUploadModalOpen(true); }}><Upload className="h-3 w-3 mr-1" /> Upload</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                                    <tr><th className="px-4 py-3 text-left">File</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Size</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-center">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {capItem.fileUploadedData?.map((file: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /><span className="truncate max-w-[180px]">{file.filename || 'Unnamed'}</span></div></td>
                                            <td className="px-4 py-3 text-muted-foreground">{file.aiSummary?.createdAt ? new Date(file.aiSummary.createdAt).toLocaleDateString() : '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{file.size ? (file.size / 1024).toFixed(1) + ' KB' : '—'}</td>
                                            <td className="px-4 py-3">{file.status === 'Verified' ? <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" /> Verified</Badge> : <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700"><AlertCircle className="mr-1 h-3 w-3" /> Pending</Badge>}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewDocument(file)}><Eye className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => { const a = document.createElement('a'); a.href = file.s3Link; a.download = file.filename; a.click(); }}><Download className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" className="text-red-600" disabled={deleting === file.filename} onClick={() => handleDeleteDocument(file, idx)}>
                                                    {deleting === file.filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete confirmation (unchanged) */}
                {confirmDelete && (
                    <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                        <DialogContent className="max-w-md">
                            <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
                            <p className="text-sm text-gray-600">Delete <strong>{confirmDelete.file.filename}</strong>?</p>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteConfirmed}>Delete</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
};

export default ESGCapDetailsPageInvestor;