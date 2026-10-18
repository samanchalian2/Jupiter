import { ContractError, LIMITS, validateEvent, type IdentityScope, type TelemetryEvent, type IncidentStatus, type InvestigationOutput, type EvidenceReference } from '@observability/contracts';

/** Targeted masking preserves ordinary diagnostics and reproduction steps. */
export function redactText(text: string): string {
  return text
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,'[private key redacted]')
    .replace(/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"'<>]+/gi,'[connection string redacted]')
    .replace(/\b(?:Bearer|Basic)\s+[a-zA-Z0-9+/_=.-]+/g,'[authorization redacted]')
    .replace(/\beyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,'[token redacted]')
    .replace(/\b(?:sk-(?:proj-)?[a-zA-Z0-9_-]{12,}|AKIA[A-Z0-9]{16})\b/g,'[api key redacted]')
    .replace(/((?:password|passwd|pwd|secret|(?:api[_ -]?|access[_ -]?|refresh[_ -]?)?(?:key|token)|authorization|cookie|رمز(?:\s*عبور)?|کلید\s*(?:API|ای‌پی‌آی))\s*["']?\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;}]+)/gi,'$1[redacted]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[email redacted]')
    .replace(/\b(?:\d[ -]?){13,19}\b/g,'[sensitive number redacted]')
    .replace(/https?:\/\/[^\s<>"')]+/gi, match => { try { const url = new URL(match); url.username='';url.password='';url.search='';url.hash='';return url.toString(); } catch { return '[url redacted]'; } })
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'');
}
export function sanitizeStack(value: string): string {
  return redactText(value)
    .replace(/(?:[A-Z]:\\|\/)(?:Users|home)\/[\w.-]+/gi,'[user-home]')
    .replace(/[A-Z]:\\Users\\[^\\\s]+/gi,'[user-home]')
    .slice(0,LIMITS.stack);
}
export function routeTemplate(value: string): string {
  let path = value;
  try { path = new URL(value,'http://local.invalid').pathname; } catch { path=value.split(/[?#]/)[0]; }
  return path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,':id').replace(/\/\d+(?=\/|$)/g,'/:id').slice(0,256);
}
export function sanitizeEvent(event: TelemetryEvent): TelemetryEvent {
  const next = structuredClone(event);
  next.normalizedMessage=redactText(next.normalizedMessage).slice(0,LIMITS.message);
  if(next.sanitizedStack)next.sanitizedStack=sanitizeStack(next.sanitizedStack);
  if(next.routeTemplate)next.routeTemplate=routeTemplate(next.routeTemplate);
  for(const key of ['releaseVersion','exceptionType','requestId','sessionCorrelationId','operationName','browserFamily','browserVersion','operatingSystem','deviceClass'] as const)if(next[key])next[key]=redactText(next[key]!).slice(0,160);
  for(const [key,value] of Object.entries(next.safeMetadata??{}))if(typeof value==='string')next.safeMetadata![key]=redactText(value).slice(0,LIMITS.metadataString);
  return validateEvent(next);
}
export function scopeKey(scope: IdentityScope): string { return JSON.stringify([scope.applicationId,scope.environmentId,scope.actorReference,scope.tenantReference]); }
export function enforceScope(event: TelemetryEvent, scope: IdentityScope): TelemetryEvent {
  if(event.applicationId!==scope.applicationId||event.environmentId!==scope.environmentId)throw new ContractError('APPLICATION_SCOPE_MISMATCH');
  if(event.actorReference!==undefined&&event.actorReference!==scope.actorReference)throw new ContractError('ACTOR_SCOPE_MISMATCH');
  if(event.tenantReference!==undefined&&event.tenantReference!==scope.tenantReference)throw new ContractError('TENANT_SCOPE_MISMATCH');
  return {...event,actorReference:scope.actorReference,tenantReference:scope.tenantReference};
}
export function canonicalJson(value: unknown): string {
  if(Array.isArray(value))return `[${value.map(canonicalJson).join(',')}]`;
  if(value!==null&&typeof value==='object')return `{${Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  return JSON.stringify(value)??'null';
}
export async function sha256(value: string): Promise<string> { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join(''); }
export const FINGERPRINT_VERSION=1;
export async function fingerprint(event: TelemetryEvent): Promise<string> {
  const frames=(event.sanitizedStack??'').split('\n').filter(line=>/^\s*at\s|@https?:|@\//.test(line)).slice(0,5).map(frame=>routeTemplateFrame(frame));
  return sha256(canonicalJson({version:FINGERPRINT_VERSION,application:event.applicationId,environment:event.environmentId,service:event.safeMetadata?.service??event.source,exception:event.exceptionType??'',code:event.eventCode,operation:event.operationName??'',route:event.routeTemplate??'',frames}));
}
function routeTemplateFrame(frame: string) { return redactText(frame).replace(/:\d+(?::\d+)?(?=\)?$)/,'').replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi,':id').replace(/[?#][^\s)]*/g,'').trim(); }
export function parseTraceparent(value: string|undefined): {traceId:string;spanId:string;sampled:boolean}|undefined {
  if(!value)return;
  const match=/^00-([0-9a-f]{32})-([0-9a-f]{16})-(0[01])$/.exec(value);
  if(!match||/^0+$/.test(match[1])||/^0+$/.test(match[2]))return;
  return {traceId:match[1],spanId:match[2],sampled:match[3]==='01'};
}
function randomHex(bytes:number) { return [...crypto.getRandomValues(new Uint8Array(bytes))].map(b=>b.toString(16).padStart(2,'0')).join(''); }
export function newTrace(parent?: string) { const parsed=parseTraceparent(parent);const traceId=parsed?.traceId??randomHex(16),spanId=randomHex(8);return {traceId,spanId,traceparent:`00-${traceId}-${spanId}-${parsed?.sampled===false?'00':'01'}`}; }
export function retryDelay(attempt: number, random=Math.random): number { const ceiling=Math.min(300_000,1000*2**Math.max(0,Math.min(attempt,12)));return Math.round(ceiling*(0.5+Math.max(0,Math.min(1,random()))*0.5)); }
const transitions: Record<IncidentStatus,readonly IncidentStatus[]>={NEW:['TRIAGED','INVESTIGATING','IGNORED','FALSE_POSITIVE'],TRIAGED:['INVESTIGATING','MITIGATED','IGNORED','FALSE_POSITIVE'],INVESTIGATING:['MITIGATED','RESOLVED','IGNORED','FALSE_POSITIVE'],MITIGATED:['INVESTIGATING','RESOLVED'],RESOLVED:['REOPENED'],REOPENED:['TRIAGED','INVESTIGATING','MITIGATED','RESOLVED','IGNORED','FALSE_POSITIVE'],IGNORED:['REOPENED'],FALSE_POSITIVE:['REOPENED']};
export function canTransitionIncident(from:IncidentStatus,to:IncidentStatus) { return transitions[from].includes(to); }
const evidenceKey=(e:EvidenceReference)=>`${e.kind}:${e.id}`;
export function validateInvestigation(output: unknown, permitted: readonly EvidenceReference[]): InvestigationOutput {
  if(!output||typeof output!=='object')throw new ContractError('INVALID_AI_OUTPUT');
  const value=output as InvestigationOutput;
  if(typeof value.summary!=='string'||!value.summary.trim()||value.summary.length>4000||typeof value.insufficientEvidence!=='boolean'||!Array.isArray(value.hypotheses)||value.hypotheses.length>5||!Array.isArray(value.recommendedActions)||value.recommendedActions.length>8)throw new ContractError('INVALID_AI_OUTPUT');
  if(Object.keys(value).some(k=>!['summary','insufficientEvidence','hypotheses','recommendedActions'].includes(k)))throw new ContractError('INVALID_AI_OUTPUT');
  const allowed=new Set(permitted.map(evidenceKey));
  const refs=(input:unknown)=>{if(!Array.isArray(input)||!input.length||input.length>10||input.some(e=>!e||typeof e!=='object'||Object.keys(e).some(k=>!['kind','id'].includes(k))||!allowed.has(evidenceKey(e))))throw new ContractError('UNAUTHORIZED_AI_EVIDENCE');};
  for(const h of value.hypotheses){if(!h||Object.keys(h).some(k=>!['explanation','confidence','evidence'].includes(k))||typeof h.explanation!=='string'||!h.explanation.trim()||h.explanation.length>2000||typeof h.confidence!=='number'||!Number.isFinite(h.confidence)||h.confidence<0||h.confidence>1)throw new ContractError('INVALID_AI_HYPOTHESIS');refs(h.evidence);}
  for(const a of value.recommendedActions){if(!a||Object.keys(a).some(k=>!['description','evidence'].includes(k))||typeof a.description!=='string'||!a.description.trim()||a.description.length>2000)throw new ContractError('INVALID_AI_ACTION');refs(a.evidence);}
  if(permitted.length===0&&(!value.insufficientEvidence||value.hypotheses.length||value.recommendedActions.length))throw new ContractError('INSUFFICIENT_AI_EVIDENCE');
  return {...value,summary:redactText(value.summary),hypotheses:value.hypotheses.map(h=>({...h,explanation:redactText(h.explanation)})),recommendedActions:value.recommendedActions.map(a=>({...a,description:redactText(a.description)}))};
}
export interface Clock { now():number; }
export interface SafeLogger { write(entry:{code:string;severity:'INFO'|'WARNING'|'ERROR';requestId?:string}):void; }
export {SdkMetricBuffer} from './metrics.js';
