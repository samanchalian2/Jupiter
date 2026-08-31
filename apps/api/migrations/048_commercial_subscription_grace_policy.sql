-- Supports installations that applied 047 before the configurable grace policy was added.
ALTER TABLE organization_commercial_agreements ADD COLUMN IF NOT EXISTS grace_days integer NOT NULL DEFAULT 7 CHECK(grace_days BETWEEN 0 AND 90);
