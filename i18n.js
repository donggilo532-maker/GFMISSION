/* 굳프랜드교회 홈페이지 다국어(i18n)
 * - 번역 파일: i18n/<언어코드>.json (ko.json이 원본 기준)
 * - 첫 방문: 전체 화면 언어 선택 → localStorage(gf_lang)에 저장
 * - 이후: 헤더의 🌐 버튼으로 언제든 변경, 주소에 ?lang=km 처럼 붙이면 그 언어로 바로 열림
 * - HTML에서 data-i18n="키" 인 요소의 글자를 바꿉니다. data-i18n-br 이 있으면 줄바꿈(\n)을 <br>로 표시합니다.
 */
(() => {
  'use strict';
  const LANGS = [
    { code: 'ko',  name: '한국어',           country: '대한민국',        flag: '🇰🇷' },
    { code: 'en',  name: 'English',          country: 'English',         flag: '🇺🇸' },
    { code: 'zh',  name: '中文',             country: '中国',            flag: '🇨🇳' },
    { code: 'vi',  name: 'Tiếng Việt',       country: 'Việt Nam',        flag: '🇻🇳' },
    { code: 'km',  name: 'ខ្មែរ',             country: 'កម្ពុជា',          flag: '🇰🇭', font: 'Noto Sans Khmer' },
    { code: 'lo',  name: 'ລາວ',              country: 'ລາວ',             flag: '🇱🇦', font: 'Noto Sans Lao' },
    { code: 'th',  name: 'ไทย',              country: 'ประเทศไทย',       flag: '🇹🇭', font: 'Noto Sans Thai' },
    { code: 'my',  name: 'မြန်မာ',            country: 'မြန်မာ',           flag: '🇲🇲', font: 'Noto Sans Myanmar' },
    { code: 'id',  name: 'Bahasa Indonesia', country: 'Indonesia',       flag: '🇮🇩' },
    { code: 'fil', name: 'Filipino',         country: 'Pilipinas',       flag: '🇵🇭' },
    { code: 'bn',  name: 'বাংলা',             country: 'বাংলাদেশ',         flag: '🇧🇩', font: 'Noto Sans Bengali' },
    { code: 'hi',  name: 'हिन्दी',            country: 'भारत',             flag: '🇮🇳', font: 'Noto Sans Devanagari' },
    { code: 'ne',  name: 'नेपाली',            country: 'नेपाल',            flag: '🇳🇵', font: 'Noto Sans Devanagari' },
    { code: 'si',  name: 'සිංහල',             country: 'ශ්‍රී ලංකා',        flag: '🇱🇰', font: 'Noto Sans Sinhala' },
    { code: 'ur',  name: 'اردو',             country: 'پاکستان',          flag: '🇵🇰', font: 'Noto Nastaliq Urdu', dir: 'rtl' },
    { code: 'ru',  name: 'Русский',          country: 'Россия',          flag: '🇷🇺' },
    { code: 'ky',  name: 'Кыргызча',         country: 'Кыргызстан',      flag: '🇰🇬' },
    { code: 'uz',  name: 'Oʻzbekcha',        country: 'Oʻzbekiston',     flag: '🇺🇿' },
    { code: 'tg',  name: 'Тоҷикӣ',           country: 'Тоҷикистон',      flag: '🇹🇯' },
    { code: 'kk',  name: 'Қазақша',          country: 'Қазақстан',       flag: '🇰🇿' }
  ];
  const BY_CODE = Object.fromEntries(LANGS.map(l => [l.code, l]));
  const STORE_KEY = 'gf_lang';
  const dict = {};           // 현재 언어 번역 { key: text }
  let current = 'ko';
  const cache = {};          // 언어별 로드된 번역

  const store = {
    get() { try { return localStorage.getItem(STORE_KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(STORE_KEY, v); } catch {} }
  };
  const fromUrl = () => { try { return new URL(location.href).searchParams.get('lang'); } catch { return null; } };
  // 브라우저 언어 → 지원 언어 추천 (zh-CN, fil/tl, pt 등 처리)
  const browserLang = () => {
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map(s => String(s).toLowerCase());
    for (const tag of list) {
      const base = tag.split('-')[0];
      if (tag === 'tl' || base === 'tl') return 'fil';
      if (BY_CODE[base]) return base;
    }
    return null;
  };

  // ----- 번역 적용 -----
  const t = (key, fallback) => {
    const v = dict[key];
    return (v == null || v === '') ? (fallback != null ? fallback : key) : v;
  };
  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null) ? vars[k] : m);
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const applyDom = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const v = dict[key];
      if (v == null) return;
      if (el.hasAttribute('data-i18n-br')) el.innerHTML = escapeHtml(v).replace(/\n/g, '<br>');
      else el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      // 형식: data-i18n-attr="alt:hero.imgAlt;aria-label:brand.aria"
      el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
        const i = pair.indexOf(':'); if (i < 0) return;
        const attr = pair.slice(0, i).trim(), key = pair.slice(i + 1).trim();
        if (dict[key] != null) el.setAttribute(attr, dict[key]);
      });
    });
    if (dict['meta.title']) document.title = dict['meta.title'];
    const md = document.querySelector('meta[name="description"]');
    if (md && dict['meta.description']) md.setAttribute('content', dict['meta.description']);
  };

  const loadFont = lang => {
    const info = BY_CODE[lang];
    const old = document.getElementById('i18n-font-link');
    const oldStyle = document.getElementById('i18n-font-style');
    if (old) old.remove(); if (oldStyle) oldStyle.remove();
    if (!info || !info.font) return;
    const link = document.createElement('link');
    link.id = 'i18n-font-link'; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(info.font).replace(/%20/g, '+') + ':wght@400;700;800&display=swap';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.id = 'i18n-font-style';
    style.textContent = 'body,button,input,select,textarea{font-family:"' + info.font + '","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif}' +
      (lang === 'ur' ? 'body{line-height:2}' : '');
    document.head.appendChild(style);
  };

  const fetchLang = async lang => {
    if (cache[lang]) return cache[lang];
    const res = await fetch('./i18n/' + lang + '.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('i18n ' + lang + ' HTTP ' + res.status);
    const data = await res.json();
    cache[lang] = data;
    return data;
  };

  const setLang = async (lang, opts = {}) => {
    if (!BY_CODE[lang]) lang = 'ko';
    let data = {};
    try { data = await fetchLang(lang); }
    catch (err) { console.warn('번역 파일을 불러오지 못했습니다:', err && err.message); if (lang !== 'ko') return setLang('ko', opts); }
    for (const k of Object.keys(dict)) delete dict[k];
    Object.assign(dict, data);
    current = lang;
    document.documentElement.lang = lang === 'fil' ? 'fil' : lang;
    document.documentElement.dir = BY_CODE[lang].dir || 'ltr';
    document.documentElement.setAttribute('data-lang', lang);
    loadFont(lang);
    applyDom();
    updateButton();
    if (opts.remember !== false) store.set(lang);
    if (opts.updateUrl) {
      try { const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u); } catch {}
    }
    document.body.classList.remove('i18n-pending');
    document.dispatchEvent(new CustomEvent('gf:langchange', { detail: { lang } }));
  };

  // ----- 헤더 언어 버튼 -----
  let button = null;
  const updateButton = () => {
    if (!button) return;
    const info = BY_CODE[current];
    button.textContent = '';
    button.append('🌐 ');
    const name = document.createElement('span'); name.className = 'lang-button-name'; name.textContent = info.name; name.lang = info.code;
    button.append(name);
    button.setAttribute('aria-label', t('lang.button', '언어 선택') + ': ' + info.name);
  };
  const mountButton = () => {
    const host = document.querySelector('.header-inside');
    if (!host) return;
    button = document.createElement('button');
    button.type = 'button'; button.className = 'lang-button';
    button.addEventListener('click', () => openChooser(false));
    const menu = host.querySelector('.menu-button');
    if (menu) host.insertBefore(button, menu); else host.appendChild(button);
    updateButton();
  };

  // ----- 언어 선택 화면 (첫 방문 전체 화면 / 이후 모달) -----
  let overlay = null;
  const ensureChooserFonts = () => {
    if (document.getElementById('i18n-chooser-fonts')) return;
    const fams = [...new Set(LANGS.filter(l => l.font).map(l => l.font))];
    const link = document.createElement('link');
    link.id = 'i18n-chooser-fonts'; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + fams.map(f => 'family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':wght@400;800').join('&') + '&display=swap';
    document.head.appendChild(link);
  };
  const openChooser = (firstVisit) => {
    closeChooser();
    ensureChooserFonts();
    const suggested = browserLang();
    overlay = document.createElement('div');
    overlay.className = 'lang-overlay' + (firstVisit ? ' lang-overlay-first' : '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Select your language');
    const ordered = suggested && suggested !== 'ko'
      ? [BY_CODE[suggested], ...LANGS.filter(l => l.code !== suggested)]
      : LANGS.slice();
    const items = ordered.map(l => {
      const rec = l.code === suggested ? '<span class="lang-rec">✓</span>' : '';
      return '<button type="button" class="lang-item' + (l.code === current ? ' lang-current' : '') + '" data-lang="' + l.code + '" lang="' + l.code + '"' + (l.dir ? ' dir="rtl"' : '') + '>' +
        '<span class="lang-flag" aria-hidden="true">' + l.flag + '</span>' +
        '<span class="lang-name">' + escapeHtml(l.name) + '</span>' +
        '<span class="lang-country">' + escapeHtml(l.country) + '</span>' + rec + '</button>';
    }).join('');
    overlay.innerHTML =
      '<div class="lang-panel">' +
        '<div class="lang-head"><span class="lang-cross" aria-hidden="true">✝</span>' +
          '<h2 class="lang-title">Select your language<small>언어를 선택하세요 · 选择语言 · Chọn ngôn ngữ · ជ្រើសរើសភាសា</small></h2>' +
          (firstVisit ? '' : '<button type="button" class="lang-close" aria-label="Close">✕</button>') +
        '</div>' +
        '<div class="lang-grid">' + items + '</div>' +
        '<p class="lang-foot">GOOD FRIEND MISSION CHURCH · 굳프랜드교회</p>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add('lang-open');
    overlay.addEventListener('click', e => {
      const item = e.target.closest('.lang-item');
      if (item) { setLang(item.getAttribute('data-lang'), { updateUrl: true }); closeChooser(); return; }
      if (e.target.closest('.lang-close') || (e.target === overlay && !firstVisit)) closeChooser();
    });
    if (!firstVisit) document.addEventListener('keydown', escClose);
    const first = overlay.querySelector('.lang-item');
    if (first) first.focus();
  };
  const escClose = e => { if (e.key === 'Escape') closeChooser(); };
  const closeChooser = () => {
    if (overlay) { overlay.remove(); overlay = null; }
    document.body.classList.remove('lang-open');
    document.removeEventListener('keydown', escClose);
  };

  // ----- 스타일 -----
  const css = `
.lang-button{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:10px;color:var(--forest,#102d2b);background:#fff;border:1px solid #d8e0d8;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}
.lang-button:hover{background:#f3f6f3}
@media(max-width:760px){.lang-button{padding:8px 10px;font-size:12px;margin-left:auto}}
html:not([data-lang="ko"]) .nav{flex-wrap:wrap;gap:8px 18px;font-size:13px}
body.i18n-pending main,body.i18n-pending header,body.i18n-pending footer,body.i18n-pending .announcement{visibility:hidden}
body.lang-open{overflow:hidden}
.lang-overlay{position:fixed;inset:0;z-index:1000;background:rgba(16,45,43,.92);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto;-webkit-overflow-scrolling:touch}
.lang-overlay-first{background:linear-gradient(160deg,#102d2b,#1d4a44)}
.lang-panel{background:#faf8f3;color:#20312e;border-radius:22px;max-width:860px;width:100%;max-height:100%;overflow:auto;padding:26px 24px 20px;box-shadow:0 30px 60px rgba(0,0,0,.35)}
.lang-head{display:flex;align-items:flex-start;gap:14px;margin-bottom:18px}
.lang-cross{font-size:30px;color:#dfbc79;line-height:1}
.lang-title{margin:0;font-size:24px;letter-spacing:-.5px;flex:1}
.lang-title small{display:block;font-size:13px;font-weight:500;color:#587167;margin-top:6px;letter-spacing:0}
.lang-close{font:inherit;font-size:18px;background:#eee9df;border:0;border-radius:50%;width:38px;height:38px;cursor:pointer;color:#20312e}
.lang-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.lang-item{position:relative;display:grid;grid-template-columns:34px 1fr;column-gap:10px;align-items:center;padding:12px 30px 12px 12px;border:1px solid #e0e7e1;border-radius:14px;background:#fff;font:inherit;text-align:left;cursor:pointer;min-height:62px;color:#20312e}
.lang-item:hover,.lang-item:focus{border-color:#275c52;box-shadow:0 0 0 3px rgba(39,92,82,.15);outline:none}
.lang-item.lang-current{border-color:#275c52;background:#e8eee7}
.lang-item[dir="rtl"]{text-align:right;padding:12px 12px 12px 30px}
.lang-flag{grid-row:1/3;font-size:26px;line-height:1}
.lang-name{grid-column:2;font-weight:800;font-size:16px;line-height:1.3}
.lang-country{grid-column:2;font-size:12px;color:#587167;line-height:1.3}
.lang-rec{position:absolute;top:8px;right:8px;background:#275c52;color:#fff;border-radius:50%;width:20px;height:20px;font-size:12px;display:flex;align-items:center;justify-content:center}
.lang-item[dir="rtl"] .lang-rec{right:auto;left:8px}
.lang-foot{text-align:center;color:#587167;font-size:12px;margin:18px 0 0}
@media(max-width:480px){.lang-panel{padding:20px 14px 16px;border-radius:16px}.lang-grid{grid-template-columns:repeat(2,1fr);gap:8px}.lang-item{padding:10px;min-height:56px}.lang-name{font-size:14px}.lang-title{font-size:20px}}
html[dir="rtl"] .lang-item{text-align:right}
html:not([data-lang="ko"]) .brand{flex:1 1 auto;min-width:0}
html:not([data-lang="ko"]) .brand-type{white-space:normal;letter-spacing:0;font-size:17px;line-height:1.15}
html:not([data-lang="ko"]) .brand-type small{letter-spacing:.3px}
html:not([data-lang="ko"]) .hero h1{letter-spacing:0}
html:not([data-lang="ko"]) .time-card .time{white-space:normal}
html:not([data-lang="ko"]) .announcement{line-height:1.5}
@media(max-width:480px){html:not([data-lang="ko"]) .brand-type{font-size:14px}.lang-button-name{display:none}.lang-button{padding:8px 9px;font-size:16px;line-height:1}}
` + LANGS.filter(l => l.font).map(l => '.lang-item[lang="' + l.code + '"]{font-family:"' + l.font + '","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif}').join('\n') + `
`;
  const style = document.createElement('style'); style.id = 'i18n-style'; style.textContent = css; document.head.appendChild(style);

  // ----- 시작 -----
  window.GF_I18N = { t, fill, setLang, open: () => openChooser(false), get lang() { return current; }, languages: LANGS };
  const start = () => {
    mountButton();
    const urlLang = fromUrl();
    const saved = store.get();
    const initial = (urlLang && BY_CODE[urlLang]) ? urlLang : (saved && BY_CODE[saved]) ? saved : null;
    if (initial) {
      if (initial !== 'ko') { document.body.classList.add('i18n-pending'); setTimeout(() => document.body.classList.remove('i18n-pending'), 2500); }
      setLang(initial, { updateUrl: false });
    } else {
      setLang('ko', { remember: false });
      openChooser(true);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
