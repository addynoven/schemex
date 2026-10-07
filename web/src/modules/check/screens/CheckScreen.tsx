"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "@/router";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  Sparkles,
  ChevronDown,
  Check,
  ChevronRight,
  ShieldCheck,
  IndianRupee,
} from "lucide-react";
import { checkEligibility, type EligibilityCheckPayload } from "@/lib/api";
import {
  saveCitizenProfile,
  saveEligibilityReport,
  getSavedCitizenProfile,
} from "@/lib/session";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";

const ALL_36_INDIAN_STATES_AND_UTS = [
  { name: "Andhra Pradesh", type: "State" },
  { name: "Arunachal Pradesh", type: "State" },
  { name: "Assam", type: "State" },
  { name: "Bihar", type: "State" },
  { name: "Chhattisgarh", type: "State" },
  { name: "Goa", type: "State" },
  { name: "Gujarat", type: "State" },
  { name: "Haryana", type: "State" },
  { name: "Himachal Pradesh", type: "State" },
  { name: "Jharkhand", type: "State" },
  { name: "Karnataka", type: "State" },
  { name: "Kerala", type: "State" },
  { name: "Madhya Pradesh", type: "State" },
  { name: "Maharashtra", type: "State" },
  { name: "Manipur", type: "State" },
  { name: "Meghalaya", type: "State" },
  { name: "Mizoram", type: "State" },
  { name: "Nagaland", type: "State" },
  { name: "Odisha", type: "State" },
  { name: "Punjab", type: "State" },
  { name: "Rajasthan", type: "State" },
  { name: "Sikkim", type: "State" },
  { name: "Tamil Nadu", type: "State" },
  { name: "Telangana", type: "State" },
  { name: "Tripura", type: "State" },
  { name: "Uttar Pradesh", type: "State" },
  { name: "Uttarakhand", type: "State" },
  { name: "West Bengal", type: "State" },
  { name: "Andaman and Nicobar Islands", type: "UT" },
  { name: "Chandigarh", type: "UT" },
  { name: "Dadra and Nagar Haveli and Daman and Diu", type: "UT" },
  { name: "Delhi", type: "UT" },
  { name: "Jammu and Kashmir", type: "UT" },
  { name: "Ladakh", type: "UT" },
  { name: "Lakshadweep", type: "UT" },
  { name: "Puducherry", type: "UT" },
];

const POPULAR_STATES = [
  "Madhya Pradesh",
  "Maharashtra",
  "Uttar Pradesh",
  "Bihar",
  "Rajasthan",
  "Karnataka",
  "Gujarat",
];

const OCCUPATIONS = [
  { id: "farmer", label: "Small / Marginal Farmer", desc: "Holding < 2.0 Hectares", icon: "🌾" },
  { id: "agri_labor", label: "Agricultural Laborer", desc: "Landless Farm Wage", icon: "🌿" },
  { id: "artisan", label: "Artisan / Weaver", desc: "Traditional Crafts & Loom", icon: "🎨" },
  { id: "self_employed", label: "Self-Employed / MSME", desc: "Micro Retail or Service", icon: "🏢" },
  { id: "construction", label: "Construction Worker", desc: "BOCW Registered / Unreg.", icon: "🏗️" },
  { id: "student", label: "Unemployed / Student", desc: "Youth Fellowship Eligible", icon: "🎓" },
  { id: "homemaker", label: "Homemaker", desc: "Gruha Lakshmi Benefit Tier", icon: "🏡" },
  { id: "driver", label: "Transport / Commercial", desc: "Driver Welfare Board", icon: "🚚" },
];

const CASTE_CATEGORIES = [
  { id: "General", label: "General / Unreserved" },
  { id: "OBC", label: "OBC (Other Backward Class)" },
  { id: "SC", label: "SC (Scheduled Caste)" },
  { id: "ST", label: "ST (Scheduled Tribe)" },
  { id: "EWS", label: "EWS (Economically Weaker Section)" },
];

const INCOME_PRESETS = [
  { label: "₹0 (No Income)", value: 0 },
  { label: "< ₹1.2 Lakh", value: 120000 },
  { label: "₹2.5 Lakh", value: 250000 },
  { label: "₹5.0 Lakh", value: 500000 },
  { label: "₹8.0 Lakh", value: 800000 },
  { label: "₹10L+", value: 1200000 },
];

export function CheckScreen() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EligibilityCheckPayload>({
    age: 42,
    gender: "Male",
    state: "Karnataka",
    district: "Hassan",
    annual_income: 180000,
    occupation: "farmer",
    caste_category: "General",
    is_differently_abled: false,
    marital_status: "Married",
    residence_area: "Rural",
    has_land: true,
  });

  useEffect(() => {
    const saved = getSavedCitizenProfile();
    if (saved) {
      setFormData((prev) => ({ ...prev, ...saved }));
    }
  }, []);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      saveCitizenProfile(formData);
      const report = await checkEligibility(formData);
      saveEligibilityReport(report);
      navigate("/results");
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to evaluate eligibility. Please check your connection.",
      );
      setLoading(false);
    }
  }

  const renderProgressTracker = () => {
    return (
      <section className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">

            {/* Step 1 */}
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-[13px] transition-colors ${currentStep >= 1 ? (currentStep > 1 ? 'bg-[#0E6245] text-white shadow-xs' : 'bg-[#DCFCE7] text-[#166534] shadow-xs border border-[#BBF7D0]') : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
              {currentStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : <span className={`h-2 w-2 rounded-full ${currentStep === 1 ? 'bg-[#0E6245] animate-pulse' : 'bg-slate-400'}`} />}
              <span>1. Demographics</span>
            </div>

            <ChevronRight className="text-slate-300 h-5 w-5 hidden sm:inline" />

            {/* Step 2 */}
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-[13px] transition-colors ${currentStep >= 2 ? (currentStep > 2 ? 'bg-[#0E6245] text-white shadow-xs' : 'bg-[#DCFCE7] text-[#166534] shadow-xs border border-[#BBF7D0]') : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
              {currentStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : <span className={`h-2 w-2 rounded-full ${currentStep === 2 ? 'bg-[#0E6245] animate-pulse' : 'bg-slate-400'}`} />}
              <span>2. Economic Profile</span>
            </div>

            <ChevronRight className="text-slate-300 h-5 w-5 hidden sm:inline" />

            {/* Step 3 */}
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-[13px] transition-colors ${currentStep >= 3 ? 'bg-[#DCFCE7] text-[#166534] shadow-xs border border-[#BBF7D0]' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
              <span className={`h-2 w-2 rounded-full ${currentStep === 3 ? 'bg-[#0E6245] animate-pulse' : 'bg-slate-400'}`} />
              <span>3. Assets & Criteria</span>
            </div>

          </div>

          {/* Metric Counter Pill */}
          <div className="flex items-center gap-1.5 self-start md:self-auto bg-[#F2F3FF] px-4 py-1.5 rounded-full border border-[#E2E7FF]">
            <Sparkles className="h-4 w-4 text-[#0E6245]" />
            <span className="font-mono text-[11px] text-[#0E6245] uppercase font-bold tracking-wider">
              Step {currentStep} of 3 • {Math.round((currentStep / 3) * 100)}% Completed
            </span>
          </div>
        </div>

        {/* Linear Gauge */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div className="h-full bg-[#0E6245] rounded-full transition-all duration-700" style={{ width: `${(currentStep / 3) * 100}%` }} />
        </div>

        {/* Micro metadata breadcrumbs */}
        <div className="mt-4 pt-4 flex flex-wrap items-center justify-between text-slate-500 text-[11px] gap-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <ShieldCheck className="h-4 w-4 text-[#1F6C3A]" />
            <span className="font-bold">Verified Citizen Registry: IN-8849-KA (Aadhaar Seeded)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-400">Direct Benefit Transfer Matrix v4.2</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1F6C3A] animate-pulse" />
            <span className="text-[#1F6C3A] font-bold">Real-time DBT Engine</span>
          </div>
        </div>
      </section>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans px-4 sm:px-6 lg:px-8 py-8 items-center w-full">
        <div className="w-full max-w-5xl space-y-6">

          {renderProgressTracker()}

          {error && (
            <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-bold flex items-center gap-2 shadow-xs">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Main Wizard Card Form */}
          <main className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 transition-all duration-300">

            {/* STEP 1: DEMOGRAPHICS */}
            {currentStep === 1 && (
              <div className="animate-in fade-in duration-200 flex flex-col gap-8">
                {/* Section Header */}
                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#166534] font-bold text-[11px] uppercase tracking-wider border border-[#BBF7D0]">
                      Baseline Assessment
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 font-bold">BASE-2024-A</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Step 1: Demographics & Location
                  </h2>
                  <p className="text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
                    This data is used to match you against age, gender, and state-specific welfare quotas.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Age Slider & Input */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-900 flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-[#0E6245]" /> Age (Years) *
                      </span>
                      <span className="text-xs font-black text-[#0E6245] bg-[#DCFCE7] px-2 py-0.5 rounded-lg border border-[#BBF7D0] font-mono">
                        {formData.age} yrs
                      </span>
                    </label>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={formData.age || 28}
                        onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                        className="w-full accent-[#0E6245] cursor-pointer"
                      />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.age || 28}
                        onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                        className="w-16 px-2.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-center text-slate-900 font-extrabold focus:outline-none focus:border-[#0E6245] shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Gender Pills */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Gender Identity *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "Male", label: "Male 👨" },
                        { id: "Female", label: "Female 👩" },
                        { id: "Other", label: "Other ⚧" },
                      ].map((g) => {
                        const isSelected = (formData.gender || "").toLowerCase() === g.id.toLowerCase();
                        return (
                          <button
                            type="button"
                            key={g.id}
                            onClick={() => setFormData({ ...formData, gender: g.id })}
                            className={`py-4 px-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#0E6245] border-[#0E6245] text-white shadow-md"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                            }`}
                          >
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* State Selection */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-900 flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#0E6245]" /> State / Union Territory *
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.state || "Uttar Pradesh"}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-extrabold text-slate-900 focus:outline-none focus:border-[#0E6245] transition-all appearance-none cursor-pointer shadow-xs"
                      >
                        <optgroup label="🏛️ 28 Indian States" className="bg-white text-slate-900 font-bold">
                          {ALL_36_INDIAN_STATES_AND_UTS.filter((s) => s.type === "State").map((s) => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🇮🇳 8 Union Territories" className="bg-white text-slate-900 font-bold">
                          {ALL_36_INDIAN_STATES_AND_UTS.filter((s) => s.type === "UT").map((s) => (
                            <option key={s.name} value={s.name}>{s.name} (UT)</option>
                          ))}
                        </optgroup>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* District Selection */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      District Name <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Hassan, Lucknow, Pune"
                      value={formData.district || ""}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="h-[52px] rounded-2xl bg-slate-50 border-slate-200 text-sm font-bold shadow-xs px-4 focus:border-[#0E6245]"
                    />
                  </div>
                </div>

                {/* Quick Select Popular States */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">
                    Quick Select:
                  </span>
                  {POPULAR_STATES.map((st) => {
                    const isSelected = formData.state === st;
                    return (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setFormData({ ...formData, state: st })}
                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0E6245] border-[#0E6245] text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button Container */}
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next: Economic Profile</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ECONOMIC PROFILE */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-8">
                {/* Section Header */}
                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#166534] font-bold text-[11px] uppercase tracking-wider border border-[#BBF7D0]">
                      Social Sector Assessment
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 font-bold">SEC-2024-C</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Step 2: Economic Profile & Household Structure
                  </h2>
                  <p className="text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
                    This data calibrates targeted subsidy thresholds, income ceilings, and social welfare brackets under central DBT schemes.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Occupation Grid (Bento Style) */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <Briefcase className="h-5 w-5 text-[#0E6245]" /> Primary Household Occupation
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {OCCUPATIONS.map((occ) => {
                        const isSelected = formData.occupation === occ.id;
                        return (
                          <button
                            type="button"
                            key={occ.id}
                            onClick={() => setFormData({ ...formData, occupation: occ.id })}
                            className={`text-left relative p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between h-36 cursor-pointer ${
                              isSelected
                                ? "bg-[#DCFCE7] text-[#131B2E] border-2 border-[#16A34A] shadow-md"
                                : "bg-slate-50 text-slate-900 border-2 border-slate-200 hover:bg-slate-100 hover:border-[#0E6245]/40 shadow-xs"
                            }`}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isSelected ? 'bg-white shadow-xs' : 'bg-white border border-slate-200'}`}>
                                {occ.icon}
                              </div>
                              {isSelected && (
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0E6245] text-white shadow-sm">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <p className="text-[13px] font-black leading-snug">{occ.label}</p>
                              <p className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-[#166534]' : 'text-slate-500'}`}>{occ.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Social Category */}
                    <div className="flex flex-col gap-4">
                      <label className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Social Category / Quota
                      </label>
                      <div className="flex flex-col gap-2.5">
                        {CASTE_CATEGORIES.map((c) => {
                          const isSelected = formData.caste_category === c.id;
                          return (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => setFormData({ ...formData, caste_category: c.id })}
                              className={`px-4 py-3.5 rounded-xl text-[13px] font-bold border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                                isSelected
                                  ? "bg-[#0E6245] border-[#0E6245] text-white shadow-md"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <span>{c.label}</span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-[#A4F1B2]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Annual Income */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                          <IndianRupee className="h-5 w-5 text-[#0E6245]" /> Annual Household Income
                        </label>
                      </div>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="5000"
                          value={formData.annual_income || 0}
                          onChange={(e) => setFormData({ ...formData, annual_income: Number(e.target.value) })}
                          className="w-full h-14 pl-10 pr-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-xl font-black text-slate-900 focus:outline-none focus:border-[#0E6245] shadow-xs"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {INCOME_PRESETS.map((preset) => {
                          const isSelected = formData.annual_income === preset.value;
                          return (
                            <button
                              type="button"
                              key={preset.label}
                              onClick={() => setFormData({ ...formData, annual_income: preset.value })}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#DCFCE7] border-[#16A34A] text-[#166534]"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prev / Next Buttons */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 max-w-sm py-3.5 px-6 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next: Assets & Criteria</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ASSETS & OTHER CRITERIA */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-8">
                {/* Section Header */}
                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#166534] font-bold text-[11px] uppercase tracking-wider border border-[#BBF7D0]">
                      Statutory Validations
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 font-bold">VAL-2024-Z</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Step 3: Assets & Specific Criteria
                  </h2>
                  <p className="text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
                    Final attributes required to definitively cross-reference eligibility across all 4,162 cataloged initiatives.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Land Ownership */}
                  <div className={`p-6 rounded-2xl border-2 transition-all ${formData.has_land ? 'bg-[#F0FDF4] border-[#16A34A]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-black text-slate-900 block mb-1">
                          Agricultural Land Ownership
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Do you own cultivable agricultural land? (PM-Kisan, KCC)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, has_land: !formData.has_land })}
                        className={`w-14 h-8 rounded-full transition-colors p-1 cursor-pointer flex items-center shadow-inner ${
                          formData.has_land ? "bg-[#0E6245] justify-end" : "bg-slate-300 justify-start"
                        }`}
                      >
                        <span className="h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                          {formData.has_land && <Check className="h-4 w-4 text-[#0E6245]" />}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Disability PwD Status */}
                  <div className={`p-6 rounded-2xl border-2 transition-all ${formData.is_differently_abled ? 'bg-[#FEF3C7] border-[#F59E0B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-black text-slate-900 block mb-1">
                          Person with Disability (Divyangjan)
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Is beneficiary a person with benchmark disability (&gt;= 40%)?
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_differently_abled: !formData.is_differently_abled })}
                        className={`w-14 h-8 rounded-full transition-colors p-1 cursor-pointer flex items-center shadow-inner ${
                          formData.is_differently_abled ? "bg-[#D97706] justify-end" : "bg-slate-300 justify-start"
                        }`}
                      >
                        <span className="h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                          {formData.is_differently_abled && <Check className="h-4 w-4 text-[#D97706]" />}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Marital Status
                    </label>
                    <select
                      value={formData.marital_status || "Married"}
                      onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/20 cursor-pointer shadow-xs"
                    >
                      <option value="Married">Married (विवाहित)</option>
                      <option value="Single">Single / Unmarried (अविवाहित)</option>
                      <option value="Widowed / Single Mother">Widowed / Single Mother (विधवा)</option>
                    </select>
                  </div>

                  {/* Residence Area */}
                  <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Residence Area Designation
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Rural", "Urban"].map((area) => {
                        const isSel = (formData.residence_area || "Rural") === area;
                        return (
                          <button
                            type="button"
                            key={area}
                            onClick={() => setFormData({ ...formData, residence_area: area })}
                            className={`py-3 px-3 rounded-xl text-sm font-black border-2 transition-all cursor-pointer shadow-xs ${
                              isSel
                                ? "bg-[#0E6245] border-[#0E6245] text-white"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {area === "Rural" ? "🌾 Rural / Gramin" : "🏙️ Urban / Nagar"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Prev & Final Submit Button */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="flex-1 py-4 px-6 rounded-xl bg-[#0E6245] hover:bg-[#004831] text-white font-black text-sm sm:text-base shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Evaluating across 4,162 schemes...
                      </span>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 text-amber-300" />
                        <span>Evaluate My Scheme Eligibility (Instant)</span>
                        <ArrowRight className="h-5 w-5 ml-1 hidden sm:inline" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
