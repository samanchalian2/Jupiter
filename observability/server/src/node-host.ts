import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { LIMITS } from '@observability/contracts';
import { HubHttpApi, type HubHttpRequest } from './http-api.js';
export function createHubNodeHandler(api:HubHttpApi,basePath='/api/v1/observability'){
  return async(request:IncomingMessage,response:ServerResponse)=>{
    response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Cache-Control','no-store');
    const path=(request.url??'/').split('?')[0];
    if(!path.startsWith(`${basePath}/`)){response.writeHead(404);response.end(JSON.stringify({reasonCode:'NOT_FOUND'}));return;}
    let body:unknown;
    if(['POST','PUT'].includes(request.method??'')){
      if(!String(request.headers['content-type']??'').startsWith('application/json')){response.writeHead(415);response.end(JSON.stringify({reasonCode:'JSON_REQUIRED'}));request.resume();return;}
      let size=0;const chunks:Buffer[]=[];
      try{for await(const chunk of request){const buffer=Buffer.from(chunk);size+=buffer.length;if(size>LIMITS.batchBytes){response.writeHead(413);response.end(JSON.stringify({reasonCode:'PAYLOAD_TOO_LARGE'}));return;}chunks.push(buffer);}body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{if(!response.writableEnded){response.writeHead(400);response.end(JSON.stringify({reasonCode:'INVALID_JSON'}));}return;}
    }
    const input:HubHttpRequest={method:request.method??'GET',path:(request.url??'/').slice(basePath.length),authorization:request.headers.authorization,origin:typeof request.headers.origin==='string'?request.headers.origin:undefined,body,clientKey:request.socket.remoteAddress??'unknown'};
    const result=await api.dispatch(input);response.writeHead(result.status,result.headers);response.end(result.status===204?undefined:result.headers?.['Content-Type']?.startsWith('text/csv')?String(result.body):JSON.stringify(result.body));
  };
}
export function createHubServer(api:HubHttpApi){const server=createServer(createHubNodeHandler(api));server.requestTimeout=20_000;server.headersTimeout=15_000;server.maxHeadersCount=40;return server;}
