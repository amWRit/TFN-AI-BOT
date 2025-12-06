// app/api/rag-alumni/route.js - FAISS Vector Store Only (No JSON Fallback)
import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockEmbeddings } from "@langchain/aws";
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import path from 'path';
import fs from 'fs';

// ✅ CACHE: Store vector store and LLM in memory
let cachedVectorStore = null;
let cachedLLM = null;

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

  // Load pre-built FAISS vector store from disk
  const vectorStorePath = path.join(process.cwd(), 'public', 'vector-store');
  
  if (fs.existsSync(vectorStorePath)) {
    console.log('📦 Loading FAISS vector store from disk...');
    try {
      // Use loadFromPython for Python-generated FAISS stores
      cachedVectorStore = await FaissStore.loadFromPython(vectorStorePath, embeddings);
      console.log('✅ FAISS vector store loaded successfully');
      return cachedVectorStore;
    } catch (error) {
      console.error('❌ Failed to load FAISS vector store:', error.message);
      // Re-throw auth errors
      if (error.message.includes('ExpiredToken') || 
          error.message.includes('InvalidToken') || 
          error.message.includes('NotAuthorizedException')) {
        throw error;
      }
      throw new Error(`Cannot load vector store. Make sure to run: python scripts/preprocess_docs.py. Error: ${error.message}`);
    }
  } else {
    throw new Error(`Vector store not found at: ${vectorStorePath}. Please run: python scripts/preprocess_docs.py`);
  }
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
      cached: cachedVectorStore !== null,
      status: 'success'
    });

  } catch (error) {
    console.error('❌ Bedrock RAG Error:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    // Check for AWS credential/token expiration errors
    const errorMessage = (error.message || error.toString());
    const errorName = error.name || '';
    let userMessage = error.message || 'An error occurred';
    let errorType = 'error';
    
    console.log('Checking error - Name:', errorName, 'Message:', errorMessage);
    
    // Check for token expiration - multiple formats
    if (errorName === 'ExpiredTokenException' ||
        errorName.includes('Expired') ||
        errorMessage.includes('ExpiredToken') || 
        errorMessage.includes('expired') ||
        errorMessage.includes('InvalidToken') || 
        errorMessage.includes('NotAuthorizedException') ||
        errorMessage.includes('UnrecognizedClientException') ||
        errorMessage.includes('SignatureDoesNotMatch') ||
        errorMessage.includes('InvalidSignatureException')) {
      userMessage = 'AWS credentials have expired or are invalid. Please refresh your credentials and try again.';
      errorType = 'expired_token';
      // Clear cache on token expiration so next request will reinitialize
      cachedLLM = null;
      cachedVectorStore = null;
      console.log('🗑️ Cache cleared due to expired token');
    } else if (errorMessage.includes('AccessDenied') || errorMessage.includes('UnauthorizedOperation')) {
      userMessage = 'Access denied. Please verify your AWS permissions for Bedrock and embeddings services.';
      errorType = 'access_denied';
    } else if (errorMessage.includes('AWS credentials not configured')) {
      userMessage = 'AWS credentials are not configured. Please set up your AWS environment variables.';
      errorType = 'missing_credentials';
    }
    
    console.log('Returning error response:', { userMessage, errorType });
    
    return Response.json({
      error: userMessage,
      details: error.toString(),
      status: 'error',
      errorType: errorType
    }, { status: 500 });
  }
}

// Clear cache endpoint
export async function DELETE() {
  cachedVectorStore = null;
  cachedLLM = null;
  console.log('🗑️ Vector store and LLM cache cleared');
  return Response.json({ message: 'Cache cleared successfully' });
}