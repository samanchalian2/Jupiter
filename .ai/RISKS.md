# Risks

| Risk | Mitigation |
| --- | --- |
| Tenant data leak | Policy checks, composite constraints, RLS, security tests |
| Provider failure/cost | Async jobs, bounded retries, fallback, usage metrics |
| Malicious upload | Validation, quarantine path, signed URLs, quotas |
| Missing local toolchain | Install/enable Node LTS and Docker before Foundation validation |
| Scope creep | One Goal per execution and documented non-scope |
