import json

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.cache import cache_get
from app.core.deps import get_current_admin_user
from app.core.exceptions import SchemeNotFoundError
from app.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.auth.models import User
from app.modules.schemes.schemas import (
    CategoryListResponse,
    SchemeBrowsePaginatedResponse,
    SchemeCreate,
    SchemeDetailResponse,
    SchemeUpdate,
)
from app.modules.schemes.service import (
    browse_schemes_with_filters,
    create_scheme,
    delete_scheme,
    get_scheme_by_id,
    get_scheme_by_slug,
    get_scheme_categories,
    key_list,
    key_scheme_id,
    key_scheme_slug,
    list_schemes,
    search_schemes,
    update_scheme,
)

router = APIRouter(prefix="/schemes", tags=["Schemes"])


@router.post(
    "",
    response_model=SchemeDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new government scheme",
    description="Creates a new scheme with nested benefits, eligibility rules, required documents, and official sources. Requires role='admin'.",
    response_description="Created scheme details with full relations",
)
def create_scheme_endpoint(
    payload: SchemeCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    return create_scheme(db=db, payload=payload)


@router.get(
    "",
    response_model=PaginatedResponse[SchemeDetailResponse],
    summary="List government schemes",
    description="Returns a paginated list of schemes with optional filtering by ministry, category, state, status, or search query.",
    response_description="Paginated list of schemes with child collections",
)
def list_schemes_endpoint(
    skip: int = Query(0, ge=0, description="Number of items to skip for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of items to return"),
    ministry: str | None = Query(None, description="Filter by ministry name"),
    category: str | None = Query(None, description="Filter by sector category (e.g. 'Agriculture', 'Healthcare')"),
    state: str | None = Query(None, description="Filter by state (e.g. 'Madhya Pradesh', 'Maharashtra', 'Karnataka', 'ALL_INDIA')"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status ('active', 'draft', 'archived')"),
    benefit_type: str | None = Query(None, description="Filter by benefit type ('loan', 'subsidy', 'cash_grant')"),
    search: str | None = Query(None, description="Search across scheme name, description, category, and tags"),
    sort_by: str | None = Query(None, description="Sort order: 'name_asc', 'name_desc', 'id_desc', 'id_asc', 'category_asc'"),
    db: Session = Depends(get_db),
):
    cache_key = key_list(
        skip=skip,
        limit=limit,
        ministry=ministry,
        category=category,
        state=state,
        status=status_filter,
        benefit_type=benefit_type,
        search=search,
        sort_by=sort_by,
    )
    cached = cache_get(cache_key)
    if cached is not None:
        try:
            data = json.loads(cached)
            return PaginatedResponse(
                items=data["items"],
                total=data["total"],
                skip=skip,
                limit=limit,
            )
        except Exception:
            pass

    items, total = list_schemes(
        db=db,
        skip=skip,
        limit=limit,
        ministry=ministry,
        category=category,
        state=state,
        benefit_type=benefit_type,
        status=status_filter,
        search=search,
        sort_by=sort_by,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/search",
    response_model=PaginatedResponse[SchemeDetailResponse],
    summary="Problem & Need-based scheme discovery",
    description="High-relevance discovery endpoint for citizens searching by problems, life events, and keywords (e.g. 'fertilizer', 'pension', 'hospital').",
    response_description="Matching active schemes",
)
def search_schemes_endpoint(
    q: str | None = Query(None, description="Problem or keyword search e.g. 'farmer', 'pension', 'scholarship'"),
    category: str | None = Query(None, description="Sector category filter e.g. 'Agriculture', 'Healthcare'"),
    state: str | None = Query(None, description="Filter by state jurisdiction e.g. 'Madhya Pradesh'"),
    status_filter: str = Query("active", alias="status", description="Scheme status filter"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: str | None = Query(None, description="Sort order: 'name_asc', 'name_desc', 'id_desc', 'id_asc'"),
    db: Session = Depends(get_db),
):
    cache_key = key_list(
        skip=skip,
        limit=limit,
        category=category,
        state=state,
        status=status_filter,
        search=q,
        sort_by=sort_by,
    )
    cached = cache_get(cache_key)
    if cached is not None:
        try:
            data = json.loads(cached)
            return PaginatedResponse(
                items=data["items"],
                total=data["total"],
                skip=skip,
                limit=limit,
            )
        except Exception:
            pass

    items, total = search_schemes(
        db=db,
        q=q,
        category=category,
        state=state,
        status=status_filter,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )



@router.get(
    "/browse",
    response_model=SchemeBrowsePaginatedResponse,
    summary="Browse schemes with multi-field filters & @knowledge inspection",
    description="Multi-field directory browsing with full support for demographic/policy filters (state, category, ministry, status, publication_state, age, income, gender, occupation, caste, land) and ground-truth @knowledge Markdown content inspection.",
    response_description="Paginated schemes with applied filters and optional canonical OKF Markdown documentation",
)
def browse_schemes_endpoint(
    q: str | None = Query(None, description="Search keyword e.g. 'farmer', 'scholarship'"),
    state: str | None = Query(None, description="State filter e.g. 'Gujarat', 'Madhya Pradesh', 'ALL_INDIA'"),
    category: str | None = Query(None, description="Category filter e.g. 'Agriculture', 'Education'"),
    ministry: str | None = Query(None, description="Ministry filter"),
    status_filter: str | None = Query(None, alias="status", description="Status filter ('active', 'draft', 'archived', or omit for all)"),
    publication_state: str | None = Query(None, description="Publication state ('published', 'draft', 'archived', or omit for all)"),
    occupation: str | None = Query(None, description="Occupation filter e.g. 'farmer', 'student'"),
    gender: str | None = Query(None, description="Gender filter e.g. 'male', 'female'"),
    caste_category: str | None = Query(None, description="Caste filter e.g. 'OBC', 'General', 'SC', 'ST'"),
    age: int | None = Query(None, ge=0, le=120, description="Age filter in years"),
    annual_income: float | None = Query(None, ge=0, description="Annual household income filter in INR"),
    has_land: bool | None = Query(None, description="Landholding boolean filter"),
    include_knowledge_md: bool = Query(False, description="Set true to attach canonical @knowledge Markdown documentation"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
):
    items, total, filters_applied = browse_schemes_with_filters(
        db=db,
        skip=skip,
        limit=limit,
        search=q,
        state=state,
        category=category,
        ministry=ministry,
        status=status_filter,
        publication_state=publication_state,
        occupation=occupation,
        gender=gender,
        caste_category=caste_category,
        age=age,
        annual_income=annual_income,
        has_land=has_land,
        include_knowledge_md=include_knowledge_md,
    )
    return SchemeBrowsePaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
        filters_applied=filters_applied,
    )


@router.get(
    "/categories",
    response_model=CategoryListResponse,
    summary="List scheme categories with counts",
    description="Returns all unique scheme sector categories along with the count of active schemes in each category.",
    response_description="List of categories and counts",
)
def get_categories_endpoint(
    db: Session = Depends(get_db),
):
    categories = get_scheme_categories(db=db)
    return CategoryListResponse(categories=categories)


@router.get(
    "/version",
    summary="Get schemes catalog watermark version",
    description="Returns aggregate watermark timestamp, version epoch, and total scheme count for cache invalidation.",
)
def get_schemes_version_endpoint(db: Session = Depends(get_db)):
    from sqlalchemy import text
    sql = text("""
        SELECT 
            COUNT(*)::text AS total_schemes,
            COALESCE(MAX(updated_at), MAX(created_at), NOW())::text AS last_updated_at,
            EXTRACT(EPOCH FROM COALESCE(MAX(updated_at), MAX(created_at), NOW()))::BIGINT AS version
        FROM schemes;
    """)
    row = db.execute(sql).mappings().one()
    return {
        "version": int(row["version"] or 0),
        "last_updated_at": str(row["last_updated_at"]),
        "total_schemes": int(row["total_schemes"] or 0),
    }


@router.get(
    "/sync",
    summary="Delta sync schemes modified since watermark",
    description="Returns schemes updated or created after the given watermark for offline SQLite upsert.",
)
def sync_schemes_endpoint(
    since: int = Query(0, description="Epoch timestamp in seconds"),
    limit: int = Query(200, ge=1, le=500, description="Max schemes to return in one delta batch"),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone
    from sqlalchemy import text
    import re

    since_dt = datetime.fromtimestamp(since, tz=timezone.utc)
    sql = text("""
        SELECT 
            s.id,
            s.slug,
            s.name AS title,
            s.ministry,
            s.state,
            s.category,
            CASE WHEN s.state = 'ALL_INDIA' THEN 1 ELSE 0 END AS is_central,
            COALESCE(
                (SELECT b.title || ': ' || b.description FROM benefits b WHERE b.scheme_id = s.id LIMIT 1),
                s.description
            ) AS benefit_summary,
            (SELECT b.title FROM benefits b WHERE b.scheme_id = s.id LIMIT 1) AS benefit_title,
            (SELECT b.description FROM benefits b WHERE b.scheme_id = s.id LIMIT 1) AS benefit_desc,
            s.tags,
            COALESCE((SELECT COUNT(*) FROM eligibility_rules r WHERE r.scheme_id = s.id), 0)::int AS rules_count,
            COALESCE((SELECT COUNT(*) FROM required_documents d WHERE d.scheme_id = s.id), 0)::int AS docs_count,
            s.application_url,
            s.description,
            COALESCE(s.updated_at, s.created_at)::text AS last_verified_at,
            EXTRACT(EPOCH FROM COALESCE(s.updated_at, s.created_at))::BIGINT AS updated_epoch
        FROM schemes s
        WHERE (s.updated_at > :since OR s.created_at > :since)
        ORDER BY COALESCE(s.updated_at, s.created_at) ASC
        LIMIT :limit;
    """)

    rows = db.execute(sql, {"since": since_dt, "limit": limit}).mappings().all()

    def derive_benefit_type(title, desc, tags):
        text_str = f"{title or ''} {desc or ''} {tags or ''}".lower()
        if re.search(r"\b(loan|loans|micro-credit|mudra|interest subvention|working capital|credit guarantee|overdraft|collateral-free|lending|borrower)\b", text_str):
            return "loan"
        if re.search(r"\b(subsidy|subsidized|toolkit|tablet|laptop|solar pump|e-vehicle|tractor|housing|pucca house|construction|lpg|machinery|equipment|concession|rebate|food)\b", text_str):
            return "subsidy"
        return "cash_grant"

    schemes = []
    max_epoch = since
    for r in rows:
        b_type = derive_benefit_type(r["benefit_title"], r["benefit_desc"], r["tags"])
        epoch = int(r["updated_epoch"] or 0)
        if epoch > max_epoch:
            max_epoch = epoch
        schemes.append({
            "id": int(r["id"]),
            "slug": r["slug"],
            "title": r["title"],
            "ministry": r["ministry"] or "Government of India",
            "state": r["state"],
            "category": r["category"] or "General",
            "is_central": int(r["is_central"] or 0),
            "benefit_summary": r["benefit_summary"] or "",
            "benefit_type": b_type,
            "rules_count": int(r["rules_count"] or 0),
            "docs_count": int(r["docs_count"] or 0),
            "application_url": r["application_url"],
            "description": r["description"] or "",
            "last_verified_at": str(r["last_verified_at"]),
        })

    return {
        "schemes": schemes,
        "count": len(schemes),
        "synced_version": max_epoch,
        "has_more": len(schemes) == limit,
    }


@router.get(
    "/slug/{slug}",
    response_model=SchemeDetailResponse,
    summary="Get scheme by unique slug",
    description="Returns full scheme details, benefits, eligibility rules, and required documents using a human-readable slug.",
    response_description="Scheme details",
)
def get_scheme_by_slug_endpoint(
    slug: str,
    db: Session = Depends(get_db),
):
    cached = cache_get(key_scheme_slug(slug))
    if cached is not None:
        try:
            return json.loads(cached)
        except Exception:
            pass

    scheme = get_scheme_by_slug(db=db, slug=slug)
    if not scheme:
        raise SchemeNotFoundError(slug)
    return scheme


@router.get(
    "/{scheme_id}",
    response_model=SchemeDetailResponse,
    summary="Get scheme by numeric ID",
    description="Returns complete details for a specific scheme by ID.",
    response_description="Scheme details",
)
def get_scheme_by_id_endpoint(
    scheme_id: int,
    db: Session = Depends(get_db),
):
    cached = cache_get(key_scheme_id(scheme_id))
    if cached is not None:
        try:
            return json.loads(cached)
        except Exception:
            pass

    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)
    return scheme



@router.patch(
    "/{scheme_id}",
    response_model=SchemeDetailResponse,
    summary="Update scheme details",
    description="Updates top-level fields of a scheme (name, description, status, category, tags, URLs). Requires role='admin'.",
    response_description="Updated scheme",
)
def update_scheme_endpoint(
    scheme_id: int,
    payload: SchemeUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    return update_scheme(db=db, scheme_id=scheme_id, payload=payload)


@router.delete(
    "/{scheme_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete scheme",
    description="Deletes a scheme and cascades deletion to all child relations. Requires role='admin'.",
)
def delete_scheme_endpoint(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    delete_scheme(db=db, scheme_id=scheme_id)
    return None