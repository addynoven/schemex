'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !confirmed) return;

    setLoading(true);
    setStatus('idle');

    try {
      // Find user and purge data
      const lookupRes = await fetch(`/api/users?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const users = await lookupRes.json();

      if (!users || users.length === 0) {
        setStatus('error');
        setMessage(`No account found matching email "${email}". Please verify your email address.`);
        setLoading(false);
        return;
      }

      const user = users[0];

      // Request deletion
      const delRes = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          reason,
        }),
      });

      if (delRes.ok) {
        setStatus('success');
        setMessage('Your account, personal profile, document vault, and chat history have been permanently deleted.');
      } else {
        setStatus('error');
        setMessage('Unable to process deletion request right now. Please email support@schememobile.app.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Account Deletion Request</h1>
              <p className="text-slate-400 text-sm">Google Play Data Safety Compliance</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/90 leading-relaxed">
              <strong>Warning:</strong> Deleting your account will permanently wipe:
              <ul className="list-disc list-inside mt-1 text-amber-300/80 space-y-0.5">
                <li>Your citizen profile and demographic parameters</li>
                <li>All documents uploaded to your private Document Vault</li>
                <li>All chat history and saved government schemes</li>
              </ul>
            </div>
          </div>

          {status === 'success' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Account Successfully Purged</h3>
              <p className="text-sm text-slate-300 mb-4">{message}</p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Return to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Reason for Deletion (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us why you are deleting your account..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors text-sm resize-none"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="confirm"
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="confirm" className="text-xs sm:text-sm text-slate-400 leading-normal select-none">
                  I understand that this action is irreversible and permanently removes all my citizen data, eligibility records, and uploaded files.
                </label>
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !confirmed || !email}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-red-600/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {loading ? 'Processing Deletion...' : 'Permanently Delete My Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
