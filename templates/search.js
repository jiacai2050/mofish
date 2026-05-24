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

  input.addEventListener('input', function() {
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
