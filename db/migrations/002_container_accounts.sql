-- 002 — Container accounts (structural change after the initial schema).
--
-- Base has no customer accounts yet. This table holds a single demo account so the
-- prototype can show how a member's active containers and held deposit would be
-- tracked. When real accounts exist, member_ref becomes a foreign key to members.

CREATE TABLE container_accounts (
  id                INTEGER PRIMARY KEY,
  member_ref        TEXT NOT NULL UNIQUE,           -- 'demo-member' for the prototype
  is_demo           INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1)),
  next_pickup_date  TEXT
);

CREATE TABLE container_account_lines (
  account_id    INTEGER NOT NULL REFERENCES container_accounts(id) ON DELETE CASCADE,
  container_id  INTEGER NOT NULL REFERENCES containers(id),
  borrowed      INTEGER NOT NULL DEFAULT 0 CHECK (borrowed >= 0),   -- out with the member, deposit held
  returned      INTEGER NOT NULL DEFAULT 0 CHECK (returned >= 0),   -- brought back, deposit credited
  owned         INTEGER NOT NULL DEFAULT 0 CHECK (owned >= 0),      -- bought outright, no deposit
  PRIMARY KEY (account_id, container_id),
  CHECK (returned <= borrowed)
);
