import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ContractError } from '@observability/contracts';

export interface CredentialVault { encrypt(secret:string,applicationId:string):string; decrypt(ciphertext:string,applicationId:string):string }
/** Deployment owns the 32-byte key. Ciphertext is bound to its Application. */
export class AesCredentialVault implements CredentialVault {
  constructor(private readonly key:Uint8Array){if(key.byteLength!==32)throw new ContractError('INVALID_VAULT_KEY');}
  encrypt(secret:string,applicationId:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(Buffer.from(applicationId));const body=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);return ['v1',iv.toString('base64'),cipher.getAuthTag().toString('base64'),body.toString('base64')].join('.');}
  decrypt(ciphertext:string,applicationId:string){try{const [version,iv,tag,body,...extra]=ciphertext.split('.');if(version!=='v1'||!iv||!tag||!body||extra.length)throw Error();const decipher=createDecipheriv('aes-256-gcm',this.key,Buffer.from(iv,'base64'));decipher.setAAD(Buffer.from(applicationId));decipher.setAuthTag(Buffer.from(tag,'base64'));return Buffer.concat([decipher.update(Buffer.from(body,'base64')),decipher.final()]).toString('utf8');}catch{throw new ContractError('CREDENTIAL_UNAVAILABLE');}}
}
export interface InvestigationProviderRequest {endpoint:string;credential:string;model:string;system:string;evidence:string;maxOutputTokens:number;signal:AbortSignal}
export interface InvestigationProviderResponse {output:unknown;inputTokens?:number;outputTokens?:number}
export interface InvestigationProvider { analyze(input:InvestigationProviderRequest):Promise<InvestigationProviderResponse> }
export interface ProviderEndpointPolicy {allowedHosts:readonly string[];allowLoopback?:boolean}
export function validateProviderEndpoint(value:string,policy:ProviderEndpointPolicy){
  let url:URL;try{url=new URL(value);}catch{throw new ContractError('INVALID_PROVIDER_ENDPOINT');}
  const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.username||url.password||url.hash||url.search||url.pathname.endsWith('/chat/completions')||url.protocol!=='https:'&&!(policy.allowLoopback&&loopback&&url.protocol==='http:')||!loopback&&!policy.allowedHosts.includes(url.hostname)||loopback&&!policy.allowLoopback)throw new ContractError('PROVIDER_ENDPOINT_DENIED');
  return url.href.replace(/\/$/,'');
}
/** Compatible JSON chat adapter. No tools, no redirects, no raw error logging. */
export class JsonInvestigationProvider implements InvestigationProvider {
  constructor(private readonly policy:ProviderEndpointPolicy,private readonly transport:typeof fetch=fetch){}
  async analyze(input:InvestigationProviderRequest):Promise<InvestigationProviderResponse>{
    const endpoint=validateProviderEndpoint(input.endpoint,this.policy);
    const response=await this.transport(`${endpoint}/chat/completions`,{method:'POST',redirect:'error',signal:input.signal,headers:{authorization:`Bearer ${input.credential}`,'content-type':'application/json'},body:JSON.stringify({model:input.model,messages:[{role:'system',content:input.system},{role:'user',content:input.evidence}],response_format:{type:'json_object'},max_tokens:input.maxOutputTokens,temperature:0})});
    if(!response.ok)throw new ContractError('AI_PROVIDER_FAILED');
    if(Number(response.headers.get('content-length')??0)>131072)throw new ContractError('AI_RESPONSE_TOO_LARGE');
    // Enforce the streaming byte bound even without Content-Length.
    const reader=response.body?.getReader();if(!reader)throw new ContractError('AI_PROVIDER_EMPTY');
    let bytes=0;const chunks:Uint8Array[]=[];
    try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>131072)throw new ContractError('AI_RESPONSE_TOO_LARGE');chunks.push(part.value);}}finally{await reader.cancel().catch(()=>undefined);}
    try{const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));const content=payload.choices?.[0]?.message?.content;if(typeof content!=='string')throw Error();return{output:JSON.parse(content),inputTokens:payload.usage?.prompt_tokens,outputTokens:payload.usage?.completion_tokens};}catch{throw new ContractError('INVALID_AI_OUTPUT');}
  }
}
