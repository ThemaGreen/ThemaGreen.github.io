/* =============================================================================
   Job Match Explorer — paste a job description, get an evidence-backed fit read.
   Runs entirely in the browser. Nothing is uploaded, stored, or sent anywhere.
   ========================================================================== */
import { PROFILE, PROJECTS, SKILLS, EXPERIENCE } from "./data.js";
import { ICONS, paintIcons } from "./icons.js";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Theme (shared behaviour, standalone page) ------------------- */
function initTheme() {
  const btn = $("#themeToggle");
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const set = (m) => {
    document.documentElement.dataset.theme = m;
    if (btn) btn.innerHTML = ICONS[m === "dark" ? "sun" : "moon"];
  };
  set(stored || (prefersDark ? "dark" : "light"));
  btn?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next); set(next);
  });
}

/* ---------- Term extraction --------------------------------------------- */
const STOP = new Set(`a an the and or but if then than that this these those of in on at to for with from by as is are was were be been being will would can could should may might must have has had do does did not no nor so such our your their its it we you they he she i us them who whom which what when where why how all any both each few more most other some only own same too very just also about into over under again further once here there because while during before after above below up down out off own s t don now d ll m o re ve y ain aren couldn didn doesn hadn hasn haven isn ma mightn mustn needn shan shouldn wasn weren won wouldn
job role position candidate applicant company team work working works experience years year required requirements requirement responsibilities responsibility qualifications qualification preferred plus strong excellent ability able skills skill knowledge understanding including include includes etc across within using use used help helps support supports ensure ensuring drive driving lead leading build building develop developing design designing create creating manage managing deliver delivering apply applying join joining opportunity opportunities benefits salary equal employer diversity applicants status veteran disability
degree bachelor bachelors master masters phd equivalent field related`.split(/\s+/));

const SYNONYMS = {
  ml: ["machine learning"], ai: ["artificial intelligence"], ux: ["user experience"],
  ui: ["user interface"], hci: ["human computer interaction"], hf: ["human factors"],
  asr: ["speech recognition"], nlp: ["natural language processing"], llm: ["large language model"],
  se: ["systems engineering"], qa: ["quality assurance"], pm: ["project management"],
  gcp: ["google cloud"], aws: ["cloud"], k8s: ["kubernetes"], a11y: ["accessibility"],
  rag: ["retrieval augmented generation"], mle: ["machine learning engineer"],
};

function tokenize(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9+#./ -]/g, " ");
  const words = clean.split(/[\s/]+/).map((w) => w.replace(/^[-.]+|[-.]+$/g, "")).filter(Boolean);
  const terms = new Map();
  const bump = (t, n = 1) => { if (t.length > 1 && !STOP.has(t)) terms.set(t, (terms.get(t) || 0) + n); };
  words.forEach((w) => {
    bump(w);
    (SYNONYMS[w] || []).forEach((syn) => bump(syn, 2));
  });
  for (let i = 0; i < words.length - 1; i++) {
    const bg = `${words[i]} ${words[i + 1]}`;
    if (!STOP.has(words[i]) && !STOP.has(words[i + 1])) terms.set(bg, (terms.get(bg) || 0) + 2);
  }
  return terms;
}

/* ---------- Evidence corpus --------------------------------------------- */
const DIMENSIONS = [
  {
    id: "research", label: "Research & experimentation",
    corpus: [
      "research", "researcher", "research scientist", "study", "studies", "hypothesis", "experiment",
      "experimental design", "experimentation", "statistics", "statistical", "regression", "spss",
      "quantitative", "qualitative", "mixed methods", "survey", "surveys", "interview", "interviews",
      "irb", "protocol", "psychometrics", "assessment", "measurement", "benchmark", "benchmarking",
      "evaluation", "evaluate", "analysis", "analyse", "analyze", "data analysis", "publication",
      "paper", "peer review", "conference", "acii", "literature review", "participant", "recruitment",
      "sample", "validity", "reliability", "reproducibility", "field study", "ethnography",
      "contextual inquiry", "observation", "behavioral research", "human in the loop",
    ],
  },
  {
    id: "ml", label: "Machine learning & engineering",
    corpus: [
      "machine learning", "ml", "artificial intelligence", "ai", "deep learning", "neural", "model", "models", "training", "fine tuning",
      "inference", "dataset", "pytorch", "tensorflow", "hugging face", "transformers", "transformer",
      "llm", "nlp", "asr", "speech", "speech recognition", "whisper", "audio", "signal processing",
      "mfcc", "lstm", "bilstm", "rnn", "classification", "clustering", "sentiment analysis",
      "affective computing", "quantization", "distillation", "augmentation", "model compression",
      "python", "code", "software", "engineering", "backend", "api", "fastapi", "rest", "docker",
      "kubernetes", "cloud", "google cloud", "gcp", "cloud run", "cloud sql", "postgresql", "sql",
      "database", "deployment", "production", "mlops", "pipeline", "ci", "cd", "git", "react",
      "javascript", "frontend", "saas", "authentication", "platform", "scalability", "performance",
      "ai engineer", "ml engineer", "data scientist", "recommendation system", "chatbot", "agents",
    ],
  },
  {
    id: "ux", label: "UX, design & accessibility",
    corpus: [
      "ux", "user experience", "ui", "user interface", "usability", "usability testing", "user testing",
      "user research", "ux research", "ux design", "product design", "interaction design",
      "heuristic evaluation", "heuristics", "persona", "personas", "journey map", "journey mapping",
      "wireframe", "wireframes", "prototype", "prototyping", "figma", "design system", "design systems",
      "information architecture", "ia", "visual design", "accessibility", "wcag", "inclusive design",
      "a11y", "screen reader", "design thinking", "empathy map", "card sorting", "diary study",
      "usability study", "hci", "human computer interaction", "mobile", "responsive", "voice ui",
      "wearables", "cross device", "ar", "vr", "unity", "cad", "3d",
    ],
  },
  {
    id: "systems", label: "Systems, safety & governance",
    corpus: [
      "human factors", "ergonomics", "engineering psychology", "cognitive psychology", "cognition",
      "attention", "workload", "situation awareness", "mental model", "mental models",
      "human systems integration", "hsi", "human ai teaming", "human machine teaming", "teaming",
      "automation", "autonomy", "autonomous", "oversight", "trust", "trust calibration",
      "systems engineering", "systems thinking", "sociotechnical", "requirements", "architecture",
      "verification", "validation", "v&v", "certification", "regulatory", "compliance", "standards",
      "safety", "safety engineering", "risk", "risk management", "hazard", "reliability",
      "incident investigation", "root cause", "accident analysis", "swiss cheese",
      "aviation", "aerospace", "flight", "cockpit", "flight deck", "air traffic", "nasa", "faa",
      "defense", "military", "clearance", "security clearance", "responsible ai", "ai ethics",
      "ai governance", "ai policy", "ai safety", "alignment", "fairness", "bias", "eu ai act",
      "nist", "governance", "ethics", "mission design", "proposal",
    ],
  },
  {
    id: "leadership", label: "Leadership & communication",
    corpus: [
      "leadership", "lead", "manage", "management", "mentor", "mentoring", "mentorship", "coaching",
      "stakeholder", "stakeholders", "communication", "communicate", "presentation", "present",
      "cross functional", "collaboration", "collaborate", "facilitation", "workshop",
      "technical writing", "writing", "documentation", "report", "reporting", "roadmap", "strategy",
      "planning", "sprint", "sprints", "agile", "scrum", "kanban", "project management",
      "program management", "product manager", "project manager", "operations", "teaching",
      "training", "onboarding", "hiring", "budget", "vendor", "proposal writing", "grant writing",
    ],
  },
];

const norm = (list) => [...new Set(list.map((s) => String(s).toLowerCase().trim()).filter(Boolean))];

/* ---------- Domain lexicon -----------------------------------------------
   Terms that are *substantive* in a job posting. A JD term only counts toward
   the score (numerator or denominator) if it lands somewhere in here — that is
   what stops "partner", "define", or "opportunity" from inflating the result.
   Terms present here but absent from the evidence corpus become honest gaps.
   ---------------------------------------------------------------------- */
const EXTRA_LEXICON = norm([
  // Languages / runtimes we may or may not have
  "java", "c++", "c#", "go", "golang", "rust", "swift", "kotlin", "ruby", "php", "scala",
  "r", "matlab", "julia", "typescript", "javascript", "sql", "bash", "perl",
  // Infra / platform
  "kubernetes", "terraform", "ansible", "jenkins", "github actions", "ci", "cd", "aws", "azure",
  "lambda", "s3", "redshift", "snowflake", "databricks", "spark", "hadoop", "kafka", "airflow",
  "redis", "mongodb", "graphql", "grpc", "rest", "microservices", "serverless", "linux",
  // ML specifics
  "tensorflow", "jax", "keras", "scikit", "sklearn", "xgboost", "cuda", "onnx", "triton",
  "rlhf", "fine tuning", "embeddings", "vector database", "rag", "retrieval", "diffusion",
  "computer vision", "reinforcement learning", "time series", "forecasting", "recommender",
  "transformer", "bert", "gpt", "llm", "prompt engineering", "agents", "mlflow", "weights and biases",
  // Research / analysis
  "anova", "bayesian", "causal inference", "ab testing", "a/b testing", "eye tracking",
  "eeg", "fnirs", "physiological", "biometrics", "ethnography", "diary study", "card sorting",
  "think aloud", "cognitive walkthrough", "nasa tlx", "sus", "situation awareness", "workload",
  // Domain
  "aviation", "aerospace", "flight deck", "cockpit", "air traffic", "uav", "drone", "satellite",
  "automotive", "maritime", "nuclear", "medical device", "clinical", "healthcare", "fintech",
  "cybersecurity", "defense", "intelligence community", "security clearance", "itar", "faa",
  "easa", "do-178c", "arp4754", "iso 26262", "iec 62366", "mil-std", "section 508", "wcag",
  // Design / product
  "sketch", "adobe", "illustrator", "photoshop", "after effects", "webflow", "storybook",
  "react", "vue", "angular", "svelte", "next.js", "tailwind", "css", "html", "design tokens",
  "motion design", "3d", "blender", "unreal", "unity", "cad", "solidworks",
  // Ops / people
  "scrum", "kanban", "jira", "confluence", "okr", "budget", "hiring", "performance review",
  "vendor management", "procurement", "grant writing", "peer review", "publication", "conference",
]);

const EVIDENCE_LEXICON = (() => {
  const parts = [
    ...DIMENSIONS.flatMap((d) => d.corpus),
    ...PROJECTS.flatMap((p) => [...p.keywords, ...p.tags]),
    ...SKILLS.flatMap((s) => s.keywords),
    ...EXPERIENCE.flatMap((e) => [...(e.skills || []), ...(e.stack || [])]),
  ];
  return norm(parts);
})();

/* ---------- Scoring ------------------------------------------------------ */
/** Best lexicon entry for a term: exact match wins, else longest containment. */
function containsWord(haystack, needle) {
  if (needle.length < 4) return false;
  const i = haystack.indexOf(needle);
  if (i < 0) return false;
  const before = i === 0 ? " " : haystack[i - 1];
  const after = i + needle.length >= haystack.length ? " " : haystack[i + needle.length];
  return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
}

function bestEntry(term, lex) {
  let partial = null;
  for (const c of lex) {
    if (c === term) return c;
    // A single job-post word must not resolve to a longer, more specific label
    // ("systems" -> "design systems"); only multi-word phrases may narrow.
    const narrows = term.includes(" ") && containsWord(c, term);
    if (narrows || containsWord(term, c)) {
      if (!partial || c.length < partial.length) partial = c;   // most conservative label
    }
  }
  return partial;
}

function scoreJob(text) {
  const terms = tokenize(text);
  const termList = [...terms.entries()];
  const totalWeight = termList.reduce((a, [, n]) => a + n, 0) || 1;
  const dimCorpora = DIMENSIONS.map((d) => ({ ...d, corpus: norm(d.corpus) }));

  let substantiveWeight = 0, coveredWeight = 0;
  const matched = new Map();          // raw JD term -> weight
  const canon = new Map();            // raw JD term -> canonical evidence term
  const gapCanon = new Map();         // canonical lexicon entry -> weight
  const dimWeight = new Map(dimCorpora.map((d) => [d.id, 0]));

  for (const [t, n] of termList) {
    const evidenceHit = bestEntry(t, EVIDENCE_LEXICON);
    const extraHit = evidenceHit ? null : bestEntry(t, EXTRA_LEXICON);
    if (!evidenceHit && !extraHit) continue;      // noise — excluded from both sides

    substantiveWeight += n;

    if (evidenceHit) {
      coveredWeight += n;
      matched.set(t, n);
      canon.set(t, evidenceHit);
      // Attribute to the dimension with the most specific match — exact beats partial.
      let best = null, bestRank = -1;
      for (const d of dimCorpora) {
        const e = bestEntry(t, d.corpus);
        if (!e) continue;
        const rank = (e === t ? 1000 : 0) + Math.min(e.length, t.length);
        if (rank > bestRank) { bestRank = rank; best = d.id; }
      }
      if (best) dimWeight.set(best, dimWeight.get(best) + n);
    } else {
      gapCanon.set(extraHit, (gapCanon.get(extraHit) || 0) + n);
    }
  }

  // Domain relevance guard: if most of the posting is outside my field entirely,
  // a high hit-rate on the small in-domain slice must not read as a strong fit.
  const denominator = Math.max(substantiveWeight, 0.6 * totalWeight);
  const overall = substantiveWeight
    ? Math.max(0, Math.min(96, Math.round((coveredWeight / denominator) * 100)))
    : 0;
  const domainRelevance = substantiveWeight / totalWeight;

  const attributed = [...dimWeight.values()].reduce((a, b) => a + b, 0) || 1;
  const dims = dimCorpora.map((d) => {
    const w = dimWeight.get(d.id) || 0;
    return { id: d.id, label: d.label, coverage: Math.round((w / attributed) * 100) };
  }).filter((d) => d.coverage > 0).sort((a, b) => b.coverage - a.coverage);

  const uncovered = substantiveWeight
    ? Math.round(((substantiveWeight - coveredWeight) / substantiveWeight) * 100) : 0;

  const matchedList = [...matched.entries()].sort((a, b) => b[1] - a[1]);

  const projectHits = PROJECTS.map((p) => {
    const hay = norm([...p.keywords, ...p.tags, p.title, p.org, p.kicker, p.summary]).join(" | ");
    let s = 0; const hits = new Set();
    for (const [t, n] of matchedList) {
      if (hay.includes(t)) { s += n * (t.includes(" ") ? 2.4 : 1); hits.add(t); }
    }
    const labels = [...new Set([...hits].map((t) => canon.get(t) || t))]
      .filter((l, i, arr) => !arr.some((o, j) => j < i && o.includes(l)))
      .sort((a, b) => b.length - a.length);
    return { project: p, score: s, matched: labels };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score);

  const skillHits = SKILLS.map((sk) => {
    const hay = norm([...sk.keywords, sk.title]).join(" | ");
    const hits = matchedList.filter(([t]) => hay.includes(t)).map(([t]) => t);
    return { skill: sk, n: hits.length, matched: hits };
  }).filter((r) => r.n > 0).sort((a, b) => b.n - a.n);

  // Gaps: canonical lexicon names, deduped, never a substring of a matched term.
  const matchedBlob = matchedList.map(([t]) => t).join(" | ");
  const gaps = [...new Set([...gapCanon.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t))]
    .filter((g) => !matchedBlob.includes(g))
    .filter((g, i, arr) => !arr.some((o, j) => j < i && o.includes(g)))
    .slice(0, 10);

  // Matched terms for display: drop tokens subsumed by a longer matched phrase.
  const matchedTerms = [...new Set(matchedList.map(([t]) => canon.get(t) || t))]
    .filter((t, i, arr) => !arr.some((o, j) => j !== i && o !== t && o.includes(t)))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 30);

  return {
    overall, dims, uncovered, projectHits, skillHits, gaps, matchedTerms,
    domainRelevance,
    substantive: substantiveWeight, covered: coveredWeight,
    termCount: termList.length,
  };
}

/* ---------- Render ------------------------------------------------------- */
function verdict(n, relevance = 1) {
  if (!n) return { t: "No signal", d: "Not enough recognisable content to score. Paste the full posting, including responsibilities and qualifications." };
  if (relevance < 0.5) return {
    t: "Different field",
    d: "Most of this posting sits outside the domains my work covers. There is some transferable overlap below, but treat this as a stretch rather than a match.",
  };
  if (n >= 85) return { t: "Strong fit", d: "The posting's core asks map directly onto documented work, with evidence for each." };
  if (n >= 68) return { t: "Good fit", d: "Most of the posting is answered by real evidence, with a few edges worth discussing." };
  if (n >= 45) return { t: "Partial fit", d: "Genuine overlap on the core, plus areas where my evidence is adjacent rather than direct." };
  return { t: "Adjacent", d: "Limited direct overlap. Worth a conversation only if the transferable angle is what you are after." };
}

function render(result) {
  const out = $("#results");
  const v = verdict(result.overall, result.domainRelevance);

  out.innerHTML = `
    <div class="card" data-reveal>
      <div class="score-row">
        <div class="ring" style="--pct:${result.overall}">
          <span class="ring__n" id="ringNumber">0</span>
        </div>
        <div>
          <p class="eyebrow" style="margin-bottom:.4rem">Overall fit</p>
          <h3 style="font-family:var(--font-display);font-size:var(--step-2);font-weight:600">${esc(v.t)}</h3>
          <p class="muted" style="margin-top:.4rem;max-width:46ch">${esc(v.d)}</p>
          <p class="mono muted" style="margin-top:.8rem">${result.termCount} terms parsed · ${Math.round(result.domainRelevance * 100)}% of the posting is in-domain · ${result.covered} of ${result.substantive} in-domain signal answered</p>
        </div>
      </div>

      <h4 class="block-title">What answers this posting</h4>
      <p class="muted" style="margin-bottom:1rem;font-size:var(--step--1)">
        Share of the posting's substantive content that each area of my documented work accounts for.
      </p>
      <div class="meters">
        ${result.dims.filter((d) => d.coverage > 0).map((d) => `
          <div class="meter">
            <div class="meter__top"><span>${esc(d.label)}</span><span>${d.coverage}%</span></div>
            <div class="meter__track"><div class="meter__fill" data-fill="${d.coverage}"></div></div>
          </div>`).join("")}
        ${result.uncovered > 0 ? `
          <div class="meter">
            <div class="meter__top"><span class="muted">Not covered by documented work</span><span class="muted">${result.uncovered}%</span></div>
            <div class="meter__track"><div class="meter__fill" data-fill="${result.uncovered}" style="background:linear-gradient(90deg,var(--ink-3),var(--line))"></div></div>
          </div>` : ""}
      </div>
    </div>

    ${result.projectHits.length ? `
    <div class="card" data-reveal>
      <h4 class="block-title">Evidence — projects that answer this posting</h4>
      <div class="evidence">
        ${result.projectHits.slice(0, 5).map((r, i) => `
          <article class="evidence__item">
            <span class="evidence__rank">${i + 1}</span>
            <div>
              <h5>${esc(r.project.title)}</h5>
              <p class="mono muted">${esc(r.project.org)} · ${esc(r.project.year)}</p>
              <p>${esc(r.project.summary)}</p>
              ${r.project.outcome ? `<p class="work__outcome" style="margin-top:.6rem">${ICONS.bolt}<span>${esc(r.project.outcome)}</span></p>` : ""}
              <div class="tags" style="margin-top:.6rem">${r.matched.slice(0, 6).map((m) => `<span class="tag">${esc(m)}</span>`).join("")}</div>
              <p style="margin-top:.7rem"><a class="btn btn--ghost btn--sm" href="index.html#case-${esc(r.project.id)}">${ICONS.arrowRight} Full case study</a></p>
            </div>
          </article>`).join("")}
      </div>
    </div>` : ""}

    ${result.skillHits.length ? `
    <div class="card" data-reveal>
      <h4 class="block-title">Capabilities the posting asks for</h4>
      <div class="pill-row">
        ${result.skillHits.map((r) => `<span class="pill">${esc(r.skill.title)} <span class="mono">×${r.n}</span></span>`).join("")}
      </div>
    </div>` : ""}

    ${result.matchedTerms.length ? `
    <div class="card" data-reveal>
      <h4 class="block-title">Matched terms</h4>
      <div class="tags">${result.matchedTerms.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
    </div>` : ""}

    <div class="card" data-reveal>
      <h4 class="block-title">Where the evidence runs thin</h4>
      ${result.gaps.length
        ? `<p class="muted" style="margin-bottom:.9rem">These recur in the posting and have no direct match in my documented work. Honest gaps — worth naming rather than papering over.</p>
           <div class="tags">${result.gaps.map((g) => `<span class="tag">${esc(g)}</span>`).join("")}</div>`
        : `<p class="muted">Nothing in the posting repeats without matching evidence somewhere in the portfolio.</p>`}
    </div>

    <div class="card" data-reveal>
      <h4 class="block-title">Talking points for a first conversation</h4>
      <ul class="bullets">
        ${(result.projectHits.slice(0, 3).map((r) =>
          `<li><strong>${esc(r.project.title)}</strong> — ${esc(r.project.outcome || r.project.summary)}</li>`).join(""))
          || `<li>Paste more of the posting to generate specific talking points.</li>`}
        ${result.gaps.length ? `<li><strong>Ask me directly about:</strong> ${result.gaps.slice(0, 4).map(esc).join(", ")}. I would rather tell you what I have and have not done than guess.</li>` : ""}
        <li>Cross-cutting: I work at the seam between people and automated systems — human factors on one side, ML engineering and systems engineering on the other.</li>
      </ul>
      <p style="margin-top:1.5rem">
        <a class="btn btn--primary" href="mailto:${esc(PROFILE.email)}?subject=${encodeURIComponent("Role discussion — " + v.t)}">${ICONS.send} Email me about this role</a>
      </p>
    </div>

    <p class="note" data-reveal>${ICONS.info}<span>
      This is a transparent keyword-and-evidence heuristic running in your browser — not an AI judgement and not a
      substitute for reading the work. Nothing you paste leaves this page.
    </span></p>`;

  out.hidden = false;

  // Animate the ring + meters.
  const ring = $(".ring", out);
  const num = $("#ringNumber", out);
  if (REDUCED.matches) {
    num.textContent = result.overall;
    $$(".meter__fill", out).forEach((f) => (f.style.width = f.dataset.fill + "%"));
  } else {
    const start = performance.now(), dur = 1100;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      num.textContent = Math.round(result.overall * e);
      ring.style.setProperty("--pct", (result.overall * e).toFixed(1));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    $$(".meter__fill", out).forEach((f, i) =>
      setTimeout(() => (f.style.width = f.dataset.fill + "%"), 260 + i * 110));
  }

  $$("[data-reveal]", out).forEach((el, i) => {
    el.style.setProperty("--d", `${i * 60}ms`);
    requestAnimationFrame(() => el.classList.add("is-in"));
  });

  out.scrollIntoView({ behavior: REDUCED.matches ? "auto" : "smooth", block: "start" });
}

/* ---------- Wiring ------------------------------------------------------- */
const SAMPLE = `Human Factors Engineer — Autonomous Flight Systems

We are looking for a human factors engineer to join our flight deck autonomy team. You will
partner with systems engineers and ML researchers to define how pilots supervise increasingly
autonomous systems, and to validate that the resulting workload, situation awareness, and
trust calibration meet certification expectations.

Responsibilities
- Conduct human-in-the-loop studies and usability evaluations in simulator environments
- Define human systems integration requirements and support verification and validation
- Analyse incident and safety data to identify latent organisational and design failures
- Partner with machine learning teams on human-AI teaming, oversight, and trust calibration
- Communicate findings to engineering, certification, and regulatory stakeholders

Qualifications
- Degree in human factors, engineering psychology, systems engineering or related field
- Experience with experimental design, statistics, and mixed-methods research
- Familiarity with aviation safety standards and AI risk frameworks such as the NIST AI RMF
- Strong technical writing and stakeholder communication
- Python and data analysis experience preferred`;

function boot() {
  paintIcons();
  initTheme();
  $("#year") && ($("#year").textContent = new Date().getFullYear());

  const input = $("#jobInput");
  const runBtn = $("#runMatch");
  const clearBtn = $("#clearMatch");
  const sampleBtn = $("#useSample");
  const counter = $("#charCount");

  const updateCount = () => {
    const n = input.value.trim().length;
    counter.textContent = n ? `${n.toLocaleString()} characters` : "";
    runBtn.disabled = n < 40;
  };

  input.addEventListener("input", updateCount);
  updateCount();

  runBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (text.length < 40) return;
    runBtn.disabled = true;
    runBtn.innerHTML = `${ICONS.bolt} Scoring…`;
    setTimeout(() => {
      render(scoreJob(text));
      runBtn.innerHTML = `${ICONS.bolt} Score my fit`;
      updateCount();
    }, 220);
  });

  clearBtn.addEventListener("click", () => {
    input.value = ""; updateCount();
    $("#results").hidden = true; $("#results").innerHTML = "";
    input.focus();
  });

  sampleBtn.addEventListener("click", () => {
    input.value = SAMPLE; updateCount(); input.focus(); runBtn.click();
  });

  input.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runBtn.click(); }
  });
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
