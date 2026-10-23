from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from app.models import ExpenseCreate, ExpenseUpdate, ExpenseOut
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/groups/{group_id}/expenses", tags=["expenses"])


async def verify_group_access(group_id: str, current_user: dict, db) -> dict:
    try:
        oid = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid group ID")

    group = await db.groups.find_one({"_id": oid, "created_by": str(current_user["_id"])})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


async def mark_settlement_stale(group_id: str, db):
    """Mark the settlement as stale when expenses are modified."""
    await db.settlements.update_one(
        {"group_id": group_id},
        {"$set": {"is_stale": True}},
    )


def serialize_expense(exp: dict) -> ExpenseOut:
    split_count = len(exp["split_among"])
    share = round(exp["amount"] / split_count, 2) if split_count > 0 else 0
    return ExpenseOut(
        id=str(exp["_id"]),
        group_id=exp["group_id"],
        label=exp["label"],
        amount=exp["amount"],
        paid_by=exp["paid_by"],
        split_among=exp["split_among"],
        share_per_person=share,
        created_at=exp["created_at"],
        updated_at=exp["updated_at"],
    )


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def add_expense(
    group_id: str,
    expense_data: ExpenseCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    group = await verify_group_access(group_id, current_user, db)

    # Validate paid_by and split_among are valid group members
    members = group["members"]
    if expense_data.paid_by not in members:
        raise HTTPException(
            status_code=400,
            detail=f"'{expense_data.paid_by}' is not a member of this group",
        )
    for m in expense_data.split_among:
        if m not in members:
            raise HTTPException(
                status_code=400,
                detail=f"'{m}' is not a member of this group",
            )

    now = datetime.now(timezone.utc)
    expense_doc = {
        "group_id": group_id,
        "label": expense_data.label.strip(),
        "amount": expense_data.amount,
        "paid_by": expense_data.paid_by,
        "split_among": expense_data.split_among,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.expenses.insert_one(expense_doc)
    expense_doc["_id"] = result.inserted_id

    # Mark settlement stale
    await mark_settlement_stale(group_id, db)

    return serialize_expense(expense_doc)


@router.get("", response_model=List[ExpenseOut])
async def get_expenses(
    group_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_group_access(group_id, current_user, db)
    expenses = await db.expenses.find({"group_id": group_id}).sort("created_at", 1).to_list(500)
    return [serialize_expense(e) for e in expenses]


@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    group_id: str,
    expense_id: str,
    expense_data: ExpenseUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    group = await verify_group_access(group_id, current_user, db)

    try:
        exp_oid = ObjectId(expense_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid expense ID")

    expense = await db.expenses.find_one({"_id": exp_oid, "group_id": group_id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    members = group["members"]
    update_data = {}

    if expense_data.label is not None:
        update_data["label"] = expense_data.label.strip()
    if expense_data.amount is not None:
        update_data["amount"] = expense_data.amount
    if expense_data.paid_by is not None:
        if expense_data.paid_by not in members:
            raise HTTPException(status_code=400, detail=f"'{expense_data.paid_by}' is not a group member")
        update_data["paid_by"] = expense_data.paid_by
    if expense_data.split_among is not None:
        for m in expense_data.split_among:
            if m not in members:
                raise HTTPException(status_code=400, detail=f"'{m}' is not a group member")
        update_data["split_among"] = expense_data.split_among

    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.expenses.update_one({"_id": exp_oid}, {"$set": update_data})
    updated = await db.expenses.find_one({"_id": exp_oid})

    # Mark settlement stale
    await mark_settlement_stale(group_id, db)

    return serialize_expense(updated)


@router.delete("/{expense_id}")
async def delete_expense(
    group_id: str,
    expense_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_group_access(group_id, current_user, db)

    try:
        exp_oid = ObjectId(expense_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid expense ID")

    expense = await db.expenses.find_one({"_id": exp_oid, "group_id": group_id})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    await db.expenses.delete_one({"_id": exp_oid})

    # Mark settlement stale
    await mark_settlement_stale(group_id, db)

    return {"message": "Expense deleted successfully"}
