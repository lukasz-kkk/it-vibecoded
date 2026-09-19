const mainCategoryBar = document.getElementById('mainCategoryBar');
const subTabBar = document.getElementById('subTabBar');
const tabContent = document.getElementById('tabContent');
const themeToggle = document.getElementById('themeToggle');

const WORD_SUBCATEGORIES = Array.isArray(window.WORD_CATEGORIES) && window.WORD_CATEGORIES.length
  ? window.WORD_CATEGORIES
  : [
      { id: 'numbers', label: 'Liczby', file: 'data/words/numbers.txt', columnKind: 'translation' },
      { id: 'weekdays', label: 'Dni tygodnia', file: 'data/words/weekdays.txt', columnKind: 'translation' },
      { id: 'food', label: 'Jedzenie', file: 'data/words/food.txt', columnKind: 'translation' }
    ];

const PHRASE_CATEGORIES = Array.isArray(window.PHRASE_CATEGORIES) && window.PHRASE_CATEGORIES.length
  ? window.PHRASE_CATEGORIES
  : [
      { id: 'basic', label: 'Podstawowe', file: 'data/words/phrases.txt', columnKind: 'translation' }
    ];

const MAIN_CATEGORIES = {
  vocabulary: {
    label: 'Słownictwo',
    tabs: [
      { id: 'verbs', label: 'Czasowniki' },
      { id: 'adjectives', label: 'Przymiotniki' },
      { id: 'modal', label: 'Móc / chcieć / musieć' },
      { id: 'phrases', label: 'Zwroty' },
      { id: 'words', label: 'Słówka' }
    ]
  },
  theory: {
    label: 'Teoria',
    tabs: [
      { id: 'are', label: 'Czasowniki na -ARE' },
      { id: 'ere', label: 'Czasowniki na -ERE' },
      { id: 'articles', label: 'Rodzajniki' }
    ]
  }
};

const DATA_FILES = {
  verbs: { file: 'data/verbs.txt', columnKind: 'example' },
  adjectives: { file: 'data/adjectives.txt', columnKind: 'antonym' },
  modal: { file: 'data/modal-verbs.txt', columnKind: 'modal' }
};

const state = {
  mainCategory: 'vocabulary',
  vocabularyTab: 'verbs',
  phraseTab: 'basic',
  theoryTab: 'are',
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

function renderMainCategoryBar() {
  mainCategoryBar.innerHTML = Object.entries(MAIN_CATEGORIES)
    .map(
      ([id, category]) => `
        <button
          type="button"
          class="main-tab ${state.mainCategory === id ? 'is-active' : ''}"
          data-main-category="${id}"
        >
          ${category.label}
        </button>
      `
    )
    .join('');

  document.querySelectorAll('.main-tab').forEach((button) => {
    button.addEventListener('click', () => setMainCategory(button.dataset.mainCategory));
  });
}

function renderSubTabs() {
  const tabs = MAIN_CATEGORIES[state.mainCategory].tabs;
  const activeTab =
    state.mainCategory === 'vocabulary'
      ? state.vocabularyTab
      : state.theoryTab;

  subTabBar.innerHTML = tabs
    .map(
      (tab) => `
        <button
          type="button"
          class="tab ${activeTab === tab.id ? 'is-active' : ''}"
          data-tab="${tab.id}"
        >
          ${tab.label}
        </button>
      `
    )
    .join('');

  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.mainCategory === 'vocabulary') {
        state.vocabularyTab = button.dataset.tab;
      } else {
        state.theoryTab = button.dataset.tab;
      }

      renderSubTabs();
      renderCurrentContent();
    });
  });
}

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
  const isNumbersTable = firstColumnLabel === 'Liczba';

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

      if (isNumbersTable) {
        return `
          <tr>
            <td>${item.label}</td>
            <td class="bold-text">${item.value}</td>
            <td>${item.note}</td>
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
      : isNumbersTable
        ? `
          <tr>
            <th class="bold-text">Liczba</th>
            <th class="bold-text">Włoski</th>
            <th class="bold-text">Polski</th>
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
        <table class="data-table ${isAntonymTable ? 'antonym-table' : ''} ${isNumbersTable ? 'number-table' : ''}">
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

function renderTheoryAre() {
  return `
    <article class="theory-card">
      <h2>Czasowniki na -ARE</h2>

      <p><strong>Przykład:</strong> <strong>parlare</strong> = mówić</p>

      <p>Usuwamy <strong>-are</strong> i dodajemy końcówki:</p>

      <div class="theory-table-shell">
        <table class="theory-table">
          <thead>
            <tr>
              <th>Osoba</th>
              <th>Końcówka</th>
              <th>parlare</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>io</td><td><strong>-o</strong></td><td><strong>parl</strong>o</td></tr>
            <tr><td>tu</td><td><strong>-i</strong></td><td><strong>parl</strong>i</td></tr>
            <tr><td>lui/lei</td><td><strong>-a</strong></td><td><strong>parl</strong>a</td></tr>
            <tr><td>noi</td><td><strong>-iamo</strong></td><td><strong>parl</strong>iamo</td></tr>
            <tr><td>voi</td><td><strong>-ate</strong></td><td><strong>parl</strong>ate</td></tr>
            <tr><td>loro</td><td><strong>-ano</strong></td><td><strong>parl</strong>ano</td></tr>
          </tbody>
        </table>
      </div>

      <p class="examples">
        <strong>io parlo</strong> – mówię<br />
        <strong>tu parli</strong> – mówisz<br />
        <strong>lui parla</strong> – mówi<br />
        <strong>noi parliamo</strong> – mówimy<br />
        <strong>voi parlate</strong> – mówicie<br />
        <strong>loro parlano</strong> – mówią
      </p>

      <p><strong>Końcówki -ARE:</strong> <strong>O – I – A – IAMO – ATE – ANO</strong></p>
    </article>
  `;
}

function renderTheoryEre() {
  return `
    <article class="theory-card">
      <h2>Czasowniki na -ERE</h2>

      <p><strong>Przykład:</strong> <strong>vedere</strong> = widzieć</p>

      <p>Usuwamy <strong>-ere</strong>:</p>

      <div class="theory-table-shell">
        <table class="theory-table">
          <thead>
            <tr>
              <th>Osoba</th>
              <th>Końcówka</th>
              <th>vedere</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>io</td><td><strong>-o</strong></td><td><strong>ved</strong>o</td></tr>
            <tr><td>tu</td><td><strong>-i</strong></td><td><strong>ved</strong>i</td></tr>
            <tr><td>lui/lei</td><td><strong>-e</strong></td><td><strong>ved</strong>e</td></tr>
            <tr><td>noi</td><td><strong>-iamo</strong></td><td><strong>ved</strong>iamo</td></tr>
            <tr><td>voi</td><td><strong>-ete</strong></td><td><strong>ved</strong>ete</td></tr>
            <tr><td>loro</td><td><strong>-ono</strong></td><td><strong>ved</strong>ono</td></tr>
          </tbody>
        </table>
      </div>

      <p class="examples">
        <strong>io vedo</strong> – widzę<br />
        <strong>tu vedi</strong> – widzisz<br />
        <strong>lui vede</strong> – widzi<br />
        <strong>noi vediamo</strong> – widzimy<br />
        <strong>voi vedete</strong> – widzicie<br />
        <strong>loro vedono</strong> – widzą
      </p>

      <p><strong>Końcówki -ERE:</strong> <strong>O – I – E – IAMO – ETE – ONO</strong></p>
    </article>
  `;
}

function renderContent(markup) {
  tabContent.innerHTML = markup;
}

function renderTheoryArticles() {
  return `
    <article class="theory-card">
      <h2>Rodzajniki</h2>

      <h3>Rodzajniki nieokreślone</h3>
      <div class="rule-grid">
        <section class="rule-box">
          <h3>Rodzaj męski <span>(maschile)</span></h3>
          <p>W rodzaju męskim używamy form <strong>uno</strong> lub <strong>un</strong>.</p>

          <div class="mini-rule">
            <div class="mini-label">un</div>
            <div>
              przed spółgłoską: <strong>un ragazzo</strong>, <strong>un libro</strong>, <strong>un amico</strong>, <strong>un armadio</strong>
            </div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">uno</div>
            <div>
              przed rzeczownikami zaczynającymi się na:<br />
              <strong>s + spółgłoska</strong>: <strong>uno studente</strong><br />
              <strong>z</strong>: <strong>uno zio</strong>, <strong>uno zaino</strong><br />
              <strong>gn</strong>: <strong>uno gnomo</strong><br />
              <strong>ps / pn</strong>: <strong>uno psicologo</strong>, <strong>uno pneumatico</strong><br />
              <strong>x, y</strong>: <strong>uno xenofobo</strong>, <strong>uno yacht</strong>
            </div>
          </div>
        </section>

        <section class="rule-box">
          <h3>Rodzaj żeński <span>(femminile)</span></h3>
          <p>W rodzaju żeńskim używamy form <strong>una</strong> lub <strong>un'</strong>.</p>

          <div class="mini-rule">
            <div class="mini-label">una</div>
            <div>
              przed spółgłoską: <strong>una casa</strong>, <strong>una penna</strong>
            </div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">un'</div>
            <div>
              przed samogłoską: <strong>un'amica</strong>, <strong>un'isola</strong>
            </div>
          </div>
        </section>
      </div>

      <h3>Rodzajniki określone</h3>
      <div class="rule-grid">
        <section class="rule-box">
          <h3>Rodzaj męski <span>(maschile)</span></h3>
          <p>Używamy ich, gdy mówimy o czymś konkretnym, znanym lub wcześniej wspomnianym.</p>

          <div class="mini-rule">
            <div class="mini-label">il</div>
            <div>przed spółgłoską: <strong>il libro</strong>, <strong>il ragazzo</strong></div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">lo</div>
            <div>przed <strong>s + spółgłoska</strong>, <strong>z</strong>, <strong>gn</strong>, <strong>ps</strong>, <strong>x</strong>, <strong>y</strong>: <strong>lo studente</strong>, <strong>lo zaino</strong></div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">l'</div>
            <div>przed samogłoską: <strong>l'amico</strong>, <strong>l'armadio</strong></div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">i</div>
            <div>
              liczba mnoga przed zwykłą spółgłoską: <strong>il libro</strong> → <strong>i libri</strong>, <strong>il ragazzo</strong> → <strong>i ragazzi</strong><br />
              Używamy go, gdy rzeczownik zaczyna się zwykłą spółgłoską.
            </div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">gli</div>
            <div>
              liczba mnoga przed samogłoską, <strong>s + spółgłoska</strong>, <strong>z</strong>, <strong>gn</strong>, <strong>ps</strong>, <strong>x</strong>, <strong>y</strong>: <strong>l'amico</strong> → <strong>gli amici</strong>, <strong>lo studente</strong> → <strong>gli studenti</strong>, <strong>lo zaino</strong> → <strong>gli zaini</strong>
            </div>
          </div>
        </section>

        <section class="rule-box">
          <h3>Rodzaj żeński <span>(femminile)</span></h3>
          <p>W rodzaju żeńskim używamy form <strong>la</strong>, <strong>l'</strong> oraz <strong>le</strong>.</p>

          <div class="mini-rule">
            <div class="mini-label">la</div>
            <div>przed spółgłoską: <strong>la casa</strong>, <strong>la penna</strong></div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">l'</div>
            <div>przed samogłoską: <strong>l'amica</strong>, <strong>l'isola</strong></div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">le</div>
            <div>liczba mnoga: <strong>le case</strong>, <strong>le amiche</strong></div>
          </div>
        </section>
      </div>

      <div class="summary-box">
        <h3>Najważniejsze</h3>
        <ul>
          <li><strong>un / uno</strong> = męski, nieokreślony</li>
          <li><strong>una / un'</strong> = żeński, nieokreślony</li>
          <li><strong>il / lo / l' / i / gli</strong> = męski, określony</li>
          <li><strong>la / l' / le</strong> = żeński, określony</li>
        </ul>
      </div>
    </article>
  `;
}

function renderNumbersRules() {
  return `
    <article class="theory-card">
      <h2>Jak tworzyć liczby?</h2>

      <div class="rule-grid">
        <section class="rule-box">
          <h3>Ogólna zasada</h3>
          <p>W języku włoskim liczby od 21 wzwyż tworzy się według schematu <strong>dziesiątka + jedność</strong>.</p>

          <div class="mini-rule">
            <div class="mini-label">23</div>
            <div><strong>venti</strong> + <strong>tre</strong> = <strong>ventitre</strong></div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">25</div>
            <div><strong>venti</strong> + <strong>cinque</strong> = <strong>venticinque</strong></div>
          </div>
        </section>

        <section class="rule-box">
          <h3>Wyjątki</h3>
          <div class="mini-rule">
            <div class="mini-label">21</div>
            <div><strong>venti</strong> + <strong>uno</strong> = <strong>ventuno</strong> (a nie <strong>ventiuno</strong>)</div>
          </div>

          <div class="mini-rule">
            <div class="mini-label">28</div>
            <div><strong>venti</strong> + <strong>otto</strong> = <strong>ventotto</strong> (a nie <strong>ventiotto</strong>)</div>
          </div>
        </section>
      </div>
    </article>
  `;
}

function renderWeekdayTimeNotes() {
  return `
    <article class="theory-card weekday-note">
      <h3>Jak tworzyć zwroty z czasem</h3>
      <div class="rule-grid">
        <section class="rule-box">
          <div class="mini-rule">
            <div class="mini-label">tra</div>
            <div><strong>tra</strong> = <strong>za</strong> — np. <strong>tra due giorni</strong> = <strong>za dwa dni</strong></div>
          </div>
          <div class="mini-rule">
            <div class="mini-label">fa</div>
            <div><strong>fa</strong> = <strong>temu</strong> — np. <strong>tre giorni fa</strong> = <strong>trzy dni temu</strong></div>
          </div>
        </section>
        <section class="rule-box">
          <h3>Ważna uwaga</h3>
          <p><strong>fra tre</strong> po włosku znaczy <strong>„za trzy”</strong> (np. w odniesieniu do czasu).</p>
          <p><strong>fra</strong> i <strong>tra</strong> mają to samo znaczenie i często są zamienne. W praktyce wybiera się jedną formę ze względu na brzmienie i wygodę wymowy (np. mówi się "fra tre", żeby nie mówić "tra tre").</p>
        </section>
      </div>
    </article>
  `;
}

function renderTheoryContent() {
  if (state.theoryTab === 'are') {
    renderContent(renderTheoryAre());
    return;
  }

  if (state.theoryTab === 'ere') {
    renderContent(renderTheoryEre());
    return;
  }

  renderContent(renderTheoryArticles());
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

    const introMarkup = selected.id === 'numbers' ? renderNumbersRules() : '';
    const weekdayNote = selected.id === 'weekdays' ? renderWeekdayTimeNotes() : '';
    const markup = `
      ${renderWordControls(selected.id)}
      ${introMarkup}
      ${groups.map((group) => renderGroup(group, selected.columnKind, firstColumnLabel)).join('')}
      ${weekdayNote}
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

async function loadPhraseTab(subcategoryId) {
  const selected = PHRASE_CATEGORIES.find((item) => item.id === subcategoryId) || PHRASE_CATEGORIES[0];

  try {
    const response = await fetch(selected.file, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać danych');
    }

    const text = await response.text();
    const groups = parseTextFile(text);

    if (!groups.length) {
      renderContent('<div class="empty-state">Brak danych dla tej kategorii.</div>');
      return;
    }

    const markup = groups.map((group) => renderGroup(group, selected.columnKind)).join('');
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

async function loadTab(tabName) {
  const config = DATA_FILES[tabName];
  const file = config ? config.file : null;

  if (!file) {
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

function renderCurrentContent() {
  if (state.mainCategory === 'vocabulary') {
    if (state.vocabularyTab === 'words') {
      loadWordsTab(state.activeWordSubcategory);
      return;
    }

    if (state.vocabularyTab === 'phrases') {
      loadPhraseTab('basic');
      return;
    }

    loadTab(state.vocabularyTab);
    return;
  }

  renderTheoryContent();
}

function setMainCategory(categoryId) {
  state.mainCategory = categoryId;
  renderMainCategoryBar();
  renderSubTabs();
  renderCurrentContent();
}

renderMainCategoryBar();
renderSubTabs();
renderCurrentContent();
