#!/usr/bin/env python3
"""
TFN-AI RAG Preprocessing Script
Processes PDF documents and generates JSON chunks for Bedrock RAG

Usage:
    python scripts/preprocess_docs.py

Requirements:
    pip install pypdf langchain-text-splitters langchain-community
"""

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import json
import os
from pathlib import Path

def load_and_process_pdfs(pdf_folder="./data"):
    """
    Load PDFs from folder and process them into chunks
    
    Args:
        pdf_folder: Folder containing PDF files (default: ./data)
    
    Returns:
        List of processed document chunks
    """
    
    # Find all PDF files
    pdf_files = list(Path(pdf_folder).glob("*.pdf"))
    
    if not pdf_files:
        print("❌ No PDF files found in ./data folder")
        print("   Place your PDF files in the data/ folder")
        return []
    
    print(f"📄 Found {len(pdf_files)} PDF file(s):\n")
    
    all_docs = []
    for pdf_path in pdf_files:
        try:
            print(f"   📖 Processing: {pdf_path.name}")
            loader = PyPDFLoader(str(pdf_path))
            docs = loader.load()
            all_docs.extend(docs)
            print(f"      ✓ Loaded {len(docs)} pages\n")
        except Exception as e:
            print(f"      ❌ Error loading {pdf_path.name}: {e}\n")
            continue
    
    if not all_docs:
        print("❌ No documents loaded from PDFs")
        return []
    
    print(f"✓ Total {len(all_docs)} pages loaded")
    
    # Chunk documents for RAG
    print("\n🔪 Chunking documents...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = splitter.split_documents(all_docs)
    print(f"✓ Created {len(chunks)} chunks")
    
    # Convert to JSON format for Next.js
    print("\n💾 Converting to JSON format...")
    docs_json = []
    for i, chunk in enumerate(chunks):
        docs_json.append({
            "id": f"doc_{i}",
            "content": chunk.page_content,
            "source": chunk.metadata.get("source", "unknown").split("/")[-1],
            "type": "pdf",
            "page": chunk.metadata.get("page", 0) + 1  # Pages are 1-indexed
        })
    
    return docs_json

def save_documents(docs, output_path="./public/tfn-documents.json"):
    """
    Save processed documents to JSON file
    
    Args:
        docs: List of document chunks
        output_path: Output file path (relative to scripts folder)
    """
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(docs, f, indent=2, ensure_ascii=False)
        print(f"✅ Exported {len(docs)} chunks to public/tfn-documents.json")
        print(f"\n🚀 Ready for Bedrock RAG!")
        return True
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("TFN-AI RAG Document Preprocessing")
    print("=" * 60 + "\n")
    
    # Process PDFs
    docs = load_and_process_pdfs()
    
    if docs:
        # Save to JSON
        save_documents(docs)
        print("\n" + "=" * 60)
        print("✅ Preprocessing Complete!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("⚠️  No documents processed")
        print("=" * 60)
