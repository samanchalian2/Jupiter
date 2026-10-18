// Run from an independent host; never embed a bearer key or user session.
const result={event:'observability.external_probe',health:'UNKNOWN',readiness:'UNKNOWN'};
try{
 const base=new URL(process.argv[2]);
 if(base.username||base.password||base.search||base.hash||!(base.protocol==='https:'||base.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(base.hostname)))throw Error('INVALID_PROBE_TARGET');
 const root=base.toString().replace(/\/$/,'');
 for(const [path,key,expected]of [['health','health','ok'],['ready','readiness','ready']]){
  const response=await fetch(`${root}/${path}`,{redirect:'error',signal:AbortSignal.timeout(5000),headers:{accept:'application/json'}});
  if(response.status!==200){result[key]='UNAVAILABLE';continue;}
  const reader=response.body?.getReader();if(!reader)throw Error('INVALID_RESPONSE');
  let size=0;const chunks=[];
  try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096)throw Error('RESPONSE_TOO_LARGE');chunks.push(value);}}finally{await reader.cancel().catch(()=>undefined);}
  const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  result[key]=body.service==='observability-hub'&&body.status===expected?'OK':'INVALID_RESPONSE';
 }
}catch{result.failure='PROBE_FAILED';}
const healthy=result.health==='OK'&&result.readiness==='OK';
console.log(JSON.stringify({...result,healthy}));process.exitCode=healthy?0:1;
