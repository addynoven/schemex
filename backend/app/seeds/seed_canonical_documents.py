"""
Seed the 50 Canonical Government Documents from root /knowledge into Cloud PostgreSQL.
"""
import glob
from pathlib import Path
from sqlalchemy import text
from app.database import SessionLocal, engine
from app.modules.schemes.models import CanonicalDocument

KNOWLEDGE_DOCS_DIR = Path(__file__).resolve().parents[3] / "knowledge" / "documents"


def seed_canonical_documents():
    print(f"Loading canonical documents from: {KNOWLEDGE_DOCS_DIR}")
    assert KNOWLEDGE_DOCS_DIR.exists(), f"Directory not found: {KNOWLEDGE_DOCS_DIR}"

    # 1. Create table if not exists
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS canonical_documents (
                id VARCHAR(128) PRIMARY KEY,
                slug VARCHAR(128) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(64) NOT NULL,
                schemes_count INTEGER DEFAULT 0 NOT NULL,
                overview TEXT,
                issuing_authorities TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_canonical_documents_slug ON canonical_documents (slug);
            CREATE INDEX IF NOT EXISTS ix_canonical_documents_name ON canonical_documents (name);
            CREATE INDEX IF NOT EXISTS ix_canonical_documents_category ON canonical_documents (category);
        """))
    print("✅ Created canonical_documents table and indexes in PostgreSQL.")

    # 2. Parse all markdown documents
    db = SessionLocal()
    count = 0
    try:
        md_files = sorted(glob.glob(str(KNOWLEDGE_DOCS_DIR / "**/*.md"), recursive=True))
        print(f"Found {len(md_files)} markdown files.")

        for fpath in md_files:
            with open(fpath, "r", encoding="utf-8") as fp:
                content = fp.read()

            if not content.startswith("---"):
                continue

            parts = content.split("---", 2)
            frontmatter_raw = parts[1]
            body = parts[2] if len(parts) > 2 else ""

            data = {}
            for line in frontmatter_raw.strip().split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    data[k.strip()] = v.strip().strip('"')

            doc_id = data.get("id") or Path(fpath).stem
            slug = data.get("slug") or doc_id
            name = data.get("name") or doc_id.replace("-", " ").title()
            category = data.get("category", "general-compliance")
            schemes_count = int(data.get("total_schemes_requiring", 0))

            # Parse Overview
            overview = ""
            if "## 1. Document Overview" in body:
                overview = body.split("## 1. Document Overview")[1].split("##")[0].strip()

            # Parse Issuing Authorities
            issuing = ""
            if "## 2. Standard Issuing Authorities" in body:
                issuing = body.split("## 2. Standard Issuing Authorities")[1].split("##")[0].strip()

            existing = db.query(CanonicalDocument).filter_by(id=doc_id).first()
            if existing:
                existing.slug = slug
                existing.name = name
                existing.category = category
                existing.schemes_count = schemes_count
                existing.overview = overview
                existing.issuing_authorities = issuing
            else:
                doc = CanonicalDocument(
                    id=doc_id,
                    slug=slug,
                    name=name,
                    category=category,
                    schemes_count=schemes_count,
                    overview=overview,
                    issuing_authorities=issuing,
                )
                db.add(doc)
            count += 1

        db.commit()
        print(f"🎉 Successfully seeded {count} canonical documents in Cloud PostgreSQL!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_canonical_documents()
