export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketTag = { id?: string; name: string; kind: 'DOMAIN'|'SERVICE_ASSET'|'ISSUE_TYPE'|'IMPACT_SCOPE'|'CONTEXT'|'OTHER' };

export type TicketFormState = {
  title: string;
  description: string;
  priority: TicketPriority;
  departmentId: string;
  categoryId: string;
  subcategoryId: string;
  locationId: string;
  disciplineId: string;
  customFields: Record<string, unknown>;
  tags: TicketTag[];
};

export type IntakeStatus =
  | 'CREATED'
  | 'UPLOADING'
  | 'READY'
  | 'TRANSCRIBING'
  | 'ANALYZING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CONSUMED'
  | 'EXPIRED';

export type IntakeSession = {
  id: string;
  status: IntakeStatus;
  description: string;
  transcript: string | null;
  combinedDescription: string | null;
  suggestions: Partial<Omit<TicketFormState, 'description'>> | null;
  missingFields: string[];
  confidenceByField: Record<string, number>;
  rejectedFields: string[];
  voice: { filename: string; contentType: string; byteSize: number; durationSeconds: number } | null;
  attemptCount: number;
  lastErrorCode: string | null;
  expiresAt: string;
  interpretation?: string | null;
  primaryIssue?: { summary:string; serviceAsset:string|null; issueType:string|null; confidence:number } | null;
  secondaryIssues?: Array<{ summary:string; confidence:number }>;
  clarificationQuestion?: string | null;
  clarificationConfidence?: number | null;
  messages?: Array<{id:string;sequence:number;role:'USER'|'ASSISTANT';contentType:'TEXT'|'VOICE'|'CLARIFICATION';text:string|null;transcript:string|null;voice:{filename:string;contentType:string;byteSize:number;durationSeconds:number;verified:boolean}|null;createdAt:string}>;
};

export const processingStatuses = new Set<IntakeStatus>(['UPLOADING', 'TRANSCRIBING', 'ANALYZING']);
export const maximumRecordingSeconds = 60;

export function scheduleRecordingAutoStop(stop: () => void) {
  return globalThis.setTimeout(stop, maximumRecordingSeconds * 1000);
}

export function microphoneErrorMessage(error: unknown) {
  return error instanceof DOMException && error.name === 'NotAllowedError'
    ? 'اجازه میکروفن داده نشد؛ می‌توانید شرح درخواست را دستی وارد کنید.'
    : 'امکان شروع ضبط صدا وجود ندارد؛ می‌توانید فرم را دستی تکمیل کنید.';
}

export function blocksManualSubmit(processing: boolean, hasRecording: boolean, recordingActive: boolean) {
  return recordingActive || (processing && hasRecording);
}

export function applyIntakeSuggestions(current: TicketFormState, session: IntakeSession) {
  const suggestions = session.suggestions ?? {};
  const changed = new Set<string>();
  const next: TicketFormState = { ...current, customFields: { ...current.customFields } };
  const scalarFields = ['title', 'priority', 'departmentId', 'categoryId', 'subcategoryId', 'locationId', 'disciplineId'] as const;
  for (const field of scalarFields) {
    const value = suggestions[field];
    if (typeof value === 'string' && value !== next[field]) {
      (next as Record<string, unknown>)[field] = value;
      changed.add(field);
    }
  }
  if (Array.isArray(suggestions.tags)) {
    const tags=suggestions.tags.filter((item):item is TicketTag=>Boolean(item&&typeof item==='object'&&typeof (item as TicketTag).name==='string'&&typeof (item as TicketTag).kind==='string')).slice(0,5);
    if (JSON.stringify(tags)!==JSON.stringify(next.tags)) { next.tags=tags; changed.add('tags'); }
  }
  if (suggestions.customFields && typeof suggestions.customFields === 'object') {
    for (const [key, value] of Object.entries(suggestions.customFields)) {
      if (next.customFields[key] !== value) {
        next.customFields[key] = value;
        changed.add(`customFields.${key}`);
      }
    }
  }
  if (session.transcript && session.combinedDescription && session.combinedDescription !== current.description) {
    next.description = session.combinedDescription;
    changed.add('description');
  }
  return { form: next, changedFields: changed };
}

/**
 * Removes only the transcript section that this intake session appended. This
 * lets a new voice capture replace an earlier one without discarding text the
 * requester typed before or after the previous transcript.
 */
export function removeIntakeTranscript(currentDescription: string, session: Pick<IntakeSession, 'description'|'transcript'|'combinedDescription'>) {
  if (!session.transcript || !session.combinedDescription || !session.combinedDescription.startsWith(session.description)) return currentDescription;
  const transcriptSection = session.combinedDescription.slice(session.description.length);
  if (!transcriptSection || !currentDescription.startsWith(session.description)) return currentDescription;
  const afterSource = currentDescription.slice(session.description.length);
  if (!afterSource.startsWith(transcriptSection)) return currentDescription;
  return `${session.description}${afterSource.slice(transcriptSection.length)}`;
}

const fieldLabels: Record<string, string> = {
  title: 'عنوان',
  priority: 'اولویت',
  categoryId: 'دسته‌بندی',
  subcategoryId: 'زیر‌دسته',
  departmentId: 'واحد مرتبط',
  locationId: 'مکان',
  disciplineId: 'حوزه یا رشته',
  tags: 'هشتگ‌ها',
};

export function intakeFieldLabel(field: string, customLabels: Record<string, string> = {}) {
  if (field.startsWith('customFields.')) return customLabels[field.slice('customFields.'.length)] ?? 'فیلد سفارشی';
  return fieldLabels[field] ?? field;
}

export function intakeFailureMessage(code: string | null) {
  if (code === 'ai_configuration_unavailable') return 'تکمیل هوشمند برای این سازمان تنظیم نشده است؛ فرم را به‌صورت دستی تکمیل کنید.';
  if (code === 'billing_not_active') return 'اعتبار سرویس هوش مصنوعی فعال نیست؛ فرم دستی همچنان قابل استفاده است.';
  if (code === 'voice_metadata_mismatch' || code === 'voice_content_invalid') return 'فایل صوتی معتبر نبود؛ آن را حذف و دوباره ضبط کنید.';
  if (code?.includes('transcription')) return 'تبدیل صدا به متن انجام نشد؛ دوباره تلاش کنید یا شرح را دستی بنویسید.';
  return 'تکمیل هوشمند در دسترس نیست؛ اطلاعات فرم حفظ شده و می‌توانید دستی ادامه دهید یا دوباره تلاش کنید.';
}

export async function pollIntake(
  load: () => Promise<IntakeSession>,
  options: { signal?: AbortSignal; intervalMs?: number; timeoutMs?: number; onUpdate?: (session: IntakeSession) => void } = {},
) {
  const startedAt = Date.now();
  const intervalMs = options.intervalMs ?? 900;
  const timeoutMs = options.timeoutMs ?? 90_000;
  while (true) {
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const session = await load();
    options.onUpdate?.(session);
    if (!processingStatuses.has(session.status)) return session;
    if (Date.now() - startedAt >= timeoutMs) throw new Error('intake_poll_timeout');
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => { globalThis.clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
      const timer = globalThis.setTimeout(() => { options.signal?.removeEventListener('abort', onAbort); resolve(); }, intervalMs);
      options.signal?.addEventListener('abort', onAbort, { once: true });
    });
  }
}
