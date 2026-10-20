import {describe,it,expect} from 'vitest';
import {CommandContext} from './command-context.js';
describe('Console command completion ownership',()=>{
 it('keeps a pending command valid across unrelated rerenders of the same context',()=>{const context=new CommandContext(),client={},filters={};context.update([client,'app','env','rules',filters]);const current=context.begin();context.update([client,'app','env','rules',filters]);expect(current()).toBe(true);});
 it('invalidates previous commands on every scope dimension and does not resurrect on a round trip',()=>{for(const dimension of [0,1,2,3,4]){const context=new CommandContext(),initial=[{},'app','env','rules',{}];context.update(initial);const current=context.begin(),changed=[...initial];changed[dimension]={};context.update(changed);expect(current()).toBe(false);context.update(initial);expect(current()).toBe(false);}});
 it('does not let an older completion clear the newer command busy/error state',()=>{const context=new CommandContext();context.update(['app']);const older=context.begin(),newer=context.begin();expect(older()).toBe(false);expect(newer()).toBe(true);});
 it('invalidates on unmount without pretending to roll back server writes',()=>{const context=new CommandContext(),current=context.begin();context.invalidate();expect(current()).toBe(false);});
});
