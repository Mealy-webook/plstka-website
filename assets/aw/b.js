/* ============================================================
   Option B / C shared engine: language, Lenis + ScrollTrigger,
   loader, cursor, magnetic, split reveals, marquees, footer.
   Page scripts read window.PB = { lenis, reduce, fine, split, onReady }.
   ============================================================ */
(function () {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const ready = [];
  const PB = window.PB = { reduce, fine, lenis: null, $, $$, onReady: fn => ready.push(fn) };

  /* ---------- Always start at the top on refresh (no browser scroll restore) ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const navType = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0] || {}).type;
  const toTop = navType === 'reload' || !location.hash;
  if (toTop) {
    scrollTo(0, 0);
    addEventListener('pageshow', () => scrollTo(0, 0));
    addEventListener('load', () => { scrollTo(0, 0); if (window.PB && PB.lenis) PB.lenis.scrollTo(0, { immediate: true, force: true }); });
  }

  /* ---------- Language (applied before any splitting; toggle reloads) ---------- */
  let lang = 'en';
  try { lang = localStorage.getItem('plstka-lang') || 'en'; } catch (e) {}
  if (lang === 'ar') {
    root.lang = 'ar'; root.dir = 'rtl';
    $$('[data-ar]').forEach(n => { n.textContent = n.dataset.ar; });
  }
  $$('[data-lang-toggle]').forEach(b => {
    b.textContent = lang === 'ar' ? 'EN' : 'عربي';
    b.addEventListener('click', () => {
      try { localStorage.setItem('plstka-lang', lang === 'ar' ? 'en' : 'ar'); } catch (e) {}
      location.reload();
    });
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('.mmenu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  /* ---------- Nav: sliding indicator, rolling labels, theme swap, progress ring ---------- */
  (function navFx() {
    const nav = $('.nav'); if (!nav) return;
    const links = $('.nav-links', nav), mark = $('.brand-mark', nav);
    let ring = null, circ = 0;
    if (mark) {
      mark.insertAdjacentHTML('beforeend', '<svg class="brand-ring" viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="25"/></svg>');
      ring = $('.brand-ring circle', mark); circ = 2 * Math.PI * 25;
      ring.style.strokeDasharray = circ; ring.style.strokeDashoffset = circ;
    }
    if (links) {
      $$('a', links).forEach(a => { const t = a.textContent.trim(); a.innerHTML = '<span class="r"><span>' + t + '</span><span aria-hidden="true">' + t + '</span></span>'; });
      const ind = document.createElement('span'); ind.className = 'nav-ind'; links.prepend(ind);
      const moveTo = a => {
        $$('a', links).forEach(x => x.classList.toggle('hot', x === a));
        if (!a) { ind.style.opacity = 0; return; }
        ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
      };
      const home = () => moveTo($('a.on', links));
      $$('a', links).forEach(a => { a.addEventListener('pointerenter', () => moveTo(a)); a.addEventListener('focus', () => moveTo(a)); a.addEventListener('blur', home); });
      links.addEventListener('pointerleave', home);
      const snap = () => { ind.style.transition = 'none'; home(); void ind.offsetWidth; ind.style.transition = ''; };
      addEventListener('resize', snap); if (document.fonts) document.fonts.ready.then(snap); snap();
    }
    // sections the capsule turns dark over (the menu overlay is handled by the menu-open state)
    const darkSel = 'main .dark, main .green, main .hero, .foot';
    const overDark = () => {
      const r = nav.getBoundingClientRect(), mid = r.top + r.height / 2;
      return $$(darkSel).some(s => { if (s.hidden) return false; const b = s.getBoundingClientRect(); return b.height > 0 && b.top <= mid && b.bottom >= mid; });
    };
    let lastY = scrollY, queued = false;
    function update() {
      queued = false;
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight, open = document.body.classList.contains('menu-open');
      nav.classList.toggle('compact', y > 40);
      if (open || y < 500 || y < lastY - 2) nav.classList.remove('hide');
      else if (y > lastY + 2) nav.classList.add('hide');
      nav.classList.toggle('is-dark', open || overDark());
      if (ring) ring.style.strokeDashoffset = circ * (1 - (max > 0 ? Math.min(1, y / max) : 0));
      lastY = y;
    }
    const req = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    const mb = $('.menu-btn'); if (mb) mb.addEventListener('click', () => setTimeout(update, 0));
    $$('.mmenu a').forEach(a => a.addEventListener('click', () => setTimeout(update, 0)));
    update();
  })();

  /* ---------- Split helpers ---------- */
  function splitWords(el) {
    if (!el) return [];
    if (el.dataset.splitDone) return $$('.swi', el);
    el.dataset.splitDone = '1';
    (function walk(node) {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span'); o.className = 'sw';
            const i = document.createElement('span'); i.className = 'swi'; i.textContent = part;
            o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !/^(BR|SVG|IMG)$/.test(n.tagName) && !n.classList.contains('line')) walk(n);
        else if (n.nodeType === 1 && n.classList.contains('line')) walk(n);
      });
    })(el);
    return $$('.swi', el);
  }
  function splitChars(el) {
    const t = el.textContent; el.textContent = '';
    return Array.from(t).map(c => { const s = document.createElement('span'); s.textContent = c; el.appendChild(s); return s; });
  }
  PB.splitWords = splitWords; PB.splitChars = splitChars;

  /* ---------- Marquees (GSAP loop, velocity-reactive) ---------- */
  function buildMarquees() {
    $$('[data-mq]').forEach(mq => {
      const track = $('.mq-track', mq);
      if (!track || track.dataset.built) return;
      track.dataset.built = '1';
      const html = track.innerHTML;
      track.innerHTML = html + html + html + html;
      $$('.mq-item', track).forEach((n, i) => { if (i >= track.children.length / 4) n.setAttribute('aria-hidden', 'true'); });
      if (reduce || !hasGsap) return;
      const dir = mq.dataset.mq === 'rev' ? 1 : -1;
      const speed = parseFloat(mq.dataset.speed || '60');
      let x = 0, boost = 0, hover = false;
      mq.addEventListener('pointerenter', () => { if (mq.hasAttribute('data-pause')) hover = true; });
      mq.addEventListener('pointerleave', () => { hover = false; });
      gsap.ticker.add((t, dt) => {
        const quarter = track.scrollWidth / 4;
        if (!quarter) return;
        boost += (0 - boost) * 0.05;
        const v = hover ? 0 : (speed + boost) * dir * (dt / 1000);
        x = (x + v) % quarter;
        if (x > 0) x -= quarter;
        gsap.set(track, { x });
      });
      ScrollTrigger.create({ trigger: mq, start: 'top bottom', end: 'bottom top',
        onUpdate: self => { boost = Math.min(Math.abs(self.getVelocity()) * 0.35, 900); } });
    });
  }
  PB.buildMarquees = buildMarquees;

  /* ---------- Reduced motion / no GSAP: static page ---------- */
  if (reduce || !hasGsap) {
    buildMarquees();
    document.addEventListener('DOMContentLoaded', () => ready.forEach(fn => fn()));
    if (document.readyState !== 'loading') setTimeout(() => ready.forEach(fn => fn()), 0);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (toTop && ScrollTrigger.clearScrollMemory) ScrollTrigger.clearScrollMemory('manual');
  root.classList.add('js-motion');

  /* ---------- Lenis ---------- */
  if (window.Lenis) {
    const lenis = PB.lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    PB.lenis ? PB.lenis.scrollTo(t, { duration: 1.6 }) : t.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- Chrome ---------- */
  document.body.insertAdjacentHTML('beforeend', '<div class="grain" aria-hidden="true"></div><div class="progress" aria-hidden="true"></div>');
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });


  if (fine) {
    root.classList.add('cur-on');
    document.body.insertAdjacentHTML('beforeend', '<div class="cur-ring" aria-hidden="true"><b></b></div><div class="cur-dot" aria-hidden="true"></div>');
    const dot = $('.cur-dot'), ring = $('.cur-ring'), lbl = $('b', ring);
    const dx = gsap.quickTo(dot, 'x', { duration: .06 }), dy = gsap.quickTo(dot, 'y', { duration: .06 });
    const rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' });
    addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const labelled = e.target.closest('[data-cursor]');
      const link = !labelled && e.target.closest('a, button, summary, input, label');
      ring.classList.toggle('label', !!labelled);
      ring.classList.toggle('link', !!link);
      lbl.textContent = labelled ? labelled.dataset.cursor : '';
    });
    $$('[data-magnetic], .bb, .socials a, .badge, .lang').forEach(el => {
      const s = parseFloat(el.dataset.magnetic || '.35');
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * s); my((e.clientY - r.top - r.height / 2) * s); });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.3)' }));
    });
  }

  /* ---------- Generic scroll reveals ---------- */
  function reveals() {
    $$('[data-split]').forEach(el => {
      const w = splitWords(el);
      gsap.from(w, { yPercent: 118, rotate: 4, duration: 1.25, ease: 'expo.out', stagger: .045,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-fade]').forEach(el => gsap.from(el, { y: 44, opacity: 0, duration: 1.2, ease: 'expo.out', delay: parseFloat(el.dataset.fade || 0),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    $$('[data-stagger]').forEach(g => gsap.from(g.children, { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .09,
      scrollTrigger: { trigger: g, start: 'top 85%', once: true }, clearProps: 'transform,opacity' }));
    $$('[data-clip]').forEach(el => gsap.from(el, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));
    $$('[data-parallax]').forEach(el => {
      const amt = parseFloat(el.dataset.parallax);
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // word-by-word ink as you read
    $$('[data-highlight]').forEach(el => {
      const w = splitWords(el);
      w.forEach(x => x.parentElement.style.overflow = 'visible');
      gsap.fromTo(w, { opacity: .14 }, { opacity: 1, ease: 'none', stagger: .1,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });
    $$('[data-count]').forEach(el => {
      const raw = el.textContent.trim(), m = raw.match(/[\d,.]+/);
      if (!m) return;
      const target = parseFloat(m[0].replace(/,/g, '')), dec = (m[0].split('.')[1] || '').length;
      const pre = raw.slice(0, m.index), post = raw.slice(m.index + m[0].length), o = { v: 0 };
      el.textContent = pre + '0' + post;
      gsap.to(o, { v: target, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onUpdate: () => { el.textContent = pre + (dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString('en-US')) + post; } });
    });
    const fw = $('.foot-word');
    if (fw) gsap.from(splitChars(fw), { yPercent: 100, ease: 'none', stagger: .06,
      scrollTrigger: { trigger: '.foot', start: 'top 60%', end: 'bottom bottom', scrub: true } });
  }

  /* ---------- Loader → page intro ---------- */
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
  let inited = false;
  function init() {
    if (inited) return; inited = true;
    buildMarquees();
    const first = (() => { try { const s = !sessionStorage.getItem('pb-seen'); sessionStorage.setItem('pb-seen', '1'); return s; } catch (e) { return true; } })();
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="loader" aria-hidden="true"><span class="loader-tag">Plstka &mdash; recycle, earn, repeat</span><span class="loader-count">0</span>' +
      '<div class="loader-word">' + 'plstka'.split('').map(c => '<span>' + c + '</span>').join('') + '</div><div class="loader-panel"></div></div>');
    const loader = $('.loader'), c = { v: 0 };
    PB.lenis && PB.lenis.stop();
    ready.forEach(fn => fn('pre'));            // pages set initial hero states
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (first) {
      tl.from('.loader-word span', { yPercent: 105, duration: 1.1, stagger: .06 })
        .to(c, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { $('.loader-count').textContent = Math.round(c.v) + '%'; } }, 0)
        .to('.loader-word span', { yPercent: -105, duration: .8, stagger: .04, ease: 'expo.in' }, 1.4)
        .to('.loader-panel', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=.5');
    }
    tl.to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut',
        onComplete: () => { loader.remove(); PB.lenis && PB.lenis.start(); } }, first ? '-=.55' : 0)
      .add(() => { reveals(); ready.forEach(fn => fn('intro')); ScrollTrigger.sort(); ScrollTrigger.refresh(); }, '-=.6');
    gsap.set(loader, { clipPath: 'inset(0% 0% 0% 0%)' });
    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
