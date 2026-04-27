"""Public + authed draw endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query

from auth import get_current_user
from db import db
from draws_logic import (
    DrawAlreadyExecutedError,
    DrawInactiveError,
    InsufficientCoinsError,
    enter_draw,
    execute_draw,
)
from models import EnterDrawRequest, EnterDrawResponse, EntryPublic
from utils import serialize_doc

router = APIRouter(prefix="/draws", tags=["draws"])


def _safe_draw(doc: dict) -> dict:
    return serialize_doc(doc)


@router.get("")
async def list_draws(status: str | None = None):
    query = {}
    if status:
        query["status"] = status
    docs = await db.draws.find(query).sort("tier", 1).to_list(100)
    return [_safe_draw(d) for d in docs]


@router.get("/{draw_id}")
async def get_draw(draw_id: str):
    doc = await db.draws.find_one({"draw_id": draw_id})
    if doc is None:
        raise HTTPException(status_code=404, detail="Draw not found")
    return _safe_draw(doc)


@router.get("/{draw_id}/stats")
async def draw_stats(draw_id: str):
    from utils import current_cycle_key

    cycle = current_cycle_key(draw_id)
    total_entries = await db.entries.count_documents(
        {"draw_id": draw_id, "draw_cycle": cycle, "status": "active"}
    )
    unique_players = len(
        await db.entries.distinct(
            "user_id",
            {"draw_id": draw_id, "draw_cycle": cycle, "status": "active"},
        )
    )
    return {
        "draw_id": draw_id,
        "cycle": cycle,
        "total_entries": total_entries,
        "unique_players": unique_players,
    }


@router.post("/enter", response_model=EnterDrawResponse)
async def enter_draw_endpoint(
    payload: EnterDrawRequest, user: dict = Depends(get_current_user)
):
    try:
        entries, new_balance, jackpot_after = await enter_draw(
            user["user_id"], payload.draw_id, payload.quantity
        )
    except InsufficientCoinsError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except DrawInactiveError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return EnterDrawResponse(
        entries=[
            EntryPublic(
                entry_id=e["entry_id"],
                entry_hash=e["entry_hash"],
                draw_id=e["draw_id"],
                draw_cycle=e["draw_cycle"],
                coins_spent=e["coins_spent"],
                timestamp=e["timestamp"],
                status=e["status"],
            )
            for e in entries
        ],
        new_balance=new_balance,
        jackpot_after=jackpot_after,
    )


@router.get("/{draw_id}/results")
async def draw_results_history(draw_id: str, limit: int = 20):
    results = (
        await db.draw_results.find({"draw_id": draw_id})
        .sort("executed_at", -1)
        .to_list(limit)
    )
    return serialize_doc(results)


@router.get("/results/all")
async def all_results(
    limit: int = Query(30, ge=1, le=100), skip: int = Query(0, ge=0)
):
    cursor = (
        db.draw_results.find({}).sort("executed_at", -1).skip(skip).limit(limit)
    )
    results = await cursor.to_list(limit)
    total = await db.draw_results.count_documents({})
    return {
        "results": serialize_doc(results),
        "total": total,
        "limit": limit,
        "skip": skip,
    }


# Admin / demo helper — lets investor demos execute draws on demand.
@router.post("/admin/run/{draw_id}")
async def admin_run_draw(draw_id: str):
    try:
        result = await execute_draw(draw_id)
    except DrawAlreadyExecutedError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except DrawInactiveError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return serialize_doc(result)
