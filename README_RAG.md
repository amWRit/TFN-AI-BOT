# TFN-AI: Bedrock-Powered RAG Chat

An AI-powered document search system for TFN using AWS Bedrock, LangChain, and Next.js.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- AWS Account with Bedrock access

### 1. Setup Python Environment

```bash
pip install pypdf langchain-text-splitters langchain-community
```

### 2. Add Your PDF Documents

Place your PDF files in the project root directory:
```
Alumni-RAG-Project -Vercel/
├── LF-Policy.pdf           # Your PDFs here
├── handbook.pdf
└── preprocess_docs.py
```

### 3. Preprocess Documents

Generate JSON chunks from PDFs:

```bash
python preprocess_docs.py
```

This will create `public/tfn-documents.json` with all document chunks ready for RAG.

**Output:**
```
📄 Found 2 PDF file(s):

   📖 Processing: LF-Policy.pdf
      ✓ Loaded 15 pages

   📖 Processing: handbook.pdf
      ✓ Loaded 8 pages

✓ Total 23 pages loaded

🔪 Chunking documents...
✓ Created 156 chunks

💾 Converting to JSON format...
✅ Exported 156 chunks to public/tfn-documents.json

🚀 Ready for Bedrock RAG!
```

### 4. Configure AWS Credentials

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
LLM_TEMPERATURE=0.1
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📊 How It Works

```
User Query
    ↓
[Next.js API Route]
    ↓
[Load tfn-documents.json] (PDF chunks)
    ↓
[Bedrock Embeddings] (Titan v2)
    ↓
[Vector Search] (Find 3 most relevant chunks)
    ↓
[Bedrock LLM] (Nova Lite/Pro)
    ↓
[Generate Answer with Sources]
    ↓
Response to User
```

---

## 🔧 Configuration

### Bedrock Models Available

**Embedding Models:**
- `amazon.titan-embed-text-v2:0` (Recommended)

**LLM Models:**
- `amazon.nova-lite-v1:0` (Fast, cost-effective)
- `amazon.nova-pro-v1:0` (Better quality)
- `amazon.claude-3-5-sonnet-20241022` (Advanced)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS Region | us-east-1 |
| `AWS_ACCESS_KEY_ID` | AWS Access Key | Required |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | Required |
| `AWS_SESSION_TOKEN` | Temporary credentials | Optional |
| `BEDROCK_MODEL_ID` | LLM Model ID | amazon.nova-lite-v1:0 |
| `LLM_TEMPERATURE` | Model creativity (0-1) | 0.1 |
| `CHROMA_URL` | Chroma DB URL | http://localhost:8000 |

---

## 📝 API Reference

### POST `/api/rag-alumni`

**Request:**
```json
{
  "query": "What are TFN's core values?"
}
```

**Response (Success):**
```json
{
  "answer": "TFN's core values are...",
  "sources": [
    {
      "source": "TFN-Policy.pdf",
      "page": 1,
      "content_preview": "TFN core values..."
    }
  ],
  "totalDocs": 156,
  "status": "success"
}
```

**Response (Error):**
```json
{
  "error": "AWS credentials not configured",
  "details": "...",
  "status": "error",
  "suggestion": "Please configure AWS credentials in .env.local"
}
```

---

## 🧪 Testing

### Test with cURL
```bash
curl -X POST http://localhost:3000/api/rag-alumni \
  -H "Content-Type: application/json" \
  -d '{"query": "What are TFN programs?"}'
```

### Test Locally (Mock Mode)
Uncomment the mock response in `app/api/rag-alumni/route.js`:

```javascript
// ==================== MOCK RESPONSE (Fallback) ====================
export async function POST(request) {
  // ... mock implementation
}
```

---

## 🐛 Troubleshooting

### "No documents available"
- Run `python preprocess_docs.py`
- Ensure PDFs are in the project root
- Check `public/tfn-documents.json` exists

### "AWS credentials not configured"
- Copy `.env.local.example` to `.env.local`
- Fill in AWS credentials
- Restart the dev server: `npm run dev`

### "Bedrock RAG query failed"
- Check AWS credentials validity
- Ensure Bedrock is available in your AWS region
- Check CloudWatch logs for detailed errors

### PDF Processing Issues
```bash
# Reinstall dependencies
pip install --upgrade pypdf langchain-text-splitters langchain-community

# Try individual PDF
python -c "from langchain_community.document_loaders import PyPDFLoader; print(PyPDFLoader('your_file.pdf').load())"
```

---

## 📚 References

- [LangChain AWS Integration](https://python.langchain.com/docs/integrations/llms/bedrock)
- [AWS Bedrock API](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html)
- [Chroma Vector Database](https://docs.trychroma.com/)

---

## 📄 License

MIT

---

## 💡 Notes

- **First Run:** The first query takes longer as it initializes the vector store
- **Cost:** Monitor AWS Bedrock usage - embeddings and LLM calls are metered
- **Rate Limits:** Bedrock may have rate limits; implement backoff strategies for production
- **Privacy:** All documents stay within your AWS account; no third-party APIs used

---

## 🎯 Next Steps

- [ ] Add more PDFs to `public/tfn-documents.json`
- [ ] Test with different Bedrock models
- [ ] Integrate persistent vector store (Chroma server)
- [ ] Add authentication to API
- [ ] Deploy to Vercel with AWS Secrets Manager
- [ ] Add document upload feature
- [ ] Implement conversation history
