def analyze_financial_data(
    total_expenses: float,
    average_expense: float,
    transaction_count: int,
    category_breakdown: dict
):
    if transaction_count == 0:
        return {
            "financial_status": "INSUFFICIENT_DATA",
            "risk_level": "UNKNOWN",
            "insights": [
                "Not enough expense data available for analysis."
            ],
            "recommendations": [
                "Start recording your expenses regularly."
            ]
        }

    # Find highest spending category
    highest_category = max(
        category_breakdown,
        key=category_breakdown.get
    )

    highest_amount = category_breakdown[highest_category]

    # Calculate percentage
    highest_percentage = (
        highest_amount / total_expenses * 100
        if total_expenses > 0
        else 0
    )

    # Determine financial risk
    if highest_percentage >= 60:
        risk_level = "HIGH"
        financial_status = "NEEDS_ATTENTION"
    elif highest_percentage >= 40:
        risk_level = "MEDIUM"
        financial_status = "MODERATE"
    else:
        risk_level = "LOW"
        financial_status = "HEALTHY"

    insights = [
        f"Your total spending is ₹{total_expenses:.2f}.",
        f"You have recorded {transaction_count} transactions.",
        f"Your highest spending category is {highest_category}.",
        f"{highest_category} accounts for {highest_percentage:.1f}% of your total spending."
    ]

    recommendations = []

    if highest_percentage >= 50:
        recommendations.append(
            f"Consider reducing your spending in the {highest_category} category."
        )

    if average_expense > 1000:
        recommendations.append(
            "Your average transaction is relatively high. Consider reviewing large expenses."
        )

    if transaction_count < 5:
        recommendations.append(
            "Continue recording expenses to improve the accuracy of your financial analysis."
        )

    if not recommendations:
        recommendations.append(
            "Your spending pattern looks reasonably balanced. Continue monitoring your expenses."
        )

    return {
        "financial_status": financial_status,
        "risk_level": risk_level,
        "highest_category": highest_category,
        "highest_category_percentage": round(highest_percentage, 2),
        "insights": insights,
        "recommendations": recommendations
    }