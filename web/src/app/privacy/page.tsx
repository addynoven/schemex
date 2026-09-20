import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, Trash2, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Scheme Assistant',
  description: 'Privacy Policy and Data Safety information for Scheme Assistant Mobile Application.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-slate-400 text-sm">Last updated: September 21, 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                1. Overview & Purpose
              </h2>
              <p>
                Scheme Assistant (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is designed to assist Indian citizens in discovering,
                evaluating eligibility, and applying for Central and State government welfare schemes. We respect your privacy
                and are committed to protecting your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" /> 2. Information We Collect
              </h2>
              <p className="mb-3">When you use Scheme Assistant, we collect the following minimal categories of data:</p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400">
                <li><strong className="text-slate-200">Account Information:</strong> Full name, email address, and authentication tokens provided via Firebase Authentication or Google Sign-In.</li>
                <li><strong className="text-slate-200">Profile & Eligibility Criteria:</strong> Demographic state, district, occupation, annual income bracket, and category (used exclusively on your device to calculate scheme eligibility).</li>
                <li><strong className="text-slate-200">Document Vault Files:</strong> Identity documents (e.g. Aadhaar, ration card, income certificate) uploaded voluntarily to help verify scheme eligibility.</li>
                <li><strong className="text-slate-200">Chat History:</strong> Advisory questions asked in the scheme chat to allow cross-device sync.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> 3. How We Use Your Data
              </h2>
              <p className="mb-2">Your data is strictly used for:</p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
                <li>Matching your profile against 4,140+ official government scheme eligibility rules.</li>
                <li>Securely organizing your documents in your personal encrypted vault.</li>
                <li>Restoring your chat consultations and saved schemes across devices when you log in.</li>
                <li>We <strong className="text-white">never</strong> sell, monetize, or share your data with commercial third-party advertisers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                4. Data Storage & Security
              </h2>
              <p>
                All data transmission between the mobile app, cloud API, and storage is protected using TLS 1.3 encryption.
                Document binaries are held in encrypted cloud storage with restricted access keys, and database records reside
                in a private PostgreSQL cloud cluster.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" /> 5. Data Retention & Account Deletion
              </h2>
              <p className="mb-3">
                You retain complete ownership of your personal data. In compliance with Google Play Store policies, you can
                delete your account and all associated data at any time:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400 mb-3">
                <li><strong className="text-slate-200">In-App:</strong> Go to Settings → Security → Delete Account.</li>
                <li><strong className="text-slate-200">Online:</strong> Use our public <Link href="/delete-account" className="text-emerald-400 underline hover:text-emerald-300">Account Deletion Request Form</Link>.</li>
              </ul>
              <p>
                Upon deletion request, all personal profiles, document vault files, and chat records are purged immediately from our databases.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Contact Us</h2>
              <p>
                If you have questions regarding this Privacy Policy or your data, please contact the developer team at{' '}
                <a href="mailto:support@schememobile.app" className="text-emerald-400 underline hover:text-emerald-300">
                  support@schememobile.app
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
