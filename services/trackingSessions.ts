import AsyncStorage from "@react-native-async-storage/async-storage";

const TRACKING_SESSIONS_KEY = "SOUNDTRACK_TRACKING_SESSIONS";

export type TrackingPoint = {
  latitude: number;
  longitude: number;
  recorded_at: string;
};

export type TrackedLiveSession = {
  liveSessionId: number;
  deviceId?: string | null;
  startedAt: string;
  completedAt: string;
  points: TrackingPoint[];
};

export async function getTrackedLiveSessions(): Promise<TrackedLiveSession[]> {
  const raw = await AsyncStorage.getItem(TRACKING_SESSIONS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse tracked live sessions:", error);
    return [];
  }
}

export async function saveTrackedLiveSession(
  session: TrackedLiveSession,
): Promise<void> {
  const existing = await getTrackedLiveSessions();

  const next = [
    session,
    ...existing.filter((item) => item.liveSessionId !== session.liveSessionId),
  ];

  await AsyncStorage.setItem(TRACKING_SESSIONS_KEY, JSON.stringify(next));
}
