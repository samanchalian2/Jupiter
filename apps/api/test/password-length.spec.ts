import {expect,it} from 'vitest';
import {OrganizationApplicationService} from '../src/organization-applications/organization-application.service.js';
import {AuthService} from '../src/auth/auth.service.js';
it('accepts public account passwords from 8 through 200 characters, rejects 7 and 201',()=>{
  const service=new OrganizationApplicationService({} as never,{} as never) as unknown as {password:(p:string)=>string};
  for(const length of [8,9,10,200])expect(service.password('x'.repeat(length))).toHaveLength(length);
  for(const length of [0,7,201])expect(()=>service.password('x'.repeat(length))).toThrow();
});
it('first-login length gate accepts 8 and 9 before validating token, but rejects 7 and 201',async()=>{
  const service=new AuthService({} as never,{verifyAsync:async()=>{throw Error('synthetic invalid token');}} as never);
  for(const length of [8,9])await expect(service.completeFirstLogin('synthetic','x'.repeat(length))).rejects.toMatchObject({status:401});
  for(const length of [7,201])await expect(service.completeFirstLogin('synthetic','x'.repeat(length))).rejects.toMatchObject({status:400});
});
