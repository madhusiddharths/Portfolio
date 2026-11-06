/* =============================================================================
   PIPELINES — one architecture graph per field report.

   Each node is a real component of the project, placed on a column/row grid
   (columns read left → right in the direction data moves). `at` is the id of
   the report section that explains the node: the node appears in the bottom
   panel's graph when the reader reaches that section. `data` on an edge is
   the payload that moves along it (the dataflow tab traces these in order).

   Facts come from the case studies in content/*.html and the KB notes.
   ========================================================================== */

export type NodeKind = "source" | "ingest" | "stream" | "store" | "transform" | "model" | "agent" | "eval" | "serve" | "ui" | "ops";

export type PNode = {
  id: string;
  label: string;
  tech?: string;
  kind: NodeKind;
  col: number;
  row: number;
  at: string;
};
export type PEdge = { from: string; to: string; data?: string };
export type Pipeline = {
  /** one-paragraph "how it fits together" for the explain tab */
  summary: string;
  /** optional column headings drawn above the graph */
  stages?: string[];
  nodes: PNode[];
  edges: PEdge[];
};

export const KIND_LABEL: Record<NodeKind, string> = {
  source: "source",
  ingest: "ingest",
  stream: "stream",
  store: "store",
  transform: "transform",
  model: "model",
  agent: "agent",
  eval: "eval",
  serve: "serve",
  ui: "ui",
  ops: "ops",
};

export const PIPELINES: Record<string, Pipeline> = {
  /* ------------------------------------------------------------------ */
  "tool-router-ladder": {
    summary:
      "A distil → train → evaluate → route loop. A 550B teacher (Nemotron 3 Ultra) plays τ²-bench retail; its successful trajectories become a loss-masked SFT set for a ladder of Qwen2.5 LoRA students (0.5B / 1.5B / 3B). Students are post-trained with DPO and GRPO, evaluated teacher-forced and free-running behind vLLM, and the best one is put behind a LangGraph confidence router that escalates uncertain steps to the teacher. Every stage appends to a JSONL run log keyed by a config fingerprint.",
    stages: ["harvest", "train", "post-train", "evaluate", "route"],
    nodes: [
      { id: "tau", label: "τ²-bench retail", tech: "114 tasks · 54/60 split", kind: "source", col: 0, row: 0.5, at: "overview" },
      { id: "teacher", label: "Teacher episodes", tech: "Nemotron 3 Ultra · 550B", kind: "model", col: 1, row: 0, at: "harvesting-teacher-trajectories" },
      { id: "sft", label: "SFT set", tech: "1,099 decisions · loss-masked", kind: "store", col: 1, row: 1, at: "harvesting-teacher-trajectories" },
      { id: "lora", label: "LoRA students", tech: "Qwen2.5 0.5B · 1.5B · 3B", kind: "model", col: 2, row: 1, at: "training-the-students" },
      { id: "forced", label: "Forced eval", tech: "1,416 steps · 16/40/80 tools", kind: "eval", col: 3, row: 0, at: "teacher-forced-evaluation-the-catalog-cliff" },
      { id: "vllm", label: "vLLM server", tech: "OpenAI-compatible · batched", kind: "serve", col: 3, row: 2, at: "free-running-evaluation-where-reliability-breaks" },
      { id: "free", label: "Free-running eval", tech: "60 tasks × 5 seeds", kind: "eval", col: 4, row: 2, at: "free-running-evaluation-where-reliability-breaks" },
      { id: "post", label: "DPO · GRPO", tech: "from the SFT checkpoint", kind: "transform", col: 2, row: 2, at: "beyond-sft-dpo-vs-grpo" },
      { id: "router", label: "Confidence router", tech: "LangGraph · log-prob gate", kind: "agent", col: 4, row: 0.5, at: "the-confidence-router" },
      { id: "log", label: "Run log", tech: "JSONL · config fingerprint", kind: "ops", col: 5, row: 1, at: "engineering-for-honest-numbers" },
    ],
    edges: [
      { from: "tau", to: "teacher", data: "train tasks" },
      { from: "teacher", to: "sft", data: "108 successful episodes" },
      { from: "sft", to: "lora", data: "12k-token chats" },
      { from: "lora", to: "forced", data: "next-step predictions" },
      { from: "lora", to: "post", data: "SFT checkpoint" },
      { from: "post", to: "vllm", data: "adapters" },
      { from: "vllm", to: "free", data: "concurrent episodes" },
      { from: "teacher", to: "router", data: "escalated steps" },
      { from: "lora", to: "router", data: "proposed step + confidence" },
      { from: "forced", to: "log", data: "step accuracy" },
      { from: "free", to: "log", data: "task success · 95% CI" },
      { from: "router", to: "log", data: "escalation rate" },
    ],
  },

  /* ------------------------------------------------------------------ */
  pulsetrade: {
    summary:
      "Seven layers. Two Python producers poll Finnhub and NewsAPI into Confluent Kafka; Spark Structured Streaming on Databricks lands them in a bronze → silver → gold Delta Lake medallion of 5-minute feature windows. Airflow triggers the notebooks and an anomaly detector every five minutes; a flagged window POSTs to a FastAPI service that runs a LangGraph investigator (MCP tools, Gemini 2.5 Flash) and stores its brief in Postgres. The serving stack runs on GKE, and LangSmith, Prometheus/Grafana and Evidently watch each layer.",
    stages: ["sources", "ingest", "bus", "process", "store", "detect", "reason", "serve"],
    nodes: [
      { id: "finnhub", label: "Finnhub API", tech: "5 tickers · 30 s poll", kind: "source", col: 0, row: 0, at: "overview" },
      { id: "news", label: "NewsAPI", tech: "headlines · 30 min poll", kind: "source", col: 0, row: 1.6, at: "overview" },
      { id: "prod", label: "Producers", tech: "Python · kafka-python", kind: "ingest", col: 1, row: 0.8, at: "layer-1-ingestion" },
      { id: "kafka", label: "Kafka topics", tech: "Confluent Cloud", kind: "stream", col: 2, row: 0.8, at: "layer-1-ingestion" },
      { id: "spark", label: "Structured Streaming", tech: "Databricks · Spark", kind: "transform", col: 3, row: 0.8, at: "layer-2-stream-processing-storage" },
      { id: "delta", label: "Delta medallion", tech: "bronze · silver · gold", kind: "store", col: 4, row: 0.8, at: "layer-2-stream-processing-storage" },
      { id: "agent", label: "LangGraph investigator", tech: "MCP · Gemini 2.5 Flash", kind: "agent", col: 6, row: 0, at: "layer-3-agentic-ai-investigation" },
      { id: "pg", label: "Postgres", tech: "investigations", kind: "store", col: 7, row: 0, at: "layer-3-agentic-ai-investigation" },
      { id: "airflow", label: "Airflow DAGs", tech: "5-min + nightly", kind: "ops", col: 4, row: 2.4, at: "layer-4-batch-orchestration-with-airflow" },
      { id: "anomaly", label: "Anomaly detector", tech: "2σ · sentiment · volatility", kind: "model", col: 5, row: 0.8, at: "layer-5-anomaly-detection" },
      { id: "gke", label: "FastAPI on GKE", tech: "2 × e2-small", kind: "serve", col: 7, row: 1.4, at: "layer-6-serving-on-kubernetes" },
      { id: "obs", label: "Observability", tech: "LangSmith · Grafana · Evidently", kind: "ops", col: 6, row: 2.4, at: "layer-7-observability" },
      { id: "dash", label: "Streamlit dashboard", tech: "4 pages · 30 s refresh", kind: "ui", col: 8, row: 0.8, at: "streamlit-dashboard" },
    ],
    edges: [
      { from: "finnhub", to: "prod", data: "OHLC quotes" },
      { from: "news", to: "prod", data: "articles" },
      { from: "prod", to: "kafka", data: "StockTick · NewsEvent" },
      { from: "kafka", to: "spark", data: "event stream" },
      { from: "spark", to: "delta", data: "append → dedupe → 5-min windows" },
      { from: "airflow", to: "delta", data: "notebook runs" },
      { from: "delta", to: "anomaly", data: "gold windows" },
      { from: "anomaly", to: "agent", data: "POST /investigate" },
      { from: "delta", to: "agent", data: "context + news via MCP" },
      { from: "agent", to: "pg", data: "structured brief" },
      { from: "pg", to: "gke", data: "reports" },
      { from: "gke", to: "dash", data: "REST" },
      { from: "agent", to: "obs", data: "traces" },
      { from: "gke", to: "obs", data: "metrics" },
    ],
  },

  /* ------------------------------------------------------------------ */
  galaxy: {
    summary:
      "Gaia DR3's ~1.8B rows (750+ GB) are filtered, partitioned by HEALPix sector and distance shell, and merged with Hipparcos names — first on a home-built PySpark cluster, then rewritten in Polars — down to 557M stars × 13 columns. A one-time BigQuery precompute materialises density, HR and 6D-HDBSCAN cluster tables. A FastAPI service on Cloud Run serves them to a React Three Fiber explorer, while a separate Streamlit planetarium renders the naked-eye sky for any place and time.",
    stages: ["raw", "engineer", "warehouse", "analyse", "serve", "render"],
    nodes: [
      { id: "gaia", label: "Gaia DR3", tech: "1.8B rows · 750+ GB", kind: "source", col: 0, row: 1, at: "the-dataset-gaia-dr3" },
      { id: "polars", label: "Partition + clean", tech: "PySpark → Polars", kind: "transform", col: 1, row: 1, at: "data-engineering-pipeline" },
      { id: "gcs", label: "Parquet in GCS", tech: "~77 GB", kind: "store", col: 2, row: 0.4, at: "data-engineering-pipeline" },
      { id: "bq", label: "BigQuery", tech: "557M stars · precompute", kind: "store", col: 3, row: 0.4, at: "bigquery-sub-second-queries-at-low-cost" },
      { id: "hdb", label: "6D HDBSCAN", tech: "position + velocity", kind: "model", col: 4, row: 1.4, at: "stellar-families-hdbscan-in-6d" },
      { id: "proj", label: "Kinematic projection", tech: "proper motion → year", kind: "transform", col: 4, row: 0, at: "real-time-kinematic-projection" },
      { id: "api", label: "FastAPI", tech: "Cloud Run · mock fallback", kind: "serve", col: 5, row: 0.6, at: "real-time-kinematic-projection" },
      { id: "web", label: "3D explorer", tech: "React Three Fiber · 60 FPS", kind: "ui", col: 6, row: 0.6, at: "engineering-challenges-solved" },
      { id: "sky", label: "Night Sky Viewer", tech: "Streamlit · astropy", kind: "ui", col: 3, row: 2, at: "night-sky-viewer" },
    ],
    edges: [
      { from: "gaia", to: "polars", data: "raw catalogue" },
      { from: "polars", to: "gcs", data: "HEALPix × distance shells" },
      { from: "gcs", to: "bq", data: "external load" },
      { from: "bq", to: "hdb", data: "stars within 600 ly" },
      { from: "hdb", to: "bq", data: "cluster_catalog" },
      { from: "bq", to: "proj", data: "sampled stars" },
      { from: "proj", to: "api", data: "/stars" },
      { from: "bq", to: "api", data: "/density · /hr · /clusters" },
      { from: "api", to: "web", data: "JSON payloads" },
      { from: "polars", to: "sky", data: "mag ≤ 6.5 + names" },
    ],
  },

  /* ------------------------------------------------------------------ */
  "growth-retention": {
    summary:
      "About 20M Kaggle cosmetics clickstream events are chunked, given deterministic MD5 A/B buckets (with an injected +5% treatment uplift), and loaded through GCS into a BigQuery bronze layer. dbt builds sessionised silver and gold tables with tests. On top: a chi-square A/B test, an XGBoost cart-abandonment model explained with SHAP, a FastAPI /predict service, a three-tab Streamlit app on Cloud Run, and an Evidently drift report.",
    stages: ["ingest", "warehouse", "model", "serve", "watch"],
    nodes: [
      { id: "csv", label: "Clickstream CSVs", tech: "~20M events · 4.6 GB", kind: "source", col: 0, row: 1, at: "the-dataset-experiment-simulation" },
      { id: "proc", label: "process_data.py", tech: "chunks · MD5 buckets", kind: "ingest", col: 1, row: 1, at: "phase-1-data-engineering-cloud-ingestion" },
      { id: "bronze", label: "BigQuery bronze", tech: "via GCS", kind: "store", col: 2, row: 1, at: "phase-1-data-engineering-cloud-ingestion" },
      { id: "dbt", label: "dbt silver → gold", tech: "sessions · tests", kind: "transform", col: 3, row: 1, at: "phase-2-modern-data-stack-dbt-transformation-testing" },
      { id: "ab", label: "A/B test", tech: "chi-square", kind: "eval", col: 4, row: 0, at: "phase-3a-statistical-validation-the-a-b-test" },
      { id: "xgb", label: "XGBoost", tech: "cart abandonment", kind: "model", col: 4, row: 1.2, at: "phase-3b-predicting-cart-abandonment-with-xgboost" },
      { id: "shap", label: "SHAP", tech: "global + per-row", kind: "eval", col: 5, row: 2, at: "phase-3c-model-explainability-with-shap" },
      { id: "api", label: "FastAPI", tech: "/predict · /bulk_predict", kind: "serve", col: 5, row: 1, at: "phase-4a-real-time-inference-api-fastapi" },
      { id: "app", label: "Streamlit app", tech: "3 tabs", kind: "ui", col: 6, row: 0.5, at: "phase-4b-interactive-web-app-streamlit" },
      { id: "run", label: "Cloud Run", tech: "Docker images", kind: "ops", col: 6, row: 1.6, at: "phase-4c-containerization-deployment" },
      { id: "drift", label: "Evidently", tech: "drift report", kind: "ops", col: 7, row: 1, at: "phase-4d-model-observability-evidently-ai" },
    ],
    edges: [
      { from: "csv", to: "proc", data: "1M-row chunks" },
      { from: "proc", to: "bronze", data: "events + A/B group" },
      { from: "bronze", to: "dbt", data: "raw events" },
      { from: "dbt", to: "ab", data: "fact_user_sessions" },
      { from: "dbt", to: "xgb", data: "session features" },
      { from: "xgb", to: "shap", data: "model" },
      { from: "xgb", to: "api", data: "model.json" },
      { from: "shap", to: "api", data: "waterfall per request" },
      { from: "ab", to: "app", data: "live A/B dashboard" },
      { from: "api", to: "app", data: "predictions" },
      { from: "api", to: "run", data: "container" },
      { from: "api", to: "drift", data: "scored sessions" },
    ],
  },

  /* ------------------------------------------------------------------ */
  alzheimers: {
    summary:
      "Two models in sequence. An MRI slice is resized to RGB and staged by a fine-tuned EfficientNetB4 classifier; that stage acts as a router into a chain of three stage-transition DCGANs (Non → Very Mild → Mild → Moderate), each generator feeding the next, with a region-of-interest discriminator focusing training on the brain. A Flask app on Render returns the stage plus the synthesised progression, and MLflow tracks every run.",
    stages: ["data", "classify", "generate", "refine", "serve"],
    nodes: [
      { id: "oasis", label: "OASIS MRI", tech: "86,437 slices · 4 stages", kind: "source", col: 0, row: 1, at: "dataset-exploratory-analysis" },
      { id: "prep", label: "Preprocess", tech: "256×256 · ImageNet norm", kind: "transform", col: 1, row: 1, at: "dataset-exploratory-analysis" },
      { id: "cls", label: "EfficientNetB4", tech: "stage classifier", kind: "model", col: 2, row: 1, at: "stage-classifier-efficientnetb4" },
      { id: "eval", label: "Held-out eval", tech: "98% acc · 0.98 macro-F1", kind: "eval", col: 3, row: 0, at: "classification-results" },
      { id: "g1", label: "GAN · Non→VM", tech: "encoder–decoder", kind: "model", col: 3, row: 1.4, at: "progression-modeling-with-dcgans" },
      { id: "g2", label: "GAN · VM→Mild", kind: "model", tech: "chained", col: 4, row: 1.4, at: "progression-modeling-with-dcgans" },
      { id: "g3", label: "GAN · Mild→Mod", kind: "model", tech: "chained", col: 5, row: 1.4, at: "progression-modeling-with-dcgans" },
      { id: "roi", label: "ROI discriminator", tech: "brain-contour mask", kind: "eval", col: 4, row: 2.6, at: "region-of-interest-refinement" },
      { id: "flask", label: "Flask app", tech: "Docker · Render", kind: "serve", col: 6, row: 1, at: "deployment-experiment-tracking" },
      { id: "mlflow", label: "MLflow", tech: "experiment tracking", kind: "ops", col: 6, row: 2.4, at: "deployment-experiment-tracking" },
    ],
    edges: [
      { from: "oasis", to: "prep", data: "axial slices" },
      { from: "prep", to: "cls", data: "tensors" },
      { from: "cls", to: "eval", data: "predictions" },
      { from: "cls", to: "g1", data: "stage → entry point" },
      { from: "g1", to: "g2", data: "synthetic scan" },
      { from: "g2", to: "g3", data: "synthetic scan" },
      { from: "roi", to: "g2", data: "region-aware loss" },
      { from: "g3", to: "flask", data: "progression sequence" },
      { from: "cls", to: "flask", data: "current stage" },
      { from: "flask", to: "mlflow", data: "runs · metrics" },
    ],
  },

  /* ------------------------------------------------------------------ */
  "ai-counselling": {
    summary:
      "Three tiers. A Next.js 15 app on Vercel handles Clerk auth, the chat/voice/video UI and in-browser facial-emotion detection, and uploads recordings to Google Cloud Storage. It calls a Dockerised FastAPI backend on a Hugging Face Space directly. The backend fuses the message, voice tone, transcript, emotion counts, retrieved DSM-5 passages, a MongoDB long-term memory and the questionnaire into one Gemini prompt — behind a crisis keyword check — and returns text plus Google TTS audio.",
    stages: ["client", "capture", "backend", "context", "reason", "reply"],
    nodes: [
      { id: "ui", label: "Next.js app", tech: "Vercel · Clerk auth", kind: "ui", col: 0, row: 1, at: "core-user-experience" },
      { id: "face", label: "Facial emotion", tech: "face-api.js · in browser", kind: "model", col: 1, row: 0, at: "in-browser-facial-emotion-detection" },
      { id: "gcs", label: "GCS media", tech: "users/<id>/ prefixes", kind: "store", col: 1, row: 2, at: "voice-analysis-pipeline" },
      { id: "api", label: "FastAPI", tech: "Docker · HF Space", kind: "serve", col: 2, row: 1, at: "voice-analysis-pipeline" },
      { id: "stt", label: "Speech + tone", tech: "Google STT · pitch/energy", kind: "transform", col: 3, row: 2, at: "speech-to-text-robustness" },
      { id: "rag", label: "DSM-5 retrieval", tech: "FAISS · embeddings", kind: "store", col: 3, row: 0, at: "retrieval-augmented-generation-over-the-dsm-5" },
      { id: "mem", label: "Long-term memory", tech: "MongoDB · summaries", kind: "store", col: 3, row: 1, at: "long-term-memory-conversation-state" },
      { id: "safety", label: "Safety + routing", tech: "crisis check · small talk", kind: "agent", col: 4, row: 1, at: "llm-prompting-routing-safety" },
      { id: "gemini", label: "Gemini", tech: "fused prompt", kind: "model", col: 5, row: 1, at: "llm-prompting-routing-safety" },
      { id: "tts", label: "Google TTS", tech: "base64 audio", kind: "serve", col: 6, row: 1, at: "data-strategy-apis-output" },
    ],
    edges: [
      { from: "ui", to: "face", data: "webcam frames" },
      { from: "ui", to: "gcs", data: "audio / video" },
      { from: "face", to: "api", data: "emotion counts" },
      { from: "ui", to: "api", data: "message" },
      { from: "gcs", to: "stt", data: "recording" },
      { from: "stt", to: "safety", data: "transcript + tone" },
      { from: "api", to: "safety", data: "turn" },
      { from: "rag", to: "gemini", data: "passages" },
      { from: "mem", to: "gemini", data: "user summary" },
      { from: "safety", to: "gemini", data: "routed prompt" },
      { from: "gemini", to: "mem", data: "updated summary" },
      { from: "gemini", to: "tts", data: "reply text" },
      { from: "tts", to: "ui", data: "text + audio" },
    ],
  },

  /* ------------------------------------------------------------------ */
  "crypto-tweet-impact": {
    summary:
      "A seven-stage R pipeline in one Quarto notebook. ~20k Musk tweets are keyword-filtered and scored by the OpenAI API for sentiment and category, then joined by date with DOGE and BTC daily prices from Yahoo Finance. An event study compares 1/3/7/30-day returns against a seeded random baseline, corrected with Bonferroni/FDR and a power analysis, and renders to a Quarto report, LaTeX PDFs and a Shiny dashboard.",
    stages: ["ingest", "label", "join", "test", "correct", "report"],
    nodes: [
      { id: "tweets", label: "Musk tweets", tech: "~20k posts", kind: "source", col: 0, row: 0, at: "overview" },
      { id: "prices", label: "Yahoo Finance", tech: "quantmod · DOGE / BTC", kind: "source", col: 0, row: 2, at: "overview" },
      { id: "llm", label: "LLM classifier", tech: "OpenAI · sentiment 0–10", kind: "model", col: 1, row: 0, at: "llm-in-the-loop-tweet-classification" },
      { id: "verify", label: "Hand verification", tech: "the two coins that matter", kind: "eval", col: 2, row: 0, at: "llm-in-the-loop-tweet-classification" },
      { id: "join", label: "Join on date", tech: "1/3/7/30-day returns", kind: "transform", col: 3, row: 1, at: "statistical-rigor" },
      { id: "event", label: "Event study", tech: "vs seeded random baseline", kind: "eval", col: 4, row: 0.4, at: "statistical-rigor" },
      { id: "fdr", label: "Bonferroni · FDR", tech: "+ power analysis", kind: "eval", col: 5, row: 0.4, at: "statistical-rigor" },
      { id: "vol", label: "Volume → volatility", tech: "BTC · p ≈ 0.15", kind: "eval", col: 4, row: 1.8, at: "tweet-volume-and-volatility" },
      { id: "shiny", label: "Shiny dashboard", tech: "per-tweet replay", kind: "ui", col: 6, row: 1.8, at: "interactive-shiny-dashboard" },
      { id: "quarto", label: "Quarto + LaTeX", tech: "make report", kind: "serve", col: 6, row: 0.4, at: "engineering-reproducibility" },
    ],
    edges: [
      { from: "tweets", to: "llm", data: "keyword-filtered posts" },
      { from: "llm", to: "verify", data: "sentiment_classified.csv" },
      { from: "verify", to: "join", data: "labelled tweets" },
      { from: "prices", to: "join", data: "daily OHLCV" },
      { from: "join", to: "event", data: "event returns" },
      { from: "event", to: "fdr", data: "30+ p-values" },
      { from: "join", to: "vol", data: "daily tweet counts" },
      { from: "fdr", to: "quarto", data: "corrected findings" },
      { from: "join", to: "shiny", data: "tweet × price path" },
    ],
  },

  /* ------------------------------------------------------------------ */
  "federated-iot": {
    summary:
      "Each IoT client trains a dual-model pipeline on its own traffic: a tabular Transformer with LoRA adapters and an XGBoost specialist run in parallel, and an MLP fusion head learns how to weight their probability vectors. Only the LoRA adapter weights travel to the server for federated averaging, which keeps communication low while the hybrid handles both subtle and volumetric attacks.",
    stages: ["data", "client models", "fuse", "federate", "evaluate"],
    nodes: [
      { id: "data", label: "IoT traffic", tech: "per-client partitions", kind: "source", col: 0, row: 1, at: "dataset-preparation" },
      { id: "tf", label: "Transformer + LoRA", tech: "tabular attention", kind: "model", col: 1, row: 0.3, at: "model-components" },
      { id: "xgb", label: "XGBoost", tech: "volumetric specialist", kind: "model", col: 1, row: 1.7, at: "model-components" },
      { id: "fuse", label: "Fusion head", tech: "learnable MLP gate", kind: "model", col: 2, row: 1, at: "model-components" },
      { id: "server", label: "Federated server", tech: "aggregates adapters", kind: "ops", col: 3, row: 1, at: "federated-methodology" },
      { id: "res", label: "Evaluation", tech: "accuracy · per-attack F1", kind: "eval", col: 4, row: 0.4, at: "experimental-results" },
      { id: "comm", label: "Communication cost", tech: "LoRA-only updates", kind: "eval", col: 4, row: 1.8, at: "communication-analysis" },
    ],
    edges: [
      { from: "data", to: "tf", data: "feature rows" },
      { from: "data", to: "xgb", data: "structured fields" },
      { from: "tf", to: "fuse", data: "class probabilities" },
      { from: "xgb", to: "fuse", data: "class probabilities" },
      { from: "fuse", to: "server", data: "LoRA + head weights" },
      { from: "server", to: "tf", data: "global adapters" },
      { from: "server", to: "res", data: "global model" },
      { from: "server", to: "comm", data: "bytes per round" },
    ],
  },

  /* ------------------------------------------------------------------ */
  hotspot: {
    summary:
      "A single-page Streamlit app over four public datasets: Chicago influenza surveillance, ILI risk by ZIP, CDC FluSurv-NET age rates and population. data_processing.py owns every loader and the exposure model and is cached with @st.cache_data; streamlit_app.py is pure presentation. A clicked ZIP drives six metric cards, and an uploaded Google Timeline is spatially joined to ZIPs to turn time × activity × local case rate into a personal exposure probability.",
    stages: ["sources", "process", "model", "present"],
    nodes: [
      { id: "cdph", label: "Chicago surveillance", tech: "weekly ILI", kind: "source", col: 0, row: 0, at: "overview" },
      { id: "cdc", label: "CDC + population", tech: "FluSurv-NET · census", kind: "source", col: 0, row: 1.4, at: "seasonal-demographic-analytics" },
      { id: "timeline", label: "Google Timeline", tech: "user upload · JSON", kind: "source", col: 0, row: 2.6, at: "the-differentiator-personal-exposure-probability" },
      { id: "proc", label: "data_processing.py", tech: "@st.cache_data", kind: "transform", col: 1, row: 0.8, at: "data-engineering" },
      { id: "geo", label: "GeoJSON merge", tech: "56 ZIPs · 112 files", kind: "transform", col: 2, row: 0, at: "the-geospatial-centerpiece" },
      { id: "join", label: "Spatial join", tech: "GeoPandas", kind: "transform", col: 1, row: 2.6, at: "the-differentiator-personal-exposure-probability" },
      { id: "expo", label: "Exposure model", tech: "1 − exp(−risk/600)", kind: "model", col: 2, row: 2, at: "the-differentiator-personal-exposure-probability" },
      { id: "map", label: "Choropleth map", tech: "Plotly", kind: "ui", col: 3, row: 0, at: "the-geospatial-centerpiece" },
      { id: "cards", label: "Metric cards", tech: "6 per ZIP", kind: "ui", col: 3, row: 1.2, at: "metric-cards-neighborhood-drill-down" },
    ],
    edges: [
      { from: "cdph", to: "proc", data: "case counts" },
      { from: "cdc", to: "proc", data: "age rates · population" },
      { from: "proc", to: "geo", data: "ZIP-level metrics" },
      { from: "geo", to: "map", data: "GeoJSON + levels" },
      { from: "map", to: "cards", data: "selected ZIP" },
      { from: "proc", to: "cards", data: "week metrics" },
      { from: "timeline", to: "join", data: "location points" },
      { from: "join", to: "expo", data: "ZIP × time × activity" },
      { from: "proc", to: "expo", data: "local case rate" },
      { from: "expo", to: "cards", data: "exposure probability" },
    ],
  },

  /* ------------------------------------------------------------------ */
  "image-retrieval": {
    summary:
      "Caltech101 images are resized, augmented and normalised, then fed to a ResNet-50 fine-tuned in its last residual block. Its classifier is replaced by an embedding head (2048 → 512 → 128 with batch-norm, ReLU and dropout) that serves both a 101-class classifier and retrieval: normalised 128-d embeddings are indexed in FAISS, so a query image returns its nearest neighbours in milliseconds.",
    stages: ["data", "prepare", "encode", "embed", "index", "query"],
    nodes: [
      { id: "ds", label: "Caltech101", tech: "9k images · 101 classes", kind: "source", col: 0, row: 1, at: "dataset" },
      { id: "aug", label: "Preprocess", tech: "224² · augment · normalise", kind: "transform", col: 1, row: 1, at: "data-preprocessing" },
      { id: "resnet", label: "ResNet-50", tech: "progressive unfreezing", kind: "model", col: 2, row: 1, at: "data-preprocessing" },
      { id: "head", label: "Embedding head", tech: "2048 → 512 → 128", kind: "model", col: 3, row: 1, at: "performance" },
      { id: "cls", label: "Classifier", tech: "96.95% val acc", kind: "eval", col: 4, row: 0, at: "performance" },
      { id: "faiss", label: "FAISS index", tech: "normalised vectors", kind: "store", col: 4, row: 2, at: "faiss-vector-indexing" },
      { id: "q", label: "Similar images", tech: "top-k neighbours", kind: "serve", col: 5, row: 2, at: "faiss-vector-indexing" },
    ],
    edges: [
      { from: "ds", to: "aug", data: "images" },
      { from: "aug", to: "resnet", data: "tensors" },
      { from: "resnet", to: "head", data: "2048-d features" },
      { from: "head", to: "cls", data: "128-d embedding" },
      { from: "head", to: "faiss", data: "128-d embedding" },
      { from: "faiss", to: "q", data: "nearest ids" },
    ],
  },

  /* ------------------------------------------------------------------ */
  "online-retail": {
    summary:
      "One codebase, two modes. run_pipeline.py takes --source csv|snowflake and --sink local|bigquery, and the transform in between never changes: clean_data.py is a pure Polars function that reshapes ~540k invoice lines into a tested star schema with surrogate keys. analysis.py computes KPIs, RFM segments and cohort retention into pre-aggregated exports that Looker Studio reads as CSVs offline or BigQuery views in the cloud. GitHub Actions runs ruff and pytest with no credentials.",
    stages: ["source", "transform", "sink", "analyse", "report"],
    nodes: [
      { id: "csv", label: "UCI CSV", tech: "offline · no creds", kind: "source", col: 0, row: 0, at: "the-dataset-and-the-questions" },
      { id: "snow", label: "Snowflake", tech: "RAW_ONLINE_RETAIL", kind: "source", col: 0, row: 1.6, at: "cloud-integration-snowflake-to-bigquery" },
      { id: "star", label: "Star schema", tech: "Polars · pure function", kind: "transform", col: 1, row: 0.8, at: "transformation-the-star-schema" },
      { id: "dq", label: "Quality rules", tech: "guests · grain · returns", kind: "eval", col: 2, row: 2, at: "data-quality-decisions-that-defend-the-numbers" },
      { id: "parquet", label: "Local parquet", tech: "data/*.parquet", kind: "store", col: 2, row: 0, at: "transformation-the-star-schema" },
      { id: "bq", label: "BigQuery", tech: "WRITE_TRUNCATE", kind: "store", col: 2, row: 1, at: "cloud-integration-snowflake-to-bigquery" },
      { id: "kpi", label: "analysis.py", tech: "KPIs · RFM · cohorts", kind: "transform", col: 3, row: 0.5, at: "headline-kpis" },
      { id: "looker", label: "Looker Studio", tech: "4 export tables", kind: "ui", col: 4, row: 0.5, at: "the-looker-studio-reporting-layer" },
      { id: "ci", label: "GitHub Actions", tech: "ruff · pytest", kind: "ops", col: 3, row: 2, at: "testing-and-ci" },
    ],
    edges: [
      { from: "csv", to: "star", data: "invoice lines" },
      { from: "snow", to: "star", data: "Arrow batches" },
      { from: "star", to: "dq", data: "fact + dim tables" },
      { from: "star", to: "parquet", data: "--sink local" },
      { from: "star", to: "bq", data: "--sink bigquery" },
      { from: "parquet", to: "kpi", data: "star schema" },
      { from: "bq", to: "kpi", data: "star schema" },
      { from: "kpi", to: "looker", data: "CSV / vw_* views" },
      { from: "dq", to: "ci", data: "fixtures + tests" },
    ],
  },

  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  "traffic-prediction": {
    summary:
      "Caltrans PeMS loop-detector flow is regex-parsed, merged from 80+ exports and KNN-imputed, then a Random Forest predicts congestion for a timestamp. That prediction and a news-incident multiplier (NewsAPI + scraped SF Chronicle) scale an OSRM duration matrix for 50 San Francisco stops, and Google OR-Tools solves an 8-vehicle routing problem from a City Hall depot. Folium draws an OSRM-snapped route per truck.",
    stages: ["sources", "prepare", "predict", "price", "solve", "draw"],
    nodes: [
      { id: "pems", label: "Caltrans PeMS", tech: "5-min loop detectors", kind: "source", col: 0, row: 0.4, at: "the-dataset-preprocessing" },
      { id: "news", label: "Incident news", tech: "NewsAPI · SF Chronicle", kind: "source", col: 0, row: 2, at: "pricing-congestion-into-travel-time" },
      { id: "etl", label: "ETL", tech: "regex · KNN impute", kind: "transform", col: 1, row: 0.4, at: "the-dataset-preprocessing" },
      { id: "eda", label: "EDA", tech: "daily + weekly cycles", kind: "eval", col: 2, row: 0, at: "exploratory-data-analysis" },
      { id: "rf", label: "Random Forest", tech: "congestion forecast", kind: "model", col: 2, row: 1, at: "forecasting-traffic-with-machine-learning" },
      { id: "osrm", label: "OSRM matrix", tech: "50 SF stops", kind: "serve", col: 3, row: 2, at: "a-real-road-network-with-osrm" },
      { id: "price", label: "Cost multipliers", tech: "ML × news", kind: "transform", col: 3, row: 1, at: "pricing-congestion-into-travel-time" },
      { id: "vrp", label: "OR-Tools VRP", tech: "8 vehicles · 10 s", kind: "model", col: 4, row: 1, at: "fleet-optimization-with-google-or-tools" },
      { id: "map", label: "Folium map", tech: "route per truck", kind: "ui", col: 5, row: 1, at: "visualizing-the-fleet" },
    ],
    edges: [
      { from: "pems", to: "etl", data: "raw text + Excel" },
      { from: "etl", to: "eda", data: "clean flow" },
      { from: "etl", to: "rf", data: "features" },
      { from: "rf", to: "price", data: "predicted flow ÷ 150" },
      { from: "news", to: "price", data: "1.3× if incidents" },
      { from: "osrm", to: "price", data: "duration table" },
      { from: "price", to: "vrp", data: "time-dependent costs" },
      { from: "vrp", to: "map", data: "routes" },
      { from: "osrm", to: "map", data: "snapped polylines" },
    ],
  },

  /* ------------------------------------------------------------------ */
  saturdae: {
    summary:
      "A modular Python application. The main module runs the input loop; the voice module parses spoken commands (NLTK) in the patented design, while the repository code takes the same commands from a menu; the furniture module draws rooms, walls and objects with turtle; the check module keeps a NumPy occupancy grid to block overlaps; the recommendation module proposes room and furniture positions; and the delete module removes items. Each placement is previewed before it is committed to the plan.",
    stages: ["input", "parse", "validate", "draw", "suggest"],
    nodes: [
      { id: "voice", label: "Command input", tech: "voice (patent) · menu (code)", kind: "source", col: 0, row: 1, at: "overview" },
      { id: "main", label: "Main module", tech: "input loop", kind: "agent", col: 1, row: 1, at: "approach" },
      { id: "nlp", label: "Voice module", tech: "NLTK parsing", kind: "transform", col: 2, row: 0, at: "approach" },
      { id: "check", label: "Check module", tech: "NumPy occupancy grid", kind: "eval", col: 2, row: 2, at: "approach" },
      { id: "draw", label: "Furniture module", tech: "turtle rendering", kind: "ui", col: 3, row: 1, at: "approach" },
      { id: "rec", label: "Recommendations", tech: "rooms · halls", kind: "model", col: 4, row: 0, at: "approach" },
      { id: "del", label: "Delete module", tech: "remove items", kind: "ops", col: 4, row: 2, at: "approach" },
      { id: "ext", label: "Extensions", tech: "new object = drawing + footprint", kind: "ops", col: 5, row: 1, at: "approach" },
    ],
    edges: [
      { from: "voice", to: "main", data: "utterance" },
      { from: "main", to: "nlp", data: "command text" },
      { from: "nlp", to: "check", data: "object + position" },
      { from: "check", to: "draw", data: "valid placement" },
      { from: "draw", to: "rec", data: "current layout" },
      { from: "rec", to: "main", data: "suggested positions" },
      { from: "main", to: "del", data: "remove request" },
      { from: "draw", to: "ext", data: "plugin points" },
    ],
  },
};

export function getPipeline(slug: string): Pipeline | null {
  return PIPELINES[slug] ?? null;
}
