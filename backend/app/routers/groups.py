from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from app.models import GroupCreate, GroupOut
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/groups", tags=["groups"])


def serialize_group(group: dict, expense_count: int = 0, settlement_status: str = "none") -> GroupOut:
    return GroupOut(
        id=str(group["_id"]),
        title=group["title"],
        members=[m for m in group["members"]],
        created_by=group["created_by"],
        created_at=group["created_at"],
        expense_count=expense_count,
        settlement_status=settlement_status,
    )


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    now = datetime.now(timezone.utc)
    group_doc = {
        "title": group_data.title.strip(),
        "members": [m.name.strip() for m in group_data.members],
        "created_by": str(current_user["_id"]),
        "created_at": now,
        "updated_at": now,
    }
    result = await db.groups.insert_one(group_doc)
    group_doc["_id"] = result.inserted_id
    return serialize_group(group_doc)


@router.get("", response_model=List[GroupOut])
async def get_groups(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = str(current_user["_id"])
    groups = await db.groups.find({"created_by": user_id}).sort("created_at", -1).to_list(100)

    result = []
    for group in groups:
        gid = str(group["_id"])
        expense_count = await db.expenses.count_documents({"group_id": gid})

        # Determine settlement status
        settlement = await db.settlements.find_one({"group_id": gid})
        if not settlement:
            s_status = "none"
        elif settlement.get("is_stale"):
            s_status = "stale"
        else:
            s_status = "calculated"

        result.append(serialize_group(group, expense_count, s_status))

    return result


@router.get("/{group_id}", response_model=GroupOut)
async def get_group(
    group_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid group ID")

    group = await db.groups.find_one({"_id": oid, "created_by": str(current_user["_id"])})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    expense_count = await db.expenses.count_documents({"group_id": group_id})
    settlement = await db.settlements.find_one({"group_id": group_id})

    if not settlement:
        s_status = "none"
    elif settlement.get("is_stale"):
        s_status = "stale"
    else:
        s_status = "calculated"

    return serialize_group(group, expense_count, s_status)


@router.delete("/{group_id}")
async def delete_group(
    group_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid group ID")

    group = await db.groups.find_one({"_id": oid, "created_by": str(current_user["_id"])})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    await db.groups.delete_one({"_id": oid})
    await db.expenses.delete_many({"group_id": group_id})
    await db.settlements.delete_many({"group_id": group_id})

    return {"message": "Group deleted successfully"}
