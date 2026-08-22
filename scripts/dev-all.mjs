import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const api=resolve(root,'apps/api'); const web=resolve(root,'apps/web');
const storage=spawn(process.execPath,[resolve(api,'scripts/local-storage.mjs')],{cwd:root,stdio:'inherit'});
const storageExit=await new Promise((resolveExit)=>storage.once('exit',(code)=>resolveExit(code??1)));
if(storageExit!==0)process.exit(storageExit);
const typeScriptCompiler=resolve(api,'node_modules/typescript/bin/tsc');
const build=spawn(process.execPath,[typeScriptCompiler,'-p','tsconfig.build.json'],{cwd:api,stdio:'inherit'});
const buildExit=await new Promise((resolveExit)=>build.once('exit',(code)=>resolveExit(code??1)));
if(buildExit!==0)process.exit(buildExit);

const children=[
  spawn(process.execPath,['dist/main.js'],{cwd:api,stdio:'inherit'}),
  spawn(process.execPath,['dist/worker.js'],{cwd:api,stdio:'inherit',env:{...process.env,JUPITER_WORKER_ENABLED:'true'}}),
  spawn(process.execPath,[resolve(web,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1'],{cwd:web,stdio:'inherit'}),
];
let stopping=false;
function stop(signal){if(stopping)return;stopping=true;for(const child of children)if(!child.killed)child.kill(signal);}
process.on('SIGINT',()=>stop('SIGINT'));process.on('SIGTERM',()=>stop('SIGTERM'));
for(const child of children)child.once('exit',(code)=>{if(!stopping){stop('SIGTERM');process.exitCode=code??1;}});
