---
name: Citizen Emerald Civic Interface
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3f4943'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6f7973'
  outline-variant: '#bfc9c1'
  surface-tint: '#1c6b4d'
  primary: '#004831'
  on-primary: '#ffffff'
  primary-container: '#0e6245'
  on-primary-container: '#90dbb6'
  inverse-primary: '#8bd6b1'
  secondary: '#1f6c3a'
  on-secondary: '#ffffff'
  secondary-container: '#a4f1b2'
  on-secondary-container: '#24703e'
  tertiary: '#6d2a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#8f3e0c'
  on-tertiary-container: '#ffbd9e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f2cc'
  primary-fixed-dim: '#8bd6b1'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005138'
  secondary-fixed: '#a6f4b5'
  secondary-fixed-dim: '#8bd79b'
  on-secondary-fixed: '#00210b'
  on-secondary-fixed-variant: '#005226'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#341000'
  on-tertiary-fixed-variant: '#7a3000'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '900'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '900'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-bold:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
  code-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-trust, institutional, yet approachable digital interface tailored for national citizen welfare discovery and scheme delivery. The design movement marries **Modern Civic Clarity** with **Tactile Structured Accessibility**: combining hyper-legible typography, high-contrast hierarchical layouts, and deep emerald government credibility.

### Personality & Tone
- **Authoritative & Trustworthy:** Anchored by deep forest emerald and structured slate dividers, invoking the dignity and reliability of official public institutions without the bureaucratic density.
- **Empowering & Lucid:** Complex eligibility criteria, document requirements, and disbursement timelines are distilled into crystal-clear atomic chunks.
- **Dignified & Accessible:** Meets strict WCAG AAA guidelines to cater to multi-generational demographics, varying levels of digital literacy, and varying display conditions across varied regional environments.

### Visual Architecture
The style prioritizes high-contrast content demarcation: stark white canvases resting on soft cool slate backdrops, enclosed by hairline slate boundaries (`#E2E8F0`), punctured by decisive forest emerald primaries, soft mint confirmation pills, and vivid statutory status chips.

## Colors

The palette leverages an authoritative forest emerald primary, contrasted against slate-neutral structural tiers and semantic civic alerts.

### Primary Palette & Tones
- **Primary Brand Emerald (`#0E6245`):** The primary brand anchor for key transactional buttons, active navigation markers, and scheme header accents.
- **Primary Brand Hover (`#004831`):** Deep rich spruce used exclusively for interactive press and hover states.
- **Soft Mint Accent Surface (`#DCFCE7`):** Positive status indicator background, eligibility confirmed ribbons, and highlight badges.
- **Soft Mint Accent Border (`#BBF7D0`):** Outer perimeter stroke for approved states and success metrics.
- **Soft Mint Accent Text (`#166534`):** High-contrast readable emerald text paired with mint surfaces.

### Neutral Foundation
- **Neutral Surface / Page Canvas (`#F8FAFC`):** Slate-50 foundation creating low optical glare for long navigation sessions.
- **Card Canvas (`#FFFFFF`):** Pure elevated white surfaces ensuring contrast behind form inputs and dense eligibility data.
- **Neutral Border (`#E2E8F0`):** Slate-200 structural divider for cards, fields, and tabular grids.
- **Heading Text (`#0F172A`):** Slate-900 for ultra-crisp, high-impact readability.
- **Body Text (`#1E293B`):** Slate-800 optimized for parsing long-form policy texts.
- **Muted Text (`#64748B`):** Slate-500 for metadata, timestamps, and secondary field hints.

### Civic Alert & Validation States
- **Warning Amber Background (`#FEF3C7`) & Text (`#92400E`):** Pending approvals, missing ancillary paperwork, and income cap warnings.
- **Error Rose Background (`#FEE2E2`) & Text (`#991B1B`):** Disqualification indicators, rejected submissions, and critical validation alerts.

## Typography

Typography prioritizes heavy-weighted, tracking-tight modern clarity using `Inter` as the primary family with a fall back to `system-ui`. Tabular identification numbers, DBT (Direct Benefit Transfer) accounts, application tracking tokens, and Aadhaar reference masks utilize `JetBrains Mono`.

### Hierarchy & Application
- **Font-Black (`900`):** Reserved for primary portal titles, prominent scheme headings, and monetary subsidy figures (`headline-xl`, `headline-lg`). Uses tight tracking to maintain solid, institutional impact.
- **Font-ExtraBold (`800`) & Bold (`700`):** Applied across card section titles, eligibility checklists, step numbers, and emphasized inline criteria (`headline-md`, `body-bold`).
- **Font-SemiBold (`600`):** Utilized for structural labels, form labels, table header cells, and primary button labels (`label-md`).
- **Font-Medium & Normal (`500` / `400`):** Reserved for multi-line procedural summaries, legal disclaimers, and user inputs (`body-md`, `body-lg`).

## Layout & Spacing

The layout model is built on an adaptive 12-column responsive grid engineered for dense, multi-tiered civic content.

### Grid & Breakpoints
- **Desktop (1024px and above):** 12 columns, `margin: 2rem` (32px), `gutter: 1.5rem` (24px). Maximum container width is constrained to `1280px` to maintain optimal line-lengths during detailed scheme inquiries.
- **Tablet (768px - 1023px):** 8 columns, `margin: 1.5rem` (24px), `gutter: 1.25rem` (20px). Filters and search bars shift from persistent sidebar rails to collapsable sheet overlays.
- **Mobile (320px - 767px):** 4 columns, `margin-mobile: 1rem` (16px), `gutter-mobile: 1rem` (16px). Cards, step navigations, and comparison tables reflow into single-column vertical flows.

### Spacing Principles
- Standardized 8pt spatial steps (`space-xs: 4px`, `space-sm: 8px`, `space-md: 16px`, `space-lg: 24px`, `space-xl: 32px`).
- Input paddings and status chip insets leverage `space-sm` vertically and `space-md` horizontally.
- Major scheme canvas groupings maintain `space-xl` separation to clearly delineate application milestones.

## Elevation & Depth

This design system avoids heavy shadows, dark drops, and blurry glassmorphism in favor of **Crisp Low-Contrast Outlines & Shallow Tonal Layers**. This guarantees optical precision across varying screen qualities.

### Depth Architecture
- **Base Level (Canvas):** `#F8FAFC` flat surface.
- **Card Tier 1 (Flat Structural):** `#FFFFFF` background bound by a crisp 1px solid `#E2E8F0` stroke. Zero shadow in neutral resting state.
- **Card Tier 2 (Interactive & Focused):** On hover or selection, cards elevate slightly using a subtle diffused shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)` with border stroke switching to `#0E6245`.
- **Flyout & Modal Surfaces (Tier 3):** `#FFFFFF` surfaces with a defined border (`#E2E8F0`) and an anchored shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.
- **Form Controls:** Set inside Tier 1 cards with recessed crisp white backdrops and `#E2E8F0` borders, shifting to a solid 2px outline of `#0E6245` with a 2px offset on focus.

## Shapes

The interface balances friendly modern accessibility with authoritative precision via a strict four-tiered radius architecture:

- **Large structural containers (`rounded-3xl` / 24px):** Primary scheme containers, application overview cards, and dialog modals.
- **Sub-cards & Nested panels (`rounded-2xl` / 16px):** Eligibility criteria sections, disbursement calculation units, and nested category blocks.
- **Interactive elements (`rounded-xl` / 12px):** Input text boxes, select dropdowns, search bars, CTA buttons, and filter toggles.
- **Status badges & Indicator pills (`rounded-full` / 9999px):** Eligibility status chips, category tags, state/central ministry labels, and step counts.

## Components

### Buttons
- **Primary CTA:** Solid Forest Emerald (`#0E6245`) surface, pure white (`#FFFFFF`) text, font-weight 700 (`font-bold`), 12px (`rounded-xl`) corner radius. Height: 48px desktop / 44px mobile. Hover state: `#004831`. Active state: scale down to 98%. Focus state: 2px ring `#0E6245` offset by 2px `#F8FAFC`.
- **Secondary Civic Outline:** Pure white canvas, 1.5px solid border `#E2E8F0`, slate-900 (`#0F172A`) text, font-weight 700. Hover: background shifts to `#F8FAFC` and border transitions to `#CBD5E1`.
- **Ghost/Tertiary:** No border, transparent background, text `#0E6245` font-bold. Hover: `#DCFCE7` soft mint background tint.

### Chips & Badges
- **Approved / Eligible Status Pill:** `rounded-full`, padding `4px 12px`. Background `#DCFCE7`, border 1px solid `#BBF7D0`, text `#166534`, font size 11px, `font-bold`, uppercase tracking. Left-aligned with a 6px solid emerald dot.
- **Under Review / Warning Pill:** Background `#FEF3C7`, border 1px solid `#FDE68A`, text `#92400E`, `rounded-full`.
- **Ineligible / Deadline Expired Pill:** Background `#FEE2E2`, border 1px solid `#FECACA`, text `#991B1B`, `rounded-full`.
- **Category Filter Chip:** `rounded-xl`, padding `8px 16px`, background `#FFFFFF`, border 1px solid `#E2E8F0`, text `#1E293B`. Selected state: background `#0E6245`, border `#0E6245`, text `#FFFFFF`.

### Inputs & Form Fields
- **Text Inputs & Dropdowns:** 12px radius (`rounded-xl`), background `#FFFFFF`, 1.5px border `#E2E8F0`, 48px height, typography `body-md` (`#1E293B`). Placeholder `#64748B`.
- **Focus State:** Border shifts cleanly to `#0E6245` with zero blurry halo—clean 2px stroke rings only.
- **Field Labels:** `label-md` (`#0F172A`), `font-semibold`, margin-bottom 6px.
- **Assistance/Helper Text:** `12px` regular, `#64748B`, margin-top 4px. Error states shift helper text and input borders to `#991B1B`.

### Checkboxes & Radios
- **Checkboxes:** 20px x 20px box, 6px radius (`rounded-md`), border 2px solid `#CBD5E1`, background `#FFFFFF`. Selected state: solid `#0E6245` with a sharp white checkmark.
- **Radio Buttons:** 20px circular frame, 2px solid `#CBD5E1`. Checked state: border `#0E6245`, inner 8px centered emerald circle.

### Cards & Data Panels
- **Primary Scheme Card:** Container uses `rounded-3xl` (24px), `#FFFFFF` fill, 1px perimeter border `#E2E8F0`. Padding `space-lg` (24px). Top rail features department classification badges alongside application deadlines.
- **Benefit Highlight Sub-Card:** Nested within primary scheme card, uses `rounded-2xl` (16px), background `#F8FAFC`, border 1px solid `#E2E8F0`, padding `space-md` (16px). Figures rendered in `headline-md` `#0E6245`.

### Eligibility Verification Matrix
- **Structured Accordions:** Flat `#FFFFFF` panels divided by 1px `#E2E8F0` separators. State expansion indicates passed checks (green tick in `#DCFCE7` disk) or pending proof (amber document icon in `#FEF3C7` disk).
- **Document Requirement Row:** Minimal horizontal listing featuring file format badge (`code-mono`), maximum size constraints in slate-500, and an inline upload trigger button (`rounded-xl`).