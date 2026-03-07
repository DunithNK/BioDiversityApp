// API Configuration for Backend
// Update BACKEND_URL based on your setup:
//
// iOS Simulator: http://localhost:5001
// Android Emulator: http://10.0.2.2:5001
// Physical Device: http://<YOUR_MAC_IP>:5001
//   Find Mac IP: ipconfig getifaddr en0

export const API_CONFIG = {
  // Change this based on your testing environment
  BACKEND_URL: "http://172.20.10.2:5001", // For physical device (UPDATED: IP changed)

  // Endpoints
  ENDPOINTS: {
    ANALYZE: "/api/analyze",
    HEALTH: "/health",
    HISTORY: "/api/history",
    STATS: "/api/stats",
    MODEL_INFO: "/api/model/info",
  },

  // For physical device, uncomment and update IP:
  // BACKEND_URL: "http://192.168.1.XXX:5001",
};

// Helper to get API URL
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS) => {
  return `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};
