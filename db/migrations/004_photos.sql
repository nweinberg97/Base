-- Photos of ingredients and add-ons. Every photo carries its author, licence and
-- source page, because the licences (CC BY, CC BY-SA) require attribution.
CREATE TABLE photos (
  id           INTEGER PRIMARY KEY,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  add_on_id    INTEGER REFERENCES add_ons(id) ON DELETE CASCADE,
  source_id    INTEGER NOT NULL REFERENCES sources(id),
  file         TEXT NOT NULL,                 -- path under public/, e.g. photos/kale.webp
  file_square  TEXT NOT NULL,
  width        INTEGER NOT NULL CHECK (width > 0),
  height       INTEGER NOT NULL CHECK (height > 0),
  alt          TEXT NOT NULL CHECK (length(trim(alt)) > 0),
  title        TEXT NOT NULL,
  author       TEXT NOT NULL CHECK (length(trim(author)) > 0),
  license      TEXT NOT NULL CHECK (license LIKE 'CC0%' OR license LIKE 'Public domain%' OR license LIKE 'CC BY %' OR license LIKE 'CC BY-SA %'),
  license_url  TEXT,
  source_url   TEXT NOT NULL CHECK (source_url LIKE 'https://%'),
  CHECK ((ingredient_id IS NULL) <> (add_on_id IS NULL)),
  UNIQUE (ingredient_id),
  UNIQUE (add_on_id)
);
