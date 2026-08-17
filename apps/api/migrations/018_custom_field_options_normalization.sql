UPDATE ticket_custom_field_definitions SET options='[]'::jsonb WHERE jsonb_typeof(options) <> 'array';
