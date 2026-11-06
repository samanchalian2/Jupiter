import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SupportTeamOptions, type Availability } from './AssistRouting';
const render=(value:Availability|null,error='')=>renderToStaticMarkup(<SupportTeamOptions value="ORGANIZATION" onChange={()=>{}} availability={{value,error,reload:()=>{}}}/>);
describe('Assist routing choice',()=>{
  it('keeps the Jupiter choice visible but disabled and explains organization denial',()=>{
    const html=render({enabled:false,available:false,direct:false,reason:'ORGANIZATION_DISABLED'});
    expect(html).toContain('تیم ژوپیتر');expect(html).toContain('disabled=""');expect(html).toContain('مدیر سازمان');expect(html).toContain('aria-describedby="assist-routing-description"');
    expect(html.match(/checked=""/g)).toHaveLength(1);expect(html.match(/disabled=""/g)).toHaveLength(1);
  });
  it('enables both choices when available and explains ticket-only sharing',()=>{
    const html=render({enabled:true,available:true,direct:true,reason:null});expect(html).not.toContain('disabled=""');expect(html).toContain('همین تیکت');
  });
  it('distinguishes loading failure from disabled service and leaves organization selection usable',()=>{
    const html=render(null,'وضعیت پشتیبانی دریافت نشد');expect(html).toContain('دریافت نشد');expect(html).toContain('تلاش مجدد');expect(html).not.toContain('مدیر سازمان این امکان را فعال نکرده');
  });
  it('explains capacity and commercial denials separately',()=>{
    expect(render({enabled:true,available:false,direct:true,reason:'CAPACITY_UNAVAILABLE'})).toContain('ظرفیت');
    expect(render({enabled:true,available:false,direct:true,reason:'SERVICE_UNAVAILABLE'})).toContain('سرویس');
  });
});
