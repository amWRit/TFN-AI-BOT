// app/api/rag-alumni/route.js - Hybrid Search with FAISS + Structured Data
import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockEmbeddings } from "@langchain/aws";
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import path from 'path';
import fs from 'fs';

// ✅ CACHE: Store vector store, LLM, and structured data in memory
let cachedVectorStore = null;
let cachedLLM = null;
let cachedStructuredData = null;

// ===== STRUCTURED DATA SEARCH ENGINE =====

function loadStructuredData() {
  if (cachedStructuredData) {
    return cachedStructuredData;
  }
  
  try {
    const dataPath = path.join(process.cwd(), 'public', 'all_structured_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    cachedStructuredData = JSON.parse(rawData);
    console.log('📋 Structured data loaded successfully');
    return cachedStructuredData;
  } catch (error) {
    console.error('⚠️ Could not load structured data:', error.message);
    return { staff_members: [], partners: [] };
  }
}

function analyzeQueryType(query) {
  const lowerQuery = query.toLowerCase();
  
  // Patterns for structured queries
  const patterns = {
    staff: {
      keywords: ['staff', 'team', 'employee', 'member', 'ceo', 'director', 
                 'manager', 'coordinator', 'who works', 'team member', 'work at',
                 'executive', 'chief', 'head of', 'leader'],
      phrases: ['who is', 'tell me about', 'works at', 'team at']
    },
    partners: {
      keywords: ['partner', 'partnership', 'collaborate', 'organization', 
                 'ministry', 'bank', 'ngo', 'nonprofit', 'corporate', 'sponsor',
                 'fund', 'support', 'donor'],
      phrases: ['partner with', 'works with', 'collaborated with']
    }
  };
  
  let bestMatch = { type: null, score: 0 };
  
  for (const [type, config] of Object.entries(patterns)) {
    let score = 0;
    
    // Check keywords
    const keywordMatches = config.keywords.filter(kw => lowerQuery.includes(kw));
    score += keywordMatches.length * 2;
    
    // Check phrases
    const phraseMatches = config.phrases.filter(ph => lowerQuery.includes(ph));
    score += phraseMatches.length * 3;
    
    if (score > bestMatch.score) {
      bestMatch = { type, score };
    }
  }
  
  // Determine if user wants complete list
  const listIndicators = ['all', 'list', 'every', 'who are', 'show me'];
  const wantsComplete = listIndicators.some(ind => lowerQuery.includes(ind));
  
  return {
    isStructured: bestMatch.score > 0,
    type: bestMatch.type,
    confidence: bestMatch.score,
    wantsComplete,
    query: lowerQuery
  };
}

function searchStructuredData(data, query, type, wantsComplete) {
  const dataKey = type === 'staff' ? 'staff_members' : type;
  const items = data[dataKey] || [];
  
  if (items.length === 0) return [];
  
  // If asking for all, return everything
  if (wantsComplete) {
    return items.map(item => ({ item, score: 1 }));
  }
  
  // Score and filter items
  const scored = items.map(item => {
    let score = 0;
    const itemText = JSON.stringify(item).toLowerCase();
    
    // Check for name match
    if (item.name && query.includes(item.name.toLowerCase())) {
      score += 10;
    }
    
    // Check for role/type match
    if (item.role && query.includes(item.role.toLowerCase())) {
      score += 5;
    }
    if (item.type && query.includes(item.type.toLowerCase())) {
      score += 5;
    }
    
    // Count word matches (words > 3 chars)
    const queryWords = query.split(/\s+/).filter(w => w.length > 3);
    const matches = queryWords.filter(w => itemText.includes(w));
    score += matches.length;
    
    return { item, score };
  });
  
  // Return items with score > 0, sorted by relevance
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}

function formatStructuredContext(results, type) {
  if (results.length === 0) return null;
  
  let context = `Found ${results.length} ${type}:\n\n`;
  
  results.forEach(({ item }, idx) => {
    if (type === 'staff') {
      context += `${idx + 1}. Name: ${item.name}\n`;
      context += `   Role: ${item.role}\n`;
      if (item.bio && item.bio !== 'No biography available') {
        context += `   Bio: ${item.bio}\n`;
      }
      context += '\n';
    } else if (type === 'partners') {
      context += `${idx + 1}. Name: ${item.name}\n`;
      context += `   Type: ${item.type}\n`;
      if (item.description && item.description !== 'No description available') {
        context += `   Description: ${item.description}\n`;
      }
      if (item.contact_person && item.contact_person !== 'No biography available') {
        context += `   Contact: ${item.contact_person}\n`;
      }
      context += '\n';
    }
  });
  
  return context;
}

// ===== VECTOR STORE FUNCTIONS =====

async function getVectorStore() {
  if (cachedVectorStore) {
    console.log('⚡ Using cached vector store (instant!)');
    return cachedVectorStore;
  }

  const embeddings = new BedrockEmbeddings({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
    },
    model: 'amazon.titan-embed-text-v2:0'
  });

  const vectorStorePath = path.join(process.cwd(), 'public', 'vector-store');
  
  if (fs.existsSync(vectorStorePath)) {
    console.log('📦 Loading FAISS vector store from disk...');
    try {
      cachedVectorStore = await FaissStore.loadFromPython(vectorStorePath, embeddings);
      console.log('✅ FAISS vector store loaded successfully');
      return cachedVectorStore;
    } catch (error) {
      console.error('❌ Failed to load FAISS vector store:', error.message);
      if (error.message.includes('ExpiredToken') || 
          error.message.includes('InvalidToken') || 
          error.message.includes('NotAuthorizedException')) {
        throw error;
      }
      throw new Error(`Cannot load vector store. Error: ${error.message}`);
    }
  } else {
    throw new Error(`Vector store not found at: ${vectorStorePath}`);
  }
}

function getLLM() {
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
  return cachedLLM;
}

// ===== MAIN HANDLER =====

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

    // STEP 1: Analyze query type
    const analysis = analyzeQueryType(query);
    console.log('📊 Query analysis:', analysis);

    let structuredContext = '';
    let structuredSources = [];
    let searchMode = 'rag'; // Default to RAG

    // STEP 2: If structured query, get structured data
    if (analysis.isStructured && analysis.type) {
      console.log(`🗂️ Detected structured query for: ${analysis.type}`);
      
      const structuredData = loadStructuredData();
      const results = searchStructuredData(
        structuredData, 
        analysis.query, 
        analysis.type,
        analysis.wantsComplete
      );
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} structured results`);
        structuredContext = formatStructuredContext(results, analysis.type);
        structuredSources = results.map(({ item }) => ({
          source: 'Structured Data',
          page: analysis.type,
          metadata: item,
          isStructured: true
        }));
        searchMode = 'hybrid'; // Use both
      }
    }

    // STEP 3: Get vector store and retriever
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever({ k: 3 });

    // STEP 4: Get LLM
    const model = getLLM();

    // STEP 5: Create RAG chain with optional structured context
    const prompt = ChatPromptTemplate.fromTemplate(`
You are a helpful assistant answering questions about Teach For Nepal (TFN).

STRUCTURED DATA (Complete and Authoritative):
{structured_context}

DOCUMENT CONTEXT (Supporting Information):
{document_context}

QUESTION: {question}

Instructions:
- When listing staff or partners, include ALL the details provided (names, roles, bios, descriptions)
- Do NOT just cite [Structured Data] - actually include the information in your answer
- For list queries, format as a clean numbered list with full details
- For individual queries, provide a comprehensive answer with all relevant details
- Combine structured data with document context when both are relevant
- Be natural and conversational, not robotic
- If asking for "all" or "list", show complete information for each item

Answer:`);

    const chain = RunnableSequence.from([
      {
        structured_context: () => structuredContext || 'No structured data relevant to this query.',
        document_context: async (input) => {
          const docs = await retriever.invoke(input);
          return docs.map(doc => doc.pageContent).join('\n\n');
        },
        question: (input) => input
      },
      prompt,
      model,
      new StringOutputParser()
    ]);

    // STEP 6: Execute chain
    console.log(`🤖 Running ${searchMode} search...`);
    const answer = await chain.invoke(query);
    const ragDocs = await retriever.invoke(query);

    const ragSources = ragDocs.map(doc => ({
      source: doc.metadata.source,
      page: doc.metadata.page,
      content_preview: doc.pageContent.slice(0, 150) + '...',
      isStructured: false
    }));

    console.log('✅ Query completed successfully');

    // STEP 7: Combine sources (structured first, then RAG)
    const allSources = [...structuredSources, ...ragSources];

    return Response.json({
      answer: answer.trim(),
      sources: allSources,
      searchMode: searchMode,
      structuredResultsCount: structuredSources.length,
      ragResultsCount: ragSources.length,
      cached: cachedVectorStore !== null,
      status: 'success'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    const errorMessage = (error.message || error.toString());
    const errorName = error.name || '';
    let userMessage = error.message || 'An error occurred';
    let errorType = 'error';
    
    // Check for token expiration
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
      // Clear all caches
      cachedLLM = null;
      cachedVectorStore = null;
      cachedStructuredData = null;
      console.log('🗑️ All caches cleared due to expired token');
    } else if (errorMessage.includes('AccessDenied') || errorMessage.includes('UnauthorizedOperation')) {
      userMessage = 'Access denied. Please verify your AWS permissions.';
      errorType = 'access_denied';
    } else if (errorMessage.includes('AWS credentials not configured')) {
      userMessage = 'AWS credentials are not configured.';
      errorType = 'missing_credentials';
    }
    
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
  cachedStructuredData = null;
  console.log('🗑️ All caches cleared');
  return Response.json({ message: 'Cache cleared successfully' });
}