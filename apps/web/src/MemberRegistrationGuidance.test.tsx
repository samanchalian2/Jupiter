import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemberRegistrationGuidance,memberRegistrationErrors} from './MemberRegistrationGuidance';
const valid={displayName:'عضو نمونه',email:'person@example.test',username:'',password:'12345678',roles:['REQUESTER']};
it('permits email-only login and 8-character password with a role',()=>expect(memberRegistrationErrors(valid)).toEqual([]));
it('explains all missing required settings and invalid username',()=>{
  const errors=memberRegistrationErrors({displayName:' ',email:'bad',username:'bad name',password:'1234567',roles:[]});
  expect(errors).toHaveLength(5);expect(errors.join(' ')).toContain('حداقل یک نقش');
});
it('explains admin scope without implying platform or owner authority',()=>{
  const html=renderToStaticMarkup(<MemberRegistrationGuidance roles={['ORG_ADMIN']}/>);
  expect(html).toContain('معادل مالک سازمان یا مدیر پلتفرم نیست');expect(html).toContain('role="status"');
});
it('warns when no role selected',()=>expect(renderToStaticMarkup(<MemberRegistrationGuidance roles={[]}/>)).toContain('هیچ نقشی انتخاب نشده'));
