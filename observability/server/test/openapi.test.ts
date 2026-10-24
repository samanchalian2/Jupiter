import {describe,expect,it} from 'vitest';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import formats from 'ajv-formats';
import {openApiDocument} from '../src/openapi.js';
import {validateEvent,COMPATIBLE_SCHEMA_VERSIONS,SEVERITIES,CATEGORIES,SOURCES} from '@observability/contracts';
import {randomUUID} from 'node:crypto';
import {jsonSchema} from './openapi-schema.js';

describe('public language-neutral OpenAPI',()=>{
 it('documents complete retained Issue impact and never a cross-product count',()=>{
  const ajv=new Ajv({strict:false});formats(ajv);const check=ajv.compile(jsonSchema(openApiDocument.components.schemas.IssueImpact) as object),sample={basis:'RETAINED_LINKED_EVENTS',occurrences:123,affectedUsers:2,affectedTenants:1,affectedApplications:1,tenantFreeEvents:0,affectedFeatureCount:1,affectedFeatures:['feature'],unknownFeatureEvents:0,observedFirstAt:'2026-10-01T00:00:00Z',observedLastAt:'2026-10-31T00:00:00Z',observedDurationMs:2592000000};expect(check(sample),JSON.stringify(check.errors)).toBe(true);
  for(const invalid of [{...sample,affectedApplications:2},{...sample,basis:'LIFETIME'},{...sample,affectedFeatures:Array(21).fill('feature')},{...sample,observedFirstAt:'invalid'}])expect(check(invalid)).toBe(false);
 });
 it('documents additive bounded observed Incident impact while preserving legacy unknowns',()=>{
  const validate=new Ajv({strict:false});formats(validate);const check=validate.compile(jsonSchema(openApiDocument.components.schemas.IncidentImpact) as object);
  expect(check({occurrences:4,affectedUsers:2,windowSeconds:60})).toBe(true);expect(check({})).toBe(true);
  expect(check({affectedTenants:0,tenantFreeEvents:1,affectedFeatures:['explicit-feature'],observedDurationMs:0,observedFirstAt:null,observedLastAt:null})).toBe(true);
  for(const invalid of [{affectedFeatures:Array(21).fill('feature')},{affectedFeatures:[false]},{observedDurationMs:-1},{observedFirstAt:'invalid'},{affectedFeatures:['x'.repeat(257)]}])expect(check(invalid)).toBe(false);
 });
 it('validates the complete document with no remote reference resolution',async()=>{
  const document=await SwaggerParser.validate(structuredClone(openApiDocument) as never,{resolve:{external:false}});
  expect(document.openapi).toBe('3.0.3');
  const ids:string[]=[];for(const[path,item]of Object.entries(openApiDocument.paths))for(const[method,value]of Object.entries(item)){
   const op=value as {operationId:string;security:unknown[];responses:Record<string,unknown>;parameters?:{name:string;in:string;required:boolean}[]};
   expect(['get','post','put']).toContain(method);ids.push(op.operationId);expect(op.responses).toHaveProperty('503');
   for(const match of path.matchAll(/\{([^}]+)\}/g))expect(op.parameters?.some(p=>p.name===match[1]&&p.in==='path'&&p.required)).toBe(true);
   if(!['/health','/ready','/openapi.json'].includes(path))expect(op.security).not.toEqual([]);
  }
  expect(new Set(ids).size).toBe(ids.length);expect(ids.length).toBe(61);
 });
 it('matches shared event enums, strict fields and null primitive metadata',async()=>{
  const doc=await SwaggerParser.dereference(structuredClone(openApiDocument) as never,{resolve:{external:false}}) as unknown as {components:{schemas:Record<string,unknown>}};
  const ajv=new Ajv({strict:false});formats(ajv);const check=ajv.compile(doc.components.schemas.TelemetryEvent as object);
  const sample={eventId:randomUUID(),schemaVersion:'1.1',applicationId:randomUUID(),environmentId:randomUUID(),occurredAt:new Date().toISOString(),source:'REFERENCE_CLIENT',category:'BACKEND',severity:'ERROR',eventCode:'client.example',normalizedMessage:'Controlled example',actorReference:null,tenantReference:null,safeMetadata:{failureCode:null,attempt:1,retryExhausted:false,service:'reference'}};
  expect(validateEvent(sample)).toEqual(sample);expect(check(sample),JSON.stringify(check.errors)).toBe(true);
  for(const value of [{...sample,arbitrary:'unexpected'},{...sample,traceId:'0'.repeat(32)},{...sample,safeMetadata:{secret:'unsafe'}},{...sample,source:'UNKNOWN'},{...sample,routeTemplate:'/operation?token=unsafe'}])expect(check(value)).toBe(false);
  const schema=openApiDocument.components.schemas.TelemetryEvent.properties as Record<string,{enum?:string[]}>;
  for(const[key,values]of [['schemaVersion',COMPATIBLE_SCHEMA_VERSIONS],['source',SOURCES],['category',CATEGORIES],['severity',SEVERITIES]] as const)expect(schema[key].enum).toEqual([...values]);
 });
 it('documents ACK semantics, backend identity responsibility, secret handling and no cookie dependency',()=>{
  const text=JSON.stringify(openApiDocument);expect(text).toContain('RETRYABLE');expect(text).toContain('SAME event ID');expect(text).toContain('verify its own authenticated actor');expect(text).toContain('No Jupiter cookie');expect(text).not.toContain('apiKey');
  const config=openApiDocument.components.schemas.AiConfiguration.properties as Record<string,unknown>;expect(config).not.toHaveProperty('credential');
  expect((openApiDocument.components.schemas.AiConfigurationInput.properties as Record<string,{writeOnly?:boolean}>).credential.writeOnly).toBe(true);
  expect((openApiDocument.components.schemas.ServerCredential.properties as Record<string,{writeOnly?:boolean}>).token.writeOnly).toBeUndefined();
 });
 it('advertises implemented management commands but never bootstrap or global role administration',()=>{
  expect(openApiDocument.info.description).toContain('documented ADMIN HTTP routes');expect(openApiDocument.info.description).toContain('bootstrap and global authority');expect(openApiDocument.info.description).not.toContain('global-grant/rotation');
  expect(Object.keys(openApiDocument.paths).some(path=>/bootstrap|global-grants|super-admin|transfer|self-monitor/.test(path))).toBe(false);
  const base='/operations/applications/{applicationId}';for(const[path,method]of [[`${base}/access-grants`,'get'],[`${base}/access-grants`,'post'],[`${base}/access-grants/{grantId}/revoke`,'post'],[`${base}/credentials`,'get'],[`${base}/credentials/{credentialId}/rotate`,'post'],[`${base}/credentials/{credentialId}/revoke`,'post'],['/operations/identity','get']])expect(openApiDocument.paths[path]).toHaveProperty(method);
  expect(openApiDocument.paths['/operations/applications/{applicationId}/issues/{issueId}']).toHaveProperty('get');expect(openApiDocument.paths['/operations/applications/{applicationId}/issues/{issueId}']).toHaveProperty('post');
 });
 it('preserves strict-positive rule bounds when validating OAS 3.0 with Ajv draft-7',()=>{
  const validate=new Ajv({strict:false}).compile(jsonSchema(openApiDocument.components.schemas.MonitoringRule) as object);
  const rule={code:'ERROR_BURST',enabled:true,threshold:1,minimum_samples:1,window_seconds:60,cooldown_seconds:60};expect(validate(rule)).toBe(true);for(const threshold of [0,-1])expect(validate({...rule,threshold})).toBe(false);
 });
});
