export interface IncidentRoute {applicationId:string;environmentId:string;incidentId:string;tenantReference?:string|null;}
const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const pattern=new RegExp(`^#obs/incident/(${uuid})/(${uuid})/(${uuid})(?:\\?(.*))?$`,'i');
export function incidentRoute(hash:string):IncidentRoute|null|'INVALID'{
 if(!hash.startsWith('#obs/incident'))return null;
 const match=pattern.exec(hash);if(!match)return 'INVALID';
 if(/%(?![0-9a-f]{2})/i.test(match[4]??''))return 'INVALID';
 const query=new URLSearchParams(match[4]??'');let invalid=false;query.forEach((_value,key)=>{if(key!=='tenant')invalid=true;});if(invalid||query.getAll('tenant').length>1||(query.get('tenant')?.length??0)>160)return 'INVALID';
 return{applicationId:match[1],environmentId:match[2],incidentId:match[3],...(query.has('tenant')?{tenantReference:query.get('tenant')||null}:{})};
}
export function incidentHref(route:IncidentRoute){
 const query=new URLSearchParams();if(route.tenantReference!==undefined)query.set('tenant',route.tenantReference??'');
 const hash=`#obs/incident/${route.applicationId}/${route.environmentId}/${route.incidentId}${query.size?`?${query}`:''}`;
 if(incidentRoute(hash)==='INVALID')throw Error('Invalid Incident route');return hash;
}
export function incidentScopeQuery(route:IncidentRoute){const query=new URLSearchParams({environmentId:route.environmentId});if(route.tenantReference!==undefined)query.set('tenantReference',route.tenantReference??'');return query;}
