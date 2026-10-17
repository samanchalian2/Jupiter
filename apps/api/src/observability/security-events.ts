/** Trusted, in-process security notifications. Business auth remains independent
 * of the optional Hub and never waits for a failed telemetry dependency. */
type Listener=(userId:string)=>Promise<void>;
const listeners=new Set<Listener>();
export function observeSessionRevocation(listener:Listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function notifySessionRevocation(userId:string){for(const listener of listeners)void listener(userId).catch(()=>undefined);}
