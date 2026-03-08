import { apiRequest } from "./api";

export interface AlertLocation {
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: number | null | undefined;
}

export interface AlertDistance {
  estimated_m?: number | null;
  min_m?: number | null;
  max_m?: number | null;
  confidence?: number | null;
}

export interface AlertListItem {
  alert_id: string;
  detected_at: string;
  mode: string;
  status: string;
  severity: string;
  location?: AlertLocation | null;
}

export interface AlertDetail {
  alert_id: string;
  live_session_id: number;
  device_id?: string | null;
  mode: string;
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
