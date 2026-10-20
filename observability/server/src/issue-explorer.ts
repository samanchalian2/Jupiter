import {ContractError} from '@observability/contracts';

export const ISSUE_SORTS=['LAST_SEEN','FIRST_SEEN','OCCURRENCES','SEVERITY'] as const;
export const ISSUE_GROUPS=['NONE','STATUS','SEVERITY'] as const;
export const ISSUE_STATES=['OPEN','INVESTIGATING','RESOLVED','IGNORED','REOPENED'] as const;
export const severityOrder=(column:string)=>`CASE ${column} WHEN 'CRITICAL' THEN 5 WHEN 'ERROR' THEN 4 WHEN 'WARNING' THEN 3 WHEN 'INFO' THEN 2 ELSE 1 END`;
export function issueOrdering(input:{sort?:string;groupBy?:string;status?:string}){
 if(input.sort!==undefined&&!ISSUE_SORTS.includes(input.sort as typeof ISSUE_SORTS[number])||input.groupBy!==undefined&&!ISSUE_GROUPS.includes(input.groupBy as typeof ISSUE_GROUPS[number])||input.status!==undefined&&!ISSUE_STATES.includes(input.status as typeof ISSUE_STATES[number]))throw new ContractError('INVALID_ISSUE_FILTER');
 const sort=input.sort??'LAST_SEEN',groupBy=input.groupBy??'NONE';
 const order=sort==='FIRST_SEEN'?'first_seen DESC':sort==='OCCURRENCES'?'occurrence_count DESC':sort==='SEVERITY'?`${severityOrder('severity')} DESC`:'last_seen DESC';
 const groupColumn=groupBy==='STATUS'?'status':groupBy==='SEVERITY'?'severity':null;
 const groupOrder=groupBy==='STATUS'?'status ASC':`${severityOrder('severity')} DESC`;
 return{sort,groupBy,groupColumn,groupOrder,orderBy:`${groupColumn?`${groupOrder},`:''}${order},id DESC`};
}
