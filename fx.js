// Game-feel effects shared by every page. Loaded with `defer`.
// Everything except the progress bar is skipped for visitors who prefer reduced motion.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PALETTE = ['#ff5fa8', '#ffb3d1', '#c9b0ff', '#8ef0ea', '#7cb8ff', '#ffffff'];

  // ---------- Scroll progress bar (a star rides the tip) ----------
  const progress = document.querySelector('.progress');
  if (progress) {
    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max) : 0);
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // ---------- Pixel sparkle burst ----------
  function burst(x, y, count = 8, spread = 34) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'fx-spark';
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.background = PALETTE[i % PALETTE.length];
      const size = i % 3 === 0 ? 6 : 4;
      s.style.width = s.style.height = size + 'px';
      document.body.appendChild(s);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = spread * (0.6 + Math.random() * 0.6);
      s.animate([
        { transform: 'translate(-50%, -50%)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`, opacity: 0 },
      ], { duration: 520, easing: 'steps(6)' }).onfinish = () => s.remove();
    }
  }

  // ---------- Poke the star: it hops, closes its eyes happily and bursts sparkles ----------
  const starBtn = document.querySelector('.mascot-btn');
  const bubble = document.querySelector('.bubble');
  if (starBtn && bubble && !reduceMotion) {
    starBtn.addEventListener('click', () => {
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      starBtn.classList.remove('poked'); void starBtn.offsetWidth; starBtn.classList.add('poked');
      const r = starBtn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 14, 110);
    });
    starBtn.addEventListener('animationend', e => { if (e.animationName === 'hop') starBtn.classList.remove('poked'); });
  }

  if (reduceMotion) return;

  // ---------- Click sparkles anywhere ----------
  addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('input, textarea, select, .mascot-btn')) return;
    burst(e.clientX, e.clientY);
  });

  // ---------- Scroll reveals ----------
  if ('IntersectionObserver' in window) {
    const targets = ['.dialogue', '.fun-facts li', '.interest-card', '.t-entry', '.project-card', '.ig-card',
      '.art-piece', '.skill-group', '.collab', 'main section > h2', '.info-strip > div', '.prose > p', '.prose > ul',
      '.prose > ol', '.prose > h3', '.loop li', '.facts li', '.diagram', '.case-nav a'];
    const els = [...new Set(document.querySelectorAll(targets.join(',')))];
    const set = new Set(els);
    els.forEach(el => {
      const i = [...el.parentElement.children].filter(c => set.has(c)).indexOf(el);
      el.style.setProperty('--d', Math.min(i, 6) * 90 + 'ms');
      el.classList.add('reveal');
    });
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver(entries => entries.forEach(({ isIntersecting, target: el }) => {
      if (!isIntersecting) return;
      io.unobserve(el);
      el.classList.add('in');
      el.addEventListener('animationend', function done(e) {
        if (e.target !== el) return;
        el.classList.remove('reveal', 'in');
        el.style.removeProperty('--d');
        el.removeEventListener('animationend', done);
        el.dispatchEvent(new CustomEvent('revealed'));
      });
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }

  // ---------- RPG-style typing in the About dialogue ----------
  const dialogue = document.querySelector('.dialogue');
  const lede = dialogue && dialogue.querySelector('.lede');
  if (lede) {
    const text = lede.textContent.replace(/\s+/g, ' ').trim();
    // Screen readers get the whole text at once; the typed/remaining halves are visual only.
    // The remaining text stays in place (invisible) so the box never changes size while typing.
    lede.textContent = '';
    const sr = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: text });
    const typed = Object.assign(document.createElement('span'), { className: 'typed' });
    const rest = Object.assign(document.createElement('span'), { className: 'untyped', textContent: text });
    const more = Object.assign(document.createElement('span'), { className: 'more', textContent: ' ▼' });
    typed.setAttribute('aria-hidden', 'true'); rest.setAttribute('aria-hidden', 'true'); more.setAttribute('aria-hidden', 'true');
    lede.append(sr, typed, rest, more);
    dialogue.classList.add('typing');

    let i = 0, timer = null;
    const finish = () => {
      clearInterval(timer);
      typed.textContent = text; rest.textContent = '';
      dialogue.classList.remove('typing');
      dialogue.classList.add('typed-done');
    };
    const start = () => {
      if (timer || !dialogue.classList.contains('typing')) return;
      timer = setInterval(() => {
        i = Math.min(text.length, i + 2);
        typed.textContent = text.slice(0, i);
        rest.textContent = text.slice(i);
        if (i >= text.length) finish();
      }, 16);
    };
    dialogue.addEventListener('click', () => { if (dialogue.classList.contains('typing')) finish(); });
    // start once the box has popped in (or right away if reveals aren't running)
    if (dialogue.classList.contains('reveal')) dialogue.addEventListener('revealed', start, { once: true });
    else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); start(); } }).observe(dialogue);
  }

})();
