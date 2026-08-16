from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from ..database import get_db
from ..models import User, Expense


router = APIRouter(
    prefix="/insights",
    tags=["Insights"]
)


# ---------------------------------------------------------
# AI Analysis Service
# ---------------------------------------------------------

AI_SERVICE_URL = "http://127.0.0.1:8001/analyze"


@router.get("/user/{user_id}")
def get_user_insights(
    user_id: int,
    db: Session = Depends(get_db)
):
    # ---------------------------------------------------------
    # 1. Check whether user exists
    # ---------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ---------------------------------------------------------
    # 2. Get user's expenses
    # ---------------------------------------------------------

    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .all()
    )

    # ---------------------------------------------------------
    # 3. No expense data
    # ---------------------------------------------------------

    if not expenses:
        return {
            "user_id": user_id,
            "user_name": user.name,
            "financial_status": "INSUFFICIENT_DATA",
            "risk_level": "UNKNOWN",
            "transaction_count": 0,
            "total_expenses": 0,
            "average_expense": 0,
            "highest_category": None,
            "highest_category_amount": 0,
            "highest_category_percentage": 0,
            "largest_expense": 0,
            "insights": [
                "No expense data is available yet."
            ],
            "recommendations": [
                "Start recording your daily expenses.",
                "Add expenses regularly so FinPilot can identify meaningful spending patterns."
            ],
            "ai_analysis": None
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
    # 5. Category analysis
    # ---------------------------------------------------------

    category_totals = {}

    for expense in expenses:

        category = expense.category or "Other"

        amount = float(expense.amount)

        if category not in category_totals:
            category_totals[category] = 0

        category_totals[category] += amount

    highest_category = max(
        category_totals,
        key=category_totals.get
    )

    highest_category_amount = (
        category_totals[highest_category]
    )

    highest_category_percentage = (
        highest_category_amount
        / total_expenses
    ) * 100

    # ---------------------------------------------------------
    # 6. Largest individual expense
    # ---------------------------------------------------------

    largest_expense = max(
        expenses,
        key=lambda expense: float(expense.amount)
    )

    largest_expense_amount = float(
        largest_expense.amount
    )

    # ---------------------------------------------------------
    # 7. Spending concentration
    # ---------------------------------------------------------

    if highest_category_percentage >= 70:
        concentration = "VERY_HIGH"

    elif highest_category_percentage >= 50:
        concentration = "HIGH"

    elif highest_category_percentage >= 30:
        concentration = "MODERATE"

    else:
        concentration = "LOW"

    # ---------------------------------------------------------
    # 8. Basic risk level
    # ---------------------------------------------------------

    if transaction_count < 3:

        risk_level = "UNKNOWN"

    elif highest_category_percentage >= 80:

        risk_level = "HIGH"

    elif highest_category_percentage >= 60:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"

    # ---------------------------------------------------------
    # 9. Local insights
    # ---------------------------------------------------------

    insights = []

    insights.append(
        f"You have recorded {transaction_count} "
        f"transactions totaling "
        f"₹{total_expenses:.2f}."
    )

    insights.append(
        f"Your average recorded expense is "
        f"₹{average_expense:.2f}."
    )

    insights.append(
        f"{highest_category} is your highest "
        f"spending category."
    )

    insights.append(
        f"{highest_category} represents "
        f"{highest_category_percentage:.2f}% "
        f"of your recorded expenses."
    )

    if largest_expense_amount > average_expense:

        insights.append(
            f"Your largest recorded expense was "
            f"₹{largest_expense_amount:.2f}, "
            f"which is above your average expense."
        )

    # ---------------------------------------------------------
    # 10. Local recommendations
    # ---------------------------------------------------------

    recommendations = []

    if transaction_count < 5:

        recommendations.append(
            "Continue recording expenses regularly "
            "so FinPilot can identify reliable "
            "spending patterns."
        )

    if highest_category_percentage >= 70:

        recommendations.append(
            f"Consider reviewing your "
            f"{highest_category} expenses because "
            f"they make up a large portion of your "
            f"recorded spending."
        )

    elif highest_category_percentage >= 50:

        recommendations.append(
            f"Keep an eye on your "
            f"{highest_category} spending and "
            f"consider setting a category budget."
        )

    else:

        recommendations.append(
            "Your spending is relatively distributed "
            "across categories. Continue tracking "
            "your expenses."
        )

    if largest_expense_amount > average_expense * 2:

        recommendations.append(
            "Review unusually large transactions "
            "before making similar purchases again."
        )

    recommendations.append(
        "Use FinPilot's financial insights regularly "
        "to understand how your spending changes over time."
    )

    # ---------------------------------------------------------
    # 11. Basic financial status
    # ---------------------------------------------------------

    if transaction_count < 3:

        financial_status = "INSUFFICIENT_DATA"

    elif concentration == "VERY_HIGH":

        financial_status = "NEEDS_ATTENTION"

    elif concentration == "HIGH":

        financial_status = "WATCH"

    else:

        financial_status = "STABLE"

    # ---------------------------------------------------------
    # 12. Prepare data for AI service
    # ---------------------------------------------------------

    ai_payload = {
        "total_expenses": round(total_expenses, 2),
        "average_expense": round(average_expense, 2),
        "transaction_count": transaction_count,
        "category_breakdown": {
            category: round(amount, 2)
            for category, amount in category_totals.items()
        }
    }

    # ---------------------------------------------------------
    # 13. Call AI Analysis Service
    # ---------------------------------------------------------

    ai_analysis = None
    ai_service_status = "unavailable"

    try:

        with httpx.Client(timeout=10.0) as client:

            response = client.post(
                AI_SERVICE_URL,
                json=ai_payload
            )

            response.raise_for_status()

            ai_analysis = response.json()

            ai_service_status = "connected"

    except httpx.RequestError:

        ai_service_status = "unavailable"

    except httpx.HTTPStatusError:

        ai_service_status = "error"

    # ---------------------------------------------------------
    # 14. Return final FinPilot response
    # ---------------------------------------------------------

    return {
        "user_id": user_id,

        "user_name": user.name,

        "financial_status":
            financial_status,

        "risk_level":
            risk_level,

        "transaction_count":
            transaction_count,

        "total_expenses":
            round(total_expenses, 2),

        "average_expense":
            round(average_expense, 2),

        "highest_category":
            highest_category,

        "highest_category_amount":
            round(highest_category_amount, 2),

        "highest_category_percentage":
            round(highest_category_percentage, 2),

        "largest_expense":
            round(largest_expense_amount, 2),

        "category_breakdown": {
            category: round(amount, 2)
            for category, amount in category_totals.items()
        },

        "insights":
            insights,

        "recommendations":
            recommendations,

        "ai_service_status":
            ai_service_status,

        "ai_analysis":
            ai_analysis
    }