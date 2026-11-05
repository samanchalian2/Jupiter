# Admin/settings action spacing

Scope audit: Platform/org admin, settings account/Wizard/dialog; action wrappers
inline-actions,member-actions,table-actions,button-row,dialog-actions,appearance-
preview-row. Legacy adjacent buttons/semantic links get logical start8px/block4px
fallback; semantic groups use flex-wrap gap8px/margin0 to avoid double spacing.
No palette/font/control padding/height/touch-target changes. Existing table inner
scroll retained. No API/tenant/auth/business mutation.

Static CSS regression + full Web72 pass; Web typecheck and production build pass.
Main static release backed up /srv/jupiter/backups/admin-spacing-before-20261105.tar.gz.
First upload raced pending build and contained previous static assets; corrected
only AFTER terminal build success with fresh archive. Final public CSS200 and
local/serverSHA2562aa0fc71e377b753dbaceb2d9362562959cc98fa3961f4e1d178dac41f03965b
(index-CPoGCcb_.css); JS index-Cpyog9zZ.js. Old assets retained. No service restart,
DB/Arandi change, GitHub push or self-service product implementation included.
Live all-screen/responsive Browser geometry audit not completed; do not describe
source rules/tests as proof every possible action group was visually exercised.
