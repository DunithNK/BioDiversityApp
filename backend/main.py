from fastapi import FastAPI
import storage
from models import Alert, AssessmentResult

app = FastAPI()


@app.post("/alert")
def create_alert(alert: Alert):
    storage.alerts[alert.alert_id] = alert.dict()
    return {"status": "saved"}


@app.post("/assessment")
def save_assessment(result: AssessmentResult):
    storage.assessments[result.alert_id] = result.dict()
    return {"status": "assessment saved"}


@app.get("/assessment/{alert_id}")
def get_assessment(alert_id: str):
    if alert_id not in storage.assessments:
        return {"error": "No assessment found"}
    return storage.assessments[alert_id]


@app.get("/alerts")
def get_alerts():
    return list(storage.alerts.values())
