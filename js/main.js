/* Vignesh Ganapathi — portfolio interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Smooth scroll (Lenis, like Bram) ───────────────────────────────── */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.lenis = lenis;
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollToTarget = (hash) => {
    const target = hash === '#top' ? 0 : $(hash);
    if (target === null) return;
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else if (target === 0) scrollTo(0, 0);
    else target.scrollIntoView();
  };
  $$('a[href^="#"]:not([data-case])').forEach((a) => a.addEventListener('click', (e) => {
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(hash);
  }));

  /* ── HERO: step into the light ───────────────────────────────────────
     A pinned section scrubbed by scroll (Kunal's mechanic):
       0.00–0.20  intro fades and Vignesh slides past the camera
       0.02–0.82  the camera pushes into the corridor's lit doorway, drifting
                  it to the centre of the frame until its light fills the screen
       0.72–0.90  the light becomes the cream page, which then scrolls on
     The section is only 230vh tall, so the whole walk takes ~2 scrolls.      */
  const hero = $('[data-hero]');
  const stage = $('.hero__stage', hero);
  const bg = $('[data-bg]');
  const glow = $('[data-light]');
  const vignette = $('.hero__vignette', hero);
  const person = $('[data-person]');
  const fill = $('[data-fill]');
  const word = $('[data-word]');
  const intro = $('[data-intro]');
  const cue = $('[data-cue]');
  const talk = $('.talk', hero);
  const menuBtn = $('[data-menu-open]');

  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  // The lit doorway in the corridor photo (measured on the 1751 × 898 image)
  const IMG = { w: 1751, h: 898, x: 0.655, y: 0.42, dw: 150, dh: 410 };
  let geo = null;
  const measure = () => {
    const vw = innerWidth, vh = stage.clientHeight;
    const sc = Math.max(vw / IMG.w, vh / IMG.h);
    const w = IMG.w * sc, h = IMG.h * sc;
    const ox = (vw - w) / 2 + IMG.x * w, oy = (vh - h) / 2 + IMG.y * h;
    const dw = IMG.dw * sc, dh = IMG.dh * sc;
    bg.style.transformOrigin = `${ox}px ${oy}px`;
    // zoom until the doorway's light is wider and taller than the screen
    geo = { vw, vh, ox, oy, lw: dw * 3.6, lh: dh * 2.2, S: Math.max((vw * 1.25) / dw, (vh * 1.25) / dh) };
  };

  const renderHero = () => {
    const total = hero.offsetHeight - stage.clientHeight;
    const p = clamp(-hero.getBoundingClientRect().top / total);

    // intro + Vignesh passing the camera
    const fi = 1 - clamp(p / 0.12);
    intro.style.opacity = fi;
    intro.style.transform = `translateY(${-clamp(p / 0.2) * 60}px)`;
    cue.style.opacity = fi;
    word.style.opacity = 1 - clamp(p / 0.16);
    word.style.transform = `translateY(${clamp(p / 0.2) * 30}vh)`;
    const pe = easeIO(clamp(p / 0.24));
    person.style.transform = `translate3d(${pe * 40}vw, ${pe * 10}vh, 0) scale(${1 + pe * 1.2})`;
    person.style.filter = `blur(${pe * 10}px)`;
    person.style.opacity = 1 - clamp((p - 0.06) / 0.14);
    talk.style.opacity = 1 - clamp((p - 0.1) / 0.15);

    // camera: exponential zoom into the doorway reads as a steady walk forward
    const e = easeInOutSine(clamp((p - 0.02) / 0.8));
    const s = Math.pow(geo.S, e);
    const k = (s - 1) / (geo.S - 1);
    bg.style.transform = `translate3d(${(geo.vw / 2 - geo.ox) * k}px, ${(geo.vh / 2 - geo.oy) * k}px, 0) scale(${s})`;
    bg.style.filter = `blur(${clamp((p - 0.4) / 0.35) * 5}px)`;
    // the doorway's glow follows the doorway on screen (kept out of the zoomed layer)
    glow.style.setProperty('--gx', geo.ox + (geo.vw / 2 - geo.ox) * k + 'px');
    glow.style.setProperty('--gy', geo.oy + (geo.vh / 2 - geo.oy) * k + 'px');
    glow.style.setProperty('--gw', (geo.lw * s) / 2 + 'px');
    glow.style.setProperty('--gh', (geo.lh * s) / 2 + 'px');
    glow.style.opacity = clamp((p - 0.18) / 0.4);
    vignette.style.opacity = 1 - clamp((p - 0.06) / 0.28);

    fill.style.opacity = clamp((p - 0.72) / 0.18);
    menuBtn.classList.toggle('is-on', p > 0.9 || hero.getBoundingClientRect().bottom < 0);
  };

  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { renderHero(); ticking = false; }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); renderHero(); });
  measure(); renderHero();

  /* ── Fullscreen menu (Bram) ─────────────────────────────────────────── */
  const menu = $('[data-menu]');
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    menuBtn.setAttribute('aria-expanded', 'true');
    lenis?.stop();
    $('.menu__close', menu).focus();
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    lenis?.start();
    setTimeout(() => { menu.hidden = true; }, 700);
  }
  menuBtn.addEventListener('click', openMenu);
  $('[data-menu-close]').addEventListener('click', () => { closeMenu(); menuBtn.focus(); });

  /* ── Problem-first map: crop to the centre on small screens ─────────── */
  const pfmSvg = $('.pfm__svg');
  if (pfmSvg) {
    const fit = () => pfmSvg.setAttribute('viewBox', innerWidth <= 700 ? '172 40 1328 860' : '0 0 1672 941');
    fit(); addEventListener('resize', fit);
  }

  /* ── Line-by-line heading reveal ────────────────────────────────────── */
  const splitLines = (el) => {
    if (!el.dataset.src) el.dataset.src = el.innerHTML;
    el.innerHTML = el.dataset.src;
    const words = [];
    // wrap words (keeping <em> intact) so we can read their line positions
    const walk = (node, wrapper) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { node.insertBefore(document.createTextNode(' '), n); return; }
            const w = document.createElement('span');
            w.className = 'w'; w.textContent = part;
            node.insertBefore(w, n); words.push({ w, wrap: wrapper });
          });
          node.removeChild(n);
        } else if (n.nodeType === 1) walk(n, n.tagName);
      });
    };
    walk(el, null);
    const lines = [];
    let top = null;
    words.forEach(({ w, wrap }) => {
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(wrap === 'EM' ? `<em>${w.textContent}</em>` : w.textContent);
    });
    el.innerHTML = lines.map((l, i) => `<span class="line" style="--l:${i}"><span>${l.join(' ')}</span></span>`).join('');
  };
  const lineEls = $$('[data-lines]');
  if (!reduce) {
    const doSplit = () => lineEls.forEach(splitLines);
    document.fonts ? document.fonts.ready.then(doSplit) : doSplit();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(doSplit, 200); });
  }

  /* ── Scroll reveals ─────────────────────────────────────────────────── */
  const revealSel = ['.head', '.statement .eyebrow', '.statement .pill', '.pfm', '.build__item', '.project', '.mini', '.other', '.also',
    '.slider__top', '.slides', '.job', '.lab__words', '.about__photo', '.about__text > *'];
  $$(revealSel.join(',')).forEach((el) => {
    el.setAttribute('data-reveal', '');
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4) * 0.08 + 's');
  });
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  $$('[data-reveal], [data-lines]').forEach((el) => io.observe(el));

  /* ── Approach slider (Bram testimonial style) ───────────────────────── */
  const slider = $('[data-slider]');
  if (slider) {
    const slides = $$('.slide', slider);
    const num = $('[data-slide-num]', slider);
    const hint = $('[data-slide-next]', slider);
    const names = slides.map((s) => $('.slide__name', s).textContent);
    let i = 0;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, j) => { s.classList.toggle('is-active', j === i); s.setAttribute('aria-hidden', j !== i); });
      num.textContent = String(i + 1).padStart(2, '0');
      hint.textContent = i === slides.length - 1 ? `Back to ${names[0]}` : `Next — ${names[i + 1]}`;
    };
    $('[data-prev]', slider).addEventListener('click', () => go(i - 1));
    $('[data-next]', slider).addEventListener('click', () => go(i + 1));
    go(0);
  }

  /* ── Experience accordion ───────────────────────────────────────────── */
  $$('[data-accordion]').forEach((group) => {
    const rows = $$('.job', group);
    rows.forEach((row) => {
      const head = $('.job__head', row);
      head.addEventListener('click', () => {
        const open = !row.classList.contains('is-open');
        rows.forEach((r) => { r.classList.remove('is-open'); $('.job__head', r).setAttribute('aria-expanded', 'false'); });
        if (open) { row.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); }
        setTimeout(() => lenis?.resize(), 650);
      });
    });
  });

  /* ── Case study panel ───────────────────────────────────────────────── */
  const CASES = {
    content: {
      n: '01', cat: 'Content Intelligence & Automation', title: 'From content strategy to an <em>AI Micro-SaaS</em>',
      line: 'Turning content research and strategy into an automated workflow.',
      meta: [['Company', 'Krafty Lumin'], ['Type', 'AI Micro-SaaS'], ['Focus', 'Content intelligence'], ['Year', '2026']],
      img: 'assets/projects/content-intelligence.svg',
      problem: 'Content planning involves many manual steps across research, audience definition, structure and strategy.',
      solution: 'Analysed blog and YouTube content to understand the strategy behind what works, then translated those learnings into an automated workflow that takes user input and produces structured content outputs.',
      role: 'Content and performance analysis, workflow design and translating strategy into an end-to-end automated product flow.',
      flow: ['User input', 'Content research', 'Strategy analysis', 'AI workflow', 'Structured output'],
      tags: 'Content Intelligence · LLM Workflows · AI Automation · Micro-SaaS',
    },
    competitor: {
      n: '02', cat: 'Competitor Intelligence', title: 'Turning meeting intelligence <em>into action</em>',
      line: 'AI + RAG + business workflow + automation — not just a model.',
      meta: [['Company', 'Krafty Lumin'], ['Type', 'RAG workflow'], ['Focus', 'Meeting intelligence'], ['Year', '2026']],
      img: 'assets/projects/competitor-intelligence.svg',
      problem: 'Important competitor and business intelligence stays buried inside unstructured client-meeting information.',
      solution: 'A workflow that extracts and structures meeting intelligence, uses RAG for contextual analysis, routes each insight to the right department, prioritises the resulting tasks and supports scheduling.',
      role: 'Structuring meeting intelligence, RAG-based retrieval and analysis, department classification, task prioritisation and scheduling.',
      flow: ['Meeting information', 'Intelligence extraction', 'RAG analysis', 'Classification', 'Department assignment', 'Priority', 'Task scheduling'],
      tags: 'RAG · Semantic Retrieval · Meeting Intelligence · Workflow Automation',
    },
    story: {
      n: '03', cat: 'Enterprise AI Storytelling', title: 'Turning complex business data <em>into presentations</em>',
      line: 'Hybrid RAG + rule-based storytelling that creates audience-specific narratives.',
      meta: [['Company', 'Storient'], ['Type', 'AI SaaS'], ['Focus', 'Enterprise storytelling'], ['Year', '2025']],
      img: 'assets/projects/enterprise-storytelling.svg',
      problem: 'Business and sales information is data-heavy and hard to turn into clear, persuasive presentations.',
      solution: 'LLM-driven workflows that combine retrieval with storytelling logic. A hybrid RAG architecture selects the right context; rule-based storytelling frameworks shape it for clarity, structure and persuasion.',
      role: 'LLM workflows, structured generation, semantic retrieval, presentation automation — and frontend work integrating it all into a web-based SaaS.',
      flow: ['Business data', 'AI analysis', 'Retrieval', 'Storytelling logic', 'Structured narrative', 'Presentation'],
      tags: 'LLMs · RAG · Semantic Retrieval · Structured Generation · AI SaaS',
    },
    blog: {
      n: '04', cat: 'Blog Workflow Automation', title: 'From user input to <em>structured content</em>',
      line: 'Turning the content lifecycle into an automated product experience.',
      meta: [['Company', 'Krafty Lumin'], ['Type', 'Automation'], ['Focus', 'Content workflow'], ['Year', '2026']],
      img: 'assets/projects/blog-automation.svg',
      problem: 'Blog creation is full of repetitive research, structuring and workflow steps.',
      solution: 'Used content-strategy learnings to find the stages worth automating, then designed an AI workflow that moves from user input to structured content output.',
      role: 'Identifying automatable stages, designing the AI workflow and translating the content process into a product experience.',
      flow: ['User input', 'Research', 'Analysis', 'Structuring', 'AI generation', 'Content output'],
      tags: 'LLMs · Prompt Engineering · AI Automation · Web Workflow',
    },
  };
  const order = Object.keys(CASES);
  const panel = $('[data-case-panel]');
  const sheet = $('.case__sheet', panel);
  const content = $('[data-case-content]', panel);
  let lastFocus = null;

  const renderCase = (key) => {
    const c = CASES[key];
    const next = order[(order.indexOf(key) + 1) % order.length];
    content.innerHTML = `
      <p class="eyebrow">Case study ${c.n} — ${c.cat}</p>
      <h2 class="cs__title" id="case-title">${c.title}</h2>
      <p class="cs__line">${c.line}</p>
      <dl class="cs__meta">${c.meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <figure class="cs__img"><img src="${c.img}" alt=""></figure>
      <p class="cs__note">Illustrative mock-up, not client data or measured results.</p>
      <div class="cs__cols">
        <div><h3>Problem</h3><p>${c.problem}</p></div>
        <div><h3>Solution</h3><p>${c.solution}</p></div>
        <div><h3>What I did</h3><p>${c.role}</p></div>
      </div>
      <ol class="cs__flow" aria-label="Workflow">${c.flow.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="cs__tags">${c.tags}</p>
      <div class="cs__next"><p class="eyebrow">Next case</p><a href="#case/${next}" data-case="${next}">${CASES[next].cat}</a></div>`;
  };
  const openCase = (key) => {
    if (!CASES[key]) return;
    renderCase(key);
    if (panel.hidden) {
      lastFocus = document.activeElement;
      panel.hidden = false;
      lenis?.stop();
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.classList.add('case-open');
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
    }
    sheet.scrollTop = 0;
    sheet.focus({ preventScroll: true });
    if (location.hash !== '#case/' + key) history.replaceState(null, '', '#case/' + key);
  };
  const closeCase = () => {
    if (panel.hidden) return;
    panel.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.documentElement.classList.remove('case-open');
    lenis?.start();
    history.replaceState(null, '', location.pathname);
    setTimeout(() => { panel.hidden = true; }, 700);
    lastFocus?.focus({ preventScroll: true });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-case]');
    if (a) { e.preventDefault(); openCase(a.dataset.case); return; }
    if (e.target.closest('[data-case-close]')) closeCase();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!panel.hidden) closeCase(); else closeMenu();
  });
  if (location.hash.startsWith('#case/')) openCase(location.hash.slice(6));

  /* ── Footer curtain reveal only when the footer fits the viewport ──── */
  const footer = $('.footer');
  const curtain = () => footer.classList.toggle('is-curtain', footer.offsetHeight < innerHeight - 40);
  curtain(); addEventListener('resize', curtain);

  /* ── Misc ───────────────────────────────────────────────────────────── */
  const yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
