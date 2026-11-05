import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {UsernameWarning,memberCreatedMessage} from './UsernameWarning';
it('warns for absent or whitespace usernames and explains email-only login',()=>{
  for(const username of ['', '   ']){
    const html=renderToStaticMarkup(<UsernameWarning username={username}/>);
    expect(html).toContain('role="status"');expect(html).toContain('ورود فقط با ایمیل');expect(html).toContain('نام نمایشی');
  }
});
it('clears warning when a username is provided',()=>expect(renderToStaticMarkup(<UsernameWarning username="sahra"/>)).toBe(''));
it('success notices identify the actual login identifier',()=>{
  expect(memberCreatedMessage('','person@example.test')).toContain('نام ورود: person@example.test');
  expect(memberCreatedMessage('sahra','person@example.test')).toContain('نام ورود: sahra');
});
