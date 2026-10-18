import {afterAll,beforeAll,describe,it,expect} from 'vitest';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const run=promisify(execFile),script=fileURLToPath(new URL('../../examples/health-probe.mjs',import.meta.url));
let base:string,redirectVisits=0;
const server=createServer((request,response)=>{
 const path=request.url??'';
 if(path.startsWith('/destination')){redirectVisits++;response.end('{}');return;}
 if(path.startsWith('/redirect')){response.writeHead(302,{location:base+'/destination'});response.end();return;}
 response.setHeader('Content-Type','application/json');
 if(path.startsWith('/large')){response.end('x'.repeat(5000));return;}
 if(path.startsWith('/unavailable')&&path.endsWith('/ready')){response.writeHead(503);response.end(JSON.stringify({reasonCode:'STORAGE_UNAVAILABLE'}));return;}
 if(path.startsWith('/invalid')){response.end(JSON.stringify({service:'another-service',status:'ok'}));return;}
 response.end(JSON.stringify({service:'observability-hub',status:path.endsWith('/ready')?'ready':'ok'}));
});
beforeAll(async()=>{await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw Error('fixture failed');base=`http://127.0.0.1:${address.port}`;});
afterAll(async()=>{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));});
async function probe(target:string){try{const result=await run(process.execPath,[script,target],{timeout:12000});return{code:0,body:JSON.parse(result.stdout)};}catch(error){const result=error as {code:number;stdout:string};return{code:result.code,body:JSON.parse(result.stdout)};}}
describe('independent external health-probe process',()=>{
 it('requires actual liveness and readiness JSON before exit zero',async()=>{expect(await probe(base+'/healthy')).toEqual({code:0,body:{event:'observability.external_probe',health:'OK',readiness:'OK',healthy:true}});});
 it('does not mistake liveness for storage readiness',async()=>{const result=await probe(base+'/unavailable');expect(result.code).toBe(1);expect(result.body).toMatchObject({health:'OK',readiness:'UNAVAILABLE',healthy:false});});
 it('does not follow redirects or print raw failures',async()=>{const result=await probe(base+'/redirect');expect(result.code).toBe(1);expect(result.body.failure).toBe('PROBE_FAILED');expect(redirectVisits).toBe(0);expect(JSON.stringify(result.body)).not.toContain(base);});
 it.each(['/large','/invalid'])('rejects oversized or wrong-service response %s',async path=>{expect((await probe(base+path)).code).toBe(1);});
 it('rejects network HTTP and URL credentials without a request',async()=>{expect((await probe('http://example.invalid/api')).body.failure).toBe('PROBE_FAILED');expect((await probe(base.replace('http://','http://fixture-user:fixture-password@'))).body).toEqual({event:'observability.external_probe',health:'UNKNOWN',readiness:'UNKNOWN',failure:'PROBE_FAILED',healthy:false});});
});
