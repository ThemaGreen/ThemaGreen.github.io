/* =============================================================================
   Thema Green — single source of truth for portfolio content.
   Consumed by scripts/site.js (index.html) and scripts/job-match.js (job-match.html).
   Edit content HERE, never in the HTML.
   ========================================================================== */

export const PROFILE = {
  name: "Thema Green",
  initials: "TG",
  headline: "AI Research Scientist & Human Factors Engineer",
  linkedinHeadline:
    "MRAeS · NASA L'SPACE · AI Research Scientist at HCAI@Howard · Project Manager at Cioré · MSc Systems Engineering @ ERAU · GMU Alumna",
  location: "Washington, DC–Baltimore Area",
  email: "themagreen@gmail.com",
  linkedin: "https://www.linkedin.com/in/themagreen/",
  github: "https://github.com/ThemaGreen",
  openTo:
    "Open to human factors, systems engineering, and human-centered AI roles — on-site, hybrid, or remote.",
  rotatingWords: [
    "human–AI teaming",
    "speech & responsible AI",
    "systems engineering",
    "human factors",
    "aviation & autonomy",
    "UX research",
    "AI safety & ethics",
  ],
  stats: [
    { n: 4, suffix: "", label: "Concurrent research &amp; engineering roles" },
    { n: 3, suffix: "", label: "Federally &amp; industry funded programs (AFRL, ONR, Google)" },
    { n: 1, suffix: "", label: "NASA L&rsquo;SPACE proposal team, Lucy Mission" },
    { n: 25, suffix: "+", label: "Applied projects across research, product &amp; design" },
  ],
  capabilities: [
    "Human factors engineering",
    "Human–AI teaming",
    "Systems engineering",
    "Speech & ASR research",
    "Responsible AI",
    "MLOps & deployment",
    "UX research",
    "Safety-critical systems",
    "Accessibility (WCAG 2.2)",
    "Mixed-methods studies",
    "Aviation & autonomy",
    "Design thinking",
  ],
};

/* ---------------------------------------------------------------------------
   EXPERIENCE — mirrors the LinkedIn record.
   ------------------------------------------------------------------------ */
export const EXPERIENCE = [
  {
    id: "lspace",
    role: "NASA Proposal Writer",
    org: "L'SPACE Program (NASA / Arizona State University)",
    type: "Apprenticeship · Remote",
    start: "Aug 2026",
    end: "Present",
    current: true,
    blurb:
      "Selected for the NASA L'SPACE NPWEE Academy (Fall 2026) to co-author and defend a mission proposal for the Lucy Mission alongside an interdisciplinary national team.",
    bullets: [
      "Collaborating with an interdisciplinary team to write and evaluate a NASA proposal tied to the Lucy Mission.",
      "Innovating against documented NASA pain points and developing a 7-page technical proposal.",
      "Participating in a NASA proposal review panel, applying systems engineering coursework to a live review process.",
    ],
    skills: ["Systems engineering", "Technical writing", "Proposal review", "Mission design"],
  },
  {
    id: "rita",
    role: "Researcher",
    org: "Research Institute for Tactical Autonomy (RITA UARC)",
    type: "Full-time · Hybrid · Washington, DC",
    start: "Jun 2026",
    end: "Present",
    current: true,
    blurb:
      "Designing and evaluating deep-learning classification systems for autonomy research, with a focus on how lab performance translates to real-world conditions.",
    bullets: [
      "Designed and evaluated a BiLSTM-based classification system across three benchmark datasets.",
      "Ran five controlled training experiments — fine-tuning, self-distillation, and augmentation — to characterise the tradeoff between lab and real-world performance.",
      "Applied post-training quantization to reduce inference cost without collapsing accuracy.",
    ],
    skills: ["BiLSTM", "Post-training quantization", "Human-centered AI", "Experimental design"],
  },
  {
    id: "hcai",
    role: "AI/ML Research Scientist & Fellow — Speech & Responsible AI",
    org: "The Institute for Human-Centered AI at Howard University",
    type: "Full-time · Hybrid · Washington, DC",
    start: "Apr 2026",
    end: "Present",
    current: true,
    funding: "AFRL-, ONR-, and Google-funded",
    blurb:
      "Combining applied ML, MLOps, responsible AI, and research communication in a lab focused on reducing automatic speech recognition bias and improving performance across accents and communities.",
    bullets: [
      "Independently productionized a fine-tuned OpenAI Whisper speech-to-text model and transcription service end-to-end in one week — from local prototype to deployable SaaS platform and production API.",
      "Built the platform on FastAPI, PostgreSQL (Cloud SQL) and Google Cloud Run with JWT and API-key authentication, usage metering, and a base-vs-fine-tuned comparison view, giving researchers on-demand authenticated transcription instead of manual local runs.",
      "Improved transcription reliability with quantization and staggered model loading to reduce low-RAM crashes and stabilise long-form inference.",
      "Deployed Cloud Run models from a GCS mount, cutting runtime and improving reproducibility.",
      "Benchmarked fine-tuned and commercial ASR models on AAVE speech, quantifying accuracy gaps and documenting error patterns and regional variation.",
      "Developed an interactive map visualising AAVE dialect clusters and each sample's role in ASR research.",
      "Ran affective computing, sentiment analysis, word clustering, and dialect-aware analysis on a large African American English dataset with Hugging Face Transformers, toward an ACII 2026 submission.",
      "Mentored REU undergraduate researchers, held weekly office hours, and prepared fellows for stakeholder-facing presentations, including to Google.",
      "Helped shape the REU Fellowship program by bringing UX design, qualitative research, participant screening, recruitment, and usability study practice into weekly goals.",
    ],
    stack: [
      "Python", "PyTorch", "Hugging Face Transformers", "OpenAI Whisper", "FastAPI",
      "PostgreSQL", "Docker", "Google Cloud Run", "Cloud SQL", "GCS", "Artifact Registry", "React", "Git",
    ],
    skills: ["MLOps", "Responsible AI", "ASR", "Mentorship", "Research communication"],
  },
  {
    id: "ciore",
    role: "Project Manager",
    org: "Cioré",
    type: "Leadership",
    start: "2025",
    end: "Present",
    current: true,
    blurb:
      "Driving structure, alignment, and execution across teams building privacy-first, modular, solar-powered smartphones.",
    bullets: [
      "Own operational leadership and long-term strategy: setting direction, removing blockers, and maintaining momentum.",
      "Translate ideas into clear plans, focused sprints, and measurable outcomes.",
      "Build the systems, workflows, and communication structures that let teams move quickly without sacrificing quality or integrity.",
      "Uphold Cioré's standards around ethics, privacy, and thoughtful technology at a pivotal growth stage.",
    ],
    skills: ["Program management", "Operational strategy", "Cross-functional leadership", "Ethical tech"],
  },
  {
    id: "caci",
    role: "Background Investigator",
    org: "CACI International Inc",
    type: "Full-time",
    start: "May 2025",
    end: "Present",
    current: true,
    blurb:
      "Federal background investigation work. Tentative offer contingent on a favourable Top Secret (T5) clearance decision.",
    bullets: [
      "Structured evidence gathering, source interviewing, and report writing under federal investigative standards.",
      "High-integrity handling of sensitive information under strict procedural controls.",
    ],
    skills: ["Investigative interviewing", "Report writing", "Compliance"],
  },
  {
    id: "aiaa",
    role: "Member",
    org: "AIAA — ERAU Worldwide Student Branch",
    type: "Professional membership",
    start: "Mar 2026",
    end: "Apr 2026",
    current: false,
    blurb: "Student branch participation alongside ERAU systems engineering coursework.",
    bullets: [],
    skills: ["Aerospace community"],
  },
  {
    id: "raes",
    role: "Member (MRAeS) — Human Factors & Flight Ops subgroup",
    org: "Royal Aeronautical Society",
    type: "Professional membership",
    start: "2026",
    end: "Present",
    current: true,
    blurb:
      "Invited to support research initiatives with the RAeS Human Factors & Flight Operations specialist subgroup.",
    bullets: [
      "Contributing a human factors perspective to aviation safety and flight operations research initiatives.",
    ],
    skills: ["Aviation human factors", "Flight operations", "Safety research"],
  },
];

/* ---------------------------------------------------------------------------
   EDUCATION
   ------------------------------------------------------------------------ */
export const EDUCATION = [
  {
    id: "erau",
    school: "Embry-Riddle Aeronautical University",
    credential: "M.S. Systems Engineering",
    date: "2026 — Present",
    badge: "In progress",
    category: "graduate",
    blurb:
      "Accepted into ERAU's highly selective Systems Engineering M.S. program, focused on autonomous systems in aerospace and aviation — the cross-section of AI and flight.",
    sections: [],
    transfer: [
      "Systems architecture", "Requirements engineering", "V&V", "Autonomy in aerospace", "MBSE thinking",
    ],
  },
  {
    id: "gmu",
    school: "George Mason University",
    credential: "B.S. Psychology — Human Factors & Applied Cognition · Minor in Design Thinking",
    date: "2021 — 2025",
    badge: "Alumna",
    category: "university",
    blurb:
      "Cognitive science and human factors core paired with a studio design-thinking minor — experimental methods on one side, prototyping and craft on the other.",
    sections: [
      {
        title: "Core psychology & human factors",
        courses: [
          "Statistics in psychology", "Research methods", "Cognitive psychology",
          "Human factors psychology", "Biopsychology and lab", "Applied cross-cultural psychology",
          "Developmental psychology", "Advanced topics in human factors", "Psychology in the community",
          "Mystery, madness, and murder", "Revitalizing endangered languages",
        ],
      },
      {
        title: "Design thinking minor",
        courses: [
          "Drawing I", "Mobile app design", "Design in the modern world",
          "Design thinking capstone", "History of graphic design",
        ],
      },
      {
        title: "Additional relevant coursework",
        courses: [
          "General biology and labs", "Cell structure and function", "Introduction to neuroscience",
          "Fundamentals of communication", "Advanced composition, multidisciplinary",
          "Professional and technical writing", "Philosophy and literature",
          "Introductory sociology", "Practicum in educational psychology",
        ],
      },
    ],
    transfer: [
      "Experimental design", "Human behaviour modelling", "Cognitive architecture",
      "Cross-cultural UX", "Human-centered AI", "Ethical reasoning",
    ],
  },
  {
    id: "csm",
    school: "College of Southern Maryland",
    credential: "Dual enrollment — 20 transfer credits accepted by GMU",
    date: "2019 — 2021",
    badge: "Dual enrollment",
    category: "college",
    blurb: "College coursework completed during high school, all at A grade.",
    sections: [
      {
        title: "Coursework",
        courses: [
          "Accounting elective", "Computer science elective", "Precalculus",
          "Analytic geometry and calculus I", "Logic and critical thinking", "Basic concepts in psychology",
        ],
      },
    ],
    transfer: ["Formal logic", "Mathematical modelling", "Cognitive foundations"],
  },
  {
    id: "hs",
    school: "St. Charles High School",
    credential: "Project Lead The Way — Engineering & Computer Science",
    date: "2017 — 2021",
    badge: "17 AP courses",
    category: "highschool",
    blurb:
      "PLTW engineering pathway with a civil and architectural engineering focus — CAD, electronics, and structured problem solving that became the technical base for later human factors work.",
    sections: [
      {
        title: "Engineering & CS pathway",
        courses: [
          "Intro to engineering design", "Principles of engineering",
          "Civil engineering and architecture", "Digital electronics",
          "Computer science (Python, Java, C++)", "Engineering capstone and senior project",
        ],
      },
      {
        title: "Advanced Placement",
        courses: [
          "AP Physics 1 and 2", "AP Calculus AB and BC", "AP Statistics", "AP Computer Science A",
        ],
      },
    ],
    transfer: ["Systems thinking", "Algorithmic reasoning", "Technical prototyping"],
  },
];

/* ---------------------------------------------------------------------------
   PROJECTS
   category: research | product | academic | concept
   ------------------------------------------------------------------------ */
export const PROJECTS = [
  {
    id: "whisper-platform",
    title: "Fine-tuned Whisper transcription platform",
    org: "HCAI @ Howard University",
    year: "2026",
    category: "research",
    featured: true,
    badge: "Shipped in one week",
    image: null,
    glyph: "waveform",
    kicker: "Applied ML · MLOps",
    summary:
      "Took a fine-tuned OpenAI Whisper model from a local research prototype to a deployable SaaS platform and production API — single-handedly, in a week.",
    outcome: "Researchers moved from manual local runs to on-demand authenticated transcription.",
    problem:
      "Researchers studying ASR bias were running a fine-tuned Whisper model by hand on local machines. Every transcription was a manual job, results were hard to reproduce, and there was no way to compare the fine-tuned model against the base model without re-running everything by hand.",
    process: [
      "Designed and built a FastAPI service backed by PostgreSQL on Cloud SQL, containerised with Docker and deployed to Google Cloud Run.",
      "Added JWT and API-key authentication plus usage metering so the service could be shared safely across the lab.",
      "Built a base-vs-fine-tuned comparison view so researchers could see model differences side by side rather than diffing text files.",
      "Introduced quantization and staggered model loading to stop low-RAM crashes and stabilise long-form inference.",
      "Served Cloud Run models from a GCS mount, which cut runtime and made runs reproducible.",
    ],
    outcomes: [
      "Prototype → deployable SaaS platform and production API in one week, solo.",
      "Long-form inference stabilised; low-RAM crash class eliminated.",
      "Reproducible runs via GCS-mounted model artifacts.",
    ],
    metrics: [
      { n: "1 wk", l: "Prototype to production, solo" },
      { n: "2", l: "Auth modes: JWT + API key" },
      { n: "0", l: "Manual local runs required" },
    ],
    tags: ["FastAPI", "Cloud Run", "PostgreSQL", "Whisper", "Docker", "MLOps"],
    keywords: [
      "mlops", "ml engineer", "backend", "api", "fastapi", "python", "docker", "gcp", "google cloud",
      "cloud run", "postgres", "sql", "deployment", "production", "speech", "asr", "whisper",
      "quantization", "inference", "saas", "authentication", "platform engineering", "ai engineer",
    ],
    links: [],
  },
  {
    id: "aave-asr",
    title: "AAVE speech & ASR bias benchmarking",
    org: "HCAI @ Howard University · AFRL / ONR / Google funded",
    year: "2026",
    category: "research",
    featured: true,
    badge: "ACII 2026 submission",
    image: null,
    glyph: "globe",
    kicker: "Responsible AI · Speech",
    summary:
      "Quantifying where automatic speech recognition fails African American English speakers — and building the dialect map and affective analysis that make those failures legible.",
    outcome: "Documented accuracy gaps, error patterns, and regional variation across fine-tuned and commercial ASR.",
    problem:
      "Commercial speech recognition consistently underperforms on African American English. The gap is widely acknowledged and thinly measured — without a benchmark that captures regional variation, 'we improved fairness' is an unfalsifiable claim.",
    process: [
      "Benchmarked fine-tuned and commercial ASR models against AAVE speech, quantifying accuracy gaps rather than asserting them.",
      "Documented error patterns and regional variation so failures could be attributed to specific linguistic features.",
      "Developed an interactive map visualising AAVE dialect clusters and each sample's role in the research.",
      "Ran affective computing, sentiment analysis, word clustering, and dialect-aware analysis over a large African American English dataset using Hugging Face Transformers.",
    ],
    outcomes: [
      "A measurable, regionally-aware benchmark for AAVE ASR performance.",
      "Interactive dialect-cluster map connecting each sample to its research role.",
      "Analysis feeding an ACII 2026 submission on inclusive affective AI systems.",
    ],
    metrics: [
      { n: "3", l: "Funders: AFRL, ONR, Google" },
      { n: "ACII&nbsp;2026", l: "Target venue" },
    ],
    tags: ["Hugging Face", "PyTorch", "Affective computing", "Sociolinguistics", "Data viz", "Fairness"],
    keywords: [
      "responsible ai", "ai ethics", "fairness", "bias", "speech", "asr", "nlp", "machine learning",
      "research scientist", "data visualization", "sociolinguistics", "affective computing",
      "sentiment analysis", "clustering", "hugging face", "pytorch", "inclusive design", "accessibility",
      "dei", "evaluation", "benchmarking",
    ],
    links: [],
  },
  {
    id: "bilstm-autonomy",
    title: "BiLSTM classification for tactical autonomy",
    org: "Research Institute for Tactical Autonomy (RITA UARC)",
    year: "2026",
    category: "research",
    featured: true,
    badge: "Lab-to-field study",
    image: null,
    glyph: "chip",
    kicker: "Deep learning · Evaluation",
    summary:
      "A BiLSTM classification system evaluated across three benchmark datasets, with five controlled experiments mapping how far lab performance actually travels into the real world.",
    outcome: "Characterised the lab-vs-real-world tradeoff instead of reporting a single benchmark number.",
    problem:
      "Sequence classifiers routinely post strong benchmark numbers and then degrade in deployment. The useful question is not 'what is the accuracy' but 'which training choices survive the move out of the lab'.",
    process: [
      "Designed a BiLSTM-based classification architecture and evaluated it across three benchmark datasets.",
      "Ran five controlled training experiments — fine-tuning, self-distillation, and augmentation — as a factorial study rather than a leaderboard chase.",
      "Applied post-training quantization to compress the model and measured what accuracy that actually costs.",
      "Reported the lab-to-real-world delta as a first-class result.",
    ],
    outcomes: [
      "Three benchmark datasets, five controlled experiments, one comparable evaluation frame.",
      "Quantified accuracy cost of post-training quantization.",
      "Evidence base for which augmentation and distillation strategies generalise.",
    ],
    metrics: [
      { n: "3", l: "Benchmark datasets" },
      { n: "5", l: "Controlled experiments" },
    ],
    tags: ["BiLSTM", "PyTorch", "Self-distillation", "Quantization", "Augmentation"],
    keywords: [
      "machine learning", "deep learning", "research scientist", "pytorch", "lstm", "rnn",
      "sequence model", "classification", "evaluation", "quantization", "distillation",
      "autonomy", "defense", "aerospace", "model compression", "experiment design", "ai engineer",
    ],
    links: [],
  },
  {
    id: "deepfake-audio",
    title: "Deepfake audio detector",
    org: "Open source",
    year: "2026",
    category: "research",
    featured: false,
    badge: null,
    image: null,
    glyph: "shield",
    kicker: "Audio ML · Open source",
    summary:
      "A BiLSTM spoof-detection pipeline that separates genuine human speech from AI-generated audio, built on the ASVspoof2019 Logical Access benchmark.",
    outcome: "End-to-end pipeline reporting accuracy, sensitivity, specificity, F1, ROC-AUC, and EER.",
    problem:
      "Synthesised speech is now good enough to pass casual listening. Detection needs to be measurable — and reported with the metrics the anti-spoofing field actually uses, not just accuracy.",
    process: [
      "Extract 40 MFCC features plus delta and delta-delta (120 dims) with per-utterance CMVN.",
      "Stack frames ×4 — (400, 120) → (100, 480) — for roughly 4× faster CPU training without losing temporal structure.",
      "Two-layer bidirectional LSTM at 128 hidden units per direction, attention pooling, dropout 0.3.",
      "Class-weighted cross-entropy to handle the roughly 1:9 bonafide-to-spoof imbalance in the training split.",
      "Evaluate with accuracy, sensitivity, specificity, F1, ROC-AUC, and Equal Error Rate.",
    ],
    outcomes: [
      "Reproducible feature-extraction and training pipeline over ASVspoof2019 LA.",
      "Packed-parquet dataset path for fast CPU-only training.",
      "Full anti-spoofing metric suite, including EER.",
    ],
    metrics: [
      { n: "120", l: "Feature dims (MFCC + Δ + ΔΔ)" },
      { n: "4×", l: "Training speedup from frame stacking" },
      { n: "EER", l: "Reported alongside AUC and F1" },
    ],
    tags: ["PyTorch", "BiLSTM", "MFCC/LFCC", "ASVspoof2019", "Attention pooling"],
    keywords: [
      "machine learning", "audio", "speech", "deep learning", "pytorch", "security", "anti-spoofing",
      "deepfake", "detection", "signal processing", "mfcc", "classification", "ai safety", "trust and safety",
    ],
    links: [{ label: "Repository", href: "https://github.com/ThemaGreen/deepfake-audio-detector" }],
  },
  {
    id: "hmtc",
    title: "Human–Machine Teaming Competence Assessment",
    org: "Independent research",
    year: "2026",
    category: "research",
    featured: true,
    badge: "28-page technical paper",
    image: null,
    glyph: "people",
    kicker: "Human factors · Assessment design",
    summary:
      "A standardised, individual-level measure of behavioural readiness for AI-mediated work — turning 'meaningful human oversight' from a compliance phrase into something you can actually score.",
    outcome: "A 30-minute situational judgment test aligned to EU AI Act Article 14 and the NIST AI RMF.",
    problem:
      "Most organisations in aviation, healthcare, cybersecurity, and defense are not moving to full autonomy — they are adopting human–machine teaming, where AI does the work and people keep oversight, veto power, and final approval. Navigating an AI-augmented system is its own expertise, and nobody was measuring it. The December 2025 Amazon Kiro incident — an agent deleting and recreating a live environment, 13 hours of outage, millions lost — was explained as misconfigured access control. The deeper failure was that no one was accountable, trained, and equipped to supervise the agent and intervene in time.",
    process: [
      "Framed the target capability against a historical benchmark: Stanislav Petrov's 1983 decision to question an automated missile alert and apply contextual judgment.",
      "Built a situational judgment test (SJT) format with realistic scenarios drawn from operational, customer-facing, engineering, and governance contexts.",
      "Scored performance across five core competencies: calibrated trust, critical inquiry, accountability, sociotechnical systems thinking, and teaming.",
      "Aligned the instrument with EU AI Act Article 14 and the NIST AI Risk Management Framework so results are defensible to regulators.",
      "Designed for a standardised 30-minute administration usable in HR screening, role assignment, workforce readiness checks, and post-training evaluation.",
    ],
    outcomes: [
      "Five-competency scoring model for human oversight of AI systems.",
      "Regulator-aligned evidence for 'meaningful human oversight' claims.",
      "28-page technical paper released for open feedback from researchers, industry, and academia.",
    ],
    metrics: [
      { n: "5", l: "Core competencies scored" },
      { n: "30 min", l: "Standardised administration" },
      { n: "28", l: "Pages of technical documentation" },
    ],
    tags: ["Human factors", "Psychometrics", "AI governance", "EU AI Act", "NIST AI RMF", "SJT"],
    keywords: [
      "human factors", "human ai teaming", "ai governance", "ai policy", "ai safety", "risk",
      "psychometrics", "assessment", "compliance", "eu ai act", "nist", "oversight", "aviation",
      "healthcare", "cybersecurity", "defense", "trust", "automation", "safety engineering",
      "systems engineering", "sociotechnical",
    ],
    links: [],
  },
  {
    id: "ai-systems-lab",
    title: "AI Systems Lab",
    org: "Independent · Free learning resource",
    year: "2026",
    category: "product",
    featured: false,
    badge: null,
    image: null,
    glyph: "sparkle",
    kicker: "Education · Product",
    summary:
      "A free, interactive resource where kids, parents, and learners at any level build a simple AI system step by step — then chat with the tiny model they designed.",
    outcome: "A concrete starting point for understanding ML, rather than another AI productivity app.",
    problem:
      "In June 2025 I asked myself: what if I made an app for my AI to use? Projecting that forward — an app for AI agents at scale means enormous compute, energy, and real-world cost. I decided not every idea is a good idea, and set a standard: build with intention, and think critically about downstream impact before building at all. So instead of another AI productivity app, I built something that teaches.",
    process: [
      "Drew on Harvard CS249 open-source materials as a curriculum backbone.",
      "Split the experience into four levels — K-5, 6-12, college, and postgraduate — so the same system scales across audiences.",
      "Made learners build a simple AI system step by step, then chat with the tiny model they effectively designed.",
      "Added scenario-based levels and a completion certificate to give the learning a shape and an endpoint.",
    ],
    outcomes: [
      "Four audience tiers from K-5 through postgraduate.",
      "Hands-on build-then-converse loop instead of passive explanation.",
      "Free and open, with no data extraction as the price of entry.",
    ],
    metrics: [{ n: "4", l: "Learner levels, K-5 to postgrad" }],
    tags: ["Learning design", "Interactive", "ML literacy", "Accessibility"],
    keywords: [
      "education", "edtech", "learning design", "ai literacy", "product design", "ux",
      "instructional design", "outreach", "curriculum", "accessibility", "public engagement",
    ],
    links: [],
  },
  {
    id: "ai-footprint",
    title: "AI footprint tracker",
    org: "Independent · Prototype",
    year: "2025",
    category: "concept",
    featured: false,
    badge: null,
    image: null,
    glyph: "leaf",
    kicker: "Sustainability · Prototype",
    summary:
      "A browser extension prototype that surfaces the environmental and compute cost of everyday AI usage, backed by a queryable research database.",
    outcome: "Made the invisible cost of a prompt visible at the point of use.",
    problem:
      "People use AI dozens of times a day with no feedback about energy or compute cost. Without that signal, there is no way to make an informed choice about when a model is worth invoking.",
    process: [
      "Prototyped a browser extension surfacing environmental and compute cost alongside AI usage.",
      "Built a companion database site the extension could query for up-to-date research on AI's environmental and societal impacts.",
      "Used the project as the test case for a personal build standard: intention first, downstream impact assessed before shipping.",
    ],
    outcomes: [
      "Working prototype connecting live usage to research-backed cost estimates.",
      "The reasoning that produced the AI Systems Lab decision — a deliberate choice not to scale a bad idea.",
    ],
    metrics: [],
    tags: ["Browser extension", "Sustainability", "Research database", "Digital wellbeing"],
    keywords: [
      "sustainability", "climate", "browser extension", "javascript", "prototype",
      "digital wellbeing", "ethics", "environment", "product",
    ],
    links: [],
  },
  {
    id: "ciore",
    title: "Cioré — privacy-first, solar-powered phones",
    org: "Cioré · Project Manager",
    year: "2025 — Present",
    category: "product",
    featured: false,
    badge: "Leadership",
    image: null,
    glyph: "phone",
    kicker: "Program leadership",
    summary:
      "Operational leadership for a team building modular, solar-powered smartphones designed so users are empowered with privacy, transparency, and control rather than extorted for data.",
    outcome: "Systems, workflows, and communication structures that let teams move fast without losing integrity.",
    problem:
      "A hardware-plus-software venture with a strong ethical position and the usual startup problem: ideas outpacing execution, with no shared structure to convert vision into shipped work.",
    process: [
      "Set direction and long-term strategy across cross-functional teams.",
      "Translated ideas into clear plans, focused sprints, and measurable outcomes.",
      "Removed blockers and maintained momentum through a pivotal growth stage.",
      "Held the line on Cioré's ethics, privacy, and environmental standards under delivery pressure.",
      "Shipped the static marketing and community site (HTML, CSS, vanilla JS) with waitlist and contribution flows.",
    ],
    outcomes: [
      "Repeatable sprint and communication structure across teams.",
      "Public site serving as landing page, information hub, and contribution portal.",
    ],
    metrics: [],
    tags: ["Program management", "Sustainable hardware", "Privacy by design", "Frontend"],
    keywords: [
      "project management", "program manager", "product manager", "leadership", "strategy",
      "operations", "startup", "sustainability", "privacy", "hardware", "frontend", "roadmap", "agile",
    ],
    links: [{ label: "Repository", href: "https://github.com/ThemaGreen/Ciore" }],
  },
  {
    id: "titanic",
    title: "Titanic disaster — human factors analysis",
    org: "George Mason University",
    year: "2024",
    category: "academic",
    featured: false,
    badge: null,
    image: "TitanicIncidentAnalysis.png",
    glyph: "search",
    kicker: "Incident investigation",
    summary:
      "A human factors reconstruction of the crew decisions, communication gaps, and organisational failures that shaped the disaster — and what the same analysis would catch today.",
    outcome: "Modelled a 40% reduction in error pathways under the proposed countermeasures.",
    problem:
      "The Titanic is usually told as a story of ice and hubris. Read as a systems failure, it is a chain of latent organisational conditions — funding decisions, communication protocol, leadership oversight — that lined up.",
    process: [
      "Applied the Swiss Cheese model to separate latent organisational conditions from active crew errors.",
      "Reconstructed the cross-team communication chain, including the equipment and staffing decisions that shaped it.",
      "Mapped root causes back to funding and leadership oversight rather than stopping at individual blame.",
      "Proposed countermeasures at each layer and modelled their effect on error pathways.",
    ],
    outcomes: [
      "Layer-by-layer failure model rather than a single-cause narrative.",
      "Modelled 40% reduction in viable error pathways with layered countermeasures.",
    ],
    metrics: [
      { n: "40%", l: "Modelled reduction in error pathways" },
    ],
    tags: ["Swiss Cheese model", "Root cause analysis", "Systems thinking", "Safety"],
    keywords: [
      "human factors", "safety", "incident investigation", "root cause", "accident analysis",
      "aviation", "systems thinking", "risk", "reliability", "swiss cheese", "ergonomics", "safety engineering",
    ],
    links: [{ label: "Analysis deck (PDF)", href: "Incident Investigation & Analysis - Thema's Team.pptx (1).pdf" }],
  },
  {
    id: "gmu-library",
    title: "GMU library website redesign",
    org: "George Mason University",
    year: "2024",
    category: "academic",
    featured: false,
    badge: null,
    image: "Library Site Redesign.png",
    glyph: "book",
    kicker: "UX research",
    summary:
      "A research-led redesign of a large university library site, driven by usability testing, heuristic review, and competitor analysis of how students actually look for things.",
    outcome: "35% higher task success in prototype testing.",
    problem:
      "Students were bouncing off the library site and going to Google instead. The information architecture reflected how the library is organised internally, not how students search.",
    process: [
      "Ran usability testing sessions against the live site to find where task flows broke.",
      "Conducted heuristic evaluation to catalogue violations systematically.",
      "Scanned competitor and peer-institution library sites for patterns that already work.",
      "Restructured the IA around student workflows and prototyped the result.",
    ],
    outcomes: [
      "35% higher task success rate in prototype testing.",
      "IA restructured around student search behaviour rather than internal org chart.",
    ],
    metrics: [{ n: "35%", l: "Higher task success in prototype tests" }],
    tags: ["Usability testing", "Heuristic evaluation", "Information architecture", "Prototyping"],
    keywords: [
      "ux research", "usability", "user research", "heuristic evaluation", "information architecture",
      "web design", "prototyping", "ux designer", "product design", "accessibility", "user testing",
    ],
    links: [{ label: "Case deck (PDF)", href: "Website Redesign - Group Project (Thema).pptx (1).pdf" }],
  },
  {
    id: "bigbelly",
    title: "Bigbelly waste management partnership",
    org: "George Mason University · Industry partner",
    year: "2023",
    category: "academic",
    featured: false,
    badge: null,
    image: "BigbellySolar.jpg",
    glyph: "recycle",
    kicker: "Field research",
    summary:
      "Field research with a campus waste partner, mapping real collection routes and touchpoints to recommend workflow changes the team actually adopted.",
    outcome: "Estimated 25% time savings on key collection routes.",
    problem:
      "Collection crews were working a route plan that did not match how bins actually filled. The fragmentation was visible in the field and invisible in the planning documents.",
    process: [
      "Shadowed collection routes to build an accurate task analysis from observed work, not described work.",
      "Ran stakeholder analysis across operations, facilities, and the vendor.",
      "Mapped touchpoints and identified where the planned workflow and the real one diverged.",
      "Recommended route and process changes grounded in the observed data.",
    ],
    outcomes: [
      "Estimated 25% time savings on key routes.",
      "Recommendations adopted by the partner team.",
    ],
    metrics: [{ n: "25%", l: "Estimated time savings on key routes" }],
    tags: ["Task analysis", "Stakeholder analysis", "HSI", "Field study"],
    keywords: [
      "human factors", "task analysis", "field research", "ethnography", "operations",
      "human systems integration", "process improvement", "sustainability", "contextual inquiry",
    ],
    links: [{ label: "Presentation (video)", href: "PSYC-461 BigBelly Clean Presentation Deck  (1).mp4" }],
  },
  {
    id: "umass-sim",
    title: "UMass Amherst human performance lab",
    org: "University of Massachusetts Amherst",
    year: "2022",
    category: "academic",
    featured: false,
    badge: null,
    image: "BikeSim.png",
    glyph: "vr",
    kicker: "Simulation · Behavioural data",
    summary:
      "Unity 3D bicycle simulator work supporting Department of Transportation safety studies, presented at a human performance symposium.",
    outcome: "60% lift in participant engagement during study sessions.",
    problem:
      "Road safety training that participants tune out produces behavioural data about tuning out, not about road safety.",
    process: [
      "Built and updated VR scenarios in Unity 3D for the bicycle simulator rig.",
      "Designed interface and scenario elements to hold attention through a full session.",
      "Supported DOT-funded safety study data collection.",
      "Presented findings at a human performance symposium.",
    ],
    outcomes: [
      "60% lift in engagement during study sessions.",
      "Simulator scenarios used in DOT safety research.",
    ],
    metrics: [{ n: "60%", l: "Lift in session engagement" }],
    tags: ["Unity 3D", "VR", "Behavioural data", "Transportation safety"],
    keywords: [
      "vr", "simulation", "unity", "human factors", "transportation", "safety", "behavioral research",
      "experiment", "hci", "game development", "3d", "research assistant",
    ],
    links: [{ label: "Project write-up", href: "https://themas-9dz0anv.gamma.site/" }],
  },
  {
    id: "yal",
    title: "YourAnimeList — AI discovery & community",
    org: "Independent",
    year: "2025",
    category: "product",
    featured: false,
    badge: null,
    image: null,
    glyph: "layers",
    kicker: "AI product · IA",
    summary:
      "MyAnimeList and AniList still run early-2000s information architecture. This is a rebuild with modern IA, transparent recommendations, and a multi-layer AI system underneath.",
    outcome: "A modern discovery tool that measurably reduced cognitive load versus the incumbents.",
    problem:
      "The two largest anime catalogue platforms require excessive cognitive load to navigate, their recommendation logic is opaque, and they lack modern personalisation, intelligent search, and social mechanics. Survey participants called them 'dated', 'clunky', and 'confusing'.",
    process: [
      "Ran a competitive audit of MyAnimeList and AniList against modern discovery patterns.",
      "Ran a qualitative survey to identify user personas and the specific friction points behind the complaints.",
      "Rebuilt the core information architecture in Canva, Figma, and Miro, with scalable interaction models for filtering, navigation, and social engagement.",
      "Engineered a multi-layer AI system: a custom ML model, an automated chatbot, and LLM API integration.",
    ],
    outcomes: [
      "Modern, intuitive AI discovery tool with a social layer.",
      "Significant reduction in cognitive load versus the incumbent platforms.",
    ],
    metrics: [],
    tags: ["Information architecture", "ML", "LLM integration", "Figma", "Personas"],
    keywords: [
      "product design", "ux", "information architecture", "recommendation system", "machine learning",
      "llm", "chatbot", "ai product", "figma", "personas", "competitive analysis", "survey research",
      "frontend", "social",
    ],
    links: [{ label: "Live prototype", href: "https://your-anime-list-mogbohxv.taskade.app/" }],
  },
  {
    id: "focus",
    title: "The Focus ecosystem",
    org: "Independent",
    year: "2024 — 2025",
    category: "concept",
    featured: false,
    badge: null,
    image: null,
    glyph: "shield",
    kicker: "Digital wellbeing",
    summary:
      "A system-level concept linking daily post limits, browser-level interventions, and honest feedback into one digital wellness platform — plus the mobile app that controls it.",
    outcome: "A cohesive cross-product model for attention rather than another single-app fix.",
    problem:
      "Digital wellbeing tools fail because they operate at one layer. A screen-time counter does not change a feed designed to defeat it.",
    process: [
      "Mapped the ecosystem across browser extension, mobile companion, and social layer.",
      "Designed the Focus Guardian companion app: focus sessions, session summaries, and tunable digital nudges.",
      "Designed a minimalist social concept with a limited posting model to calm feeds rather than amplify them.",
      "Prototyped at high fidelity and tested against scenario-based tasks.",
    ],
    outcomes: [
      "70% focus gain in scenario-based testing of the Guardian flow.",
      "Coherent cross-product model spanning browser, phone, and social layer.",
    ],
    metrics: [{ n: "70%", l: "Focus gain in scenario testing" }],
    tags: ["Ecosystem design", "Digital wellbeing", "Hi-fi prototyping", "Design systems"],
    keywords: [
      "product design", "ux design", "digital wellbeing", "mobile", "prototyping", "design systems",
      "behavioral design", "strategy", "concept", "interaction design",
    ],
    links: [{ label: "Repository", href: "https://github.com/ThemaGreen/Focus" }],
  },
  {
    id: "mason-commutes",
    title: "Mason Commutes",
    org: "George Mason University",
    year: "2024",
    category: "concept",
    featured: false,
    badge: null,
    image: null,
    glyph: "bus",
    kicker: "Mobile UX",
    summary:
      "A native mobile concept connecting GMU commuter students by route, schedule, and interest — because commuters are the most socially isolated group on a commuter campus.",
    outcome: "Modelled a 50% increase in peer connections among commuting students.",
    problem:
      "Commuter students at GMU arrive, attend, and leave. The campus social infrastructure assumes residence, so the largest student population is the least connected.",
    process: [
      "Built personas from commuter student research.",
      "Mapped the commuter journey end to end to find where connection was possible and currently absent.",
      "Ran a competitive review of ride-share and campus social apps.",
      "Designed matching around routes, schedules, and shared interests rather than proximity alone.",
    ],
    outcomes: ["Modelled 50% increase in peer connections."],
    metrics: [{ n: "50%", l: "Modelled increase in peer connections" }],
    tags: ["Personas", "Journey mapping", "Mobile UX", "Competitive review"],
    keywords: [
      "ux design", "mobile", "personas", "journey mapping", "user research",
      "product design", "community", "transportation", "app design",
    ],
    links: [],
  },
  {
    id: "auraflex",
    title: "AuraFlex wearable ecosystem",
    org: "Independent",
    year: "2024",
    category: "concept",
    featured: false,
    badge: null,
    image: null,
    glyph: "watch",
    kicker: "Wearables · Inclusive design",
    summary:
      "A smartwatch and companion concept layering posture alerts, calm modes, and wardrobe planning into one daily rhythm — with voice-first control and accessibility as requirements, not afterthoughts.",
    outcome: "An accessible product-line concept where inclusive design is structural.",
    problem:
      "Consumer wearables treat accessibility as a settings menu bolted on at the end. Voice-first control designed in from the start changes what the hardware needs to be.",
    process: [
      "Mapped the cross-device journey between watch, phone, and ambient context.",
      "Applied inclusive design principles as constraints on the hardware concept, not the UI layer.",
      "Designed voice-first interaction as the primary path rather than the fallback.",
      "Explored AR concepts for the wardrobe planning layer.",
    ],
    outcomes: [
      "Holistic cross-device experience concept.",
      "Accessible product line where voice-first is the primary interaction model.",
    ],
    metrics: [],
    tags: ["Wearables", "Cross-device", "Voice UI", "Inclusive design", "AR concept"],
    keywords: [
      "wearables", "industrial design", "accessibility", "inclusive design", "voice ui",
      "cross device", "ar", "product design", "ux", "hardware",
    ],
    links: [],
  },
  {
    id: "design-thinking",
    title: "Design thinking studio work",
    org: "George Mason University · Design Thinking minor",
    year: "2024",
    category: "academic",
    featured: false,
    badge: null,
    image: null,
    glyph: "puzzle",
    kicker: "Design methods",
    summary:
      "A run of short sprints and a field study: empathy maps, point-of-view statements, How Might We framing, contextual inquiry, rapid prototyping, and a Shark Tank-format innovation pitch.",
    outcome: "Fluent, repeatable use of the core design-thinking method set.",
    problem:
      "Design methods are easy to name and hard to run well. The gap only closes with reps against real constraints.",
    process: [
      "Ran contextual inquiry and observation sessions to surface unmet needs in a real environment.",
      "Practised empathy mapping, POV statements, and How Might We framing across successive sprints.",
      "Ran rapid prototyping cycles with tight feedback loops.",
      "Built a lean canvas, validated it against market checks, and pitched it in a Shark Tank format.",
    ],
    outcomes: [
      "Actionable insight themes from ethnographic fieldwork.",
      "Validated, well-told concept story from lean canvas through pitch.",
    ],
    metrics: [],
    tags: ["Contextual inquiry", "Ethnography", "Lean canvas", "Rapid prototyping"],
    keywords: [
      "design thinking", "ethnography", "contextual inquiry", "workshop facilitation",
      "prototyping", "innovation", "business", "service design", "ux research", "empathy map",
    ],
    links: [],
  },
  {
    id: "pltw",
    title: "PLTW engineering pathway",
    org: "St. Charles High School",
    year: "2017 — 2021",
    category: "academic",
    featured: false,
    badge: null,
    image: null,
    glyph: "gear",
    kicker: "Foundations",
    summary:
      "Four years of Project Lead The Way engineering — CAD, digital electronics, civil and architectural engineering, and a capstone — that became the technical base under everything since.",
    outcome: "A working engineering foundation carried into human factors and systems work.",
    problem:
      "Human factors without engineering literacy produces recommendations engineers cannot act on.",
    process: [
      "Intro to Engineering Design and Principles of Engineering: CAD, prototyping, 3D modelling, iterative design.",
      "Civil Engineering and Architecture: structural and spatial reasoning.",
      "Digital Electronics: logic and circuits.",
      "Computer Science in Python, Java, and C++.",
      "Engineering capstone and senior project.",
    ],
    outcomes: [
      "CAD, prototyping, and applied physics fluency.",
      "Programming foundation in Python, Java, and C++.",
    ],
    metrics: [],
    tags: ["CAD", "Prototyping", "Digital electronics", "Python/Java/C++"],
    keywords: ["engineering", "cad", "prototyping", "electronics", "programming", "stem", "foundations"],
    links: [],
  },
];

/* ---------------------------------------------------------------------------
   SKILLS — grouped, with self-assessed depth used by the animated meters.
   ------------------------------------------------------------------------ */
export const SKILLS = [
  {
    icon: "brain",
    title: "Human factors & cognitive engineering",
    blurb:
      "Attention, memory, and decision making under load; error and ergonomics analysis; mental models across cultures and ages; incident investigation.",
    meters: [
      { l: "Human factors analysis", v: 95 },
      { l: "Incident investigation", v: 88 },
      { l: "Cognitive psychology", v: 92 },
    ],
    keywords: [
      "human factors", "ergonomics", "cognitive psychology", "hci", "safety", "incident investigation",
      "attention", "workload", "mental models", "human systems integration", "engineering psychology",
    ],
  },
  {
    icon: "flask",
    title: "Research methods & statistics",
    blurb:
      "Controlled studies, IRB protocol, psychometrics and assessment design, SPSS and regression, mixed methods, survey design, data ethics and reproducibility.",
    meters: [
      { l: "Experimental design", v: 92 },
      { l: "Mixed-methods research", v: 90 },
      { l: "Psychometrics", v: 82 },
    ],
    keywords: [
      "research", "statistics", "experimental design", "survey", "irb", "psychometrics",
      "spss", "regression", "qualitative", "quantitative", "mixed methods", "user research", "evaluation",
    ],
  },
  {
    icon: "chip",
    title: "Machine learning & MLOps",
    blurb:
      "PyTorch and Hugging Face Transformers; speech models including fine-tuned Whisper; quantization and distillation; FastAPI services on Cloud Run with Cloud SQL, Docker, and GCS.",
    meters: [
      { l: "PyTorch / Transformers", v: 85 },
      { l: "Deployment & MLOps", v: 82 },
      { l: "Model evaluation", v: 88 },
    ],
    keywords: [
      "machine learning", "ml", "pytorch", "hugging face", "transformers", "whisper", "asr", "speech",
      "mlops", "fastapi", "docker", "google cloud", "cloud run", "postgresql", "python",
      "quantization", "distillation", "ai engineer", "backend", "api", "deployment",
    ],
  },
  {
    icon: "compass",
    title: "Systems engineering",
    blurb:
      "Requirements, architecture, verification and validation, and human systems integration for autonomous systems in aerospace and aviation — the current focus of my M.S. at ERAU.",
    meters: [
      { l: "Systems thinking", v: 90 },
      { l: "Requirements & V&V", v: 76 },
      { l: "Autonomy in aerospace", v: 74 },
    ],
    keywords: [
      "systems engineering", "requirements", "verification", "validation", "architecture",
      "aerospace", "aviation", "autonomy", "mbse", "safety engineering", "defense", "nasa",
      "mission design", "proposal writing",
    ],
  },
  {
    icon: "search",
    title: "UX research & design",
    blurb:
      "Usability testing, heuristic evaluation, interviews, personas, journey maps, information architecture, wireframes, high-fidelity prototypes, and design systems.",
    meters: [
      { l: "Usability & heuristics", v: 93 },
      { l: "Prototyping (Figma)", v: 88 },
      { l: "Information architecture", v: 85 },
    ],
    keywords: [
      "ux", "ux research", "ux design", "usability", "heuristic evaluation", "figma", "prototyping",
      "personas", "journey map", "wireframe", "design system", "product design", "interaction design",
      "user interviews", "information architecture", "accessibility", "wcag",
    ],
  },
  {
    icon: "scale",
    title: "Responsible AI & governance",
    blurb:
      "AI risk and oversight frameworks including EU AI Act Article 14 and the NIST AI RMF; fairness benchmarking; human–AI teaming competence; ethical product review.",
    meters: [
      { l: "AI governance frameworks", v: 86 },
      { l: "Fairness evaluation", v: 84 },
      { l: "Human–AI teaming", v: 91 },
    ],
    keywords: [
      "responsible ai", "ai ethics", "ai governance", "ai policy", "ai safety", "fairness", "bias",
      "eu ai act", "nist", "risk management", "trust and safety", "alignment", "oversight",
      "human ai teaming", "sociotechnical",
    ],
  },
];

/* ---------------------------------------------------------------------------
   VALUES / APPROACH
   ------------------------------------------------------------------------ */
export const VALUES = [
  {
    n: "01",
    title: "Ask why until it stops being comfortable",
    body:
      "As a kid I always wanted to know the why — always asking questions and demanding clarity. That instinct has shaped every chapter since, and it is still the first tool I reach for.",
  },
  {
    n: "02",
    title: "Build with intention, or don't build",
    body:
      "Not every idea is a good idea. Before I build I ask what this costs downstream — in compute, in energy, in attention, in harm. If the answer is bad, the project does not happen.",
  },
  {
    n: "03",
    title: "Measure the claim you are making",
    body:
      "'We improved fairness' is unfalsifiable without a benchmark. 'Meaningful human oversight' is a compliance phrase until you can score it. I build the instrument that makes the claim testable.",
  },
  {
    n: "04",
    title: "Humans stay in the loop, and stay competent",
    body:
      "Most safety-critical domains are not moving to full autonomy — they are moving to human–machine teaming. That makes supervising an AI system its own expertise, and it needs to be trained and measured like one.",
  },
];

/* ---------------------------------------------------------------------------
   TESTIMONIALS
   ------------------------------------------------------------------------ */
export const TESTIMONIALS = [
  {
    name: "Keyshawn Kindall",
    role: "Designer · Colleague",
    quote: "She's definitely a generational talent. Especially in today's world.",
    href: "https://www.linkedin.com/in/keyshawnkindall",
  },
];

export const TESTIMONIAL_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSdb-l4rAOCUYQrzgGr0sVyIQ9nxt_HyEiHTHGqV5ieiymz8EA/viewform?embedded=true";
