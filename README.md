
# TFN-AI: Teach For Nepal RAG Chatbot

**Hybrid RAG chatbot for Teach For Nepal.**

---

## Features

- Retrieval-augmented generation (RAG) over PDFs and structured data (staff, alumni, fellows, schools, partners)
- Next.js 14+ frontend (React, Tailwind CSS)
- Node.js API backend (Bedrock LLM, FAISS vector store)
- Python preprocessing pipeline (scripts/)
- Secure: AWS Bedrock credentials via `.env.local`
- Adaptive UI: quick actions, structured cards, "View More" for large lists
- Robust error handling and modular design

---

## Setup & Deployment

### 1. Clone the repository

```
git clone <repo-url>
cd TFN-AI-BOT
```

### 2. Install dependencies

```
pip install -r scripts/requirements.txt
npm install
```

### 3. Add your data

- Place PDFs and structured data in:
	- `data/structured/` (for staff, alumni, fellows, schools, partners)
	- `data/unstructured/` (for general documents)

### 4. Preprocess data

Run the preprocessing pipeline to extract, chunk, and embed all data:

```
python scripts/preprocess_docs.py
```

This will generate:
- `public/vector-store/index.faiss` (vector index)
- `public/json/structured_data.json` (structured data)
- `public/json/unstructured_chunks.json` (unstructured chunks)

### 5. Configure AWS Bedrock credentials

Create a `.env.local` file in the project root (see `.env.local.example`):

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=nova-lite
LLM_TEMPERATURE=0.1
```

### 6. Start the development server

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

- Enter questions in the chat UI (e.g., "List all TFN alumni in 2022")
- For large lists (alumni, fellows, schools), use "View More" to expand results
- All answers cite sources (PDF, page, or structured record)

---

## Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for full details.

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

## Security & Credentials

- **Never commit `.env.local` or credentials to version control.**
- All sensitive config is loaded from environment variables.

---

## Troubleshooting

- **Missing vector store or data?**  Run `python scripts/preprocess_docs.py` again.
- **AWS errors?**  Check `.env.local` and your Bedrock permissions.
- **Frontend not loading?**  Ensure `npm run dev` is running and all dependencies are installed.

---

## Workflow Summary

1. `python scripts/preprocess_docs.py` → creates `public/vector-store/index.faiss` and JSON files
2. `npm run dev` → starts Next.js server
3. User asks a question in the UI
4. Backend loads vector store and structured data, runs hybrid search
5. AWS Bedrock: Titan v2 embeddings, Nova Lite LLM
6. Answer displayed with source citations

---

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): System design, data flow, error handling
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md): Directory and file layout

---

## Credits

- Built with Next.js, LangChain, AWS Bedrock, FAISS, and Python
- 2025 Teach For Nepal
