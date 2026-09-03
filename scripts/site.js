/* =============================================================================
   Thema Green — site behaviour.
   No frameworks, no jQuery. ES modules, progressive enhancement, a11y-first.
   ========================================================================== */
import { PROFILE, EXPERIENCE, EDUCATION, PROJECTS, SKILLS, VALUES, TESTIMONIALS, TESTIMONIAL_FORM } from "./data.js";
import { ICONS, paintIcons } from "./icons.js";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Theme ------------------------------------------------------- */
function initTheme() {
  const btn = $("#themeToggle");
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const set = (mode) => {
    document.documentElement.dataset.theme = mode;
    if (btn) {
      btn.innerHTML = ICONS[mode === "dark" ? "sun" : "moon"];
      btn.setAttribute("aria-label", mode === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = mode === "dark" ? "#0a0d0b" : "#f6f2e9";
  };
  set(stored || (prefersDark ? "dark" : "light"));
  btn?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    set(next);
  });
  return { set };
}

/* ---------- Scroll progress + header state + back-to-top ---------------- */
function initScrollChrome() {
  const bar = $("#progressBar");
  const header = $(".site-header");
  const top = $("#toTop");
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    header?.classList.toggle("is-stuck", y > 12);
    top?.classList.toggle("is-visible", y > 700);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
  top?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: REDUCED.matches ? "auto" : "smooth" }));
}

/* ---------- Reveal on scroll -------------------------------------------- */
function initReveal(root = document) {
  const items = $$("[data-reveal]", root).filter((el) => !el.classList.contains("is-in"));
  if (REDUCED.matches) { items.forEach((el) => el.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  items.forEach((el, i) => {
    if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", `${(i % 6) * 70}ms`);
    io.observe(el);
  });
}

/* ---------- Kinetic headline -------------------------------------------- */
function initKineticHeadline() {
  const h1 = $("[data-kinetic]");
  if (!h1) return;
  const html = h1.innerHTML;
  // Split on spaces but preserve inline markup wrappers by working per text node.
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((chunk) => {
          if (!chunk.trim()) { frag.appendChild(document.createTextNode(chunk)); return; }
          const span = document.createElement("span");
          span.className = "word";
          span.textContent = chunk;
          frag.appendChild(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) {
        walk(child);
      }
    });
  };
  try { walk(h1); } catch { h1.innerHTML = html; }
  $$(".word", h1).forEach((w, i) => w.style.setProperty("--i", i));
  requestAnimationFrame(() => h1.classList.add("is-in"));
}

/* ---------- Count-up stats ---------------------------------------------- */
function initCounters() {
  const nodes = $$("[data-count]");
  if (!nodes.length) return;
  const run = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (REDUCED.matches) { el.textContent = target + suffix; return; }
    const dur = 1200, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  nodes.forEach((n) => io.observe(n));
}

/* ---------- Rotating role words ----------------------------------------- */
function initRotator() {
  const el = $("#rotatorWord");
  if (!el) return;
  const words = PROFILE.rotatingWords;
  if (REDUCED.matches) { el.textContent = words[0]; return; }
  let i = 0, txt = "", deleting = false;
  const tick = () => {
    const word = words[i % words.length];
    txt = deleting ? word.slice(0, txt.length - 1) : word.slice(0, txt.length + 1);
    el.textContent = txt;
    let delay = deleting ? 45 : 85;
    if (!deleting && txt === word) { delay = 2100; deleting = true; }
    else if (deleting && txt === "") { deleting = false; i++; delay = 320; }
    setTimeout(tick, delay);
  };
  tick();
}

/* ---------- Hero constellation canvas ----------------------------------- */
function initField() {
  const canvas = $("#field");
  if (!canvas || REDUCED.matches || window.matchMedia("(prefers-reduced-data: reduce)").matches) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 0, h = 0, dots = [], raf = null, running = false;
  const pointer = { x: -9999, y: -9999 };
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  const colors = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    return { dot: dark ? "138,214,175" : "26,101,70", link: dark ? "227,196,99" : "212,175,55" };
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr(); canvas.height = h * dpr();
    ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
    const count = Math.min(Math.round((w * h) / 15000), 90);
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.7 + 0.7,
    }));
  };

  const draw = () => {
    const c = colors();
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;
      const dx = d.x - pointer.x, dy = d.y - pointer.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 14400) {          // gentle repulsion within 120px
        const f = (14400 - dist2) / 14400 * 0.035;
        d.x += dx * f; d.y += dy * f;
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.dot},.55)`;
      ctx.fill();
    }
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 16900) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(${c.link},${(1 - d2 / 16900) * 0.32})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(draw);
  };

  const start = () => { if (!running) { running = true; draw(); } };
  const stop  = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = null; };

  resize();
  window.addEventListener("resize", () => { resize(); }, { passive: true });
  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
  }, { passive: true });
  window.addEventListener("pointerleave", () => { pointer.x = pointer.y = -9999; });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
  new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop(), { threshold: 0 })
    .observe(canvas);
}

/* ---------- Nav: pill indicator, scrollspy, mobile ---------------------- */
function initNav() {
  const nav = $("#primaryNav");
  const toggle = $("#navToggle");
  const links = $$("#primaryNav a[href^='#']");
  const pill = $("#navPill");

  const movePill = (a) => {
    if (!pill || !a || window.innerWidth <= 900) return;
    pill.style.width = `${a.offsetWidth}px`;
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
    pill.style.opacity = "1";
  };
  const current = () => links.find((a) => a.getAttribute("aria-current") === "true");

  links.forEach((a) => {
    a.addEventListener("mouseenter", () => movePill(a));
    a.addEventListener("focus", () => movePill(a));
  });
  nav?.addEventListener("mouseleave", () => movePill(current()));

  // Scrollspy
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const a = links.find((l) => l.getAttribute("href") === `#${e.target.id}`);
      if (!a) return;
      links.forEach((l) => l.removeAttribute("aria-current"));
      a.setAttribute("aria-current", "true");
      movePill(a);
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  // Mobile drawer
  const setOpen = (open) => {
    nav?.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    if (toggle) toggle.innerHTML = ICONS[open ? "close" : "menu"];
  };
  toggle?.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  links.forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 900) setOpen(false); movePill(current()); });
}

/* ---------- Card spotlight ---------------------------------------------- */
function initSpotlight(root = document) {
  $$("[data-spotlight]", root).forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- Toast -------------------------------------------------------- */
let toastTimer;
function toast(message, icon = "check") {
  const el = $("#toast");
  if (!el) return;
  el.innerHTML = `${ICONS[icon] || ""}<span>${esc(message)}</span>`;
  el.classList.add("is-open");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-open"), 3400);
}

/* ---------- Projects: render, filter, search ---------------------------- */
const CATEGORIES = [
  { id: "all",      label: "All work" },
  { id: "research", label: "Research & AI" },
  { id: "product",  label: "Product" },
  { id: "academic", label: "Academic & applied" },
  { id: "concept",  label: "Concepts" },
];

function projectCard(p, i) {
  const media = p.image
    ? `<img src="${esc(encodeURI(p.image))}" alt="" loading="lazy" decoding="async">`
    : `<span class="work__glyph">${ICONS[p.glyph] || ICONS.sparkle}</span>`;
  return `
    <article class="work${i < 2 ? " work--wide" : ""}" data-spotlight
             data-id="${esc(p.id)}" data-category="${esc(p.category)}" data-reveal style="--d:${(i % 6) * 60}ms">
      <div class="work__media">
        ${p.badge ? `<span class="work__badge">${esc(p.badge)}</span>` : ""}
        ${media}
      </div>
      <div class="work__body">
        <p class="work__kicker">${esc(p.kicker)} · ${esc(p.year)}</p>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        ${p.outcome ? `<p class="work__outcome">${ICONS.bolt}<span>${esc(p.outcome)}</span></p>` : ""}
        <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <button class="work__more" type="button" data-open="${esc(p.id)}">
          Read the case study ${ICONS.arrowRight}
          <span class="visually-hidden">for ${esc(p.title)}</span>
        </button>
      </div>
    </article>`;
}

function initProjects() {
  const grid = $("#workGrid");
  const filterBar = $("#workFilters");
  const input = $("#workSearch");
  const status = $("#workStatus");
  if (!grid) return;

  grid.innerHTML = PROJECTS.map(projectCard).join("") +
    `<p class="empty-state" id="workEmpty" hidden>${ICONS.search}
       <strong>No projects match that search.</strong><br>
       Try a role like “UX researcher”, “ML engineer”, or “human factors”.</p>`;

  // Assets can go missing when the site moves repos; degrade to the brand plate.
  $$(".work__media img", grid).forEach((img) => {
    const reveal = () => img.classList.add("is-loaded");
    img.complete && img.naturalWidth ? reveal() : img.addEventListener("load", reveal, { once: true });
    img.addEventListener("error", () => {
      const media = img.closest(".work__media");
      const id = media.closest(".work")?.dataset.id;
      const glyph = PROJECTS.find((x) => x.id === id)?.glyph;
      img.remove();
      const span = document.createElement("span");
      span.className = "work__glyph";
      span.innerHTML = ICONS[glyph] || ICONS.sparkle;
      media.appendChild(span);
    }, { once: true });
  });

  const counts = (id) => id === "all" ? PROJECTS.length : PROJECTS.filter((p) => p.category === id).length;
  filterBar.innerHTML = CATEGORIES.map((c, i) =>
    `<button class="filter" data-filter="${c.id}" aria-pressed="${i === 0}">
       ${esc(c.label)}<span class="filter__n">${counts(c.id)}</span>
     </button>`).join("");

  let activeCat = "all";
  let query = "";

  const score = (p, q) => {
    const terms = q.toLowerCase().split(/[^a-z0-9+#.]+/).filter((t) => t.length > 1);
    if (!terms.length) return 0;
    const hay = {
      title: p.title.toLowerCase(),
      kw: p.keywords.join(" "),
      tags: p.tags.join(" ").toLowerCase(),
      body: (p.summary + " " + p.outcome + " " + p.org).toLowerCase(),
    };
    let s = 0;
    for (const t of terms) {
      if (hay.title.includes(t)) s += 10;
      if (hay.kw.includes(t))    s += 6;
      if (hay.tags.includes(t))  s += 4;
      if (hay.body.includes(t))  s += 2;
    }
    return s;
  };

  const apply = () => {
    const cards = $$(".work", grid);
    let shown = 0;
    let ranked = [];
    if (query.trim()) {
      ranked = PROJECTS.map((p) => ({ id: p.id, s: score(p, query) }))
        .filter((r) => r.s > 0).sort((a, b) => b.s - a.s);
    }
    const rankOf = new Map(ranked.map((r, i) => [r.id, i]));

    cards.forEach((card) => {
      const id = card.dataset.id;
      const catOk = activeCat === "all" || card.dataset.category === activeCat;
      const qOk = !query.trim() || rankOf.has(id);
      const show = catOk && qOk;
      card.classList.toggle("is-hidden", !show);
      card.querySelector(".work__rank")?.remove();
      if (show) shown++;
      const r = rankOf.get(id);
      if (show && query.trim() && r !== undefined && r < 3) {
        const b = document.createElement("span");
        b.className = "work__rank";
        b.textContent = `#${r + 1}`;
        b.title = "Top match for your search";
        card.querySelector(".work__media").appendChild(b);
      }
    });

    $("#workEmpty").hidden = shown > 0;
    if (status) {
      status.textContent = query.trim()
        ? `${shown} project${shown === 1 ? "" : "s"} match “${query.trim()}”.`
        : `Showing ${shown} project${shown === 1 ? "" : "s"}.`;
    }
  };

  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    activeCat = btn.dataset.filter;
    $$(".filter", filterBar).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    apply();
  });

  const wrap = input?.closest(".search-inline");
  input?.addEventListener("input", () => {
    query = input.value;
    wrap?.classList.toggle("has-value", !!query);
    apply();
  });
  $("#workSearchClear")?.addEventListener("click", () => {
    input.value = ""; query = ""; wrap?.classList.remove("has-value"); apply(); input.focus();
  });

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".work");
    if (card) openCase(card.dataset.id, e.target.closest("[data-open]") || card);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const btn = e.target.closest("[data-open]");
    if (btn) { e.preventDefault(); openCase(btn.dataset.open, btn); }
  });

  apply();
  return { setQuery: (q) => { input.value = q; query = q; wrap?.classList.add("has-value"); apply(); } };
}

/* ---------- Case-study drawer ------------------------------------------- */
let lastFocus = null;
function openCase(id, trigger) {
  const p = PROJECTS.find((x) => x.id === id);
  const drawer = $("#drawer"), scrim = $("#drawerScrim"), body = $("#drawerBody");
  if (!p || !drawer) return;
  lastFocus = trigger || document.activeElement;

  body.innerHTML = `
    ${p.image ? `<figure class="drawer__hero"><img src="${esc(encodeURI(p.image))}" alt="${esc(p.title)}"></figure>` : ""}
    <p class="mono muted">${esc(p.kicker)} · ${esc(p.year)}</p>
    <h3 id="drawerTitle">${esc(p.title)}</h3>
    <p class="muted" style="margin-top:.4rem">${esc(p.org)}</p>
    <div class="drawer__meta">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
    ${p.metrics?.length ? `<div class="metric-row">${p.metrics.map((m) =>
      `<div class="metric"><div class="metric__n">${m.n}</div><div class="metric__l">${m.l}</div></div>`).join("")}</div>` : ""}
    <h4>The problem</h4><p>${esc(p.problem)}</p>
    <h4>What I did</h4><ul class="bullets">${p.process.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <h4>Outcome</h4><ul class="bullets">${p.outcomes.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    ${p.links?.length ? `<div class="drawer__links">${p.links.map((l) =>
      `<a class="btn btn--ghost btn--sm" href="${esc(l.href)}"${/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : ""}>
         ${ICONS.external}${esc(l.label)}</a>`).join("")}</div>` : ""}
    <div class="drawer__links">
      <a class="btn btn--primary btn--sm" href="#contact" data-close-drawer>${ICONS.send}Talk to me about this</a>
    </div>`;

  const hero = $(".drawer__hero img", body);
  if (hero) {
    const reveal = () => hero.classList.add("is-loaded");
    hero.complete && hero.naturalWidth ? reveal() : hero.addEventListener("load", reveal, { once: true });
    hero.addEventListener("error", () => hero.closest(".drawer__hero").remove(), { once: true });
  }

  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  scrim.classList.add("is-open");
  document.body.style.overflow = "hidden";
  $("#drawerClose")?.focus();
  history.replaceState(null, "", `#case-${p.id}`);
}

function closeCase() {
  const drawer = $("#drawer"), scrim = $("#drawerScrim");
  if (!drawer?.classList.contains("is-open")) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  scrim.classList.remove("is-open");
  document.body.style.overflow = "";
  if (location.hash.startsWith("#case-")) history.replaceState(null, "", location.pathname + location.search);
  lastFocus?.focus?.();
}

function initDrawer() {
  $("#drawerClose")?.addEventListener("click", closeCase);
  $("#drawerScrim")?.addEventListener("click", closeCase);
  $("#drawerBody")?.addEventListener("click", (e) => { if (e.target.closest("[data-close-drawer]")) closeCase(); });
  document.addEventListener("keydown", (e) => {
    const drawer = $("#drawer");
    if (!drawer?.classList.contains("is-open")) return;
    if (e.key === "Escape") { closeCase(); return; }
    if (e.key !== "Tab") return;
    const f = $$('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])', drawer)
      .filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

/* ---------- Experience + Education timelines ---------------------------- */
function timelineItem(item, i, kind) {
  const isExp = kind === "exp";
  const head = isExp ? item.role : item.school;
  const sub  = isExp ? item.org : item.credential;
  const date = isExp ? `${item.start} — ${item.end}` : item.date;
  const chip = isExp
    ? (item.current ? `<span class="pill">Current</span>` : "")
    : `<span class="pill">${esc(item.badge)}</span>`;

  const detail = isExp
    ? `${item.funding ? `<p class="note" style="margin-bottom:1rem">${ICONS.info}<span>${esc(item.funding)}</span></p>` : ""}
       ${item.bullets.length ? `<ul class="bullets">${item.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
       ${item.stack?.length ? `<h4 style="margin-top:1.5rem">Stack</h4><div class="pill-row">${item.stack.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>` : ""}
       ${item.skills?.length ? `<h4 style="margin-top:1.5rem">Skills</h4><div class="pill-row">${item.skills.map((s) => `<span class="pill">${esc(s)}</span>`).join("")}</div>` : ""}`
    : `${(item.sections || []).map((sec) => `
         <h4>${esc(sec.title)}</h4>
         <div class="course-grid">${sec.courses.map((c) =>
           `<div class="course"><span>${esc(c)}</span><span class="grade">A</span></div>`).join("")}</div>`).join("")}
       ${item.transfer?.length ? `<h4>What it transfers to</h4><div class="pill-row">${item.transfer.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>` : ""}`;

  const hasDetail = isExp ? (item.bullets.length || item.stack?.length) : (item.sections?.length || item.transfer?.length);

  return `
    <div class="tl" aria-expanded="false" data-reveal style="--d:${i * 70}ms">
      <div class="tl__card">
        <p class="tl__date">${esc(date)}</p>
        <h3>${esc(head)} ${chip}</h3>
        <p class="tl__sub">${esc(sub)}</p>
        ${item.type ? `<p class="mono muted" style="margin-top:.2rem">${esc(item.type)}</p>` : ""}
        <p class="tl__blurb">${esc(item.blurb)}</p>
        ${hasDetail ? `
          <button class="tl__toggle" type="button" aria-controls="tl-${kind}-${i}">
            <span>Details</span>${ICONS.chevronDown}
          </button>
          <div class="tl__panel" id="tl-${kind}-${i}"><div><div class="inner">${detail}</div></div></div>` : ""}
      </div>
    </div>`;
}

function initTimelines() {
  const exp = $("#experienceTimeline");
  const edu = $("#educationTimeline");
  if (exp) exp.innerHTML = EXPERIENCE.map((e, i) => timelineItem(e, i, "exp")).join("");
  if (edu) edu.innerHTML = EDUCATION.map((e, i) => timelineItem(e, i, "edu")).join("");

  $$(".tl__toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tl = btn.closest(".tl");
      const open = tl.getAttribute("aria-expanded") === "true";
      tl.setAttribute("aria-expanded", String(!open));
      btn.setAttribute("aria-expanded", String(!open));
      btn.querySelector("span").textContent = open ? "Details" : "Hide details";
    });
  });
}

/* ---------- Skills ------------------------------------------------------- */
function initSkills() {
  const grid = $("#skillGrid");
  if (!grid) return;
  grid.innerHTML = SKILLS.map((s, i) => `
    <article class="skill" data-reveal style="--d:${(i % 3) * 80}ms">
      <div class="skill__icon">${ICONS[s.icon] || ICONS.sparkle}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.blurb)}</p>
      <div class="meters">
        ${s.meters.map((m) => `
          <div class="meter">
            <div class="meter__top"><span>${esc(m.l)}</span><span>${m.v}%</span></div>
            <div class="meter__track"><div class="meter__fill" data-fill="${m.v}"></div></div>
          </div>`).join("")}
      </div>
    </article>`).join("");

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $$(".meter__fill", e.target).forEach((f, i) =>
        setTimeout(() => { f.style.width = f.dataset.fill + "%"; }, REDUCED.matches ? 0 : i * 110));
      io.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  $$(".skill", grid).forEach((c) => io.observe(c));
}

/* ---------- Values + marquee + testimonials ----------------------------- */
function initStatic() {
  const values = $("#valueList");
  if (values) values.innerHTML = VALUES.map((v, i) => `
    <article class="value" data-reveal style="--d:${i * 70}ms">
      <span class="value__n">${v.n}</span>
      <div><h3>${esc(v.title)}</h3><p>${esc(v.body)}</p></div>
    </article>`).join("");

  const marquee = $("#marqueeTrack");
  if (marquee) {
    const list = `<ul>${PROFILE.capabilities.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`;
    marquee.innerHTML = list + list; // duplicated for a seamless -50% loop
  }

  const stats = $("#heroStats");
  if (stats) stats.innerHTML = PROFILE.stats.map((s) => `
    <div class="proof">
      <span class="proof__n" data-count="${s.n}" data-suffix="${s.suffix}">0</span>
      <span class="proof__l">${s.label}</span>
    </div>`).join("");

  const rail = $("#quoteRail");
  if (rail) {
    const card = (t) => `
      <figure class="quote">
        <div class="quote__stars" aria-label="Five out of five">${ICONS.star.repeat(5)}</div>
        <blockquote>&ldquo;${esc(t.quote)}&rdquo;</blockquote>
        <figcaption>
          <span class="avatar" aria-hidden="true">${esc(t.name.split(" ").map((n) => n[0]).join("").slice(0, 2))}</span>
          <span class="quote__who"><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></span>
          ${t.href ? `<a href="${esc(t.href)}" target="_blank" rel="noopener" class="icon-btn" style="width:34px;height:34px"
                        aria-label="${esc(t.name)} on LinkedIn">${ICONS.linkedin}</a>` : ""}
        </figcaption>
      </figure>`;

    // A marquee of one repeated quote reads as padding. Below three, show them
    // statically and let the invitation do the work instead.
    if (TESTIMONIALS.length < 3) {
      rail.parentElement.classList.remove("rail");
      rail.className = "quote-set";
      rail.innerHTML = TESTIMONIALS.map(card).join("");
    } else {
      const block = TESTIMONIALS.map(card).join("");
      rail.innerHTML = block + block;   // duplicated for the seamless -50% loop
    }
  }
}

/* ---------- Modal (testimonial form) ------------------------------------ */
function initModal() {
  const modal = $("#formModal");
  if (!modal) return;
  const frame = $("#formFrame");
  const open = () => {
    if (frame && !frame.src) frame.src = TESTIMONIAL_FORM;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#modalClose")?.focus();
  };
  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  $$("[data-open-form]").forEach((b) => b.addEventListener("click", open));
  $("#modalClose")?.addEventListener("click", close);
  $("#modalScrim")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
}

/* ---------- Contact form ------------------------------------------------- */
function initContactForm() {
  const form = $("#contactForm");
  if (!form) return;
  const fields = $$(".field", form);
  const validate = (field) => {
    const input = $(".input", field);
    if (!input || !input.required) return true;
    const ok = input.checkValidity() && input.value.trim() !== "";
    field.dataset.invalid = String(!ok);
    const err = $(".field__error", field);
    if (err) err.textContent = ok ? "" : (input.type === "email" ? "Enter a valid email address." : "This field is required.");
    return ok;
  };
  fields.forEach((f) => {
    const i = $(".input", f);
    i?.addEventListener("blur", () => validate(f));
    i?.addEventListener("input", () => { if (f.dataset.invalid === "true") validate(f); });
  });
  form.addEventListener("submit", (e) => {
    const allOk = fields.map(validate).every(Boolean);
    if (!allOk) {
      e.preventDefault();
      toast("Please fix the highlighted fields.", "info");
      $('.field[data-invalid="true"] .input', form)?.focus();
      return;
    }
    toast("Sending your message…", "send");
  });
}

/* ---------- Command palette ---------------------------------------------- */
function initPalette(projectsApi, theme) {
  const cmdk = $("#cmdk");
  if (!cmdk) return;
  const input = $("#cmdkInput");
  const list  = $("#cmdkList");
  let items = [], idx = 0, restoreFocus = null;

  const actions = [
    { group: "Actions", label: "Toggle dark mode", icon: "moon", run: () => $("#themeToggle").click() },
    { group: "Actions", label: "Copy email address", icon: "mail", run: async () => {
        try { await navigator.clipboard.writeText(PROFILE.email); toast("Email copied to clipboard."); }
        catch { toast("Copy failed — " + PROFILE.email, "info"); } } },
    { group: "Actions", label: "Open Job Match Explorer", icon: "bolt", href: "job-match.html" },
    { group: "Actions", label: "Open LinkedIn profile", icon: "linkedin", href: PROFILE.linkedin, ext: true },
    { group: "Actions", label: "Open GitHub profile", icon: "github", href: PROFILE.github, ext: true },
    { group: "Actions", label: "Print / save this page as PDF", icon: "book", run: () => window.print() },
  ];
  const jumps = [
    ["Home", "#home"], ["Work", "#work"], ["Experience", "#experience"],
    ["Education", "#education"], ["Skills", "#skills"], ["About", "#about"],
    ["Testimonials", "#testimonials"], ["Contact", "#contact"],
  ].map(([label, href]) => ({ group: "Jump to", label, icon: "arrowRight", href }));

  const projectEntries = PROJECTS.map((p) => ({
    group: "Case studies", label: p.title, sub: `${p.kicker} · ${p.org}`,
    icon: p.glyph, keywords: p.keywords.join(" ") + " " + p.tags.join(" ").toLowerCase(),
    run: () => openCase(p.id),
  }));

  const all = [...actions, ...jumps, ...projectEntries];

  const render = (q = "") => {
    const t = q.trim().toLowerCase();
    items = t
      ? all.filter((i) => (i.label + " " + (i.sub || "") + " " + (i.keywords || "")).toLowerCase().includes(t))
      : all;
    idx = 0;
    if (!items.length) { list.innerHTML = `<p class="cmdk__empty">Nothing matches “${esc(q)}”.</p>`; return; }
    let html = "", group = null;
    items.forEach((it, i) => {
      if (it.group !== group) { group = it.group; html += `<p class="cmdk__group">${esc(group)}</p>`; }
      const tag = it.href ? "a" : "button";
      const attrs = it.href ? `href="${esc(it.href)}"${it.ext ? ' target="_blank" rel="noopener"' : ""}` : 'type="button"';
      html += `<${tag} class="cmdk__item" role="option" ${attrs} data-i="${i}" aria-selected="${i === 0}">
                 ${ICONS[it.icon] || ICONS.arrowRight}
                 <span><strong>${esc(it.label)}</strong>${it.sub ? `<small>${esc(it.sub)}</small>` : ""}</span>
               </${tag}>`;
    });
    list.innerHTML = html;
  };

  const select = (n) => {
    const nodes = $$(".cmdk__item", list);
    if (!nodes.length) return;
    idx = (n + nodes.length) % nodes.length;
    nodes.forEach((el, i) => el.setAttribute("aria-selected", String(i === idx)));
    nodes[idx].scrollIntoView({ block: "nearest" });
  };

  const open = () => {
    restoreFocus = document.activeElement;
    cmdk.classList.add("is-open");
    cmdk.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    input.value = ""; render(); input.focus();
  };
  const close = () => {
    cmdk.classList.remove("is-open");
    cmdk.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    restoreFocus?.focus?.();
  };

  const activate = (i) => {
    const it = items[i];
    if (!it) return;
    if (it.run) { close(); it.run(); }
    else if (it.href && !it.ext) { close(); }
  };

  $$("[data-open-cmdk]").forEach((b) => b.addEventListener("click", open));
  $("#cmdkScrim")?.addEventListener("click", close);
  input.addEventListener("input", () => render(input.value));
  list.addEventListener("click", (e) => {
    const el = e.target.closest(".cmdk__item");
    if (el) activate(Number(el.dataset.i));
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); cmdk.classList.contains("is-open") ? close() : open(); return; }
    if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { e.preventDefault(); open(); return; }
    if (!cmdk.classList.contains("is-open")) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); select(idx + 1); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); select(idx - 1); }
    else if (e.key === "Enter") {
      const node = $$(".cmdk__item", list)[idx];
      if (node?.tagName === "A") { close(); return; }
      e.preventDefault(); activate(idx);
    }
  });
}

/* ---------- Deep link to a case study ------------------------------------ */
function initDeepLink() {
  const m = location.hash.match(/^#case-(.+)$/);
  if (m && PROJECTS.some((p) => p.id === m[1])) setTimeout(() => openCase(m[1]), 300);
}

/* ---------- Boot ---------------------------------------------------------- */
function boot() {
  paintIcons();
  const theme = initTheme();
  initScrollChrome();
  initNav();
  initKineticHeadline();
  initRotator();
  initStatic();
  const projectsApi = initProjects();
  initDrawer();
  initTimelines();
  initSkills();
  initModal();
  initContactForm();
  initPalette(projectsApi, theme);
  initField();
  initCounters();
  initSpotlight();
  initReveal();
  initDeepLink();
  $("#year") && ($("#year").textContent = new Date().getFullYear());
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", boot)
  : boot();

export { toast };
