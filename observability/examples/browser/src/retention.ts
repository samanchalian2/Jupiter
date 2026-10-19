import { BrowserSdk, IndexedDbQueue } from '@observability/browser-sdk';
import type { IdentityScope } from '@observability/contracts';

// Acceptance-only consumer: real origin IndexedDB, no credential or fabricated
// expiry row. A fresh page reloads the absolute enqueue-time deadlines.
const response=await fetch('/reference/session');
if(!response.ok)throw Error('Verified reference session required');
const session=await response.json() as {scope:IdentityScope;endpoint:string};
const storage=new IndexedDbQueue('observability-retention-acceptance');
let authCalls=0,transportCalls=0;
const checking=new URL(location.href).searchParams.get('phase')==='check';
const sdk=new BrowserSdk({applicationId:session.scope.applicationId,environmentId:session.scope.environmentId,endpoint:session.endpoint,contextProvider:()=>session.scope,storage,reportMetrics:false,
  retentionMs:checking?undefined:{events:1000,feedback:1000},
  authProvider:async()=>{authCalls++;return null;},transport:async()=>{transportCalls++;throw Error('Expired rows must never dispatch');}});
await sdk.setContext();
if(checking)await sdk.flush();
else{
  await sdk.capture({category:'FRONTEND',severity:'ERROR',eventCode:'reference.retention',normalizedMessage:'Controlled retention acceptance'});
  await sdk.submitFeedback({feedbackId:crypto.randomUUID(),category:'BUG',subject:'Controlled retention',description:'Synthetic expiring feedback'});
}
document.getElementById('result')!.textContent=JSON.stringify({phase:checking?'check':'capture',rows:(await storage.list()).map(row=>({id:row.id,kind:row.kind,createdAt:row.createdAt,expiresAt:row.expiresAt})),status:await sdk.getStatus(),authCalls,transportCalls});
storage.close();
