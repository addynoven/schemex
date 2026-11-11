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
import { AppLayout } from "@/components/layout/AppLayout";
import {
  NbButton,
  NbCard,
  NbBadge,
  NbInput,
} from "@/core/design-system/Neubrutalist";

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
  {
    id: "farmer",
    label: "Small / Marginal Farmer",
    desc: "Holding < 2.0 Hectares",
    icon: "🌾",
  },
  {
    id: "agri_labor",
    label: "Agricultural Laborer",
    desc: "Landless Farm Wage",
    icon: "🌿",
  },
  {
    id: "artisan",
    label: "Artisan / Weaver",
    desc: "Traditional Crafts & Loom",
    icon: "🎨",
  },
  {
    id: "self_employed",
    label: "Self-Employed / MSME",
    desc: "Micro Retail or Service",
    icon: "🏢",
  },
  {
    id: "construction",
    label: "Construction Worker",
    desc: "BOCW Registered / Unreg.",
    icon: "🏗️",
  },
  {
    id: "student",
    label: "Unemployed / Student",
    desc: "Youth Fellowship Eligible",
    icon: "🎓",
  },
  {
    id: "homemaker",
    label: "Homemaker",
    desc: "Gruha Lakshmi Benefit Tier",
    icon: "🏡",
  },
  {
    id: "driver",
    label: "Transport / Commercial",
    desc: "Driver Welfare Board",
    icon: "🚚",
  },
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
      <NbCard className="w-full p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Step 1 */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs border-2 border-black transition-all ${
                currentStep >= 1
                  ? currentStep > 1
                    ? "bg-emerald-400 dark:bg-emerald-500 text-black shadow-[2px_2px_0px_#000]"
                    : "bg-[#FFFDF9] dark:bg-[#131F18] text-black dark:text-white shadow-[2px_2px_0px_#000]"
                  : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 border-black/20"
              }`}
            >
              {currentStep > 1 ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span
                  className={`h-2 w-2 rounded-full ${currentStep === 1 ? "bg-emerald-500 animate-ping" : "bg-black/30"}`}
                />
              )}
              <span>1. Demographics</span>
            </div>

            <ChevronRight className="text-black/40 dark:text-white/40 h-4 w-4 hidden sm:inline" />

            {/* Step 2 */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs border-2 border-black transition-all ${
                currentStep >= 2
                  ? currentStep > 2
                    ? "bg-emerald-400 dark:bg-emerald-500 text-black shadow-[2px_2px_0px_#000]"
                    : "bg-[#FFFDF9] dark:bg-[#131F18] text-black dark:text-white shadow-[2px_2px_0px_#000]"
                  : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 border-black/20"
              }`}
            >
              {currentStep > 2 ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span
                  className={`h-2 w-2 rounded-full ${currentStep === 2 ? "bg-emerald-500 animate-ping" : "bg-black/30"}`}
                />
              )}
              <span>2. Economic Profile</span>
            </div>

            <ChevronRight className="text-black/40 dark:text-white/40 h-4 w-4 hidden sm:inline" />

            {/* Step 3 */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs border-2 border-black transition-all ${
                currentStep >= 3
                  ? "bg-emerald-400 dark:bg-emerald-500 text-black shadow-[2px_2px_0px_#000]"
                  : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 border-black/20"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${currentStep === 3 ? "bg-emerald-500 animate-ping" : "bg-black/30"}`}
              />
              <span>3. Assets & Criteria</span>
            </div>
          </div>

          {/* Metric Counter Pill */}
          <NbBadge
            nbVariant="outline"
            className="gap-1.5 font-mono text-[11px] self-start md:self-auto"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              Step {currentStep} of 3 • {Math.round((currentStep / 3) * 100)}%
            </span>
          </NbBadge>
        </div>

        {/* Linear Gauge */}
        <div className="w-full h-3 bg-[#F4EFEA] dark:bg-[#0B120E] rounded-full overflow-hidden p-0.5 border-2 border-black dark:border-emerald-500/40 shadow-[2px_2px_0px_#000]">
          <div
            className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Micro metadata breadcrumbs */}
        <div className="mt-4 pt-4 flex flex-wrap items-center justify-between text-black/60 dark:text-white/60 text-[11px] gap-2 border-t-2 border-black/10 dark:border-white/10 font-bold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4EFEA] dark:bg-[#0B120E] border border-black/30 dark:border-white/20">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Citizen Eligibility Evaluation Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-black/50 dark:text-white/50">
              DBT Rules Engine v2.4
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">
              Live Matching
            </span>
          </div>
        </div>
      </NbCard>
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col font-sans px-4 sm:px-6 lg:px-8 py-6 items-center w-full">
        <div className="w-full max-w-5xl space-y-6">
          {renderProgressTracker()}

          {error && (
            <div className="my-4 p-4 rounded-xl bg-rose-100 dark:bg-rose-950/40 border-2 border-black dark:border-rose-500 text-black dark:text-white text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_#000]">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Main Wizard Card Form */}
          <NbCard className="w-full p-6 sm:p-10 transition-all duration-300">
            {/* STEP 1: DEMOGRAPHICS */}
            {currentStep === 1 && (
              <div className="animate-in fade-in duration-200 flex flex-col gap-8">
                {/* Section Header */}
                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <NbBadge nbVariant="emerald">Baseline Assessment</NbBadge>
                    <span className="font-mono text-[11px] text-black/50 dark:text-white/50 font-bold">
                      BASE-2024-A
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                    Step 1: Demographics & Location
                  </h2>
                  <p className="text-sm text-black/70 dark:text-white/70 max-w-2xl font-medium leading-relaxed">
                    This data is used to match you against age, gender, and
                    state-specific welfare quotas.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Age Slider & Input */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-black text-black dark:text-white flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{" "}
                        Age (Years) *
                      </span>
                      <NbBadge
                        nbVariant="emerald"
                        className="font-mono text-xs"
                      >
                        {formData.age} yrs
                      </NbBadge>
                    </label>
                    <div className="flex items-center gap-4 bg-[#F4EFEA] dark:bg-[#0B120E] p-4 rounded-xl border-2 border-black dark:border-emerald-500/40 shadow-[2px_2px_0px_#000]">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={formData.age || 28}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            age: Number(e.target.value),
                          })
                        }
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.age || 28}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            age: Number(e.target.value),
                          })
                        }
                        className="w-16 px-2.5 py-2 rounded-lg bg-[#FFFDF9] dark:bg-[#131F18] border-2 border-black dark:border-emerald-500 text-sm text-center text-black dark:text-white font-black focus:outline-none shadow-[2px_2px_0px_#000]"
                      />
                    </div>
                  </div>

                  {/* Gender Pills */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                      Gender Identity *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "Male", label: "Male 👨" },
                        { id: "Female", label: "Female 👩" },
                        { id: "Other", label: "Other ⚧" },
                      ].map((g) => {
                        const isSelected =
                          (formData.gender || "").toLowerCase() ===
                          g.id.toLowerCase();
                        return (
                          <button
                            type="button"
                            key={g.id}
                            onClick={() =>
                              setFormData({ ...formData, gender: g.id })
                            }
                            className={`py-3.5 px-2 rounded-xl text-xs font-black border-2 border-black transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-400 dark:bg-emerald-500 text-black shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                                : "bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-white shadow-[2px_2px_0px_#000] hover:bg-[#FFFDF9]"
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
                    <label className="text-xs font-black text-black dark:text-white flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{" "}
                        State / Union Territory *
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.state || "Uttar Pradesh"}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className="w-full px-4 py-3.5 rounded-xl bg-[#FFFDF9] dark:bg-[#131F18] border-2 border-black dark:border-emerald-500 text-xs font-black text-black dark:text-white focus:outline-none transition-all appearance-none cursor-pointer shadow-[2px_2px_0px_#000]"
                      >
                        <optgroup
                          label="🏛️ 28 Indian States"
                          className="bg-[#FFFDF9] dark:bg-[#131F18] text-black dark:text-white font-bold"
                        >
                          {ALL_36_INDIAN_STATES_AND_UTS.filter(
                            (s) => s.type === "State",
                          ).map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup
                          label="🇮🇳 8 Union Territories"
                          className="bg-[#FFFDF9] dark:bg-[#131F18] text-black dark:text-white font-bold"
                        >
                          {ALL_36_INDIAN_STATES_AND_UTS.filter(
                            (s) => s.type === "UT",
                          ).map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name} (UT)
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white pointer-events-none" />
                    </div>
                  </div>

                  {/* District Selection */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                      District Name{" "}
                      <span className="text-black/50 dark:text-white/50 font-normal lowercase">
                        (Optional)
                      </span>
                    </label>
                    <NbInput
                      type="text"
                      placeholder="e.g. Hassan, Lucknow, Pune"
                      value={formData.district || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                      className="h-11 text-xs"
                    />
                  </div>
                </div>

                {/* Quick Select Popular States */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-2 border-t-2 border-black/10 dark:border-white/10">
                  <span className="text-[11px] font-black text-black/60 dark:text-white/60 uppercase tracking-wider shrink-0 mr-2">
                    Quick Select:
                  </span>
                  {POPULAR_STATES.map((st) => {
                    const isSelected = formData.state === st;
                    return (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setFormData({ ...formData, state: st })}
                        className={`px-3 py-1 rounded-lg text-xs font-black border-2 border-black whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-400 text-black shadow-[2px_2px_0px_#000]"
                            : "bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-white shadow-[1px_1px_0px_#000] hover:bg-[#FFFDF9]"
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button Container */}
                <div className="pt-6 border-t-2 border-black/10 dark:border-white/10 flex justify-end">
                  <NbButton
                    type="button"
                    nbVariant="primary"
                    onClick={() => setCurrentStep(2)}
                    className="w-full sm:w-auto gap-2"
                  >
                    <span>Next: Economic Profile</span>
                    <ArrowRight className="h-4 w-4" />
                  </NbButton>
                </div>
              </div>
            )}

            {/* STEP 2: ECONOMIC PROFILE */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-8">
                {/* Section Header */}
                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <NbBadge nbVariant="emerald">
                      Social Sector Assessment
                    </NbBadge>
                    <span className="font-mono text-[11px] text-black/50 dark:text-white/50 font-bold">
                      SEC-2024-C
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                    Step 2: Economic Profile & Household Structure
                  </h2>
                  <p className="text-sm text-black/70 dark:text-white/70 max-w-2xl font-medium leading-relaxed">
                    This data calibrates targeted subsidy thresholds, income
                    ceilings, and social welfare brackets under central DBT
                    schemes.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Occupation Grid (Bento Style) */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-black text-black dark:text-white flex items-center gap-2 uppercase tracking-wider">
                        <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />{" "}
                        Primary Household Occupation
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {OCCUPATIONS.map((occ) => {
                        const isSelected = formData.occupation === occ.id;
                        return (
                          <button
                            type="button"
                            key={occ.id}
                            onClick={() =>
                              setFormData({ ...formData, occupation: occ.id })
                            }
                            className={`text-left relative p-4 rounded-xl transition-all duration-150 flex flex-col justify-between h-36 cursor-pointer border-2 border-black ${
                              isSelected
                                ? "bg-emerald-400 dark:bg-emerald-500 text-black shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                                : "bg-[#FFFDF9] dark:bg-[#131F18] text-black dark:text-white shadow-[2px_2px_0px_#000] hover:bg-[#F4EFEA]"
                            }`}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div className="w-10 h-10 rounded-lg bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black flex items-center justify-center text-xl shadow-[1px_1px_0px_#000]">
                                {occ.icon}
                              </div>
                              {isSelected && (
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black text-white shadow-xs">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <p className="text-xs font-black leading-snug">
                                {occ.label}
                              </p>
                              <p className="text-[10px] font-bold text-black/60 dark:text-white/60 mt-0.5">
                                {occ.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Social Category */}
                    <div className="flex flex-col gap-4">
                      <label className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                        Social Category / Quota
                      </label>
                      <div className="flex flex-col gap-2.5">
                        {CASTE_CATEGORIES.map((c) => {
                          const isSelected = formData.caste_category === c.id;
                          return (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  caste_category: c.id,
                                })
                              }
                              className={`px-4 py-3 rounded-xl text-xs font-black border-2 border-black transition-all cursor-pointer text-left flex items-center justify-between ${
                                isSelected
                                  ? "bg-emerald-400 dark:bg-emerald-500 text-black shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                                  : "bg-[#FFFDF9] dark:bg-[#131F18] text-black dark:text-white shadow-[2px_2px_0px_#000] hover:bg-[#F4EFEA]"
                              }`}
                            >
                              <span>{c.label}</span>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-black" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Annual Income */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-black dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{" "}
                          Annual Household Income
                        </label>
                      </div>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-black/60 dark:text-white/60">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="5000"
                          value={formData.annual_income || 0}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              annual_income: Number(e.target.value),
                            })
                          }
                          className="w-full h-12 pl-10 pr-4 bg-[#FFFDF9] dark:bg-[#131F18] rounded-xl border-2 border-black dark:border-emerald-500 text-lg font-black text-black dark:text-white focus:outline-none shadow-[2px_2px_0px_#000]"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {INCOME_PRESETS.map((preset) => {
                          const isSelected =
                            formData.annual_income === preset.value;
                          return (
                            <button
                              type="button"
                              key={preset.label}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  annual_income: preset.value,
                                })
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 border-black transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-400 text-black shadow-[2px_2px_0px_#000]"
                                  : "bg-[#F4EFEA] dark:bg-[#0B120E] text-black dark:text-white shadow-[1px_1px_0px_#000] hover:bg-[#FFFDF9]"
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
                <div className="flex items-center justify-between gap-4 pt-6 border-t-2 border-black/10 dark:border-white/10">
                  <NbButton
                    type="button"
                    nbVariant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </NbButton>

                  <NbButton
                    type="button"
                    nbVariant="primary"
                    onClick={() => setCurrentStep(3)}
                    className="gap-2"
                  >
                    <span>Next: Assets & Criteria</span>
                    <ArrowRight className="h-4 w-4" />
                  </NbButton>
                </div>
              </div>
            )}

            {/* STEP 3: ASSETS & OTHER CRITERIA */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-8">
                {/* Section Header */}
                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <NbBadge nbVariant="emerald">
                      Statutory Validations
                    </NbBadge>
                    <span className="font-mono text-[11px] text-black/50 dark:text-white/50 font-bold">
                      VAL-2024-Z
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                    Step 3: Assets & Specific Criteria
                  </h2>
                  <p className="text-sm text-black/70 dark:text-white/70 max-w-2xl font-medium leading-relaxed">
                    Final attributes required to definitively cross-reference
                    eligibility across all cataloged initiatives.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Land Ownership */}
                  <div
                    className={`p-5 rounded-xl border-2 border-black transition-all shadow-[2px_2px_0px_#000] ${formData.has_land ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-[#F4EFEA] dark:bg-[#0B120E]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-black dark:text-white block mb-1">
                          Agricultural Land Ownership
                        </span>
                        <span className="text-[11px] text-black/60 dark:text-white/60 font-medium">
                          Do you own cultivable agricultural land? (PM-Kisan, KCC)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            has_land: !formData.has_land,
                          })
                        }
                        className={`w-12 h-7 rounded-full border-2 border-black transition-colors p-0.5 cursor-pointer flex items-center shadow-[1px_1px_0px_#000] ${
                          formData.has_land
                            ? "bg-emerald-400 justify-end"
                            : "bg-black/20 justify-start"
                        }`}
                      >
                        <span className="h-5 w-5 rounded-full bg-white border border-black shadow-xs flex items-center justify-center">
                          {formData.has_land && (
                            <Check className="h-3 w-3 text-black" />
                          )}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Disability PwD Status */}
                  <div
                    className={`p-5 rounded-xl border-2 border-black transition-all shadow-[2px_2px_0px_#000] ${formData.is_differently_abled ? "bg-amber-100 dark:bg-amber-950/40" : "bg-[#F4EFEA] dark:bg-[#0B120E]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-black dark:text-white block mb-1">
                          Person with Disability (Divyangjan)
                        </span>
                        <span className="text-[11px] text-black/60 dark:text-white/60 font-medium">
                          Do you hold a UDID card or 40%+ disability certificate?
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            is_differently_abled:
                              !formData.is_differently_abled,
                          })
                        }
                        className={`w-12 h-7 rounded-full border-2 border-black transition-colors p-0.5 cursor-pointer flex items-center shadow-[1px_1px_0px_#000] ${
                          formData.is_differently_abled
                            ? "bg-amber-400 justify-end"
                            : "bg-black/20 justify-start"
                        }`}
                      >
                        <span className="h-5 w-5 rounded-full bg-white border border-black shadow-xs flex items-center justify-center">
                          {formData.is_differently_abled && (
                            <Check className="h-3 w-3 text-black" />
                          )}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="p-5 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/40 space-y-2 shadow-[2px_2px_0px_#000]">
                    <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                      Marital Status
                    </label>
                    <select
                      value={formData.marital_status || "Married"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          marital_status: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[#FFFDF9] dark:bg-[#131F18] border-2 border-black dark:border-emerald-500 text-xs font-black text-black dark:text-white focus:outline-none cursor-pointer shadow-[2px_2px_0px_#000]"
                    >
                      <option value="Married">Married (विवाहित)</option>
                      <option value="Single">
                        Single / Unmarried (अविवाहित)
                      </option>
                      <option value="Widowed / Single Mother">
                        Widowed / Single Mother (विधवा)
                      </option>
                    </select>
                  </div>

                  {/* Residence Area */}
                  <div className="p-5 rounded-xl bg-[#F4EFEA] dark:bg-[#0B120E] border-2 border-black dark:border-emerald-500/40 space-y-2 shadow-[2px_2px_0px_#000]">
                    <label className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                      Residence Area Designation
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Rural", "Urban"].map((area) => {
                        const isSel =
                          (formData.residence_area || "Rural") === area;
                        return (
                          <button
                            type="button"
                            key={area}
                            onClick={() =>
                              setFormData({ ...formData, residence_area: area })
                            }
                            className={`py-2.5 px-3 rounded-lg text-xs font-black border-2 border-black transition-all cursor-pointer ${
                              isSel
                                ? "bg-emerald-400 dark:bg-emerald-500 text-black shadow-[2px_2px_0px_#000]"
                                : "bg-[#FFFDF9] dark:bg-[#131F18] text-black dark:text-white shadow-[1px_1px_0px_#000] hover:bg-[#F4EFEA]"
                            }`}
                          >
                            {area === "Rural"
                              ? "🌾 Rural / Gramin"
                              : "🏙️ Urban / Nagar"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Prev & Final Submit Button */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t-2 border-black/10 dark:border-white/10">
                  <NbButton
                    type="button"
                    nbVariant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </NbButton>

                  <NbButton
                    type="button"
                    nbVariant="primary"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="flex-1 py-4 px-6 text-sm sm:text-base gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Evaluating across cataloged schemes...
                      </span>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Evaluate My Scheme Eligibility (Instant)</span>
                        <ArrowRight className="h-4 w-4 ml-1 hidden sm:inline" />
                      </>
                    )}
                  </NbButton>
                </div>
              </div>
            )}
          </NbCard>
        </div>
      </div>
    </AppLayout>
  );
}
