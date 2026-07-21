const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const moment = require('moment');
const { argv } = require('yargs');

const { POST_TABLE_NAME } = require('../actions/v2ex/common');

const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'v2ex');
const DATA_DIR = path.join(__dirname, '..', 'data', 'v2ex');
const DIST_DIR = path.join(__dirname, '..', 'dist', 'v2ex');
const SITE_URL = 'https://news.liujiacai.net/v2ex';

async function main() {
  if (!argv.day) {
    print_usage();
    return;
  }

  const posts = await fetch_posts(argv.day);
  write_site(posts);
}

function print_usage() {
  console.log(`Usage: node scripts/build-v2ex-site.js --day YYYYMMDD

Build the V2EX static site for one day.

Options:
  --day YYYYMMDD    Date to fetch from LeanCloud, also accepts YYYY-MM-DD

Examples:
  node scripts/build-v2ex-site.js --day 20260719
  node scripts/build-v2ex-site.js --day 2026-07-19`);
}

function write_site(posts) {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const indexTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'index.ejs'), 'utf-8');
  const dayTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'day.ejs'), 'utf-8');

  const dayMap = group_posts_by_day(posts);
  for (const [date, dayPosts] of dayMap.entries()) {
    write_day_posts(date, dayPosts);
  }

  const dates = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort((a, b) => a.localeCompare(b));
  for (const date of dates) {
    if (!dayMap.has(date)) {
      dayMap.set(date, JSON.parse(fs.readFileSync(path.join(DATA_DIR, date + '.json'), 'utf-8')));
    }
  }

  if (dates.length === 0) {
    console.log('No V2EX posts found');
    return;
  }

  const months = build_months(dates, dayMap);

  fs.copyFileSync(path.join(__dirname, '..', 'templates', 'style.css'), path.join(DIST_DIR, 'style.css'));
  fs.copyFileSync(path.join(__dirname, '..', 'templates', 'search.js'), path.join(DIST_DIR, 'search.js'));

  const indexHtml = ejs.render(indexTemplate, { months });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
  console.log('Generated v2ex index.html');

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const prev = i > 0 ? dates[i - 1] : null;
    const next = i < dates.length - 1 ? dates[i + 1] : null;
    const dayPosts = dayMap.get(date);
    const dayHtml = ejs.render(dayTemplate, {
      date,
      posts: dayPosts,
      prev,
      next,
    });
    const dayDir = path.join(DIST_DIR, date);
    if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });
    fs.writeFileSync(path.join(dayDir, 'index.html'), dayHtml);
  }

  const searchIndex = [];
  for (const date of dates) {
    const dayPosts = dayMap.get(date);
    dayPosts.forEach((post, idx) => {
      searchIndex.push({ t: post.title, d: date, i: idx });
    });
  }
  fs.writeFileSync(path.join(DIST_DIR, 'search-index.json'), JSON.stringify(searchIndex));
  console.log(`Generated v2ex search-index.json (${searchIndex.length} entries)`);

  const recentDates = dates.slice().reverse().slice(0, 60);
  const feedUpdated = recentDates.length > 0 ? recentDates[0] + 'T00:00:00Z' : new Date().toISOString();
  let feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>每日精选 V2EX 热帖</title>
  <link href="${SITE_URL}/feed.xml" rel="self"/>
  <link href="${SITE_URL}"/>
  <id>${SITE_URL}/</id>
  <updated>${feedUpdated}</updated>
`;

  for (const date of recentDates) {
    const dayPosts = dayMap.get(date);
    const content = dayPosts.map((p, i) => {
      const href = p.url || `https://www.v2ex.com/t/${p.id}`;
      const title = `<h3>${i + 1}. <a href="${escapeXml(href)}">${escapeXml(p.title)}</a></h3>`;
      const meta = `<p><em>${p.replies || 0} replies${p.author ? ' | by ' + escapeXml(p.author) : ''}${p.node ? ' | in ' + escapeXml(p.node) : ''}</em></p>`;
      const description = p.description || '';
      return title + meta + description + '<hr>';
    }).join('\n');

    feed += `  <entry>
    <title>${escapeXml(date + ' - ' + dayPosts[0].title)}</title>
    <link href="${SITE_URL}/${date}"/>
    <id>${SITE_URL}/${date}</id>
    <updated>${date}T00:00:00Z</updated>
    <content type="html"><![CDATA[${content}]]></content>
  </entry>
`;
  }

  feed += '</feed>\n';
  fs.writeFileSync(path.join(DIST_DIR, 'feed.xml'), feed);
  console.log('Generated v2ex feed.xml');

  console.log(`Generated ${dates.length} V2EX daily pages`);
  console.log(`Total: ${dates.length + 4} files in dist/v2ex/`);
}

async function fetch_posts(day) {
  const dayMoment = moment(String(day), ['YYYYMMDD', 'YYYY-MM-DD']).startOf('day');
  if (!dayMoment.isValid()) {
    throw new Error('Usage: node scripts/build-v2ex-site.js --day YYYYMMDD');
  }

  const dayStr = dayMoment.format('YYYY-MM-DD');
  const localFile = path.join(DATA_DIR, dayStr + '.json');
  if (fs.existsSync(localFile)) {
    console.log(`Load v2ex posts from local file: ${localFile}`);
    return JSON.parse(fs.readFileSync(localFile, 'utf-8'));
  }

  require('../dep');
  const { Query } = require('leancloud-storage');

  const query = new Query(POST_TABLE_NAME);
  query.limit(1000);
  query.descending('replies');
  query.greaterThanOrEqualTo('created', dayMoment.unix());
  query.lessThan('created', dayMoment.clone().add(1, 'd').unix());

  const results = await query.find();
  return results.map((post) => ({
    id: post.get('id'),
    node: post.get('node') ? post.get('node')['title'] : '',
    node_url: post.get('node') ? post.get('node')['url'] : '',
    node_image: post.get('node') ? post.get('node')['avatar_mini'] : '',
    description: post.get('content_rendered') || '',
    url: post.get('url') || '',
    replies: post.get('replies') || 0,
    created_ts: post.get('created'),
    created: moment(post.get('created') * 1000).format('HH:mm:ss'),
    title: post.get('title') || '',
    author: post.get('member') ? post.get('member')['username'] : '',
    author_url: post.get('member') ? post.get('member')['url'] : '',
    author_image: post.get('member') ? post.get('member')['avatar_mini'] : '',
  }));
}

function group_posts_by_day(posts) {
  const dayMap = new Map();

  for (const post of posts) {
    const date = moment(post.created_ts * 1000).format('YYYY-MM-DD');
    if (!dayMap.has(date)) {
      dayMap.set(date, []);
    }
    dayMap.get(date).push(post);
  }

  for (const [date, dayPosts] of dayMap.entries()) {
    dayPosts.sort((a, b) => {
      if (b.replies !== a.replies) return b.replies - a.replies;
      if (b.created_ts !== a.created_ts) return b.created_ts - a.created_ts;
      return b.id - a.id;
    });
  }

  return dayMap;
}

function write_day_posts(date, posts) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(DATA_DIR, date + '.json'), JSON.stringify(posts));
}

function build_months(dates, dayMap) {
  const monthMap = new Map();

  for (const date of dates) {
    const month = date.slice(0, 7);
    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    const dayPosts = dayMap.get(date) || [];
    const top1 = dayPosts.length > 0 ? dayPosts[0].title : '';
    monthMap.get(month).push({ date, count: dayPosts.length, top1 });
  }

  return Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, days]) => ({ label: key, days: days.sort((a, b) => b.date.localeCompare(a.date)) }));
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { fetch_posts, write_day_posts, write_site };
