const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { marked } = require('marked');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  const dates = files.map(f => f.replace('.json', ''));

  const indexTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'index.ejs'), 'utf-8');
  const dayTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'day.ejs'), 'utf-8');

  // Group dates by month for index page
  const monthMap = new Map();
  for (const date of dates) {
    const month = date.slice(0, 7); // YYYY-MM
    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, date + '.json'), 'utf-8'));
    const top1 = data.length > 0 ? data[0].title : '';
    monthMap.get(month).push({ date, count: data.length, top1 });
  }

  const months = Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, days]) => ({ label: key, days: days.sort((a, b) => b.date.localeCompare(a.date)) }));

  fs.copyFileSync(path.join(TEMPLATE_DIR, 'style.css'), path.join(DIST_DIR, 'style.css'));
  fs.copyFileSync(path.join(TEMPLATE_DIR, 'search.js'), path.join(DIST_DIR, 'search.js'));
  fs.writeFileSync(path.join(DIST_DIR, 'CNAME'), 'news.liujiacai.net\n');

  const indexHtml = ejs.render(indexTemplate, { months });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
  console.log('Generated index.html');

  // Generate daily pages
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const prev = i > 0 ? dates[i - 1] : null;
    const next = i < dates.length - 1 ? dates[i + 1] : null;

    const posts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, date + '.json'), 'utf-8'));

    const postsWithHtml = posts.map(post => ({
      ...post,
      summaryHtml: post.summary ? marked(post.summary) : null,
    }));

    const dayHtml = ejs.render(dayTemplate, { date, posts: postsWithHtml, prev, next });
    const dayDir = path.join(DIST_DIR, date);
    if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });
    fs.writeFileSync(path.join(dayDir, 'index.html'), dayHtml);
  }

  // Generate search index
  const searchIndex = [];
  for (const date of dates) {
    const posts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, date + '.json'), 'utf-8'));
    posts.forEach((post, idx) => {
      searchIndex.push({ t: post.title, d: date, i: idx });
    });
  }
  fs.writeFileSync(path.join(DIST_DIR, 'search-index.json'), JSON.stringify(searchIndex));
  console.log(`Generated search-index.json (${searchIndex.length} entries)`);

  // Generate Atom feed (last 60 days, skip empty)
  const siteUrl = 'http://news.liujiacai.net';
  const recentDates = dates.slice().reverse().filter(date => {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, date + '.json'), 'utf-8'));
    return data.length > 0;
  }).slice(0, 60);

  const feedUpdated = recentDates.length > 0 ? recentDates[0] + 'T00:00:00Z' : new Date().toISOString();
  let feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>每日精选 Hacker News 热帖摘要</title>
  <link href="${siteUrl}/feed.xml" rel="self"/>
  <link href="${siteUrl}"/>
  <id>${siteUrl}/</id>
  <updated>${feedUpdated}</updated>
`;

  for (const date of recentDates) {
    const posts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, date + '.json'), 'utf-8'));
    const content = posts.map((p, i) => {
      const title = `<h3>${i + 1}. <a href="${p.url || 'https://news.ycombinator.com/item?id=' + p.id}">${escapeXml(p.title)}</a></h3>`;
      const meta = `<p><em>${p.score || 0} points | <a href="https://news.ycombinator.com/item?id=${p.id}">${p.descendants || 0} comments</a>${p.by ? ' | by ' + escapeXml(p.by) : ''}</em></p>`;
      const summary = p.summary ? marked(p.summary) : '';
      return title + meta + summary + '<hr>';
    }).join('\n');

    feed += `  <entry>
    <title>${escapeXml(date + ' - ' + posts[0].title)}</title>
    <link href="${siteUrl}/${date}"/>
    <id>${siteUrl}/${date}</id>
    <updated>${date}T00:00:00Z</updated>
    <content type="html"><![CDATA[${content}]]></content>
  </entry>
`;
  }

  feed += '</feed>\n';
  fs.writeFileSync(path.join(DIST_DIR, 'feed.xml'), feed);
  console.log('Generated feed.xml');

  console.log(`Generated ${dates.length} daily pages`);
  console.log(`Total: ${dates.length + 2} files in dist/`);
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

main();
