from fastapi import FastAPI

app = FastAPI(
    title="FinPilot AI API",
    description="Backend API for the FinPilot AI financial wellness platform",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "message": "FinPilot AI API is running",
        "version": "0.1.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "finpilot-backend"
    }