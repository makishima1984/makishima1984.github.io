(function () {
  'use strict';
  const { samples, patterns } = window.PauseData;
  const engine = window.PauseEngine;
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let currentSample = null;
  let currentResult = null;
  let toastTimer;

  function showView(name) {
    if (!['check', 'library', 'about'].includes(name)) name = 'check';
    document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== 'view-' + name; });
    document.querySelectorAll('.nav-button').forEach(button => {
      const active = button.dataset.view === name;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    if (name === 'library') renderLibrary();
    document.title = 'Pause — ' + ({ check: 'Check a message', library: 'Pattern library', about: 'About this prototype' }[name]);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateInputMeta() {
    $('character-count').textContent = $('message').value.length.toLocaleString('en-US') + ' / 6,000';
    $('input-kind').textContent = currentSample ? 'SYNTHETIC SAMPLE' : 'YOUR INPUT';
    $('sample-note').textContent = currentSample ? currentSample.note : 'Remove private details before reviewing. Text remains in this page until cleared or reloaded.';
    document.querySelectorAll('[data-sample]').forEach(button => {
      const active = Boolean(currentSample && button.dataset.sample === currentSample.id);
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function emptyResult(edited) {
    currentResult = null;
    $('result').innerHTML = '<div class="empty-result"><div class="empty-symbol" aria-hidden="true">' + (edited ? '↻' : 'Ⅱ') + '</div><h3>' + (edited ? 'Your message changed' : 'A little clarity starts here') + '</h3><p>' + (edited ? 'Review again to see clues for the current text. The previous result has been cleared.' : 'Add a message or choose a synthetic example. You’ll see the matched wording, what it may mean, and a way to verify.') + '</p><span class="neutral-pill">No verdict before a review</span></div>';
  }

  function loadSample(id, runReview = false, focusResult = false) {
    currentSample = samples.find(sample => sample.id === id);
    if (!currentSample) return;
    $('message').value = currentSample.text;
    $('form-error').hidden = true;
    $('message').removeAttribute('aria-invalid');
    updateInputMeta();
    if (runReview) review(focusResult); else emptyResult(false);
  }

  function review(focusResult = false) {
    const result = engine.analyze($('message').value);
    if (result.error) {
      $('form-error').textContent = result.error;
      $('form-error').hidden = false;
      $('message').setAttribute('aria-invalid', 'true');
      emptyResult(false);
      $('message').focus();
      return;
    }
    $('form-error').hidden = true;
    $('message').removeAttribute('aria-invalid');
    currentResult = result;
    renderResult();
    if (focusResult) {
      $('result-title').focus({ preventScroll: true });
      if (window.matchMedia('(max-width:740px)').matches) $('result-heading').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  function renderResult() {
    const r = currentResult;
    const related = r.patterns.map(id => patterns.find(pattern => pattern.id === id));
    const evidence = r.evidence.length ? '<ul class="evidence-list">' + r.evidence.map(item => '<li><span class="clue-dot" aria-hidden="true"></span><div><h4>' + escape(item.label) + '</h4><q>' + escape(item.quote) + '</q><p>' + escape(item.why) + '</p></div></li>').join('') + '</ul>' : '<p class="muted">No supported English keyword matched. Other languages, unfamiliar wording and URL-only inputs remain unassessed.</p>';
    const urlSection = '<details class="result-details"><summary><span>URL details</span> <span class="detail-meta">' + (r.urls.length ? r.urls.length + ' parsed · ' : '') + 'reputation not checked</span></summary><p>Provider state: not configured. Local parsing only. No destination is opened or redirect followed. The address shown here is not a verification route.</p>' + (r.urls.length ? r.urls.map(url => '<div class="url-item"><span class="url-label">PARSED HOSTNAME · PLAIN TEXT</span><code dir="ltr">' + escape(url.host || 'Could not parse address') + '</code><span class="neutral-pill">Not checked</span>' + (url.hiddenParts ? '<small>Path, query, fragment and user information are omitted.</small>' : '') + url.observations.map(item => '<p class="url-observation">' + escape(item) + '</p>').join('') + '</div>').join('') : '<p>No supported URL was parsed. Shortened, obfuscated and other URL formats may be missed.</p>') + '</details>';
    const nextAction = related.length ? related[0].next : 'Open a familiar official app, or use a phone number or website you already know independently of this message. Confirm the request there before responding.';
    $('result').innerHTML =
      '<div class="result-banner ' + r.status + '"><div class="result-icon" aria-hidden="true">' + (r.status === 'pause' ? '!' : '?') + '</div><div><span class="result-kicker">' + (currentSample ? 'SYNTHETIC WALKTHROUGH' : 'LOCAL RULE REVIEW') + '</span><h3 tabindex="-1" id="result-title">' + escape(r.title) + '</h3><p>' + escape(r.summary) + '</p></div></div>' +
      '<div class="result-body"><div class="evidence-heading"><h3>Clues in the wording</h3><span>' + r.evidence.length + ' MATCH' + (r.evidence.length === 1 ? '' : 'ES') + '</span></div>' + evidence +
      (related.length ? '<div class="related-patterns"><span class="small-label">POSSIBLE PATTERN' + (related.length === 1 ? '' : 'S') + '</span>' + related.map(pattern => '<button class="pattern-link" data-pattern="' + pattern.id + '">' + escape(pattern.title) + '<span aria-hidden="true">↗</span></button>').join('') + '</div>' : '') +
      urlSection +
      '<section class="next-step"><p class="small-label">03 / YOUR NEXT STEP</p><h3>Verify through a separate route.</h3><p>' + escape(nextAction) + '</p><details class="checklist"><summary>Make a verification plan</summary><p>This is a checklist for you. Nothing is submitted or verified by the app.</p><label><input type="checkbox" data-check="pause"> I will pause before replying, paying or following a link.</label><label><input type="checkbox" data-check="route"> I have an app, website or number found independently.</label><label><input type="checkbox" data-check="confirm"> I will confirm the request through that route.</label><div id="checklist-status" role="status">0 of 3 planning steps checked</div></details></section>' +
      '<details class="recovery"><summary>Already clicked, paid or shared information?</summary><p>If you shared a password, change it through the real service. If you sent money, contact your payment provider through its official app or a number you already know. If software was downloaded, use trusted security support.</p><p><a href="https://consumer.ftc.gov/articles/what-do-if-you-were-scammed" target="_blank" rel="noopener noreferrer">FTC recovery guidance (United States) ↗</a></p><p>This prototype does not file a report, contact a provider or reverse a payment. Reporting routes differ by country.</p></details>' +
      '<p class="result-limit">English rules only. Quotes, negation and context can cause mistakes. Accuracy is unmeasured; there is no safety verdict.</p><button id="download-review" class="download-button">↓ Download review <span>Message and URLs excluded</span></button></div>';
  }

  function renderLibrary() {
    const query = $('library-search').value.trim().toLowerCase();
    const category = $('category').value;
    const visible = patterns.filter(pattern => (category === 'all' || pattern.category === category) && [pattern.title, pattern.short, pattern.mechanism, pattern.category, ...pattern.signs].join(' ').toLowerCase().includes(query));
    $('library-count').textContent = visible.length + ' of 5 patterns';
    $('library-grid').innerHTML = visible.length ? visible.map(pattern => '<article class="card library-card"><div class="library-card-top"><span>' + pattern.number + '</span><span>' + escape(pattern.category) + '</span></div><h2>' + escape(pattern.title) + '</h2><p class="pattern-short">' + escape(pattern.short) + '</p><p>' + escape(pattern.mechanism) + '</p><button class="pattern-open" data-pattern="' + pattern.id + '">Understand this pattern <span aria-hidden="true">↗</span></button></article>').join('') : '<div class="no-results"><h2>No patterns match</h2><p>Try a broader word, or reset the search and category.</p><button id="reset-filters" class="outline-button">Reset filters</button></div>';
  }

  function openPattern(id) {
    const p = patterns.find(pattern => pattern.id === id);
    if (!p) return;
    $('dialog-content').innerHTML = '<p class="eyebrow">PATTERN ' + p.number + ' / ' + escape(p.category.toUpperCase()) + '</p><h2 id="dialog-title">' + escape(p.title) + '</h2><p class="dialog-intro">' + escape(p.short) + '</p><h3>How the setup works</h3><p>' + escape(p.mechanism) + '</p><h3>What to notice</h3><ul>' + p.signs.map(sign => '<li>' + escape(sign) + '</li>').join('') + '</ul><div class="dialog-action"><h3>How to verify</h3><p>' + escape(p.next) + '</p></div><p class="muted">' + escape(p.caveat) + '</p><div class="source-block"><span class="small-label">OFFICIAL GUIDANCE · US CONTEXT</span><a href="' + p.source + '" target="_blank" rel="noopener noreferrer">' + escape(p.sourceTitle) + ' ↗</a><small>Source review: 10–11 October 2026. Editorial draft v0.1; no user corrections recorded. Educational paraphrase; local rules are unvalidated.</small></div><button class="primary-button" data-try="' + p.id + '">Try the synthetic example <span aria-hidden="true">→</span></button>';
    $('pattern-dialog').showModal();
    $('close-dialog').focus();
  }

  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
  }

  function renderProviderFixture() {
    const fixture = window.PauseData.providerFixtures.find(item => item.id === $('provider-state').value);
    $('provider-fixture').innerHTML = '<span class="sample-label">SIMULATED FIXTURE · NOT YOUR INPUT</span><h3>' + escape(fixture.title) + '</h3><p>' + escape(fixture.description) + '</p><code>fixture.example</code><small>Invented reference address. No provider request or lookup has occurred. Your actual review stays “not checked”.</small>';
  }

  document.addEventListener('click', event => {
    const view = event.target.closest('[data-view]');
    if (view) showView(view.dataset.view);
    const sample = event.target.closest('[data-sample]');
    if (sample) loadSample(sample.dataset.sample, true, true);
    const pattern = event.target.closest('[data-pattern]');
    if (pattern) openPattern(pattern.dataset.pattern);
    const trySample = event.target.closest('[data-try]');
    if (trySample) { $('pattern-dialog').close(); showView('check'); loadSample(trySample.dataset.try, true, true); }
    if (event.target.closest('#reset-filters')) { $('library-search').value = ''; $('category').value = 'all'; renderLibrary(); $('library-search').focus(); }
    if (event.target.closest('#download-review') && currentResult) {
      const blob = new Blob([engine.makeSummary(currentResult, { synthetic: Boolean(currentSample) })], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'pause-review.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Review prepared for download. Message text and URLs are excluded.');
    }
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-check]')) {
      const checked = document.querySelectorAll('[data-check]:checked').length;
      $('checklist-status').textContent = checked === 3 ? 'Plan ready. Complete the verification yourself; the message is still unverified.' : checked + ' of 3 planning steps checked';
    }
  });
  $('message').addEventListener('input', () => { currentSample = null; updateInputMeta(); emptyResult(true); $('form-error').hidden = true; $('message').removeAttribute('aria-invalid'); });
  $('message').addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') review(true); });
  $('analyze').addEventListener('click', () => review(true));
  $('clear').addEventListener('click', () => { $('message').value = ''; currentSample = null; updateInputMeta(); emptyResult(false); $('form-error').hidden = true; $('message').removeAttribute('aria-invalid'); $('message').focus(); });
  $('library-search').addEventListener('input', renderLibrary);
  $('category').addEventListener('change', renderLibrary);
  $('provider-state').addEventListener('change', renderProviderFixture);
  $('close-dialog').addEventListener('click', () => $('pattern-dialog').close());
  document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); showView('check'); });
  $('sample-buttons').innerHTML = samples.map(sample => '<button data-sample="' + sample.id + '" aria-pressed="false">' + escape(sample.label) + '</button>').join('');
  loadSample('parcel', true);
  renderLibrary();
  renderProviderFixture();
})();
