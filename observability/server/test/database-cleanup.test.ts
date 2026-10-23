import {it,expect} from 'vitest';
import {waitForFixtureDisconnect} from './database-cleanup.js';
it('waits for observed backend disconnect instead of treating Pool.end as socket completion',async()=>{const counts=[2,1,0];let reads=0;await waitForFixtureDisconnect(async()=>{reads++;return counts.shift()!;},1000,1);expect(reads).toBe(3);});
it('fails a real connection leak and invalid observations instead of swallowing termination errors',async()=>{await expect(waitForFixtureDisconnect(async()=>1,5,1)).rejects.toThrow('still has open connections');await expect(waitForFixtureDisconnect(async()=>NaN)).rejects.toThrow('Invalid fixture');});
