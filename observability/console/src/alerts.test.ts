import {describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {OperationsConsole} from './index.js';

describe('notification inbox entry',()=>{
 it('lets a host open the inbox directly without bypassing any client authentication',()=>{
  const client={request:vi.fn(async()=>new Response('[]'))};
  const inbox=renderToStaticMarkup(createElement(OperationsConsole,{client,initialSection:'alert-inbox'}));
  expect(inbox).toContain('aria-current="page">هشدارهای من');expect(inbox).toContain('صندوق هشدار عملیاتی');expect(inbox).not.toContain('اعمال فیلترها');
  const normal=renderToStaticMarkup(createElement(OperationsConsole,{client}));expect(normal).toContain('aria-current="page">نمای کلی');expect(client.request).not.toHaveBeenCalled();
 });
});
