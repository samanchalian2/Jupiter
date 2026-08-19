import { maximumRecordingSeconds, scheduleRecordingAutoStop } from './ticketIntake';

export type VoiceCapture = { blob:Blob; durationSeconds:number; contentType:string };
type StreamLike = { getTracks():Array<{stop():void}> };
export type RecorderLike = {
  state:string; mimeType:string; ondataavailable:((event:{data:Blob})=>void)|null; onstop:(()=>void)|null; onerror:(()=>void)|null;
  start(timeslice?:number):void; stop():void;
};
type RecordingOptions = {
  onTick:(seconds:number)=>void;
  onReady:(capture:VoiceCapture)=>void;
  onError:(error:Error)=>void;
  getUserMedia?:()=>Promise<StreamLike>;
  isTypeSupported?:(type:string)=>boolean;
  createRecorder?:(stream:StreamLike,mimeType:string)=>RecorderLike;
  now?:()=>number;
};
export type VoiceRecordingHandle = { stop():void; destroy():void };

const mimeTypes=['audio/webm','audio/ogg','audio/mp4'];

export async function beginVoiceRecording(options:RecordingOptions):Promise<VoiceRecordingHandle> {
  const getUserMedia=options.getUserMedia??(()=>navigator.mediaDevices.getUserMedia({audio:true}) as Promise<StreamLike>);
  const supports=options.isTypeSupported??((type)=>!MediaRecorder.isTypeSupported||MediaRecorder.isTypeSupported(type));
  const mimeType=mimeTypes.find(supports);
  if(!mimeType)throw new Error('unsupported_recorder');
  const stream=await getUserMedia();
  const recorder=options.createRecorder?.(stream,mimeType)??new MediaRecorder(stream as MediaStream,{mimeType}) as RecorderLike;
  const contentType=(recorder.mimeType||mimeType).split(';')[0];
  if(!mimeTypes.includes(contentType)){stream.getTracks().forEach(track=>track.stop());throw new Error('unsupported_recorder');}
  const now=options.now??(()=>performance.now());const startedAt=now();const chunks:BlobPart[]=[];let discarded=false;
  let interval:ReturnType<typeof setInterval>|undefined;let deadline:ReturnType<typeof setTimeout>|undefined;
  const release=()=>{if(interval)globalThis.clearInterval(interval);if(deadline)globalThis.clearTimeout(deadline);stream.getTracks().forEach(track=>track.stop());};
  recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
  recorder.onstop=()=>{release();if(discarded)return;const durationSeconds=Math.min(maximumRecordingSeconds,Math.max(.1,(now()-startedAt)/1000));options.onReady({blob:new Blob(chunks,{type:contentType}),durationSeconds,contentType});};
  recorder.onerror=()=>{release();options.onError(new Error('recording_failed'));};
  const stop=()=>{if(recorder.state==='recording')recorder.stop();};
  recorder.start(250);options.onTick(0);
  interval=globalThis.setInterval(()=>options.onTick(Math.min(maximumRecordingSeconds,(now()-startedAt)/1000)),250);
  deadline=scheduleRecordingAutoStop(stop);
  return {stop,destroy(){discarded=true;stop();release();}};
}
