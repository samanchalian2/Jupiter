-- GOAL-054: bounded Full reconciliation batches; absence is evaluated only after every batch is present.
CREATE TABLE directory_full_reconciliations (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL,
  expected_batch_count integer NOT NULL CHECK(expected_batch_count > 0),
  received_batch_count integer NOT NULL DEFAULT 0 CHECK(received_batch_count >= 0),
  scope_policy_version integer NOT NULL,
  mapping_version integer NOT NULL,
  status text NOT NULL DEFAULT 'COLLECTING' CHECK(status IN ('COLLECTING','COMPLETED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(organization_id,id),
  FOREIGN KEY(organization_id,connector_id) REFERENCES directory_connectors(organization_id,id) ON DELETE CASCADE
);
CREATE TABLE directory_full_reconciliation_batches (
  reconciliation_id uuid NOT NULL REFERENCES directory_full_reconciliations(id) ON DELETE CASCADE,
  batch_index integer NOT NULL CHECK(batch_index >= 0),
  external_object_ids jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(reconciliation_id,batch_index)
);
CREATE INDEX directory_full_reconciliations_lookup ON directory_full_reconciliations(organization_id,connector_id,status,created_at DESC);
ALTER TABLE directory_full_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_full_reconciliation_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY directory_full_reconciliations_tenant ON directory_full_reconciliations USING(organization_id=app.current_organization_id()) WITH CHECK(organization_id=app.current_organization_id());
CREATE POLICY directory_full_reconciliation_batches_tenant ON directory_full_reconciliation_batches USING(reconciliation_id IN (SELECT id FROM directory_full_reconciliations WHERE organization_id=app.current_organization_id())) WITH CHECK(reconciliation_id IN (SELECT id FROM directory_full_reconciliations WHERE organization_id=app.current_organization_id()));
GRANT SELECT,INSERT,UPDATE,DELETE ON directory_full_reconciliations,directory_full_reconciliation_batches TO jupiter_app;
