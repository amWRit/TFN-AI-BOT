'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Zap, FileText, Plus, Copy, Check, MessageCircle } from 'lucide-react';

// WhyDidYouRender (Development Only)
// if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
//   import('why-did-you-render').then(({ whyDidYouRender }) => {
//     whyDidYouRender(React, {
//       trackAllPureComponents: true,
//     });
//   });
// }

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docsCount, setDocsCount] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch('/tfn-documents.json')   // Loads static JSON directly
      .then(res => res.json())
      .then(data => setDocsCount(data.length))
      .catch(() => setDocsCount(6));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const processQuery = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query, timestamp: new Date() }]);

    try {
      const res = await fetch('/api/rag-alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: { answer: 'Sorry, I encountered an error processing your request. Please try again.' },
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-black opacity-90" />
        {/* Floating orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{animationDelay: '2s'}} />
        <div className="absolute -bottom-8 left-1/2 w-[500px] h-[500px] bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{animationDelay: '4s'}} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-purple-500/20 bg-black/40 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
              <MessageCircle className="w-6 h-6 text-white" />
              <div className="absolute inset-0 rounded-lg border border-purple-400/50" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                TFN-AI
              </h1>
              <p className="text-xs text-purple-300/70 mt-0.5">{docsCount} documents • Ready</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/40 to-cyan-600/40 border border-purple-400/30 hover:border-purple-400/60 text-sm font-semibold text-white hover:bg-gradient-to-r hover:from-purple-600/60 hover:to-cyan-600/60 transition-all"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
              {/* Welcome Section */}
              <div className="space-y-8 max-w-2xl">
                <div className="space-y-4">
                  <div className="inline-block">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-cyan-500/40 rounded-2xl flex items-center justify-center border border-purple-400/30 shadow-xl shadow-purple-500/20">
                      <Zap className="w-12 h-12 text-cyan-300" />
                    </div>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
                    How can I help?
                  </h2>
                  <p className="text-lg text-gray-300 leading-relaxed max-w-xl mx-auto">
                    Ask me anything about TFN. I'll search through all indexed documents and provide you with accurate, sourced answers.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <button
                    onClick={() => processQuery('What are the key TFN programs?')}
                    className="group p-6 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-400/30 hover:border-purple-400/60 hover:bg-gradient-to-br hover:from-purple-600/40 hover:to-purple-900/40 transition-all text-left"
                  >
                    <div className="text-3xl mb-3">📚</div>
                    <div className="font-bold text-white mb-1">Programs</div>
                    <div className="text-sm text-gray-400">Learn about key offerings</div>
                  </button>
                  <button
                    onClick={() => processQuery('How do I submit a nomination?')}
                    className="group p-6 rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-900/20 border border-cyan-400/30 hover:border-cyan-400/60 hover:bg-gradient-to-br hover:from-cyan-600/40 hover:to-cyan-900/40 transition-all text-left"
                  >
                    <div className="text-3xl mb-3">📝</div>
                    <div className="font-bold text-white mb-1">Nominations</div>
                    <div className="text-sm text-gray-400">Submission process</div>
                  </button>
                  <button
                    onClick={() => processQuery('What are TFN eligibility requirements?')}
                    className="group p-6 rounded-xl bg-gradient-to-br from-pink-600/20 to-pink-900/20 border border-pink-400/30 hover:border-pink-400/60 hover:bg-gradient-to-br hover:from-pink-600/40 hover:to-pink-900/40 transition-all text-left"
                  >
                    <div className="text-3xl mb-3">✅</div>
                    <div className="font-bold text-white mb-1">Eligibility</div>
                    <div className="text-sm text-gray-400">Who can apply</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`px-5 py-4 rounded-2xl max-w-xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 rounded-br-none'
                        : msg.error
                        ? 'bg-red-900/30 border border-red-500/30 rounded-bl-none'
                        : 'bg-white/10 backdrop-blur-md border border-white/20 rounded-bl-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-white font-medium leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-100 leading-relaxed">{msg.content.answer}</p>
                        {msg.content.sources?.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-white/15 space-y-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-cyan-400" />
                              <span className="text-sm font-bold text-cyan-300">Sources ({msg.content.sources.length})</span>
                            </div>
                            {msg.content.sources.map((source, idx) => (
                              <div key={idx} className="text-sm bg-white/10 p-3 rounded-lg border border-white/10 hover:bg-white/20 transition-colors">
                                <div className="flex items-start gap-2">
                                  <span>📄</span>
                                  <div>
                                    <p className="font-semibold text-white/90">{source.source}</p>
                                    <p className="text-xs text-white/50">Page {source.page}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.content.answer, i)}
                      className="mt-1 p-2 rounded-lg hover:bg-white/20 text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-2xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/20 rounded-bl-none">
                  <div className="flex gap-1 mb-3">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                  </div>
                  <p className="text-sm text-gray-300">Processing...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-purple-500/20 bg-black/40 backdrop-blur-md sticky bottom-0 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && input.trim()) {
                  e.preventDefault();
                  processQuery(input);
                }
              }}
              placeholder="Ask about TFN..."
              className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            <button
              onClick={() => processQuery(input)}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
