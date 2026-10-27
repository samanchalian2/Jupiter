import {createRequire} from 'node:module';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';

const api=resolve(import.meta.dirname,'../apps/api');
const require=createRequire(resolve(api,'package.json'));
const {Client}=require('pg');
for(const file of [resolve(api,'.env'),resolve(api,'../../.env')]){try{process.loadEnvFile(file);}catch(error){if(error.code!=='ENOENT')throw error;}}
const source=new URL(process.env.DATABASE_URL??`postgresql://postgres:${encodeURIComponent(process.env.POSTGRES_PASSWORD??'')}@127.0.0.1:5432/jupiter`);
if(!['127.0.0.1','localhost','[::1]'].includes(source.hostname))throw Error('Disposable LOCAL database only');
const name=`goal070_tests_${randomUUID().replaceAll('-','')}`;
const admin=new Client({connectionString:source.toString(),connectionTimeoutMillis:3000});
let created=false,db,priorRoles,exitCode=1;
try{
  await admin.connect();
  const snapshot=async()=>(await admin.query('SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls FROM pg_roles ORDER BY rolname')).rows;
  priorRoles=JSON.stringify(await snapshot());
  if(!(await admin.query("SELECT 1 FROM pg_roles WHERE rolname='jupiter_app'")).rowCount)throw Error('Existing runtime role required; do not create shared roles');
  await admin.query(`CREATE DATABASE "${name}"`);created=true;
  source.pathname=`/${name}`;db=new Client({connectionString:source.toString()});await db.connect();
  const files=(await readdir(resolve(api,'migrations'))).filter(file=>file.endsWith('.sql')).sort();
  if(files.length!==85||files.at(-1)!=='074_first_login_password.sql')throw Error('Unexpected migration chain');
  await db.query('CREATE TABLE schema_migrations(name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())');
  for(const file of files){
    let sql=await readFile(resolve(api,'migrations',file),'utf8');
    if(file==='001_identity.sql')sql=sql.replace('CREATE ROLE jupiter_app NOLOGIN;','');
    await db.query('BEGIN');
    try{await db.query(sql);await db.query('INSERT INTO schema_migrations(name) VALUES($1)',[file]);await db.query('COMMIT');}
    catch(error){await db.query('ROLLBACK');throw error;}
  }
  console.log(JSON.stringify({gate:'GOAL070_MIGRATION_REHEARSAL',result:'PASS',migrations:files.length,database:name,sharedRolesUnchanged:priorRoles===JSON.stringify(await snapshot())}));
  const child=spawn(process.execPath,[require.resolve('vitest/vitest.mjs'),'run','--no-file-parallelism',...process.argv.slice(2)],{cwd:api,env:{...process.env,DATABASE_URL:source.toString()},stdio:'inherit',windowsHide:true});
  exitCode=await new Promise((done,reject)=>{child.once('error',reject);child.once('exit',code=>done(code??1));});
}finally{
  await db?.end();
  if(created){
    if(!/^goal070_tests_[0-9a-f]{32}$/.test(name))throw Error('Cleanup target rejected');
    await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()',[name]);
    await admin.query(`DROP DATABASE "${name}"`);
    const roles=JSON.stringify((await admin.query('SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls FROM pg_roles ORDER BY rolname')).rows);
    if(roles!==priorRoles)throw Error('Shared role snapshot changed');
    console.log(JSON.stringify({gate:'GOAL070_TEST_CLEANUP',result:'PASS',temporaryDatabaseRemoved:true,sharedRolesUnchanged:true}));
  }
  await admin.end();
}
process.exitCode=exitCode;
