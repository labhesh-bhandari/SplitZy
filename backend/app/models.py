from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── User Models ────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Group Models ────────────────────────────────────────────────────────────────

class GroupMember(BaseModel):
    name: str = Field(..., min_length=1)


class GroupCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    members: List[GroupMember] = Field(..., min_length=2)


class GroupOut(BaseModel):
    id: str
    title: str
    members: List[str]
    created_by: str
    created_at: datetime
    expense_count: int = 0
    settlement_status: str = "none"  # none | calculated | stale


# ─── Expense Models ──────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    paid_by: str = Field(..., min_length=1)
    split_among: List[str] = Field(..., min_length=1)


class ExpenseUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0)
    paid_by: Optional[str] = Field(None, min_length=1)
    split_among: Optional[List[str]] = Field(None, min_length=1)


class ExpenseOut(BaseModel):
    id: str
    group_id: str
    label: str
    amount: float
    paid_by: str
    split_among: List[str]
    share_per_person: float
    created_at: datetime
    updated_at: datetime


# ─── Settlement Models ───────────────────────────────────────────────────────────

class SettlementTransaction(BaseModel):
    from_member: str
    to_member: str
    amount: float


class SettlementOut(BaseModel):
    id: str
    group_id: str
    transactions: List[SettlementTransaction]
    calculated_at: datetime
    is_stale: bool = False


# ─── Generic Response ────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
