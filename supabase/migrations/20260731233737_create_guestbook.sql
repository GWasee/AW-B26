/*
# Create birthday_guestbook table (single-tenant, no auth)

1. New Tables
- `birthday_guestbook`
  - `id` (uuid, primary key)
  - `name` (text, not null) — who left the wish
  - `message` (text, not null) — the birthday message
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `birthday_guestbook`.
- Allow anon + authenticated CRUD because the guestbook is intentionally public/shared
  (no sign-in screen; everyone sees and adds to the same wall of wishes).
*/

CREATE TABLE IF NOT EXISTS birthday_guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE birthday_guestbook ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_guestbook" ON birthday_guestbook;
CREATE POLICY "anon_select_guestbook" ON birthday_guestbook FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_guestbook" ON birthday_guestbook;
CREATE POLICY "anon_insert_guestbook" ON birthday_guestbook FOR INSERT
  TO anon, authenticated WITH CHECK (true);
