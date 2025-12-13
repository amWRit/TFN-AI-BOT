
# Project Structure (2025)

## Directory Layout

```
TFN-AI-BOT/
├── app/
│   ├── globals.css
│   ├── layout.js
│   ├── page.js
│   └── api/rag-alumni/route.js
├── data/
│   ├── structured/           # PDFs and structured data (staff, alumni, etc.)
│   └── unstructured/         # General PDFs
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
├── .env.local.example
├── .env.local
├── package.json
├── README.md
├── ARCHITECTURE.md
├── PROJECT_STRUCTURE.md
└── ...
```

## Usage

From the project root:

```
# Install Python dependencies
pip install -r scripts/requirements.txt

# Preprocess all data (PDFs, structured, unstructured)
python scripts/preprocess_docs.py

# Install Node dependencies
npm install

# Run dev server
npm run dev
```

## Outputs

- `public/vector-store/index.faiss` — FAISS vector index
- `public/json/structured_data.json` — Structured data (staff, alumni, etc.)
- `public/json/unstructured_chunks.json` — Unstructured PDF chunks

## Security Note

**Never commit `.env.local` or credentials to version control.**
All sensitive config is loaded from environment variables.

---

The preprocessing script automatically finds the correct paths relative to where it's run from. All outputs are placed in the appropriate `public/` subfolders for use by the backend and frontend.
