from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Expense
from ..schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate
)


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db)
):
    from ..models import User

    user = db.query(User).filter(
        User.id == expense.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    new_expense = Expense(
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        expense_date=expense.expense_date,
        user_id=expense.user_id
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db)
):
    return db.query(Expense).all()


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return expense


@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse
)
def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    expense.amount = expense_data.amount
    expense.category = expense_data.category
    expense.description = expense_data.description
    expense.expense_date = expense_data.expense_date

    db.commit()
    db.refresh(expense)

    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully"
    }