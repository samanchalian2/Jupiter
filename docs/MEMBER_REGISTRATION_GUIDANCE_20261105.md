# Member/admin registration guidance

Required field guidance for display name (not login), valid email,8–200 temporary
password and at least one role. Optional username email-only warning retained.
Role explanations distinguish requester, expert, supervisor and organization
administrator. Admin selection warns scope is only this organization and does
not grant Owner/Platform authority. Pre-submit error list identifies corrections;
server failures also show beside form. API and authorization unchanged.

Four new validation/render tests and full Web71 pass. Typecheck/build checked in
handoff. LOCAL only; no existing users, passwords or roles changed. Existing
pending minimum8 backend rollout still required before Web release to main.

Final combined regression gate: API201 passed/2 optional skipped across47 files;
isolated migration85 and cleanup PASS. Web71 passed as previously recorded.
