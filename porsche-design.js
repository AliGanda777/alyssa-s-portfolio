    // Color picker — swaps car image + page accent + shadow + label (with fade)
    const dots = document.querySelectorAll('.color-dot');
    const carImg = document.getElementById('car-img');
    const carWrap = document.getElementById('car-wrap');
    const label = document.getElementById('color-name');
    const modelEl = document.getElementById('current-model');
    const specModel = document.getElementById('spec-model');
    const specBadges = document.getElementById('spec-badges');
    const specAccel = document.getElementById('spec-accel');
    const specAccelLabel = document.getElementById('spec-accel-label');
    const specPower = document.getElementById('spec-power');
    const specPowerLabel = document.getElementById('spec-power-label');
    const specTop = document.getElementById('spec-top');
    const specFront = document.getElementById('spec-front');

    function hexToRgba(hex, a) {
      const h = hex.replace('#', '');
      const n = parseInt(h.length === 3
        ? h.split('').map(c => c + c).join('')
        : h, 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    }
    // Return a version of the finish color that's still readable on a black bg.
    // Dark colors are lightened toward white while keeping their original hue,
    // so the highlight always reflects the picked color (Jet Black → soft silver,
    // Gentian Blue → light blue, etc.) — never disappears.
    function readableAccent(hex) {
      const h = hex.replace('#', '');
      const n = parseInt(h.length === 3
        ? h.split('').map(c => c + c).join('')
        : h, 16);
      let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const TARGET = 0.62; // minimum luminance for readability on black
      if (lum < TARGET) {
        const ratio = (TARGET - lum) / Math.max(1 - lum, 0.01);
        r = Math.round(r + (255 - r) * ratio);
        g = Math.round(g + (255 - g) * ratio);
        b = Math.round(b + (255 - b) * ratio);
      }
      const hex2 = (v) => v.toString(16).padStart(2, '0');
      return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
    }
    let swapping = false;
    const EXIT_MS = 550;
    const ENTER_MS = 700;

    function waitEvent(el, name, timeout) {
      return new Promise((resolve) => {
        const done = () => { el.removeEventListener(name, done); resolve(); };
        el.addEventListener(name, done, { once: true });
        if (timeout) setTimeout(done, timeout);
      });
    }

    // Turn "3.0 s" or "398 kW / 541 PS" into "<b>3.0</b><small>s</small>"-style markup
    function formatSpec(text) {
      if (!text) return '';
      return text.replace(/(\d[\d.]*)\s*([A-Za-z/]+)/g, '$1<small>$2</small>');
    }

    function updateSpecPanel(d) {
      if (!d) return;
      if (specModel && d.model) specModel.textContent = d.model;
      if (specBadges) {
        specBadges.innerHTML = '';
        ['Gasoline', d.drive, d.trans].filter(Boolean).forEach((t) => {
          const s = document.createElement('span');
          s.className = 'badge';
          s.textContent = t;
          specBadges.appendChild(s);
        });
      }
      if (specAccel && d.accel) specAccel.innerHTML = formatSpec(d.accel);
      if (specAccelLabel && d.accelLabel) specAccelLabel.textContent = d.accelLabel;
      if (specPower && d.power) specPower.innerHTML = formatSpec(d.power);
      if (specPowerLabel) {
        specPowerLabel.textContent = d.powerLabel || 'Power combined (kW) / Power combined (PS)';
      }
      if (specTop && d.top) specTop.innerHTML = formatSpec(d.top);

      if (specFront && d.front && specFront.src !== d.front) {
        specFront.style.opacity = '0';
        const pre = new Image();
        pre.onload = () => {
          specFront.src = d.front;
          specFront.alt = `Porsche ${d.model || '911'} front view`;
          requestAnimationFrame(() => { specFront.style.opacity = '1'; });
        };
        pre.onerror = () => { specFront.style.opacity = '1'; };
        pre.src = d.front;
      }
    }

    async function applyColor(hex, name, imgUrl, model, dataset) {
      updateSpecPanel(dataset);
      const textHex = readableAccent(hex);
      // Scope the finish color to ONLY the configurator and spec panel,
      // so the rest of the site keeps its fixed red + black identity.
      const scopedSections = document.querySelectorAll('#configurator, #spec-panel');
      scopedSections.forEach((s) => {
        s.style.setProperty('--accent', hex);
        s.style.setProperty('--accent-text', textHex);
        s.style.setProperty('--accent-glow', hexToRgba(textHex, 0.35));
      });
      if (carWrap) carWrap.style.filter = `drop-shadow(0 40px 50px ${hexToRgba(hex, 0.45)})`;
      if (label && name) label.textContent = name;
      if (modelEl && model) modelEl.textContent = model;
      if (!carImg || !imgUrl || carImg.src === imgUrl || swapping) return;

      swapping = true;

      // Kick off the preload in parallel — don't block the animation on network
      const preloadPromise = new Promise((resolve) => {
        const pre = new Image();
        pre.onload = resolve;
        pre.onerror = resolve;
        pre.src = imgUrl;
      });

      // Start exit animation IMMEDIATELY so the click feels responsive
      carImg.style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.55, 0, 0.85, 0.1)`;
      carImg.style.transform = 'translateX(140vw)';

      // Wait for BOTH the exit to finish AND the preload to complete
      await Promise.all([
        waitEvent(carImg, 'transitionend', EXIT_MS + 80),
        preloadPromise,
      ]);

      // Teleport to the left edge instantly, swap src while hidden
      carImg.style.transition = 'none';
      carImg.src = imgUrl;
      carImg.alt = `Porsche 911 — ${name}`;
      carImg.style.transform = 'translateX(-140vw)';
      // Force reflow so the instant transform lands before we animate
      // eslint-disable-next-line no-unused-expressions
      carImg.offsetWidth;

      // Slide in from the left (decelerating for that carousel feel)
      carImg.style.transition = `transform ${ENTER_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1)`;
      carImg.style.transform = 'translateX(0)';
      await waitEvent(carImg, 'transitionend', ENTER_MS + 80);

      swapping = false;
    }
    // ─── Preload ALL car images on page load so transitions never wait ────
    (function preloadAll() {
      dots.forEach((d) => {
        if (d.dataset.img) {
          const i = new Image();
          i.decoding = 'async';
          i.src = d.dataset.img;
        }
        if (d.dataset.front) {
          const f = new Image();
          f.decoding = 'async';
          f.src = d.dataset.front;
        }
      });
    })();

    function selectDot(dot) {
      if (!dot) return;
      dots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      applyColor(
        dot.dataset.color,
        dot.dataset.name,
        dot.dataset.img,
        dot.dataset.model,
        dot.dataset
      );
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => selectDot(dot));
    });

    // Prev / Next arrows cycle through colors (both on 2nd and 3rd slide)
    function step(delta) {
      const arr = Array.from(dots);
      const current = arr.findIndex(d => d.classList.contains('active'));
      const next = (current + delta + arr.length) % arr.length;
      selectDot(arr[next]);
    }
    document.querySelectorAll('.car-nav-prev').forEach(btn => {
      btn.addEventListener('click', () => step(-1));
    });
    document.querySelectorAll('.car-nav-next').forEach(btn => {
      btn.addEventListener('click', () => step(1));
    });

    // Scroll reveal (supports both .reveal and .reveal-up, with optional stagger)
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal, .reveal-up').forEach(el => io.observe(el));

    // Auto-apply reveal-up to key section blocks + stagger their children
    const autoTargets = [
      { sel: '.spec-content', children: '.spec-model, .spec-badges, .spec-item' },
      { sel: '.spec-visual', children: '.spec-front-img' },
      { sel: '.car-stage', children: '.car-wrap, .color-picker' },
      { sel: '.config-head', children: '.config-title' },
      { sel: '.heritage-inner', children: 'blockquote, .since' },
      { sel: '.cta', children: 'h2' },
      { sel: '.section-head', children: '.eyebrow, h2, p, .section-question' },
      { sel: '.variant-grid', children: '.variant' },
    ];
    autoTargets.forEach((t) => {
      document.querySelectorAll(t.sel).forEach((parent) => {
        const kids = parent.querySelectorAll(t.children);
        kids.forEach((k, i) => {
          k.classList.add('reveal-up');
          k.style.setProperty('--reveal-delay', `${i * 110}ms`);
          io.observe(k);
        });
      });
    });

    // Parallax on hero car (mouse-tracking tilt)
    const car = document.getElementById('car-wrap');
    if (car) {
      document.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / window.innerWidth) - 0.5;
        const ny = (e.clientY / window.innerHeight) - 0.5;
        car.style.transform = `translate3d(${nx * 22}px, ${ny * 10}px, 0) rotateY(${nx * 5}deg)`;
      });
    }

    // ─── MENU DRAWER ────────────────────────────────────
    (function () {
      const toggle = document.querySelector('.menu-toggle');
      const drawer = document.getElementById('menu-drawer');
      const backdrop = document.getElementById('menu-backdrop');
      const closeBtn = document.getElementById('menu-close');
      if (!toggle || !drawer || !backdrop) return;

      function open() {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        document.body.classList.add('menu-open');
        drawer.setAttribute('aria-hidden', 'false');
        backdrop.setAttribute('aria-hidden', 'false');
      }
      function close() {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.classList.remove('menu-open');
        drawer.setAttribute('aria-hidden', 'true');
        backdrop.setAttribute('aria-hidden', 'true');
      }

      toggle.addEventListener('click', open);
      backdrop.addEventListener('click', close);
      if (closeBtn) closeBtn.addEventListener('click', close);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) close();
      });
      drawer.querySelectorAll('[data-menu-link]').forEach((a) => {
        a.addEventListener('click', () => setTimeout(close, 120));
      });
    })();
