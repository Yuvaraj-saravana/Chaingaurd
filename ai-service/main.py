"""
CHAINGUARD AI Anomaly Detection Service
FastAPI entry point for examination access log analysis
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

app = FastAPI(
    title="CHAINGUARD AI Anomaly Engine",
    description="Explainable anomaly detection microservice for examination access logs using Isolation Forest",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "CHAINGUARD AI Anomaly Engine",
        "status": "ONLINE",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    model_path = os.path.join(os.path.dirname(__file__), "models", "isolation_forest.pkl")
    return {
        "status": "HEALTHY",
        "service": "ai-service",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model_loaded": os.path.exists(model_path),
        "engine": "Isolation Forest (scikit-learn)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
