'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function Settings() {
  const [creds, setCreds] = useState({ accessKeyId: '', secretAccessKey: '', sessionToken: '' });
  const [saved, setSaved] = useState(false);

  const saveCreds = (e) => {
    e.preventDefault();
    sessionStorage.setItem('aws_creds', JSON.stringify(creds));
    // setShowDemoWarning(false);
    localStorage.removeItem('awsCredsTest');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-black p-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6">
          ⚙️ AWS Credentials
        </h1>
        
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
        
        <p className="mt-6 text-xs text-gray-400 text-center">
          Stored locally (clears on tab close). Falls back to .ENV vars.
        </p>

        <div className="mt-8 pt-6 border-t border-white/10 flex gap-3">
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
