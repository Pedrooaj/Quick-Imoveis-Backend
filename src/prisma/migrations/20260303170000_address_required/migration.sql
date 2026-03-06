-- Garante que todas as properties tenham um address (para schema com address obrigatório)
INSERT INTO "addresses" ("id", "property_id")
SELECT gen_random_uuid()::text, p."id"
FROM "properties" p
WHERE NOT EXISTS (
  SELECT 1 FROM "addresses" a WHERE a."property_id" = p."id"
);
