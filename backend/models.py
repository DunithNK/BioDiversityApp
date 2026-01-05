from pydantic import BaseModel

class Alert(BaseModel):
    alert_id: str
    time: str
    latitude: float
    longitude: float

class AssessmentResult(BaseModel):
    alert_id: str
    severity: str
    score: int
    indicators: dict
