import { describe, expect, it } from 'vitest';
import { ObservabilityErrorBoundary } from '../src/index.js';
import type { BrowserSdk } from '@observability/browser-sdk';
describe('generic React capture boundary',()=>{
  it('records safe diagnostics without React component stack or props',()=>{const events:unknown[]=[];const boundary=new ObservabilityErrorBoundary({sdk:{capture:async(e:unknown)=>{events.push(e);return 'event';}} as unknown as BrowserSdk,children:null,fallback:'fallback',componentName:'TicketComposer'});boundary.componentDidCatch(new Error('password=unit-placeholder'),{componentStack:'secret raw component values'});expect(events).toHaveLength(1);expect(JSON.stringify(events)).not.toContain('unit-placeholder');expect(JSON.stringify(events)).not.toContain('secret raw component values');expect(events[0]).toMatchObject({eventCode:'react.render_failed',safeMetadata:{component:'TicketComposer'}});});
  it('renders the supplied accessible consumer fallback on failure',()=>{const boundary=new ObservabilityErrorBoundary({sdk:{} as BrowserSdk,children:'normal',fallback:'safe fallback'});expect(boundary.render()).toBe('normal');boundary.state={failed:true};expect(boundary.render()).toBe('safe fallback');});
  it('keeps its consumer fallback when diagnostic capture throws',()=>{
    const boundary=new ObservabilityErrorBoundary({sdk:{capture(){throw Error('Synthetic diagnostic failure');}} as unknown as BrowserSdk,children:null,fallback:'safe fallback'});
    boundary.state={failed:true};expect(()=>boundary.componentDidCatch(Error('Synthetic render failure'),{componentStack:''})).not.toThrow();expect(boundary.render()).toBe('safe fallback');
  });
  it('contains asynchronous capture rejection without unhandled diagnostics',async()=>{
    const boundary=new ObservabilityErrorBoundary({sdk:{capture:()=>Promise.reject(Error('Synthetic asynchronous failure'))} as unknown as BrowserSdk,children:null,fallback:'safe fallback'});
    boundary.componentDidCatch(Error('Synthetic render failure'),{componentStack:''});await new Promise(resolve=>setTimeout(resolve,10));
  });
  it('does not wait for a stalled capture to retain the fallback',()=>{
    const boundary=new ObservabilityErrorBoundary({sdk:{capture:()=>new Promise(()=>undefined)} as unknown as BrowserSdk,children:null,fallback:'safe fallback'});
    boundary.state={failed:true};boundary.componentDidCatch(Error('Synthetic render failure'),{componentStack:''});expect(boundary.render()).toBe('safe fallback');
  });
});
