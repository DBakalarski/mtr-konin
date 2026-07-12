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
     The story every canvas tells: measure → correct → balanced.
     It restarts from the beginning each time it scrolls into view. */

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

  const RESIDUAL = 0.045; // a balanced wheel still isn't a laser line

  const drawWave = (ctx, w, h, t, dampAt, scanX) => {
    // dampAt(x): 1 = full vibration … RESIDUAL = balanced
    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;
    const amp = h * 0.34;

    // ghost trace — the "before" measurement, kept as evidence
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = mid + noise(x, 1.7 + x * 0.001) * amp * 0.8 * (1 - (x / w) * 0.4);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(142,151,163,0.13)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // main trace — flattened wherever the balancer has already passed
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const y = mid + noise(x, t) * amp * dampAt(x);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(213,0,28,0.9)");
    grad.addColorStop(0.55, "rgba(233,235,239,0.75)");
    grad.addColorStop(1, "rgba(233,235,239,0.95)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // corrector head
    if (scanX !== null && scanX >= -2 && scanX <= w + 2) {
      const sg = ctx.createLinearGradient(scanX - 70, 0, scanX, 0);
      sg.addColorStop(0, "rgba(213,0,28,0)");
      sg.addColorStop(1, "rgba(213,0,28,0.45)");
      ctx.fillStyle = sg;
      ctx.fillRect(scanX - 70, 0, 70, h);
      ctx.fillStyle = "rgba(213,0,28,0.9)";
      ctx.fillRect(scanX, 0, 1.5, h);
    }
  };

  // smooth step between "still vibrating" and "already balanced"
  const sweepDamp = (scanX, blend = 60) => (x) => {
    if (x <= scanX - blend) return RESIDUAL;
    if (x >= scanX) return 1;
    const p = (scanX - x) / blend;
    return 1 + (RESIDUAL - 1) * p * p * (3 - 2 * p);
  };

  /* story runner: measure → fix → balanced (+ periodic re-check),
     restarting whenever the canvas re-enters the viewport */
  const runStory = (canvas, o) => {
    const ctx = setupCanvas(canvas);

    if (reduceMotion) {
      // show the end state — problem already solved
      drawWave(ctx, canvas.offsetWidth, canvas.offsetHeight, 1.7, () => RESIDUAL, null);
      o.onFixed();
      return;
    }

    const RECHECK = 7;
    let start = null;
    let phase = "";
    let visible = false;
    let ranOnce = false;

    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visible) { start = null; phase = ""; o.onRestart(); }
      visible = e.isIntersecting;
    }, { threshold: 0.3 }).observe(canvas);

    const loop = (now) => {
      requestAnimationFrame(loop);
      if (!visible) return;
      if (start === null) {
        if (o.gate && !o.gate()) return;
        start = now + (ranOnce ? 400 : o.firstDelay || 0);
        ranOnce = true;
      }
      const t = now / 1000;
      const el = Math.max(0, (now - start) / 1000);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const total = o.measure + o.fix;

      if (el < o.measure) {
        if (phase !== "measure") { phase = "measure"; o.onMeasure(); }
        drawWave(ctx, w, h, t, () => 1, null);
        o.onTick(el / total, 0.36 + Math.abs(noise(10, t)) * 0.24);
      } else if (el < total) {
        const p = (el - o.measure) / o.fix;
        if (phase !== "fix") { phase = "fix"; o.onFix(); }
        const eased = 1 - Math.pow(1 - p, 3);
        const scanX = eased * (w + 80);
        drawWave(ctx, w, h, t, sweepDamp(scanX), scanX);
        o.onTick(el / total, 0.48 * (1 - eased));
      } else {
        if (phase !== "fixed") { phase = "fixed"; o.onFixed(); }
        // balanced line stays balanced; a slow sweep re-checks it now and then
        const since = el - total - 3;
        const cycle = since >= 0 ? since % RECHECK : -1;
        const scanX = cycle >= 0 && cycle < 2.4 ? (cycle / 2.4) * (w + 80) : null;
        drawWave(ctx, w, h, t, () => RESIDUAL, scanX);
      }
    };
    requestAnimationFrame(loop);
  };

  /* hero wave */
  const heroCanvas = document.getElementById("waveHero");
  if (heroCanvas) {
    const vib = document.getElementById("roVib");
    const state = document.getElementById("roState");
    const phaseEl = document.getElementById("roPhase");
    const progress = document.getElementById("waveProgress");
    const bar = document.getElementById("waveBar");

    runStory(heroCanvas, {
      measure: 1.5,
      fix: 2.8,
      firstDelay: 1500,
      gate: () => document.body.classList.contains("intro-done"),
      onRestart() {
        progress.classList.remove("done");
        bar.style.width = "0";
        vib.textContent = "0.48 g"; vib.classList.remove("ok");
        state.textContent = "— WYKRYTO BICIE"; state.classList.remove("ok");
        phaseEl.textContent = "TEST DROGOWY · POMIAR…"; phaseEl.classList.add("running");
      },
      onMeasure() {
        phaseEl.textContent = "TEST DROGOWY · POMIAR…";
      },
      onFix() {
        phaseEl.textContent = "TEST DROGOWY · KOREKTA…";
        state.textContent = "— KOREKTA…";
      },
      onTick(p, g) {
        bar.style.width = (Math.min(p, 1) * 100).toFixed(1) + "%";
        vib.textContent = g.toFixed(2) + " g";
      },
      onFixed() {
        if (bar) { bar.style.width = "100%"; progress.classList.add("done"); }
        vib.textContent = "0.00 g"; vib.classList.add("ok");
        state.textContent = "— WYWAŻONE ✓"; state.classList.add("ok");
        phaseEl.textContent = "TEST DROGOWY · ZAKOŃCZONY"; phaseEl.classList.remove("running");
      },
    });
  }

  /* tech meter — same story, so it also works when the meter
     isn't sticky (mobile): it plays itself when scrolled into view */
  const techCanvas = document.getElementById("waveTech");
  if (techCanvas) {
    const vib = document.getElementById("techVib");
    const state = document.getElementById("techState");

    runStory(techCanvas, {
      measure: 1.3,
      fix: 2.4,
      firstDelay: 300,
      onRestart() {
        vib.textContent = "0.48 g";
        state.textContent = "— WYKRYTO BICIE"; state.classList.remove("ok");
      },
      onMeasure() {
        state.textContent = "— WYKRYTO BICIE";
      },
      onFix() {
        state.textContent = "— KOREKTA…";
      },
      onTick(p, g) {
        vib.textContent = g.toFixed(2) + " g";
      },
      onFixed() {
        vib.textContent = "0.00 g";
        state.textContent = "— WYWAŻONE ✓"; state.classList.add("ok");
      },
    });
  }
})();
