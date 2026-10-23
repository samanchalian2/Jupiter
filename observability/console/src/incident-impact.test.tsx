import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {IncidentImpact} from './IncidentImpact.js';
describe('observed Incident impact, not inferred downtime',()=>{
 it('preserves legacy missing fields as unknown and distinguishes valid zero',()=>{const html=renderToStaticMarkup(<IncidentImpact impact={{occurrences:4,affectedUsers:0,windowSeconds:60}}/>);expect(html).toContain('<dd>0</dd>');expect(html.match(/<dd>—<\/dd>/g)).toHaveLength(7);expect(html).toContain('مدت قطعی سرویس');expect(html).not.toContain('Invalid Date');});
 it('renders explicit UTC observations and escaped bounded feature codes',()=>{const html=renderToStaticMarkup(<IncidentImpact impact={{observedFirstAt:'2026-10-23T10:00:00Z',observedLastAt:'invalid',observedDurationMs:0,affectedFeatures:['<script>safe</script>',...Array.from({length:24},(_,i)=>`feature-${i}`)]}}/>);expect(html).toMatch(/datetime="2026-10-23T10:00:00.000Z"/i);expect(html).not.toMatch(/datetime="invalid"/i);expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');expect(html.match(/<li>/g)).toHaveLength(20);expect(html).not.toContain('feature-19');});
});
