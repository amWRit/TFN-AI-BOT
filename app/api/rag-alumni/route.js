// app/api/rag-alumni/route.js - OPTIMIZED with Pre-built Vector Store (FAISS)
import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockEmbeddings } from "@langchain/aws";
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import path from 'path';
import fs from 'fs';

// ✅ CACHE: Store vector store and LLM in memory
let cachedVectorStore = null;
let cachedLLM = null;
let cachedDocCount = 0;

async function getVectorStore() {
  if (cachedVectorStore) {
    console.log('⚡ Using cached vector store (instant!)');
    return cachedVectorStore;
  }

  // Initialize embeddings (needed for loading)
  const embeddings = new BedrockEmbeddings({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
    },
    model: 'amazon.titan-embed-text-v2:0'
  });

  // Try to load pre-built vector store from disk
  const vectorStorePath = path.join(process.cwd(), 'public', 'vector-store');
  
  if (fs.existsSync(vectorStorePath)) {
    console.log('📦 Loading pre-built vector store from disk...');
    try {
      // Use loadFromPython for Python-generated FAISS stores
      cachedVectorStore = await FaissStore.loadFromPython(vectorStorePath, embeddings);
      console.log('✅ Pre-built vector store loaded (INSTANT!)');
      return cachedVectorStore;
    } catch (error) {
      console.warn('⚠️  Failed to load pre-built vector store:', error.message);
      console.log('   Falling back to runtime creation...');
    }
  } else {
    console.log('ℹ️  No pre-built vector store found at:', vectorStorePath);
    console.log('   Run: python scripts/preprocess_docs.py');
    console.log('   Falling back to runtime creation...');
  }

  // Fallback: Build vector store at runtime (slow)
  console.log('🆕 Building vector store at runtime (30-60 seconds)...');
  
  const docsUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/tfn-documents.json`
    : 'http://localhost:3000/tfn-documents.json';
  
  const docsRes = await fetch(docsUrl);
  if (!docsRes.ok) {
    throw new Error(`Failed to fetch documents: ${docsRes.status}`);
  }

  const docs = await docsRes.json();
  cachedDocCount = docs.length;

  const documents = docs.map(doc => new Document({
    pageContent: doc.content,
    metadata: {
      source: doc.source,
      page: doc.page,
      type: doc.type,
      id: doc.id
    }
  })).filter(doc => doc.pageContent && doc.pageContent.trim().length > 0);

  cachedVectorStore = await FaissStore.fromDocuments(documents, embeddings);
  console.log('✅ Runtime vector store created and cached');
  
  return cachedVectorStore;
}

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`🔍 Processing query: "${query}"`);

    // Validate AWS credentials
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS credentials not configured');
    }

    // Get vector store (pre-built or runtime)
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever({ k: 3 });

    // Bedrock LLM (cached)
    if (!cachedLLM) {
      console.log('🤖 Initializing Bedrock LLM...');
      cachedLLM = new ChatBedrockConverse({
        model: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
        },
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.1'),
        maxTokens: 1024
      });
    } else {
      console.log('⚡ Using cached LLM');
    }
    const model = cachedLLM;

    // RAG Chain
    const prompt = ChatPromptTemplate.fromTemplate(`
Answer using ONLY this TFN context (cite sources):

CONTEXT:
{context}

QUESTION: {question}

Format: Answer first, then [Source: filename.pdf page X]`);

    const chain = RunnableSequence.from([
      {
        context: async (input) => {
          const docs = await retriever.invoke(input);
          return docs.map(doc => doc.pageContent).join('\n\n');
        },
        question: (input) => input
      },
      prompt,
      model,
      new StringOutputParser()
    ]);

    // Execute
    console.log('🤖 Running Bedrock RAG...');
    const answer = await chain.invoke(query);
    const sources = await retriever.invoke(query);

    console.log('✅ RAG query completed successfully');

    return Response.json({
      answer: answer.trim(),
      sources: sources.map(doc => ({
        source: doc.metadata.source,
        page: doc.metadata.page,
        content_preview: doc.pageContent.slice(0, 150) + '...'
      })),
      totalDocs: cachedDocCount,
      preBuilt: fs.existsSync(path.join(process.cwd(), 'public', 'vector-store')),
      cached: cachedVectorStore !== null,
      status: 'success'
    });

  } catch (error) {
    console.error('❌ Bedrock RAG Error:', error);
    return Response.json({
      error: error.message,
      details: error.toString(),
      status: 'error'
    }, { status: 500 });
  }
}

// Clear cache endpoint
export async function DELETE() {
  cachedVectorStore = null;
  cachedLLM = null;
  cachedDocCount = 0;
  console.log('🗑️ Vector store and LLM cache cleared');
  return Response.json({ message: 'Cache cleared successfully' });
}