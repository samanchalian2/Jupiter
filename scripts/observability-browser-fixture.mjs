// Ephemeral LOCAL test web only. Never starts/replaces the shared preview host.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
export async function observabilityBrowserFixture(explicitOrigin){
 if(explicitOrigin){const url=new URL(explicitOrigin);if(!['http:','https:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.origin!==explicitOrigin)throw Error('Exact LOCAL acceptance origin required');return{origin:explicitOrigin,close:async()=>{}};}
 const {createServer:createViteServer}=await import(pathToFileURL(require.resolve('vite')).href),react=require('@vitejs/plugin-react');
 const reservation=createServer();await new Promise(done=>reservation.listen(0,'127.0.0.1',done));const reserved=reservation.address();await new Promise((done,reject)=>reservation.close(error=>error?reject(error):done()));
 if(!reserved||typeof reserved==='string'||[3000,5173,5174].includes(reserved.port))throw Error('Unsafe test fixture port');
 const web=await createViteServer({root:fileURLToPath(new URL('../apps/web/',import.meta.url)),configFile:false,logLevel:'error',plugins:[react()],server:{host:'127.0.0.1',port:reserved.port,strictPort:true,proxy:{}}});
 try{await web.listen();const address=web.httpServer.address();if(!address||typeof address==='string'||address.port!==reserved.port)throw Error('Test fixture listener mismatch');return{origin:`http://127.0.0.1:${address.port}`,close:()=>web.close()};}catch(error){await web.close();throw error;}
}
