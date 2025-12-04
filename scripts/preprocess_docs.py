#!/usr/bin/env python3
"""
TFN-AI RAG Preprocessing Script with Pre-computed Embeddings (FAISS Version)
Processes PDFs, generates embeddings, and saves vector store for instant loading

Usage:
    python scripts/preprocess_docs.py

Requirements:
    pip install pypdf langchain-text-splitters langchain-community langchain-aws boto3 faiss-cpu python-dotenv
"""

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_aws import BedrockEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.local file
load_dotenv('.env.local')

def load_and_process_pdfs(pdf_folder="./data"):
    """
    Load PDFs from folder and process them into chunks
    
    Args:
        pdf_folder: Folder containing PDF files (default: ./data)
    
    Returns:
        Tuple of (docs_json, langchain_documents)
    """
    
    # Find all PDF files
    pdf_files = list(Path(pdf_folder).glob("*.pdf"))
    
    if not pdf_files:
        print("❌ No PDF files found in ./data folder")
        print("   Place your PDF files in the data/ folder")
        return [], []
    
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
        return [], []
    
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
    langchain_docs = []
    
    for i, chunk in enumerate(chunks):
        # JSON format (for backward compatibility)
        docs_json.append({
            "id": f"doc_{i}",
            "content": chunk.page_content,
            "source": chunk.metadata.get("source", "unknown").split("/")[-1],
            "type": "pdf",
            "page": chunk.metadata.get("page", 0) + 1
        })
        
        # LangChain Document format (for embeddings)
        langchain_docs.append(Document(
            page_content=chunk.page_content,
            metadata={
                "id": f"doc_{i}",
                "source": chunk.metadata.get("source", "unknown").split("/")[-1],
                "type": "pdf",
                "page": chunk.metadata.get("page", 0) + 1
            }
        ))
    
    return docs_json, langchain_docs

def create_embeddings_and_vectorstore(documents, output_dir="./public/vector-store"):
    """
    Create embeddings and save vector store to disk using FAISS
    
    Args:
        documents: List of LangChain Document objects
        output_dir: Directory to save vector store
    """
    
    print("\n🧠 Creating embeddings with AWS Bedrock...")
    print("   (This may take 20-60 seconds depending on document count)")
    
    try:
        # Initialize Bedrock Embeddings
        embeddings = BedrockEmbeddings(
            model_id="amazon.titan-embed-text-v2:0",
            region_name=os.getenv("AWS_REGION", "us-east-1")
        )
        
        # Create vector store with FAISS
        print("   📊 Building FAISS vector store...")
        vectorstore = FAISS.from_documents(documents, embeddings)
        
        # Save to disk
        os.makedirs(output_dir, exist_ok=True)
        vectorstore.save_local(output_dir)
        
        # Convert docstore to JSON for Node.js compatibility
        import pickle
        pkl_path = os.path.join(output_dir, "index.pkl")
        json_path = os.path.join(output_dir, "docstore.json")
        
        try:
            with open(pkl_path, 'rb') as f:
                docstore_data = pickle.load(f)
            
            # Convert to JSON-serializable format
            docstore_json = {}
            if hasattr(docstore_data, '_dict'):
                # InMemoryDocstore format
                for key, doc in docstore_data._dict.items():
                    docstore_json[key] = {
                        "pageContent": doc.page_content,
                        "metadata": doc.metadata
                    }
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(docstore_json, f, ensure_ascii=False, indent=2)
            
            print(f"   ✓ Converted docstore to JSON format")
        except Exception as e:
            print(f"   ⚠️  Could not convert docstore to JSON: {e}")
        
        print(f"✅ Vector store saved to {output_dir}/")
        print(f"   Files created:")
        print(f"   - {output_dir}/index.pkl (Python format)")
        print(f"   - {output_dir}/index.faiss (FAISS index)")
        print(f"   - {output_dir}/docstore.json (Node.js format)")
        return True
        
    except Exception as e:
        print(f"❌ Error creating embeddings: {e}")
        print("\n⚠️  Make sure you have:")
        print("   1. AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)")
        print("   2. AWS_REGION set in your environment")
        print("   3. Bedrock access enabled for amazon.titan-embed-text-v2:0")
        print("   4. faiss-cpu installed: pip install faiss-cpu")
        return False

def save_documents_json(docs, output_path="./public/tfn-documents.json"):
    """
    Save processed documents to JSON file (backward compatibility)
    
    Args:
        docs: List of document chunks
        output_path: Output file path
    """
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(docs, f, indent=2, ensure_ascii=False)
        print(f"✅ Exported {len(docs)} chunks to {output_path}")
        return True
    except Exception as e:
        print(f"❌ Error saving JSON: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("TFN-AI RAG Document Preprocessing with Embeddings (FAISS)")
    print("=" * 60 + "\n")
    
    # Process PDFs
    docs_json, langchain_docs = load_and_process_pdfs()
    
    if docs_json:
        # Save JSON (backward compatibility)
        save_documents_json(docs_json)
        
        # Create and save embeddings + vector store
        print("\n" + "=" * 60)
        print("🚀 Creating Pre-computed Embeddings...")
        print("=" * 60)
        
        success = create_embeddings_and_vectorstore(langchain_docs)
        
        print("\n" + "=" * 60)
        if success:
            print("✅ Preprocessing Complete!")
            print("\n📦 Generated files:")
            print("   - public/tfn-documents.json (chunks)")
            print("   - public/vector-store/index.pkl (Python docstore)")
            print("   - public/vector-store/index.faiss (FAISS index)")
            print("   - public/vector-store/docstore.json (Node.js docstore)")
            print("\n🚀 Your API will now load INSTANTLY (no cold start delay)!")
        else:
            print("⚠️  JSON created, but embeddings failed")
            print("   API will fall back to creating embeddings at runtime")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("⚠️  No documents processed")
        print("=" * 60)