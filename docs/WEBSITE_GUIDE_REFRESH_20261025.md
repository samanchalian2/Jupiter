# Jupiter website guide and PDF refresh — 2026-10-25

## Request and actual outcome

Owner requested correction of the public Arandi Jupiter guide AND its PDF after
the GOAL-069 release. Both were published together, without changing Jupiter
runtime logic, any database schema/data, roles, secrets or unrelated site pages.

- Web: https://arandi.io/knowledge/jupiter-guide?lang=fa
- PDF: https://arandi.io/guides/jupiter-comprehensive-user-guide-fa.pdf
- Same verified local PDF: `output/pdf/jupiter-comprehensive-user-guide-fa.pdf`.
- Published PDF: 27 pages, 961740 bytes, SHA-256
  `e95fd53c38ff4ddfac394a8c96a5661b4ba559a11bec542e5d6c48c70f95e4b5`.
- Exact final Linux runtime archive SHA-256:
  `67a65a4edd07c6f54c7d8c8bf216937df37107d319a303f572d570d56411c682`.

## Coverage and editorial corrections

1. Removed obsolete claims that personal tickets require organization membership.
   Independent path now teaches registration/email verification/personal context,
   six-step first ticket, conversation/follow-up, human support scope/capacity,
   optional AI, packages/conditional payment, privacy and later memberships.
2. Corrected the independent-user selection card, call to action and journey;
   corrected the FAQ and corresponding rendered FAQPage structured data.
3. Preserved the original full organization setup and user instructions, while
   correcting the entry action to `ساخت حساب کاربری` and the ten-character
   password requirement. Added personal audience introduction and troubleshooting.
4. Added software problem/suggestion reporting, report types, safe description,
   server tracking ID and public replies in `گزارش‌های من`; distinguished it from
   a service ticket/Assist and customer Smart Action consumption.
5. Explained pending-on-device vs server confirmation, limited queue, memory-only
   loss risk, session/identity dependence and absence of a whole-app offline/PWA
   promise. No guarantee of saving merely typed text was introduced.
6. Added a progressively disclosed authorized-operator monitoring chapter:
   App/environment/scope and filters, Event/Issue/Incident, observed-vs-lifetime
   impact, warnings, feedback/public-vs-internal replies, hypotheses/human review,
   separate AI budget, retention/queue/health and external-monitoring limitations.
7. No commercial quota/price/model/key was exposed or promised publicly. Existing
   product theme/CSS unchanged. Numeric steps rendered as actual ordered lists.
8. Replaced stale `15-page` footer with a durable updated-PDF label. One source
   feeds all PDF chapters; the PDF is not a print of one selected web tab.

## Safe build and publication

Recovered actual production source/dependencies, not the unrelated stale local
WordPress checkout. Two source files plus PDF are retained as the scoped overlay
in `deploy/arandi-guide/`; source/mirror is in Jupiter Git for continuity, not
transferred to another chat or a ChatGPT cloud task.

Build ran in a separate preview-host directory, not either live working tree,
under bounded CPU/memory/Nice settings. No install/dependency update or build was
performed on the disk/memory-limited main host. Production dependencies remained
the existing locked versions. No build used a working customer database URL.

Initial webpack build failed on existing Node-only imports in the site's client
dependency graph. No authentication/module patch was introduced: rebuilding with
the site's existing default Next16.2.12 Turbopack succeeded. A direct TypeScript
check and Next's final TypeScript phase passed. Existing website suite:54 passed,
zero failed/skipped. Added Jupiter guide content regression checks pass.

The isolated preview UI smoke failed because the existing preview Arandi
environment rejects its database login; that unrelated credential/configuration
was NOT changed. The main-host candidate was then served on loopback13245 with
the existing valid main environment, accessed via local SSH forwarding and
read-only UI checks before activation. An initial isolated launch inherited
PORT3000 from EnvironmentFile and safely failed EADDRINUSE; existing listeners
were not stopped. Explicit subprocess PORT13245 resolved test-service isolation.

Main release switched atomically from
`/srv/arandi-platform/releases/20261012T-articles-guides-hub-r2/.next/standalone`
to `/srv/arandi-platform/releases/20261025T-jupiter-guide-goal069-final`.
Only the authorized Arandi website process was restarted for its new bundle;
Jupiter API/worker were not restarted. Protected before-guide/PDF archive and
the entire previous release were retained. Activation included candidate checks,
bounded readiness, public Web/PDF checksum checks and automatic pointer rollback
on failure; no rollback was needed. Existing environment and Nginx unchanged.

## Verification against the published outputs

- Public Web200 and PDF200; downloaded PDF hash exactly matches the reviewed
  local artifact. Old negative personal-ticket statements, stale journey and
  hard-coded15-page label absent; all new coverage markers present.
- Browser on the REAL public page at375/768/1024/1440: RTL and no document-level
  horizontal overflow. Tested personal tab/six ordered steps, mobile TOC and
  heading navigation, organization-user report/offline sections, monitoring
  disclosure and correct independent-user FAQ. Temporary viewport reset.
- Public entry fallback links to canonical `https://jupiter.arandi.io/` when
  optional CMS app link is empty, without changing that setting/data.
- PDF regenerated from final source, all27 pages rendered with Poppler and
  inspected in a contact sheet; full-size personal and monitoring pages checked.
  All font resources embedded, no replacement glyphs, all pages nonempty;
  Persian shaping/RTL, line/page breaks and mixed Latin terms readable. Links
  and page numbering preserved. No form flattening or scanned-image substitution.
- Public Home, articles/guide context and existing main Jupiter readiness200;
  Arandi and both Jupiter services active after publication. No live tickets,
  payments, account registrations or feedback were created for this acceptance.
- `node scripts/test-website-guide.mjs` and `git diff --check` pass. The prior
  full Jupiter513-test gate is unchanged; this content-only task does not claim
  rerunning Jupiter's application suite against production.
- Screenshots retained in ignored output: `guide-live-mobile.png` and
  `guide-live-desktop.png`; no private customer content.

## Cleanup, limitations and rollback

Stopped the release-owned candidate/test services and local SSH forwarders.
Removed ONLY named temporary transfer archives generated by this task (main
approximately390MiB, preview249MiB); these are reproducible from retained local
artifacts/build input and source. No backup, customer data, old release, live
directory or unrelated service was removed. Main free disk readback~2.7GiB/93%
used: capacity remains a separate operational concern.

Rollback: atomically point Arandi current to the exact retained previous path,
restart ONLY arandi-platform, verify readiness/home/guide. There is no database
migration or data rollback to perform. No new product Goal, ChatGPT cloud task
or cross-chat message was created. User-owned Jupiter gateway/training-prompt
changes and legacy AGENTS draft remain untouched.
