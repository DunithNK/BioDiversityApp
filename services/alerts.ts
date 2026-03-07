import { apiRequest } from "./api";

export interface AlertLocation {
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: number | null | undefined;
}

export interface AlertDistance {
  value?: number | null;
  unit?: string | null;
  [key: string]: string | number | null | undefined;
}

export interface AlertListItem {
  alert_id: string;
  detected_at: string;
  status: string;
  severity: string;
  location?: AlertLocation | null;
}

export interface AlertDetail {
  alert_id: string;
  live_session_id: number;
  device_id?: string | null;
  status: string;
  risk_score: number;
  severity: string;
  priority: string;
  confidence?: number | null;
  distance: AlertDistance;
  detected_at: string;
  created_at: string;
  updated_at?: string | null;
  location?: AlertLocation | null;
}

export async function getAlerts(): Promise<AlertListItem[]> {
  return apiRequest<AlertListItem[]>("/alerts");
}

export async function getAlertDetail(alertId: string): Promise<AlertDetail> {
  return apiRequest<AlertDetail>(`/alerts/${alertId}`);
}
