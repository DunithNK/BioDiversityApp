import { apiRequest } from "./api";

export interface Location {
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: number | null | undefined;
}

export interface Probability {
  leopard?: number | null;
  non_leopard?: number | null;
  [key: string]: number | null | undefined;
}

export interface Distance {
  value?: number | null;
  unit?: string | null;
  [key: string]: string | number | null | undefined;
}

export interface LiveSessionSummary {
  id: number;
  device_id?: string | null;
  status: string;
  overall_is_leopard: boolean;
  best_confidence?: number | null;
  last_location: Location;
  started_at: string;
  ended_at?: string | null;
  last_detected_at?: string | null;
  best_chunk_id?: number | null;
}

export interface LiveSessionCreateResponse {
  id: number;
  status: string;
}

export interface LiveChunk {
  id: number;
  live_session_id: number;
  chunk_index: number;
  location: Location;
  label?: string | null;
  is_leopard: boolean;
  confidence?: number | null;
  probabilities: Probability;
  distance: Distance;
  created_at: string;
}

export interface LiveChunkUploadResponse {
  session: LiveSessionSummary;
  chunk: LiveChunk;
}

export async function createLiveSession(
  deviceId?: string,
): Promise<LiveSessionCreateResponse> {
  const body = new URLSearchParams();

  if (deviceId) {
    body.append("device_id", deviceId);
  }

  return apiRequest<LiveSessionCreateResponse>("/live-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
}

export async function uploadLiveChunk(params: {
  liveId: number;
  fileUri: string;
  fileName?: string;
  mimeType?: string;
  latitude?: number;
  longitude?: number;
  chunkIndex?: number;
}): Promise<LiveChunkUploadResponse> {
  const formData = new FormData();

  formData.append("file", {
    uri: params.fileUri,
    name: params.fileName ?? "chunk.wav",
    type: params.mimeType ?? "audio/wav",
  } as any);

  if (params.latitude !== undefined) {
    formData.append("latitude", String(params.latitude));
  }

  if (params.longitude !== undefined) {
    formData.append("longitude", String(params.longitude));
  }

  if (params.chunkIndex !== undefined) {
    formData.append("chunk_index", String(params.chunkIndex));
  }

  return apiRequest<LiveChunkUploadResponse>(
    `/live-sessions/${params.liveId}/chunks`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function getLiveSession(
  liveId: number,
): Promise<LiveSessionSummary> {
  return apiRequest<LiveSessionSummary>(`/live-sessions/${liveId}`);
}

export async function getLiveChunks(liveId: number): Promise<LiveChunk[]> {
  return apiRequest<LiveChunk[]>(`/live-sessions/${liveId}/chunks`);
}

export async function endLiveSession(
  liveId: number,
): Promise<LiveSessionSummary> {
  return apiRequest<LiveSessionSummary>(`/live-sessions/${liveId}/end`, {
    method: "POST",
  });
}

export interface LiveSessionStatusResponse {
  live_session_id: number;
  processing_status: "idle" | "processing" | "complete" | "failed" | string;
}

export async function getLiveSessionStatus(
  liveId: number,
): Promise<LiveSessionStatusResponse> {
  return apiRequest<LiveSessionStatusResponse>(
    `/live-sessions/${liveId}/status`,
  );
}
