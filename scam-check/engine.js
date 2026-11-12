(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PauseEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_LENGTH = 6000;
  const rules = [
    { id: 'urgency', label: 'Pressure to act quickly', re: /\b(?:urgent|immediately|act now|last chance|within \d+ (?:minutes?|hours?))\b/i, why: 'Time pressure can discourage checking. Urgency also occurs in genuine messages.' },
    { id: 'credentials', label: 'Request involving a secret', re: /\b(?:share|send|provide|enter|confirm|verify|reply with)\b[^.!?\n]{0,45}\b(?:password|otp|one[- ]time (?:code|password)|verification code|pin|card details)\b/i, why: 'A request for a password, code or payment details needs independent verification. This rule cannot understand all context or negation.' },
    { id: 'money', label: 'Money or a fee is mentioned', re: /\b(?:pay|payment|fee|deposit|transfer|gift cards?|cryptocurrency|crypto)\b/i, why: 'A payment reference is a clue to inspect, not evidence of fraud by itself.' },
    { id: 'account', label: 'Account access is mentioned', re: /\b(?:account|bank|wallet|sign[- ]in|log[- ]in)\b/i, why: 'Account language supplies context; it does not identify the sender.' },
    { id: 'verify', label: 'Verification language', re: /\b(?:verify|confirm|update|unlock|reactivate)\b/i, why: 'Verification wording does not establish a genuine request. Use a route you already trust to check the context.' },
    { id: 'parcel', label: 'Delivery or parcel context', re: /\b(?:parcel|delivery|package|courier|shipment)\b/i, why: 'Delivery language can be used to make a payment request seem routine.' },
    { id: 'prize', label: 'A prize or winnings are mentioned', re: /\b(?:prize|lottery|sweepstakes|winner|won|winnings)\b/i, why: 'An apparent reward can be used to motivate an upfront payment.' },
    { id: 'job', label: 'Job or recruitment context', re: /\b(?:job|recruiter|recruitment|hiring|employment|work from home)\b/i, why: 'A job opportunity paired with a payment request deserves a separate check.' },
    { id: 'support', label: 'Technical support context', re: /\b(?:tech(?:nical)? support|computer|device|virus|infected|security team)\b/i, why: 'An unsolicited support claim does not establish who is contacting you.' },
    { id: 'remote', label: 'Remote access is mentioned', re: /\b(?:remote access|remote control|screen sharing|share your screen|install anydesk|install teamviewer)\b/i, why: 'Remote access may expose your device and information. A keyword match cannot establish the purpose of the request.' }
  ];
  function urlSpans(text) {
    return Array.from(text.matchAll(/(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]+)(?![a-z0-9-]|\.[a-z0-9])(?:[/?#][^\s<>"']*)?/gi));
  }
  function inspectUrls(text) {
    const candidates = urlSpans(text).map(match => match[0]);
    const seen = new Set();
    return candidates.map(value => {
      let trimmed = value.replace(/[.,;!?)}]+$/, '');
      const openingBrackets = (trimmed.match(/\[/g) || []).length;
      let closingBrackets = (trimmed.match(/\]/g) || []).length;
      while (trimmed.endsWith(']') && closingBrackets > openingBrackets) { trimmed = trimmed.slice(0, -1); closingBrackets--; }
      return trimmed;
    }).filter(value => {
      if (seen.has(value)) return false;
      seen.add(value); return true;
    }).map(value => {
      try {
        const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
        const observations = [];
        if (url.username || url.password) observations.push('Text before @ is not the destination. The displayed hostname is the actual parsed destination.');
        if (url.hostname.includes('xn--')) observations.push('This hostname contains an encoded internationalized label. Its appearance alone cannot establish trust.');
        if (url.protocol === 'http:') observations.push('This address uses HTTP. Encryption status does not determine whether a sender is trustworthy.');
        if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) || url.hostname.startsWith('[')) observations.push('This address uses an IP address as its host. Ownership has not been checked.');
        return { host: url.hostname, protocol: url.protocol, hiddenParts: Boolean(url.pathname !== '/' || url.search || url.hash || url.username || url.password), observations, status: 'Not checked' };
      } catch (_) {
        return { host: null, protocol: null, hiddenParts: true, observations: ['A URL-like string could not be parsed. Do not treat a failed parse as reassurance.'], status: 'Not checked' };
      }
    });
  }
  function analyze(text) {
    if (typeof text !== 'string' || !text.trim()) return { error: 'Add a message or URL to review, or choose a sample.' };
    if (text.length > MAX_LENGTH) return { error: 'Use 6,000 characters or fewer. Remove private details before reviewing.' };
    // URL wording is not prose from the sender. Preserve offsets but exclude
    // recognized addresses from lexical clues (e.g. "verify" in a hostname).
    let prose = text;
    for (const span of urlSpans(text)) prose = prose.slice(0, span.index) + '\n'.repeat(span[0].length) + prose.slice(span.index + span[0].length);
    const evidence = rules.flatMap(rule => {
      const match = prose.match(rule.re);
      return match ? [{ id: rule.id, label: rule.label, quote: match[0], index: match.index, why: rule.why }] : [];
    });
    const has = id => evidence.some(item => item.id === id);
    const urls = inspectUrls(text);
    const patterns = [];
    if (has('account') && (has('credentials') || (has('verify') && urls.length))) patterns.push('account');
    if (has('parcel') && has('money')) patterns.push('parcel');
    if (has('prize') && has('money')) patterns.push('prize');
    if (has('job') && has('money')) patterns.push('job');
    if (has('support') && has('remote')) patterns.push('support');
    const status = patterns.length || has('credentials') || has('remote') ? 'pause' : evidence.length ? 'limited' : 'unknown';
    return {
      status,
      title: status === 'pause' ? 'Reasons to pause' : status === 'limited' ? 'A few clues, no conclusion' : 'Not enough evidence',
      summary: status === 'pause' ? 'This wording matches clues worth checking independently. It does not prove the message is a scam.' : status === 'limited' ? 'The local rules found some language to inspect, but cannot establish whether this request is genuine.' : 'The local rules cannot assess this input. No matches does not mean it is safe.',
      evidence, patterns, urls,
      capability: 'English keyword rules only. No sender verification, live URL reputation, attachment, call or transaction analysis.',
      limits: 'Rules may flag warnings or quoted text and may miss new, indirect, obfuscated or non-English scams. Detection accuracy has not been measured.'
    };
  }
  function makeSummary(result, options = {}) {
    if (!result || result.error) return '';
    return [
      'PAUSE — LOCAL PROTOTYPE REVIEW',
      'Evidence label: ' + (options.synthetic ? 'Synthetic demonstration sample' : 'User-entered text; not independently verified'),
      'Result: ' + result.title,
      result.summary,
      'Clue categories: ' + (result.evidence.map(e => e.label).join('; ') || 'No local rule matches'),
      'Pattern categories: ' + (result.patterns.join(', ') || 'No supported pattern combination'),
      'URL reputation: Not checked. ' + result.urls.length + ' URL-like item(s) parsed.',
      'Next step: Open a familiar official app or use a phone number or website you already know independently of the message. Verify the request there.',
      'This file intentionally excludes message text, evidence quotes and URLs.',
      result.capability, result.limits,
      'Educational prototype, not a validated detector or report to an authority.'
    ].join('\n');
  }
  return { analyze, inspectUrls, makeSummary, MAX_LENGTH };
});
