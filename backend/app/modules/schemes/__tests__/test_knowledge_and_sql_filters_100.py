import csv
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.schemes.models import Scheme
from app.seeds.seed_national_schemes import NATIONAL_AND_STATE_SCHEMES_DATA, seed_national_schemes

KNOWLEDGE_DIR = Path(__file__).resolve().parents[5] / "knowledge"
SCHEMES_CSV_PATH = KNOWLEDGE_DIR / "data" / "schemes.csv"
KNOWLEDGE_SCHEMES_DIR = KNOWLEDGE_DIR / "schemes"


@pytest.fixture(autouse=True)
def setup_seeded_db(db_session: Session):
    seed_national_schemes(db_session)


# =============================================================================
# GROUP 1: Canonical Knowledge Ground-Truth Verification (20 tests)
# For each of the 20 seeded schemes, verify:
# - Exists in SQL DB
# - Exists in knowledge/data/schemes.csv
# - Slug, Title, Category, and State match 100%
# - Associated Markdown file exists in knowledge/schemes/
# =============================================================================

@pytest.mark.parametrize(
    "slug,expected_title,expected_category,expected_state",
    [
        (s["slug"], s["name"], s["category"], s["state"])
        for s in NATIONAL_AND_STATE_SCHEMES_DATA
    ],
)
def test_group1_scheme_matches_canonical_knowledge(
    db_session: Session, slug: str, expected_title: str, expected_category: str, expected_state: str
):
    # 1. SQL DB check
    db_scheme = db_session.query(Scheme).filter(Scheme.slug == slug).first()
    assert db_scheme is not None, f"Scheme '{slug}' missing in SQL DB"
    assert db_scheme.name == expected_title
    assert db_scheme.category == expected_category
    assert db_scheme.state == expected_state

    # 2. Knowledge CSV check
    assert SCHEMES_CSV_PATH.exists(), f"schemes.csv missing at {SCHEMES_CSV_PATH}"
    with open(SCHEMES_CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        csv_map = {r["slug"]: r for r in reader}
    assert slug in csv_map, f"Scheme '{slug}' missing in knowledge/data/schemes.csv"
    csv_row = csv_map[slug]
    assert csv_row["title"] == expected_title
    assert csv_row["category"] == expected_category
    assert csv_row["state"] == expected_state

    # 3. Knowledge Markdown file check
    md_files = list(KNOWLEDGE_SCHEMES_DIR.glob(f"**/{slug}.md"))
    assert len(md_files) >= 1, f"Markdown file for '{slug}' missing in {KNOWLEDGE_SCHEMES_DIR}"


# =============================================================================
# GROUP 2: Sector Category Filtering & Synonyms (15 tests)
# =============================================================================

@pytest.mark.parametrize(
    "category,expected_count",
    [
        ("Agriculture", 4),
        ("Women & Child", 5),
        ("Education", 3),
        ("Social Welfare", 3),
        ("Employment & Skills", 2),
        ("Healthcare", 1),
        ("Housing", 1),
        ("Business & Finance", 1),
        ("msme", 1),                # Synonym for Business & Finance
        ("health", 1),              # Synonym for Healthcare
        ("women", 5),               # Synonym for Women & Child
        ("farmer", 4),              # Synonym for Agriculture
        ("farming", 4),             # Synonym for Agriculture
        ("skills", 2),              # Synonym for Employment & Skills
        ("NonExistentCategoryXYZ", 0),
    ],
)
def test_group2_category_filters(client: TestClient, category: str, expected_count: int):
    res = client.get(f"/schemes?category={category}&limit=100")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == expected_count
    assert len(data["items"]) == expected_count


# =============================================================================
# GROUP 3: State & Jurisdiction Filtering (20 tests)
# =============================================================================

@pytest.mark.parametrize(
    "state_filter,expected_count",
    [
        ("ALL_INDIA", 12),
        ("Central", 12),
        ("CENTRAL", 12),
        ("Central Only", 12),
        ("CENTRAL ONLY", 12),
        ("National", 12),
        ("Madhya Pradesh", 4),
        ("madhya pradesh", 4),
        ("MADHYA PRADESH", 4),
        ("Maharashtra", 2),
        ("maharashtra", 2),
        ("MAHARASHTRA", 2),
        ("Karnataka", 2),
        ("karnataka", 2),
        ("KARNATAKA", 2),
        ("Tamil Nadu", 0),
        ("Gujarat", 0),
        ("Uttar Pradesh", 0),
        ("Bihar", 0),
        ("West Bengal", 0),
    ],
)
def test_group3_state_filters(client: TestClient, state_filter: str, expected_count: int):
    res = client.get(f"/schemes?state={state_filter}&limit=100")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == expected_count
    assert len(data["items"]) == expected_count


# =============================================================================
# GROUP 4: Multi-Field Combined Filters (State + Category) (25 tests)
# =============================================================================

@pytest.mark.parametrize(
    "state,category,expected_count",
    [
        # Central schemes across categories
        ("Central", "Agriculture", 2),          # PM Kisan, PM Fasal Bima
        ("Central", "Healthcare", 1),           # Ayushman Bharat
        ("Central", "Women & Child", 2),        # Sukanya Samriddhi, PMMVY
        ("Central", "Social Welfare", 3),       # IGNOAPS, Ujjwala, Atal Pension
        ("Central", "Employment & Skills", 1),  # PM Vishwakarma
        ("Central", "Housing", 1),              # PMAY Gramin
        ("Central", "Business & Finance", 1),   # PM Mudra
        ("Central", "Education", 1),            # Post-Matric Scholarship
        ("Central", "msme", 1),
        ("Central", "health", 1),
        ("Central", "farmer", 2),
        # Madhya Pradesh state schemes
        ("Madhya Pradesh", "Agriculture", 1),   # MP Kisan Kalyan
        ("Madhya Pradesh", "Women & Child", 1), # MP Ladli Behna
        ("Madhya Pradesh", "Education", 2),     # Medhavi Vidyarthi, ST Scholarship
        ("Madhya Pradesh", "Healthcare", 0),
        ("Madhya Pradesh", "Housing", 0),
        ("Madhya Pradesh", "Business & Finance", 0),
        # Maharashtra state schemes
        ("Maharashtra", "Women & Child", 1),    # Majhi Ladki Bahin
        ("Maharashtra", "Agriculture", 1),      # Namo Shetkari
        ("Maharashtra", "Healthcare", 0),
        ("Maharashtra", "Education", 0),
        # Karnataka state schemes
        ("Karnataka", "Women & Child", 1),      # Gruha Lakshmi
        ("Karnataka", "Employment & Skills", 1),# Yuva Nidhi
        ("Karnataka", "Agriculture", 0),
        ("Karnataka", "Healthcare", 0),
    ],
)
def test_group4_combined_state_and_category(
    client: TestClient, state: str, category: str, expected_count: int
):
    res = client.get(f"/schemes?state={state}&category={category}&limit=100")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == expected_count
    for item in data["items"]:
        if state.upper() in ("CENTRAL", "CENTRAL ONLY", "ALL_INDIA", "NATIONAL"):
            assert item["state"] == "ALL_INDIA"
        else:
            assert item["state"] == state


# =============================================================================
# GROUP 5: Full-Text / Substring Keyword Search (20 tests)
# =============================================================================

@pytest.mark.parametrize(
    "search_term,expected_min_count,expected_slug_contains",
    [
        ("Kisan", 3, "kisan"),           # PM Kisan, PM Fasal Bima, MP Kisan Kalyan
        ("Ayushman", 1, "ayushman"),
        ("Pension", 2, "pension"),        # IGNOAPS, Atal Pension
        ("Sukanya", 1, "sukanya"),
        ("Vishwakarma", 1, "vishwakarma"),
        ("Ujjwala", 1, "ujjwala"),
        ("Mudra", 1, "mudra"),
        ("Scholarship", 3, "scholarship"),# Post-Matric, MP Medhavi, MP ST Scholarship
        ("Ladli", 1, "ladli"),
        ("Ladki", 1, "ladki"),
        ("Gruha Lakshmi", 1, "gruha-lakshmi"),
        ("Yuva Nidhi", 1, "yuva-nidhi"),
        ("Awas", 1, "pmay"),
        ("Fasal", 1, "fasal"),
        ("Shetkari", 1, "shetkari"),
        ("DBT", 5, None),                 # Matches direct benefit transfer tags
        ("Cashless", 1, "ayushman"),
        ("LPG", 1, "ujjwala"),
        ("Unemployment", 1, "yuva-nidhi"),
        ("NonExistentSearchTerm123", 0, None),
    ],
)
def test_group5_search_queries(
    client: TestClient, search_term: str, expected_min_count: int, expected_slug_contains: str | None
):
    res = client.get(f"/schemes?search={search_term}&limit=100")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= expected_min_count
    if expected_slug_contains:
        matched = any(expected_slug_contains in item["slug"] for item in data["items"])
        assert matched, f"None of returned items contain '{expected_slug_contains}' in slug"


# =============================================================================
# GROUP 6: Combined Search + State + Category (15 tests)
# =============================================================================

@pytest.mark.parametrize(
    "search,state,category,expected_count,expected_slug",
    [
        ("Kisan", "Central", "Agriculture", 1, "pm-kisan"),
        ("Bima", "Central", "Agriculture", 1, "pm-fasal-bima-yojana"),
        ("Kisan", "Madhya Pradesh", "Agriculture", 1, "mp-kisan-kalyan-yojana"),
        ("Bahin", "Maharashtra", "Women & Child", 1, "mh-majhi-ladki-bahin"),
        ("Behna", "Madhya Pradesh", "Women & Child", 1, "mp-ladli-behna-yojana"),
        ("Lakshmi", "Karnataka", "Women & Child", 1, "ka-gruha-lakshmi-scheme"),
        ("Nidhi", "Karnataka", "Employment & Skills", 1, "ka-yuva-nidhi-scheme"),
        ("Scholarship", "Madhya Pradesh", "Education", 2, None),
        ("Medhavi", "Madhya Pradesh", "Education", 1, "mp-medhavi-vidyarthi-yojana"),
        ("Hospital", "Central", "Healthcare", 1, "ayushman-bharat-pmjay"),
        ("Artisan", "Central", "Employment & Skills", 1, "pm-vishwakarma"),
        ("Loan", "Central", "Business & Finance", 1, "pm-mudra-yojana"),
        ("Gas", "Central", "Social Welfare", 1, "pm-ujjwala-yojana"),
        ("Old Age", "Central", "Social Welfare", 2, "ignoaps-old-age-pension"), # IGNOAPS and Atal Pension
        ("ImpossibleQueryXYZ", "Central", "Agriculture", 0, None),
    ],
)
def test_group6_combined_search_state_category(
    client: TestClient, search: str, state: str, category: str, expected_count: int, expected_slug: str | None
):
    res = client.get(f"/schemes?search={search}&state={state}&category={category}&limit=100")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == expected_count
    if expected_slug:
        slugs = [i["slug"] for i in data["items"]]
        assert expected_slug in slugs


# =============================================================================
# GROUP 7: Knowledge Base Comparison & Distribution (15 tests)
# Validates distribution between SQL DB and offline Knowledge CSV
# =============================================================================

def test_group7_01_total_count_knowledge_vs_sql(db_session: Session):
    db_count = db_session.query(Scheme).count()
    assert db_count == 20, f"Expected 20 SQL DB schemes, got {db_count}"

    with open(SCHEMES_CSV_PATH, encoding="utf-8") as f:
        csv_count = len(list(csv.DictReader(f)))
    assert csv_count == 4147, f"Expected 4147 knowledge CSV schemes, got {csv_count}"


@pytest.mark.parametrize(
    "category,sql_expected,knowledge_min",
    [
        ("Agriculture", 4, 700),
        ("Women & Child", 5, 500),
        ("Education", 3, 600),
        ("Social Welfare", 3, 400),
        ("Employment & Skills", 2, 400),
        ("Healthcare", 1, 400),
        ("Housing", 1, 300),
        ("Business & Finance", 1, 250),
    ],
)
def test_group7_category_distribution_comparison(
    db_session: Session, category: str, sql_expected: int, knowledge_min: int
):
    db_count = db_session.query(Scheme).filter(Scheme.category == category).count()
    assert db_count == sql_expected

    with open(SCHEMES_CSV_PATH, encoding="utf-8") as f:
        kb_count = sum(1 for r in csv.DictReader(f) if r["category"] == category)
    assert kb_count >= knowledge_min, f"Category '{category}' has {kb_count} in CSV, expected >= {knowledge_min}"


@pytest.mark.parametrize(
    "state,sql_expected,knowledge_min",
    [
        ("ALL_INDIA", 12, 800),
        ("Madhya Pradesh", 4, 100),
        ("Maharashtra", 2, 100),
        ("Karnataka", 2, 100),
        ("Uttar Pradesh", 0, 150),
        ("Tamil Nadu", 0, 100),
    ],
)
def test_group7_state_distribution_comparison(
    db_session: Session, state: str, sql_expected: int, knowledge_min: int
):
    db_count = db_session.query(Scheme).filter(Scheme.state == state).count()
    assert db_count == sql_expected

    with open(SCHEMES_CSV_PATH, encoding="utf-8") as f:
        kb_count = sum(1 for r in csv.DictReader(f) if r["state"] == state)
    assert kb_count >= knowledge_min, f"State '{state}' has {kb_count} in CSV, expected >= {knowledge_min}"


# =============================================================================
# GROUP 8: Pagination, Sorting & Boundary Tests (15 tests)
# =============================================================================

def test_group8_01_pagination_limit_5(client: TestClient):
    res = client.get("/schemes?skip=0&limit=5")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 20
    assert len(data["items"]) == 5


def test_group8_02_pagination_skip_15_limit_10(client: TestClient):
    res = client.get("/schemes?skip=15&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 20
    assert len(data["items"]) == 5  # 20 - 15 = 5


def test_group8_03_pagination_out_of_bounds(client: TestClient):
    res = client.get("/schemes?skip=50&limit=20")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 20
    assert len(data["items"]) == 0


def test_group8_04_sort_by_name_asc(client: TestClient):
    res = client.get("/schemes?sort_by=name_asc&limit=20")
    assert res.status_code == 200
    data = res.json()
    names = [item["name"] for item in data["items"]]
    assert names == sorted(names)


def test_group8_05_sort_by_name_desc(client: TestClient):
    res = client.get("/schemes?sort_by=name_desc&limit=20")
    assert res.status_code == 200
    data = res.json()
    names = [item["name"] for item in data["items"]]
    assert names == sorted(names, reverse=True)


def test_group8_06_sort_by_category_asc(client: TestClient):
    res = client.get("/schemes?sort_by=category_asc&limit=20")
    assert res.status_code == 200
    data = res.json()
    categories = [item["category"] for item in data["items"]]
    assert categories == sorted(categories)


def test_group8_07_categories_aggregation_endpoint(client: TestClient):
    res = client.get("/schemes/categories")
    assert res.status_code == 200
    cats = res.json()["categories"]
    total_schemes_in_cats = sum(c["count"] for c in cats)
    assert total_schemes_in_cats == 20
    assert len(cats) == 8


def test_group8_08_browse_endpoint_with_canonical_knowledge_inspection(client: TestClient):
    res = client.get("/schemes/browse?state=ALL_INDIA&category=Agriculture&include_knowledge_md=true")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    for item in data["items"]:
        assert item["verification_status"] == "VERIFIED_CANONICAL_RECORD"
        assert item["knowledge_md"] is not None
        assert len(item["knowledge_md"]) > 100


def test_group8_09_special_chars_sql_injection_safe(client: TestClient):
    res = client.get("/schemes?search=' OR '1'='1&limit=20")
    assert res.status_code == 200
    assert res.json()["total"] == 0


def test_group8_10_special_chars_semicolon_drop_safe(client: TestClient):
    res = client.get("/schemes?search=; DROP TABLE schemes;--&limit=20")
    assert res.status_code == 200
    assert res.json()["total"] == 0


def test_group8_11_currency_symbol_search(client: TestClient):
    res = client.get("/schemes?search=₹6,000&limit=20")
    assert res.status_code == 200
    assert res.json()["total"] >= 1  # PM Kisan has ₹6,000 in description


def test_group8_12_ampersand_category_handling(client: TestClient):
    res = client.get("/schemes?category=Women%20%26%20Child&limit=20")
    assert res.status_code == 200
    assert res.json()["total"] == 5


def test_group8_13_negative_skip_validation(client: TestClient):
    res = client.get("/schemes?skip=-5")
    assert res.status_code == 422  # Pydantic validation error


def test_group8_14_excessive_limit_validation(client: TestClient):
    res = client.get("/schemes?limit=500")
    assert res.status_code == 422  # Max limit is 100


def test_group8_15_empty_search_returns_all(client: TestClient):
    res = client.get("/schemes?search=&limit=100")
    assert res.status_code == 200
    assert res.json()["total"] == 20
