/* ==========================================================================
   GRUPO SURS · script.js
   Sin librerías externas: todo el movimiento es JavaScript + CSS propio.
   Si este archivo falla, la página sigue completa (el contenido no depende de JS).
   Índice: config · utilidades · WhatsApp · cargador · encabezado · reveal ·
   contadores · motor de scroll (pines) · hero (enjambre 3D) · lluvia ·
   laboratorio de termitas · tarjetas · formulario · cursor · arranque
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     CONFIGURACIÓN: el número de WhatsApp vive SOLO aquí.
     Formato wa.me: 52 + 10 dígitos. Si queda vacío, los botones y el envío
     de WhatsApp se ocultan con elegancia.
     --------------------------------------------------------------------- */
  const WHATSAPP_NUMBER = "529992330773";
  const WA_DEFAULT_MSG = "Hola Grupo Surs, quiero información sobre fumigación para mi hogar.";

  /* ---------- Utilidades ---------- */
  const root = document.documentElement;
  root.classList.add("js-ok");
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Un único listener de scroll (con rAF) para todas las funciones */
  const scrollFns = [];
  let scrollTicking = false;
  function onScroll(fn) { scrollFns.push(fn); }
  function runScroll() {
    scrollTicking = false;
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    for (let i = 0; i < scrollFns.length; i++) scrollFns[i](y);
  }
  window.addEventListener("scroll", () => {
    if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(runScroll); }
  }, { passive: true });

  /* ---------- WhatsApp ---------- */
  const waDigits = String(WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const hasWA = waDigits.length >= 10;
  function waLink(msg) {
    return "https://wa.me/" + waDigits + "?text=" + encodeURIComponent(msg || WA_DEFAULT_MSG);
  }
  function initWhatsApp() {
    $$("[data-wa]").forEach((a) => {
      if (!hasWA) { a.hidden = true; return; }
      a.href = waLink(a.getAttribute("data-msg"));
      a.target = "_blank";
      a.rel = "noopener";
    });
    if (!hasWA) {
      const btn = $("#formBtn"), st = $("#formStatus");
      if (btn) btn.hidden = true;
      if (st) st.textContent = "Por ahora llámanos al 999 233 0773 para cotizar.";
    }
  }

  /* ---------- Cargador ---------- */
  function initLoader() {
    const loader = $("#loader"), bar = $("#loaderBar"), pct = $("#loaderPct");
    if (!loader) { root.classList.add("is-ready"); return; }
    const MIN = reduced ? 350 : 1500;      // tiempo mínimo para ver la animación
    const CAP = reduced ? 700 : 1900;      // tope absoluto: desaparece en <= 2.4 s con el fundido
    const t0 = performance.now();
    let loaded = document.readyState === "complete";
    let finished = false;
    window.addEventListener("load", () => { loaded = true; }, { once: true });

    function finish() {
      if (finished) return;
      finished = true;
      if (pct) pct.textContent = "100";
      if (bar) bar.style.transform = "scaleX(1)";
      loader.classList.add("is-done");
      root.classList.add("is-ready");
      setTimeout(() => { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 900);
    }
    function tick(now) {
      if (finished) return;
      const t = clamp((now - t0) / MIN);
      if (pct) pct.textContent = String(Math.round(easeIO(t) * 100));
      if (t >= 1 && loaded) { finish(); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setTimeout(finish, CAP);
  }

  /* ---------- Encabezado, menú y barra de progreso ---------- */
  function initHeader() {
    const header = $("#siteHeader"), burger = $("#burger"), menu = $("#menu"), prog = $("#progress");
    if (!header) return;
    let lastY = 0;

    function setMenu(open) {
      header.classList.toggle("is-open", open);
      root.classList.toggle("menu-open", open);
      if (burger) {
        burger.setAttribute("aria-expanded", String(open));
        burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      }
    }
    if (burger) burger.addEventListener("click", () => setMenu(!header.classList.contains("is-open")));
    if (menu) menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth >= 960) setMenu(false); });

    onScroll((y) => {
      header.classList.toggle("is-solid", y > 30);
      const open = header.classList.contains("is-open");
      header.classList.toggle("is-hidden", !open && y > 520 && y > lastY + 4);
      if (y < lastY - 4 || y < 520) header.classList.remove("is-hidden");
      lastY = y;
      if (prog) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.transform = "scaleX(" + (max > 0 ? clamp(y / max) : 0).toFixed(4) + ")";
      }
    });

    /* Enlace activo según la sección visible */
    const links = $$("[data-nav]");
    if ("IntersectionObserver" in window && links.length) {
      const map = {};
      links.forEach((l) => { map[l.getAttribute("href").slice(1)] = l; });
      const io = new IntersectionObserver((ents) => {
        ents.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((l) => l.classList.remove("is-active"));
            const l = map[en.target.id];
            if (l) l.classList.add("is-active");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(map).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  /* ---------- Revelado al hacer scroll + contadores ---------- */
  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduced) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    els.forEach((e) => io.observe(e));
  }

  function initCounters() {
    const els = $$("[data-count]");
    if (!els.length || !("IntersectionObserver" in window) || reduced) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target, target = parseInt(el.getAttribute("data-count"), 10) || 0, t0 = performance.now(), dur = 1500;
        (function step(now) {
          const t = clamp((now - t0) / dur);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(step); else el.textContent = String(target);
        })(t0);
      });
    }, { threshold: 0.4 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------------------------------------------------------------------
     MOTOR DE SCROLL: secciones "ancladas" (sticky) cuyo progreso 0→1 mueve
     el contenido. El progreso se suaviza (lerp) para dar sensación de cámara
     lenta. Si no hay pin (móvil bajo, reduced motion), se muestra el estado final.
     --------------------------------------------------------------------- */
  const pinQuery = window.matchMedia("(min-height: 600px)");
  const tracks = [];
  let pinOn = false;
  let railShift = 0;
  let engineRaf = 0, engineLast = 0;

  function splitWords(el) {
    (function walk(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.nodeValue.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const s = document.createElement("span");
            s.className = "w";
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
    return $$(".w", el);
  }

  function trackProgress(el) {
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }

  function makeTracks() {
    /* 1 · Manifiesto: las palabras se encienden */
    const man = $('[data-track="manifesto"]');
    if (man) {
      const words = splitWords($("[data-words]", man));
      let shown = -1;
      tracks.push({
        el: man, k: 7,
        apply(p) {
          man.style.setProperty("--p", p.toFixed(4));
          const upto = Math.round(clamp((p - 0.06) / 0.7) * words.length);
          if (upto === shown) return;
          shown = upto;
          words.forEach((w, i) => w.classList.toggle("on", i < upto));
        },
        final() { man.style.setProperty("--p", "1"); words.forEach((w) => w.classList.add("on")); shown = -1; },
      });
    }

    /* 2 · Expedientes: scroll horizontal */
    const railTrack = $('[data-track="rail"]');
    if (railTrack) {
      const rail = $("#rail", railTrack), bar = $("#railBar"), num = $("#railNum");
      let lastNum = "";
      tracks.push({
        el: railTrack, k: 6, rail: true,
        apply(p) {
          railTrack.style.setProperty("--p", p.toFixed(4));
          rail.style.setProperty("--rx", (-p * railShift).toFixed(1) + "px");
          if (num) {
            const n = String(Math.min(5, Math.floor(p * 5.0001) + 1)).padStart(2, "0");
            if (n !== lastNum) { num.textContent = n; lastNum = n; }
          }
        },
        final() { rail.style.removeProperty("--rx"); railTrack.style.removeProperty("--p"); },
      });
    }

    /* 3 · Método de 2 fases — la gráfica se dibuja y se activan los pasos */
    const met = $('[data-track="metodo"]');
    if (met) {
      const chart = $("#chart", met), path = $(".ln-b", met), dot = $(".ch-dot", met), steps = $$(".step", met);
      let len = 0, curStep = -1;
      try { len = path.getTotalLength(); } catch (e) { len = 0; }
      const setStep = (i) => {
        if (i === curStep) return;
        curStep = i;
        steps.forEach((s, idx) => s.classList.toggle("is-on", idx === i));
      };
      tracks.push({
        el: met, k: 6,
        apply(p) {
          const dp = clamp((p - 0.05) / 0.8);
          chart.style.setProperty("--dp", dp.toFixed(4));
          if (len && dot) { const pt = path.getPointAtLength(len * dp); dot.setAttribute("cx", pt.x.toFixed(1)); dot.setAttribute("cy", pt.y.toFixed(1)); }
          setStep(dp < 0.34 ? 0 : dp < 0.7 ? 1 : 2);
        },
        final() {
          chart.style.removeProperty("--dp");
          if (len && dot) { const pt = path.getPointAtLength(len); dot.setAttribute("cx", pt.x.toFixed(1)); dot.setAttribute("cy", pt.y.toFixed(1)); }
          curStep = -1; steps.forEach((s) => s.classList.add("is-on"));
        },
      });
    }

    /* 4 · Campo: la ventana se abre */
    const exp = $('[data-track="expand"]');
    if (exp) {
      tracks.push({
        el: exp, k: 7,
        apply(p) { exp.style.setProperty("--e", easeIO(clamp((p - 0.04) / 0.6)).toFixed(4)); },
        final() { exp.style.removeProperty("--e"); },
      });
    }
  }

  function engineFrame(now) {
    const dt = Math.min(0.06, (now - engineLast) / 1000 || 0.016);
    engineLast = now;
    let moving = false;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      if (!t.active) continue;
      const target = trackProgress(t.el);
      if (t.p === undefined) t.p = target;
      const diff = target - t.p;
      if (Math.abs(diff) > 0.0005) {
        t.p += diff * (1 - Math.exp(-dt * t.k));
        moving = true;
      } else {
        t.p = target;
      }
      t.apply(t.p);
    }
    engineRaf = moving ? requestAnimationFrame(engineFrame) : 0;
  }
  function kickEngine() {
    if (!engineRaf && pinOn) { engineLast = performance.now(); engineRaf = requestAnimationFrame(engineFrame); }
  }

  function recalc() {
    const wide = window.innerWidth >= 900;
    pinOn = !reduced && pinQuery.matches;
    root.classList.toggle("pin-on", pinOn);

    tracks.forEach((t) => {
      const railWanted = t.rail ? pinOn && wide : pinOn;
      t.active = railWanted;
      if (t.rail) {
        const track = t.el, rail = $("#rail", track);
        if (railWanted) {
          railShift = Math.max(0, rail.scrollWidth - window.innerWidth);
          track.style.height = Math.round(window.innerHeight + railShift * 1.08) + "px";
        } else {
          track.style.height = "";
        }
      }
      if (!railWanted) t.final(); else t.p = undefined;
    });
    if (pinOn) { runScroll(); kickEngine(); }
  }

  function initTracks() {
    makeTracks();
    recalc();
    let rt = 0, lastW = window.innerWidth, lastH = window.innerHeight;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const w = window.innerWidth, h = window.innerHeight;
        if (w !== lastW || Math.abs(h - lastH) > 120) { lastW = w; lastH = h; recalc(); }
      }, 160);
    });
    window.addEventListener("load", recalc);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recalc).catch(() => {});
    onScroll(kickEngine);
  }

  /* ---------- Parallax suave (fotos del bloque de termitas) ---------- */
  function initParallax() {
    const els = $$("[data-parallax]");
    if (!els.length || reduced) return;
    onScroll(() => {
      const vh = window.innerHeight;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const mid = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.setProperty("--py", (clamp(mid, -1, 1) * parseFloat(el.getAttribute("data-parallax"))).toFixed(1) + "px");
      });
    });
  }

  /* ---------------------------------------------------------------------
     HERO: enjambre de plagas en canvas + escudo 3D que reacciona al puntero
     Las plagas (ámbar) avanzan hacia el escudo; al tocar el perímetro se
     neutralizan con chispas verdes. El visitante puede "fumigar" con el cursor.
     --------------------------------------------------------------------- */
  function initHero() {
    const canvas = $("#enjambre"), hero = $("#inicio"), visual = $("#heroVisual"), tilt = $("#tilt");
    const simEl = $("#simCount"), hint = $("#hudHint"), copy = $(".hero__copy");
    if (!canvas || !hero || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    if (hint) hint.textContent = finePointer ? "Mueve el cursor o haz clic para fumigar" : "Toca la pantalla para fumigar";

    /* Salida del hero al hacer scroll (parallax) */
    onScroll((y) => {
      const h = hero.offsetHeight || 1;
      if (y > h * 1.2) return;
      const hp = clamp(y / h);
      if (copy && !reduced) { copy.style.transform = "translate3d(0," + (-hp * 54).toFixed(1) + "px,0)"; copy.style.opacity = String(1 - hp * 0.9); }
      if (visual && !reduced) visual.style.transform = "translate3d(0," + (hp * 46).toFixed(1) + "px,0) scale(" + (1 + hp * 0.08).toFixed(3) + ")";
    });

    if (reduced) { const hud = $(".hud"); if (hud) hud.hidden = true; return; }

    let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 120, time = 0, last = 0, raf = 0;
    let count = 0, shown = 0, lastUi = 0, curX = 0, curY = 0;
    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, on: false, nx: 0, ny: 0 };
    const N = window.innerWidth < 700 ? 34 : 72;
    const pests = [], fx = [], waves = [], rings = [];

    function measure() {
      const r = hero.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (visual) {
        const v = visual.getBoundingClientRect();
        cx = v.left - r.left + v.width / 2;
        cy = v.top - r.top + v.height / 2;
        R = v.width * 0.25;
      } else { cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.25; }
    }

    function spawn(p, anywhere) {
      const ang = rand(0, Math.PI * 2);
      const far = Math.hypot(W, H) * 0.55;
      const dist = anywhere ? rand(R * 1.4, far) : far + rand(0, 140);
      p.x = cx + Math.cos(ang) * dist; p.y = cy + Math.sin(ang) * dist;
      p.sp = rand(40, 100); p.sz = rand(1.7, 3.2); p.ph = rand(0, 6.28); p.fr = rand(1.2, 3.2); p.a = ang + Math.PI;
      return p;
    }
    function kill(p, shield) {
      const n = shield ? 7 : 5;
      for (let i = 0; i < n && fx.length < 420; i++) {
        const a = rand(0, 6.283), s = rand(40, 160);
        fx.push({ k: Math.random() < 0.5 ? 0 : 1, x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: rand(0.35, 0.85), r: rand(1, 2.3) });
      }
      if (shield) waves.push({ a: Math.atan2(p.y - cy, p.x - cx), life: 0 });
      count++;
      spawn(p, false);
    }
    function burst() {
      for (let i = 0; i < pests.length; i++) {
        const p = pests[i];
        if (Math.hypot(p.x - pointer.x, p.y - pointer.y) < 190) kill(p, false);
      }
      for (let i = 0; i < 20 && fx.length < 420; i++) fx.push({ k: 2, x: pointer.x + rand(-10, 10), y: pointer.y + rand(-10, 10), vx: rand(-60, 60), vy: rand(-60, 60), life: 0, max: rand(0.5, 1), r: rand(9, 20) });
      rings.push({ x: pointer.x, y: pointer.y, life: 0 });
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now; time += dt;
      ctx.clearRect(0, 0, W, H);

      /* Inclinación 3D del escudo: sigue al puntero o se mece sola */
      const tx = pointer.on && finePointer ? -pointer.ny * 14 : Math.cos(time * 0.45) * 4;
      const ty = pointer.on && finePointer ? pointer.nx * 20 : Math.sin(time * 0.6) * 8;
      curX = lerp(curX, tx, 0.07); curY = lerp(curY, ty, 0.07);
      if (tilt) { tilt.style.setProperty("--rx", curX.toFixed(2) + "deg"); tilt.style.setProperty("--ry", curY.toFixed(2) + "deg"); }

      const moving = pointer.on && Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py) > 2;
      if (moving && fx.length < 420) fx.push({ k: 2, x: pointer.x + rand(-6, 6), y: pointer.y + rand(-6, 6), vx: rand(-24, 24), vy: rand(-24, 24), life: 0, max: rand(0.5, 0.9), r: rand(7, 14) });
      pointer.px = pointer.x; pointer.py = pointer.y;

      /* Anillos de rociado (clic/toque) */
      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i]; g.life += dt;
        const t = g.life / 0.6;
        if (t >= 1) { rings.splice(i, 1); continue; }
        ctx.strokeStyle = "rgba(43,239,74," + ((1 - t) * 0.8).toFixed(3) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.x, g.y, 10 + t * 190, 0, 6.283); ctx.stroke();
      }

      /* Plagas */
      ctx.lineCap = "round";
      for (let i = 0; i < pests.length; i++) {
        const p = pests[i];
        const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) || 1;
        const ang = Math.atan2(dy, dx) + Math.sin(time * p.fr + p.ph) * 0.9 * Math.min(1, d / 320);
        const sp = p.sp * (d < R * 1.8 ? 1.5 : 1);
        if (pointer.on) {
          const qx = p.x - pointer.x, qy = p.y - pointer.y, qd = Math.hypot(qx, qy) || 1;
          if (qd < 140) {
            const f = (140 - qd) / 140;
            p.x += (qx / qd) * f * 260 * dt; p.y += (qy / qd) * f * 260 * dt;
            if (moving && qd < 40) { kill(p, false); continue; }
          }
        }
        p.x += Math.cos(ang) * sp * dt; p.y += Math.sin(ang) * sp * dt; p.a = ang;
        if (d < R) { kill(p, true); continue; }

        const ca = Math.cos(ang), sa = Math.sin(ang);
        ctx.strokeStyle = "rgba(255,176,32,.22)"; ctx.lineWidth = p.sz * 1.1;
        ctx.beginPath(); ctx.moveTo(p.x - ca * 22, p.y - sa * 22); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = "rgba(255,176,32,.12)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 3.6, 0, 6.283); ctx.fill();
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
        ctx.fillStyle = "rgba(255,190,60,.96)";
        ctx.beginPath(); ctx.ellipse(0, 0, p.sz * 1.7, p.sz, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(p.sz * 1.9, 0, p.sz * 0.6, 0, 6.283); ctx.fill();
        const lg = Math.sin(time * 18 + p.ph) * p.sz * 0.6;
        ctx.strokeStyle = "rgba(255,190,60,.75)"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.sz * 0.2, -p.sz * 0.7); ctx.lineTo(-p.sz * 0.2 + lg, -p.sz * 2.2);
        ctx.moveTo(-p.sz * 0.2, p.sz * 0.7); ctx.lineTo(-p.sz * 0.2 - lg, p.sz * 2.2);
        ctx.moveTo(p.sz * 0.8, -p.sz * 0.7); ctx.lineTo(p.sz * 0.8 - lg, -p.sz * 2.2);
        ctx.moveTo(p.sz * 0.8, p.sz * 0.7); ctx.lineTo(p.sz * 0.8 + lg, p.sz * 2.2);
        ctx.stroke();
        ctx.restore();
      }

      /* Ondas de impacto sobre el perímetro del escudo */
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]; w.life += dt;
        const t = w.life / 0.7;
        if (t >= 1) { waves.splice(i, 1); continue; }
        ctx.strokeStyle = "rgba(230,255,26," + ((1 - t) * 0.9).toFixed(3) + ")";
        ctx.lineWidth = 1 + 4 * (1 - t);
        ctx.beginPath(); ctx.arc(cx, cy, R + t * 12, w.a - 0.3 - t * 0.45, w.a + 0.3 + t * 0.45); ctx.stroke();
      }

      /* Chispas y neblina de fumigación */
      ctx.globalCompositeOperation = "lighter";
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i]; f.life += dt;
        const t = f.life / f.max;
        if (t >= 1) { fx.splice(i, 1); continue; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.96; f.vy *= 0.96;
        if (f.k === 2) {
          ctx.fillStyle = "rgba(43,239,74," + ((1 - t) * 0.16).toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 + t * 1.6), 0, 6.283); ctx.fill();
        } else {
          ctx.fillStyle = (f.k ? "rgba(43,239,74," : "rgba(230,255,26,") + (1 - t).toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - t * 0.5), 0, 6.283); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      if (simEl && count !== shown && now - lastUi > 140) { simEl.textContent = String(count); shown = count; lastUi = now; }
    }

    function setPointer(e) {
      const r = hero.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true;
      pointer.nx = clamp(pointer.x / r.width - 0.5, -0.5, 0.5);
      pointer.ny = clamp(pointer.y / r.height - 0.5, -0.5, 0.5);
    }
    hero.addEventListener("pointermove", setPointer, { passive: true });
    hero.addEventListener("pointerdown", (e) => { setPointer(e); burst(); }, { passive: true });
    hero.addEventListener("pointerleave", () => { pointer.on = false; }, { passive: true });
    hero.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") pointer.on = false; }, { passive: true });
    hero.addEventListener("pointercancel", () => { pointer.on = false; }, { passive: true });

    measure();
    for (let i = 0; i < N; i++) pests.push(spawn({}, true));
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(hero); else window.addEventListener("resize", measure);
    window.addEventListener("load", measure);

    function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => { if (ents[0].isIntersecting) start(); else stop(); }).observe(hero);
    } else { start(); }
  }

  /* ---------- Lluvia (sección de mosquitos) ---------- */
  function initRain() {
    const canvas = $("#lluvia");
    if (!canvas || !canvas.getContext || reduced) return;
    const ctx = canvas.getContext("2d");
    const sec = canvas.parentElement;
    let W = 0, H = 0, raf = 0, last = 0;
    const drops = [];
    const N = window.innerWidth < 700 ? 40 : 90;

    function size() {
      const r = sec.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function reset(d, anywhere) {
      d.x = rand(-40, W + 40); d.y = anywhere ? rand(0, H) : rand(-120, -10);
      d.len = rand(14, 38); d.sp = rand(420, 760); d.a = rand(0.12, 0.38);
      return d;
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.2; ctx.lineCap = "round";
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.sp * dt; d.x -= d.sp * 0.16 * dt;
        if (d.y > H + 20) reset(d, false);
        ctx.strokeStyle = "rgba(150,255,175," + d.a.toFixed(2) + ")";
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.len * 0.16, d.y - d.len); ctx.stroke();
      }
    }
    size();
    for (let i = 0; i < N; i++) drops.push(reset({}, true));
    window.addEventListener("resize", size);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => {
        if (ents[0].isIntersecting) { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }).observe(sec);
    }
  }

  /* ---------- Laboratorio de termitas (preventivo / correctivo) ---------- */
  function initLab() {
    const lab = $("#lab");
    if (!lab) return;
    const tabs = $$(".lab__tab", lab), screen = $("#lab-screen"), note = $("#labNote"), label = $("#labLabel");
    const text = {
      prev: { label: "Barrera preventiva activa", note: "Se aplica antes de construir (pre construcción): una barrera protege los cimientos y la estructura desde el primer día." },
      corr: { label: "Tratamiento integral y focalizado", note: "Se aplica con la obra terminada (post construcción): ubicamos los puntos con actividad y los tratamos de forma focalizada." },
    };
    let auto = null, visible = false;

    function setMode(mode) {
      lab.setAttribute("data-mode", mode);
      tabs.forEach((t) => {
        const on = t.getAttribute("data-mode") === mode;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      if (screen) screen.setAttribute("aria-labelledby", "tab-" + mode);
      if (label && label.lastChild) label.lastChild.nodeValue = text[mode].label;
      if (note) note.textContent = text[mode].note;
    }
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
    function startAuto() {
      if (reduced || auto || !visible) return;
      auto = setInterval(() => setMode(lab.getAttribute("data-mode") === "prev" ? "corr" : "prev"), 7000);
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => { stopAuto(); setMode(t.getAttribute("data-mode")); userTouched = true; });
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); n.click();
      });
    });
    let userTouched = false;
    setMode("prev");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => {
        visible = ents[0].isIntersecting;
        if (visible && !userTouched) startAuto(); else stopAuto();
      }, { threshold: 0.35 }).observe(lab);
    }
  }

  /* ---------- Tarjetas: inclinación 3D, luz que sigue al puntero y botones magnéticos ---------- */
  function initCards() {
    $$("[data-spot], [data-tilt]").forEach((el) => {
      const tiltable = el.hasAttribute("data-tilt");
      el.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty("--mx", x.toFixed(0) + "px");
        el.style.setProperty("--my", y.toFixed(0) + "px");
        if (tiltable && finePointer && !reduced) {
          el.style.setProperty("--ty", ((x / r.width - 0.5) * 10).toFixed(2) + "deg");
          el.style.setProperty("--tx", ((0.5 - y / r.height) * 8).toFixed(2) + "deg");
        }
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--tx", "0deg"); el.style.setProperty("--ty", "0deg"); });
    });

    if (finePointer && !reduced) {
      $$(".btn--magnet").forEach((b) => {
        b.addEventListener("pointermove", (e) => {
          const r = b.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) * 0.22, dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
          b.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
        });
        b.addEventListener("pointerleave", () => { b.style.transform = ""; });
      });
    }
  }

  /* ---------- Formulario → WhatsApp ---------- */
  function initForm() {
    const form = $("#formulario");
    if (!form) return;
    const status = $("#formStatus"), nameInput = $("#f-nombre");
    function say(msg, bad) {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle("is-bad", !!bad);
    }
    if (nameInput) nameInput.addEventListener("input", () => nameInput.classList.remove("is-bad"));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!hasWA) { say("Por ahora llámanos al 999 233 0773 para cotizar.", true); return; }
      const nombre = (nameInput.value || "").trim();
      if (!nombre) {
        nameInput.classList.add("is-bad");
        say("Cuéntanos tu nombre para poder atenderte.", true);
        nameInput.focus();
        return;
      }
      const plagas = $$('input[name="plaga"]:checked', form).map((i) => i.value);
      const espacioEl = $('input[name="espacio"]:checked', form);
      const espacio = espacioEl ? espacioEl.value : "casa";
      const zona = ($("#f-zona").value || "").trim();
      const extra = ($("#f-mensaje").value || "").trim();

      let msg = "Hola Grupo Surs, soy " + nombre + ". Quiero cotizar una fumigación para mi " + espacio + (zona ? " en " + zona : "") + ".";
      if (plagas.length) msg += " Plagas que me preocupan: " + plagas.join(", ") + ".";
      if (extra) msg += " Detalles: " + extra;
      msg += " ¿Me pueden ayudar?";

      say("Abriendo WhatsApp con tu mensaje…", false);
      const win = window.open(waLink(msg), "_blank", "noopener");
      if (!win) window.location.href = waLink(msg);
    });
  }

  /* ---------- Cursor aspersor (solo con mouse) ---------- */
  function initCursor() {
    const cur = $("#cursor");
    if (!cur || !finePointer || reduced) return;
    root.classList.add("has-cursor");
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    function loop() {
      cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22);
      cur.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf = (Math.abs(cx - x) > 0.1 || Math.abs(cy - y) > 0.1) ? requestAnimationFrame(loop) : 0;
    }
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      cur.classList.toggle("is-link", !!(e.target.closest && e.target.closest("a, button, summary, label, input, textarea")));
    });
    document.documentElement.addEventListener("mouseleave", () => { cur.style.opacity = "0"; });
    document.documentElement.addEventListener("mouseenter", () => { cur.style.opacity = ""; });
  }

  /* ---------- Botón flotante de WhatsApp ---------- */
  function initFab() {
    const fab = $("#fab");
    if (!fab) return;
    if (!hasWA) { fab.hidden = true; return; }
    setTimeout(() => {
      fab.classList.add("show-tip");
      setTimeout(() => fab.classList.remove("show-tip"), 5200);
    }, 7000);
  }

  /* ---------- Arranque ---------- */
  function boot() {
    initWhatsApp();
    initLoader();
    initHeader();
    initReveal();
    initCounters();
    initTracks();
    initParallax();
    initHero();
    initRain();
    initLab();
    initCards();
    initForm();
    initCursor();
    initFab();
    runScroll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
