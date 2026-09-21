# 🏛️ Open Knowledge Framework (OKF) Government Welfare Catalog

> **Standard:** Frictionless Data Package v2.0 (Open Knowledge Foundation)  
> **Total Schemes:** 4,148 Schemes across 36 States/UTs & Central Ministries  
> **Licenses:** CC-BY-4.0 & OGDL-India  

---

## 📦 Package Contents

This directory contains the canonical open knowledge data package for Indian welfare schemes, designed for both human verification and autonomous AI agent consumption.

```text
knowledge/
├── datapackage.json             # Official OKF / Frictionless Data Package Descriptor
├── data/
│   ├── schemes.csv              # Master catalog (4,148 schemes)
│   ├── eligibility_rules.csv    # 9,920 Deterministic rule engine conditions
│   ├── benefits.csv             # 4,148 Financial & In-kind DBT benefits
│   ├── required_documents.csv   # 14,695 Mapped document requirements
│   └── ministries.csv           # 326 Administrative departments
├── schemes/                     # 4,148 Rich Markdown files with YAML frontmatter
├── documents/                   # 50 Canonical document taxonomies
└── ministries/                  # 326 Ministry governance profiles
```

---

## 🔍 Validation with Frictionless CLI

To validate this package against the official Open Knowledge Foundation specifications:

```bash
# Validate complete Data Package
frictionless validate knowledge/datapackage.json
```
