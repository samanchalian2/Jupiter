# Missing username warning

Organization member create and edit fields render an inline status when the
username is empty or whitespace, explaining email-only login and distinction
from display name. Optionality unchanged; nonempty entry clears warning.
Create success notice includes the entered username or email. No password,
authentication, tenant isolation or API changes. Three render/message regressions
and full Web67 tests PASS. Typecheck/build checked in handoff. LOCAL only,
not yet released alongside pending minimum8 change. No runtime data changed.
