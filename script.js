
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('storyverse-theme');
  if (savedTheme === 'dark') document.body.classList.add('dark');
  updateThemeIcon();
  if (themeToggle) themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('storyverse-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    updateThemeIcon();
  });
  function updateThemeIcon() {
    if (themeToggle) themeToggle.textContent = document.body.classList.contains('dark') ? '☀' : '☾';
  }

  const grid = document.getElementById('bookGrid');
  if (grid) setupLibrary(grid);
  const root = document.getElementById('storyRoot');
  if (root) renderStory(root);

  function setupLibrary(grid) {
    const search = document.getElementById('searchInput');
    const sort = document.getElementById('sortSelect');
    const count = document.getElementById('resultCount');
    const empty = document.getElementById('emptyState');
    const dialog = document.getElementById('detailsDialog');
    let activeGenre = 'All';
    const liked = new Set(JSON.parse(localStorage.getItem('storyverse-liked') || '[]'));

    function card(story) {
      return `<article class="book-card">
        <div class="cover-wrap">
          <img src="${story.cover}" alt="${story.title} book cover" loading="lazy">
          <button class="like-button ${liked.has(story.id) ? 'liked' : ''}" data-like="${story.id}" type="button" aria-label="${liked.has(story.id) ? 'Unlike' : 'Like'} ${story.title}">${liked.has(story.id) ? '♥' : '♡'}</button>
          <div class="cover-overlay"><a class="quick-read" href="story.html?id=${story.id}">Read story ↗</a></div>
        </div>
        <div class="book-meta"><span class="genre-label">${story.genre}</span><h3 title="${story.title}">${story.title}</h3><p class="book-author">by ${story.author}</p>
          <div class="card-bottom"><span class="chapter-tag">1 chapter</span><button class="details-link" data-details="${story.id}" type="button">Details ↗</button></div>
        </div>
      </article>`;
    }
    function render() {
      let filtered = STORIES.filter(s => (activeGenre === 'All' || s.genre === activeGenre) &&
        (s.title + ' ' + s.author + ' ' + s.genre + ' ' + s.synopsis).toLowerCase().includes(search.value.toLowerCase().trim()));
      if (sort.value === 'title') filtered.sort((a,b) => a.title.localeCompare(b.title));
      if (sort.value === 'genre') filtered.sort((a,b) => a.genre.localeCompare(b.genre) || a.title.localeCompare(b.title));
      grid.innerHTML = filtered.map(card).join('');
      count.textContent = `${filtered.length} ${filtered.length === 1 ? 'story' : 'stories'}`;
      empty.classList.toggle('hidden', filtered.length > 0);
      grid.classList.toggle('hidden', filtered.length === 0);
    }
    document.querySelectorAll('.genre-chip').forEach(btn => btn.addEventListener('click', () => {
      activeGenre = btn.dataset.genre;
      document.querySelectorAll('.genre-chip').forEach(b => b.classList.toggle('selected', b === btn));
      render();
    }));
    search.addEventListener('input', render);
    sort.addEventListener('change', render);
    document.getElementById('resetFilters').addEventListener('click', () => {
      activeGenre = 'All'; search.value = ''; sort.value = 'default';
      document.querySelectorAll('.genre-chip').forEach(b => b.classList.toggle('selected', b.dataset.genre === 'All'));
      render();
    });
    grid.addEventListener('click', event => {
      const likeBtn = event.target.closest('[data-like]');
      if (likeBtn) {
        const id = Number(likeBtn.dataset.like);
        liked.has(id) ? liked.delete(id) : liked.add(id);
        localStorage.setItem('storyverse-liked', JSON.stringify([...liked]));
        render();
        return;
      }
      const detailBtn = event.target.closest('[data-details]');
      if (detailBtn) {
        const s = STORIES.find(item => item.id === Number(detailBtn.dataset.details));
        document.getElementById('dialogCover').src = s.cover;
        document.getElementById('dialogCover').alt = `${s.title} book cover`;
        document.getElementById('dialogGenre').textContent = s.genre;
        document.getElementById('dialogTitle').textContent = s.title;
        document.getElementById('dialogAuthor').textContent = `A story by ${s.author}`;
        document.getElementById('dialogSynopsis').textContent = s.synopsis;
        document.getElementById('dialogRead').href = `story.html?id=${s.id}`;
        dialog.showModal();
      }
    });
    document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    render();
  }

  function renderStory(root) {
    const id = Number(new URLSearchParams(window.location.search).get('id')) || 1;
    const story = STORIES.find(s => s.id === id) || STORIES[0];
    document.title = `${story.title} | StoryVerse`;
    root.innerHTML = `
      <div class="story-topline"><a class="back-link" href="index.html#library">← Back to library</a><span>STORY ${String(story.id).padStart(2,'0')} / 30</span></div>
      <section class="story-hero">
        <img class="story-cover" src="${story.cover}" alt="${story.title} book cover">
        <div class="story-intro"><span class="genre-label">${story.genre} · SHORT STORY</span><h1>${story.title}</h1><p class="byline">Written by <strong>${story.author}</strong> · 1 chapter · 5 min read</p>
          <p class="synopsis" id="synopsisText">${story.synopsis}</p>
          <div class="story-actions"><button class="primary-button" id="startReading" type="button">Start reading <span>↓</span></button><button class="outline-button" id="storyLike" type="button">♡ Add to favorites</button><button class="outline-button" id="synopsisToggle" type="button">Hide synopsis</button></div>
        </div>
      </section>
      <div class="reading-progress-wrap" aria-label="Reading progress"><div class="reading-progress" id="readingProgress"></div></div>
      <article class="chapter-shell" id="chapter">
        <p class="chapter-kicker">CHAPTER ONE · THE BEGINNING</p><h2>${story.chapter}</h2><p class="chapter-subtitle">Every great journey starts somewhere.</p>
        <img class="chapter-image" src="${story.image}" alt="${story.scene}">
        <div class="story-text">${makeChapter(story)}</div>
        <div class="story-end"><span>✦ ✧ ✦</span><strong>The beginning is yours.</strong><p>Thank you for reading ${story.title}. Every ending leaves room for a new story.</p></div>
      </article>
      <div class="next-story"><p>Ready for another world?</p><a class="primary-button" href="story.html?id=${story.id === STORIES.length ? 1 : story.id + 1}">Read another story <span>→</span></a></div>`;
    const synopsis = document.getElementById('synopsisText');
    document.getElementById('synopsisToggle').addEventListener('click', e => {
      synopsis.classList.toggle('hidden');
      e.currentTarget.textContent = synopsis.classList.contains('hidden') ? 'Show synopsis' : 'Hide synopsis';
    });
    document.getElementById('startReading').addEventListener('click', () => document.getElementById('chapter').scrollIntoView({behavior:'smooth'}));
    const favorites = new Set(JSON.parse(localStorage.getItem('storyverse-liked') || '[]'));
    const like = document.getElementById('storyLike');
    function updateLike(){ like.textContent = favorites.has(story.id) ? '♥ Added to favorites' : '♡ Add to favorites'; like.style.color = favorites.has(story.id) ? '#e64d69' : ''; }
    updateLike();
    like.addEventListener('click', () => {
      favorites.has(story.id) ? favorites.delete(story.id) : favorites.add(story.id);
      localStorage.setItem('storyverse-liked', JSON.stringify([...favorites])); updateLike();
    });
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.getElementById('readingProgress').style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 100}%`;
    }, {passive:true});
  }

  function makeChapter(story) {
    const paras = [
      `The day began like any other, but ${story.title.toLowerCase()} was about to become a memory that would last far longer than anyone expected. The air carried the quiet feeling that something was waiting just beyond the ordinary.`,
      `“Maybe the answer isn't as far away as we think,” ${story.author} whispered, looking around at the familiar world with unfamiliar eyes. There were questions everywhere, little clues tucked into everyday moments, and a choice that could change what happened next.`,
      `${story.synopsis} It sounded impossible when said aloud, yet the thought had taken root. Sometimes courage did not arrive like thunder. Sometimes it was simply the decision to take one more step, even when the path ahead was unclear.`,
      `The afternoon light shifted across the scene, painting everything in a softer color. For the first time, the fear of not knowing felt smaller than the excitement of finding out. Whatever came next, it would be faced one moment at a time.`,
      `And so the first page turned. There would be surprises, difficult choices, laughter, and lessons along the way. But every journey needed a beginning, and this one belonged to ${story.title}. The rest of the world could wait. For now, the story had started.`
    ];
    return paras.map(p => `<p>${p}</p>`).join('');
  }
});
