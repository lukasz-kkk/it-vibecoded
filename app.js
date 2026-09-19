const tabButtons = document.querySelectorAll('.tab');
const tabContent = document.getElementById('tabContent');
const themeToggle = document.getElementById('themeToggle');

const DATA_FILES = {
  verbs: { file: 'data/verbs.txt', columnKind: 'example' },
  adjectives: { file: 'data/adjectives.txt', columnKind: 'antonym' },
  modal: { file: 'data/modal-verbs.txt', columnKind: 'modal' }
};

const WORD_SUBCATEGORIES = [
  { id: 'numbers', label: 'Liczby', file: 'data/words/numbers.txt', columnKind: 'translation' },
  { id: 'weekdays', label: 'Dni tygodnia', file: 'data/words/weekdays.txt', columnKind: 'translation' },
  { id: 'food', label: 'Jedzenie', file: 'data/words/food.txt', columnKind: 'translation' }
];

const state = {
  activeTab: 'verbs',
  activeWordSubcategory: 'numbers'
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
    const [label, value, ...extraValues] = parts;

    if (!label) {
      continue;
    }

    currentGroup.items.push({
      label: label || 'Wpis',
      value: value || '---',
      note: extraValues[0] || 'Dodaj opis / przykład.',
      extra: extraValues
    });
  }

  return groups;
}

function renderGroup(group, columnKind = 'translation', firstColumnLabel = 'Włoski') {
  const isModalVerbs = columnKind === 'modal';
  const isAntonymTable = columnKind === 'antonym';

  const rowsMarkup = group.items
    .map((item) => {
      if (isModalVerbs) {
        const forms = item.extra.length ? item.extra : [item.note];
        return `
          <tr>
            <td class="bold-text">${item.label}</td>
            <td>${item.value}</td>
            <td class="bold-text">${forms[0] || '—'}</td>
            <td class="bold-text">${forms[1] || '—'}</td>
            <td class="bold-text">${forms[2] || '—'}</td>
          </tr>
        `;
      }

      if (isAntonymTable) {
        const opposite = item.extra[0] || item.note || '—';
        const oppositePolish = item.extra[1] || '—';

        return `
          <tr>
            <td class="bold-text">${item.label}</td>
            <td>${item.value}</td>
            <td class="bold-text">${opposite}</td>
            <td>${oppositePolish}</td>
          </tr>
        `;
      }

      return `
        <tr>
          <td class="bold-text">${item.label}</td>
          <td>${item.value}</td>
          <td>${item.note}</td>
        </tr>
      `;
    })
    .join('');

  const headersMarkup = isModalVerbs
    ? `
      <tr>
        <th class="bold-text">Włoski</th>
        <th>Polski</th>
        <th class="bold-text">io</th>
        <th class="bold-text">tu</th>
        <th class="bold-text">lui/lei</th>
      </tr>
    `
    : isAntonymTable
      ? `
        <tr>
          <th class="bold-text">Włoski</th>
          <th>Polski</th>
          <th class="bold-text">Przeciwieństwo</th>
          <th>Polski</th>
        </tr>
      `
      : `
        <tr>
          <th class="bold-text">${firstColumnLabel}</th>
          <th>Polski</th>
          <th>${columnKind === 'example' ? 'Przykład' : 'Angielski'}</th>
        </tr>
      `;

  return `
    <section class="group">
      <h2>${group.title}</h2>
      <div class="table-shell">
        <table class="data-table ${isAntonymTable ? 'antonym-table' : ''}">
          <thead>
            ${headersMarkup}
          </thead>
          <tbody>
            ${rowsMarkup}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderContent(markup) {
  tabContent.innerHTML = markup;
}

function bindWordSubcategoryButtons() {
  document.querySelectorAll('.word-subtab').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeWordSubcategory = button.dataset.wordSubcategory;
      loadWordsTab(state.activeWordSubcategory);
    });
  });
}

function renderWordControls(activeSubcategory) {
  return `
    <div class="word-subtabs" aria-label="Podkategorie słówek">
      ${WORD_SUBCATEGORIES.map(
        (subcategory) => `
          <button
            type="button"
            class="word-subtab ${subcategory.id === activeSubcategory ? 'is-active' : ''}"
            data-word-subcategory="${subcategory.id}"
          >
            ${subcategory.label}
          </button>
        `
      ).join('')}
    </div>
  `;
}

async function loadWordsTab(subcategoryId) {
  const selected = WORD_SUBCATEGORIES.find((item) => item.id === subcategoryId) || WORD_SUBCATEGORIES[0];
  state.activeWordSubcategory = selected.id;

  try {
    const response = await fetch(selected.file, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać danych');
    }

    const text = await response.text();
    const groups = parseTextFile(text);

    if (!groups.length) {
      renderContent(`
        ${renderWordControls(selected.id)}
        <div class="empty-state">Brak danych dla tej podkategorii.</div>
      `);
      bindWordSubcategoryButtons();
      return;
    }

    const firstColumnLabel =
      selected.id === 'numbers'
        ? 'Liczba'
        : selected.id === 'weekdays'
          ? 'Dzień tygodnia'
          : 'Włoski';

    const markup = `
      ${renderWordControls(selected.id)}
      ${groups.map((group) => renderGroup(group, selected.columnKind, firstColumnLabel)).join('')}
    `;

    renderContent(markup);
    bindWordSubcategoryButtons();
  } catch (error) {
    renderContent(`
      ${renderWordControls(selected.id)}
      <div class="empty-state">
        Nie udało się załadować danych z pliku.<br />
        Uruchom lokalny serwer, np. <strong>python -m http.server</strong>, aby przeglądać projekt.
      </div>
    `);
    bindWordSubcategoryButtons();
  }
}

async function loadTab(tabName) {
  const config = DATA_FILES[tabName];
  const file = config ? config.file : null;

  if (!file) {
    if (tabName === 'words') {
      loadWordsTab(state.activeWordSubcategory);
      return;
    }

    renderContent('<div class="empty-state">Brak danych dla tej zakładki.</div>');
    return;
  }

  try {
    const response = await fetch(file, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać danych');
    }

    const text = await response.text();
    const groups = parseTextFile(text);

    if (!groups.length) {
      renderContent('<div class="empty-state">Tutaj dodasz treści. Plik tekstowy jest pusty.</div>');
      return;
    }

    const columnKind = DATA_FILES[tabName].columnKind;
    const markup = groups.map((group) => renderGroup(group, columnKind)).join('');
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
  state.activeTab = tabName;

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  if (tabName === 'words') {
    loadWordsTab(state.activeWordSubcategory);
    return;
  }

  loadTab(tabName);
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

setActiveTab('verbs');
