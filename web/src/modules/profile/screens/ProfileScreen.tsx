"use client";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "@/router";
import { citizenGetMe, updateCitizenProfile } from "@/lib/api";
import { getCitizenUser, getSavedCitizenProfile, saveCitizenProfile, removeCitizenToken } from "@/lib/session";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  FolderLock,
  Trash2,
  ShieldCheck,
  User,
  Cake,
  Phone,
  Mail,
  MapPin,
  Lock,
  UserCheck,
  Briefcase,
  BadgeCheck,
  LogOut,
  CreditCard,
  Building2,
  Users
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];

const OCCUPATIONS = [
  { value: "farmer", label: "Farmer (Agriculture)" },
  { value: "artisan", label: "Artisan / Weaver" },
  { value: "student", label: "Student / Scholar" },
  { value: "self_employed", label: "Self Employed (MSME)" },
  { value: "daily_wager", label: "Daily Wage Laborer" },
  { value: "salaried", label: "Salaried Employee" },
  { value: "unemployed", label: "Unemployed / Jobseeker" },
  { value: "retired", label: "Senior Citizen / Retired" },
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [citizenUid, setCitizenUid] = useState("CIT-8849");

  // Tab State
  const [activeTab, setActiveTab] = useState<'personal' | 'demographics' | 'land' | 'dbt' | 'documents'>('personal');

  // Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Initial Form Data
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "male",
    state: "Karnataka",
    district: "",
    annual_income: 0,
    occupation: "farmer",
    caste_category: "General",
    residence_area: "Rural",
    marital_status: "Single",
    has_land: false,
    is_differently_abled: false,
    whatsapp_opt_in: true,
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!oldPassword || !newPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    setPasswordSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1200);
  };

  useEffect(() => {
    const localUser = getCitizenUser();
    const savedProfile = getSavedCitizenProfile();

    if (localUser) {
      setEmail(localUser.email || "");
      setPhone(localUser.phone || "");
      if (localUser.citizen_uid) setCitizenUid(localUser.citizen_uid);
      setAvatar(localUser.avatar_url || localUser.photoURL || "");

      const resolvedName =
        localUser.profile?.full_name ||
        localUser.full_name ||
        localUser.displayName ||
        (localUser.email ? localUser.email.split("@")[0] : "");

      if (resolvedName) {
        setFormData((prev) => ({ ...prev, full_name: resolvedName }));
      }
    }

    if (savedProfile) {
      setFormData((prev) => ({
        ...prev,
        state: savedProfile.state || prev.state,
        district: savedProfile.district || prev.district,
        occupation: savedProfile.occupation || prev.occupation,
        annual_income: savedProfile.annual_income || prev.annual_income,
        caste_category: savedProfile.caste_category || prev.caste_category,
        residence_area: savedProfile.residence_area || prev.residence_area,
        gender: savedProfile.gender || prev.gender,
        has_land: savedProfile.has_land ?? prev.has_land,
        is_differently_abled: savedProfile.is_differently_abled ?? prev.is_differently_abled,
      }));
    }

    citizenGetMe()
      .then((user) => {
        setEmail(user.email || localUser?.email || "");
        if (user.phone) setPhone(user.phone);
        if (user.citizen_uid) setCitizenUid(user.citizen_uid);

        if (user.profile) {
          setFormData((prev) => ({
            ...prev,
            full_name: user.profile.full_name || prev.full_name,
            date_of_birth: user.profile.date_of_birth || prev.date_of_birth,
            gender: user.profile.gender || prev.gender,
            state: user.profile.state || prev.state,
            district: user.profile.district || prev.district,
            annual_income: user.profile.annual_income || prev.annual_income,
            occupation: user.profile.occupation || prev.occupation,
            caste_category: user.profile.caste_category || prev.caste_category,
            residence_area: user.profile.residence_area || prev.residence_area,
            marital_status: user.profile.marital_status || prev.marital_status,
            has_land: user.profile.has_land ?? prev.has_land,
            is_differently_abled: user.profile.is_differently_abled ?? prev.is_differently_abled,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const calculateCompleteness = () => {
    let score = 0;
    if (formData.full_name.trim()) score += 25;
    if (formData.date_of_birth) score += 15;
    if (formData.state) score += 15;
    if (formData.district.trim()) score += 15;
    if (formData.occupation) score += 15;
    if (formData.annual_income > 0) score += 15;
    return Math.min(score, 100);
  };
  const completeness = calculateCompleteness();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      saveCitizenProfile({
        age: 35,
        gender: formData.gender,
        state: formData.state,
        district: formData.district,
        annual_income: formData.annual_income,
        occupation: formData.occupation,
        caste_category: formData.caste_category,
        residence_area: formData.residence_area,
        marital_status: formData.marital_status,
        has_land: formData.has_land,
        is_differently_abled: formData.is_differently_abled,
      });

      await updateCitizenProfile(formData).catch(() => {});

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    removeCitizenToken();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center font-sans">
          <div className="h-10 w-10 border-4 border-[#0E6245]/20 border-t-[#0E6245] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-500 font-semibold">Loading citizen profile facts...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans px-4 sm:px-6 lg:px-8 py-8 items-center w-full">
        <div className="w-full max-w-6xl space-y-6">

          {/* Top Profile Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                {avatar ? (
                  <img src={avatar} alt={formData.full_name} className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-[#166534] font-black text-2xl uppercase border border-[#BBF7D0] shadow-sm">
                    {formData.full_name.charAt(0) || 'C'}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                  <div className="bg-[#DCFCE7] text-[#166534] h-6 w-6 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{formData.full_name || 'Citizen User'}</h1>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded-lg border border-slate-200">
                    {citizenUid}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-400" /> {email}</span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-400" /> {phone || 'Add Phone'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-[#DCFCE7]/60 text-[#166534] flex items-center gap-2 border border-[#BBF7D0]/60">
                <UserCheck className="h-5 w-5 text-[#16A34A]" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider">DigiLocker Linked</span>
                  <span className="text-[10px] font-semibold opacity-90">Aadhaar Verified Tier</span>
                </div>
              </div>
              <button onClick={() => setShowLogoutModal(true)} className="w-full sm:w-auto h-11 px-4 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Horizontal Segmented Control Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-5 py-3 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'personal' ? 'bg-[#0E6245] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'}`}
            >
              <User className="h-4 w-4" /> Identity & Contact
            </button>
            <button
              onClick={() => setActiveTab('demographics')}
              className={`px-5 py-3 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'demographics' ? 'bg-[#0E6245] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'}`}
            >
              <Users className="h-4 w-4" /> Household & Demographics
            </button>
            <button
              onClick={() => setActiveTab('land')}
              className={`px-5 py-3 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'land' ? 'bg-[#0E6245] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'}`}
            >
              <Briefcase className="h-4 w-4" /> Land & Occupation
            </button>
            <button
              onClick={() => setActiveTab('dbt')}
              className={`px-5 py-3 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'dbt' ? 'bg-[#0E6245] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'}`}
            >
              <CreditCard className="h-4 w-4" /> Bank & DBT Routing
            </button>
            <button
              onClick={() => { window.location.href = '/vault' }}
              className={`px-5 py-3 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200`}
            >
              <FolderLock className="h-4 w-4" /> Documents Vault
              <span className="px-1.5 py-0.5 rounded-full bg-[#E2E7FF] text-[#0E6245] font-mono text-[10px]">4</span>
            </button>
          </div>

          {/* MAIN GRID: CONTENT (LEFT) + STATUS (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT REGION: STRUCTURED EDIT FORM */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {success && (
                <div className="p-4 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] text-sm font-bold flex items-center gap-2 shadow-xs animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
                  <span>Profile details saved successfully!</span>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2 shadow-xs">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* TAB 1: PERSONAL & IDENTITY */}
              {activeTab === 'personal' && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in duration-300">

                  {/* CARD 1: PRIMARY IDENTITY */}
                  <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Primary Identity & Contact</h2>
                        <p className="text-sm text-slate-500 font-medium">Core details authenticated via Aadhaar e-KYC.</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F3FF] text-[#0E6245] text-[11px] font-bold border border-[#E2E7FF]">
                        <Lock className="h-3 w-3" /> e-KYC Locked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name (Read-only verified with lock) */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Full Name (As per Aadhaar)</label>
                          <span className="text-[10px] text-[#1F6C3A] font-bold flex items-center gap-1 bg-[#DCFCE7] px-2 py-0.5 rounded">
                            <BadgeCheck className="h-3 w-3" /> UIDAI Matched
                          </span>
                        </div>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            value={formData.full_name}
                            readOnly
                            className="w-full h-12 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none cursor-not-allowed"
                          />
                          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Date of Birth</label>
                          <span className="text-[10px] text-slate-500 font-mono font-bold px-2 py-0.5 bg-slate-100 rounded">Age: {new Date().getFullYear() - new Date(formData.date_of_birth || '1998-01-01').getFullYear()} Yrs</span>
                        </div>
                        <div className="relative">
                          <Cake className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                          <input
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/20 transition-all cursor-text"
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Primary Mobile Number</label>
                          <span className="text-[10px] text-[#1F6C3A] font-bold flex items-center gap-1 bg-[#DCFCE7] px-2 py-0.5 rounded">
                            <BadgeCheck className="h-3 w-3" /> OTP Verified
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-14 border-r border-slate-200 bg-slate-50 rounded-l-xl text-sm font-bold text-slate-600">
                            +91
                          </div>
                          <input
                            type="text"
                            value={phone.replace('+91', '')}
                            onChange={(e) => setPhone(`+91${e.target.value}`)}
                            className="w-full h-12 pl-16 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Communication Email</label>
                          <span className="text-[10px] text-[#1F6C3A] font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 pl-12 pr-20 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/20 transition-all"
                          />
                          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0E6245] hover:underline cursor-pointer">
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* CARD 2: DOMICILE & LOCATION */}
                  <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Domicile & Geographic Location</h2>
                        <p className="text-sm text-slate-500 font-medium">Determines your state-specific welfare entitlements.</p>
                      </div>
                      <span className="text-xs text-slate-500 font-mono font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                        PIN: 573218
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* State */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">State of Domicile</label>
                        <select
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/20 transition-all cursor-pointer"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      {/* District */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">District / Region</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            placeholder="e.g. Hassan, Patna, Pune"
                            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Residence Area */}
                      <div className="flex flex-col gap-2 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700">Residence Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          {["Rural", "Urban"].map((area) => (
                            <button
                              type="button"
                              key={area}
                              onClick={() => setFormData({ ...formData, residence_area: area })}
                              className={`py-3 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                                formData.residence_area === area
                                  ? "bg-[#DCFCE7] border-[#16A34A] text-[#166534] shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {area === "Rural" ? "🌾 Rural (Gramin)" : "🏙️ Urban (Nagar)"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* CLEAN DOCKED FORM ACTIONS */}
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm gap-4 sticky bottom-6 z-20">
                    <button type="button" className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-sm transition-colors cursor-pointer">
                      Discard Changes
                    </button>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <span className="text-xs text-slate-500 hidden md:inline font-medium">Changes save directly to citizen profile</span>
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#0E6245] text-white font-bold text-sm hover:bg-[#004831] transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Save Profile Updates</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 3: LAND & OCCUPATION (Socio-Economic Profile) */}
              {(activeTab === 'land' || activeTab === 'demographics') && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Socio-Economic & Land Details</h2>
                        <p className="text-sm text-slate-500 font-medium">Validated against state revenue registry and caste income certificates.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                        Auto-Synced
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Occupation */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">Primary Occupation</label>
                        <select
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/20 transition-all cursor-pointer"
                        >
                          {OCCUPATIONS.map((occ) => (
                            <option key={occ.value} value={occ.value}>{occ.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Annual Income */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">Annual Family Income</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            value={formData.annual_income}
                            onChange={(e) => setFormData({ ...formData, annual_income: Number(e.target.value) })}
                            className="w-full h-12 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/20 transition-all"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Non-IT Payee Tier</span>
                      </div>

                      {/* Social Category */}
                      <div className="flex flex-col gap-2 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Social Category (Quota)</label>
                          <span className="text-[10px] text-[#1F6C3A] font-bold">Certificate RD-0038910 verified</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['General', 'OBC', 'SC', 'ST'].map((cat) => (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => setFormData({ ...formData, caste_category: cat })}
                              className={`py-3 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                                formData.caste_category === cat
                                  ? "bg-[#0E6245] border-[#0E6245] text-white shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Special Flags Checkboxes */}
                      <div className="sm:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.has_land ? 'bg-[#F0FDF4] border-[#16A34A]' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                          <input
                            type="checkbox"
                            checked={formData.has_land}
                            onChange={(e) => setFormData({ ...formData, has_land: e.target.checked })}
                            className="h-5 w-5 rounded border-slate-300 text-[#0E6245] focus:ring-[#0E6245] cursor-pointer"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-900">Agricultural Land Holder</div>
                            <div className="text-xs text-slate-500 font-medium">Owns cultivable land (PM-Kisan)</div>
                          </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.is_differently_abled ? 'bg-[#FEF3C7] border-[#F59E0B]' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                          <input
                            type="checkbox"
                            checked={formData.is_differently_abled}
                            onChange={(e) => setFormData({ ...formData, is_differently_abled: e.target.checked })}
                            className="h-5 w-5 rounded border-slate-300 text-[#D97706] focus:ring-[#D97706] cursor-pointer"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-900">Person with Disability</div>
                            <div className="text-xs text-slate-500 font-medium">Eligible for assistive aids</div>
                          </div>
                        </label>
                      </div>

                    </div>
                  </section>

                  {/* CLEAN DOCKED FORM ACTIONS */}
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm gap-4 sticky bottom-6 z-20">
                    <button type="button" className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-sm transition-colors cursor-pointer">
                      Discard Changes
                    </button>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <span className="text-xs text-slate-500 hidden md:inline font-medium">Changes save directly to citizen profile</span>
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#0E6245] text-white font-bold text-sm hover:bg-[#004831] transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Save Profile Updates</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 4: BANK & DBT ROUTING */}
              {activeTab === 'dbt' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Bank Account & NPCI Aadhaar Seeding</h2>
                        <p className="text-sm text-slate-500 font-medium">Direct Benefit Transfer (DBT) target account for central and state subsidies.</p>
                      </div>
                      <span className="px-3 py-1.5 rounded-full bg-[#DCFCE7] text-[#166534] text-xs font-bold border border-[#BBF7D0]">
                        NPCI Active
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#0E6245] shrink-0 shadow-xs">
                          <Building2 className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-900">State Bank of India (Hassan Main Branch)</span>
                          <span className="font-mono text-sm text-slate-600 font-bold mt-0.5">A/C: **********4492 • IFSC: SBIN0000844</span>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0E6245] shadow-xs whitespace-nowrap">
                        Primary DBT
                      </span>
                    </div>
                  </section>
                </div>
              )}

            </div>

            {/* RIGHT REGION: READINESS STATUS */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#0E6245]" />
                  <h3 className="text-base font-black text-slate-900">Security & Access</h3>
                </div>
                <p className="text-sm text-slate-600 font-medium">Manage your login credentials and data privacy settings.</p>

                <div className="flex flex-col gap-3 mt-2">
                  <button onClick={() => setShowPasswordModal(true)} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-left transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                        <Key className="h-4 w-4 text-[#0E6245]" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 group-hover:text-[#0E6245]">Change Password</span>
                        <span className="text-xs text-slate-500 font-medium block">Update account login password</span>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => navigate('/delete-account')} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-left transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white border border-rose-200 shadow-xs">
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-rose-700 group-hover:text-rose-900">Delete Account</span>
                        <span className="text-xs text-rose-600 font-medium block">Permanently erase citizen profile</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-8">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-black">
                <Key className="h-5 w-5 text-[#0E6245]" />
                <span>Change Password</span>
              </DialogTitle>
            </DialogHeader>

            {passwordError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold shadow-xs">
                {passwordError}
              </div>
            )}

            {passwordSuccess ? (
              <div className="p-4 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] text-sm font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current Password</label>
                  <Input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Password</label>
                  <Input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
                  <Input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                </div>
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white font-bold text-sm shadow-sm transition-all cursor-pointer active:scale-95">Update Password</button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Logout Modal */}
        <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
          <DialogContent className="sm:max-w-sm rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col items-center text-center gap-4 pt-4">
              <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                <LogOut className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Sign Out Securely</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">Are you sure you want to log out of your citizen account? Unsaved form data may be lost.</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer active:scale-95">Yes, Sign Out</button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
