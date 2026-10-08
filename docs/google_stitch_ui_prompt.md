# Google Stitch UI Design System & AI Prompt Specification

> [!NOTE]
> This document provides the complete, authoritative **Google Stitch Design System** specification and AI prompt templates for generating UI components across the **Scheme AI Citizen Welfare Navigator** (Web & React Native Mobile).

---

## 🎨 Design System Foundations

### 1. Color Palette Tokens

| Token Name | Hex Code | Tailwind / CSS Class | Usage / Intent |
| --- | --- | --- | --- |
| **Brand Emerald (Primary)** | `#0E6245` | `bg-[#0E6245] text-white` | Primary CTAs, active navigation items, brand icons |
| **Brand Emerald Hover** | `#004831` | `hover:bg-[#004831]` | Button hover states, active press feedback |
| **Soft Mint Badge** | `#DCFCE7` | `bg-[#DCFCE7]` | Verification chips, success callouts, status badges |
| **Mint Border** | `#BBF7D0` | `border-[#BBF7D0]` | Card borders for verified/eligible states |
| **Mint Text (Dark)** | `#166534` | `text-[#166534]` | High-contrast text on soft mint backgrounds |
| **Neutral Surface** | `#F8FAFC` | `bg-slate-50` | App background canvas, secondary container fills |
| **Card Canvas** | `#FFFFFF` | `bg-white` | Elevating primary content cards and modals |
| **Neutral Border** | `#E2E8F0` | `border-slate-200` | Subtle, clean container outlines |
| **Heading Text** | `#0F172A` | `text-slate-900` | Page titles, section headings (font-black) |
| **Body Text** | `#1E293B` | `text-slate-800` | Paragraphs, list items, card descriptions |
| **Muted Text** | `#64748B` | `text-slate-500` | Subtitles, timestamps, field hints |
| **Warning Amber** | `#FEF3C7` / `#92400E` | `bg-[#FEF3C7] text-[#92400E]` | Nearly eligible badges, bookmarks, pending items |
| **Error Rose** | `#FEE2E2` / `#991B1B` | `bg-rose-50 text-rose-800` | Missing documents, rate limits, deletion alerts |

---

### 2. Typography & Radius Rules

- **Font Family**: Inter, system-ui, -apple-system, sans-serif
- **Font Weights**:
  - `font-black` (900): Page titles, hero headings (`tracking-tight`)
  - `font-extrabold` (800): Card titles, section headers, percentage metrics
  - `font-bold` (700): Buttons, badges, active tabs, table headers
  - `font-semibold` / `font-medium` (500–600): Form labels, body copy, subtitles
  - `font-mono`: IDs, file sizes, timestamps, code snippets
- **Corner Radii**:
  - `rounded-3xl` (24px): Primary dashboard cards, hero banners, modals
  - `rounded-2xl` (16px): Sub-cards, form containers, progress bar tracks
  - `rounded-xl` (12px): Buttons, search inputs, select dropdowns, badges
  - `rounded-full` (9999px): Status pills, step counters, user avatars

---

## 🤖 Master AI System Prompt for Google Stitch UI Generation

Use the prompt template below when requesting an AI coding agent or LLM to build or refactor any screen or component in the **Scheme AI** application.

```markdown
You are a Senior Frontend Engineer building components using the Google Stitch Design System for "Scheme AI", an Indian Citizen Welfare Scheme Navigator.

### STRICT DESIGN SYSTEM GUIDELINES:

1. COLOR PALETTE:
   - Primary Brand Color: `#0E6245` (Forest Emerald Green).
   - Primary Hover: `#004831`.
   - Soft Mint Accents: `#DCFCE7` background, `#BBF7D0` border, `#166534` text.
   - Surface Canvas: `#F8FAFC` (page background), `#FFFFFF` (card canvas), `#E2E8F0` (borders).
   - Typography Colors: `#0F172A` (headings, font-black), `#1E293B` (body text, font-bold/normal), `#64748B` (subtitles).

2. TYPOGRAPHY & READABILITY:
   - NEVER use washed-out light text (zinc-200/slate-300) on white cards. Body text must ALWAYS be `text-slate-800` or `text-slate-900`.
   - Headings must use `font-black` or `font-extrabold` with `tracking-tight`.
   - Use Lucide icons (`Lucide-React`) for visual anchor icons on buttons and badges.

3. COMPONENT PATTERNS:
   - Primary Buttons: `bg-[#0E6245] hover:bg-[#004831] text-white font-extrabold text-xs sm:text-sm rounded-xl px-5 py-2.5 shadow-xs active:scale-95 transition-all cursor-pointer`.
   - Badges & Status Pills: `px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] text-xs font-bold flex items-center gap-1.5`.
   - Container Cards: `rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs`.
   - Input & Select Fields: `w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#0E6245] transition-all`.

4. MARKDOWN & TABLE RENDERING:
   - Render markdown tables inside responsive overflow wrappers (`overflow-x-auto my-3 rounded-2xl border border-slate-200 bg-white`).
   - Table headers (`<th>`): `bg-slate-100 text-slate-900 font-bold uppercase text-[11px] p-3`.
   - Table cells (`<td>`): `p-3 border-b border-slate-100 text-slate-800 odd:bg-white even:bg-slate-50/40`.
   - Parse `<br>` tags inside table cells as line breaks without breaking table markdown structure.

5. ACCESSIBILITY & HYDRATION SAFETY:
   - Ensure all interactive buttons have explicit `type="button"` or `type="submit"`.
   - Avoid rendering `<div>` tags inside `<p>` elements.
   - For components reading `localStorage` / `sessionStorage`, use a `mounted` state flag (`useEffect(() => setMounted(true), [])`) to prevent SSR hydration mismatches.
```

---

## 📱 Prompt for Specific Screen Generation

> [!TIP]
> Select one of the specialized prompt snippets below when generating specific application views.

### A. AI Chat Advisor Screen Prompt
```markdown
Generate an AI Chat Advisor screen using the Google Stitch Design System.
Requirements:
- Left sidebar with primary app navigation rail (Chat, Schemes, Check, Vault, Profile, Support) and recent consultation history.
- Chat message timeline showing User messages on the right (`bg-[#E6F4EA] text-[#0F172A] border border-[#CBE9D3] rounded-3xl rounded-br-none`) and Assistant messages on the left (`bg-white text-slate-900 border border-slate-200 rounded-3xl rounded-bl-none`).
- Assistant card includes a "RECALLED 3 MEMORIES" badge and model header tag (`gemini-3.8-flash`).
- Bottom composer with textarea, voice dictation mic, attach/vault button, and an active emerald Send button (`bg-[#0E6245]`).
```

### B. Citizen Vault & Readiness Screen Prompt
```markdown
Generate a Citizen Document Vault screen using the Google Stitch Design System.
Requirements:
- Header with S3 Encrypted lock badge (`S3 Encrypted • Private & Secure`).
- Hero banner: "Hello, Citizen! Keep your documents safe & application ready".
- Quick action cards: Upload Document, Check Readiness, View Vault Items.
- Live Scheme Readiness Evaluator: Scheme selector dropdown, 0-100% progress gauge bar, segregated "Ready in Vault" (green) vs "Missing Documents" (red) checklist.
- Upload form with file selector and document type dropdown.
- Encrypted documents grid displaying document category icon, masked ID number, file size, download button, and delete action.
```

### C. Multi-Step Eligibility Wizard Prompt
```markdown
Generate a 3-step Eligibility Check Wizard using the Google Stitch Design System.
Requirements:
- Top Step Progress Tracker bar (`STEP 1 OF 3`, `STEP 2 OF 3`, `STEP 3 OF 3`) with 33%/66%/100% progress indicator.
- Step 1: Demographics (Age slider, Gender pills, State dropdown with 36 States/UTs, District input).
- Step 2: Economic Profile (Occupation selector grid with icons, Social Category pills, Annual Income presets + numeric input).
- Step 3: Assets & Criteria (Land ownership toggle & acreage input, PwD disability toggle, Marital status, Rural/Urban toggle).
- Bottom CTA: "Evaluate My Scheme Eligibility (Instant) →" navigating to `/results`.
```

---

## 📋 Artifact Reference

| File Path | Description |
| --- | --- |
| `web/src/components/layout/AppSidebar.tsx` | Google Stitch Sidebar Navigation Rail |
| `web/src/modules/home/components/MarkdownMessage.tsx` | High-contrast markdown & table parser |
| `web/src/modules/vault/screens/VaultScreen.tsx` | Vault Dashboard & Scheme Readiness Evaluator |
| `web/src/modules/check/screens/CheckScreen.tsx` | Multi-step Eligibility Check Wizard |
