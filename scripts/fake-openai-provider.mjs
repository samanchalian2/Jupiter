import { createServer } from 'node:http';

const port = Number(process.env.JUPITER_FAKE_AI_PORT ?? 4010);
const json = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
};

createServer((request, response) => {
  if (request.method !== 'POST') return json(response, 404, { error: { code: 'not_found' } });
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    if (request.url === '/v1/audio/transcriptions') return json(response, 200, { text: 'چاپگر واحد اداری روشن نمی‌شود و نیاز به بررسی دارد.', language: 'fa' });
    if (request.url !== '/v1/chat/completions') return json(response, 404, { error: { code: 'not_found' } });
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const context = JSON.parse(body.messages?.find((message) => message.role === 'user')?.content ?? '{}');
      const first = (items) => Array.isArray(items) && items.length ? items[0].id : null;
      const categoryId = first(context.categories);
      const subcategory = Array.isArray(context.subcategories) ? context.subcategories.find((item) => !categoryId || item.categoryId === categoryId) : null;
      const confidenceByField = ['title','priority','categoryId','subcategoryId','departmentId','locationId','disciplineId'].map((field) => ({ field, confidence: field === 'locationId' ? 0.42 : 0.94 }));
      const output = {
        contractVersion: 'ticket-intake.v1', title: 'بررسی مشکل چاپگر واحد اداری', priority: 'HIGH', categoryId,
        subcategoryId: subcategory?.id ?? null, departmentId: first(context.departments), locationId: first(context.locations) ?? 'invalid-low-confidence-location',
        disciplineId: first(context.disciplines), customFields: [], missingFields: [], confidenceByField,
      };
      return json(response, 200, { choices: [{ message: { content: JSON.stringify(output) } }], usage: { prompt_tokens: 80, completion_tokens: 30 } });
    } catch { return json(response, 400, { error: { code: 'invalid_request' } }); }
  });
}).listen(port, '127.0.0.1', () => console.log(`Jupiter fake OpenAI-compatible provider listening on 127.0.0.1:${port}`));
