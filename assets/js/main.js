/* bigbasket Careers – page interactions (no dependencies) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  const toggle = $('#navToggle');
  const links = $('#navLinks');
  const setMenu = (open) => {
    links.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (links.classList.contains('is-open') && !e.target.closest('.nav')) setMenu(false);
  });

  /* ---------- Hero video: pause when off-screen / reduced motion ---------- */
  const video = $('.hero__video');
  if (video) {
    if (reduceMotion) video.removeAttribute('autoplay'), video.pause();
    else new IntersectionObserver(([en]) => (en.isIntersecting ? video.play().catch(() => {}) : video.pause()))
      .observe(video);
  }

  /* ---------- Journey: velocity tracker (bike animation kept) ---------- */
  // Edit phases here. Each phase shows three milestones.
  const phases = [
    { label: 'Genesis', items: [
      ['2011', 'bigbasket Bengaluru launch', '$1M seed capital'],
      ['2012', 'Series A – $10M', '$10M raised from Ascent Capital'],
      ['2014', 'T1 Expansion', 'Operations expand to other T1 cities'] ] },
    { label: 'Hyper-Scaling', items: [
      ['2015', 'Milestone title', 'Short milestone description.'],
      ['2016', 'Milestone title', 'Short milestone description.'],
      ['2017', 'Milestone title', 'Short milestone description.'] ] },
    { label: 'Unicorn Realm', items: [
      ['2018', 'Milestone title', 'Short milestone description.'],
      ['2019', 'Milestone title', 'Short milestone description.'],
      ['2020', 'Milestone title', 'Short milestone description.'] ] },
    { label: '10-Minute Dawn', items: [
      ['2021', 'Milestone title', 'Short milestone description.'],
      ['2022', 'Milestone title', 'Short milestone description.'],
      ['2023', 'Milestone title', 'Short milestone description.'] ] },
    { label: 'Next Frontier', items: [
      ['2024', 'Milestone title', 'Short milestone description.'],
      ['2025', 'Milestone title', 'Short milestone description.'],
      ['2026', 'Milestone title', 'Short milestone description.'] ] },
  ];

  const tabsEl = $('#phaseTabs');
  const panel = $('#milestones');
  const fill = $('#roadFill');
  const bike = $('#bike');
  if (tabsEl) {
    let current = -1;
    const tabs = phases.map((p, i) => {
      const b = document.createElement('button');
      b.className = 'tab';
      b.type = 'button';
      b.role = 'tab';
      b.id = 'phase-' + i;
      b.textContent = p.label;
      b.setAttribute('aria-controls', 'milestones');
      tabsEl.append(b);
      return b;
    });

    const render = (i) => {
      panel.innerHTML = phases[i].items
        .map(([y, t, d]) => `<div class="milestone"><strong>${y}</strong><h4>${t}</h4><p>${d}</p></div>`)
        .join('');
    };

    // Park the bike (and the green progress line) directly under the active tab
    const road = bike.parentElement;
    const place = (i) => {
      const t = tabs[i].getBoundingClientRect(), r = road.getBoundingClientRect();
      const x = Math.max(45, Math.min(r.width - 45, t.left + t.width / 2 - r.left));
      road.style.setProperty('--x', x + 'px');
    };
    addEventListener('resize', () => place(current));
    tabsEl.addEventListener('scroll', () => place(current), { passive: true });
    if (document.fonts) document.fonts.ready.then(() => place(current));

    const go = (i, focus) => {
      i = Math.max(0, Math.min(phases.length - 1, i));
      if (i === current) return;
      const back = i < current;
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', k === i);
        t.tabIndex = k === i ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tabs[i].id);
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      if (focus) tabs[i].focus({ preventScroll: true });

      place(i);
      bike.classList.toggle('is-reverse', back);

      if (current === -1) { current = i; return; } // first paint: HTML already has phase 0
      current = i;
      panel.classList.add('is-fading');
      setTimeout(() => { render(i); panel.classList.remove('is-fading'); }, 250);
    };

    tabsEl.addEventListener('click', (e) => {
      const t = e.target.closest('.tab');
      if (t) go(tabs.indexOf(t));
    });
    // Desktop hover switches phase (original behaviour)
    if (matchMedia('(hover: hover) and (min-width: 900px)').matches) {
      tabsEl.addEventListener('mouseover', (e) => {
        const t = e.target.closest('.tab');
        if (t) go(tabs.indexOf(t));
      });
    }
    // Arrow buttons
    $$('#tracker .arrow').forEach((b) => b.addEventListener('click', () => go(current + Number(b.dataset.dir))));
    // Keyboard (only when the tabs have focus – doesn't hijack page scrolling)
    tabsEl.addEventListener('keydown', (e) => {
      const map = { ArrowRight: 1, ArrowLeft: -1 };
      if (map[e.key]) { e.preventDefault(); go(current + map[e.key], true); }
      if (e.key === 'Home') { e.preventDefault(); go(0, true); }
      if (e.key === 'End') { e.preventDefault(); go(phases.length - 1, true); }
    });
    // Swipe on the milestone card (mobile)
    let x0 = 0;
    panel.addEventListener('touchstart', (e) => (x0 = e.changedTouches[0].clientX), { passive: true });
    panel.addEventListener('touchend', (e) => {
      const dx = x0 - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 60) go(current + Math.sign(dx));
    }, { passive: true });

    go(0);
  }

  /* ---------- Stats count-up when visible ---------- */
  const counters = $$('[data-count]');
  if (counters.length && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        io.unobserve(target);
        const end = +target.dataset.count, suf = target.dataset.suffix, t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / 1200);
          target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => io.observe(c));
  }

  /* ---------- YouTube facade: load iframe only on click ---------- */
  const player = $('.reel__player');
  if (player) {
    player.addEventListener('click', () => {
      const id = player.dataset.yt;
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      f.title = 'Our Reel Story';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      player.replaceWith(Object.assign(document.createElement('div'), { className: 'reel__player' }));
      $('.reel .reel__player').append(f);
    }, { once: true });
  }

  /* ---------- Voices: centre-focus carousel (loops endlessly) ---------- */
  const voices = $('#voices');
  if (voices) {
    const track = $('.voices__track', voices), view = $('.voices__view', voices);
    const cards = () => [...track.children];
    const mid = Math.floor(track.children.length / 2);
    let busy = false;
    const centre = (i, animate) => {
      const c = cards()[i];
      track.style.transition = animate ? '' : 'none';
      cards().forEach((el, k) => el.classList.toggle('is-active', k === i));
      track.style.transform = `translateX(${view.clientWidth / 2 - c.offsetLeft - c.offsetWidth / 2}px)`;
    };
    // start with the card marked .is-active in the middle
    let start = cards().findIndex((c) => c.classList.contains('is-active'));
    for (; start > mid; start--) track.append(track.firstElementChild);
    for (; start >= 0 && start < mid; start++) track.prepend(track.lastElementChild);
    centre(mid, false);

    const move = (dir) => {
      if (busy || track.children.length < 3) return;
      busy = true;
      centre(mid + dir, true);
      setTimeout(() => { // then recycle the card that slid out, without a visible jump
        if (dir > 0) track.append(track.firstElementChild);
        else track.prepend(track.lastElementChild);
        centre(mid, false);
        void track.offsetWidth;
        track.style.transition = '';
        busy = false;
      }, reduceMotion ? 0 : 620);
    };
    $$('.voices__btn', voices).forEach((b) => b.addEventListener('click', () => move(Number(b.dataset.dir))));
    track.addEventListener('click', (e) => {
      const i = cards().indexOf(e.target.closest('.voice'));
      if (i > -1 && i !== mid) move(Math.sign(i - mid));
    });
    let vx = 0;
    view.addEventListener('touchstart', (e) => (vx = e.changedTouches[0].clientX), { passive: true });
    view.addEventListener('touchend', (e) => {
      const dx = vx - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 50) move(Math.sign(dx));
    }, { passive: true });
    addEventListener('resize', () => centre(mid, false));
  }

  /* ---------- Life gallery: smooth lightbox ---------- */
  const box = $('#lightbox');
  if (box && box.showModal) {
    const img = $('#lightboxImg'), items = $$('.gallery button');
    let at = 0;
    const open = (i) => {
      at = (i + items.length) % items.length;
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; // replay zoom-in
      img.src = items[at].dataset.full;
      img.alt = $('img', items[at]).alt;
      if (!box.open) box.showModal();
    };
    const close = () => {
      box.classList.add('is-closing');
      setTimeout(() => { box.classList.remove('is-closing'); box.close(); }, reduceMotion ? 0 : 250);
    };
    items.forEach((b, i) => b.addEventListener('click', () => open(i)));
    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'prev') open(at - 1);
      else if (act === 'next') open(at + 1);
      else if (act === 'close' || e.target === box) close();
    });
    box.addEventListener('cancel', (e) => { e.preventDefault(); close(); }); // Esc
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') open(at - 1);
      if (e.key === 'ArrowRight') open(at + 1);
    });
  }

  /* ---------- Highlight nav link of section in view ---------- */
  const navLinks = $$('.nav__links a[href^="#"]');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => (a.getAttribute('href') === '#' + en.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
