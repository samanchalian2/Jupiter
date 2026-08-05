# Security and Privacy

Primary threats: cross-tenant IDOR, privilege escalation, session theft, XSS/
CSRF, malicious files, secret leakage, AI data disclosure, prompt injection,
and rate abuse. Controls: backend policy checks, tenant context, composite
constraints/RLS, short access tokens with rotating hashed refresh tokens,
CSP/sanitization/CSRF checks, allowlisted validated uploads and short-lived
signed URLs, rate limiting, encrypted secrets, redaction/minimal AI context,
and structured logs with retention policies.

Audit all authentication-sensitive, permission, assignment, state, and AI
setting operations. Never place raw secrets or sensitive content in general
logs. Future RAG must treat retrieved content as untrusted data.
