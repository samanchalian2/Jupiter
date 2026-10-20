import {CATEGORIES,SOURCES,ContractError,type TelemetryEvent} from '@observability/contracts';
import {sha256} from '@observability/core';

export type ApplicationIngestionPolicy={version:1;enabledSources:TelemetryEvent['source'][];samplingBasisPoints:Record<TelemetryEvent['category'],number>};
export function defaultIngestionPolicy():ApplicationIngestionPolicy{return{version:1,enabledSources:[...SOURCES],samplingBasisPoints:Object.fromEntries(CATEGORIES.map(category=>[category,10000])) as ApplicationIngestionPolicy['samplingBasisPoints']};}
export function validateIngestionPolicy(value:unknown):ApplicationIngestionPolicy{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ContractError('INVALID_INGESTION_POLICY');
 const policy=value as Record<string,unknown>,rates=policy.samplingBasisPoints;
 if(Object.keys(policy).length!==3||policy.version!==1||!Array.isArray(policy.enabledSources)||policy.enabledSources.length>SOURCES.length||new Set(policy.enabledSources).size!==policy.enabledSources.length||policy.enabledSources.some(source=>!SOURCES.includes(source))||!rates||typeof rates!=='object'||Array.isArray(rates)||Object.keys(rates).length!==CATEGORIES.length)throw new ContractError('INVALID_INGESTION_POLICY');
 for(const category of CATEGORIES){const rate=(rates as Record<string,unknown>)[category];if(typeof rate!=='number'||!Number.isInteger(rate)||rate<0||rate>10000)throw new ContractError('INVALID_INGESTION_POLICY');}
 return{version:1,enabledSources:[...policy.enabledSources] as ApplicationIngestionPolicy['enabledSources'],samplingBasisPoints:{...rates} as ApplicationIngestionPolicy['samplingBasisPoints']};
}
export function storedIngestionPolicy(value:unknown):ApplicationIngestionPolicy{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ContractError('INVALID_INGESTION_POLICY');
 return 'ingestion' in value?validateIngestionPolicy(value.ingestion):defaultIngestionPolicy();
}
export async function ingestionExclusion(event:TelemetryEvent,policy:ApplicationIngestionPolicy):Promise<'SOURCE_DISABLED_BY_POLICY'|'SAMPLING_EXCLUDED'|null>{
 if(!policy.enabledSources.includes(event.source))return'SOURCE_DISABLED_BY_POLICY';
 if(event.severity==='ERROR'||event.severity==='CRITICAL')return null;
 const rate=policy.samplingBasisPoints[event.category];if(rate===10000)return null;if(rate===0)return'SAMPLING_EXCLUDED';
 const hash=await sha256(`${event.applicationId}:${event.environmentId}:${event.eventId}`.toLowerCase());
 return Number.parseInt(hash.slice(0,8),16)/4294967296<rate/10000?null:'SAMPLING_EXCLUDED';
}
