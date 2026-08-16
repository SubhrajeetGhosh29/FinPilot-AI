from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db

from .routers.expenses import router as expenses_router
from .routers.users import router as users_router
from .routers.analytics import router as analytics_router
from .routers.insights import router as insights_router


# ---------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------

app = FastAPI(
    title="FinPilot AI API",
    description="Backend API for the FinPilot AI financial wellness platform",
    version="0.1.0"
)


# ---------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------
# Allows the FinPilot frontend running on port 5500
# to communicate with the FastAPI backend on port 8000.
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ---------------------------------------------------------
# Register API Routers
# ---------------------------------------------------------

app.include_router(expenses_router)
app.include_router(users_router)
app.include_router(analytics_router)
app.include_router(insights_router)


# ---------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "FinPilot AI API is running",
        "version": "0.1.0"
    }


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "finpilot-backend"
    }


# ---------------------------------------------------------
# Database Connection Test
# ---------------------------------------------------------

@app.get("/db-test")
def database_test(
    db: Session = Depends(get_db)
):

    return {
        "status": "connected",
        "database": "PostgreSQL",
        "message": "FinPilot AI database connection is working"
    }