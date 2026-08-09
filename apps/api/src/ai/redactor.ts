export function redactForAi(text: string) { return text.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email redacted]').replace(/\b\d{10,16}\b/g, '[number redacted]'); }
