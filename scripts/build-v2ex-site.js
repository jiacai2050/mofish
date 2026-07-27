const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const moment = require('moment');

const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'v2ex');
const DATA_DIR = path.join(__dirname, '..', 'data', 'v2ex');
const DIST_DIR = path.join(__dirname, '..', 'dist', 'v2ex');
const SITE_URL = 'https://news.liujiacai.net/v2ex';

function main() {
  write_site();
}

function write_site() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const indexTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'index.ejs'), 'utf-8');
  const dayTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'day.ejs'), 'utf-8');
  const dates = get_dates();
  const dayMap = new Map(dates.map((date) => [date, read_day_posts(date)]));
  const format_time = (timestamp) => moment(timestamp * 1000).format('HH:mm:ss');
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
    const dayHtml = ejs.render(dayTemplate, {
      date,
      posts: dayMap.get(date),
      format_time,
      prev,
      next,
    });
    const dayDir = path.join(DIST_DIR, date);
    if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });
    fs.writeFileSync(path.join(dayDir, 'index.html'), dayHtml);
  }

  const searchIndex = [];
  for (const date of dates) {
    dayMap.get(date).forEach((post, idx) => {
      searchIndex.push({ t: post.title, d: date, i: idx });
    });
  }
  fs.writeFileSync(path.join(DIST_DIR, 'search-index.json'), JSON.stringify(searchIndex));
  console.log(`Generated v2ex search-index.json (${searchIndex.length} entries)`);

  const recentDates = dates.slice().reverse().filter((date) => dayMap.get(date).length > 0).slice(0, 60);
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

function get_dates() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR)
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .map((file) => file.replace('.json', ''))
    .sort((a, b) => a.localeCompare(b));
}

function read_day_posts(date) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, date + '.json'), 'utf-8'));
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
  main();
}

module.exports = { get_dates, read_day_posts, write_site };
