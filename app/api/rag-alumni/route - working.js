// app/api/rag-alumni/route.js - TFN-AI RAG API with Bedrock LLM

// ==================== MOCK RESPONSE (Fallback) ====================
/*
export async function POST(request) {
  try {
    const { query } = await request.json();

    // Mock response for development
    const mockAnswer = `TFN core values from TFN-Policy.pdf: Innovation, Integrity, Impact, Collaboration, Continuous Learning. [Source: TFN-Policy.pdf page 1]`;
    
    return Response.json({
      answer: mockAnswer,
      sources: [
        { source: "TFN-Policy.pdf", page: 1 },
        { source: "nomination_guidelines_gdoc", page: null }
      ],
      totalDocs: 6
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
*/

// ==================== REAL BEDROCK RAG ====================
// app/api/rag-alumni/route.js - FIXED RAG CHAIN
import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockEmbeddings } from "@langchain/aws";
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { Document } from '@langchain/core/documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`🔍 Processing query: "${query}"`);

    // 1. Load documents
    const docsUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/tfn-documents.json`
      : 'http://localhost:3000/tfn-documents.json';
    
    console.log(`📄 Fetching documents from: ${docsUrl}`);
    const docsRes = await fetch(docsUrl);
    
    if (!docsRes.ok) {
      throw new Error(`Failed to fetch documents: ${docsRes.status}`);
    }

    const docs = await docsRes.json();
    console.log(`✓ Loaded ${docs.length} PDF chunks`);

    if (docs.length === 0) {
      return Response.json({
        error: 'No documents available. Please run preprocess_docs.py first.'
      }, { status: 400 });
    }

    // Validate AWS credentials
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS credentials not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env.local');
    }

    // 2. Convert to Document objects
    console.log('📝 Converting documents to LangChain format...');
    const documents = docs.map(doc => new Document({
      pageContent: doc.content,
      metadata: {
        source: doc.source,
        page: doc.page,
        type: doc.type,
        id: doc.id
      }
    })).filter(doc => doc.pageContent && doc.pageContent.trim().length > 0);

    // 3. Bedrock Embeddings
    console.log('🧠 Initializing Bedrock Embeddings...');
    const embeddings = new BedrockEmbeddings({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
      },
      model: 'amazon.titan-embed-text-v2:0'
    });

    // 4. HNSWLib Vector Store
    console.log('📚 Creating vector store...');
    const vectorStore = await HNSWLib.fromDocuments(documents, embeddings);
    const retriever = vectorStore.asRetriever({ k: 3 });

    // 5. Bedrock LLM
    console.log('🤖 Initializing Bedrock LLM...');
    const model = new ChatBedrockConverse({
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

    // 6. ✅ FIXED RAG CHAIN
    console.log('⛓️ Building RAG chain...');
    const prompt = ChatPromptTemplate.fromTemplate(`
Answer using ONLY this TFN context (cite sources):

CONTEXT:
{context}

QUESTION: {question}

Format: Answer first, then [Source: filename.pdf page X]`);

    // Create a proper chain that handles retrieval correctly
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

    // 7. Execute
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
      totalDocs: docs.length,
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