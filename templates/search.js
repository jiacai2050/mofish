(function() {
  let index = null;

  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  input.addEventListener('focus', async function() {
    if (!index) {
      const resp = await fetch('search-index.json');
      index = await resp.json();
    }
  });

  let activeIdx = -1;

  function updateActive() {
    const items = results.querySelectorAll('li');
    items.forEach((li, i) => li.classList.toggle('active', i === activeIdx));
    if (activeIdx >= 0 && items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('keydown', function(e) {
    const items = results.querySelectorAll('li');
    if (!items.length) return;

    if (e.key === 'ArrowDown' || (e.ctrlKey && e.code === 'KeyN')) {
      e.preventDefault();
      activeIdx = (activeIdx + 1) % items.length;
      updateActive();
    } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.code === 'KeyP')) {
      e.preventDefault();
      activeIdx = (activeIdx - 1 + items.length) % items.length;
      updateActive();
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      const link = items[activeIdx].querySelector('a');
      if (link) link.click();
    }
  });

  input.addEventListener('input', function() {
    activeIdx = -1;
    const query = this.value.trim().toLowerCase();
    if (!query || !index) {
      results.innerHTML = '';
      results.style.display = 'none';
      return;
    }

    const keywords = query.split(/\s+/);
    const matches = index.filter(function(item) {
      const title = item.t.toLowerCase();
      return keywords.every(function(kw) { return title.includes(kw); });
    }).slice(0, 20);

    if (matches.length === 0) {
      results.innerHTML = '<li>No results</li>';
    } else {
      results.innerHTML = matches.map(function(m) {
        return '<li><a href="' + m.d + '#post-' + m.i + '">' + escapeHtml(m.t) + '</a> <small>' + m.d + '</small></li>';
      }).join('');
    }
    results.style.display = 'block';
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
      results.style.display = 'none';
    }
  });

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
