/* Plstka — shared site behaviour: nav, language, scroll reveals, counters */
(function () {
  'use strict';

  // ---- Mobile menu ----
  var toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
  }

  // ---- Scroll progress + sticky nav state ----
  var navEl = document.querySelector('.navbar');
  var sp = document.getElementById('sp');
  function onScroll() {
    var y = window.pageYOffset;
    if (navEl) navEl.classList.toggle('scrolled', y > 24);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (sp) sp.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Language switcher (EN / AR + RTL) ----
  (function () {
    var root = document.documentElement;
    var btn = document.getElementById('langSwitch');
    var label = document.getElementById('langLabel');
    if (!btn) return;
    var nodes = document.querySelectorAll('[data-en][data-ar]');
    function apply(lang) {
      var ar = lang === 'ar';
      root.lang = lang;
      root.dir = ar ? 'rtl' : 'ltr';
      nodes.forEach(function (n) { n.textContent = ar ? n.dataset.ar : n.dataset.en; });
      if (label) label.textContent = ar ? 'AR' : 'EN';
      try { localStorage.setItem('plstka-lang', lang); } catch (e) {}
    }
    var saved = 'en';
    try { saved = localStorage.getItem('plstka-lang') || 'en'; } catch (e) {}
    apply(saved === 'ar' ? 'ar' : 'en');
    btn.addEventListener('click', function () { apply(root.lang === 'ar' ? 'en' : 'ar'); });
  })();

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Marquee duplication (any .marquee-track) ----
  document.querySelectorAll('.marquee-track').forEach(function (t) {
    if (!reduce) t.innerHTML += t.innerHTML;
  });

  if (reduce) return;

  // ---- Scroll reveals ----
  // Pages opt in per-element with class="reveal", or via [data-reveal] on a
  // container to stagger its direct children.
  document.querySelectorAll('[data-reveal]').forEach(function (group) {
    var step = parseInt(group.dataset.reveal, 10) || 100;
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add('reveal');
      child.style.transitionDelay = (i % 6) * step + 'ms';
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // ---- Count-up for [data-count] elements ----
  var fmt = function (n) { return n.toLocaleString('en-US'); };
  function countUp(el) {
    var raw = el.dataset.raw;
    var m = raw.match(/([\d,]+)/);
    if (!m) return;
    var target = parseInt(m[1].replace(/,/g, ''), 10);
    var pre = raw.slice(0, m.index);
    var post = raw.slice(m.index + m[1].length);
    var dur = 1600, t0 = performance.now(), done = false;
    function finish() { if (!done) { done = true; el.textContent = raw; } }
    (function step(t) {
      if (done) return;
      var k = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + fmt(Math.round(target * eased)) + post;
      if (k < 1) requestAnimationFrame(step); else finish();
    })(t0);
    setTimeout(finish, dur + 400);
  }
  var counters = document.querySelectorAll('[data-count]');
  counters.forEach(function (el) { el.dataset.raw = el.textContent.trim(); });
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { cio.observe(el); });
})();
