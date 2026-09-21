"""
Import complete Canonical Open Knowledge Framework (OKF) Catalog into PostgreSQL.
Loads 4,147 schemes, 4,148 benefits, 9,920 eligibility rules, and 14,695 documents.
"""

import csv
import sys
from pathlib import Path
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.modules.schemes.models import Scheme, Benefit, EligibilityRule, RequiredDocument

KNOWLEDGE_DATA_DIR = Path(__file__).resolve().parents[3] / "knowledge" / "data"


def import_knowledge_catalog(db: Session) -> dict[str, int]:
    # 1. Check existing schemes
    existing_slugs = {s.slug: s.id for s in db.query(Scheme.slug, Scheme.id).all()}
    print(f"Initial DB schemes: {len(existing_slugs)}")

    # 2. Read schemes.csv
    schemes_csv = KNOWLEDGE_DATA_DIR / "schemes.csv"
    with open(schemes_csv, encoding="utf-8") as f:
        s_rows = list(csv.DictReader(f))

    schemes_to_create = []
    slug_to_id_map = dict(existing_slugs)

    for r in s_rows:
        slug = r["slug"]
        if slug in existing_slugs:
            continue

        s = Scheme(
            name=r["title"],
            slug=slug,
            state=r["state"] if r["state"] else "ALL_INDIA",
            category=r["category"] if r["category"] else "General",
            ministry=r["ministry"] if r["ministry"] else "Government of India",
            description=r["description"] if r["description"] else r.get("benefit_summary", "Government Welfare Scheme"),
            application_url=r.get("application_url"),
            official_website=r.get("application_url"),
            status="active",
            publication_state="published",
            source_freshness="fresh",
        )
        schemes_to_create.append(s)

    if schemes_to_create:
        db.add_all(schemes_to_create)
        db.flush()
        for s in schemes_to_create:
            slug_to_id_map[s.slug] = s.id
        print(f"✅ Added {len(schemes_to_create)} new schemes to PostgreSQL.")

    # 3. Read & insert benefits
    benefits_csv = KNOWLEDGE_DATA_DIR / "benefits.csv"
    existing_benefit_scheme_ids = {b.scheme_id for b in db.query(Benefit.scheme_id).all()}
    with open(benefits_csv, encoding="utf-8") as f:
        b_rows = list(csv.DictReader(f))

    benefits_to_create = []
    for r in b_rows:
        slug = r["scheme_slug"]
        scheme_id = slug_to_id_map.get(slug)
        if not scheme_id or scheme_id in existing_benefit_scheme_ids:
            continue

        b = Benefit(
            scheme_id=scheme_id,
            title=r["title"],
            description=r.get("details") or r.get("benefit_type") or r["title"],
        )
        benefits_to_create.append(b)

    if benefits_to_create:
        db.add_all(benefits_to_create)
        db.flush()
        print(f"✅ Added {len(benefits_to_create)} benefits to PostgreSQL.")

    # 4. Read & insert eligibility rules
    rules_csv = KNOWLEDGE_DATA_DIR / "eligibility_rules.csv"
    existing_rule_scheme_ids = {r.scheme_id for r in db.query(EligibilityRule.scheme_id).all()}
    with open(rules_csv, encoding="utf-8") as f:
        r_rows = list(csv.DictReader(f))

    rules_to_create = []
    for r in r_rows:
        slug = r["scheme_slug"]
        scheme_id = slug_to_id_map.get(slug)
        if not scheme_id or scheme_id in existing_rule_scheme_ids:
            continue

        er = EligibilityRule(
            scheme_id=scheme_id,
            field_name=r["field_name"],
            operator=r["operator"],
            rule_value=r["rule_value"],
        )
        rules_to_create.append(er)

    if rules_to_create:
        db.add_all(rules_to_create)
        db.flush()
        print(f"✅ Added {len(rules_to_create)} eligibility rules to PostgreSQL.")

    # 5. Read & insert required documents
    docs_csv = KNOWLEDGE_DATA_DIR / "required_documents.csv"
    existing_doc_scheme_ids = {d.scheme_id for d in db.query(RequiredDocument.scheme_id).all()}
    with open(docs_csv, encoding="utf-8") as f:
        d_rows = list(csv.DictReader(f))

    docs_to_create = []
    for r in d_rows:
        slug = r["scheme_slug"]
        scheme_id = slug_to_id_map.get(slug)
        if not scheme_id or scheme_id in existing_doc_scheme_ids:
            continue

        rd = RequiredDocument(
            scheme_id=scheme_id,
            document_name=r["document_name"],
            is_mandatory=r.get("is_mandatory", "1") in ("1", "true", "True", True),
            description=r.get("description"),
        )
        docs_to_create.append(rd)

    if docs_to_create:
        db.add_all(docs_to_create)
        db.flush()
        print(f"✅ Added {len(docs_to_create)} required documents to PostgreSQL.")

    db.commit()

    total_schemes = db.query(Scheme).count()
    print(f"🎉 Final DB Scheme Count: {total_schemes}")

    # Re-warm bitmask engine
    from app.modules.eligibility.bitmask_engine import bitmask_engine
    bitmask_engine.warm_up(db)
    print("✅ Bitmask Eligibility Engine warmed up with complete catalog.")

    return {
        "schemes_added": len(schemes_to_create),
        "total_schemes": total_schemes,
        "benefits_added": len(benefits_to_create),
        "rules_added": len(rules_to_create),
        "docs_added": len(docs_to_create),
    }


if __name__ == "__main__":
    db = SessionLocal()
    try:
        import_knowledge_catalog(db)
    finally:
        db.close()
