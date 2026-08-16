from fastapi import FastAPI
from pydantic import BaseModel

from .analyzer import analyze_financial_data


app = FastAPI(
    title="FinPilot AI Analysis Service",
    description="AI-powered financial analysis service for FinPilot AI",
    version="0.1.0"
)


class FinancialData(BaseModel):
    total_expenses: float
    average_expense: float
    transaction_count: int
    category_breakdown: dict


@app.get("/")
def root():
    return {
        "message": "FinPilot AI Analysis Service is running",
        "version": "0.1.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "finpilot-ai-service"
    }


@app.post("/analyze")
def analyze(data: FinancialData):

    result = analyze_financial_data(
        total_expenses=data.total_expenses,
        average_expense=data.average_expense,
        transaction_count=data.transaction_count,
        category_breakdown=data.category_breakdown
    )

    return result