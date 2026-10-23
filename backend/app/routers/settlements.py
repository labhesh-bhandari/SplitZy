from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from app.models import SettlementOut, SettlementTransaction
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/groups/{group_id}/settlements", tags=["settlements"])


async def verify_group_access(group_id: str, current_user: dict, db) -> dict:
    try:
        oid = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid group ID")
    group = await db.groups.find_one({"_id": oid, "created_by": str(current_user["_id"])})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


def calculate_optimal_settlements(balances: dict[str, float]) -> list[dict]:
    """
    Calculates minimal number of transactions to settle all debts using
    a greedy algorithm on creditors and debtors.

    Args:
        balances: dict mapping member_name -> net_balance
                  positive = they are owed money (creditor)
                  negative = they owe money (debtor)

    Returns:
        list of transactions: [{from_member, to_member, amount}]
    """
    # Separate into creditors (positive balance) and debtors (negative balance)
    creditors = []  # (amount_owed_to_them, name)
    debtors = []    # (amount_they_owe, name)

    for person, balance in balances.items():
        rounded = round(balance, 2)
        if rounded > 0.01:
            creditors.append([rounded, person])
        elif rounded < -0.01:
            debtors.append([-rounded, person])  # store as positive

    creditors.sort(reverse=True)
    debtors.sort(reverse=True)

    transactions = []

    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debt_amount, debtor = debtors[i]
        credit_amount, creditor = creditors[j]

        # The transaction amount is the min of debt and credit
        amount = min(debt_amount, credit_amount)
        amount = round(amount, 2)

        if amount > 0.01:
            transactions.append({
                "from_member": debtor,
                "to_member": creditor,
                "amount": amount,
            })

        debtors[i][0] = round(debt_amount - amount, 2)
        creditors[j][0] = round(credit_amount - amount, 2)

        if debtors[i][0] < 0.01:
            i += 1
        if creditors[j][0] < 0.01:
            j += 1

    return transactions


@router.post("", response_model=SettlementOut)
async def calculate_settlements(
    group_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    group = await verify_group_access(group_id, current_user, db)
    members = group["members"]

    # Fetch all expenses for this group
    expenses = await db.expenses.find({"group_id": group_id}).to_list(1000)

    if not expenses:
        raise HTTPException(status_code=400, detail="No expenses to settle")

    # Calculate net balances
    balances = {member: 0.0 for member in members}

    for expense in expenses:
        paid_by = expense["paid_by"]
        amount = expense["amount"]
        split_among = expense["split_among"]
        n = len(split_among)

        if n == 0:
            continue

        share = amount / n

        # Person who paid gets credited
        if paid_by in balances:
            balances[paid_by] += amount

        # Each person in split_among gets debited
        for person in split_among:
            if person in balances:
                balances[person] -= share

    # Calculate optimal minimal transactions
    transactions = calculate_optimal_settlements(balances)

    # Save or update settlement in DB
    now = datetime.now(timezone.utc)
    settlement_doc = {
        "group_id": group_id,
        "transactions": transactions,
        "calculated_at": now,
        "is_stale": False,
    }

    existing = await db.settlements.find_one({"group_id": group_id})
    if existing:
        await db.settlements.update_one(
            {"group_id": group_id},
            {"$set": settlement_doc},
        )
        settlement_doc["_id"] = existing["_id"]
    else:
        result = await db.settlements.insert_one(settlement_doc)
        settlement_doc["_id"] = result.inserted_id

    return SettlementOut(
        id=str(settlement_doc["_id"]),
        group_id=group_id,
        transactions=[SettlementTransaction(**t) for t in transactions],
        calculated_at=now,
        is_stale=False,
    )


@router.get("", response_model=SettlementOut)
async def get_settlements(
    group_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    await verify_group_access(group_id, current_user, db)

    settlement = await db.settlements.find_one({"group_id": group_id})
    if not settlement:
        raise HTTPException(status_code=404, detail="No settlement calculated yet")

    return SettlementOut(
        id=str(settlement["_id"]),
        group_id=group_id,
        transactions=[SettlementTransaction(**t) for t in settlement.get("transactions", [])],
        calculated_at=settlement["calculated_at"],
        is_stale=settlement.get("is_stale", False),
    )
