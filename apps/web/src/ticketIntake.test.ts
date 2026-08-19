import { describe, expect, it, vi } from 'vitest';
import { applyIntakeSuggestions, blocksManualSubmit, intakeFailureMessage, maximumRecordingSeconds, microphoneErrorMessage, pollIntake, scheduleRecordingAutoStop, type IntakeSession, type TicketFormState } from './ticketIntake';

const form: TicketFormState = { title:'عنوان دستی',description:'شرح اصلی',priority:'NORMAL',departmentId:'',categoryId:'',subcategoryId:'',locationId:'',disciplineId:'',customFields:{asset:'قدیمی'} };
const session = (status:IntakeSession['status']):IntakeSession => ({ id:'intake-1',status,description:'شرح اصلی',transcript:null,combinedDescription:null,suggestions:null,missingFields:[],confidenceByField:{},rejectedFields:[],voice:null,attemptCount:0,lastErrorCode:null,expiresAt:new Date().toISOString() });

describe('smart ticket intake helpers', () => {
  it('applies only server-accepted suggestions and keeps manual description', () => {
    const result=applyIntakeSuggestions(form,{...session('SUCCEEDED'),suggestions:{title:'عنوان پیشنهادی',priority:'HIGH',categoryId:'cat-1',customFields:{asset:'جدید'}},rejectedFields:['locationId']});
    expect(result.form).toMatchObject({title:'عنوان پیشنهادی',description:'شرح اصلی',priority:'HIGH',categoryId:'cat-1',locationId:'',customFields:{asset:'جدید'}});
    expect([...result.changedFields]).toEqual(['title','priority','categoryId','customFields.asset']);
  });

  it('appends a successful transcript without losing typed text', () => {
    const result=applyIntakeSuggestions(form,{...session('SUCCEEDED'),transcript:'متن صدا',combinedDescription:'شرح اصلی\n\nمتن پیاده‌سازی‌شده صدا:\nمتن صدا'});
    expect(result.form.description).toContain('شرح اصلی');
    expect(result.form.description).toContain('متن صدا');
    expect(result.changedFields.has('description')).toBe(true);
  });

  it('polls through processing states to success', async () => {
    vi.useFakeTimers();
    const states=[session('TRANSCRIBING'),session('ANALYZING'),session('SUCCEEDED')];
    const promise=pollIntake(async()=>states.shift()!,{intervalMs:10});
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toMatchObject({status:'SUCCEEDED'});
    vi.useRealTimers();
  });

  it('returns actionable Persian fallback for missing configuration', () => {
    expect(intakeFailureMessage('ai_configuration_unavailable')).toContain('دستی');
  });

  it('stops recording automatically at exactly one minute', () => {
    vi.useFakeTimers();const stop=vi.fn();scheduleRecordingAutoStop(stop);
    vi.advanceTimersByTime(maximumRecordingSeconds*1000-1);expect(stop).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);expect(stop).toHaveBeenCalledOnce();vi.useRealTimers();
  });

  it('turns microphone denial into a manual-fallback message', () => {
    expect(microphoneErrorMessage(new DOMException('denied','NotAllowedError'))).toContain('دستی');
  });

  it('keeps text-only manual submission available while AI is processing', () => {
    expect(blocksManualSubmit(true,false,false)).toBe(false);
    expect(blocksManualSubmit(true,true,false)).toBe(true);
    expect(blocksManualSubmit(false,false,true)).toBe(true);
  });
});
