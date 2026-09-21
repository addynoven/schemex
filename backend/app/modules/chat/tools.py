import logging
from pathlib import Path
import re
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from langsmith import traceable
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.schemes.models import Scheme

logger = logging.getLogger(__name__)

KNOWLEDGE_SCHEMES_DIR = Path(__file__).resolve().parents[4] / "knowledge" / "schemes"

CHAT_TOOLS_DECLARATIONS = [
    {
        "function_declarations": [
            {
                "name": "check_eligibility",
                "description": (
                    "Check which government welfare schemes a citizen qualifies for based on demographic criteria and optional sector/category. "
                    "Use this when the citizen asks what welfare schemes they qualify for or provides demographic details seeking personalized recommendations. "
                    "Pass the matching `state` (e.g. 'Uttar Pradesh', 'Goa'), `category` (e.g. 'Education', 'Agriculture'), `occupation` (e.g. 'student', 'farmer'), `age`, `annual_income`."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "category": {
                            "type": "STRING",
                            "description": "Sector/category to filter schemes by, e.g. Education, Business & Finance, Agriculture, Healthcare, Housing, Employment & Skills, Social Welfare, Women & Child.",
                        },
                        "topic": {
                            "type": "STRING",
                            "description": "Specific sub-topic or keyword to match, e.g. scholarship, tuition waiver, loan, tablet, coaching, subsidy.",
                        },
                        "state": {
                            "type": "STRING",
                            "description": "Indian state or union territory name, e.g. Uttar Pradesh, Madhya Pradesh, Goa, Maharashtra, or ALL_INDIA.",
                        },
                        "occupation": {
                            "type": "STRING",
                            "description": "Citizen occupation, e.g. student, farmer, artisan, unemployed, self-employed.",
                        },
                        "age": {
                            "type": "INTEGER",
                            "description": "Age in years.",
                        },
                        "annual_income": {
                            "type": "NUMBER",
                            "description": "Annual household income in INR.",
                        },
                        "caste_category": {
                            "type": "STRING",
                            "description": "Caste category, e.g. General, OBC, SC, ST, EWS.",
                        },
                        "gender": {
                            "type": "STRING",
                            "description": "Gender, e.g. female, male, other.",
                        },
                        "jurisdiction": {
                            "type": "STRING",
                            "enum": ["both", "central_only", "state_only"],
                            "description": "Optional scheme jurisdiction: 'both' (default: state + central), 'central_only' (central/national schemes only), or 'state_only'.",
                        },
                    },
                },
            },
            {
                "name": "search_schemes_directory",
                "description": (
                    "Search and count all available government welfare schemes in the official registry by state, category, or keyword. "
                    "Use this whenever the citizen asks how many schemes exist in total, asks for all schemes in a state or sector (e.g. 'how many schemes in UP for education', 'what schemes exist for Goa'), "
                    "or wants an honest directory count of available initiatives."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "state": {
                            "type": "STRING",
                            "description": "State or union territory, e.g. Uttar Pradesh, Madhya Pradesh, Goa, Maharashtra, or ALL_INDIA.",
                        },
                        "category": {
                            "type": "STRING",
                            "description": "Sector/category, e.g. Education, Agriculture, Healthcare, Housing, Social Welfare, Employment & Skills, Women & Child, Business & Finance.",
                        },
                        "search_query": {
                            "type": "STRING",
                            "description": "Optional keyword search term, e.g. student, scholarship, coaching, tablet, loan, farmer.",
                        },
                    },
                },
            },
            {
                "name": "get_scheme_details",
                "description": (
                    "Fetch official application procedures, required documents, and full guidelines for a SPECIFIC government scheme. "
                    "Use this when the citizen asks how to apply, what documents are needed, or wants in-depth details on a specific scheme."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "scheme_slug": {
                            "type": "STRING",
                            "description": "Canonical slug of the scheme (e.g. uttar-pradesh-post-matric-merit-scholarship, uttar-pradesh-free-digital-tablet-laptop-distribution, post-matric-scholarship, pm-kisan, ayushman-bharat-pmjay).",
                        },
                    },
                    "required": ["scheme_slug"],
                },
            },
            {
                "name": "browse_schemes_and_knowledge",
                "description": (
                    "Browse schemes with multi-field demographic/policy filters AND inspect canonical @knowledge Markdown documentation. "
                    "Use this tool to verify whether an AI recommendation is accurate by inspecting both database rules and ground-truth @knowledge Markdown files."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "search_query": {"type": "STRING", "description": "Search keyword e.g. 'farmer', 'scholarship', 'pension'"},
                        "state": {"type": "STRING", "description": "State filter e.g. 'Gujarat', 'Madhya Pradesh', 'ALL_INDIA'"},
                        "category": {"type": "STRING", "description": "Category filter e.g. 'Agriculture', 'Education', 'Healthcare'"},
                        "occupation": {"type": "STRING", "description": "Occupation e.g. 'farmer', 'student', 'unemployed'"},
                        "gender": {"type": "STRING", "description": "Gender filter e.g. 'male', 'female'"},
                        "caste_category": {"type": "STRING", "description": "Caste filter e.g. 'General', 'OBC', 'SC', 'ST'"},
                        "annual_income": {"type": "NUMBER", "description": "Annual household income in INR"},
                        "has_land": {"type": "BOOLEAN", "description": "Landholding boolean filter"},
                        "include_knowledge_md": {"type": "BOOLEAN", "description": "Set true to attach ground-truth @knowledge Markdown files"},
                    },
                },
            },
        ]
    }
]

KNOWN_SCHEME_SLUGS = {
    "pm-mudra-yojana",
    "mp-medhavi-vidyarthi-yojana",
    "pm-kisan",
    "ayushman-bharat-pmjay",
    "ab-pmjay",
    "pmay-gramin",
    "atal-pension-yojana",
    "post-matric-scholarship",
    "mp-udyam-kranti-yojana",
    "sukanya-samriddhi-yojana",
    "pm-vishwakarma",
    "ladli-behna",
}


@traceable(
    run_type="tool",
    name="search_schemes_directory",
    process_inputs=lambda d: {k: v for k, v in d.items() if k != "db"},
)
def execute_search_schemes_directory(db: Session, tool_args: dict[str, Any]) -> dict[str, Any]:
    """
    Directly queries the database schemes directory and returns the true total count and top sample highlights.
    """
    try:
        from app.modules.schemes.service import list_schemes
        state = tool_args.get("state")
        category = tool_args.get("category")
        search = tool_args.get("search_query") or tool_args.get("q")

        items, total = list_schemes(
            db=db,
            skip=0,
            limit=4,
            state=state,
            category=category,
            search=search,
            status="active",
        )

        state_param = state if state and state.upper() not in ("ALL_INDIA", "ALL-INDIA", "NATIONAL", "ALL") else ""
        cat_param = category if category and category != "All" else ""
        query_parts = []
        if state_param:
            query_parts.append(f"state={state_param}")
        if cat_param:
            query_parts.append(f"category={cat_param}")
        query_str = f"?{'&'.join(query_parts)}" if query_parts else ""

        return {
            "status": "success",
            "total_count_in_directory": total,
            "state_filtered": state or "All Jurisdictions",
            "category_filtered": category or "All Categories",
            "showing_sample_count": len(items),
            "has_more": total > len(items),
            "directory_url": f"/schemes{query_str}",
            "sample_schemes": [
                {
                    "slug": s.slug,
                    "name": s.name,
                    "state": s.state or "ALL_INDIA",
                    "jurisdiction": f"State Scheme ({s.state})" if s.state and s.state != "ALL_INDIA" else "Central / National Scheme",
                    "category": s.category or "General",
                    "summary": s.description[:100] if s.description else "Government Welfare Assistance",
                }
                for s in items
            ],
        }
    except Exception as e:
        logger.error(f"Error executing search_schemes_directory: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to search schemes registry directory.",
        }


@traceable(
    run_type="tool",
    name="check_eligibility",
    process_inputs=lambda d: {k: v for k, v in d.items() if k != "db"},
)
def execute_check_eligibility(
    db: Session, user_profile: dict[str, Any] | None, tool_args: dict[str, Any]
) -> dict[str, Any]:
    """
    Executes in-memory bitmask rule evaluation with sector/category filtering.
    Returns honest total match count while delivering the top 3-4 most relevant schemes.
    Consistently detects missing demographic fields for dynamic interactive form collection.
    """
    try:
        if not bitmask_engine.is_warmed or len(bitmask_engine.scheme_ids) == 0:
            bitmask_engine.warm_up(db)

        # Layer 1: Start with user profile context if available
        eval_profile: dict[str, Any] = {}
        if user_profile:
            eval_profile.update({k: v for k, v in user_profile.items() if v is not None})

        # Layer 2: Explicit search tool arguments take precedence for query-specific filters (e.g. searching Gujarat schemes)
        for k in ["state", "occupation", "age", "annual_income", "caste_category", "gender", "jurisdiction"]:
            arg_val = tool_args.get(k)
            if arg_val is not None:
                if isinstance(arg_val, str) and arg_val.strip() != "":
                    eval_profile[k] = arg_val.strip()
                elif isinstance(arg_val, (int, float)):
                    eval_profile[k] = arg_val

        # Identify scheme-dependent missing fields based on active candidate rules
        candidate_fields = set()
        if bitmask_engine.is_warmed:
            if bitmask_engine.caste_masks:
                candidate_fields.add("caste_category")
            if bitmask_engine.gender_masks:
                candidate_fields.add("gender")
            if bitmask_engine.occupation_masks:
                candidate_fields.add("occupation")
            if bitmask_engine.numeric_rules:
                for nr in bitmask_engine.numeric_rules:
                    candidate_fields.add(nr["field"])
            if bitmask_engine.state_masks:
                candidate_fields.add("state")

        standard_order = ["occupation", "annual_income", "age", "caste_category", "gender", "state"]
        missing_fields = [
            f for f in standard_order
            if f in candidate_fields and (eval_profile.get(f) is None or str(eval_profile.get(f)).strip() == "")
        ]

        # Run conservative bitmask evaluation with diagnostics
        eval_res = bitmask_engine.evaluate(eval_profile, include_diagnostics=True)
        if isinstance(eval_res, tuple):
            matches, diagnostics = eval_res
        else:
            matches, diagnostics = eval_res, {}

        # Filter by requested category or topic if specified
        target_category = str(tool_args.get("category", "")).strip().lower()
        target_topic = str(tool_args.get("topic", "")).strip().lower()

        if target_category or target_topic:
            filtered_matches = []
            for m in matches:
                m_cat = str(m.get("category", "")).lower()
                m_name = str(m.get("name", "")).lower()
                m_desc = str(m.get("benefit_title", "")).lower()
                m_slug = str(m.get("slug", "")).lower()

                cat_matched = target_category and (target_category in m_cat or m_cat in target_category)
                topic_matched = target_topic and (
                    target_topic in m_name or target_topic in m_desc or target_topic in m_slug or target_topic in m_cat
                )

                if cat_matched or topic_matched:
                    filtered_matches.append(m)

            matches = filtered_matches

        target_state = str(eval_profile.get("state", "")).strip()
        is_specific_state = target_state and target_state.upper() not in ("ALL_INDIA", "ALL-INDIA", "NATIONAL", "ALL")

        state_specific = []
        national = []
        if is_specific_state:
            state_specific = [
                m for m in matches
                if m.get("state", "").lower() == target_state.lower() or target_state.lower() in m.get("state", "").lower()
            ]
            national = [
                m for m in matches
                if m.get("state") in ("ALL_INDIA", "All-India", "National") or not m.get("state")
            ]
            selected_matches = state_specific + national
        else:
            selected_matches = matches

        total_matched = len(selected_matches)

        # Truncate to top 3 items for clean chat delivery
        top_schemes = selected_matches[:3]

        compact_results = []
        for m in top_schemes:
            m_state = m.get("state") or "ALL_INDIA"
            is_national = m_state in ("ALL_INDIA", "All-India", "National")
            jurisdiction = "Central / National Scheme" if is_national else f"State Scheme ({m_state})"
            compact_results.append({
                "slug": m.get("slug"),
                "name": m.get("name"),
                "category": m.get("category", "General"),
                "state": m_state,
                "jurisdiction": jurisdiction,
                "summary_benefit": m.get("benefit_title") or m.get("description", "")[:100],
            })

        # Classify zero match state: Gating-induced lack of facts vs genuine ineligibility
        zero_reason = None
        elim_breakdown = diagnostics.get("elimination_by_field", {})

        if total_matched == 0:
            provided_fields = [
                f for f in ["annual_income", "age", "occupation", "gender", "caste_category"]
                if eval_profile.get(f) is not None and str(eval_profile.get(f)).strip() != ""
            ]
            provided_failures = {
                f: elim_breakdown.get(f, 0)
                for f in provided_fields
                if elim_breakdown.get(f, 0) > 0
            }

            unset_gating_fields = [
                f for f in ["occupation", "annual_income", "age", "state"]
                if eval_profile.get(f) is None or str(eval_profile.get(f)).strip() == ""
            ]
            unset_eliminations = {
                f: elim_breakdown.get(f, 0)
                for f in unset_gating_fields
                if elim_breakdown.get(f, 0) > 0
            }

            # If user provided a field that directly disqualified them (e.g. high annual_income or age limit):
            if provided_failures and ("annual_income" in provided_failures or "age" in provided_failures):
                zero_reason = "GENUINELY_INELIGIBLE"
                message = "No schemes matched your specific profile criteria under current government guidelines."
            elif unset_eliminations:
                top_unset_field = max(unset_eliminations, key=unset_eliminations.get)
                zero_reason = "INSUFFICIENT_GATING_FACTS"
                field_labels = {
                    "annual_income": "annual income",
                    "occupation": "occupation / employment status",
                    "age": "age",
                    "state": "state of residence",
                }
                friendly_name = field_labels.get(top_unset_field, top_unset_field)
                state_str = f" in {target_state}" if is_specific_state else ""
                message = (
                    f"No schemes could be confirmed because most welfare initiatives{state_str} require your {friendly_name}. "
                    f"Please share your {friendly_name} to unlock matching programs."
                )
            elif unset_gating_fields and len(unset_gating_fields) >= 3:
                zero_reason = "INSUFFICIENT_GATING_FACTS"
                message = "No schemes could be confirmed with the limited details provided. Please share your occupation or annual income to check eligibility."
            else:
                zero_reason = "GENUINELY_INELIGIBLE"
                message = "No schemes matched your specific profile criteria under current government guidelines."
        else:
            message = f"Found {total_matched} matching schemes."

        return {
            "status": "success",
            "total_matched_count": total_matched,
            "state_specific_count": len(state_specific),
            "national_count": len(national) if is_specific_state else total_matched,
            "showing_count": len(compact_results),
            "schemes": compact_results,
            "missing_fields": missing_fields,
            "zero_reason": zero_reason,
            "elimination_breakdown": elim_breakdown,
            "has_more": total_matched > len(compact_results),
            "directory_url": f"/schemes?state={target_state}" if is_specific_state else "/schemes",
            "message": message,
        }
    except Exception as e:
        logger.error(f"Error executing check_eligibility: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to evaluate scheme eligibility criteria. Please try again.",
        }


@traceable(
    run_type="tool",
    name="get_scheme_details",
    process_inputs=lambda d: {k: v for k, v in d.items() if k != "db"},
)
def execute_get_scheme_details(db: Session, tool_args: dict[str, Any]) -> dict[str, Any]:
    """
    Fetches canonical markdown scheme documentation or database records with strict slug sanitization.
    """
    try:
        raw_slug = str(
            tool_args.get("scheme_slug")
            or tool_args.get("scheme_name")
            or tool_args.get("slug")
            or tool_args.get("name")
            or ""
        ).strip().lower()
        if raw_slug == "ab-pmjay":
            raw_slug = "ayushman-bharat-pmjay"

        # Sanitize spaces to dashes for slug normalization
        slug = re.sub(r"[^a-z0-9\-\s]", "", raw_slug).strip().replace(" ", "-")
        # Remove consecutive dashes
        slug = re.sub(r"-+", "-", slug)
        if not slug:
            return {"status": "not_found", "message": "No scheme slug or name specified."}

        # 1. Exact markdown file lookup
        if KNOWLEDGE_SCHEMES_DIR.exists():
            direct_path = KNOWLEDGE_SCHEMES_DIR / f"{slug}.md"
            if direct_path.exists():
                content = direct_path.read_text(encoding="utf-8")
                return {
                    "status": "success",
                    "slug": slug,
                    "content": content[:1400],
                }

            # Check state subdirectories for exact slug match
            exact_match_file = next(KNOWLEDGE_SCHEMES_DIR.glob(f"**/{slug}.md"), None)
            if exact_match_file and exact_match_file.exists():
                content = exact_match_file.read_text(encoding="utf-8")
                return {
                    "status": "success",
                    "slug": slug,
                    "content": content[:1400],
                }

        # 2. Database Record Lookup
        db_scheme = db.scalar(
            select(Scheme).where(Scheme.slug == slug)
        )
        if not db_scheme:
            from sqlalchemy import or_, and_
            clean_name = slug.replace("-", " ")
            db_scheme = db.scalar(
                select(Scheme).where(
                    or_(
                        Scheme.slug.ilike(f"%{slug}%"),
                        Scheme.name.ilike(f"%{clean_name}%"),
                    )
                )
            )

        if not db_scheme:
            from sqlalchemy import or_, and_
            state_abbrs = {
                "up": "uttar-pradesh", "mp": "madhya-pradesh", "mh": "maharashtra",
                "tn": "tamil-nadu", "rj": "rajasthan", "ap": "andhra-pradesh",
            }
            tokens = [t for t in re.findall(r"[a-z0-9]+", raw_slug.lower())]
            expanded = []
            for t in tokens:
                if t in state_abbrs:
                    expanded.extend(state_abbrs[t].split("-"))
                elif len(t) >= 3 and t not in {"the", "for", "and", "scheme", "yojana", "subsidies", "subsidy", "grant", "assistance"}:
                    expanded.append(t)

            if expanded:
                word_conds = [or_(Scheme.name.ilike(f"%{w}%"), Scheme.slug.ilike(f"%{w}%")) for w in expanded]
                db_scheme = db.scalar(select(Scheme).where(and_(*word_conds)))

        if db_scheme:
            return {
                "status": "success",
                "slug": db_scheme.slug,
                "name": db_scheme.name,
                "state": db_scheme.state,
                "category": db_scheme.category,
                "description": db_scheme.description,
                "application_url": db_scheme.application_url,
            }

        return {"status": "not_found", "message": f"Documentation for scheme '{slug}' is currently unavailable."}
    except Exception as e:
        logger.error(f"Error executing get_scheme_details: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to retrieve scheme details due to an internal error.",
        }


@traceable(
    run_type="tool",
    name="browse_schemes_and_knowledge",
    process_inputs=lambda d: {k: v for k, v in d.items() if k != "db"},
)
def execute_browse_schemes_and_knowledge(db: Session, tool_args: dict[str, Any]) -> dict[str, Any]:
    """
    Browses scheme directory with multi-field demographic/policy filters AND inspects canonical @knowledge Markdown documentation.
    """
    try:
        from app.modules.schemes.service import browse_schemes_with_filters

        search = tool_args.get("search_query") or tool_args.get("q")
        state = tool_args.get("state")
        category = tool_args.get("category")
        occupation = tool_args.get("occupation")
        gender = tool_args.get("gender")
        caste_category = tool_args.get("caste_category")
        annual_income = tool_args.get("annual_income")
        has_land = tool_args.get("has_land")
        include_knowledge_md = tool_args.get("include_knowledge_md", True)

        items, total, filters_applied = browse_schemes_with_filters(
            db=db,
            skip=0,
            limit=5,
            search=search,
            state=state,
            category=category,
            occupation=occupation,
            gender=gender,
            caste_category=caste_category,
            annual_income=float(annual_income) if annual_income is not None else None,
            has_land=has_land,
            include_knowledge_md=include_knowledge_md,
        )

        compact_schemes = []
        for s in items:
            compact_schemes.append({
                "slug": s["slug"],
                "name": s["name"],
                "state": s["state"],
                "category": s["category"],
                "ministry": s["ministry"],
                "application_url": s["application_url"],
                "verification_status": s["verification_status"],
                "has_knowledge_md": bool(s.get("knowledge_md")),
                "knowledge_md_snippet": s["knowledge_md"][:350] if s.get("knowledge_md") else None,
            })

        return {
            "status": "success",
            "total_count": total,
            "filters_applied": filters_applied,
            "showing_count": len(compact_schemes),
            "schemes": compact_schemes,
        }
    except Exception as e:
        logger.error(f"Error executing browse_schemes_and_knowledge: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to browse schemes registry with @knowledge inspection.",
        }


# ============================================================================
# LANGGRAPH TOOL DEFINITIONS
# ============================================================================
from langchain_core.tools import tool


@tool("check_eligibility")
def tool_check_eligibility(
    category: str | None = None,
    topic: str | None = None,
    state: str | None = None,
    occupation: str | None = None,
    age: int | None = None,
    annual_income: float | None = None,
    caste_category: str | None = None,
    gender: str | None = None,
    jurisdiction: str = "both",
) -> str:
    """Check which government welfare schemes a citizen qualifies for based on demographic criteria and optional sector/category. Pass state (e.g. 'Uttar Pradesh', 'Goa'), category (e.g. 'Education', 'Agriculture'), occupation (e.g. 'student', 'farmer'), age, annual_income."""
    return "executed"


@tool("search_schemes_directory")
def tool_search_schemes_directory(
    state: str | None = None,
    category: str | None = None,
    search_query: str | None = None,
) -> str:
    """Directly queries the database schemes directory and returns the true total count and top sample highlights."""
    return "executed"


@tool("get_scheme_details")
def tool_get_scheme_details(
    scheme_slug: str,
) -> str:
    """Fetches canonical markdown scheme documentation or database records for a specific scheme slug."""
    return "executed"


@tool("browse_schemes_and_knowledge")
def tool_browse_schemes_and_knowledge(
    search_query: str | None = None,
    state: str | None = None,
    category: str | None = None,
    occupation: str | None = None,
    gender: str | None = None,
    caste_category: str | None = None,
    annual_income: float | None = None,
    has_land: bool | None = None,
    include_knowledge_md: bool = True,
) -> str:
    """Browses scheme directory with multi-field demographic/policy filters AND inspects canonical @knowledge Markdown documentation."""
    return "executed"


LANGGRAPH_TOOLS = [
    tool_check_eligibility,
    tool_search_schemes_directory,
    tool_get_scheme_details,
    tool_browse_schemes_and_knowledge,
]

