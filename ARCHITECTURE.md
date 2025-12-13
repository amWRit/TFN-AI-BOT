# ---

## Hybrid RAG Flow Explained

The backend implements a **hybrid RAG (Retrieval-Augmented Generation) flow**:

- **Structured Retrieval:** For queries about known entities (alumni, fellows, schools, etc.), the API fetches relevant records directly from structured_data.json and returns them as cards, with optional pagination ("View More").
- **Unstructured RAG:** For open-ended or policy questions, the API uses LangChain to retrieve the most relevant text chunks from the FAISS vector store (built from PDFs and unstructured data). These chunks are injected as context into the LLM prompt.
- **Hybrid Handling:** If a query could match both (e.g., "Show alumni who worked on X policy"), the backend combines structured filtering with unstructured retrieval, then augments the LLM prompt with both types of context.
- **LLM Generation:** The Bedrock LLM (via LangChain) generates an answer using only the provided context, always citing sources. This ensures answers are grounded in your data, not hallucinated.

This hybrid approach allows the system to:
- Return fast, accurate lists for structured queries
- Provide rich, context-aware answers for open-ended questions
- Seamlessly combine both when needed
# ---

## Query Flow Overview

### What Happens When You Submit a Query?

```
User submits query in UI
   │
   ▼
Frontend sends POST to /api/rag-alumni
   │
   ▼
route.js receives request
   │
   ▼
┌─────────────────────────────┐
│ 1. Analyze query type       │
└────────────┬────────────────┘
        │
 ┌───────────▼─────────────┐
 │ Structured query?       │
 └───────┬───────┬─────────┘
    │       │
   Yes   │       │   No
    │       │
    ▼       ▼
Fetch relevant  Run vector search
records from    over unstructured
structured data data (FAISS)
    │       │
    ▼       ▼
Format context   Format context
for LLM         for LLM
    │       │
    └───┬───┘
        ▼
Build PDO prompt (Persona, Data, Objective)
        │
        ▼
Call Bedrock LLM (Nova Lite)
        │
        ▼
Parse and format answer (with sources, context, hasMore, totalCount)
        │
        ▼
Return response to frontend
        │
        ▼
Display answer, sources, and (if structured) "View More" in UI
```

---

## Example Use Cases

### 1. Structured Query (Alumni List)

**User:** "List all TFN alumni in 2022"

- Query is detected as structured (alumni)
- route.js fetches alumni records for 2022 from structured_data.json
- Returns first 10 results, with hasMore=true if more exist
- Frontend shows cards for each alumni, with "View More" button

### 2. Unstructured Query (Policy Question)

**User:** "What are the core values of TFN?"

- Query is detected as unstructured
- route.js runs vector search over FAISS index (unstructured_chunks.json)
- Retrieves top-k relevant chunks
- Builds PDO prompt and calls LLM
- LLM generates answer, citing PDF and page
- Frontend displays answer and sources

### 3. Mixed Query (School Details)

**User:** "Show me all partner schools in Kathmandu"

- Query matches structured data (schools)
- route.js filters schools by location (Kathmandu)
- Returns paginated list of schools, with context and sources

---
# ---

## Backend Orchestration & Prompt Engineering

### How `route.js` Works

- The main API endpoint (`app/api/rag-alumni/route.js`) handles all user queries.
- It loads the FAISS vector store and structured/unstructured data on startup.
- On each request:
   1. **Query Analysis:** Determines if the query targets structured data (e.g., alumni, fellows) or requires unstructured RAG.
   2. **Hybrid Retrieval:**
       - For structured queries: fetches relevant records, supports pagination ("View More").
       - For unstructured queries: uses LangChain's retriever to find top-k relevant chunks from the vector store.
   3. **Prompt Construction:**
       - Uses PDO (Persona, Data, Objective) prompt engineering:
          - **Persona:** System prompt defines the AI as a TFN assistant, with clear role and tone.
          - **Data:** Injects only the retrieved context (structured or unstructured) into the prompt.
          - **Objective:** Clearly states the user's question and instructs the LLM to answer concisely, always citing sources.
   4. **LLM Orchestration:**
       - LangChain chains together the retriever and LLM (Bedrock Nova Lite) using a RAG pipeline.
       - Handles all API calls, error handling, and response formatting.
   5. **Response:**
       - Returns answer, sources, context, hasMore, and totalCount to the frontend.

### Use of LangChain

- LangChain is used for:
   - Document loading and chunking (in preprocessing scripts)
   - Vector store management (FAISS)
   - Retriever orchestration (hybrid search)
   - Prompt templating and LLM chaining (RAG pipeline)
   - Error handling and fallback logic

### Prompt Engineering (PDO)

- **Persona:**
   - The system prompt always frames the LLM as a helpful, accurate TFN assistant.
- **Data:**
   - Only retrieved, relevant context is provided to the LLM (never the full corpus).
- **Objective:**
   - Prompts instruct the LLM to answer the user's question, cite sources, and avoid speculation.

### Project Requirements Mapping

- ✅ **LangChain for orchestration:** Used throughout backend and preprocessing.
- ✅ **Retrieval-Augmented Generation (RAG):** Hybrid search over structured and unstructured data, with LLM generation.
- ✅ **PDO Prompt Engineering:** All prompts follow Persona, Data, Objective best practices.
# 🏗️ TFN-AI Architecture & Integration

## System Architecture

```

# TFN-AI Architecture (2025)

## Overview

TFN-AI is a hybrid RAG (Retrieval-Augmented Generation) chatbot for Teach For Nepal, supporting both unstructured (PDFs) and structured (staff, alumni, fellows, schools, partners) data. It uses a Next.js frontend, a Node.js/Next.js API backend, Python preprocessing, and AWS Bedrock for embeddings and LLM.

---

## System Components

**Frontend:**
- Next.js 14+ (React, Tailwind CSS)
- `app/page.js` (UI, chat, quick actions, adaptive cards, "View More" logic)

**Backend API:**
- `app/api/rag-alumni/route.js` (RAG endpoint, hybrid search, error handling)

**Preprocessing Pipeline:**
- Python scripts in `scripts/` (preprocess_docs.py, index_builder.py, scraper.py)
- Reads PDFs from `data/structured/` and `data/unstructured/`
- Extracts, chunks, and combines structured and unstructured data
- Outputs: `public/vector-store/index.faiss`, `public/json/structured_data.json`, etc.

**Vector Store:**
- FAISS (no Chroma fallback)
- Pre-built with all data, loaded at runtime

**Structured Data:**
- staff, alumni, fellows, schools, partners (from PDFs and web scraping)
- Unified in `public/json/structured_data.json` and indexed in FAISS

**Environment:**
- `.env.local` for AWS credentials and config

---

## Data Flow

1. **Preprocessing (Python, local):**
   - Run `python scripts/pipeline.py` to orchestrate the full pipeline:
     - Runs `scraper.py` to collect and update structured data
     - Runs `preprocess_docs.py` (and/or `structured_preprocessor.py`, `unstructured_preprocessor.py`) to extract and chunk data
     - Runs `index_builder.py` to build the FAISS vector index
   - All outputs are placed in `public/vector-store/` and `public/json/`
   - Place PDFs and data in `data/structured/` and `data/unstructured/`
   - Outputs: `public/vector-store/index.faiss`, `public/json/structured_data.json`, etc.

2. **Runtime (User Query):**
   - User enters query in web UI
   - Frontend sends POST to `/api/rag-alumni` with `{query}`
   - Backend loads FAISS vector store and structured data
   - Hybrid search: detects if query matches structured patterns (staff, alumni, etc.)
   - If structured: returns top 10 results, with "View More" support (pagination)
   - If unstructured: RAG search over PDF chunks
   - LLM (Bedrock Nova Lite) generates answer, always citing sources
   - Response includes: answer, sources, context, hasMore, totalCount

3. **Frontend Rendering:**
   - Adaptive cards for structured data (staff, alumni, fellows, schools, partners)
   - "View More" button for large lists (fetches all results)
   - Source citations for all answers

---

## Key Features

- Hybrid RAG: combines structured and unstructured data
- Responsive UI with quick actions, adaptive cards, and pagination
- Robust error handling (AWS credentials, missing data, etc.)
- Modular Python pipeline for preprocessing, scraping, and indexing
- Secure: no credentials in repo, `.env.local` required

---

## Deployment & Setup

1. Clone repo and install dependencies:
   - `pip install -r scripts/requirements.txt`
   - `npm install`
2. Place PDFs in `data/structured/` and `data/unstructured/`
3. Run preprocessing:
   - `python scripts/preprocess_docs.py`
4. Configure `.env.local` with AWS Bedrock credentials
5. Start dev server:
   - `npm run dev`
6. Open `http://localhost:3000` and test

---

## Error Handling

- Expired/missing AWS credentials: clear cache, show error in UI
- No vector store: prompt to run preprocessing
- Bedrock/embedding errors: clear cache, show error

---

## Project Structure (2025)

```
TFN-AI-BOT/
├── app/
│   ├── globals.css
│   ├── layout.js
│   ├── page.js
│   └── api/rag-alumni/route.js
├── data/
│   ├── structured/
│   └── unstructured/
├── public/
│   ├── json/
│   │   ├── structured_data.json
│   │   ├── unstructured_chunks.json
│   │   └── ...
│   └── vector-store/
│       ├── index.faiss
│       └── ...
├── scripts/
│   ├── preprocess_docs.py
│   ├── index_builder.py
│   ├── scraper.py
│   ├── requirements.txt
│   └── ...
├── .env.local
├── README.md
├── ARCHITECTURE.md
├── PROJECT_STRUCTURE.md
└── ...
```

---

## Credits

- Built with Next.js, LangChain, AWS Bedrock, FAISS, and Python
- 2025 Teach For Nepal
├─ Fetch documents: 0.1s
├─ Semantic search: 2s
├─ Build prompt: 0.2s
├─ LLM inference: 2s
└─ Format response: 0.1s
   ═════════════════════
   Total: ~4-5 seconds
```

---

## Integration Checklist

- [x] PDF preprocessing pipeline
- [x] AWS Bedrock embeddings integration
- [x] Vector store initialization
- [x] Semantic search implementation
- [x] LLM prompt engineering
- [x] Response formatting with sources
- [x] Error handling and logging
- [x] Environment configuration
- [x] Mock mode fallback
- [x] Production-ready code

---

This architecture ensures:
✅ Fast semantic search  
✅ Accurate context retrieval  
✅ High-quality LLM responses  
✅ Complete source attribution  
✅ Robust error handling  
✅ Easy configuration  
✅ Scalable design  
