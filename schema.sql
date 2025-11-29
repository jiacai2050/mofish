CREATE TABLE IF NOT EXISTS hn_links (
  id integer PRIMARY KEY AUTOINCREMENT,
  post_date integer UNIQUE,
  github string,
  telegraph string,
  telegraph_v2ex string
);


-- https://github.com/HackerNews/API#items
CREATE TABLE if NOT EXISTS hn_posts (
  auto_id integer PRIMARY KEY AUTOINCREMENT,
  id integer UNIQUE,  -- hn post id
  time integer,
  type string,
  descendants integer,
  title string,
  score integer,
  url string,
  by string,
  text string, -- The comment, story or poll text. HTML.
  summary string
);
