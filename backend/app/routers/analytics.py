from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Expense


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/user/{user_id}")
def get_user_analytics(
    user_id: int,
    db: Session = Depends(get_db)
):
    # ---------------------------------------------------------
    # 1. Check whether user exists
    # ---------------------------------------------------------

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ---------------------------------------------------------
    # 2. Get all expenses for this user
    # ---------------------------------------------------------

    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .all()
    )

    # ---------------------------------------------------------
    # 3. Return empty analytics if no expenses exist
    # ---------------------------------------------------------

    if not expenses:
        return {
            "user_id": user_id,
            "user_name": user.name,
            "total_expenses": 0,
            "average_expense": 0,
            "transaction_count": 0,
            "largest_expense": 0,
            "largest_expense_category": None,
            "category_breakdown": {},
            "category_percentage": {},
            "highest_category": None,
            "monthly_breakdown": {},
            "financial_summary": "No expenses recorded yet."
        }

    # ---------------------------------------------------------
    # 4. Basic calculations
    # ---------------------------------------------------------

    total_expenses = sum(
        float(expense.amount)
        for expense in expenses
    )

    transaction_count = len(expenses)

    average_expense = (
        total_expenses / transaction_count
    )

    # ---------------------------------------------------------
    # 5. Find largest expense
    # ---------------------------------------------------------

    largest_expense = max(
        expenses,
        key=lambda expense: float(expense.amount)
    )

    largest_expense_amount = float(
        largest_expense.amount
    )

    largest_expense_category = (
        largest_expense.category
    )

    # ---------------------------------------------------------
    # 6. Category-wise spending
    # ---------------------------------------------------------

    category_breakdown = {}

    for expense in expenses:

        category = expense.category or "Other"

        amount = float(expense.amount)

        if category not in category_breakdown:
            category_breakdown[category] = 0

        category_breakdown[category] += amount

    # Round category amounts
    category_breakdown = {
        category: round(amount, 2)
        for category, amount in category_breakdown.items()
    }

    # ---------------------------------------------------------
    # 7. Category percentages
    # ---------------------------------------------------------

    category_percentage = {}

    for category, amount in category_breakdown.items():

        percentage = (
            amount / total_expenses
        ) * 100

        category_percentage[category] = round(
            percentage,
            2
        )

    # ---------------------------------------------------------
    # 8. Highest spending category
    # ---------------------------------------------------------

    highest_category = max(
        category_breakdown,
        key=category_breakdown.get
    )

    # ---------------------------------------------------------
    # 9. Monthly spending
    # ---------------------------------------------------------

    monthly_breakdown = {}

    for expense in expenses:

        if expense.expense_date:

            month = expense.expense_date.strftime(
                "%Y-%m"
            )

        else:

            month = "Unknown"

        amount = float(expense.amount)

        if month not in monthly_breakdown:
            monthly_breakdown[month] = 0

        monthly_breakdown[month] += amount

    monthly_breakdown = {
        month: round(amount, 2)
        for month, amount in monthly_breakdown.items()
    }

    # ---------------------------------------------------------
    # 10. Generate basic financial summary
    # ---------------------------------------------------------

    financial_summary = (
        f"{user.name} has spent "
        f"₹{total_expenses:.2f} across "
        f"{transaction_count} transactions. "
        f"The highest spending category is "
        f"{highest_category}, accounting for "
        f"{category_percentage[highest_category]:.2f}% "
        f"of total expenses."
    )

    # ---------------------------------------------------------
    # 11. Return analytics
    # ---------------------------------------------------------

    return {
        "user_id": user_id,
        "user_name": user.name,

        "total_expenses": round(
            total_expenses,
            2
        ),

        "average_expense": round(
            average_expense,
            2
        ),

        "transaction_count": transaction_count,

        "largest_expense": round(
            largest_expense_amount,
            2
        ),

        "largest_expense_category":
            largest_expense_category,

        "category_breakdown":
            category_breakdown,

        "category_percentage":
            category_percentage,

        "highest_category":
            highest_category,

        "monthly_breakdown":
            monthly_breakdown,

        "financial_summary":
            financial_summary
    }