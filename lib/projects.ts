/* =============================================================================
   Content registry — single source of truth.
   All copy is preserved verbatim from the original portfolio; this file only
   re-organizes it into a typed model that the Instrument UI renders.
   ========================================================================== */

export const PROFILE = {
  name: "Madhu Siddharth Suthagar",
  shortName: "Madhu Siddharth",
  monogram: "MS",
  role: "Data Scientist",
  location: "GMT+0",
  available: true,
  building: "PulseTrade",
  tagline: "I develop scalable models that drive real-world impact.",
  bio: "As a Data Scientist, I design and build end-to-end data systems that turn large, complex datasets into actionable insights and predictive models. My work spans data engineering, exploratory analysis, and applied machine learning, with a focus on reliability and real-world impact. I enjoy uncovering patterns at scale, optimizing analytical workflows, and translating technical results into clear, decision-ready insights for both technical and non-technical stakeholders.",
  analystNote:
    "For analyst-focused roles, a tailored Data Analyst resume is available.",
  resume:
    "https://drive.google.com/file/d/1Y4gP7sZf8AtwZOJoax-9yc3QV_pC2Qce/view?usp=share_link",
  analystResume:
    "https://drive.google.com/file/d/1xSb2ku446YpYCXYIn-rxIrh_UdjQMRm5/view?usp=share_link",
  email: "madhusiddharths2@gmail.com",
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
  "C++": `${ICON}/C++ (CPlusPlus).png`,
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
  privateRepo?: boolean;
  hasCaseStudy: boolean; // false → routes to /work/coming-soon
  featured?: boolean;
};

const IMG = "/img/project_img";

export const PROJECTS: Project[] = [
  {
    slug: "pulsetrade",
    index: "01",
    name: "PulseTrade",
    domain: "Real-time streaming · Agentic AI",
    summary:
      "Real-time financial intelligence platform that streams market data through Kafka and Delta Lake, then uses an agentic AI investigator to explain anomalies in plain language.",
    tech: ["Apache Kafka", "Apache Airflow", "Databricks", "Kubernetes", "FastAPI", "PostgreSQL"],
    thumb: `${IMG}/pulsetrade.png`,
    repo: "https://github.com/madhusiddharths/pulsetrade",
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "galaxy",
    index: "02",
    name: "Galaxy Explorer",
    domain: "3D visualization · 557M+ stars",
    summary:
      "A cloud-native 3D visualization platform that dynamically queries and renders 557M+ Gaia DR3 stars with real-time kinematic projection using serverless BigQuery and GPU acceleration.",
    tech: ["Polars", "Apache Spark", "FastAPI", "Three.js", "GCP", "Docker"],
    thumb: `${IMG}/stars.jpg`,
    repo: "https://github.com/madhusiddharths/galaxy_explorer",
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "growth-retention",
    index: "03",
    name: "Growth & Retention",
    domain: "Experimentation · 20M+ events",
    summary:
      "An end-to-end data pipeline and machine learning system that processes 20M+ e-commerce events to validate A/B tests and predict cart abandonment in real-time.",
    tech: ["Python", "dbt", "FastAPI", "Streamlit", "Docker"],
    thumb: `${IMG}/growth_retention.png`,
    repo: "https://github.com/madhusiddharths/growth_retention",
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "alzheimers",
    index: "04",
    name: "Alzheimer's Progression",
    domain: "Medical imaging · GANs",
    summary:
      "This project uses deep learning, image processing, and GANs to predict and model the progression of Alzheimer's disease from MRI scans.",
    tech: ["PyTorch", "Pandas", "Matplotlib", "OpenCV", "Docker", "Flask"],
    thumb: `${IMG}/alzheimers.jpg`,
    repo: "https://github.com/madhusiddharths/alzheimers_progression",
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "ai-counselling",
    index: "05",
    name: "AI-counselling",
    domain: "Multimodal AI · Wellbeing",
    summary:
      "An AI-powered chatbot that analyzes a person's video, audio, and tone to assess their mental state and provide personalized counseling.",
    tech: ["FastAPI", "GCP", "MongoDB", "TypeScript", "Docker", "Node.js"],
    thumb: `${IMG}/ai_chatbot.png`,
    repo: "https://github.com/madhusiddharths/aicounselling",
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "crypto-tweet-impact",
    index: "06",
    name: "Crypto Tweet Impact",
    domain: "Event study · NLP",
    summary:
      "A statistically rigorous data-science pipeline and event study that evaluates the market impact of ~20,000 LLM-classified tweets on Bitcoin and Dogecoin prices using multiple-testing corrections and an interactive Shiny dashboard.",
    tech: ["R"],
    thumb: `${IMG}/crypto.png`,
    repo: "https://github.com/madhusiddharths/crypto_tweet_impact",
    hasCaseStudy: true,
    featured: true,
  },
  {
    slug: "federated-iot",
    index: "07",
    name: "Federated IoT Security",
    domain: "Federated learning · Privacy",
    summary:
      "A hybrid Federated Learning framework integrating Transformers and XGBoost with LoRA adapters for efficient, privacy-preserving IoT intrusion detection.",
    tech: ["PyTorch", "Pandas", "LaTeX"],
    thumb: `${IMG}/fed_iot.png`,
    repo: null,
    privateRepo: true,
    paper: "https://ieeexplore.ieee.org/document/11395795",
    hasCaseStudy: true,
  },
  {
    slug: "online-retail",
    index: "08",
    name: "Online Retail",
    domain: "Analytics engineering · Cloud DW",
    summary:
      "A dual-mode analytics pipeline that models ~540k retail transactions into a star schema with Polars, then answers real business questions — revenue trends, RFM segmentation, and cohort retention — surfaced on a live Looker Studio dashboard.",
    tech: ["Python", "Polars", "Snowflake", "GCP", "SQL"],
    thumb: `${IMG}/online_retail.png`,
    repo: "https://github.com/madhusiddharths/Online_retail",
    hasCaseStudy: true,
  },
  {
    slug: "vision-transformer",
    index: "09",
    name: "Vision Transformer",
    domain: "Deep learning · Transformers",
    summary:
      "A from-scratch PyTorch implementation of the Vision Transformer (ViT) — patch embedding, [CLS] token, pre-norm encoder — trained on CIFAR-10 to 72.9% test accuracy, plus a hybrid CNN-Transformer variant and the full ViT-Base/Large/Huge config family.",
    tech: ["PyTorch", "Python", "Matplotlib", "LaTeX"],
    thumb: `${IMG}/vit.jpg`,
    repo: null,
    privateRepo: true,
    hasCaseStudy: true,
  },
  {
    slug: "image-retrieval",
    index: "10",
    name: "Image Retrieval",
    domain: "Vector search · Computer vision",
    summary:
      "AI-based image retrieval using ResNet-50 feature extraction and FAISS vector indexing for fast similarity search.",
    tech: ["PyTorch", "Pandas", "Streamlit", "Docker"],
    thumb: `${IMG}/image_retrieval.png`,
    repo: "https://github.com/madhusiddharths/image_retrieval/tree/main",
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
    hasCaseStudy: true,
  },
  {
    slug: "saturdae",
    index: "12",
    name: "SATURDAE",
    domain: "Voice UI · Spatial design",
    summary:
      "A voice-controlled floor planning app that lets users design and edit layouts, intelligently suggesting room and furniture arrangements for improved designs.",
    tech: ["Python", "NumPy", "PyCharm"],
    thumb: `${IMG}/floor.jpg`,
    repo: "https://github.com/madhusiddharths/SATURDAE",
    hasCaseStudy: true,
  },
  {
    slug: "symptoscan",
    index: "13",
    name: "SymptoScan",
    domain: "Classification · Health",
    summary:
      "SymptoScan is designed to classify four closely related illnesses—flu, COVID-19, the common cold, and allergies—using a meta-classifier approach.",
    tech: ["Pandas", "NumPy", "Kaggle", "Plotly", "scikit-learn"],
    thumb: `${IMG}/symptoscan.jpeg.png.webp`,
    repo: "https://github.com/madhusiddharths/SymptoScan",
    hasCaseStudy: false,
  },
  {
    slug: "hotspot",
    index: "14",
    name: "Hotspot",
    domain: "Geospatial health · Exposure modeling",
    summary:
      "An interactive geospatial dashboard that maps weekly influenza activity across 56 Chicago ZIP codes and turns a user's own Google Timeline location history into a personalized, privacy-preserving exposure-risk estimate.",
    tech: ["Python", "Streamlit", "Plotly", "Pandas", "GeoPandas"],
    thumb: `${IMG}/hotspot.png`,
    repo: "https://github.com/madhusiddharths/hotspot",
    hasCaseStudy: true,
  },
  {
    slug: "image-classifier",
    index: "15",
    name: "Image Classifier",
    domain: "Transfer learning · CV",
    summary:
      "A human-versus-horse classifier built using transfer learning, leveraging a VGG19 model pretrained on ImageNet for improved accuracy.",
    tech: ["TensorFlow", "OpenCV", "Streamlit", "Keras", "NumPy"],
    thumb: `${IMG}/ImageNet.webp`,
    repo: "https://github.com/madhusiddharths/VGG19-Trannsfer-learning",
    hasCaseStudy: false,
  },
];

export const FEATURED = PROJECTS.filter((p) => p.featured);
export const CASE_STUDY_SLUGS = PROJECTS.filter((p) => p.hasCaseStudy).map((p) => p.slug);
export function getProject(slug: string) {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}

/* ---- headline metrics (count-up) — every figure is real, drawn from the work */
export const METRICS = [
  { value: 557, suffix: "M+", label: "Gaia DR3 stars rendered" },
  { value: 20, suffix: "M+", label: "e-commerce events processed" },
  { value: 20, prefix: "~", suffix: "K", label: "tweets classified & studied" },
  { value: 13, suffix: "", label: "in-depth case studies" },
];

/* ---- capability matrix (skills) — same items as before, re-categorized ---- */
export const SKILLS: { group: string; items: string[] }[] = [
  {
    group: "Languages & Query",
    items: ["Python", "R", "C", "C++", "Java", "SQL", "PostgreSQL", "JavaScript", "HTML", "CSS"],
  },
  {
    group: "ML / Data Science",
    items: ["Pandas", "NumPy", "PyTorch", "TensorFlow", "scikit-learn", "Matplotlib", "Plotly", "OpenCV", "NLP", "Time Series Analysis", "Agentic AI", "LangChain"],
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
    name: "IBM Data Science Professional Certificate",
    issuer: "IBM",
    img: "/img/certification/ibm-data-science-professional-certificate.png",
    url: "https://www.credly.com/badges/1c045c4e-4493-435a-8029-782cd961988c/public_url",
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    img: "/img/certification/aws-certified-cloud-practitioner.png",
    url: "https://www.credly.com/badges/b6bad1eb-1fa3-4947-98bb-692045b56d7f/public_url",
  },
  {
    name: "Google Data Analytics Professional Certificate",
    issuer: "Google",
    img: "/img/certification/google_data_analytics.png",
    url: "https://www.credly.com/badges/45e54b43-f18f-47f0-9a5e-965571748030/public_url",
  },
];
