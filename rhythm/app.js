(() => {
  'use strict';
  const { patterns, targets, analyze } = window.CopyTryRhythm;
  const $ = id => document.getElementById(id);
  const storeKey = 'copy-try-idea18-journal-v1';
  const state = { pattern: patterns[0], bpm: 80, mode: 'copy', phase: 'idle', taps: [], start: null, result: null, history: [], storageAvailable: true, timers: new Set(), oscillators: new Set(), audio: null, run: 0, armTimer: null };
  function schedule(fn, delay) { const id = setTimeout(() => { state.timers.delete(id); fn(); }, delay); state.timers.add(id); return id; }
  function clearPlayback() { state.run++; state.timers.forEach(clearTimeout); state.timers.clear(); state.oscillators.forEach(o => { try { o.stop(); } catch (_) {} }); state.oscillators.clear(); document.querySelectorAll('.target-dot').forEach(dot => dot.classList.remove('lit')); $('tap-pad').classList.remove('pulse'); }
  function busy() { return ['playing', 'armed', 'recording'].includes(state.phase); }
  function setStep(step) { ['listen','try','reflect'].forEach((name, index) => { $('step-' + name).classList.toggle('current', index === step); $('step-' + name).classList.toggle('done', index < step); }); }
  function updateControls() {
    const locked = busy();
    $('tempo').disabled = locked;
    document.querySelectorAll('input[name="mode"], .pattern-card').forEach(el => { el.disabled = locked; });
    $('sample-attempt').disabled = locked;
    $('retry-attempt').disabled = locked;
    $('play-demo').disabled = state.phase === 'armed' || state.phase === 'recording';
    $('play-demo').innerHTML = state.phase === 'playing' ? '<span aria-hidden="true">■</span> Stop the example' : '<span aria-hidden="true">▶</span> Listen to the example';
    $('start-attempt').hidden = state.phase === 'armed' || state.phase === 'recording';
    $('start-attempt').disabled = state.phase === 'playing';
    $('finish-attempt').hidden = state.phase !== 'recording';
    $('cancel-attempt').hidden = !['armed','recording'].includes(state.phase);
    $('tap-pad').disabled = !['armed','recording'].includes(state.phase);
    $('tap-pad').classList.toggle('armed', ['armed','recording'].includes(state.phase));
    $('recall-mask').hidden = !(state.mode === 'recall' && ['armed','recording'].includes(state.phase));
    $('result').hidden = !state.result || !$('recall-mask').hidden;
    $('target-track').setAttribute('aria-hidden', String(!$('recall-mask').hidden));
    $('pattern-description').style.visibility = $('recall-mask').hidden ? 'visible' : 'hidden';
    $('pattern-description').setAttribute('aria-hidden', String(!$('recall-mask').hidden));
    $('sound-enabled').disabled = locked;
  }
  function resetPad() { $('tap-pad-symbol').textContent = '✦'; $('tap-pad-title').innerHTML = 'A little courage.<br>A few taps.'; $('tap-pad-hint').textContent = 'Start your turn below'; }
  function renderPattern() {
    $('studio-title').textContent = state.pattern.title;
    $('pattern-description').textContent = state.pattern.description;
    $('target-track').innerHTML = '';
    for (let i = 0; i < 4; i++) { const line = document.createElement('i'); line.className = 'beat-mark'; line.style.left = i * 25 + '%'; $('target-track').append(line); }
    state.pattern.beats.forEach((beat, i) => { const dot = document.createElement('span'); dot.className = 'target-dot'; dot.style.left = beat * 25 + '%'; dot.id = 'beat-' + i; dot.title = 'Tap ' + (i + 1) + ' at beat ' + (beat + 1); $('target-track').append(dot); });
    $('target-track').setAttribute('aria-label', state.pattern.beats.length + ' taps at beats ' + state.pattern.beats.map(b => b + 1).join(', '));
    document.querySelectorAll('.pattern-card').forEach(el => { const active = el.dataset.pattern === state.pattern.id; el.setAttribute('aria-pressed', String(active)); el.querySelector('.check').textContent = active ? '✓' : ''; });
    $('session-state').textContent = 'Ready when you are';
    $('attempt-status').textContent = 'Use the pad or Space. Timing begins with your first tap.';
    resetPad(); setStep(0); updateControls();
  }
  patterns.forEach((pattern, i) => {
    const button = document.createElement('button'); button.className = 'pattern-card'; button.dataset.pattern = pattern.id; button.setAttribute('aria-pressed', String(i === 0));
    button.innerHTML = '<span class="pattern-icon" aria-hidden="true">' + pattern.beats.map(() => '<i></i>').join('') + '</span><span><b>' + pattern.title + '</b><small>' + pattern.subtitle + '</small></span><span class="check" aria-hidden="true"></span>';
    button.addEventListener('click', () => { if (busy()) return; state.pattern = pattern; state.phase = 'idle'; renderPattern(); }); $('pattern-options').append(button);
  });
  async function prepareAudio() {
    if (!$('sound-enabled').checked) return false;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio unavailable');
      state.audio ||= new AudioContext();
      if (state.audio.state !== 'running') await state.audio.resume();
      if (state.audio.state !== 'running') throw new Error('Audio blocked');
      $('audio-notice').textContent = 'Original tones generated on this device. No recording or external audio.';
      return true;
    } catch (_) { $('audio-notice').textContent = 'Sound is unavailable in this browser. Follow the visual dots instead.'; return false; }
  }
  function tone(time, accent) {
    if (!state.audio || state.audio.state !== 'running') return;
    const oscillator = state.audio.createOscillator(); const gain = state.audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = accent ? 720 : 530;
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.16, time + .008); gain.gain.exponentialRampToValueAtTime(.001, time + .13);
    oscillator.connect(gain); gain.connect(state.audio.destination); state.oscillators.add(oscillator);
    oscillator.onended = () => { state.oscillators.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(time); oscillator.stop(time + .15);
  }
  async function play() {
    if (state.phase === 'playing') { cancel('Example stopped. Listen again whenever you like.'); return; }
    if (busy()) return;
    clearPlayback(); state.phase = 'playing'; const run = state.run; setStep(0); updateControls();
    $('session-state').textContent = 'Listen for the spaces'; $('attempt-status').textContent = 'Listen first. Then start your turn.';
    const sound = await prepareAudio();
    if (run !== state.run || state.phase !== 'playing') return;
    const times = targets(state.pattern, state.bpm); const startDelay = 200;
    const audioStart = sound ? state.audio.currentTime + startDelay / 1000 : null;
    times.forEach((ms, i) => {
      if (sound) tone(audioStart + ms / 1000, i === 0);
      schedule(() => { $('beat-' + i).classList.add('lit'); $('track-caption').textContent = 'Tap ' + (i + 1) + ' of ' + times.length; schedule(() => $('beat-' + i)?.classList.remove('lit'), 160); }, startDelay + ms);
    });
    schedule(() => { state.phase = 'idle'; $('track-caption').textContent = 'Each orange dot is one tap.'; $('session-state').textContent = 'Your turn to try'; $('attempt-status').textContent = 'Ready? Start your turn, then tap the pattern.'; setStep(1); updateControls(); }, startDelay + 4 * 60000 / state.bpm);
  }
  function startAttempt() {
    if (busy()) return;
    clearPlayback(); state.phase = 'armed'; state.taps = []; state.start = null; setStep(1);
    $('session-state').textContent = state.mode === 'recall' ? 'Try from memory' : 'Copy the pattern';
    $('tap-pad-title').textContent = 'Tap when you’re ready'; $('tap-pad-hint').textContent = 'Tap here or press Space'; $('tap-pad-symbol').textContent = '↗';
    $('attempt-status').textContent = state.mode === 'recall' ? 'The pattern is hidden. Timing begins with your first tap.' : 'No countdown. Your first tap starts the clock.';
    updateControls(); $('tap-pad').focus({ preventScroll: true });
    state.armTimer = schedule(() => cancel('No taps received. Start your turn when you’re ready.'), 30000);
  }
  function tap() {
    if (!['armed','recording'].includes(state.phase)) return;
    const now = performance.now();
    if (state.phase === 'armed') {
      clearTimeout(state.armTimer); state.timers.delete(state.armTimer); state.start = now; state.phase = 'recording';
      const duration = Math.max(...targets(state.pattern, state.bpm)) + 60000 / state.bpm;
      schedule(finishAttempt, duration); updateControls();
    }
    state.taps.push(now - state.start);
    $('tap-pad-title').textContent = state.taps.length === 1 ? '1 tap' : state.taps.length + ' taps';
    $('tap-pad-symbol').textContent = '•'; $('tap-pad-hint').textContent = 'Keep your own rhythm';
    $('session-state').textContent = 'Capturing your taps'; $('attempt-status').textContent = 'Keep going. This short attempt will finish automatically.';
    $('tap-pad').classList.add('pulse'); schedule(() => $('tap-pad').classList.remove('pulse'), 100);
  }
  function finishAttempt() {
    if (state.phase !== 'recording') return;
    const completed = { id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7), patternId: state.pattern.id, bpm: state.bpm, mode: state.mode, taps: state.taps.slice(), at: new Date().toISOString(), note: '', sample: false };
    clearPlayback(); state.phase = 'result'; state.result = completed; state.history.unshift(completed); state.history = state.history.slice(0, 12); saveHistory();
    resetPad(); $('session-state').textContent = 'One attempt, one discovery'; $('attempt-status').textContent = 'Attempt complete. Explore your timing below, then try again.';
    updateControls(); setStep(2); renderResult(completed); renderHistory(); $('result').focus({ preventScroll: true });
  }
  function cancel(message = 'Attempt cancelled. Start again when you’re ready.') {
    clearPlayback(); state.phase = 'idle'; state.taps = []; state.start = null; resetPad();
    $('session-state').textContent = 'Ready when you are'; $('attempt-status').textContent = message; $('track-caption').textContent = 'Each orange dot is one tap.'; setStep(0); updateControls();
  }
  function resultDescription(analysis) {
    if (!analysis.countMatches) return analysis.taps.length + ' of ' + analysis.expected.length + ' expected taps · ' + (analysis.missing ? analysis.missing + ' fewer' : analysis.extra + ' extra');
    return analysis.meanIntervalError + ' ms average gap difference';
  }
  function drawComparison(id, times, max) { $(id).innerHTML = ''; times.forEach((t, index) => { const dot = document.createElement('span'); dot.className = 'compare-dot'; dot.style.left = Math.min(100, t / max * 100) + '%'; dot.title = 'Tap ' + (index + 1) + ': ' + Math.round(t) + ' ms'; $(id).append(dot); }); }
  function renderResult(result) {
    const pattern = patterns.find(p => p.id === result.patternId); const info = analyze(pattern, result.bpm, result.taps);
    $('result').hidden = false; $('result-origin').textContent = result.sample ? 'SYNTHETIC WALKTHROUGH · NOT YOUR PERFORMANCE' : 'YOUR BROWSER TAP TIMING · ' + (result.mode === 'recall' ? 'RECALL ATTEMPT' : 'COPY ATTEMPT');
    $('result-title').textContent = result.sample ? 'What could feedback look like?' : 'A closer look at your attempt.';
    $('result-kind').textContent = result.sample ? 'Sample result' : info.countMatches ? 'Count matches' : 'Different tap count';
    $('comparison-input-label').textContent = result.sample ? 'Synthetic taps' : 'Your taps';
    $('result-tempo').textContent = result.bpm + ' BPM';
    $('result-summary').textContent = pattern.title + ' · ' + (info.countMatches ? info.taps.length + ' taps. The gaps differed from the example by ' + info.meanIntervalError + ' ms on average (absolute difference).' : 'Expected ' + info.expected.length + ' taps, received ' + info.taps.length + '. Timing comparison is withheld because the tap counts differ.');
    if (!info.countMatches) $('next-step-text').textContent = info.missing ? 'Listen once more and count each sound. Try to include all ' + info.expected.length + ' taps on the next attempt.' : 'Try one press or touch for each sound. Aim for ' + info.expected.length + ' taps before comparing the spaces.';
    else if (Math.abs(info.worst.error) < 80) $('next-step-text').textContent = result.mode === 'recall' ? 'The gaps were close in this attempt. Try another pattern to explore a different rhythm.' : 'The gaps were close in this attempt. Try the same pattern from memory and notice what changes.';
    else $('next-step-text').textContent = 'The space from tap ' + info.worst.from + ' to ' + info.worst.to + ' was ' + Math.round(Math.abs(info.worst.error)) + ' ms ' + (info.worst.error > 0 ? 'longer' : 'shorter') + '. Listen to that gap, then try it a little ' + (info.worst.error > 0 ? 'shorter' : 'longer') + '.';
    const max = Math.max(4 * 60000 / result.bpm, ...info.taps) * 1.03;
    drawComparison('compare-target', info.expected, max); drawComparison('compare-attempt', info.taps, max);
    $('evidence-rows').innerHTML = '';
    for (let i = 0; i < Math.max(info.expected.length, info.taps.length); i++) {
      const row = document.createElement('tr'); const delta = info.deltas[i];
      const cells = [String(i + 1), info.expected[i] === undefined ? '—' : Math.round(info.expected[i]) + ' ms', info.taps[i] === undefined ? '—' : Math.round(info.taps[i]) + ' ms', !info.countMatches ? 'Not paired' : i === 0 ? 'Start anchor' : Math.abs(delta) < .5 ? 'Same time' : Math.round(Math.abs(delta)) + ' ms ' + (delta > 0 ? 'later' : 'earlier')];
      cells.forEach(content => { const cell = document.createElement('td'); cell.textContent = content; row.append(cell); }); $('evidence-rows').append(row);
    }
    $('reflection-note').value = result.note || ''; $('reflection-note').disabled = result.sample; $('save-note').disabled = result.sample;
    $('note-status').textContent = result.sample ? 'This sample is not saved to your journal. Try the exercise to add your own attempt.' : '';
  }
  function storageNotice() { $('storage-notice').textContent = state.storageAvailable ? 'Up to 12 completed attempts stay in this browser. Nothing is uploaded.' : 'Browser storage is unavailable. This journal lasts only until you close or reload this page. Nothing is uploaded.'; }
  function saveHistory() { try { localStorage.setItem(storeKey, JSON.stringify(state.history)); state.storageAvailable = true; } catch (_) { state.storageAvailable = false; } storageNotice(); }
  function loadHistory() {
    try {
      const raw = localStorage.getItem(storeKey); const parsed = raw ? JSON.parse(raw) : [];
      state.history = Array.isArray(parsed) ? parsed.filter(item => item && patterns.some(p => p.id === item.patternId) && typeof item.id === 'string' && typeof item.at === 'string' && Number.isFinite(Date.parse(item.at)) && Number.isFinite(item.bpm) && item.bpm >= 50 && item.bpm <= 120 && ['copy','recall'].includes(item.mode) && !item.sample && Array.isArray(item.taps) && item.taps.length > 0 && item.taps.length <= 200 && item.taps.every((t, i) => Number.isFinite(t) && t >= 0 && t <= 30000 && (i === 0 || t >= item.taps[i - 1])) && (item.note === undefined || typeof item.note === 'string')).slice(0, 12).map(item => ({ ...item, note: (item.note || '').slice(0, 180) })) : [];
      localStorage.setItem(storeKey, JSON.stringify(state.history));
    } catch (_) { state.storageAvailable = false; state.history = []; }
    storageNotice();
  }
  function renderHistory() {
    $('journal-list').innerHTML = ''; $('clear-history').hidden = !state.history.length;
    if (!state.history.length) { $('journal-list').innerHTML = '<div class="journal-empty"><span aria-hidden="true">↗</span><p><strong>Your first little experiment starts here.</strong>Complete an attempt and its timing will appear here. Sample results don’t count.</p></div>'; return; }
    state.history.forEach((item, index) => {
      const pattern = patterns.find(p => p.id === item.patternId); const info = analyze(pattern, item.bpm, item.taps);
      const row = document.createElement('article'); row.className = 'journal-entry';
      const number = document.createElement('span'); number.className = 'journal-number'; number.textContent = String(state.history.length - index).padStart(2, '0');
      const copy = document.createElement('div'); copy.className = 'journal-copy'; const title = document.createElement('strong'); title.textContent = pattern.title;
      const meta = document.createElement('small'); meta.textContent = new Date(item.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' · ' + item.bpm + ' BPM · ' + (item.mode === 'recall' ? 'From memory' : 'Copy practice');
      copy.append(title, meta); if (item.note) { const note = document.createElement('p'); note.textContent = item.note; copy.append(note); }
      const metric = document.createElement('div'); metric.className = 'journal-metric'; metric.textContent = resultDescription(info); const tag = document.createElement('small'); tag.textContent = 'Browser input observation'; metric.append(tag);
      row.append(number, copy, metric); $('journal-list').append(row);
    });
  }
  $('play-demo').addEventListener('click', play);
  $('start-attempt').addEventListener('click', startAttempt);
  $('finish-attempt').addEventListener('click', finishAttempt);
  $('cancel-attempt').addEventListener('click', () => cancel());
  $('tap-pad').addEventListener('pointerdown', event => { if (event.button !== 0) return; event.preventDefault(); $('tap-pad').focus({ preventScroll: true }); tap(); });
  // Keyboard/assistive activation has detail 0. Pointer clicks already used pointerdown.
  $('tap-pad').addEventListener('click', event => { if (event.detail === 0 && !spaceDown && !enterDown) tap(); });
  let spaceDown = false;
  let enterDown = false;
  document.addEventListener('keydown', event => {
    if (event.code === 'Enter' && event.target === $('tap-pad') && ['armed','recording'].includes(state.phase)) {
      event.preventDefault(); if (event.repeat || enterDown) return; enterDown = true; tap(); return;
    }
    if (event.code !== 'Space') return;
    const target = event.target; if (target !== $('tap-pad') && target.closest('input,textarea,select,button,a,summary,[contenteditable="true"]')) return;
    if (!['armed','recording'].includes(state.phase)) return;
    event.preventDefault(); if (event.repeat || spaceDown) return; spaceDown = true; tap();
  });
  document.addEventListener('keyup', event => { if (event.code === 'Enter') { if (enterDown) event.preventDefault(); enterDown = false; } if (event.code !== 'Space') return; if (spaceDown) event.preventDefault(); spaceDown = false; });
  window.addEventListener('blur', () => { spaceDown = false; enterDown = false; if (['armed','recording'].includes(state.phase)) cancel('Practice paused because the window lost focus. Start again for a clean attempt.'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && busy()) cancel('Practice paused while this tab was hidden. Start again when ready.'); });
  window.addEventListener('pagehide', clearPlayback);
  $('tempo').addEventListener('input', event => { if (busy()) return; state.bpm = Number(event.target.value); $('tempo-value').textContent = state.bpm; });
  document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', () => { if (busy()) return; state.mode = input.value; $('attempt-status').textContent = state.mode === 'recall' ? 'Listen first if you like. The target hides when you start your turn.' : 'Use the pad or Space. Timing begins with your first tap.'; }));
  $('sample-attempt').addEventListener('click', () => {
    if (busy()) return;
    const example = targets(state.pattern, state.bpm); const offsets = [0, 35, 165, 80, 115];
    state.result = { id: 'sample', patternId: state.pattern.id, bpm: state.bpm, mode: 'copy', taps: example.map((t, i) => t + offsets[i]), sample: true, note: '' };
    state.phase = 'result'; setStep(2); renderResult(state.result); $('result').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('result').focus({ preventScroll: true });
  });
  $('retry-attempt').addEventListener('click', () => { if (busy() || !state.result) return; state.pattern = patterns.find(p => p.id === state.result.patternId); state.bpm = state.result.bpm; $('tempo').value = state.bpm; $('tempo-value').textContent = state.bpm; renderPattern(); startAttempt(); $('practice').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('save-note').addEventListener('click', () => { if (!state.result || state.result.sample) return; const entry = state.history.find(item => item.id === state.result.id); if (!entry) { $('note-status').textContent = 'This attempt is no longer in the journal.'; return; } entry.note = $('reflection-note').value.trim(); state.result.note = entry.note; saveHistory(); renderHistory(); $('note-status').textContent = state.storageAvailable ? 'Note saved in this browser.' : 'Note kept for this visit only; browser storage is unavailable.'; });
  $('clear-history').addEventListener('click', () => { state.history = []; saveHistory(); renderHistory(); if (!state.storageAvailable) $('storage-notice').textContent = 'Journal cleared for this visit. Browser storage could not be updated, so previously saved entries may return after reload.'; if (state.result && !state.result.sample) { $('reflection-note').value = ''; $('reflection-note').disabled = true; $('save-note').disabled = true; $('note-status').textContent = state.storageAvailable ? 'Journal cleared. This displayed result is no longer saved.' : 'Cleared for this visit. Browser storage could not be updated.'; } });
  ['about-open','scope-open','vision-open'].forEach(id => $(id).addEventListener('click', () => { if (busy()) cancel('Practice paused while you explore the prototype notes.'); $('about-dialog').showModal(); }));
  $('about-close').addEventListener('click', () => $('about-dialog').close());
  $('about-dialog').addEventListener('click', event => { if (event.target === $('about-dialog')) { const rect = $('about-dialog').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('about-dialog').close(); } });
  loadHistory(); renderPattern(); renderHistory();
})();
