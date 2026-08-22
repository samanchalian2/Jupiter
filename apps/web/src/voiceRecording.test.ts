import { describe, expect, it, vi } from 'vitest';
import { beginVoiceRecording, encodeWav, type RecorderLike, type VoiceCapture } from './voiceRecording';

class FakeRecorder implements RecorderLike {
  state='inactive';mimeType='audio/webm';ondataavailable:((event:{data:Blob})=>void)|null=null;onstop:(()=>void)|null=null;onerror:(()=>void)|null=null;
  start(){this.state='recording';}
  stop(){this.ondataavailable?.({data:new Blob(['voice'])});this.state='inactive';this.onstop?.();}
}

describe('voice recording controller',()=>{
  it('auto-stops at one minute and produces a playable voice blob',async()=>{
    vi.useFakeTimers();let time=0;let capture:VoiceCapture|undefined;const stopTrack=vi.fn();
    await beginVoiceRecording({onTick:()=>undefined,onReady:value=>{capture=value;},onError:()=>undefined,getUserMedia:async()=>({getTracks:()=>[{stop:stopTrack}]}),isTypeSupported:type=>type==='audio/webm',createRecorder:()=>new FakeRecorder(),prepareCapture:async(blob,durationSeconds,contentType)=>({blob,durationSeconds,contentType}),now:()=>time});
    time=60_000;await vi.advanceTimersByTimeAsync(60_000);
    expect(capture).toMatchObject({durationSeconds:60,contentType:'audio/webm'});expect(capture?.blob.size).toBeGreaterThan(0);expect(stopTrack).toHaveBeenCalled();vi.useRealTimers();
  });

  it('surfaces microphone permission denial without starting a recorder',async()=>{
    await expect(beginVoiceRecording({onTick:()=>undefined,onReady:()=>undefined,onError:()=>undefined,isTypeSupported:()=>true,getUserMedia:async()=>{throw new DOMException('denied','NotAllowedError');}})).rejects.toMatchObject({name:'NotAllowedError'});
  });

  it('encodes a compact mono PCM WAV payload for transcription',async()=>{
    const channel=new Float32Array([0,0.5,-0.5,1]);
    const wav=encodeWav({numberOfChannels:1,length:4,sampleRate:4,duration:1,getChannelData:()=>channel},4);
    const view=new DataView(await wav.arrayBuffer());
    expect(wav.type).toBe('audio/wav');expect(wav.size).toBe(52);
    expect(String.fromCharCode(...new Uint8Array(await wav.slice(0,4).arrayBuffer()))).toBe('RIFF');
    expect(view.getUint32(24,true)).toBe(4);expect(view.getInt16(46,true)).toBeGreaterThan(16_000);
  });
});
