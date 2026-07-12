/* ═══════════════════════════════════════════════════════════
   MTR PREMIUM SERVICE — interactions & animations
   ═══════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── intro → hero choreography ─────────────────────────── */
  const INTRO_MS = reduceMotion ? 0 : 2050;
  setTimeout(() => document.body.classList.add("intro-done"), INTRO_MS);

  /* ── nav: glass on scroll, hide on scroll down ─────────── */
  const nav = document.getElementById("nav");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    nav.classList.toggle("hidden", y > 500 && y > lastY && !mobileMenu.classList.contains("open"));
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── mobile menu ───────────────────────────────────────── */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const toggleMenu = (open) => {
    burger.classList.toggle("open", open);
    mobileMenu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    mobileMenu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleMenu(!mobileMenu.classList.contains("open")));
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ── scroll reveal ─────────────────────────────────────── */
  const revealIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealIO.unobserve(e.target);
      }
    }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => revealIO.observe(el));

  /* ── animated counters ─────────────────────────────────── */
  const countIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const target = +el.dataset.count;
      if (reduceMotion) { el.textContent = target; return; }
      const t0 = performance.now();
      const dur = 1600;
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }),
    { threshold: 0.6 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => countIO.observe(el));

  /* ── magnetic buttons ──────────────────────────────────── */
  if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = `translate(${x * 5}px, ${y * 4}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ── card cursor sheen ─────────────────────────────────── */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ═══════════ SIGNATURE: Road Force waveform ═══════════
     A vibration trace that flattens into a clean line —
     what road-force balancing does to your steering wheel. */

  const setupCanvas = (canvas) => {
    const ctx = canvas.getContext("2d");
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return ctx;
  };

  // layered pseudo-noise — smooth, organic jitter
  const noise = (x, t) =>
    Math.sin(x * 0.055 + t * 1.9) * 0.52 +
    Math.sin(x * 0.13 - t * 1.3) * 0.3 +
    Math.sin(x * 0.31 + t * 3.1) * 0.18;

  const drawWave = (ctx, w, h, t, damp) => {
    // damp: 1 = full vibration … 0 = perfectly flat
    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;
    const amp = h * 0.34;

    // ghost trace (before)
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = mid + noise(x, t * 0.6) * amp * 0.9;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(142,151,163,0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // main trace: vibration on the left fades to flat on the right
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const fade = 1 - x / w;                    // spatial envelope
      const y = mid + noise(x, t) * amp * fade * damp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(213,0,28,0.95)");
    grad.addColorStop(0.55, "rgba(233,235,239,0.75)");
    grad.addColorStop(1, "rgba(233,235,239,0.95)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // scan marker sweeping across
    const sx = ((t * 90) % (w + 160)) - 80;
    const sg = ctx.createLinearGradient(sx - 60, 0, sx, 0);
    sg.addColorStop(0, "rgba(213,0,28,0)");
    sg.addColorStop(1, "rgba(213,0,28,0.5)");
    ctx.fillStyle = sg;
    ctx.fillRect(sx - 60, 0, 60, h);
    ctx.fillStyle = "rgba(213,0,28,0.9)";
    ctx.fillRect(sx, 0, 1.5, h);
  };

  /* hero wave — ambient loop */
  const heroCanvas = document.getElementById("waveHero");
  const roVib = document.getElementById("roVib");
  if (heroCanvas && !reduceMotion) {
    const ctx = setupCanvas(heroCanvas);
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(heroCanvas);
    const loop = (now) => {
      if (visible) {
        const t = now / 1000;
        drawWave(ctx, heroCanvas.offsetWidth, heroCanvas.offsetHeight, t, 1);
        if (roVib && Math.floor(t * 4) % 2 === 0) {
          roVib.textContent = (0.32 + Math.abs(noise(10, t)) * 0.3).toFixed(2);
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } else if (heroCanvas) {
    // reduced motion: single static frame
    const ctx = setupCanvas(heroCanvas);
    drawWave(ctx, heroCanvas.offsetWidth, heroCanvas.offsetHeight, 1.7, 1);
  }

  /* tech wave — scroll-linked: vibration flattens as you read */
  const techCanvas = document.getElementById("waveTech");
  const techVib = document.getElementById("techVib");
  const techState = document.getElementById("techState");
  const techSection = document.getElementById("technologia");
  if (techCanvas && techSection) {
    const ctx = setupCanvas(techCanvas);
    let progress = 0;
    let raf = null;

    const render = (now) => {
      raf = null;
      const damp = Math.max(0, 1 - progress * 1.15);
      drawWave(ctx, techCanvas.offsetWidth, techCanvas.offsetHeight, now / 1000, damp);
      const g = 0.48 * damp;
      techVib.textContent = g.toFixed(2) + " g";
      const done = g < 0.05;
      techState.textContent = done ? "— WYWAŻONE" : "— WYKRYTO BICIE";
      techState.classList.toggle("ok", done);
    };

    const update = () => {
      const r = techSection.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      progress = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
      if (!raf) raf = requestAnimationFrame(render);
    };

    if (reduceMotion) {
      drawWave(ctx, techCanvas.offsetWidth, techCanvas.offsetHeight, 1.7, 0);
      techVib.textContent = "0.00 g";
      techState.textContent = "— WYWAŻONE";
      techState.classList.add("ok");
    } else {
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      update();
      // gentle ambient motion while the section is on screen
      let visible = false;
      new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(techCanvas);
      const ambient = (now) => {
        if (visible && !raf) render(now);
        requestAnimationFrame(ambient);
      };
      requestAnimationFrame(ambient);
    }
  }
})();
