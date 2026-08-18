from pydantic import BaseModel
from datetime import date
from typing import Optional


class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None
    expense_date: date
    user_id: int


class ExpenseUpdate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None
    expense_date: date


class ExpenseResponse(BaseModel):
    id: int
    amount: float
    category: str
    description: Optional[str]
    expense_date: date
    user_id: int

    class Config:
        from_attributes = True