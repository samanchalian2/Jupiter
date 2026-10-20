/** Language-neutral public contract. No product identity or business imports. */
export const SCHEMA_VERSION = '1.1' as const;
export const COMPATIBLE_SCHEMA_VERSIONS = ['1.0', '1.1'] as const;
export const LIMITS = Object.freeze({ batch: 50, eventBytes: 16_384, batchBytes: 524_288, message: 2_000, stack: 8_000, metadataKeys: 16, metadataString: 256 });
export const SEVERITIES = ['DEBUG','INFO','WARNING','ERROR','CRITICAL'] as const;
export const CATEGORIES = ['FRONTEND','BACKEND','WORKER','CONNECTIVITY','PERFORMANCE','BUSINESS_OPERATION','USER_FEEDBACK'] as const;
export const SOURCES = ['BROWSER','SERVER','WORKER','REFERENCE_CLIENT'] as const;
export const ENVIRONMENT_KINDS = ['DEVELOPMENT','TEST','STAGING','PRODUCTION'] as const;
export const OPERATIONAL_ROLES = ['ADMIN','OPERATOR','ANALYST','VIEWER'] as const;
/** Intentional server-policy filtering is terminal, but is not transport loss. */
export function isPolicyExclusion(ack:{status:unknown;reasonCode?:unknown}):boolean{return ack.status==='REJECTED'&&(ack.reasonCode==='SAMPLING_EXCLUDED'||ack.reasonCode==='SOURCE_DISABLED_BY_POLICY');}
export type Severity = typeof SEVERITIES[number];
export type Category = typeof CATEGORIES[number];
export type EventSource = typeof SOURCES[number];
export type MetadataValue = string | number | boolean | null;
export type SafeMetadata = Record<string, MetadataValue>;
export const METADATA_KEYS = ['service','sdkVersion','failureCode','attempt','retryExhausted','resourceType','jobType','connectivityProbe','sampleRate','sampleWeight','featureCode','component','metricName','metricValue','outcome','fingerprintVersion'] as const;

export interface IdentityScope {
  applicationId: string;
  environmentId: string;
  /** Opaque reference, meaningful only inside this Application. */
  actorReference: string | null;
  tenantReference: string | null;
}
export interface TelemetryEvent {
  eventId: string;
  schemaVersion: '1.0' | '1.1';
  applicationId: string;
  environmentId: string;
  occurredAt: string;
  releaseVersion?: string;
  source: EventSource;
  category: Category;
  severity: Severity;
  eventCode: string;
  normalizedMessage: string;
  exceptionType?: string;
  sanitizedStack?: string;
  traceId?: string;
  spanId?: string;
  requestId?: string;
  actorReference?: string | null;
  tenantReference?: string | null;
  sessionCorrelationId?: string;
  operationName?: string;
  routeTemplate?: string;
  httpStatus?: number;
  durationMs?: number;
  browserFamily?: string;
  browserVersion?: string;
  operatingSystem?: string;
  deviceClass?: string;
  connectivityState?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  safeMetadata?: SafeMetadata;
}
export interface PersistedEvent extends TelemetryEvent {
  receivedAt: string;
  fingerprint: string;
  fingerprintVersion: number;
  attribution: 'TRUSTED' | 'UNATTRIBUTED';
}
export type AckStatus = 'ACCEPTED' | 'DUPLICATE' | 'REJECTED' | 'RETRYABLE';
export interface EventAcknowledgement { eventId: string; status: AckStatus; reasonCode?: string; }
export interface BatchAcknowledgement { schemaVersion: '1.1'; acknowledgements: EventAcknowledgement[]; }
export const SDK_METRIC_FIELDS=['dropped','retryDelivered','retryDropped'] as const;
export interface SdkMetricReport {reportId:string;observedAt:string;counters:Record<typeof SDK_METRIC_FIELDS[number],number>;}
/** Fixed counters only: this is not a route for arbitrary client telemetry. */
export function validateSdkMetricReport(value:unknown,now=Date.now()):SdkMetricReport {
 if(!isRecord(value)||Object.keys(value).some(k=>!['reportId','observedAt','counters'].includes(k))||!isUuid(value.reportId)||typeof value.observedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(value.observedAt)||!isRecord(value.counters)||Object.keys(value.counters).length!==3||Object.keys(value.counters).some(k=>!(SDK_METRIC_FIELDS as readonly string[]).includes(k)))throw new ContractError('INVALID_SDK_METRICS');
 const time=Date.parse(value.observedAt);if(!Number.isFinite(time)||time<now-48*3_600_000||time>now+300_000)throw new ContractError('INVALID_METRIC_TIME');
 if(SDK_METRIC_FIELDS.some(k=>!Number.isInteger((value.counters as Record<string,unknown>)[k])||Number((value.counters as Record<string,unknown>)[k])<0||Number((value.counters as Record<string,unknown>)[k])>1_000_000)||SDK_METRIC_FIELDS.every(k=>(value.counters as Record<string,unknown>)[k]===0))throw new ContractError('INVALID_SDK_METRICS');
 return value as unknown as SdkMetricReport;
}
export interface IngestionAuthorization extends IdentityScope {
  credentialId: string;
  credentialVersion: number;
  permissions: ('events:write' | 'feedback:write' | 'feedback:own:read')[];
  expiresAt: string;
}
export const FEEDBACK_CATEGORIES = ['BUG','USAGE_PROBLEM','FEATURE_REQUEST','FEEDBACK','OTHER'] as const;
export type FeedbackStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export interface FeedbackSubmission {
  feedbackId: string;
  subject: string;
  description: string;
  category: typeof FEEDBACK_CATEGORIES[number];
  relatedEventId?: string;
  diagnosticConsent?: boolean;
}
export const FEEDBACK_NOTICE_FA = 'گزارش شما ممکن است برای شناسایی و رفع مشکلات نرم‌افزار با کمک هوش مصنوعی تحلیل شود. لطفاً اطلاعات محرمانه مانند رمز عبور را وارد نکنید.';
export const INCIDENT_STATUSES = ['NEW','TRIAGED','INVESTIGATING','MITIGATED','RESOLVED','REOPENED','IGNORED','FALSE_POSITIVE'] as const;
export type IncidentStatus = typeof INCIDENT_STATUSES[number];
export type EvidenceReference = { kind: 'EVENT' | 'ISSUE' | 'INCIDENT' | 'FEEDBACK' | 'AGGREGATE'; id: string };
export interface InvestigationOutput {
  summary: string;
  insufficientEvidence: boolean;
  hypotheses: { explanation: string; confidence: number; evidence: EvidenceReference[] }[];
  recommendedActions: { description: string; evidence: EvidenceReference[] }[];
}

export class ContractError extends Error {
  constructor(public readonly reasonCode: string) { super(reasonCode); this.name = 'ContractError'; }
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string { return typeof value === 'string' && uuidPattern.test(value); }
export function encodedBytes(value: unknown) { return new TextEncoder().encode(JSON.stringify(value)).byteLength; }
export function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function fail(code: string): never { throw new ContractError(code); }
function stringField(value: unknown, name: string, max: number, required = false) {
  if (value === undefined && !required) return;
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /\u0000/.test(value)) fail(`INVALID_${name}`);
}
const eventKeys = new Set(['eventId','schemaVersion','applicationId','environmentId','occurredAt','releaseVersion','source','category','severity','eventCode','normalizedMessage','exceptionType','sanitizedStack','traceId','spanId','requestId','actorReference','tenantReference','sessionCorrelationId','operationName','routeTemplate','httpStatus','durationMs','browserFamily','browserVersion','operatingSystem','deviceClass','connectivityState','safeMetadata']);

export function validateEvent(value: unknown, now = Date.now()): TelemetryEvent {
  if (!isRecord(value)) return fail('INVALID_EVENT');
  if (encodedBytes(value) > LIMITS.eventBytes) fail('EVENT_TOO_LARGE');
  if (Object.keys(value).some(key => !eventKeys.has(key))) fail('UNKNOWN_EVENT_FIELD');
  for (const key of ['eventId','applicationId','environmentId']) if (!isUuid(value[key])) fail(`INVALID_${key}`);
  if (!COMPATIBLE_SCHEMA_VERSIONS.includes(value.schemaVersion as '1.0')) fail('UNSUPPORTED_SCHEMA');
  if (!SOURCES.includes(value.source as EventSource) || !CATEGORIES.includes(value.category as Category) || !SEVERITIES.includes(value.severity as Severity)) fail('INVALID_CLASSIFICATION');
  if (typeof value.occurredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(value.occurredAt) || !Number.isFinite(Date.parse(value.occurredAt)) || Date.parse(value.occurredAt) > now + 300_000 || Date.parse(value.occurredAt) < now - 7 * 86_400_000) fail('INVALID_OCCURRED_AT');
  stringField(value.normalizedMessage, 'MESSAGE', LIMITS.message, true);
  stringField(value.sanitizedStack, 'STACK', LIMITS.stack);
  for (const key of ['releaseVersion','eventCode','exceptionType','requestId','sessionCorrelationId','operationName','browserFamily','browserVersion','operatingSystem','deviceClass']) stringField(value[key], key, 160, key === 'eventCode');
  if (typeof value.eventCode !== 'string' || !/^[A-Za-z0-9_.:-]{1,100}$/.test(value.eventCode)) fail('INVALID_EVENT_CODE');
  stringField(value.routeTemplate, 'ROUTE', 256);
  if (value.routeTemplate !== undefined && (!String(value.routeTemplate).startsWith('/') || /[?#]/.test(String(value.routeTemplate)))) fail('INVALID_ROUTE');
  for (const key of ['actorReference','tenantReference']) if (value[key] !== null) stringField(value[key], key, 160);
  for (const [key, length] of [['traceId',32],['spanId',16]] as const) if (value[key] !== undefined && (typeof value[key] !== 'string' || !new RegExp(`^[0-9a-f]{${length}}$`).test(String(value[key])) || /^0+$/.test(String(value[key])))) fail(`INVALID_${key}`);
  if (value.httpStatus !== undefined && (typeof value.httpStatus !== 'number' || !Number.isInteger(value.httpStatus) || value.httpStatus < 100 || value.httpStatus > 599)) fail('INVALID_HTTP_STATUS');
  if (value.durationMs !== undefined && (typeof value.durationMs !== 'number' || !Number.isFinite(value.durationMs) || value.durationMs < 0 || value.durationMs > 86_400_000)) fail('INVALID_DURATION');
  if (value.connectivityState !== undefined && !['ONLINE','OFFLINE','UNKNOWN'].includes(String(value.connectivityState))) fail('INVALID_CONNECTIVITY');
  if (value.safeMetadata !== undefined) {
    if (!isRecord(value.safeMetadata) || Object.keys(value.safeMetadata).length > LIMITS.metadataKeys) fail('INVALID_METADATA');
    for (const [key, item] of Object.entries(value.safeMetadata)) {
      if (!(METADATA_KEYS as readonly string[]).includes(key)) fail('UNSAFE_METADATA_KEY');
      if (typeof item === 'string' && item.length <= LIMITS.metadataString) continue;
      if (item === null || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) continue;
      fail('INVALID_METADATA_VALUE');
    }
  }
  return structuredClone(value) as unknown as TelemetryEvent;
}

export function validateBatch(value: unknown): unknown[] {
  if (!isRecord(value) || Object.keys(value).some(key => key !== 'events') || !Array.isArray(value.events) || value.events.length < 1 || value.events.length > LIMITS.batch) fail('INVALID_BATCH');
  if (encodedBytes(value) > LIMITS.batchBytes) fail('BATCH_TOO_LARGE');
  return value.events;
}

export function validateFeedback(value: unknown): FeedbackSubmission {
  if (!isRecord(value) || Object.keys(value).some(key => !['feedbackId','subject','description','category','relatedEventId','diagnosticConsent'].includes(key))) fail('INVALID_FEEDBACK');
  if (!isUuid(value.feedbackId) || !FEEDBACK_CATEGORIES.includes(value.category as 'BUG')) fail('INVALID_FEEDBACK');
  stringField(value.subject,'SUBJECT',160,true);
  stringField(value.description,'DESCRIPTION',8_000,true);
  if (value.relatedEventId !== undefined && !isUuid(value.relatedEventId)) fail('INVALID_EVENT_REFERENCE');
  if (value.diagnosticConsent !== undefined && typeof value.diagnosticConsent !== 'boolean') fail('INVALID_DIAGNOSTIC_FLAG');
  return structuredClone(value) as unknown as FeedbackSubmission;
}
