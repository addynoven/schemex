import sqlite3
import csv
import os
import sys

def generate_db(output_path="mobile/assets/db/schemes.db", data_dir="backend/knowledge/data"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    if os.path.exists(output_path):
        os.remove(output_path)

    conn = sqlite3.connect(output_path)
    cur = conn.cursor()

    # Pre-map scheme_slug to simplified benefit_type from benefits.csv
    slug_to_benefit_type = {}
    with open(os.path.join(data_dir, "benefits.csv"), "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row["scheme_slug"]
            b_type = (row["benefit_type"] or "").lower()
            if "loan" in b_type or "credit" in b_type or "lending" in b_type or "mudra" in b_type:
                simple_type = "loan"
            elif "subsidy" in b_type or "subsidized" in b_type or "rebate" in b_type or "food" in b_type:
                simple_type = "subsidy"
            else:
                simple_type = "cash_grant"
            slug_to_benefit_type[slug] = simple_type

    cur.execute("PRAGMA user_version = 2")

    cur.execute("""
    CREATE TABLE schemes (
        id INTEGER PRIMARY KEY,
        slug TEXT UNIQUE,
        title TEXT,
        ministry TEXT,
        state TEXT,
        category TEXT,
        is_central INTEGER,
        benefit_summary TEXT,
        benefit_type TEXT,
        rules_count INTEGER,
        docs_count INTEGER,
        application_url TEXT,
        description TEXT,
        last_verified_at TEXT
    )
    """)

    with open(os.path.join(data_dir, "schemes.csv"), "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row["slug"]
            b_type = slug_to_benefit_type.get(slug, "cash_grant")
            cur.execute("""
            INSERT INTO schemes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                int(row["id"]), slug, row["title"], row["ministry"],
                row["state"], row["category"], int(row["is_central"] or 0),
                row["benefit_summary"], b_type, int(row["rules_count"] or 0),
                int(row["docs_count"] or 0), row["application_url"],
                row["description"], row["last_verified_at"]
            ))

    cur.execute("""
    CREATE TABLE eligibility_rules (
        id INTEGER PRIMARY KEY,
        scheme_slug TEXT,
        field_name TEXT,
        operator TEXT,
        rule_value TEXT,
        description TEXT
    )
    """)

    with open(os.path.join(data_dir, "eligibility_rules.csv"), "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cur.execute("""
            INSERT INTO eligibility_rules VALUES (?, ?, ?, ?, ?, ?)
            """, (
                int(row["id"]), row["scheme_slug"], row["field_name"],
                row["operator"], row["rule_value"], row["description"]
            ))

    cur.execute("""
    CREATE TABLE benefits (
        id INTEGER PRIMARY KEY,
        scheme_slug TEXT,
        title TEXT,
        benefit_type TEXT,
        amount_inr REAL,
        frequency TEXT,
        details TEXT
    )
    """)

    with open(os.path.join(data_dir, "benefits.csv"), "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cur.execute("""
            INSERT INTO benefits VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                int(row["id"]), row["scheme_slug"], row["title"],
                row["benefit_type"], float(row["amount_inr"] or 0),
                row["frequency"], row["details"]
            ))

    cur.execute("""
    CREATE TABLE required_documents (
        id INTEGER PRIMARY KEY,
        scheme_slug TEXT,
        document_name TEXT,
        is_mandatory INTEGER,
        description TEXT
    )
    """)

    with open(os.path.join(data_dir, "required_documents.csv"), "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cur.execute("""
            INSERT INTO required_documents VALUES (?, ?, ?, ?, ?)
            """, (
                int(row["id"]), row["scheme_slug"], row["document_name"],
                int(row["is_mandatory"] or 0), row["description"]
            ))

    cur.execute("CREATE INDEX idx_schemes_slug ON schemes(slug)")
    cur.execute("CREATE INDEX idx_schemes_category ON schemes(category)")
    cur.execute("CREATE INDEX idx_schemes_state ON schemes(state)")
    cur.execute("CREATE INDEX idx_schemes_benefit_type ON schemes(benefit_type)")
    cur.execute("CREATE INDEX idx_rules_slug ON eligibility_rules(scheme_slug)")
    cur.execute("CREATE INDEX idx_rules_field ON eligibility_rules(field_name)")
    cur.execute("CREATE INDEX idx_benefits_slug ON benefits(scheme_slug)")
    cur.execute("CREATE INDEX idx_docs_slug ON required_documents(scheme_slug)")

    conn.commit()
    conn.close()

    conn = sqlite3.connect(output_path, autocommit=True)
    conn.execute("VACUUM")
    conn.close()

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Successfully generated {output_path} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    generate_db()
