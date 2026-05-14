"""FastAPI demo API for the Climate Risk Intelligence reference stack."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Climate Risk Intelligence API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str


class RiskSummary(BaseModel):
    composite_score: int
    flood_pct: float
    air_operational_pct: float
    other_pct: float


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="climate-risk-api")


@app.get("/api/summary/consumer", response_model=RiskSummary)
def consumer_summary() -> RiskSummary:
    """Demo payload aligned with the consumer dashboard doughnut chart."""
    return RiskSummary(
        composite_score=74,
        flood_pct=35.0,
        air_operational_pct=30.0,
        other_pct=35.0,
    )


@app.get("/api/summary/business")
def business_summary() -> dict:
    """Demo institutional metrics for future UI binding."""
    return {
        "risk_tier": "Critical",
        "properties_at_risk_pct": 42.5,
        "flood_zone_pct": 18.2,
        "infra_stress_score": 7.8,
        "rate_increase_5y_pct": 114,
        "carriers_reducing": {"count": 12, "of": 18},
    }
