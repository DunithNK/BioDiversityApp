import { apiRequest } from "./api";

export interface RecordingCreateResponse {
  id: number;
  status: string;
}

export interface RecordingSummary {
  id: number;
  file_name: string;
  saved_path: string;
  device_id?: string | null;
  status: string;
  overall_label?: string | null;
  overall_is_leopard: boolean;
  best_confidence?: number | null;
  best_chunk_id?: number | null;
  created_at: string;
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

export interface RecordingChunk {
  id: number;
  recording_id: number;
  chunk_index: number;
  start_sec: number;
  end_sec: number;
  label?: string | null;
  is_leopard: boolean;
  confidence?: number | null;
  probabilities: Probability;
  distance: Distance;
  created_at: string;
}

export async function createRecording(
  fileUri: string,
  fileName = "recording.wav",
  mimeType = "audio/wav",
  deviceId?: string,
): Promise<RecordingCreateResponse> {
  const formData = new FormData();

  formData.append("file", {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  if (deviceId) {
    formData.append("device_id", deviceId);
  }

  return apiRequest<RecordingCreateResponse>("/recordings", {
    method: "POST",
    body: formData,
  });
}

export async function getRecording(
  recordingId: number,
): Promise<RecordingSummary> {
  return apiRequest<RecordingSummary>(`/recordings/${recordingId}`);
}

export async function getRecordingChunks(
  recordingId: number,
): Promise<RecordingChunk[]> {
  return apiRequest<RecordingChunk[]>(`/recordings/${recordingId}/chunks`);
}

export interface RecordingStatusResponse {
  recording_id: number;
  status: "uploaded" | "processing" | "complete" | "failed" | string;
}

export async function getRecordingStatus(
  recordingId: number,
): Promise<RecordingStatusResponse> {
  return apiRequest<RecordingStatusResponse>(
    `/recordings/${recordingId}/status`,
  );
}
