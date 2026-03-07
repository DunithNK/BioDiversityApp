import { apiRequest } from "./api";

export interface HistoryLocation {
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: number | null | undefined;
}

export interface HistoryItem {
  source: string;
  id: number;
  device_id?: string | null;
  status: string;
  label?: string | null;
  is_leopard: boolean;
  confidence?: number | null;
  created_at: string;
  location?: HistoryLocation | null;
}

export async function getHistory(): Promise<HistoryItem[]> {
  return apiRequest<HistoryItem[]>("/history");
}

export async function getRecordingHistory(): Promise<HistoryItem[]> {
  return apiRequest<HistoryItem[]>("/history/recordings");
}

export async function getLiveSessionHistory(): Promise<HistoryItem[]> {
  return apiRequest<HistoryItem[]>("/history/live-sessions");
}
