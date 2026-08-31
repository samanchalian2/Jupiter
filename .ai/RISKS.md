# Risks

| Risk | Mitigation |
| --- | --- |
| Tenant data leak | Policy checks, composite constraints, RLS, security tests |
| Provider failure/cost | Async jobs, bounded retries, fallback, usage metrics |
| Malicious upload | Validation, quarantine path, signed URLs, quotas |
| Missing local toolchain | Install/enable Node LTS and Docker before Foundation validation |
| Scope creep | One Goal per execution and documented non-scope |
| Legacy login regression | Additive identity migration, compatibility tests, staged deprecation |
| Public application abuse | Verification decision, rate limits, hashed short-lived tokens, audit |
| Directory connector compromise | Outbound-only service, no cloud AD credentials, pairing/device rotation and replay tests |
| Commercial bypass or double charge | Server capability resolver, immutable ledger, idempotent reserve/release/settle |
| Delegated support data leak | Scoped revocable grants, restricted-ticket override denial, audit |
| Help draft leakage | Audience authorization and published-runtime revision controls |
