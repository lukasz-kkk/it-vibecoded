const tabButtons = document.querySelectorAll('.tab');
const tabContent = document.getElementById('tabContent');
const themeToggle = document.getElementById('themeToggle');

const DATA_FILES = {
  verbs: 'data/verbs.txt',
  adjectives: 'data/adjectives.txt',
  modal: 'data/modal-verbs.txt',
  numbers: 'data/numbers.txt',
  weekdays: 'data/weekdays.txt'
};

const defaultTheme = localStorage.getItem('italian-notes-theme') || 'light';
applyTheme(defaultTheme);

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  themeToggle.innerHTML =
    theme === 'dark' ? '<span class="icon" aria-hidden="true">☀️</span>' : '<span class="icon" aria-hidden="true">🌙</span>';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw');
  localStorage.setItem('italian-notes-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
});

function parseTextFile(content) {
  const groups = [];
  let currentGroup = null;

  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('//')) {
      continue;
    }

    if (line.startsWith('#')) {
      const title = line.replace(/^#\s*/, '').trim();
      currentGroup = { title, items: [] };
      groups.push(currentGroup);
      continue;
    }

    if (!currentGroup) {
      currentGroup = { title: 'Sekcja', items: [] };
      groups.push(currentGroup);
    }

    const parts = line.split('|').map((item) => item.trim());
    const [label, value, note] = parts;

    if (!label) {
      continue;
    }

    currentGroup.items.push({
      label: label || 'Wpis',
      value: value || '---',
      note: note || 'Dodaj opis / przykład.'
    });
  }

  return groups;
}

function renderGroup(group) {
  const itemsMarkup = group.items
    .map(
      (item) => `
        <article class="card">
          <span class="tag">${group.title}</span>
          <h3>${item.label}</h3>
          <p>${item.value}</p>
          <div class="meta">${item.note}</div>
        </article>
      `
    )
    .join('');

  return `
    <section class="group">
      <h2>${group.title}</h2>
      <div class="card-grid">
        ${itemsMarkup}
      </div>
    </section>
  `;
}

function renderContent(markup) {
  tabContent.innerHTML = markup;
}

async function loadTab(tabName) {
  const file = DATA_FILES[tabName];

  if (!file) {
    renderContent('<div class="empty-state">Brak danych dla tej zakładki.</div>');
    return;
  }

  try {
    const response = await fetch(file);

    if (!response.ok) {
      throw new Error('Nie udało się pobrać danych');
    }

    const text = await response.text();
    const groups = parseTextFile(text);

    if (!groups.length) {
      renderContent('<div class="empty-state">Tutaj dodasz treści. Plik tekstowy jest pusty.</div>');
      return;
    }

    const markup = groups.map(renderGroup).join('');
    renderContent(markup);
  } catch (error) {
    renderContent(`
      <div class="empty-state">
        Nie udało się załadować danych z pliku.<br />
        Uruchom lokalny serwer, np. <strong>python -m http.server</strong>, aby przeglądać projekt.
      </div>
    `);
  }
}

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  loadTab(tabName);
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

setActiveTab('verbs');
