import { describe, expect, it, vi } from 'vitest';
import { beginVoiceRecording, type RecorderLike, type VoiceCapture } from './voiceRecording';

class FakeRecorder implements RecorderLike {
  state='inactive';mimeType='audio/webm';ondataavailable:((event:{data:Blob})=>void)|null=null;onstop:(()=>void)|null=null;onerror:(()=>void)|null=null;
  start(){this.state='recording';}
  stop(){this.ondataavailable?.({data:new Blob(['voice'])});this.state='inactive';this.onstop?.();}
}

describe('voice recording controller',()=>{
  it('auto-stops at one minute and produces a playable voice blob',async()=>{
    vi.useFakeTimers();let time=0;let capture:VoiceCapture|undefined;const stopTrack=vi.fn();
    await beginVoiceRecording({onTick:()=>undefined,onReady:value=>{capture=value;},onError:()=>undefined,getUserMedia:async()=>({getTracks:()=>[{stop:stopTrack}]}),isTypeSupported:type=>type==='audio/webm',createRecorder:()=>new FakeRecorder(),now:()=>time});
    time=60_000;await vi.advanceTimersByTimeAsync(60_000);
    expect(capture).toMatchObject({durationSeconds:60,contentType:'audio/webm'});expect(capture?.blob.size).toBeGreaterThan(0);expect(stopTrack).toHaveBeenCalled();vi.useRealTimers();
  });

  it('surfaces microphone permission denial without starting a recorder',async()=>{
    await expect(beginVoiceRecording({onTick:()=>undefined,onReady:()=>undefined,onError:()=>undefined,isTypeSupported:()=>true,getUserMedia:async()=>{throw new DOMException('denied','NotAllowedError');}})).rejects.toMatchObject({name:'NotAllowedError'});
  });
});
