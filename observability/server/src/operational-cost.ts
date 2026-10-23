import {ContractError} from '@observability/contracts';

/** Operational estimates only: USD micro-units, explicit rates per 1M tokens. */
export function estimateOperationalCost(inputTokens:number,outputTokens:number,inputRate:bigint,outputRate:bigint):bigint{
 if(!Number.isSafeInteger(inputTokens)||inputTokens<0||!Number.isSafeInteger(outputTokens)||outputTokens<0||inputRate<0n||outputRate<0n)throw new ContractError('INVALID_AI_COST_ESTIMATE');
 const numerator=BigInt(inputTokens)*inputRate+BigInt(outputTokens)*outputRate;
 return (numerator+999999n)/1000000n;
}
export interface OperationalLimitsInput {monthlyRequestLimit?:number|null;monthlyEstimatedCostMicros?:number|null;inputRateMicrosPerMillion?:number|null;outputRateMicrosPerMillion?:number|null;}
export interface StoredOperationalLimits {monthly_request_limit?:number|null;monthly_estimated_cost_micros?:string|null;input_rate_micros_per_million?:string|null;output_rate_micros_per_million?:string|null;}
export function operationalLimits(input:OperationalLimitsInput,old?:StoredOperationalLimits){
 const fields=[['monthlyRequestLimit','monthly_request_limit',1000000000],['monthlyEstimatedCostMicros','monthly_estimated_cost_micros',1000000000000],['inputRateMicrosPerMillion','input_rate_micros_per_million',1000000000000],['outputRateMicrosPerMillion','output_rate_micros_per_million',1000000000000]] as const;
 const result={} as Record<keyof OperationalLimitsInput,number|null>;
 for(const [key,column,max]of fields){const value=input[key]===undefined?(old?.[column]??null):input[key];if(value===null){result[key]=null;continue;}if(input[key]!==undefined&&typeof value!=='number')throw new ContractError('INVALID_AI_CONFIGURATION');const parsed=Number(value);if(!Number.isSafeInteger(parsed)||parsed<0||parsed>max)throw new ContractError('INVALID_AI_CONFIGURATION');result[key]=parsed;}
 if((result.inputRateMicrosPerMillion===null)!==(result.outputRateMicrosPerMillion===null)||result.monthlyEstimatedCostMicros!==null&&result.inputRateMicrosPerMillion===null)throw new ContractError('AI_COST_RATES_REQUIRED');
 return result;
}
