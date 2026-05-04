import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "DETECTION_HISTORY";

export type DetectionItem = {
  id: string;
  mode: "live" | "recorded";
  date: string;
  latitude?: number;
  longitude?: number;
  frequency: string;
  distance: string;
  confidence: number;
};


export const saveDetection = async (item: DetectionItem) => {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  const history: DetectionItem[] = existing ? JSON.parse(existing) : [];

  history.unshift(item); // newest first
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const getDetections = async (): Promise<DetectionItem[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearDetections = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
