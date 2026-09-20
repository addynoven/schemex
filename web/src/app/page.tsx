'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Database,
  Users,
  FileText,
  MessageSquare,
  ShieldCheck,
  Search,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Server,
  Layers,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

interface StatsData {
  status: string;
  database: string;
  pingMs: number;
  counts: {
    schemes: number;
    users: number;
    documents: number;
    chatSessions: number;
  };
  recentUsers: Array<{
    id: number;
    email: string;
    citizen_uid: string;
    is_verified: boolean;
    created_at: string;
  }>;
  recentSchemes: Array<{
    id: number;
    title: string;
    category: string;
    state: string;
  }>;
}

interface SchemeItem {
  id: number;
  slug: string;
  title: string;
  ministry: string;
  state: string;
  category: string;
  is_central: number;
  benefit_summary: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'schemes' | 'citizens' | 'api'>('overview');

  // Schemes explorer state
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [schemeQuery, setSchemeQuery] = useState('');
  const [schemesTotal, setSchemesTotal] = useState(0);
  const [schemesPage, setSchemesPage] = useState(0);
  const [schemesLoading, setSchemesLoading] = useState(false);

  // Load dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load schemes from Aiven
  const fetchSchemes = useCallback(async (search = '', page = 0) => {
    try {
      setSchemesLoading(true);
      const limit = 20;
      const offset = page * limit;
      const url = `/api/schemes?limit=${limit}&offset=${offset}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSchemes(data.schemes || []);
        setSchemesTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load schemes:', err);
    } finally {
      setSchemesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'schemes') {
      fetchSchemes(schemeQuery, schemesPage);
    }
  }, [activeTab, schemeQuery, schemesPage, fetchSchemes]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white">Scheme Core Admin</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Primary DB Hub
                </span>
              </div>
              <p className="text-xs text-slate-400">Aiven PostgreSQL & Mobile Cloud Gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {stats && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-mono text-[11px]">{stats.pingMs}ms latency</span>
              </div>
            )}
            <Link
              href="/privacy"
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Privacy Policy <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/delete-account"
              className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              Deletion Portal <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Banner with DB Status */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" /> Live Backend Status
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Aiven Cloud Database Operations
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Central source of truth serving the React Native mobile app. All 4,147 government schemes, citizen accounts,
              vault records, and advisory chats are synchronized in real-time.
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium transition-colors text-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Schemes */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Total Schemes</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {stats?.counts.schemes.toLocaleString() || '4,147'}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Central & State DB Source
            </p>
          </div>

          {/* Card 2: Registered Citizens */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Registered Citizens</span>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {stats?.counts.users || '10'}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Firebase & Postgres Synced
            </p>
          </div>

          {/* Card 3: Vault Documents */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Vault Files Stored</span>
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {stats?.counts.documents || '0'}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Cloudinary Secured
            </p>
          </div>

          {/* Card 4: Advisory Chats */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">AI Chat Consults</span>
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {stats?.counts.chatSessions || '0'}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Cross-Device Cloud Synced
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-800 flex gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> System Overview
          </button>
          <button
            onClick={() => setActiveTab('schemes')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'schemes'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Schemes Explorer ({stats?.counts.schemes || 4147})
          </button>
          <button
            onClick={() => setActiveTab('citizens')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'citizens'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Citizen Accounts
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'api'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" /> Mobile API Gateway
          </button>
        </div>

        {/* Tab 1: System Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Recent Citizens */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Recent Citizen Provisioning</span>
                <span className="text-xs text-slate-400 font-normal">Aiven users table</span>
              </h3>
              <div className="space-y-3">
                {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{u.email || 'Anonymous Citizen'}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">{u.citizen_uid}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                            u.is_verified
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {u.is_verified ? 'Verified' : 'Pending Verification'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No citizen accounts recorded yet.</p>
                )}
              </div>
            </div>

            {/* Right: Architecture & Offline SQLite Sync Status */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Mobile Architecture Topology</span>
                <span className="text-xs text-emerald-400 font-normal">Production Config</span>
              </h3>

              <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400 mt-0.5">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Offline SQLite Engine (Mobile Client)</div>
                    <p className="text-slate-400 mt-0.5">
                      `schemes.db` (8.3 MB) bundled in Expo app. Search, eligibility evaluation, and bookmarks execute with 0ms network latency.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20 text-blue-400 mt-0.5">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Cloud API Gateway (Vercel Serverless)</div>
                    <p className="text-slate-400 mt-0.5">
                      Zero-cost serverless routes bridging mobile app authentication, document vault, and chat sync directly to Aiven PostgreSQL.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-purple-500/10 rounded border border-purple-500/20 text-purple-400 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Google Play Store Compliance</div>
                    <p className="text-slate-400 mt-0.5">
                      Public privacy policy and self-service account deletion endpoints active on this domain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Schemes Explorer */}
        {activeTab === 'schemes' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search 4,147 schemes..."
                  value={schemeQuery}
                  onChange={(e) => {
                    setSchemeQuery(e.target.value);
                    setSchemesPage(0);
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-xs text-slate-400">
                Showing {schemes.length} of {schemesTotal.toLocaleString()} matching schemes
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold text-left">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Scheme Title</th>
                    <th className="py-2.5 px-3">Ministry</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Jurisdiction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {schemesLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Querying Aiven PostgreSQL...
                      </td>
                    </tr>
                  ) : schemes.length > 0 ? (
                    schemes.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-mono text-slate-500">{s.id}</td>
                        <td className="py-2 px-3 font-medium text-white max-w-xs truncate">{s.title}</td>
                        <td className="py-2 px-3 text-slate-400 max-w-[180px] truncate">
                          {s.ministry || 'Government of India'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {s.category || 'General'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                          {s.state === 'ALL_INDIA' ? 'Central' : s.state}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No schemes match your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={schemesPage === 0 || schemesLoading}
                onClick={() => setSchemesPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 border border-slate-700 rounded text-xs text-slate-200"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">Page {schemesPage + 1}</span>
              <button
                disabled={(schemesPage + 1) * 20 >= schemesTotal || schemesLoading}
                onClick={() => setSchemesPage((p) => p + 1)}
                className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 border border-slate-700 rounded text-xs text-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Citizens Directory */}
        {activeTab === 'citizens' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Registered Citizen Accounts ({stats?.counts.users || 0})
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold text-left">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Citizen UID</th>
                    <th className="py-2.5 px-3">Verification</th>
                    <th className="py-2.5 px-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {stats?.recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{u.id}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{u.email}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{u.citizen_uid}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            u.is_verified
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {u.is_verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Mobile API Gateway Monitor */}
        {activeTab === 'api' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Mobile App Active API Endpoints
            </h3>
            <p className="text-xs text-slate-400">
              These HTTPS endpoints directly bridge the React Native client app to Aiven Cloud PostgreSQL:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                { method: 'GET / POST', path: '/api/users', desc: 'Citizen login lookup, auto-provisioning & email verification' },
                { method: 'GET / POST', path: '/api/profiles', desc: 'Demographic parameters (income, state, category)' },
                { method: 'GET / POST / DEL', path: '/api/user_documents', desc: 'Vault document metadata and Cloudinary sync' },
                { method: 'GET / POST', path: '/api/chat_sessions', desc: 'Advisory chat sessions cross-device sync' },
                { method: 'POST', path: '/api/chat_messages', desc: 'Bulk chat message persistence' },
                { method: 'POST', path: '/api/account/delete', desc: 'Play Store required user purge endpoint' },
              ].map((api, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-start justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{api.method}</span>
                      <span className="font-mono text-slate-200">{api.path}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">{api.desc}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 shrink-0">
                    Live
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Scheme Core Backend & Admin Panel • Connected to Aiven PostgreSQL</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="/delete-account" className="hover:text-slate-300">
              Account Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
