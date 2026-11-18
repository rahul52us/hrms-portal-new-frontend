import axios from "axios";

export type Page<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export const emptyPage = { page: 1, limit: 20, total: 0, totalPages: 1 };
export type Option = { value: string; label: string };
export const categoryLabels: Record<string, string> = Object.assign(Object.create(null), { laptop: "Laptop", desktop: "Desktop", monitor: "Monitor", phone: "Phone", tablet: "Tablet", accessory: "Accessory", other: "Other" });
export const categoryLabel = (code: string, snapshot?: string) => snapshot || categoryLabels[code] || code;
export const conditionLabels: Record<string, string> = { new: "New", good: "Good", fair: "Fair", damaged: "Damaged" };
export const statusLabel = (value: string) => value.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
export const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString() : "Not recorded";
export type AssetContent = { tag: string; name: string; category: string; brand: string; model: string; serialNumber: string; condition: string; officeLocation: string | null; internalNotes: string };
export type AssetRecord = AssetContent & { _id: string; status: string; revision: number; locationName: string; currentAssignment: string | null; holder: { employee: string; name: string; code: string } | null;
  openDisposal?: string | null; disposedRecord?: string | null; lastDisposal?: string | null; canRequestDisposal?: boolean;
  categoryName?: string;
  openIncident?: string | null; canReportIncident?: boolean;
  openService?: string | null; lastService?: string | null; maintenanceReleaseBlocked?: boolean; canOpenService?: boolean;
  openWriteOff?: string | null; writtenOffRecord?: string | null; lastWriteOff?: string | null;
  lastInspection?: { actorName: string; inspectedAt: string; result: string; condition: string; reason: string; serviceOrder: string | null } | null;
  canEdit: boolean; canIssue: boolean; canMaintain: boolean; canMakeAvailable: boolean; canRetire: boolean; canRestore: boolean };
export type Assignment = { _id: string; asset: string; assetSnapshot: Pick<AssetContent, "tag" | "name" | "category" | "brand" | "model" | "serialNumber"> & { categoryName?: string }; employee: string; employeeName: string; employeeCode: string;
  openIncident?: string | null; canReportIncident?: boolean;
  writtenOffAt?: string | null; writtenOffByName?: string; writtenOffReason?: string; writtenOffRecoveredAt?: string | null;
  issuerName: string; issuedAt: string; conditionOut: string; handoverNotes: string; expectedReturnDate: string; status: string; active: boolean; revision: number;
  acknowledgedAt: string | null; acknowledgementNote: string; returnRequestedAt: string | null; returnRequestReason: string; returnedAt: string | null; receiverName?: string; conditionIn?: string; returnNotes: string;
  voidedAt?: string | null; voiderName?: string; voidReason?: string; canAcknowledge: boolean; canRequestReturn: boolean; canReturn: boolean; canVoid: boolean; assetRevision?: number; officeLocation?: string | null; locationName?: string };
export type AssetAudit = { _id: string; action: string; actorName: string; reason: string; createdAt: string };
export const incidentKinds: Record<string, string> = { loss: "Lost equipment", theft: "Theft", damage: "Physical damage", malfunction: "Not working" };
export type Incident = { _id: string; asset: string; assignment: string | null; reference: string; assetSnapshot: { name: string; tag: string; serialNumber: string }; employee: string | null; employeeName: string; employeeCode: string; reporterName: string; kind: string; occurredAt: string; description: string; status: string; active: boolean; revision: number; createdAt: string; reviewerName?: string; reviewedAt?: string; closerName?: string; closedAt?: string; resolutionReason: string; conditionAfter?: string; canReview: boolean; canResolve: boolean; canDismiss: boolean; assetRevision?: number; assetStatus?: string; openService?: string | null } & IncidentLossFields;
export const serviceKinds: Record<string, string> = { repair: "Repair", preventive_service: "Preventive service" };
export const serviceStates: Record<string, string> = { open: "Open", in_progress: "In progress", awaiting_inspection: "Awaiting inspection", completed: "Completed", unrepairable: "Unrepairable", cancelled: "Cancelled", written_off: "Written off" };
export const serviceCurrencies = ["INR", "USD", "EUR", "GBP"];
export type ServiceOrder = { _id: string; asset: string; reference: string; assetSnapshot: { name: string; tag: string; serialNumber: string }; incident: string | null; incidentReference: string; kind: string; issueDescription: string; providerType: string; providerName: string; providerReference: string; expectedCompletionDate: string; status: string; active: boolean; revision: number; cycle: number; externalDispatched: boolean; dispatchedAt?: string; dispatcherName?: string; receivedAt?: string; receiverName?: string; startedAt?: string; starterName?: string; workCompletedAt?: string; workCompletedName?: string; workPerformed: string; actualCostMinor: number | null; currency: string; inspectedAt?: string; inspectorName?: string; inspectionResult?: string; inspectionCondition?: string; inspectionReason?: string; closedAt?: string; closerName?: string; closeReason?: string; creatorName: string; createdAt: string; assetRevision?: number; openIncident?: string | null; assetStatus?: string; openWriteOff?: string | null; writeOffRecord?: string | null; recoveredAfterWriteOffAt?: string | null; canStart: boolean; canCompleteWork: boolean; canReceiveUnrepaired: boolean; canInspect: boolean; canCancel: boolean; canAddNote: boolean };
export const assetMoneyLabel = (amount: number | null, currency: string) => amount === null ? "Not recorded" : new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100);
export type AssetPurchaseProfile = { revision: number; vendor: string; invoiceReference: string; purchaseDate: string; costMinor: number | null; currency: string; warrantyStart: string; warrantyEnd: string; warrantyNotes: string; remindersEnabled: boolean; reminderDays: number; updaterName?: string; updatedAt?: string; warranty: { status: string; daysRemaining: number | null } };
export type AssetDisposal = { _id: string; asset: string; reference: string; assetSnapshot: { tag: string; name: string; condition: string; serialNumber: string }; purchaseSnapshot: AssetPurchaseProfile | null; method: "sale" | "scrap" | "donation"; recipient: string; proceedsMinor: number; currency: string; reason: string; requesterName: string; status: string; revision: number; assetRevision?: number; createdAt: string; deciderName?: string; decidedAt?: string; decisionReason?: string; completerName?: string; completedAt?: string; evidenceReference?: string; completionReason?: string; completionChecks?: { physicalTransfer: boolean; dataCleared: boolean; approvedTerms: boolean }; withdrawnByName?: string; withdrawnAt?: string; withdrawalReason?: string; canApprove: boolean; canReject: boolean; canWithdraw: boolean; canComplete: boolean };
export const serviceCostLabel = assetMoneyLabel;
/** Keep clearable decimal strings in forms, and send exact minor units rather than floating-point money. */
export function parseAssetAmount(value: string) {
  if (value === "") return null;
  if (!/^\d{1,11}(\.\d{1,2})?$/.test(value)) throw new Error("Enter a non-negative amount with up to two decimal places, or leave it blank when unknown.");
  const [whole, fraction = ""] = value.split("."), minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (minor > 1000000000000) throw new Error("The amount is outside supported bounds.");
  return minor;
}
export type WriteOff = { _id: string; asset: string; incident: string; assignment: string | null; serviceOrder: string | null; reference: string; incidentReference: string; assetSnapshot: { name: string; tag: string; serialNumber: string }; employeeName: string; employeeCode: string; lastKnownCustody: string; providerName: string; kind: string; reason: string; evidenceReference: string; amountMinor: number | null; currency: string; recoveredAmountMinor: number; outstandingAmountMinor: number | null; excessRecoveryMinor: number | null; requesterName: string; status: string; revision: number; assetRevision?: number; createdAt: string; deciderName?: string; decidedAt?: string; decisionReason?: string; recovererName?: string; recoveredAt?: string; recoveredCondition?: string; recoveryReason?: string; approvalBlockedReason: string; canApprove: boolean; canReject: boolean; canWithdraw: boolean; canRecoverUnit: boolean; canRecordReceipt: boolean };
export type LossLedgerEntry = { _id: string; kind: string; amountMinor: number | null; currency: string; source?: string; receiptReference?: string; actorName: string; reason: string; createdAt: string; reversed: boolean; canReverse: boolean };
export type IncidentLossFields = { canRequestWriteOff?: boolean; openWriteOff?: string | null; writeOffRecord?: string | null; recoveredAfterWriteOffAt?: string | null };
export type ClearanceSummary = { evaluatedAt: string; evidenceRevision: number; outstanding: number; returnRequested: number; openIncidents: number; pendingWriteOffs: number; integrityFindings: number; returned: number; voided: number; writtenOff: number; ready: boolean };
export type AssetClearance = { _id: string; reference: string; employee: string; employeeName: string; employeeCode: string; openedAt: string; lastWorkingDate: string; status: "open" | "cleared" | "cancelled"; revision: number; cycle: number; initialOutstanding: number; creatorName: string; openingReason: string; clearedAt?: string; clearerName?: string; clearanceReason?: string; cancelledAt?: string; cancellerName?: string; cancellationReason?: string; isCurrent: boolean; issueBlocked: boolean; isCurrentlyClear: boolean; summary: ClearanceSummary; clearanceEvidence?: ClearanceSummary & { reviewedOpenIncidents: boolean }; canViewCompany: boolean; canClear: boolean; canReopen: boolean; canCancel: boolean; canReschedule: boolean; canAddNote: boolean };
export type ClearanceEmployee = { _id: string; name: string; code: string; archived: boolean; currentClearance: string | null };
export type ClearanceCustody = Assignment & { statusAtDecision: string | null };
export type ClearanceEvent = { _id: string; actorName: string; action: string; reason: string; createdAt: string; after: { status: string; cycle: number; lastWorkingDate: string; clearanceEvidence?: ClearanceSummary | null; summary?: ClearanceSummary } };
export type AssetImportBatch = { _id: string; fileName: string; status: "ready" | "invalid" | "applied" | "cancelled"; revision: number; totalRows: number; validRows: number; invalidRows: number; appliedRows: number; creatorName: string; createdAt: string; validUntil: string; appliedAt?: string; appliedByName?: string; applyReason?: string; cancelledAt?: string; cancellerName?: string; cancellationReason?: string; isExpired: boolean; canApply: boolean; canCancel: boolean };
export type AssetImportRow = { _id: string; rowNumber: number; source: Record<string, string>; content: (AssetContent & { categoryName?: string }) | null; locationCode: string; locationName: string; validationStatus: "valid" | "invalid"; errors: string[]; asset: string | null };
export type AssetCategory = { _id: string; code: string; name: string; state: "active" | "archived"; builtin: boolean; revision: number | null; canManage: boolean; inventoryUnits?: number; createdAt?: string; updatedAt?: string };
export const assetDocumentKinds: Record<string, string> = { photo: "Photo", invoice: "Invoice", warranty: "Warranty", receipt: "Receipt", manual: "Manual", other: "Other document" };
export type AssetDocumentFile = { name: string; type: string; size: number; version: number; downloadUrl: string; scan: { status: "clean" | "not_scanned"; provider: "clamav" | "disabled"; scannedAt: string | null } };
export type AssetDocument = { _id: string; asset: string; title: string; kind: string; state: "active" | "archived"; revision: number; currentVersion: number; creatorName: string; updatedByName: string; createdAt: string; updatedAt: string; archivedAt?: string; archiverName?: string; archiveReason?: string; file: AssetDocumentFile; canReplace: boolean; canUpdate: boolean; canArchive: boolean; canRestore: boolean };
export type AssetDocumentVersion = { _id: string; title: string; kind: string; version: number; uploaderName: string; createdAt: string; reason: string; file: AssetDocumentFile };
export type AssetDocumentList = Page<AssetDocument> & { canManage: boolean; canUpload: boolean; capacity: { active: number; documents: number; versions: number }; limits: { active: number; documents: number; versionsPerDocument: number; versionsPerAsset: number; bytes: number } };
export const assetFailure = (error: any) => error?.response?.data?.message || error?.response?.data?.error || error?.message || "The inventory request failed.";
/** Blob responses also contain JSON errors; decode those instead of downloading an error as a spreadsheet. */
export async function assetDownload(path: string, filename: string, params?: Record<string, unknown>) {
  try {
    const response = await axios.get(`/assets${path}`, { params, responseType: "blob" });
    if (!String(response.headers["content-type"] || "").match(/text\/csv|spreadsheetml/)) throw new Error("The server did not return an inventory file.");
    const url = URL.createObjectURL(response.data), link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error: any) {
    if (error?.response?.data instanceof Blob) { try { const content = JSON.parse(await error.response.data.text()); throw new Error(content.message || content.error || "Unable to download inventory file."); } catch (decoded: any) { if (decoded instanceof SyntaxError) throw new Error("Unable to download inventory file."); throw decoded; } }
    throw new Error(assetFailure(error));
  }
}
/** Only authenticated immutable inventory-version routes may become preview/download blobs. */
export async function assetDocumentBlob(file: AssetDocumentFile, signal?: AbortSignal): Promise<Blob> {
  if (!/^\/assets\/inventory\/[a-f0-9]{24}\/documents\/[a-f0-9]{24}\/versions\/[1-9]\d*\/download$/i.test(file.downloadUrl)) throw new Error("Invalid asset document link.");
  try {
    const response = await axios.get<Blob>(file.downloadUrl, { responseType: "blob", signal });
    if (!["application/pdf", "image/jpeg", "image/png"].includes(response.data.type) || response.data.type !== file.type || response.data.size !== file.size || response.data.size > 5 * 1024 * 1024) throw new Error("The document did not match its saved file details.");
    return response.data;
  } catch (err: any) {
    if (err?.response?.data instanceof Blob) { let payload: any; try { payload = JSON.parse(await err.response.data.text()); } catch { throw new Error("Unable to load asset document."); } throw new Error(payload.message || payload.error || "Unable to load asset document."); }
    throw err;
  }
}
export async function downloadAssetDocument(file: AssetDocumentFile) {
  const bytes = await assetDocumentBlob(file), url = URL.createObjectURL(bytes), link = document.createElement("a");
  link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export type AssetLabelSelection = Pick<AssetRecord, "_id" | "tag" | "name">;
export type AssetExportFilters = { search?: string; status: string; category: string; officeLocation?: string };
export type AssetExportJob = { _id: string; state: "queued" | "running" | "ready" | "failed" | "cancelled" | "expired"; filters: AssetExportFilters; filterLabels: { category: string; location: string }; reason: string; requesterName: string; revision: number; attempts: number; rows: number; bytes: number; createdAt: string; startedAt?: string; completedAt?: string; expiresAt?: string; error: string; canCancel: boolean; canRetry: boolean; canDownload: boolean };
export async function assetExportBlob(job: AssetExportJob, signal?: AbortSignal): Promise<Blob> {
  if (!/^[a-f0-9]{24}$/i.test(job._id)) throw new Error("Invalid export link.");
  try {
    const response = await axios.get<Blob>(`/assets/exports/${job._id}/download`, { responseType: "blob", signal });
    if (!response.data.type.startsWith("text/csv") || response.data.size !== job.bytes || response.data.size > 128 * 1024 * 1024) throw new Error("The export did not match its recorded file details.");
    return response.data;
  } catch (error: any) {
    if (error?.response?.data instanceof Blob) { let body: any; try { body = JSON.parse(await error.response.data.text()); } catch { throw new Error("Unable to download inventory export."); } throw new Error(body.message || body.error || "Unable to download inventory export."); }
    throw error;
  }
}
export async function assetLabelPdf(assetIds: string[], layout: "a4" | "single", startPosition: number, signal?: AbortSignal): Promise<Blob> {
  try {
    const response = await axios.post<Blob>("/assets/inventory/labels", { assetIds, layout, startPosition }, { responseType: "blob", signal });
    if (response.data.type !== "application/pdf" || !response.data.size) throw new Error("The server did not return an asset-label PDF.");
    return response.data;
  } catch (error: any) {
    if (error?.response?.data instanceof Blob) { let body: any; try { body = JSON.parse(await error.response.data.text()); } catch { throw new Error("Unable to download asset labels."); } throw new Error(body.message || body.error || "Unable to download asset labels."); }
    throw error;
  }
}
export async function assetGet<T>(path: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<T> { return (await axios.get(`/assets${path}`, { params, signal })).data; }
export async function assetSave<T>(path: string, body: unknown, method: "post" | "put" = "post"): Promise<{ data: T; replayed: boolean }> { return (await axios[method](`/assets${path}`, body)).data; }
