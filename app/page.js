'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Loader2, Zap, FileText, Plus, MessageCircle, User, Building2, 
  ChevronDown, ChevronUp, Database, Settings } from 'lucide-react';

// Adaptive Structured Data Card Renderer
function AdaptiveStructuredCards({ items, type, colorScheme = 'purple' }) {
  const [expandedItems, setExpandedItems] = useState(new Set());

  if (!items || items.length === 0) return null;

  const colors = {
    purple: {
      gradient: 'from-purple-900/40 via-purple-800/20',
      border: 'border-purple-400/30 hover:border-purple-400/50',
      icon: 'from-purple-500 to-pink-500',
      text: 'text-purple-300',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-400/30'
    },
    cyan: {
      gradient: 'from-cyan-900/40 via-cyan-800/20',
      border: 'border-cyan-400/30 hover:border-cyan-400/50',
      icon: 'from-cyan-500 to-blue-500',
      text: 'text-cyan-300',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
    },
    green: {
      gradient: 'from-green-900/40 via-green-800/20',
      border: 'border-green-400/30 hover:border-green-400/50',
      icon: 'from-green-500 to-emerald-500',
      text: 'text-green-300',
      badge: 'bg-green-500/20 text-green-300 border-green-400/30'
    }
  };

  const scheme = colors[colorScheme] || colors.purple;

  const getIcon = () => {
    const typeMap = {
      staff: User,
      partners: Building2,
      team: User,
      organizations: Building2,
      staff_members: User
    };
    return typeMap[type?.toLowerCase()] || Database;
  };

  const Icon = getIcon();

  const analyzeField = (key, value) => {
    const lowerKey = key.toLowerCase();
    if (['name', 'title', 'company', 'organization'].includes(lowerKey)) {
      return { priority: 'primary', display: true };
    }
    if (['role', 'type', 'category', 'position'].includes(lowerKey)) {
      return { priority: 'secondary', display: true };
    }
    if (['bio', 'description', 'about', 'summary'].includes(lowerKey) && 
        typeof value === 'string' && value.length > 100) {
      return { priority: 'long', display: true };
    }
    if (typeof value === 'string' && value.length > 0 && 
        value !== 'No biography available' && value !== 'N/A') {
      return { priority: 'normal', display: true };
    }
    return { priority: 'skip', display: false };
  };

  const formatFieldName = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  const groupFields = (item) => {
    const groups = { primary: [], secondary: [], normal: [], long: [] };
    Object.entries(item).forEach(([key, value]) => {
      const analysis = analyzeField(key, value);
      if (analysis.display) {
        groups[analysis.priority].push({ key, value });
      }
    });
    return groups;
  };

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-3 mt-4">
      <div className={`flex items-center gap-2 ${scheme.text} font-semibold`}>
        <Icon className="w-4 h-4" />
        <span>{formatFieldName(type)} ({items.length})</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item, idx) => {
          const fields = groupFields(item);
          const isExpanded = expandedItems.has(idx);
          const hasLongContent = fields.long.length > 0;

          return (
            <div key={idx} className={`bg-gradient-to-br ${scheme.gradient} to-transparent border ${scheme.border} rounded-lg p-4 transition-all`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-${type === 'staff' || type === 'staff_members' ? 'full' : 'lg'} bg-gradient-to-br ${scheme.icon} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  {fields.primary.map(({ key, value }) => (
                    <h4 key={key} className="font-bold text-white mb-1 text-lg">{value}</h4>
                  ))}

                  <div className="flex flex-wrap gap-2 mb-2">
                    {fields.secondary.map(({ key, value }) => (
                      <span key={key} className={`px-2 py-0.5 text-xs font-semibold ${scheme.badge} rounded-full border whitespace-nowrap`}>
                        {value}
                      </span>
                    ))}
                  </div>

                  {fields.normal.length > 0 && (
                    <div className="space-y-1 text-sm">
                      {fields.normal.map(({ key, value }) => (
                        <div key={key} className="text-gray-300">
                          <span className="text-gray-400 text-xs">{formatFieldName(key)}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}

                  {hasLongContent && (
                    <div className="mt-2">
                      {fields.long.map(({ key, value }) => (
                        <p key={key} className={`text-sm text-gray-300 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                          {value}
                        </p>
                      ))}
                      <button onClick={() => toggleExpand(idx)} className={`mt-2 text-xs ${scheme.text} hover:underline flex items-center gap-1`}>
                        {isExpanded ? (
                          <>Show less <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>Read more <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docsCount, setDocsCount] = useState(0);
  const chatEndRef = useRef(null);

  const [showDemoWarning, setShowDemoWarning] = useState(false);
  const [lastCredsCheck, setLastCredsCheck] = useState(0);

  const QuickButton = ({ query, icon, title, subtitle, color }) => {
    const baseClasses = "group h-32 p-4 rounded-xl transition-all text-left flex flex-col justify-between";
    const colorClasses = {
      pink: "bg-gradient-to-br from-pink-600/20 to-pink-900/20 border border-pink-400/30 hover:border-pink-400/60 hover:bg-gradient-to-br hover:from-pink-600/40 hover:to-pink-900/40",
      blue: "bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-400/30 hover:border-blue-400/60 hover:bg-gradient-to-br hover:from-blue-600/40 hover:to-blue-900/40",
      green: "bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-400/30 hover:border-green-400/60 hover:bg-gradient-to-br hover:from-green-600/40 hover:to-green-900/40",
      amber: "bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-400/30 hover:border-amber-400/60 hover:bg-gradient-to-br hover:from-amber-600/40 hover:to-amber-900/40",
      purple: "bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-400/30 hover:border-purple-400/60 hover:bg-gradient-to-br hover:from-purple-600/40 hover:to-purple-900/40",
      cyan: "bg-gradient-to-br from-cyan-600/20 to-cyan-900/20 border border-cyan-400/30 hover:border-cyan-400/60 hover:bg-gradient-to-br hover:from-cyan-600/40 hover:to-cyan-900/40",
      rose: "bg-gradient-to-br from-rose-600/20 to-rose-900/20 border border-rose-400/30 hover:border-rose-400/60 hover:bg-gradient-to-br hover:from-rose-600/40 hover:to-rose-900/40",
      indigo: "bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-400/30 hover:border-indigo-400/60 hover:bg-gradient-to-br hover:from-indigo-600/40 hover:to-indigo-900/40"
    };
    const disabledClasses = "opacity-50 cursor-not-allowed bg-gray-800/50 border-gray-600/50";

    return (
      <button 
        onClick={() => processQuery(query)}
        disabled={showDemoWarning || loading}
        className={`${baseClasses} ${colorClasses[color] || colorClasses.pink} ${
          showDemoWarning || loading ? disabledClasses : ''
        }`}
      >
        <div className="text-3xl mb-2">{icon}</div>
        <div>
          <div className="font-bold text-white mb-1 text-sm leading-tight line-clamp-1">{title}</div>
          <div className="text-xs text-gray-400 line-clamp-1">{subtitle}</div>
        </div>
      </button>
    );
  };

  const testCredsAndShowWarning = async () => {
    const now = Date.now();
    // if (now - lastCredsCheck < 300000) return true; //
    const CACHE_KEY = 'awsCredsTest';
    const CACHE_TTL = 300000; // 5min
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, failed } = JSON.parse(cached);
        if (now - timestamp < CACHE_TTL) {
          console.log('🔍 Value in awsCredsTest Cache:', failed ? 'FAILED' : 'OK');
          return failed;  // RETURN STORED RESULT (true=failed, false=OK)
        }
      }

      // Test ENV first
      const envTest = await fetch('/api/test-aws?source=env', { 
        method: 'POST'
      });
      const envResult = await envTest.json();
      
      console.log('🔍 ENV Test:', envResult);
      
      if (envResult.success) {
        setShowDemoWarning(false);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, failed: false }));
        // setLastCredsCheck(now);
        return false;  // ENV creds OK
      }
      
      // Test sessionStorage
      if (typeof window !== 'undefined') {
        const sessionCreds = sessionStorage.getItem('aws_creds');
        if (sessionCreds) {
          const sessionTest = await fetch('/api/test-aws?source=session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aws_creds: sessionCreds })
          });
          const sessionResult = await sessionTest.json();
          
          console.log('🔍 Session Test:', sessionResult);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ 
            timestamp: now, 
            failed: !sessionResult.success 
          }));

          if (sessionResult.success) {
            setShowDemoWarning(false);
            return false;  // Session creds OK
          } else {
            setShowDemoWarning(true);
            return true;   // Session creds FAILED
          }
        }
        else {
          console.log('🔍 Session Test: Creds not found');
        }
      }
      
      // No creds found
      setShowDemoWarning(true);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, failed: true }));
      return true;  // No creds = FAILED
      
    } catch (error) {
      console.error('Creds test error:', error);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, failed: true }));
      setShowDemoWarning(true);
      return true;  // Test error = FAILED
    }
  };


  // useEffect(() => {
  //   fetch('/tfn-documents.json')
  //     .then(res => res.json())
  //     .then(data => setDocsCount(data.length))
  //     .catch(() => setDocsCount(6));
  // }, []);

  useEffect(() => {
    fetch('/api/docs-count')
      .then(res => res.json())
      .then(data => {
        console.log('📊', data.message);  
        setDocsCount(data.total);         
      })
      .catch(() => setDocsCount(0));
  }, []);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // useEffect(() => {
  //   testCredsAndShowWarning();  // CALL THE FUNCTION
  // }, []);

  useEffect(() => {
    const checkCreds = async () => {
      localStorage.removeItem('awsCredsTest'); // FORCE FRESH TEST!
      const failed = await testCredsAndShowWarning();
      // console.log('🔍 Fresh check on mount:', failed ? 'FAILED' : 'OK');
    };
    checkCreds();
  }, []); 

  useEffect(() => {
    // Listen for Settings return
    const handleFocus = () => {
      // console.log('🔍 Page focused - rechecking creds...');
      testCredsAndShowWarning();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const processQuery = async (query, showAll = false, replaceLast = false) => {
    if (!query.trim()) return;
    setLoading(true);
    if (!replaceLast) {
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: query, timestamp: new Date() }]);
    }
    try {
      // const awsCreds = JSON.parse(sessionStorage.getItem('aws_creds') || '{}');
      // console.log('Trying RAG...');
      const awsCredsRaw = sessionStorage.getItem('aws_creds');
      const awsCreds = awsCredsRaw ? JSON.parse(awsCredsRaw) : {};
      const hasValidCreds = awsCreds.accessKeyId && awsCreds.secretAccessKey;

      const res = await fetch('/api/rag-alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          showAll,
          aws_creds: hasValidCreds ? awsCreds : undefined  // Only send if VALID
        })
      });

      console.log('RAG Response:', res.status, res.statusText, res.ok);
      
      if (!res.ok) {
        localStorage.removeItem('awsCredsTest');
        const credsFailed = await testCredsAndShowWarning();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: { 
            answer: credsFailed 
              ? '⚠️ AWS credentials expired. Please update in Settings.' 
              : '⚠️ Server error. Please try again.'
          },
          error: true
        }]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (replaceLast) {
        // Replace only the last assistant message, keep everything else
        setMessages(prev => {
          const newMessages = [...prev];
          // Find last assistant message index
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === 'assistant') {
              newMessages[i] = { 
                role: 'assistant', 
                content: data, 
                timestamp: new Date(),
                originalQuery: query // Store the query for future "view all" clicks
              };
              break;
            }
          }
          return newMessages;
        });
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data, 
          timestamp: new Date(),
          originalQuery: query // Store the query for future "view all" clicks
        }]);
      }
    } catch (error) {
      console.error('Query error:', error);
      
      const credsFailed = await testCredsAndShowWarning();  // Returns boolean
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: { 
          answer: credsFailed 
            ? '⚠️ AWS credentials expired. Please update in Settings.' 
            : '⚠️ Query failed. Please try again.'  // Generic error
        },
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

  // Check if response contains structured data
  const hasStructuredData = (msg) => {
    return msg.content?.sources?.some(s => s.isStructured === true);
  };

  // Extract structured items from sources - ADAPTIVE VERSION
  const getStructuredItems = (msg) => {
    if (!msg.content?.sources) return {};
    
    const grouped = {};
    
    msg.content.sources
      .filter(s => s.isStructured)
      .forEach(source => {
        const type = source.page || source.displayType || 'items';
        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(source.metadata || source.rawData);
      });
    
    return grouped;
  };

  // Render structured data as cards
  const renderStructuredData = (msg) => {
    const groupedItems = getStructuredItems(msg);
    
    if (Object.keys(groupedItems).length === 0) return null;

    // Correct data access for hasMore and totalCount (top-level in msg.content)
    const hasMore = msg.content?.hasMore;
    const totalCount = msg.content?.totalCount;
    // Get original query from this specific assistant message
    const originalQuery = msg.originalQuery;

    return (
      <>
        {Object.entries(groupedItems).map(([type, items]) => {
          // Determine color scheme based on type
          const colorScheme = type === 'staff' || type === 'staff_members' ? 'purple' : type === 'partners' ? 'cyan' : 'green';
          return (
            <AdaptiveStructuredCards
              key={type}
              items={items}
              type={type}
              colorScheme={colorScheme}
            />
          );
        })}
        {hasMore && originalQuery && (
          <div className="mt-4 flex justify-center">
            <button
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/40 to-cyan-600/40 border border-purple-400/30 hover:border-purple-400/60 text-sm font-semibold text-white hover:bg-gradient-to-r hover:from-purple-600/60 hover:to-cyan-600/60 transition-all"
              onClick={() => processQuery(originalQuery, true, true)}
            >
              View all ({totalCount})
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-black opacity-90" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{animationDelay: '2s'}} />
        <div className="absolute -bottom-8 left-1/2 w-[500px] h-[500px] bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{animationDelay: '4s'}} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-purple-500/20 bg-black/40 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 hover:scale-105 transition-all group cursor-pointer select-none"
            onClick={handleNewChat}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNewChat()}
          >
            <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-all">
              <MessageCircle className="w-6 h-6 text-white" />
              <div className="absolute inset-0 rounded-lg border border-purple-400/50 group-hover:border-purple-400/70" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                TFN-AI
              </h1>
              <p className="text-xs text-purple-300/70 mt-0.5">{docsCount} documents • Ready</p>
            </div>
          </div>

          <div className="flex gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/40 to-cyan-600/40 border border-purple-400/30 hover:border-purple-400/60 text-sm font-semibold text-white hover:bg-gradient-to-r hover:from-purple-600/60 hover:to-cyan-600/60 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            )}
            <Link 
              href="/settings" 
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600/40 to-blue-600/40 border border-cyan-400/30 hover:border-cyan-400/60 text-sm font-semibold text-white hover:bg-gradient-to-r hover:from-cyan-600/60 hover:to-blue-600/60 transition-all flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>

        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-start pt-2 text-center space-y-4">
              <div className="space-y-3 max-w-2xl">
                <div className="space-y-3">
                  <div className="inline-block">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-cyan-500/40 rounded-2xl flex items-center justify-center border border-purple-400/30 shadow-xl shadow-purple-500/20">
                      <Zap className="w-8 h-8 text-cyan-300" />
                    </div>
                  </div>
                  <h2 className="block text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
                    How can I help?
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">
                    Ask me anything about TFN. I'll search through all indexed documents and provide accurate answers.
                  </p>
                </div>

                {/* Quick Actions */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                  <QuickButton 
                    query="Tell me more about the TFN fellowship program."
                    icon="🎓" color="pink" title="Fellowship" subtitle="More about it"
                  />
                  <QuickButton 
                    query="Who can apply? What are the eligibility requirements?"
                    icon="✅" color="blue" title="Eligibility" subtitle="Who can apply"
                  />
                  <QuickButton 
                    query="What is the application process?"
                    icon="📝" color="green" title="Application" subtitle="Process"
                  />
                  <QuickButton 
                    query="What happens after the 2 years of the fellowship?"
                    icon="🚀" color="amber" title="Beyond" subtitle="After 2 years"
                  />
                  <QuickButton 
                    query="What is the vision of TFN?"
                    icon="🎯" color="purple" title="Vision" subtitle="Ending..."
                  />
                  <QuickButton 
                    query="Who are the partners?"
                    icon="🤝" color="cyan" title="Partners" subtitle="View partners"
                  />
                  <QuickButton 
                    query="Who are the leadership team?"
                    icon="👔" color="rose" title="Leadership Team" subtitle="View"
                  />
                  <QuickButton 
                    query="List all alumni"
                    icon="📚" color="indigo" title="Alumni" subtitle="View"
                  />
                </div>
                {/* Quick Actions */}

              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-3xl w-full ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 px-5 py-4 rounded-2xl ${
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
                        {/* Show answer if not structured or has text content */}
                        {msg.content.answer && !hasStructuredData(msg) && (
                          <p className="text-gray-100 leading-relaxed">{msg.content.answer}</p>
                        )}
                        
                        {/* Show structured data as cards */}
                        {hasStructuredData(msg) && renderStructuredData(msg)}

                        {/* Show RAG sources if any */}
                        {msg.content.sources?.filter(s => !s.isStructured).length > 0 && (
                          <div className="mt-5 pt-4 border-t border-white/15 space-y-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-cyan-400" />
                              <span className="text-sm font-bold text-cyan-300">
                                Document Sources ({msg.content.sources.filter(s => !s.isStructured).length})
                              </span>
                            </div>
                            {msg.content.sources
                              .filter(s => !s.isStructured)
                              .map((source, idx) => (
                                <div key={idx} className="text-sm bg-white/10 p-3 rounded-lg border border-white/10 hover:bg-white/20 transition-colors">
                                  <div className="flex items-start gap-2">
                                    <span>📄</span>
                                    <div>
                                      <p className="font-semibold text-white/90">{source.source.split(/[\\\/]/).pop()}</p>
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
          {showDemoWarning && (
            <div className="mb-4 p-3 bg-orange-500/20 border border-orange-400/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500/80 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">⚠️</span>
                </div>
                <div>
                  <p className="text-orange-100 font-semibold text-sm">AWS credentials not detected or expired</p>
                  <p className="text-orange-200 text-xs mt-0.5">
                    Add credentials for full access
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && input.trim() && !showDemoWarning) {
                  e.preventDefault();
                  processQuery(input);
                }
              }}
              placeholder="Ask about TFN..."
              className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading || showDemoWarning}
            />
            <button
              onClick={() => processQuery(input)}
              disabled={loading || !input.trim() || showDemoWarning || credsFailed}
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
