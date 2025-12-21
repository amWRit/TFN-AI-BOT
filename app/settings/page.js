'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, Database, Settings2, Shield, RefreshCw } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('aws');
  const [creds, setCreds] = useState({ accessKeyId: '', secretAccessKey: '', sessionToken: '' });
  const [saved, setSaved] = useState(false);
  const [docsData, setDocsData] = useState({ total: 0, breakdown: {} });

  useEffect(() => {
    fetch('/api/docs-count')
      .then(res => res.json())
      .then(setDocsData)
      .catch(() => setDocsData({ total: 0, breakdown: {} }));
  }, []);

  const saveCreds = (e) => {
    e.preventDefault();
    sessionStorage.setItem('aws_creds', JSON.stringify(creds));
    localStorage.removeItem('awsCredsTest');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const TabButton = ({ tab, icon: Icon, label, active }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium ${
        active
          ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/40 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/20'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-black p-8">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10 px-8 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            ⚙️ App Settings
          </h1>
          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
            <TabButton tab="aws" icon={Shield} label="AWS Credentials" active={activeTab === 'aws'} />
            <TabButton tab="data" icon={Database} label="Data Sources" active={activeTab === 'data'} />
            <TabButton tab="advanced" icon={Settings2} label="Advanced" active={activeTab === 'advanced'} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'aws' && (
            <div className="space-y-4">
              <form onSubmit={saveCreds} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Access Key ID</label>
                  <input
                    type="text"
                    placeholder="ASIAY..."
                    value={creds.accessKeyId}
                    onChange={(e) => setCreds({ ...creds, accessKeyId: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Secret Access Key</label>
                  <input
                    type="password"
                    placeholder="wJta..."
                    value={creds.secretAccessKey}
                    onChange={(e) => setCreds({ ...creds, secretAccessKey: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Session Token (optional)</label>
                  <input
                    type="password"
                    placeholder="IQoJ..."
                    value={creds.sessionToken}
                    onChange={(e) => setCreds({ ...creds, sessionToken: e.target.value })}
                    className="w-full p-4 border border-gray-300 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25 transition-all"
                >
                  💾 Save Credentials
                </button>
              </form>
              
              {saved && (
                <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl text-green-100">
                  ✅ Credentials saved! Ready to use in chat.
                </div>
              )}
              
              <p className="text-xs text-gray-400 text-center mt-6">
                Stored locally (clears on tab close). Falls back to .ENV vars.
              </p>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <div className="p-8 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-400/20 rounded-2xl text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-4">{docsData.total} documents</div>
                <div className="text-sm text-gray-300 mb-6">ready for search</div>
                <div className="grid grid-cols-2 gap-4 text-sm max-w-md mx-auto">
                  {docsData.breakdown && Object.entries(docsData.breakdown).map(([section, count]) => (
                    <div key={section} className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="capitalize">{section.replace('_', ' ')}:</span>
                      <span className="font-mono text-emerald-400 font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="p-6 bg-orange-500/10 border border-orange-400/20 rounded-2xl">
                <h3 className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
                  <span>⚠️</span> Clear All Cache
                </h3>
                <p className="text-sm text-gray-300 mb-4">Clears AWS test cache, session data, and local storage.</p>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    alert('✅ All cache cleared! Refresh chat to test.');
                  }}
                  className="w-full px-6 py-2 bg-orange-500/80 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
                >
                  Clear All Cache
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-6 border-t border-white/10 flex gap-3">
          <Link 
            href="/" 
            className="flex-1 bg-gradient-to-r from-purple-600/40 to-cyan-600/40 border border-purple-400/30 hover:border-purple-400/60 text-sm font-semibold text-white py-3 px-6 rounded-xl hover:bg-gradient-to-r hover:from-purple-600/60 hover:to-cyan-600/60 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Chat
          </Link>
          <Link 
            href="/" 
            className="px-6 py-3 bg-gradient-to-r from-gray-600/40 to-gray-700/40 border border-gray-400/30 hover:border-gray-400/60 text-sm font-semibold text-white rounded-xl hover:bg-gradient-to-r hover:from-gray-600/60 hover:to-gray-700/60 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
