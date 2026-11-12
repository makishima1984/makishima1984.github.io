/* Shop Website Maker: the generator (pure functions).
 * Turns shop details, or a student's details, into ONE self-contained index.html: no scripts, no external files, no trackers.
 * Everything typed in is escaped. Shop links: WhatsApp (wa.me), phone (tel:), and an optional https Google Maps link.
 * Portfolio links: mailto:, https links only, and an optional WhatsApp link.
 * Works in a browser (window.SSM) and in Node (require('./generator.js')).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SSM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LABELS = {
    en: { orderWa: 'Order on WhatsApp', call: 'Call now', directions: 'Directions', orderThis: 'Order this on WhatsApp', items: 'What we offer', info: 'Hours and address', upi: 'Pay by UPI', hello: 'Hi', want: 'I want to order', ask: 'I have a question', saw: 'I saw your website. I want:' },
    hi: { orderWa: 'व्हाट्सऐप पर ऑर्डर करें', call: 'अभी कॉल करें', directions: 'रास्ता देखें', orderThis: 'व्हाट्सऐप पर ऑर्डर करें', items: 'हमारे यहाँ क्या मिलता है', info: 'समय और पता', upi: 'UPI से भुगतान करें', hello: 'नमस्ते', want: 'मुझे यह ऑर्डर करना है', ask: 'मेरा एक सवाल है', saw: 'मैंने आपकी वेबसाइट देखी। मुझे चाहिए:' },
    mr: { orderWa: 'व्हॉट्सअ‍ॅपवर ऑर्डर करा', call: 'आत्ता कॉल करा', directions: 'मार्ग पहा', orderThis: 'व्हॉट्सअ‍ॅपवर ऑर्डर करा', items: 'आमच्याकडे काय मिळते', info: 'वेळ आणि पत्ता', upi: 'UPI ने पैसे भरा', hello: 'नमस्कार', want: 'मला हे ऑर्डर करायचे आहे', ask: 'मला एक प्रश्न आहे', saw: 'मी तुमची वेबसाइट पाहिली. मला हवे आहे:' }
  };

  // Example items carry "(example)" so nobody publishes made-up prices by accident; checkData() warns until they are replaced.
  var PRESETS = {
    sweet: { label: 'Sweet shop / bakery', accent: '#b4232c', tagline: { en: 'Fresh sweets and snacks, made today. Order on WhatsApp.', hi: 'आज की बनी ताज़ी मिठाई और नमकीन। व्हाट्सऐप पर ऑर्डर करें।', mr: 'आजची ताजी मिठाई आणि फरसाण. व्हॉट्सअ‍ॅपवर ऑर्डर करा.' },
      items: [{ name: 'Mithai gift box (example)', price: '₹299', note: 'Assorted sweets, packed for gifting' }, { name: 'Kaju katli, 250 g (example)', price: '₹350', note: '' }, { name: 'Namkeen mix, 500 g (example)', price: '₹180', note: '' }] },
    clothes: { label: 'Clothes shop', accent: '#7a2e8e', tagline: { en: 'Festive sarees, kurtas and kids\' wear. Visit or WhatsApp us.', hi: 'त्योहार की साड़ियाँ, कुर्ते और बच्चों के कपड़े। दुकान पर आएँ या व्हाट्सऐप करें।', mr: 'सणासुदीच्या साड्या, कुर्ते आणि मुलांचे कपडे. दुकानात या किंवा व्हॉट्सअ‍ॅप करा.' },
      items: [{ name: 'Festive saree (example)', price: 'from ₹999', note: 'New arrivals every week' }, { name: 'Kurta set (example)', price: 'from ₹799', note: '' }, { name: 'Kids\' wear (example)', price: 'from ₹499', note: '' }] },
    salon: { label: 'Salon / parlour', accent: '#c2185b', tagline: { en: 'Facials, hair spa and makeup. Book your slot on WhatsApp.', hi: 'फेशियल, हेयर स्पा और मेकअप। व्हाट्सऐप पर अपना स्लॉट बुक करें।', mr: 'फेशियल, हेअर स्पा आणि मेकअप. व्हॉट्सअ‍ॅपवर स्लॉट बुक करा.' },
      items: [{ name: 'Facial (example)', price: 'from ₹499', note: '' }, { name: 'Hair spa (example)', price: 'from ₹699', note: '' }, { name: 'Bridal makeup (example)', price: 'ask for price', note: 'Book early in wedding season' }] },
    mobile: { label: 'Mobile / electronics shop', accent: '#1b5fb5', tagline: { en: 'Phones, accessories and repairs. Honest advice, fair price.', hi: 'फ़ोन, एक्सेसरीज़ और रिपेयर। सही सलाह, सही दाम।', mr: 'फोन, अ‍ॅक्सेसरीज आणि दुरुस्ती. प्रामाणिक सल्ला, योग्य किंमत.' },
      items: [{ name: 'Screen guard + cover (example)', price: '₹199', note: '' }, { name: 'Phone repair (example)', price: 'ask for price', note: 'Free checkup' }, { name: 'New phones (example)', price: 'ask for price', note: 'Exchange offers may apply' }] },
    grocery: { label: 'Grocery / kirana', accent: '#1c7a3d', tagline: { en: 'Daily needs, dry fruits and puja items. Home delivery on WhatsApp orders.', hi: 'रोज़ का सामान, ड्राई फ्रूट्स और पूजा का सामान। व्हाट्सऐप ऑर्डर पर होम डिलीवरी।', mr: 'रोजचा किराणा, सुकामेवा आणि पूजेचे साहित्य. व्हॉट्सअ‍ॅप ऑर्डरवर घरपोच डिलिव्हरी.' },
      items: [{ name: 'Monthly grocery pack (example)', price: 'send your list', note: '' }, { name: 'Dry fruits box (example)', price: '₹599', note: '' }, { name: 'Puja items kit (example)', price: '₹249', note: '' }] },
    other: { label: 'Other', accent: '#12355b', tagline: { en: 'Order on WhatsApp.', hi: 'व्हाट्सऐप पर ऑर्डर करें।', mr: 'व्हॉट्सअ‍ॅपवर ऑर्डर करा.' }, items: [{ name: 'Item 1 (example)', price: '', note: '' }] }
  };

  // Student portfolio: example lines carry "(example)" for the same reason; a portfolio must never ship with made-up work.
  var PORTFOLIO_EXAMPLE = {
    accent: '#12355b', headline: 'Final-year student looking for a data or software role (example)',
    about: 'Two lines about you: what you study, what you like building, and the kind of role you want. (example)',
    skills: 'Python, SQL, Excel, Git',
    projects: [{ name: 'Project name (example)', link: '', note: 'What it does, what you did, and a result with a number.' }],
    experience: [{ role: 'Intern (example)', org: 'Company, Jan to Mar 2026', note: 'One line on what you did and what changed.' }],
    education: [{ degree: 'B.Tech Computer Science (example)', school: 'Your college', year: '2023-2027' }],
    achievements: [{ text: 'Won a case competition (example)' }]
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeHttps(u) { try { var x = new URL(String(u || '').trim()); return x.protocol === 'https:' ? x.href : ''; } catch (e) { return ''; } }
  function safeColor(c, def) { return /^#[0-9a-fA-F]{6}$/.test(String(c || '')) ? String(c) : (def || '#b4232c'); }
  function textOn(hex) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1d1d1f' : '#ffffff'; }
  function safeUpi(u) { u = String(u || '').trim(); return /^[A-Za-z0-9._-]{2,}@[A-Za-z0-9]{2,}$/.test(u) ? u : ''; }

  function normalizeWhatsApp(input) {
    var n = String(input == null ? '' : input).replace(/\D/g, '');
    if (n.length === 11 && n[0] === '0') n = n.slice(1);
    if (n.length === 10) n = '91' + n;
    if (n.length < 11 || n.length > 15) return { ok: false, digits: n, reason: 'Enter the number with country code, for example 98765 43210 or +91 98765 43210.' };
    if (/^(\d)\1+$/.test(n.slice(2))) return { ok: false, digits: n, reason: 'This looks like a placeholder number (all the same digit). Use the real one.' };
    return { ok: true, digits: n };
  }

  function checkData(d) {
    var out = [];
    if (!String(d.name || '').trim()) out.push({ level: 'error', msg: 'Shop name is missing.' });
    var w = normalizeWhatsApp(d.whatsapp);
    if (!w.ok) out.push({ level: 'error', msg: 'WhatsApp number: ' + w.reason });
    var items = (d.items || []).filter(function (i) { return String(i.name || '').trim(); });
    if (!items.length) out.push({ level: 'error', msg: 'Add at least one item or service.' });
    var ex = items.filter(function (i) { return /\(example\)/i.test(i.name); }).length;
    if (ex) out.push({ level: 'warn', msg: ex + ' item(s) still say "(example)". Replace them with the shop\'s real items and prices before publishing.' });
    if (items.some(function (i) { return !String(i.price || '').trim(); })) out.push({ level: 'warn', msg: 'Some items have no price. "ask for price" is fine, but blank looks unfinished.' });
    if (d.mapsLink && !safeHttps(d.mapsLink)) out.push({ level: 'warn', msg: 'The Maps link must start with https:// (it was ignored).' });
    if (d.upi && !safeUpi(d.upi)) out.push({ level: 'warn', msg: 'UPI ID looks wrong (expected name@bank). It was ignored.' });
    if (d.accent && !/^#[0-9a-fA-F]{6}$/.test(d.accent)) out.push({ level: 'warn', msg: 'Colour must look like #b4232c. The default was used.' });
    if (!String(d.address || '').trim() && !String(d.hours || '').trim()) out.push({ level: 'warn', msg: 'No address or hours. Customers will ask. Add at least one.' });
    return out;
  }

  function buildSite(d, opts) {
    opts = opts || {};
    var lang = LABELS[d.lang] ? d.lang : 'en', L = LABELS[lang];
    var name = String(d.name || '').trim();
    if (!name) throw new Error('shop name is missing');
    var w = normalizeWhatsApp(d.whatsapp);
    if (!w.ok) throw new Error('invalid WhatsApp number: ' + w.reason);
    var accent = safeColor(d.accent, '#b4232c'), ink = textOn(accent);
    var year = opts.year || new Date().getFullYear();
    var wa = function (text) { return 'https://wa.me/' + w.digits + '?text=' + encodeURIComponent(text); };
    var maps = safeHttps(d.mapsLink), upi = safeUpi(d.upi);
    var tagline = String(d.tagline || '').trim();
    var items = (d.items || []).filter(function (i) { return String(i.name || '').trim(); });
    var desc = tagline || name;

    var ld = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: name, description: desc, telephone: '+' + w.digits };
    if (String(d.address || '').trim()) ld.address = { '@type': 'PostalAddress', streetAddress: String(d.address).trim() };
    if (maps) ld.hasMap = maps;
    var ldJson = JSON.stringify(ld).replace(/</g, '\\u003c');

    var itemsHtml = items.map(function (it) {
      var price = String(it.price || '').trim();
      var msg = L.hello + ' ' + name + ', ' + L.want + ': ' + it.name + (price ? ' (' + price + ')' : '');
      return '<div class="item"><b>' + esc(it.name) + '</b>' + (price ? '<span class="price">' + esc(price) + '</span>' : '') + (String(it.note || '').trim() ? '<small>' + esc(it.note) + '</small>' : '') +
        '<a href="' + esc(wa(msg)) + '" target="_blank" rel="noopener">' + esc(L.orderThis) + '</a></div>';
    }).join('\n');

    var infoParts = [];
    if (String(d.hours || '').trim()) infoParts.push('<div>' + esc(d.hours) + '</div>');
    if (String(d.address || '').trim()) infoParts.push('<div class="muted">' + esc(d.address) + '</div>');
    if (upi) infoParts.push('<div class="muted">' + esc(L.upi) + ': <b>' + esc(upi) + '</b></div>');

    var css = ':root{--c:' + accent + ';--on:' + ink + ';--ink:#1d1d1f;--muted:#5f6368;--bg:#fffaf3;--line:#eadfce}*{box-sizing:border-box}' +
      'body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Devanagari","Mukta",sans-serif;color:var(--ink);background:var(--bg);line-height:1.5}' +
      '.wrap{max-width:720px;margin:0 auto;padding:0 16px}header{background:var(--c);color:var(--on);padding:26px 0 20px}header h1{margin:0;font-size:28px;line-height:1.2}header p{margin:6px 0 0;opacity:.92}' +
      '.offer{background:#f5a623;color:#2b1600;font-weight:700;text-align:center;padding:10px 16px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}' +
      '.btn{flex:1 1 160px;text-align:center;padding:13px 14px;border-radius:10px;font-weight:700;text-decoration:none}.wa{background:#1f9d55;color:#fff}.call{background:#fff;color:var(--c);border:2px solid var(--c)}.map{background:#fff;color:var(--ink);border:2px solid var(--line)}' +
      'h2{font-size:20px;margin:26px 0 10px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.item{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px}' +
      '.item b{font-size:16px}.price{color:var(--c);font-weight:800}.item small{color:var(--muted)}.item a{margin-top:auto;font-size:14px;color:#1f7a45;font-weight:700;text-decoration:none}' +
      '.info{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}.muted{color:var(--muted)}footer{text-align:center;color:var(--muted);font-size:13px;padding:26px 0 90px}' +
      '.float{position:fixed;right:16px;bottom:16px;background:#1f9d55;color:#fff;padding:14px 18px;border-radius:30px;font-weight:800;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)}';

    var html = '<!doctype html>\n<html lang="' + lang + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(name) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n<meta name="theme-color" content="' + accent + '">\n' +
      '<meta property="og:type" content="website">\n<meta property="og:title" content="' + esc(name) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n' +
      '<script type="application/ld+json">' + ldJson + '</script>\n<style>' + css + '</style>\n</head>\n<body>\n' +
      (String(d.offer || '').trim() ? '<div class="offer">' + esc(d.offer) + '</div>\n' : '') +
      '<header><div class="wrap"><h1>' + esc(name) + '</h1>' + (tagline ? '<p>' + esc(tagline) + '</p>' : '') + '</div></header>\n<main class="wrap">\n<div class="actions">\n' +
      '<a class="btn wa" href="' + esc(wa(L.hello + ' ' + name + ', ' + L.saw)) + '" target="_blank" rel="noopener">' + esc(L.orderWa) + '</a>\n' +
      '<a class="btn call" href="tel:+' + w.digits + '">' + esc(L.call) + '</a>\n' + (maps ? '<a class="btn map" href="' + esc(maps) + '" target="_blank" rel="noopener">' + esc(L.directions) + '</a>\n' : '') + '</div>\n' +
      '<h2>' + esc(L.items) + '</h2>\n<div class="grid">\n' + itemsHtml + '\n</div>\n' +
      (infoParts.length ? '<h2>' + esc(L.info) + '</h2>\n<div class="info">' + infoParts.join('') + '</div>\n' : '') + '</main>\n' +
      '<footer>© ' + year + ' ' + esc(name) + (String(d.madeBy || '').trim() ? ' · ' + esc(d.madeBy) : '') + '</footer>\n' +
      '<a class="float" href="' + esc(wa(L.hello + ' ' + name + ', ' + L.ask)) + '" target="_blank" rel="noopener">WhatsApp</a>\n</body>\n</html>\n';
    return html;
  }

  function safeEmail(e) { e = String(e || '').trim(); return /^[^\s@<>"']+@[^\s@<>"']+\.[A-Za-z]{2,}$/.test(e) ? e : ''; }
  function filled(list, key) { return (list || []).filter(function (x) { return String(x[key] || '').trim(); }); }
  function portfolioText(d) {
    var parts = [d.name, d.headline, d.about, d.skills, d.city];
    ['projects', 'experience', 'education', 'achievements'].forEach(function (k) { (d[k] || []).forEach(function (x) { Object.keys(x).forEach(function (f) { parts.push(x[f]); }); }); });
    return parts.join('\n');
  }

  function checkPortfolio(d) {
    var out = [], text = portfolioText(d);
    if (!String(d.name || '').trim()) out.push({ level: 'error', msg: 'Student name is missing.' });
    var email = String(d.email || '').trim(), phone = String(d.whatsapp || '').trim();
    if (email && !safeEmail(email)) out.push({ level: 'error', msg: 'Email looks wrong (expected name@site.com).' });
    if (phone && !normalizeWhatsApp(phone).ok) out.push({ level: 'error', msg: 'WhatsApp number: ' + normalizeWhatsApp(phone).reason });
    if (!safeEmail(email) && !phone && !safeHttps(d.linkedin)) out.push({ level: 'error', msg: 'Add at least one way to reach the student: email, LinkedIn or WhatsApp.' });
    if (!filled(d.projects, 'name').length && !filled(d.experience, 'role').length) out.push({ level: 'error', msg: 'Add at least one project or one job.' });
    var ex = (text.match(/\(example\)/gi) || []).length;
    if (ex) out.push({ level: 'warn', msg: ex + ' line(s) still say "(example)". Replace them with the student\'s real work before publishing.' });
    [['linkedin', 'LinkedIn link'], ['github', 'GitHub link'], ['resumeLink', 'Resume link']].forEach(function (p) { if (d[p[0]] && !safeHttps(d[p[0]])) out.push({ level: 'warn', msg: p[1] + ' must start with https:// (it was ignored).' }); });
    (d.projects || []).forEach(function (p) { if (p.link && !safeHttps(p.link)) out.push({ level: 'warn', msg: 'Project link for "' + (p.name || 'a project') + '" must start with https:// (it was ignored).' }); });
    if (phone) out.push({ level: 'warn', msg: 'A phone number on a public page attracts spam. An email address alone is usually enough.' });
    if (/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/.test(text) || /\b[A-Z]{5}\d{4}[A-Z]\b/.test(text)) out.push({ level: 'warn', msg: 'This looks like an Aadhaar or PAN number. Remove it: never put ID numbers on a public page.' });
    if (/\b(date of birth|dob|father'?s name|mother'?s name)\b/i.test(text)) out.push({ level: 'warn', msg: 'Remove date of birth and parents\' names: employers don\'t need them, and scammers use them.' });
    if (d.accent && !/^#[0-9a-fA-F]{6}$/.test(d.accent)) out.push({ level: 'warn', msg: 'Colour must look like #12355b. The default was used.' });
    return out;
  }

  function buildPortfolio(d, opts) {
    opts = opts || {};
    var name = String(d.name || '').trim();
    if (!name) throw new Error('student name is missing');
    var accent = safeColor(d.accent, '#12355b'), ink = textOn(accent), year = opts.year || new Date().getFullYear();
    var headline = String(d.headline || '').trim(), about = String(d.about || '').trim(), city = String(d.city || '').trim();
    var email = safeEmail(d.email), linkedin = safeHttps(d.linkedin), github = safeHttps(d.github), resume = safeHttps(d.resumeLink);
    var w = String(d.whatsapp || '').trim() ? normalizeWhatsApp(d.whatsapp) : { ok: false };
    var skills = String(d.skills || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var projects = filled(d.projects, 'name'), experience = filled(d.experience, 'role'), education = filled(d.education, 'degree'), achievements = filled(d.achievements, 'text');
    var desc = headline || name;

    var ld = { '@context': 'https://schema.org', '@type': 'Person', name: name, description: desc };
    var same = [linkedin, github].filter(Boolean);
    if (same.length) ld.sameAs = same;
    var ldJson = JSON.stringify(ld).replace(/</g, '\\u003c');

    function btn(cls, href, label) { return '<a class="btn ' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(label) + '</a>\n'; }
    var actions = (email ? '<a class="btn main" href="mailto:' + esc(email) + '">Email me</a>\n' : '') +
      (linkedin ? btn('line', linkedin, 'LinkedIn') : '') + (github ? btn('line', github, 'GitHub') : '') + (resume ? btn('line', resume, 'Resume') : '') +
      (w.ok ? btn('line', 'https://wa.me/' + w.digits + '?text=' + encodeURIComponent('Hi ' + name + ', I saw your portfolio.'), 'WhatsApp') : '');
    var card = function (title, sub, note, link) {
      var l = safeHttps(link);
      return '<div class="card"><b>' + esc(title) + '</b>' + (String(sub || '').trim() ? '<span>' + esc(sub) + '</span>' : '') + (String(note || '').trim() ? '<p>' + esc(note) + '</p>' : '') + (l ? '<a href="' + esc(l) + '" target="_blank" rel="noopener">See the project</a>' : '') + '</div>';
    };
    var section = function (title, body) { return body ? '<h2>' + esc(title) + '</h2>\n' + body + '\n' : ''; };

    var css = ':root{--c:' + accent + ';--on:' + ink + ';--ink:#1d1d1f;--muted:#5f6368;--bg:#f7f7f5;--line:#e2e2dc}*{box-sizing:border-box}' +
      'body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55}' +
      '.wrap{max-width:720px;margin:0 auto;padding:0 16px}header{background:var(--c);color:var(--on);padding:30px 0 24px}header h1{margin:0;font-size:30px;line-height:1.2}header p{margin:6px 0 0;opacity:.92}' +
      '.actions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.btn{padding:11px 16px;border-radius:9px;font-weight:700;text-decoration:none}.main{background:var(--c);color:var(--on)}.line{background:#fff;color:var(--ink);border:1px solid var(--line)}' +
      'h2{font-size:19px;margin:26px 0 10px}.about{margin:0}.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{background:#fff;border:1px solid var(--line);border-radius:20px;padding:4px 12px;font-size:14px}' +
      '.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px;display:flex;flex-direction:column;gap:3px}.card span{color:var(--muted);font-size:14px}.card p{margin:4px 0 0}.card a{margin-top:4px;color:var(--c);font-weight:700;text-decoration:none}' +
      'ul{margin:0;padding-left:20px}footer{text-align:center;color:var(--muted);font-size:13px;padding:28px 0}' +
      '@media print{body{background:#fff}header{background:#fff;color:#000;padding:0}.actions{display:none}.card{border:none;padding:0;margin-bottom:8px}footer{display:none}}';

    var html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(name) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n<meta name="theme-color" content="' + accent + '">\n' +
      '<meta property="og:type" content="profile">\n<meta property="og:title" content="' + esc(name) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n' +
      '<script type="application/ld+json">' + ldJson + '</script>\n<style>' + css + '</style>\n</head>\n<body>\n' +
      '<header><div class="wrap"><h1>' + esc(name) + '</h1>' + (headline ? '<p>' + esc(headline) + '</p>' : '') + (city ? '<p>' + esc(city) + '</p>' : '') + '</div></header>\n<main class="wrap">\n' +
      (actions ? '<div class="actions">\n' + actions + '</div>\n' : '') +
      section('About', about ? '<p class="about">' + esc(about) + '</p>' : '') +
      section('Skills', skills.length ? '<div class="chips">' + skills.map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('') + '</div>' : '') +
      section('Projects', projects.map(function (p) { return card(p.name, '', p.note, p.link); }).join('\n')) +
      section('Experience', experience.map(function (e) { return card(e.role, e.org, e.note); }).join('\n')) +
      section('Education', education.map(function (e) { return card(e.degree, [e.school, e.year].filter(function (x) { return String(x || '').trim(); }).join(', ')); }).join('\n')) +
      section('Achievements', achievements.length ? '<ul>' + achievements.map(function (a) { return '<li>' + esc(a.text) + '</li>'; }).join('') + '</ul>' : '') +
      '</main>\n<footer>© ' + year + ' ' + esc(name) + (String(d.madeBy || '').trim() ? ' · ' + esc(d.madeBy) : '') + '</footer>\n</body>\n</html>\n';
    return html;
  }

  return { LABELS: LABELS, PRESETS: PRESETS, PORTFOLIO_EXAMPLE: PORTFOLIO_EXAMPLE, esc: esc, safeHttps: safeHttps, safeUpi: safeUpi, safeEmail: safeEmail, normalizeWhatsApp: normalizeWhatsApp, checkData: checkData, buildSite: buildSite, checkPortfolio: checkPortfolio, buildPortfolio: buildPortfolio };
});
