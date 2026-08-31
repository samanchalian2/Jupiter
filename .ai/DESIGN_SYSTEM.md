# Jupiter Design System V2

## Purpose and principles

Jupiter is a Persian-first, RTL enterprise service-management product. The UI
must feel calm, precise, trustworthy and efficient for prolonged Help Desk
work. Hierarchy comes first from grouping, spacing, alignment and restrained
weight—not oversized type, decoration or color. Preserve a manual path for
every AI-assisted workflow and show AI provenance clearly.

Use the minimum visual weight needed to communicate an action or state. Avoid
marketing-style heroes, heavy gradients, glass effects, decorative icons,
unnecessary card nesting, large shadows and equally prominent CTAs.

## Brand and tokens

`#6d5587` is Jupiter's brand accent. It is reserved for primary actions,
selected navigation, focus and controlled emphasis; canvases and ordinary
surfaces remain neutral. The canonical tokens live in
`apps/web/src/design-system.css`.

| Group | Tokens |
| --- | --- |
| Surfaces | canvas, surface, surface-subtle, surface-raised |
| Borders | border, border-strong |
| Text | text-primary, text-secondary, text-tertiary, technical |
| Brand | brand, brand-hover, brand-soft, brand-border |
| Semantics | success, warning, danger, info |
| Spacing | 4, 8, 12, 16, 20, 24, 32, 40 px |
| Radius | small 6px, medium 10px, large 14px |
| Elevation | none, subtle, elevated |

New code uses semantic `--color-*`, `--space-*`, `--font-*` and
`--radius-*` tokens. Legacy aliases remain only while existing page CSS is
migrated. Supported density hooks are `comfortable`, `standard` (default) and
`compact`; they may affect control and table-row height, never semantic colors
or unreasonable type sizes.

## Typography and layout

Use the deployable Shabnam font first, followed by Vazirmatn and Persian-safe
system sans-serif fallbacks. Page titles are compact, section titles only
slightly stronger than body text, labels use medium weight, and ordinary button
text uses normal/medium weight. Technical identifiers, emails, URLs and code
use `dir="ltr"` and the technical font token when helpful.

Use a narrow content container for forms/settings and a wide workspace
container for queues and data tables. Tables may use contained horizontal scroll
on small screens; document-level horizontal overflow is never acceptable.

## Reusable primitives

`ui.tsx` is the shared primitive entrypoint. It provides Button, IconButton,
Card, PageHeader, SectionHeader, EmptyState, Alert, LoadingState, StatusBadge,
TableShell, HelpTrigger and ConfirmDialog. New or redesigned screens should
prefer these over raw controls when the primitive fits.

- Button hierarchy: one primary action per local task; secondary for important
  alternatives; ghost for contextual actions; danger only for destructive work.
- Alerts distinguish server/action failure from inline form validation and can
  include a retry action.
- LoadingState is the shared non-blocking loading pattern; do not combine a
  persistent loading message with an error state.
- StatusBadge uses semantic tone plus readable text. Color is never the only
  state signal.
- EmptyState explains what is absent and gives the next permitted action.
- HelpTrigger is the single compact entrypoint for tooltip/short help/future
  documentation; do not scatter arbitrary question-mark icons.

GOAL-047 uses this trigger for AI ticket review, directory connection and
Jupiter Assist policy guidance. The Help Center is a two-column discovery/read
workspace on desktop and a single-column sequence on small screens; it uses
ordinary cards and text hierarchy rather than a new navigation pattern.

## Forms, tables and feedback

Labels sit with their controls, required/disabled/read-only state is explicit,
and help text is close to the affected field. Group long forms by task rather
than placing all controls in one card. Tables keep IDs and metadata visually
secondary, use a subtle row hover/focus state, keep actions contextual, and use
a menu when actions become numerous.

Use Persian, action-oriented feedback. Technical server details are not shown
by default. Retry is shown only when it is meaningful. Dialogs must have an
accessible name, Escape close, a visible initial focus target and focus return.

## Navigation, RTL and accessibility

The product shell remains sidebar + header on desktop and drawer + header on
mobile. Active navigation is clear but restrained. Organization Administration
will use an internal grouped navigation rather than a growing horizontal tab
strip. Platform context and organization context must be visibly distinct by
label/structure, not by a separate theme.

### Product shell decisions

- Desktop uses a 232px sidebar and a 56px header; the collapsed sidebar is
  64px wide. These are functional dimensions, not decorative whitespace.
- Navigation labels and buttons default to normal/medium weight. An active
  entry uses the brand soft surface, a subtle border and a narrow inline-start
  accent—not heavy bold text or a filled purple block.
- Collapsed desktop navigation preserves an accessible name and native tooltip
  for every icon-only route. Icons retain at least a 40px target.
- The header is a thin contextual bar, not a card or persistent banner. Search,
  notifications, organization context and account controls are compact,
  neutral controls and use the brand surface only for hover/open/focus.
- A member of one organization sees a non-interactive organization context;
  organization selection appears only when there is a genuine choice.
- The header label distinguishes organization and platform context without a
  separate theme. A Platform Admin's ordinary organization access continues to
  use the same shell.
- Mobile keeps the existing menu button and modal drawer. The drawer has no
  bottom navigation or decorative shortcuts; it focuses its first control when
  opened, closes with Escape or its backdrop, and returns focus to the menu
  trigger. Its rows retain a 44px touch target.

### Organization administration workspace

Organization Administration is a workspace, not a horizontally growing tab
strip. Desktop uses grouped vertical sub-navigation beside the selected
section. The groups reflect only delivered capability: users; services and
structure; operations; settings. Do not add placeholders for directory,
commercial AI, Jupiter Assist, billing, owner, help or other future product
areas.

Each delivered section has a stable `/admin/<section>` deep link and uses the
same workspace heading, navigation and feedback area. On mobile, replace the
vertical navigation with a single labelled grouped section selector; do not
introduce horizontal scrolling tabs or bottom navigation. Active entries use
the same restrained surface, border and inline accent as product navigation.

Target WCAG AA: keyboard operation, visible focus, semantic landmarks/labels,
dialog behavior, contrast, touch targets and non-color status cues. Test 375,
768, 1024 and 1440px after each affected screen migration. Chevrons, drawers,
tables, pagination and inline LTR values must read natively in RTL.

## Persian terminology

| Concept | Standard term |
| --- | --- |
| End-user work item | درخواست (requester view), تیکت (operational view) |
| Person with tenant access | عضو سازمان |
| End-user | درخواست‌کننده |
| Service agent | کارشناس |
| Queue lead | سرپرست |
| Tenant administrator | مدیر سازمان |
| SaaS administrator | مدیر پلتفرم |
| Service unit | واحد |
| Taxonomy | دسته‌بندی / زیردسته |
| State / urgency | وضعیت / اولویت |
| Service target | SLA |
| Reviewed articles | دانش‌نامه |
| Assisted analysis | هوش مصنوعی |

## Appearance governance and overrides

GOAL-045 provides data-driven, validated, auditable platform appearance
settings. They are restricted to approved brand presets with contrast review,
platform logo/default identity, density and radius presets. They never accept
arbitrary CSS or JavaScript, external logo URLs, or changes to semantic
success/warning/danger colors.

Override order is explicit: platform defaults → organization logo/approved
organization identity → page content. Organization branding cannot override
semantic tokens, security-sensitive UI or layout rules. Adding persisted
platform appearance settings requires an ADR and a separate Goal because it
changes API/data contracts.

## Do / don't

Do use neutral surfaces, compact headings, meaningful grouping, controlled
brand emphasis and reusable primitives. Don't add a new component library,
change the React/Vite stack, create arbitrary tenant themes, make AI look like
decoration, or alter ticket/AI/authorization behavior for visual convenience.
