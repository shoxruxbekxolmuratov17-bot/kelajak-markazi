-- Region scoping for viloyat (superadmin)
ALTER TABLE districts ADD COLUMN IF NOT EXISTS region_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS region_id TEXT;
