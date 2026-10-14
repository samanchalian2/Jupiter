import type { FeedbackSubmission, TelemetryEvent } from '@observability/contracts';
export interface OfflineEnvelope {
  id:string;
  partition:string;
  kind:'EVENT'|'FEEDBACK';
  payload:TelemetryEvent|FeedbackSubmission;
  createdAt:number;
  expiresAt:number;
  attempts:number;
  nextRetryAt:number;
}
export interface QueueStorage {
  list():Promise<OfflineEnvelope[]>;
  put(envelope:OfflineEnvelope):Promise<void>;
  remove(ids:string[]):Promise<void>;
  close():void;
}
export class MemoryQueue implements QueueStorage {
  private readonly entries=new Map<string,OfflineEnvelope>();
  async list(){return [...this.entries.values()].map(value=>structuredClone(value));}
  async put(envelope:OfflineEnvelope){this.entries.set(envelope.id,structuredClone(envelope));}
  async remove(ids:string[]){for(const id of ids)this.entries.delete(id);}
  close(){}
}
export class IndexedDbQueue implements QueueStorage {
  private database?:IDBDatabase;
  constructor(private readonly name='observability-hub-v1',private readonly factory:IDBFactory=indexedDB){}
  private async open():Promise<IDBDatabase>{
    if(this.database)return this.database;
    return new Promise((resolve,reject)=>{
      const request=this.factory.open(this.name,1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('envelopes'))request.result.createObjectStore('envelopes',{keyPath:'id'});};
      request.onerror=()=>reject(new Error('OFFLINE_STORAGE_UNAVAILABLE'));
      request.onblocked=()=>reject(new Error('OFFLINE_STORAGE_BLOCKED'));
      request.onsuccess=()=>{this.database=request.result;this.database.onversionchange=()=>this.close();resolve(this.database);};
    });
  }
  private async execute<T>(mode:IDBTransactionMode,work:(store:IDBObjectStore)=>IDBRequest<T>|void):Promise<T>{
    const database=await this.open();
    return new Promise((resolve,reject)=>{
      const transaction=database.transaction('envelopes',mode);
      let value:T;const request=work(transaction.objectStore('envelopes'));
      if(request)request.onsuccess=()=>{value=request.result;};
      transaction.oncomplete=()=>resolve(value);
      transaction.onerror=()=>reject(new Error('OFFLINE_STORAGE_FAILED'));
      transaction.onabort=()=>reject(new Error('OFFLINE_STORAGE_FAILED'));
    });
  }
  async list(){return this.execute<OfflineEnvelope[]>('readonly',store=>store.getAll());}
  async put(envelope:OfflineEnvelope){await this.execute('readwrite',store=>store.put(structuredClone(envelope)));}
  async remove(ids:string[]){if(!ids.length)return;await this.execute('readwrite',store=>{for(const id of ids)store.delete(id);});}
  close(){this.database?.close();this.database=undefined;}
}
