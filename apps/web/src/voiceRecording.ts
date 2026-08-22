import { maximumRecordingSeconds, scheduleRecordingAutoStop } from './ticketIntake';

export type VoiceCapture = { blob:Blob; durationSeconds:number; contentType:string };
type DecodedAudio = Pick<AudioBuffer,'numberOfChannels'|'length'|'sampleRate'|'duration'|'getChannelData'>;
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
  prepareCapture?:(blob:Blob,durationSeconds:number,contentType:string)=>Promise<VoiceCapture>;
  now?:()=>number;
};
export type VoiceRecordingHandle = { stop():void; destroy():void };

const mimeTypes=['audio/webm','audio/ogg','audio/mp4'];

/**
 * GapGPT's OpenAI-compatible transcription endpoint accepts WAV reliably but
 * rejects Chrome's default WebM/Opus recording. Keep the recording local until
 * it has been converted to a compact, mono PCM WAV upload.
 */
export function encodeWav(audio:DecodedAudio,targetSampleRate=16_000):Blob {
  const frames=Math.max(1,Math.round(audio.duration*targetSampleRate));
  const output=new Int16Array(frames);
  for(let target=0;target<frames;target++) {
    const sourceStart=Math.floor(target*audio.sampleRate/targetSampleRate);
    const sourceEnd=Math.max(sourceStart+1,Math.floor((target+1)*audio.sampleRate/targetSampleRate));
    let total=0;let samples=0;
    for(let channel=0;channel<audio.numberOfChannels;channel++) {
      const values=audio.getChannelData(channel);
      for(let source=sourceStart;source<Math.min(sourceEnd,audio.length);source++) { total+=values[source]??0;samples++; }
    }
    output[target]=Math.round(Math.max(-1,Math.min(1,samples?total/samples:0))*0x7fff);
  }
  const buffer=new ArrayBuffer(44+output.byteLength);const view=new DataView(buffer);
  const write=(offset:number,value:string)=>[...value].forEach((character,index)=>view.setUint8(offset+index,character.charCodeAt(0)));
  write(0,'RIFF');view.setUint32(4,36+output.byteLength,true);write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,targetSampleRate,true);view.setUint32(28,targetSampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,output.byteLength,true);
  output.forEach((sample,index)=>view.setInt16(44+index*2,sample,true));
  return new Blob([buffer],{type:'audio/wav'});
}

async function prepareVoiceCapture(blob:Blob,durationSeconds:number):Promise<VoiceCapture> {
  const Context=globalThis.AudioContext;
  if (!Context) throw new Error('voice_conversion_unsupported');
  const context=new Context();
  try {
    const decoded=await context.decodeAudioData(await blob.arrayBuffer());
    const wav=encodeWav(decoded);
    return {blob:wav,durationSeconds:Math.min(maximumRecordingSeconds,Math.max(.1,decoded.duration)),contentType:'audio/wav'};
  } finally { await context.close(); }
}

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
  recorder.onstop=()=>{release();if(discarded)return;const durationSeconds=Math.min(maximumRecordingSeconds,Math.max(.1,(now()-startedAt)/1000));const original=new Blob(chunks,{type:contentType});
    void (options.prepareCapture??prepareVoiceCapture)(original,durationSeconds,contentType).then(options.onReady).catch(()=>options.onError(new Error('voice_conversion_failed')));
  };
  recorder.onerror=()=>{release();options.onError(new Error('recording_failed'));};
  const stop=()=>{if(recorder.state==='recording')recorder.stop();};
  recorder.start(250);options.onTick(0);
  interval=globalThis.setInterval(()=>options.onTick(Math.min(maximumRecordingSeconds,(now()-startedAt)/1000)),250);
  deadline=scheduleRecordingAutoStop(stop);
  return {stop,destroy(){discarded=true;stop();release();}};
}
