from pydantic import BaseModel
from typing import Optional, Dict

class Alert(BaseModel):
    alert_id: str
    timestamp: str   # ISO timestamp
    latitude: float
    longitude: float
    source: str


class AssessmentResult(BaseModel):
    alert_id: str
    severity: str
    score: int
    indicators: Dict[str, bool]
