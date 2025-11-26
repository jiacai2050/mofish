CREATE TABLE IF NOT EXISTS hn_links (
  id integer PRIMARY KEY AUTOINCREMENT,
  post_date integer UNIQUE,
  github string,
  telegraph string
);
