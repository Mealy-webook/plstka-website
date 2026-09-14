/* ============================================================
   Plstka inner pages — shared behaviour on top of b.js (window.PB).
   ============================================================ */
(function () {
  const { $, $$ } = PB;
  const motion = !PB.reduce && !!window.gsap;

  /* Accordion — one open at a time per group */
  $$('.qa > button').forEach(b => b.addEventListener('click', () => {
    const q = b.parentElement, open = !q.classList.contains('open');
    $$('.qa', q.parentElement).forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); });
    if (open) { q.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 850);
  }));

  /* Visual filter chips (no data filtering) */
  $$('[data-chips]').forEach(g => g.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('.chip', g).forEach(x => x.classList.toggle('on', x === c));
  }));

  /* Copy current URL */
  $$('[data-copy]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(location.href).then(() => {
      a.style.background = 'var(--yellow)'; a.style.color = '#000'; a.setAttribute('aria-label', 'Link copied');
      setTimeout(() => { a.style.background = ''; a.style.color = ''; a.setAttribute('aria-label', 'Copy link'); }, 1600);
    }).catch(() => {});
  }));

  if (!motion) return;

  PB.onReady(phase => {
    if (phase === 'pre') {
      gsap.set('.ph h1 .line > span', { yPercent: 112 });
      gsap.set(['.ph .crumb', '.ph .tag-y', '.ph-bottom > *'], { opacity: 0, y: 30 });
      return;
    }
    if (phase !== 'intro') return;

    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('.ph h1 .line > span', { yPercent: 0, duration: 1.5, stagger: .1 }, 0)
      .to(['.ph .crumb', '.ph .tag-y'], { opacity: 1, y: 0, duration: 1.2, stagger: .08 }, .2)
      .to('.ph-bottom > *', { opacity: 1, y: 0, duration: 1.2, stagger: .12 }, .45);
    if ($('.ph')) gsap.to('.ph h1', { yPercent: 16, opacity: .3, ease: 'none',
      scrollTrigger: { trigger: '.ph', start: 'top top', end: 'bottom top', scrub: true } });

    $$('.cta').forEach(sec => {
      const c = $('.cta-circle', sec); if (!c) return;
      gsap.fromTo(c, { clipPath: 'circle(4% at 50% 62%)' }, { clipPath: 'circle(78% at 50% 50%)', ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 75%', end: 'center center', scrub: true } });
    });

    // steps: outline numbers fill in as they arrive
    $$('.steps4 .n').forEach(n => gsap.fromTo(n, { color: 'rgba(0,0,0,0)' }, { color: 'currentColor', ease: 'none',
      scrollTrigger: { trigger: n, start: 'top 85%', end: 'top 45%', scrub: true } }));

    // bars & meters grow
    $$('.bars .col, .chart i').forEach(el => gsap.from(el, { scaleY: 0, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: el.parentElement, start: 'top 85%', once: true } }));
    $$('.meter i').forEach(el => gsap.from(el, { scaleX: 0, duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));

    if (typeof window.pageIntro === 'function') window.pageIntro(gsap.matchMedia());
  });
})();
