# GOAL-045 — Platform commercial console and governed appearance

Date: 2026-08-31

- The Platform Admin commercial console manages Jupiter support-agent status,
  organization Assist request policy, access scope, capacity and Assist SLA;
  cases are visible for operations. Jupiter agents remain outside tenant
  memberships and all existing grant checks stay server-side.
- Migrations `044` and `044a` introduce one audited platform appearance record.
  It accepts only the `JUPITER`, `OCEAN` or `TEAL` brand presets, approved
  density/radius presets and an internal managed logo path. Arbitrary CSS,
  JavaScript and external logo URLs are rejected.
- Platform defaults apply first, an approved organization logo may then replace
  only the visual identity, and page content follows. Organizations cannot
  modify semantic status colors, density, radius or security-sensitive UI.
- Persian Help impact: the compact «ظاهر و هویت بصری» panel explains that
  settings are preset-only and that no organization-level theme is available;
  structured Product Help begins in GOAL-046.
- Root typechecks, 24 API test files / 73 tests, 2 Web test files / 11 tests,
  production builds, migration rehearsal and `git diff --check` pass. A fresh
  local preview rendered the Persian login surface without horizontal overflow
  at 375/768/1024/1440; authenticated visual acceptance of the Platform Admin
  panel requires the existing local administrator session.
