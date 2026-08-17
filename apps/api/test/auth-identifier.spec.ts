import { describe, expect, it } from 'vitest';
import { AuthService } from '../src/auth/auth.service.js';
import { hashPassword } from '../src/auth/password.js';

describe('Authentication identifiers', () => {
  it('uses one normalized lookup for username or email and includes organization names in the session', async () => {
    const calls: Array<{sql:string;values?:unknown[]}> = [];
    const database = { query: async (sql:string, values?:unknown[]) => {
      calls.push({sql,values});
      if (sql.startsWith('SELECT id,email,display_name,password_hash')) return { rows:[{id:'user',email:'person@example.test',display_name:'Person',password_hash:await hashPassword('a-safe-password'),is_platform_admin:false}] };
      if (sql.includes('FROM memberships m JOIN organizations')) return { rows:[{organization_id:'org',organization_name:'سازمان نمونه',role_codes:['REQUESTER']}] };
      if (sql.startsWith('INSERT INTO refresh_sessions')) return { rows:[{id:'refresh'}] };
      return { rows:[] };
    } };
    const service = new AuthService(database as never, { signAsync: async ()=>'token' } as never);
    const result = await service.login('  PERSON  ', 'a-safe-password');
    expect(calls[0].values).toEqual(['person']);
    expect(result.user.memberships[0]).toMatchObject({organization_name:'سازمان نمونه'});
  });

  it('does not make an unknown identifier distinguishable from a bad password', async () => {
    const database = { query: async () => ({ rows:[] }) };
    const service = new AuthService(database as never, {} as never);
    await expect(service.login('missing', 'anything')).rejects.toMatchObject({message:'Invalid credentials'});
  });
});
