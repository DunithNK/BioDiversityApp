from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DATABASE_URL = "sqlite:///./biodiversity.db"
MODEL_PATH = BASE_DIR / "model" / "best_leopard_model.h5"
RECORDINGS_UPLOAD_DIR = BASE_DIR / "uploads" / "recordings"

# Thresholds used when summarizing multiple audio windows into one decision.
# These are intentionally a bit more recall-friendly for true leopard clips.
LEOPARD_WINDOW_THRESHOLD = 0.55
LEOPARD_STRONG_WINDOW_THRESHOLD = 0.65
LEOPARD_MIN_POSITIVE_WINDOWS = 2
