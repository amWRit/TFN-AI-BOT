# 🚀 TFN-AI Setup Guide - Step by Step

## Step 1: Install Python Dependencies

```powershell
pip install pypdf langchain-text-splitters langchain-community
```

**Expected Output:**
```
Successfully installed pypdf-4.x.x langchain-text-splitters-0.x.x langchain-community-0.x.x
```

---

## Step 2: Place Your PDF Files

Copy your PDF documents to the project root directory:

```
c:\Users\ark\Desktop\PythonSrc\Alumni-RAG-Project -Vercel\
├── preprocess_docs.py          ← This file
├── LF-Policy.pdf               ← Add your PDFs here
├── handbook.pdf                ← Add more PDFs here
└── ... other files
```

---

## Step 3: Run PDF Preprocessing

```powershell
python preprocess_docs.py
```

**Expected Output:**
```
============================================================
TFN-AI RAG Document Preprocessing
============================================================

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
============================================================
✅ Preprocessing Complete!
============================================================
```

**What it does:**
- ✅ Finds all PDF files in the directory
- ✅ Extracts text from each PDF
- ✅ Splits text into 1000-character chunks (200-char overlap)
- ✅ Saves chunks to `public/tfn-documents.json`
- ✅ Each chunk includes: id, content, source, page number

**Verify the output:**
```powershell
Get-Content public/tfn-documents.json | ConvertFrom-Json | Measure-Object
```

---

## Step 4: Configure AWS Credentials

### Option A: Using Environment File (Recommended)

1. Copy the example file:
```powershell
Copy-Item .env.local.example .env.local
```

2. Edit `.env.local` with your AWS credentials:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SESSION_TOKEN=AQoDYXdzEJr..EXAMPLETOKEN
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
LLM_TEMPERATURE=0.1
```

### Option B: Using PowerShell Environment Variables

```powershell
$env:AWS_REGION = "us-east-1"
$env:AWS_ACCESS_KEY_ID = "your_key"
$env:AWS_SECRET_ACCESS_KEY = "your_secret"
```

**Get your AWS credentials:**
- Open AWS Console → Security Credentials
- Create Access Key (or use temporary credentials)
- Copy Access Key ID and Secret Access Key

---

## Step 5: Install Node Dependencies

```powershell
npm install
```

**This will add:**
- `@langchain/aws` - Bedrock integration
- `@langchain/community` - Document loaders
- `@langchain/core` - Core LangChain
- Other dependencies (React, Next.js, etc.)

---

## Step 6: Start Development Server

```powershell
npm run dev
```

**Expected Output:**
```
> tfn-ai-vercel@1.0.0 dev
> next dev

  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

## Step 7: Test the Application

### In Browser
- Open `http://localhost:3000`
- Ask: "What are TFN's core values?"
- Should see: AI response with PDF sources

### Via Terminal (cURL)
```powershell
$query = "What are TFN programs?"
$body = @{"query" = $query} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/rag-alumni" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body | ConvertFrom-Json | ConvertTo-Json
```

---

## 🎯 Workflow Summary

```
1. python preprocess_docs.py
        ↓
   Creates: public/tfn-documents.json
        ↓
2. npm run dev
        ↓
   Starts: http://localhost:3000
        ↓
3. User asks a question in the UI
        ↓
   Next.js API loads tfn-documents.json
        ↓
4. AWS Bedrock:
   - Creates embeddings (Titan v2)
   - Vector searches for relevant chunks
   - Generates answer (Nova Lite LLM)
        ↓
5. Answer displayed with source citations
```

---

## ✅ Checklist

- [ ] Python dependencies installed (`pip install ...`)
- [ ] PDF files placed in project root
- [ ] Preprocessing completed (`python preprocess_docs.py`)
- [ ] `public/tfn-documents.json` generated
- [ ] `.env.local` created with AWS credentials
- [ ] AWS credentials are valid (not expired)
- [ ] Node dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Tested in browser at `http://localhost:3000`

---

## 🐛 Common Issues & Solutions

### Issue: "No PDF files found"
**Solution:** 
- Check PDF files are in the same directory as `preprocess_docs.py`
- Files must end with `.pdf` (case-sensitive on Linux)

### Issue: "No documents available" error in UI
**Solution:**
- Run `python preprocess_docs.py` again
- Check `public/tfn-documents.json` exists
- Restart the dev server: `npm run dev`

### Issue: "AWS credentials not configured"
**Solution:**
- Copy `.env.local.example` → `.env.local`
- Fill in actual AWS credentials
- Restart dev server
- Check `.env.local` is NOT in `.gitignore`

### Issue: Bedrock not available in region
**Solution:**
- Check region availability: AWS Console → Bedrock → Available Models
- Common regions: `us-east-1`, `us-west-2`, `eu-west-1`
- Update `AWS_REGION` in `.env.local`

### Issue: Slow first query
**Solution:**
- First run initializes vector store (normal - takes 30-60s)
- Subsequent queries are faster (~2-3s)

---

## 📊 What Gets Stored

After running `preprocess_docs.py`, `public/tfn-documents.json` contains:

```json
[
  {
    "id": "doc_0",
    "content": "TFN core values: Innovation, Integrity, Impact...",
    "source": "TFN-Policy.pdf",
    "type": "pdf",
    "page": 1
  },
  {
    "id": "doc_1",
    "content": "Fellowship Program: 2-year teaching fellowship for...",
    "source": "handbook.pdf",
    "type": "pdf",
    "page": 5
  }
  // ... more chunks
]
```

---

## 🎓 Understanding the Process

1. **Preprocessing** (Python)
   - Reads PDFs
   - Splits into manageable chunks
   - Exports as JSON for frontend

2. **Retrieval** (Bedrock Embeddings)
   - User's question converted to embeddings
   - Finds 3 most relevant chunks from JSON
   - Passes to LLM

3. **Generation** (Bedrock LLM)
   - Reads user query + relevant chunks
   - Generates answer using Nova Lite
   - Returns with source citations

---

## 📞 Support

If you need help:
1. Check the troubleshooting section above
2. Review the main `README_RAG.md`
3. Check console output for error messages
4. Verify all steps in the checklist above

---

Good luck! 🎉
