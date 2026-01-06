from fastapi import FastAPI
from storage import alerts, assessments
from models import Alert, AssessmentResult

app = FastAPI()

@app.post("/alert")
def create_alert(alert: Alert):
    alerts[alert.alert_id] = alert
    return {"status": "saved"}

@app.get("/alerts")
def get_alerts():
    return list(alerts.values())

@app.post("/assessment")
def save_assessment(result: AssessmentResult):
    assessments[result.alert_id] = result
    return {"status": "assessment saved"}

@app.get("/assessment/{alert_id}")
def get_assessment(alert_id: str):
    if alert_id not in assessments:
        return {"error": "No assessment found"}
    return assessments[alert_id]
