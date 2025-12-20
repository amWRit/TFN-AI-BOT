// app/api/rag-alumni/route.js - FIXED Complete Code (No more 'formatted' error)
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
    const dataPath = path.join(process.cwd(), 'public', 'json', 'combined_data.json');
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
  
  // First check for explicit type mentions in the query
  const explicitTypeCheck = {
    alumni: /\b(alumni|alumnus)\b/.test(lowerQuery),
    fellows: /\b(fellow|fellows)\b/.test(lowerQuery),
    staff: /\b(staff|team member|employee)\b/.test(lowerQuery),
    partners: /\b(partner|partners|partnership)\b/.test(lowerQuery),
    schools: /\b(school|schools|college|university)\b/.test(lowerQuery)
  };
  
  // If explicit type is mentioned, prioritize it
  for (const [type, isExplicit] of Object.entries(explicitTypeCheck)) {
    if (isExplicit) {
      console.log(`🎯 Explicit type detected: ${type}`);
      const wantsComplete = /\b(all|list|every|show me)\b/.test(lowerQuery);
      return {
        isStructured: true,
        type,
        confidence: 10, // High confidence for explicit mentions
        wantsComplete,
        query: lowerQuery
      };
    }
  }
  
  // Pattern matching for non-explicit queries
  const patterns = {
    staff: {
      keywords: ['ceo', 'director', 'manager', 'coordinator', 
                 'executive', 'chief', 'head of', 'works at tfn'],
      phrases: ['who works', 'team member', 'work at'],
      exclusions: ['alumni', 'fellow', 'partner', 'school'] // Don't match if these are present
    },
    partners: {
      keywords: ['partnership', 'collaborate', 'organization', 
                 'ministry', 'bank', 'ngo', 'nonprofit', 'corporate', 'sponsor',
                 'fund', 'support', 'donor'],
      phrases: ['partner with', 'works with', 'collaborated with'],
      exclusions: ['alumni', 'fellow', 'staff', 'school']
    },
    alumni: {
      keywords: ['graduate', 'ex-fellow', 'former fellow', 'graduated', 'batch', 'cohort'],
      phrases: ['who are alumni', 'alumni of', 'former tfn'],
      exclusions: ['current fellow', 'staff', 'partner']
    },
    fellows: {
      keywords: ['current fellow', 'selected fellow', 'participant', 'awardee', 'grantee'],
      phrases: ['who are fellows', 'fellows of', 'active fellow'],
      exclusions: ['alumni', 'former', 'graduated']
    },
    schools: {
      keywords: ['college', 'university', 'institution', 'campus', 'education partner'],
      phrases: ['which school', 'schools of', 'educational institution'],
      exclusions: []
    }
  };
  
  let bestMatch = { type: null, score: 0 };
  
  for (const [type, config] of Object.entries(patterns)) {
    // Check exclusions first
    const hasExclusion = config.exclusions.some(excl => lowerQuery.includes(excl));
    if (hasExclusion) {
      console.log(`⛔ Type ${type} excluded due to conflicting keyword`);
      continue;
    }
    
    let score = 0;
    
    // Keyword matching
    const keywordMatches = config.keywords.filter(kw => lowerQuery.includes(kw));
    score += keywordMatches.length * 2;
    
    // Phrase matching (higher weight)
    const phraseMatches = config.phrases.filter(ph => lowerQuery.includes(ph));
    score += phraseMatches.length * 4;
    
    if (score > bestMatch.score) {
      bestMatch = { type, score };
    }
  }
  
  // Check if user wants complete list
  const listIndicators = ['all', 'list', 'every', 'who are', 'show me', 'give me'];
  const wantsComplete = listIndicators.some(ind => lowerQuery.includes(ind));
  
  return {
    isStructured: bestMatch.score > 0,
    type: bestMatch.type,
    confidence: bestMatch.score,
    wantsComplete,
    query: lowerQuery
  };
}

function searchStructuredData(data, query, type, wantsComplete, showAll = false) {
  let dataKey = type;
  if (type === 'staff') dataKey = 'staff_members';
  if (type === 'fellows') dataKey = 'fellows';
  if (type === 'alumni') dataKey = 'alumni';
  if (type === 'schools') dataKey = 'schools';
  if (type === 'partners') dataKey = 'partners';
  
  const allItems = data[dataKey] || [];
  const totalCount = allItems.length;
  
  console.log(`🔍 Searching ${type}: ${totalCount} total items, showAll=${showAll}, wantsComplete=${wantsComplete}`);

  // Return all if showAll is explicitly true
  if (showAll) {
    return {
      results: allItems.map(item => ({ item, score: 1 })),
      totalCount
    };
  }
  
  const maxDisplay = 3;
  
  // Extract potential name from query
  const nameMatch = query.match(/(?:who is|tell me about|find|show me)\s+([a-z\s]+?)(?:\s+(alumni|fellow|staff|partner|school))?$/i);
  const searchName = nameMatch ? nameMatch[1].trim() : '';
  
  console.log(`🔎 Extracted search name: "${searchName}"`);
  
  // If specific name query, do targeted search
  if (searchName && searchName.length > 2 && !wantsComplete) {
    const scored = allItems
      .map(item => {
        let score = 0;
        const itemName = (item.name || '').toLowerCase();
        const itemText = JSON.stringify(item).toLowerCase();
        
        // Exact name match
        if (itemName === searchName) {
          score += 100;
        }
        // Partial name match
        else if (itemName.includes(searchName) || searchName.includes(itemName)) {
          score += 50;
        }
        // Name words match
        else {
          const nameWords = searchName.split(/\s+/);
          const itemNameWords = itemName.split(/\s+/);
          const matchingWords = nameWords.filter(w => 
            w.length > 2 && itemNameWords.some(iw => iw.includes(w) || w.includes(iw))
          );
          score += matchingWords.length * 20;
        }
        
        // Role/description context match
        if (item.role && searchName.split(/\s+/).some(w => item.role.toLowerCase().includes(w))) {
          score += 10;
        }
        
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDisplay);
    
    console.log(`📊 Name search results: ${scored.length} matches`);
    
    return {
      results: scored,
      totalCount: totalCount
    };
  }
  
  // For "list all" type queries
  if (wantsComplete || allItems.length <= maxDisplay) {
    return {
      results: allItems.slice(0, maxDisplay).map(item => ({ item, score: 1 })),
      totalCount
    };
  }
  
  // Generic search scoring
  const scored = allItems
    .map(item => {
      let score = 0;
      const itemText = JSON.stringify(item).toLowerCase();
      
      if (item.name && query.includes(item.name.toLowerCase())) score += 10;
      if (item.role && query.includes(item.role.toLowerCase())) score += 5;
      
      const queryWords = query.split(/\s+/).filter(w => w.length > 3);
      const matches = queryWords.filter(w => itemText.includes(w));
      score += matches.length;
      
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDisplay);

  return {
    results: scored.length > 0 ? scored : allItems.slice(0, maxDisplay).map(item => ({ item, score: 1 })),
    totalCount
  };
}


function formatStructuredContext(results, type, showAll = false, totalCountOverride = null) {
  if (results.length === 0) {
    return { context: '', hasMore: false, totalCount: 0, shownCount: 0 };
  }

  const maxDisplay = 3;
  const totalCount = totalCountOverride || results.length;
  const hasMore = totalCount > maxDisplay && !showAll;
  const shown = showAll ? results : results.slice(0, maxDisplay);

  let context = `Found ${totalCount} ${type} (showing first ${shown.length}${hasMore ? ' - more available' : ''}):\n\n`;

  shown.forEach(({ item }, idx) => {
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
    } else if (type === 'alumni') {
      context += `${idx + 1}. Name: ${item.name}\n`;
      if (item.profile_url) context += `   Profile: ${item.profile_url}\n`;
      if (item.bio && item.bio !== 'No biography available') {
        context += `   Bio: ${item.bio}\n`;
      }
      context += '\n';
    } else if (type === 'fellows') {
      context += `${idx + 1}. Name: ${item.name}\n`;
      if (item.cohort) context += `   Cohort: ${item.cohort}\n`;
      if (item.role) context += `   Role: ${item.role}\n`;
      if (item.bio && item.bio !== 'No biography available') {
        context += `   Bio: ${item.bio}\n`;
      }
      context += '\n';
    } else if (type === 'schools') {
      context += `${idx + 1}. Name: ${item.name}\n`;
      if (item.district) context += `   District: ${item.district}\n`;
      if (item.location) context += `   Location: ${item.location}\n`;
      if (item.type) context += `   Type: ${item.type}\n`;
      if (item.description && item.description !== 'No description available') {
        context += `   Description: ${item.description}\n`;
      }
      if (item.profile_url) context += `   Profile: ${item.profile_url}\n`;
      context += '\n';
    }
  });

  context += hasMore ? `\n...and ${totalCount - maxDisplay} more.\n` : '';
  
  return { 
    context, 
    hasMore, 
    totalCount,
    shownCount: shown.length 
  };
}

// ===== VECTOR STORE FUNCTIONS =====

async function getVectorStore(creds) {
  if (cachedVectorStore) {
    console.log('⚡ Using cached vector store (instant!)');
    return cachedVectorStore;
  }

  const embeddings = new BedrockEmbeddings({
    region: process.env.AWS_REGION,
    credentials: creds,
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

function getLLM(creds) {
  if (!cachedLLM) {
    console.log('🤖 Initializing Bedrock LLM...');
    cachedLLM = new ChatBedrockConverse({
      model: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
      region: process.env.AWS_REGION,
      credentials: creds,
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
    const { query, showAll = false, aws_creds } = await request.json();

    let credentials;
    if (aws_creds && Object.keys(aws_creds).length > 0) {
      credentials = aws_creds;
      console.log('🔑 Using CLIENT credentials');
      console.log('🔑 Client sessionToken:', !!aws_creds.sessionToken);
    } else {
      credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      };
      console.log('🔑 Using .env credentials');
    }

    // Validate Vercel creds exist as fallback
    if (!credentials.accessKeyId) {
      throw new Error('No valid AWS credentials available (client or .env)');
    }

    // PRIORITY: Client creds > Vercel env vars
    console.log('🔑 Creds source:', aws_creds ? 'CLIENT' : '.ENV');
    console.log('🔑 Has sessionToken:', !!credentials.sessionToken);
    console.log('🔑 Region:', process.env.AWS_REGION);
    
    if (!query || query.trim().length === 0) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`🔍 Processing query: "${query}" ${showAll ? '(showAll=true)' : ''}`);

    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS credentials not configured');
    }

    // STEP 1: Analyze query type
    const analysis = analyzeQueryType(query);
    console.log('📊 Query analysis:', analysis);

    let structuredContext = '';
    let structuredSources = [];
    let structuredResponse = { hasMore: false, totalCount: 0, shownCount: 0 }; // ✅ FIXED: Declare outside
    let searchMode = 'rag';

    // STEP 2: If structured query, get structured data
    if (analysis.isStructured && analysis.type) {
      console.log(`🗂️ Detected structured query for: ${analysis.type}`);
      
      const structuredData = loadStructuredData();
      const searchResult = searchStructuredData(
        structuredData, 
        analysis.query, 
        analysis.type,
        analysis.wantsComplete,
        showAll
      );

      const results = searchResult.results;  // Only limited results
      const totalStructuredCount = searchResult.totalCount;  // Full count!

      if (results.length > 0) {
        console.log(`✅ Found ${results.length} structured results (total: ${totalStructuredCount})`);
        const formatted = formatStructuredContext(results, analysis.type, showAll, totalStructuredCount);
        
        structuredContext = formatted.context;
        structuredSources = results.map(({ item }) => ({
          source: 'Structured Data',
          page: analysis.type,
          displayType: analysis.type,
          metadata: item,
          rawData: item,
          isStructured: true
        }));

        const isSpecificQuery = !analysis.wantsComplete && results.length === 1;
        const wouldShowMore = totalStructuredCount > 3 && !showAll;
        structuredResponse = {
            hasMore: !isSpecificQuery && wouldShowMore,
            totalCount: totalStructuredCount,
            shownCount: formatted.shownCount || results.length
        };
      }
    }

    // STEP 3: Get vector store and retriever
    const vectorStore = await getVectorStore(credentials);
    const retriever = vectorStore.asRetriever({ k: 3 });

    // STEP 4: Get LLM
    const model = getLLM(credentials);

    // Clear cache on new creds (prevents stale auth)
    if (aws_creds) {
      cachedVectorStore = null;
      cachedLLM = null;
      console.log('🔑 Using client-submitted AWS credentials');
    }

    // STEP 5: Create RAG chain
    const prompt = ChatPromptTemplate.fromTemplate(`
You are a helpful assistant answering questions about Teach For Nepal (TFN).

STRUCTURED DATA (Complete and Authoritative):
{structured_context}

DOCUMENT CONTEXT (Supporting Information):
{document_context}

QUESTION: {question}

Instructions:
- When listing **staff, partners, alumni, fellows, or schools**, include ALL the details provided (names, roles, bios, descriptions, cohorts, districts, etc.)
- Do NOT just cite [Structured Data] - actually include the information in your answer
- For list queries, format as a clean numbered list with full details
- For individual queries, provide a comprehensive answer with all relevant details
- Combine structured data with document context when both are relevant
- Be natural and conversational, not robotic
- If asking for "all" or "list", show complete information for each item
- If a person appears in MULTIPLE roles (e.g., both alumni and staff), mention ALL their roles chronologically
- Format multi-role persons as: "[Name] is currently [current role] and was previously [past role]"
- For alumni who became staff: emphasize their journey (e.g., "started as a fellow, now serves as...")
- Always include full details for each role
- Be natural and tell their complete story with TFN
- If only one role is found, focus on that role completely

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

    // STEP 7: FIXED Response - No more 'formatted' reference
    const allSources = [...structuredSources, ...ragSources];

    const responseData = {
      answer: answer.trim(),
      sources: allSources,
      searchMode,
      structuredResultsCount: structuredSources.length,
      ragResultsCount: ragSources.length,
      structuredType: analysis.type,
      cached: cachedVectorStore !== null,
      status: 'success'
    };

    // ✅ FIXED: Use structuredResponse (always defined)
    if (structuredSources.length > 0) {
      responseData.hasMore = structuredResponse.hasMore;
      responseData.totalCount = structuredResponse.totalCount;
      responseData.shownCount = structuredResponse.shownCount;
    }

    console.log(`📊 Response: hasMore=${responseData.hasMore}, total=${responseData.totalCount}`);
    return Response.json(responseData);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    const errorMessage = (error.message || error.toString());
    const errorName = error.name || '';
    let userMessage = error.message || 'An error occurred';
    let errorType = 'error';
    
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

export async function DELETE() {
  cachedVectorStore = null;
  cachedLLM = null;
  cachedStructuredData = null;
  console.log('🗑️ All caches cleared');
  return Response.json({ message: 'Cache cleared successfully' });
}
