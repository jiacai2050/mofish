const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'v2ex');

function write_day_posts(date, posts) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(DATA_DIR, date + '.json'), JSON.stringify(posts));
}

module.exports = { write_day_posts };
