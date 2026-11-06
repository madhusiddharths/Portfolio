/* =============================================================================
   Content registry — single source of truth.
   All copy is preserved verbatim from the original portfolio; this file only
   re-organizes it into a typed model that the Instrument UI renders.
   ========================================================================== */

export const PROFILE = {
  name: "Madhu Siddharth Suthagar",
  shortName: "Madhu Siddharth",
  monogram: "MS",
  role: "AI Engineer",
  location: "Chicago",
  timeZone: "America/Chicago",
  available: true,
  building: "Tool Router Ladder",
  tagline: "I develop scalable models that drive real-world impact.",
  bio: "I'm an AI engineer who cares less about demos and more about the moment a system has to work on its own. Right now that means teaching a video-QA model to run on an 18 GB laptop, lifting it from 54.7% to 73.5%. Before that, I distilled a 550B model's tool-calling into a 3B student to find exactly where small agents break, used LLMs to map 18,000 untapped sales sites from government compliance data, and published a federated intrusion-detection paper at IEEE. I enjoy taking a manual, multi-step process, turning it into an AI-driven workflow, and measuring honestly where it holds up and where it needs a human in the loop.",
  analystNote:
    "For analyst-focused roles, a tailored Data Analyst resume is available.",
  resume:
    "https://drive.google.com/file/d/1RmsD9kxvlN4g63eMuVDMCHdlZ86RkpAW/view?usp=sharing",
  analystResume:
    "https://drive.google.com/file/d/12E7OyHYDyCOqkQ4D6_WTWqCwESjePd_g/view?usp=sharing",
  email: "madhusiddharths1@outlook.com",
  github: "https://github.com/madhusiddharths",
  linkedin: "https://www.linkedin.com/in/madhu-siddharth-suthagar/",
  discord: "https://discord.com/users/1275184185610604637",
} as const;

/* ---- tech → icon map (files live in /public/img/color_images) ------------- */
const ICON = "/img/color_images";
export const TECH: Record<string, string> = {
  Python: `${ICON}/Python.png`,
  R: `${ICON}/R.png`,
  C: `${ICON}/C.png`,
  "C++": `${ICON}/cpp.png`,
  Java: `${ICON}/Java.png`,
  SQL: `${ICON}/MySQL.png`,
  PostgreSQL: `${ICON}/PostgresSQL.png`,
  HTML: `${ICON}/HTML5.png`,
  CSS: `${ICON}/CSS3.png`,
  JavaScript: `${ICON}/JavaScript.png`,
  TypeScript: `${ICON}/TypeScript.png`,
  Pandas: `${ICON}/Pandas.png`,
  NumPy: `${ICON}/NumPy.png`,
  Matplotlib: `${ICON}/Matplotlib.png`,
  Plotly: `${ICON}/Ploty.png`,
  PyTorch: `${ICON}/PyTorch.png`,
  TensorFlow: `${ICON}/TensorFlow.png`,
  Keras: `${ICON}/Keras.png`,
  "scikit-learn": `${ICON}/scikit-learn.png`,
  OpenCV: `${ICON}/OpenCV.png`,
  LangChain: `${ICON}/langchain.png`,
  LangGraph: `${ICON}/LangGraph.png`,
  MCP: `${ICON}/MCP-mono.png`,
  "Hugging Face": `${ICON}/HuggingFace.png`,
  vLLM: `${ICON}/vLLM.png`,
  "OpenAI API": `${ICON}/OpenAI-mono.png`,
  "Claude API": `${ICON}/Claude.png`,
  Claude: `${ICON}/Claude.png`,
  "Gemini API": `${ICON}/Gemini.png`,
  Ollama: `${ICON}/Ollama-mono.png`,
  "Weights & Biases": `${ICON}/WandB.png`,
  Jupyter: `${ICON}/Jupyter.png`,
  PyCharm: `${ICON}/PyCharm.png`,
  Docker: `${ICON}/Docker.png`,
  Kubernetes: `${ICON}/Kubernetes.png`,
  "Apache Airflow": `${ICON}/Apache Airflow.png`,
  "Apache Kafka": `${ICON}/Apache Kafka.png`,
  "Apache Spark": `${ICON}/Apache Spark.png`,
  GCP: `${ICON}/Google Cloud.png`,
  AWS: `${ICON}/AWS.png`,
  Snowflake: `${ICON}/snowflake-color.png`,
  Databricks: `${ICON}/azure-databricks.png`,
  Polars: `${ICON}/Polars.png`,
  dbt: `${ICON}/Dbt.png`,
  MongoDB: `${ICON}/MongoDB.png`,
  "Node.js": `${ICON}/Node.js.png`,
  FastAPI: `${ICON}/FastAPI.png`,
  Flask: `${ICON}/Flask.png`,
  Streamlit: `${ICON}/Streamlit.png`,
  "Three.js": `${ICON}/Three.js.png`,
  Tableau: `${ICON}/tableau.png`,
  "Power BI": `${ICON}/power-bi-embedded.png`,
  Kaggle: `${ICON}/Kaggle.png`,
  LaTeX: `${ICON}/LaTeX.png`,
};

/* Umbrella skills: a project counts toward one if it lists any member tool. */
export const SKILL_ALIASES: Record<string, string[]> = {
  "LLM APIs": ["Claude API", "OpenAI API", "Gemini API"],
};

/** Does project tech list `tech` use `skill` (directly or via an umbrella)? */
export function usesSkill(tech: string[], skill: string): boolean {
  return tech.includes(skill) || (SKILL_ALIASES[skill] ?? []).some((t) => tech.includes(t));
}

/** The /work index filtered to one skill. */
export function skillHref(skill: string) {
  return `/work/?skill=${encodeURIComponent(skill)}`;
}

export function techIcon(name: string): string | null {
  const p = TECH[name];
  return p ? p.replace(/ /g, "%20") : null;
}

export type Project = {
  slug: string;
  index: string; // zero-padded ledger index
  name: string;
  domain: string; // short categorical line shown in the index
  summary: string; // verbatim card description
  tech: string[];
  thumb: string;
  repo: string | null;
  paper?: string;
  live?: string; // live/demo URL — renders a launch(...) call on the case study; a site path means "deploying"
  liveKind?: "app" | "model" | "demo" | "dashboard"; // what the live link opens (default "app")
  results?: { value: string; label: string }[]; // 3–4 headline numbers shown under the report title
  privateRepo?: boolean;
  hasCaseStudy: boolean; // false → routes to /work/coming-soon
  featured?: boolean;
};

const IMG = "/img/project_img";

export const PROJECTS: Project[] = [
  {
    slug: "tool-router-ladder",
    index: "01",
    name: "Tool Router Ladder",
    domain: "LLM post-training · Agent evaluation",
    summary:
      "How small can a tool router go? A research build that distils a 550B teacher's tool-calling into Qwen2.5 0.5B–3B LoRA students on τ²-bench retail, then measures where multi-step agent reliability breaks — across 16/40/80-tool catalogs, SFT vs DPO vs GRPO, and a log-prob confidence router that escalates hard steps back to the teacher.",
    tech: ["PyTorch", "Hugging Face", "vLLM", "LangGraph", "LangChain", "OpenAI API", "OpenRouter", "Weights & Biases", "Docker", "Python", "LLM Fine-tuning", "Agentic AI"],
    thumb: `${IMG}/tool_router.png`,
    repo: "https://github.com/madhusiddharths/the_llm_project",
    results: [
      { value: "73% → 7.7%", label: "step agreement vs task success, 1.5B student" },
      { value: "48%", label: "task success of the 550B teacher" },
      { value: "0.797", label: "AUROC of the confidence router" },
      { value: "GRPO > DPO", label: "step-level GRPO improved every catalog" },
    ],
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "pulsetrade",
    index: "02",
    name: "PulseTrade",
    domain: "Real-time streaming · Agentic AI",
    summary:
      "Real-time financial intelligence platform that streams market data through Kafka and Delta Lake, then uses an agentic AI investigator to explain anomalies in plain language.",
    tech: ["Apache Kafka", "Apache Airflow", "Databricks", "Kubernetes", "FastAPI", "PostgreSQL", "Python", "LangGraph", "MCP", "Gemini API", "Hugging Face", "Agentic AI"],
    thumb: `${IMG}/pulsetrade.png`,
    repo: "https://github.com/madhusiddharths/pulsetrade",
    live: "/work/coming-soon/?p=pulsetrade&s=live",
    liveKind: "app",
    results: [
      { value: "7", label: "layers, from ingestion to observability" },
      { value: "87%", label: "of headlines filtered before they reach Kafka" },
      { value: "5 min", label: "feature windows feeding the anomaly detector" },
      { value: "4-node", label: "LangGraph agent that writes each brief" },
    ],
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "ai-counselling",
    index: "03",
    name: "AI-counselling",
    domain: "Multimodal AI · Wellbeing",
    summary:
      "A counselling assistant that grounds its replies in the DSM-5 through retrieval, reads tone of voice and facial emotion alongside the words, and keeps long-term memory, with a safety-routing layer in front of the model.",
    tech: ["FastAPI", "GCP", "MongoDB", "TypeScript", "Docker", "Node.js", "Python", "Gemini API", "Hugging Face"],
    thumb: `${IMG}/ai_chatbot.png`,
    repo: "https://github.com/madhusiddharths/aicounselling",
    live: "/work/coming-soon/?p=ai-counselling&s=live",
    liveKind: "app",
    results: [
      { value: "6", label: "AI/ML systems behind one conversation" },
      { value: "~2.5 GB", label: "backend image, down from ~6–8 GB" },
      { value: "on-device", label: "facial-emotion inference in the browser" },
      { value: "DSM-5", label: "retrieval grounding every reply" },
    ],
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "alzheimers",
    index: "04",
    name: "Alzheimer's Progression",
    domain: "Medical imaging · GANs",
    summary:
      "Stages an Alzheimer's MRI slice with a fine-tuned EfficientNetB4 (~98% accuracy), then chains three stage-transition DCGANs to synthesize how that brain is likely to look as the disease advances.",
    tech: ["PyTorch", "Pandas", "Matplotlib", "OpenCV", "Docker", "MLflow", "Flask", "Python"],
    thumb: `${IMG}/alzheimers.jpg`,
    repo: "https://github.com/madhusiddharths/alzheimers_progression",
    live: "https://alzheimers-classifier-v1.onrender.com",
    liveKind: "model",
    results: [
      { value: "98%", label: "staging accuracy on 2,048 held-out scans" },
      { value: "0.98", label: "macro-F1 across all four stages" },
      { value: "~23%", label: "lower FID with region-of-interest guidance" },
      { value: "86,437", label: "labelled MRI slices" },
    ],
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "galaxy",
    index: "05",
    name: "Galaxy Explorer",
    domain: "3D visualization · 557M+ stars",
    summary:
      "A cloud-native 3D visualization platform that dynamically queries and renders 557M+ Gaia DR3 stars with real-time kinematic projection using serverless BigQuery and GPU acceleration.",
    tech: ["Polars", "Apache Spark", "FastAPI", "Three.js", "GCP", "Docker", "Python", "JavaScript"],
    thumb: `${IMG}/stars.jpg`,
    repo: "https://github.com/madhusiddharths/galaxy_explorer",
    live: "https://galaxy-explorer-1061483926543.us-central1.run.app",
    liveKind: "app",
    results: [
      { value: "1.8B → 557M", label: "raw sources to validated, served stars" },
      { value: "750+ GB", label: "raw catalogue reduced to 13 columns" },
      { value: "60 FPS", label: "3D flythrough in the browser" },
      { value: "~77 GB", label: "full scan per query, replaced by pruned reads" },
    ],
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "growth-retention",
    index: "06",
    name: "Growth & Retention",
    domain: "Experimentation · 20M+ events",
    summary:
      "An end-to-end data pipeline and machine learning system that processes 20M+ e-commerce events to validate A/B tests and predict cart abandonment in real-time.",
    tech: ["Python", "dbt", "FastAPI", "Streamlit", "Docker", "SQL"],
    thumb: `${IMG}/growth_retention.png`,
    repo: "https://github.com/madhusiddharths/growth_retention",
    live: "https://gr-frontend-ds4v3uzpta-uc.a.run.app",
    liveKind: "demo",
    results: [
      { value: "6.73% → 10.83%", label: "conversion in the simulated A/B test (p < 0.001)" },
      { value: "0.80", label: "ROC-AUC, cart-abandonment model" },
      { value: "20M+", label: "raw events (4.6 GB) through the pipeline" },
    ],
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "crypto-tweet-impact",
    index: "07",
    name: "Crypto Tweet Impact",
    domain: "Event study · NLP",
    summary:
      "A statistically rigorous data-science pipeline and event study that evaluates the market impact of ~20,000 LLM-classified tweets on Bitcoin and Dogecoin prices using multiple-testing corrections and an interactive Shiny dashboard.",
    tech: ["R", "OpenAI API"],
    thumb: `${IMG}/crypto.png`,
    repo: "https://github.com/madhusiddharths/crypto_tweet_impact",
    results: [
      { value: "~20K", label: "Musk tweets classified by an LLM" },
      { value: "30+", label: "category tests corrected (Bonferroni, FDR)" },
      { value: "+4.27%", label: "7-day DOGE return after negative tweets (p = 0.0097)" },
      { value: "almost none", label: "raw-significant effects survive correction" },
    ],
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "federated-iot",
    index: "08",
    name: "Federated IoT Security",
    domain: "Federated learning · Privacy",
    summary:
      "First-author IEEE paper: four organisations train one IoT intrusion detector without sharing traffic. A Transformer + XGBoost hybrid shares only its LoRA adapters, reaching 97.98% accuracy with 89.5% less data per round.",
    tech: ["PyTorch", "Pandas", "LaTeX", "Python"],
    thumb: `${IMG}/fed_iot.png`,
    repo: null,
    privateRepo: true,
    paper: "https://ieeexplore.ieee.org/document/11395795",
    results: [
      { value: "97.98%", label: "accuracy on 2.4M test flows" },
      { value: "89.5%", label: "less data sent per round than FedAvg" },
      { value: "4", label: "simulated organisations, no raw traffic shared" },
      { value: "IEEE", label: "ICAIC 2026, first author" },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "online-retail",
    index: "09",
    name: "Online Retail",
    domain: "Analytics engineering · Cloud DW",
    summary:
      "A dual-mode analytics pipeline that models ~540k retail transactions into a star schema with Polars, then answers real business questions — revenue trends, RFM segmentation, and cohort retention — surfaced on a live Looker Studio dashboard.",
    tech: ["Python", "Polars", "Snowflake", "GCP", "SQL"],
    thumb: `${IMG}/online_retail.png`,
    repo: "https://github.com/madhusiddharths/Online_retail",
    live: "https://datastudio.google.com/reporting/ec4c8755-2932-417a-be4d-14d03c93b6a6",
    liveKind: "dashboard",
    results: [
      { value: "£10.23M", label: "gross revenue across ~540k transactions" },
      { value: "4.6%", label: "return rate, reported alongside net" },
      { value: "~£1.5M", label: "revenue kept by bucketing guest orders" },
      { value: "4,334", label: "customers segmented with RFM" },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "image-retrieval",
    index: "10",
    name: "Image Retrieval",
    domain: "Vector search · Computer vision",
    summary:
      "Upload a photo, get the most similar images back: a fine-tuned ResNet-50 (96.95% validation accuracy) produces 128-d embeddings that FAISS searches by cosine similarity, served as a live Streamlit app.",
    tech: ["PyTorch", "Pandas", "Streamlit", "Docker", "Python"],
    thumb: `${IMG}/image_retrieval.png`,
    repo: "https://github.com/madhusiddharths/image_retrieval/tree/main",
    live: "https://imageretrievalproject.streamlit.app",
    liveKind: "model",
    results: [
      { value: "96.95%", label: "validation accuracy after fine-tuning" },
      { value: "73.68%", label: "from-scratch CNN baseline" },
      { value: "128-d", label: "embeddings, exact cosine search in FAISS" },
      { value: "101", label: "Caltech-101 classes, 8,677 images" },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "traffic-prediction",
    index: "11",
    name: "Traffic Prediction",
    domain: "Fleet routing · 50-stop VRP",
    summary:
      "A traffic-aware fleet routing system that forecasts congestion with a Random Forest, prices it into a real OSRM road network, and solves a 50-stop, 8-vehicle Vehicle Routing Problem with Google OR-Tools.",
    tech: ["Python", "scikit-learn", "Pandas", "NumPy", "Matplotlib"],
    thumb: `${IMG}/sf.jpg`,
    repo: "https://github.com/madhusiddharths/Traffic-Prediction",
    results: [
      { value: "R² ≈ 0.87", label: "Random Forest traffic forecast" },
      { value: "50 / 8", label: "stops and vehicles routed with OR-Tools" },
      { value: "315,359", label: "CalTrans sensor rows modeled" },
      { value: "10 s", label: "solve budget for a balanced fleet" },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "saturdae",
    index: "12",
    name: "SATURDAE",
    domain: "Spatial design · Patented",
    summary:
      "A patented floor-plan designer: place rooms and furniture with short commands, and a half-foot occupancy grid rejects overlaps, suggests free room positions and draws the hallways.",
    tech: ["Python", "NumPy", "PyCharm"],
    thumb: `${IMG}/floor.jpg`,
    repo: "https://github.com/madhusiddharths/SATURDAE",
    results: [
      { value: "Patent", label: "Indian application 202341038832 A" },
      { value: "0.5 ft", label: "occupancy-grid resolution for collision checks" },
      { value: "30×30", label: "planning grid, drawn live" },
    ],
    hasCaseStudy: true,
  },
  {
    slug: "hotspot",
    index: "13",
    name: "Hotspot",
    domain: "Geospatial health · Exposure modeling",
    summary:
      "An interactive geospatial dashboard that maps weekly influenza activity across 56 Chicago ZIP codes and turns a user's own Google Timeline location history into a personalized, privacy-preserving exposure-risk estimate.",
    tech: ["Python", "Streamlit", "Plotly", "Pandas", "GeoPandas"],
    thumb: `${IMG}/hotspot.png`,
    repo: "https://github.com/madhusiddharths/hotspot",
    live: "https://madhusiddharths-hotspot-streamlit-app-ndfk0y.streamlit.app",
    liveKind: "dashboard",
    results: [
      { value: "56", label: "Chicago ZIP codes mapped weekly" },
      { value: "131,896", label: "lab-tested cases, 2024 season" },
      { value: "5", label: "public datasets fused" },
      { value: "on-device", label: "personal exposure estimate" },
    ],
    hasCaseStudy: true,
  },
];

// Array order is display order: AI engineering first, then data science, then analytics.
export const FEATURED = PROJECTS.filter((p) => p.featured);
export const CASE_STUDIES = PROJECTS.filter((p) => p.hasCaseStudy);
export const CASE_STUDY_SLUGS = CASE_STUDIES.map((p) => p.slug);
/** A project's field report, or the coming-soon page when it has none yet. */
export function projectHref(p: Project) {
  return p.hasCaseStudy ? `/work/${p.slug}/` : `/work/coming-soon/?p=${p.slug}`;
}
export function getProject(slug: string) {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}

/* ---- headline metrics (count-up) — every figure is real, drawn from the work */
export const METRICS: { value: number; label: string; prefix?: string; suffix?: string; decimals?: number }[] = [
  { value: 550, suffix: "B → 3B", label: "teacher distilled into tool-calling agents" },
  { value: 73.5, decimals: 1, suffix: "%", label: "video QA accuracy, up from 54.7%" },
  { value: 26, suffix: "K+", label: "sites enriched with LLMs" },
  { value: 1.8, decimals: 1, suffix: "B+", label: "Gaia DR3 sources processed" },
];

/* ---- capability matrix (skills) — same items as before, re-categorized ---- */
export const SKILLS: { group: string; items: string[] }[] = [
  {
    group: "Languages & Query",
    items: ["Python", "R", "SQL", "PostgreSQL", "JavaScript"],
  },
  {
    group: "AI Engineering & Agents",
    items: ["Agentic AI", "LangGraph", "LangChain", "MCP", "LLM APIs", "OpenRouter", "Ollama", "Hugging Face", "vLLM", "Weights & Biases", "MLflow", "LLM Fine-tuning"],
  },
  {
    group: "ML / Data Science",
    items: ["Pandas", "NumPy", "PyTorch", "TensorFlow", "scikit-learn", "Matplotlib", "Plotly", "OpenCV", "NLP", "Time Series Analysis"],
  },
  {
    group: "Data & Cloud Infra",
    items: ["Apache Airflow", "Apache Kafka", "Apache Spark", "Docker", "GCP", "AWS", "Snowflake", "Databricks"],
  },
  {
    group: "Serving & BI",
    items: ["FastAPI", "Streamlit", "Tableau", "Power BI"],
  },
];

/* ---- certifications -------------------------------------------------------- */
export const CERTS = [
  {
    name: "IBM Machine Learning Specialist — Advanced",
    issuer: "IBM",
    img: "/img/certification/ibm-machine-learning-specialist-advanced.png",
    url: "https://www.credly.com/badges/fae85859-f892-4376-b864-813f2121650e/public_url",
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    img: "/img/certification/aws-certified-cloud-practitioner.png",
    url: "https://www.credly.com/badges/b6bad1eb-1fa3-4947-98bb-692045b56d7f/public_url",
  },
  {
    name: "IBM Data Science Professional Certificate",
    issuer: "IBM",
    img: "/img/certification/ibm-data-science-professional-certificate.png",
    url: "https://www.credly.com/badges/1c045c4e-4493-435a-8029-782cd961988c/public_url",
  },
  {
    name: "Google Data Analytics Professional Certificate",
    issuer: "Google",
    img: "/img/certification/google_data_analytics.png",
    url: "https://www.credly.com/badges/45e54b43-f18f-47f0-9a5e-965571748030/public_url",
  },
];
