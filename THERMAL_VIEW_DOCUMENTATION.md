# Thermal View — Technical Documentation

**Project:** BioDiversityApp — Gal Oya Wildlife Conservation  
**Module:** ThermalVital Monitor  
**Target Species:** Sri Lankan Leopard (*Panthera pardus kotiya*)  
**Date:** April 3, 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Frontend Screens](#3-frontend-screens)
   - 3.1 [Index (Landing Screen)](#31-index--landing-screen)
   - 3.2 [Capture Screen](#32-capture-screen)
   - 3.3 [Analysis Screen](#33-analysis-screen)
   - 3.4 [Decision Screen](#34-decision-screen)
   - 3.5 [History Screen](#35-history-screen)
   - 3.6 [History Detail Screen](#36-history-detail-screen)
   - 3.7 [TSI Info Screen](#37-tsi-info-screen)
   - 3.8 [Result Screen](#38-result-screen)
4. [Backend API](#4-backend-api)
   - 4.1 [Flask Server (app.py)](#41-flask-server-apppy)
   - 4.2 [API Endpoints](#42-api-endpoints)
   - 4.3 [Analysis Pipeline](#43-analysis-pipeline)
5. [Thermal Analysis Engine](#5-thermal-analysis-engine)
   - 5.1 [TSI Calculation](#51-tsi-calculation)
   - 5.2 [Health Classification](#52-health-classification)
   - 5.3 [Anatomical Region Analysis](#53-anatomical-region-analysis)
   - 5.4 [Anomaly Detection](#54-anomaly-detection)
   - 5.5 [Recommendations Engine](#55-recommendations-engine)
6. [AI Models & Datasets](#6-ai-models--datasets)
   - 6.1 [MobileNetV2 Leopard Classifier](#61-mobilenetv2-leopard-classifier)
     - 6.1.1 [Model Architecture](#611-model-architecture)
     - 6.1.2 [Dataset — Raw Source](#612-dataset--raw-source-newdetaset)
     - 6.1.3 [Dataset — Prepared Split](#613-dataset--prepared-split-prepared_classifier_dataset)
     - 6.1.4 [Preprocessing & Augmentation](#614-preprocessing--augmentation)
     - 6.1.5 [Training Configuration](#615-training-configuration)
     - 6.1.6 [Inference at Runtime](#616-inference-at-runtime)
   - 6.2 [YOLO Bounding-Box Detection Model](#62-yolo-bounding-box-detection-model)
     - 6.2.1 [Model Architecture](#621-model-architecture)
     - 6.2.2 [Dataset — Thermal Wildlife Detection](#622-dataset--thermal-wildlife-detection)
     - 6.2.3 [Inference at Runtime](#623-inference-at-runtime)
   - 6.3 [Model Files Reference](#63-model-files-reference)
7. [API Configuration](#7-api-configuration)
8. [Dependencies](#8-dependencies)
9. [Data Flow](#9-data-flow)
10. [Report Generation](#10-report-generation)
11. [Health Status & Release Protocol](#11-health-status--release-protocol)

---

## 1. Overview

The **Thermal View** module is the core feature of the BioDiversityApp. It enables wildlife conservationists and veterinarians to assess the physiological health of captured Sri Lankan Leopards using **infrared / thermal imagery**. The system computes a **Thermal Stress Index (TSI)** from uploaded thermal images and uses that metric to generate health status assessments plus release readiness recommendations.

### Key Capabilities

| Capability | Details |
|---|---|
| Thermal Image Ingestion | Upload from device gallery or FLIR ONE camera app |
| Leopard Verification | MobileNetV2 binary classifier rejects non-leopard images |
| Thermal Verification | Heuristic detection rejects regular (non-infrared) photos |
| Animal Localization | YOLOv8 bounding-box model localizes the leopard in the frame |
| TSI Computation | Normalized temperature difference index |
| Anatomical Analysis | Region-level thermal mapping (head, torso, limbs, eyes) |
| Health Classification | 4-level scale: Normal → Mild → Moderate → Critical |
| Bilateral Asymmetry | Left/right limb temperature differential analysis |
| Anomaly Detection | Flags regions deviating from species-specific normal ranges |
| PDF Report | Shareable PDF report with full analysis, regions, anomalies, and recommendations |
| History | Persistent log of all past analyses, viewable on-device |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   React Native App (Expo)                        │
│                                                                 │
│  index.tsx  →  capture.tsx  →  analysis.tsx  →  decision.tsx   │
│                                    ↕                            │
│               history.tsx  ←  historyDetail.tsx                 │
│               tsiInfo.tsx (reference screen)                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │  HTTP (multipart/form-data)
                              │  POST /api/analyze
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Flask Backend (app.py)                         │
│                                                                 │
│  Step 1: MobileNetV2 Classifier  → is this a leopard?           │
│  Step 2: Thermal Heuristic       → is this a thermal image?     │
│  Step 3: YOLO Model              → bounding-box localization    │
│  Step 4: ThermalStressAnalyzer   → TSI + health assessment      │
│  Step 5: Annotated image         → base64 encoding              │
│  Step 6: Persist to results/     → JSON + annotated JPEG        │
└─────────────────────────────────────────────────────────────────┘
```

**Technology Stack:**

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo (TypeScript) |
| Navigation | Expo Router (file-based) |
| Image Picker | expo-image-picker |
| Camera Integration | FLIR ONE app (deep-link via `flirone://`) |
| PDF Generation | expo-print + expo-sharing |
| Backend | Python Flask |
| Image Processing | OpenCV (cv2), PIL/Pillow |
| Animal Detection | YOLO v8 (Ultralytics) |
| Classification | PyTorch + MobileNetV2 |
| Numerical Analysis | NumPy |

---

## 3. Frontend Screens

All screens share a consistent dark-green conservation theme with animated fade-in and slide-up transitions powered by React Native's `Animated` API.

### 3.1 Index — Landing Screen

**File:** `app/ThermalView/index.tsx`

The entry point for the thermal module. Introduces the system and guides the user to begin an analysis.

**Key UI elements:**
- Animated header with thermometer icon and decorative rings
- "Thermal Scanner Ready" status badge
- Info cards: **Heat Detection**, **Health Assessment**
- "Start Thermal Analysis" CTA button — navigates to `capture.tsx`
- Feature grid (Thermal / 24/7 Active indicators)

---

### 3.2 Capture Screen

**File:** `app/ThermalView/capture.tsx`

The primary interaction screen. Allows the user to either open the FLIR ONE app to capture a new thermal image, or select an existing thermal image from the device gallery, then sends it to the backend for analysis.

**Key behaviors:**

1. **Open FLIR ONE App**
   - Attempts to deep-link to `flirone://`
   - Falls back to App Store URL if FLIR ONE is not installed

2. **Select Thermal Image from Gallery**
   - Requests `MediaLibrary` permissions
   - Uses `expo-image-picker` to select an image (quality: 1)
   - Constructs a `FormData` object with correct MIME type (critical for iOS + Expo compatibility)
   - POSTs to `${BACKEND_URL}/api/analyze`

3. **Error Handling**
   - `No leopard detected in image` — shows a targeted alert, aborts
   - `Not a thermal image` — informs user to use thermal camera
   - Network / server errors — shows connection troubleshooting guide

4. **On Success**
   - Navigates to `analysis.tsx` passing the full analysis JSON and `annotatedImage` (base64) as route params

**API call:**
```
POST http://<BACKEND_URL>/api/analyze
Content-Type: multipart/form-data

Body: { image: <file> }
```

---

### 3.3 Analysis Screen

**File:** `app/ThermalView/analysis.tsx`

Displays the full result of the thermal analysis including all metrics, region data, anomalies, recommendations, and release decision. Also provides the **PDF report download** feature.

**Data extracted from route params (`analysisData` JSON):**

| Field | Description |
|---|---|
| `leopard_mean_temp` | Mean body temperature of leopard (°C) |
| `background_mean_temp` | Mean background/environment temperature (°C) |
| `tsi` | Thermal Stress Index (4 decimal places) |
| `health_status` | String: Normal / Mild Stress / Moderate Stress / Critical Stress |
| `confidence` | Analysis confidence score (0.0 – 1.0) |
| `recommendations` | Array of recommendation strings |
| `regions` | Array of anatomical region objects (`name`, `mean_temp`, `min_temp`, `max_temp`, `std_temp`) |
| `anomalies` | Array of detected anomaly strings |
| `bilateral_asymmetry` | Object with left/right differential values |
| `release_recommended` | Boolean |
| `timestamp` | ISO 8601 timestamp |

**Dynamic recommendation logic:**

```
Normal           → "Thermal indicators within normal physiological limits."
Mild             → "Mild thermal stress detected. Monitor before release."
Moderate         → "Continued monitoring recommended before release."
Critical         → "Immediate intervention and rehabilitation required."
```

**PDF Report:**
- Generated using `expo-print` → `Print.printToFileAsync({ html })`
- Shared via `expo-sharing` as a `.pdf` file
- Report includes: summary table, anatomical region data, bilateral asymmetry, anomalies, recommendations, release decision
- Branded as: *ThermalVital Monitor — Gal Oya Wildlife Conservation Project*

---

### 3.4 Decision Screen

**File:** `app/ThermalView/decision.tsx`

Renders the final clinical release decision based on TSI value. Displays status badge and a detailed clinical recommendation note.

**Data shown:**
- Species: Sri Lankan Leopard
- Thermal Stress Index (TSI)
- Final Decision: `Ready for Release` / `Not Ready for Release`
- Accent color: Green (ready) / Red (not ready)

**Clinical note example:**
> The current Thermal Stress Index (TSI) 0.42 indicates elevated physiological stress beyond normal limits. According to wildlife release protocols, thermal parameters must stabilize before the animal can be safely transported or released.

**Disclaimer:**
> Decisions are calculated using species-specific baselines and should be cross-verified by a certified wildlife veterinarian.

---

### 3.5 History Screen

**File:** `app/ThermalView/history.tsx`

Lists all past analyses fetched from the backend. Supports pull-to-refresh.

**Features:**
- Fetches from `GET ${BACKEND_URL}/api/history`
- Displays each record as a card: species icon, date/time, TSI value, health status color
- Color-coded status indicator per record
- Navigates to `historyDetail.tsx` on card press, passing: `species`, `tsi`, `date`, `status`, `temp`

**Status color mapping:**

| Status | Color |
|---|---|
| Normal | `#27AE60` (Green) |
| Mild Stress | `#F39C12` (Amber) |
| Moderate Stress | `#E67E22` (Orange) |
| Critical Stress | `#E74C3C` (Red) |

**Fallback (TSI-based coloring when status string unavailable):**

| TSI Range | Color |
|---|---|
| ≤ 0.05 | Green |
| ≤ 0.10 | Amber |
| ≤ 0.15 | Orange |
| > 0.15 | Red |

---

### 3.6 History Detail Screen

**File:** `app/ThermalView/historyDetail.tsx`

Shows a detailed archived record for a single past analysis.

**Displayed fields:**
- Species
- Capture Date
- Stress Index (TSI) — color-coded
- Release Status: `Released` / `Awaiting Release` / `Not Released`
- Location: Gal Oya National Park

**Release status logic:**

```
Normal         → "Released"
Moderate Stress → "Awaiting Release"
High Stress    → "Not Released"
```

**TSI thresholds used in this screen (for Leopard):**

| TSI | Status |
|---|---|
| ≤ 0.30 | Normal |
| 0.31 – 0.55 | Moderate Stress |
| > 0.55 | High Stress |

> Note: these thresholds are slightly different from the backend thresholds (see §5.2). The backend uses tighter TSI thresholds.

**Footer:** "Authenticated WildSense Cryptographic Log"

---

### 3.7 TSI Info Screen

**File:** `app/ThermalView/tsiInfo.tsx`

A reference/educational screen explaining the Thermal Stress Index concept, formula, and species-specific threshold table.

**Content:**

**Definition:**
> TSI is a normalized metric used to estimate physiological heat strain in wildlife. It leverages infrared thermography to monitor body temperature gradients against environmental baselines.

**Formula display:**
```
TSI = (Current_Mean_Temp - Baseline_Normal_Temp) / Baseline_Normal_Temp
```

**Sri Lankan Leopard threshold table:**

| Level | TSI Range | Color |
|---|---|---|
| Normal | 0.00 – 0.30 | Green |
| Moderate Stress | 0.31 – 0.55 | Amber |
| High Stress | > 0.55 | Red |

**Note on calibration:**
> Thresholds are calibrated based on species-specific fur density, metabolic rate, and cutaneous evaporation capabilities.

---

### 3.8 Result Screen

**File:** `app/ThermalView/result.tsx`

A lightweight confirmation screen (legacy / placeholder). Shows a static detection confirmation message:

- "Sri Lankan Leopard Detected"
- Detection Confidence: 87%
- "Thermal patterns indicate normal body temperature range with no visible signs of heat stress."
- Button: "Analyze Another Image" → navigates back to `ThermalView/index`

> This screen appears to be a static placeholder and is largely superseded by the full `analysis.tsx` screen.

---

## 4. Backend API

### 4.1 Flask Server (app.py)

The backend is a Python Flask application running on port **5001** (port 5000 is reserved by macOS AirPlay Receiver).

**Startup:**
```bash
cd backend
python app.py
```

**Key configuration (via `.env` or defaults):**

| Variable | Default | Description |
|---|---|---|
| `UPLOAD_FOLDER` | `uploads/` | Uploaded image storage |
| `RESULTS_FOLDER` | `results/` | JSON + annotated image output |
| `MODEL_PATH` | `models/thermal_wildlife_detection/weights/best.pt` | YOLO model |
| `CLASSIFIER_PATH` | `models/leopard_classifier.pt` | MobileNetV2 classifier |
| `CLASSIFIER_THRESHOLD` | `0.50` | Minimum leopard probability to accept |

**CORS:** All origins allowed (`*`) on all routes — configured via `@app.before_request` (OPTIONS preflight) and `@app.after_request`.

---

### 4.2 API Endpoints

#### `GET /health`
Health check. Returns server status and model load state.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2026-04-03T10:00:00.000000"
}
```

---

#### `POST /api/analyze`
Main analysis endpoint. Accepts a thermal image and returns full TSI analysis.

**Request:** `multipart/form-data` with field `image`, OR `application/json` with `image` as a base64 string.

**Query param:** `?bypass=true` — skips leopard and thermal image validation gates (for testing).

**Success Response (200):**
```json
{
  "success": true,
  "analysis": {
    "analysis_id": "uuid",
    "timestamp": "ISO8601",
    "tsi": 0.0423,
    "health_status": "Normal",
    "leopard_mean_temp": 36.5,
    "background_mean_temp": 35.0,
    "confidence": 0.92,
    "regions": [...],
    "bilateral_asymmetry": {},
    "anomalies": [],
    "recommendations": ["Animal shows normal thermal profile", "Suitable for release consideration"],
    "release_recommended": true
  },
  "detections": [...],
  "analysis_id": "uuid",
  "annotated_image": "data:image/jpeg;base64,..."
}
```

**Error Responses:**

| Code | Error | Meaning |
|---|---|---|
| 400 | `No leopard detected in image` | Classifier rejected the image |
| 400 | `Not a thermal image` | Thermal heuristic rejected the image |
| 400 | `No image provided` | Request had no image field |
| 500 | Internal server error | Unhandled exception |

---

#### `GET /api/history`
Returns the last 50 analysis records (sorted newest first).

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "analysis_id": "...",
      "timestamp": "...",
      "tsi": 0.04,
      "health_status": "Normal",
      "leopard_mean_temp": 36.1
    }
  ]
}
```

---

#### `GET /api/history/<analysis_id>`
Returns full detail for a single analysis, including the annotated image as base64.

---

#### `GET /api/stats`
Returns aggregate statistics across all stored analyses.

---

### 4.3 Analysis Pipeline

The `POST /api/analyze` endpoint executes a 4-step sequential pipeline:

```
Image received
      │
      ▼
Step 1: MobileNetV2 Binary Classifier
      │  leopard_prob < threshold (0.50)?
      ├─ YES → 400: "No leopard detected"
      │
      ▼
Step 2: Thermal Image Heuristic
      │  is_thermal == False?
      ├─ YES → 400: "Not a thermal image"
      │
      ▼
Step 3: YOLO Bounding-Box Localization
      │  Extracts leopard bounding box from frame
      │  Falls back to 90% frame (10% margin) if YOLO has no match
      │
      ▼
Step 4: ThermalStressAnalyzer.analyze_thermal_image()
      │  Extracts temperatures → computes TSI → classifies health
      │  Detects anomalies → generates recommendations
      │
      ▼
Annotate image → Persist to disk → Return JSON response
```

**Thermal Image Detection Heuristic** (`is_thermal_image()`):

The function uses three OpenCV-based checks. An image is classified as thermal if **any** of the following are true:

| Check | Threshold | Rationale |
|---|---|---|
| Color palette ratio | < 10% unique colors | Thermal images use gradient palettes |
| Saturation std-dev (HSV) | < 40 | Thermal images are near-grayscale or single-hue |
| Histogram variance | > 100,000 | Thermal images have bimodal intensity distributions |

---

## 5. Thermal Analysis Engine

**File:** `backend/thermal_analysis.py`

The `ThermalStressAnalyzer` class implements all thermal science logic.

### 5.1 TSI Calculation

```
TSI = |T_leopard - T_background| / T_background
```

Where:
- `T_leopard` = mean pixel temperature of the leopard bounding box (°C)
- `T_background` = mean pixel temperature of the background region (°C)

Temperature values are derived from pixel intensity normalization:

```python
temperatures = 20.0 + (pixel_value / 255.0) * 25.0
# Maps 0..255 → 20°C..45°C
```

> Note: This is a simplified linear mapping. Real-world FLIR cameras embed actual temperature data in EXIF/radiometric metadata. Future enhancement: parse FLIR EXIF radiometric data directly.

---

### 5.2 Health Classification

**TSI Thresholds (Backend — `ThermalStressAnalyzer.TSI_THRESHOLDS`):**

| Level | TSI Range | Recommendation Summary |
|---|---|---|
| **Normal** | < 0.05 | Suitable for release consideration |
| **Mild Stress** | 0.05 – 0.09 | Monitor 24–48 hours before release |
| **Moderate Stress** | 0.10 – 0.14 | Delay release 3–7 days; vet exam required |
| **Critical Stress** | ≥ 0.15 | Do NOT release; immediate veterinary intervention |

---

### 5.3 Anatomical Region Analysis

The bounding box is divided into sub-regions for localized temperature analysis:

```python
regions = {
    'head': (x1, y1, x1 + 30% width, y1 + 30% height),
    # torso, limbs, ocular regions defined but currently commented out
}
```

**Normal temperature ranges per region:**

| Region | Normal Range (°C) |
|---|---|
| Head | 36.0 – 38.5 |
| Torso | 35.5 – 37.8 |
| Limbs | 34.0 – 36.5 |
| Eyes | 36.5 – 38.0 |

For each region, the following statistics are computed:
- `mean_temp` — average temperature
- `min_temp` — minimum temperature
- `max_temp` — maximum temperature
- `std_temp` — standard deviation

---

### 5.4 Anomaly Detection

Anomalies are flagged when a region's temperature falls outside its species-specific normal range, or when bilateral asymmetry exceeds the threshold.

**Bilateral Asymmetry Threshold:** 1.5°C

If `|left_limb_temp - right_limb_temp| > 1.5°C`, an asymmetry anomaly is recorded.

**Example anomaly messages:**
- `"Elevated temperature in head: 39.2°C (normal: 36.0-38.5°C)"`
- `"Significant bilateral asymmetry in limbs: 2.3°C difference"`

---

### 5.5 Recommendations Engine

Recommendations are generated in two layers:

1. **Status-level recommendations** (based on health classification):

| Status | Recommendations |
|---|---|
| Normal | "Animal shows normal thermal profile", "Suitable for release consideration" |
| Mild Stress | "Monitor for 24-48 hours before release", "Ensure adequate hydration and nutrition" |
| Moderate Stress | "Delay release 3-7 days", "Conduct veterinary examination", "Review environmental conditions" |
| Critical Stress | "DO NOT RELEASE", "Immediate veterinary intervention required", "Extended rehabilitation period recommended" |

2. **Anomaly-specific recommendations:**

| Anomaly Type | Added Recommendation |
|---|---|
| Elevated temperature | "Investigate potential inflammation or infection" |
| Low temperature | "Check for circulation issues or hypothermia" |
| Bilateral asymmetry | "Investigate potential injury or localized pathology" |

---

## 6. AI Models & Datasets

Two distinct AI models are used sequentially in the thermal analysis pipeline. Each model has its own dedicated dataset, training procedure, and runtime role.

---

### 6.1 MobileNetV2 Leopard Classifier

#### 6.1.1 Model Architecture

| Property | Value |
|---|---|
| Base architecture | MobileNetV2 (ImageNet pretrained) |
| Classifier head | `nn.Linear(1280, 2)` — replaces default `classifier[1]` |
| Output classes | 2 — `leopard` (index 0), `nonleopard` (index 1) |
| Input resolution | 224 × 224 (RGB) |
| Activation | Softmax (applied at inference via `torch.softmax`) |
| Acceptance threshold | `leopard_prob ≥ 0.50` (configurable via `CLASSIFIER_THRESHOLD` env var) |
| Saved weights | `backend/models/leopard_classifier.pt` |
| Framework | PyTorch (`torch>=2.1.0`, `torchvision>=0.16.0`) |
| Inference device | CPU (`map_location='cpu'`) |

**Architecture diagram:**
```
Input (224×224×3)
      │
      ▼
MobileNetV2 Feature Extractor
  └── 18 inverted residual blocks
  └── Conv2d → BN → ReLU6 layers
  └── Global Average Pooling → 1280-dim feature vector
      │
      ▼
Dropout(0.2)
      │
      ▼
Linear(1280 → 2)        ← custom classification head
      │
      ▼
Softmax → [leopard_prob, nonleopard_prob]
```

---

#### 6.1.2 Dataset — Raw Source (`NewDetaset/`)

The raw collected image dataset used to build the classifier:

```
backend/NewDetaset/
├── leopard/          ← positive class: Sri Lankan Leopard images
│                       (thermal and regular photos of leopards)
└── nonleopard/       ← negative class: all other subjects
                        (other animals, people, landscape, screenshots, etc.)
```

**Dataset composition:**

| Class | Role | Image types included |
|---|---|---|
| `leopard` | Positive (ACCEPT) | Thermal infrared leopard images, regular RGB leopard photographs |
| `nonleopard` | Negative (REJECT) | Other animals, non-leopard wildlife, human figures, backgrounds, unrelated photos |

> The classifier is intentionally trained on **both thermal and regular** leopard photos in the positive class, so it can accept any leopard image at the gate stage. The thermal-image filter (Step 2 of the pipeline) then separately enforces that only infrared images proceed to thermal analysis.

---

#### 6.1.3 Dataset — Prepared Split (`prepared_classifier_dataset/`)

The raw dataset is split into training and validation sets:

```
backend/prepared_classifier_dataset/
├── train/
│   ├── leopard/       ← training samples (positive class)
│   └── nonleopard/    ← training samples (negative class)
└── val/
    ├── leopard/       ← validation samples (positive class)
    └── nonleopard/    ← validation samples (negative class)
```

The training script (`train_classifier.py`) reads from `prepared_classifier_dataset/train/` and evaluates against `prepared_classifier_dataset/val/`. Per-epoch loss and accuracy metrics are saved to `backend/models/classifier_training_history.json`.

---

#### 6.1.4 Preprocessing & Augmentation

**Inference-time transform (applied in `app.py`):**
```python
transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],   # ImageNet mean
        std= [0.229, 0.224, 0.225]    # ImageNet std
    ),
])
```

**Training-time augmentation** (using `albumentations>=1.3.0`):

| Augmentation | Purpose |
|---|---|
| Random horizontal flip | Orientation invariance |
| Random rotation | Pose invariance |
| Brightness / contrast jitter | Lighting condition robustness |
| Random crop / resize | Scale invariance |
| Normalization (ImageNet stats) | Consistent with pretrained MobileNetV2 weights |

---

#### 6.1.5 Training Configuration

Script: `backend/train_classifier.py`

| Hyperparameter | Value |
|---|---|
| Base model | `torchvision.models.mobilenet_v2(weights='IMAGENET1K_V1')` |
| Loss function | CrossEntropyLoss |
| Fine-tuning strategy | Full model fine-tuned (all layers unfrozen) |
| Output model | `backend/models/leopard_classifier.pt` |
| Dataset source | `backend/prepared_classifier_dataset/` |
| Training history | `backend/models/classifier_training_history.json` |

`backend/train_fast.py` — a rapid-iteration training variant, likely using a reduced epoch count or smaller dataset subset for development and debugging.

---

#### 6.1.6 Inference at Runtime

```python
# Load model once at server startup
clf = tv_models.mobilenet_v2(weights=None)
clf.classifier[1] = nn.Linear(1280, 2)
clf.load_state_dict(torch.load('models/leopard_classifier.pt', map_location='cpu'))
clf.eval()

# Per-request inference
tensor = transform(pil_image).unsqueeze(0)       # shape: [1, 3, 224, 224]
with torch.no_grad():
    output = clf(tensor)
    probs  = torch.softmax(output, dim=1)
    leopard_prob = probs[0][0].item()             # class index 0 = leopard

is_leopard = leopard_prob >= CLASSIFIER_THRESHOLD  # default 0.50
```

**Graceful degradation:** If `leopard_classifier.pt` is missing at startup, `classifier_model = None` and all images pass through (`leopard_prob = 1.0`) — the classifier gate is effectively disabled.

---

### 6.2 YOLO Bounding-Box Detection Model

#### 6.2.1 Model Architecture

| Property | Value |
|---|---|
| Framework | Ultralytics YOLOv8 (`ultralytics>=8.0.0`) |
| Model file | `backend/models/thermal_wildlife_detection/weights/best.pt` |
| Task | Object detection (bounding-box regression + classification) |
| Purpose in pipeline | **Localization only** — extract leopard bounding box for TSI region |
| Role in accept/reject | **None** — YOLO does NOT gate images; that is done by MobileNetV2 |

---

#### 6.2.2 Dataset — Thermal Wildlife Detection

Training script: `backend/train_thermal_model.py`

```
backend/models/thermal_wildlife_detection/
└── weights/
    └── best.pt    ← best checkpoint saved during YOLOv8 training
```

**Dataset characteristics:**

| Property | Details |
|---|---|
| Image type | Thermal (infrared) wildlife images |
| Target class | `leopard` (must match `class_name.lower() == 'leopard'` in app.py) |
| Annotation format | YOLO format — `class x_center y_center width height` (normalized 0–1) |
| Primary purpose | Locate the leopard in the thermal frame → supply bounding box to `ThermalStressAnalyzer` |

**YOLO detection output consumed by pipeline:**
```python
for box in result.boxes:
    x1, y1, x2, y2 = box.xyxy[0].tolist()   # absolute pixel coordinates
    conf            = box.conf[0].item()      # confidence score
    class_name      = result.names[int(box.cls[0])]
    # Highest-confidence "leopard" box → forwarded to thermal analysis
```

**Fallback when YOLO finds no leopard:**
```python
# Full-frame bbox with 10% margin on all sides
margin       = 0.1
leopard_bbox = (int(w*0.10), int(h*0.10), int(w*0.90), int(h*0.90))
```

---

#### 6.2.3 Inference at Runtime

After the thermal image is accepted through the MobileNetV2 + thermal heuristic gates:

1. YOLO runs on the full image and returns all detected boxes
2. The highest-confidence box whose `class_name == "leopard"` is selected
3. That bounding box `(x1, y1, x2, y2)` is passed to `ThermalStressAnalyzer.analyze_thermal_image()`
4. The annotated output image overlays green (YOLO box) + blue (sub-region boxes) + black overlay (TSI / status)

---

### 6.3 Model Files Reference

| File | Description |
|---|---|
| `backend/models/leopard_classifier.pt` | MobileNetV2 binary classifier weights (leopard / nonleopard) |
| `backend/models/thermal_wildlife_detection/weights/best.pt` | YOLOv8 thermal wildlife detector — best training checkpoint |
| `backend/models/classifier_training_history.json` | Per-epoch loss + accuracy log from MobileNetV2 classifier training |

**Dataset → Model mapping:**

| Dataset | Maps to Model | Training Script |
|---|---|---|
| `backend/NewDetaset/` (raw) → `backend/prepared_classifier_dataset/` (split) | `leopard_classifier.pt` — MobileNetV2 | `train_classifier.py` / `train_fast.py` |
| Thermal wildlife bounding-box dataset (YOLO format) | `thermal_wildlife_detection/weights/best.pt` — YOLOv8 | `train_thermal_model.py` |

**Pipeline role of each model:**

```
Uploaded image
      │
      ▼
[leopard_classifier.pt]  ← MobileNetV2 — trained on NewDetaset/
  "Is this a leopard?"
  REJECT if leopard_prob < 0.50
      │ ACCEPT
      ▼
[Thermal heuristic]      ← No model — OpenCV color/histogram analysis
  "Is this a thermal image?"
      │ YES
      ▼
[best.pt]                ← YOLOv8 — trained on thermal wildlife dataset
  "Where is the leopard in this frame?"
  → returns (x1, y1, x2, y2) bounding box
      │
      ▼
[ThermalStressAnalyzer]  ← No model — NumPy/OpenCV math
  "What is the TSI and health status?"
```

---

## 7. API Configuration

**File:** `constants/api.ts`

```typescript
export const API_CONFIG = {
  BACKEND_URL: "http://192.168.1.145:5001",  // Physical device (update per environment)
  ENDPOINTS: {
    ANALYZE:    "/api/analyze",
    HEALTH:     "/health",
    HISTORY:    "/api/history",
    STATS:      "/api/stats",
    MODEL_INFO: "/api/model/info",
  }
};
```

**Environment-specific URLs:**

| Environment | URL |
|---|---|
| iOS Simulator | `http://localhost:5001` |
| Android Emulator | `http://10.0.2.2:5001` |
| Physical Device | `http://<Mac_LAN_IP>:5001` |

To find Mac LAN IP: `ipconfig getifaddr en0`

**Port:** 5001 (not 5000 — macOS AirPlay Receiver occupies 5000)

---

## 8. Dependencies

### Frontend (`package.json`)

| Package | Purpose |
|---|---|
| `expo` | App framework |
| `expo-router` | File-based navigation |
| `expo-image-picker` | Gallery / camera image selection |
| `expo-print` | PDF generation from HTML |
| `expo-sharing` | Share/save PDF file |
| `react-native` | Core UI framework |

### Backend (`backend/requirements.txt`)

| Package | Purpose |
|---|---|
| `flask` | REST API server |
| `flask-cors` | CORS headers |
| `numpy` | Numerical computation |
| `opencv-python` | Image processing, thermal analysis |
| `pillow` | Image format handling |
| `torch` + `torchvision` | MobileNetV2 classifier inference |
| `ultralytics` | YOLOv8 object detection |
| `scikit-image` | Additional image processing |
| `python-dotenv` | Environment variable loading |
| `albumentations` | Training-time data augmentation |
| `gunicorn` | Production WSGI server |

---

## 9. Data Flow

```
User selects image (gallery or FLIR ONE)
        │
        ▼
capture.tsx: FormData POST → /api/analyze
        │
        ▼
Backend Step 1: Classify with MobileNetV2
  ├── Rejected → Alert: "No leopard detected"
  └── Accepted (leopard_prob ≥ 0.50) ↓
        │
        ▼
Backend Step 2: is_thermal_image() heuristic
  ├── Rejected → Alert: "Not a thermal image"
  └── Accepted ↓
        │
        ▼
Backend Step 3: YOLO → leopard bounding-box
        │
        ▼
Backend Step 4: ThermalStressAnalyzer
  ├── Extract pixel temperatures
  ├── Compute T_leopard, T_background
  ├── Calculate TSI
  ├── Classify health status
  ├── Detect regional anomalies
  ├── Bilateral asymmetry check
  └── Generate recommendations ↓
        │
        ▼
Annotate image (draw bbox, region labels, TSI overlay)
        │
        ▼
Persist: results/<uuid>.json + results/<uuid>_annotated.jpg
        │
        ▼
Return JSON: { analysis, detections, annotated_image (base64) }
        │
        ▼
capture.tsx navigates → analysis.tsx (params: analysisData, analysisId)
        │
        ▼
analysis.tsx displays: TSI, health status, regions, anomalies,
                       recommendations, release decision
        │
        ├── Download PDF Report (expo-print + expo-sharing)
        └── View historical analyses (history.tsx → historyDetail.tsx)
```

---

## 10. Report Generation

The analysis screen generates a **downloadable PDF report** branded for the Gal Oya Wildlife Conservation Project.

**PDF content structure:**

```
╔══════════════════════════════════════╗
║  THERMAL WILDLIFE HEALTH ANALYSIS    ║
║  ThermalVital Monitor System         ║
╚══════════════════════════════════════╝

ANALYSIS SUMMARY
  Analysis ID, Timestamp, Species

THERMAL MEASUREMENTS
  Leopard Mean Temp, Background Temp, TSI, Health Status, Confidence

ANATOMICAL REGION ANALYSIS
  (per region) Mean / Min / Max / Std Dev

BILATERAL ASYMMETRY
  (if detected) Left/right differential values

DETECTED ANOMALIES
  Numbered list

RECOMMENDATIONS
  Numbered list

RELEASE DECISION
  Final decision text + Release Recommended: YES/NO

Report generated by ThermalVital Monitor
Gal Oya Wildlife Conservation Project
```

**Status color mapping in PDF:**

| Status | Color |
|---|---|
| Normal | `#2ECC71` |
| Mild Stress | `#F1C40F` |
| Moderate Stress | `#F39C12` |
| Critical Stress | `#E74C3C` |

---

## 11. Health Status & Release Protocol

The full classification and release decision matrix:

| TSI Value | Health Status | Release Decision | Action Required |
|---|---|---|---|
| < 0.05 | **Normal** | Ready for Release | Routine monitoring |
| 0.05 – 0.09 | **Mild Stress** | Monitor First | 24–48 hrs observation, hydration, nutrition check |
| 0.10 – 0.14 | **Moderate Stress** | Delay Release | 3–7 day delay, veterinary examination |
| ≥ 0.15 | **Critical Stress** | DO NOT RELEASE | Immediate veterinary intervention + extended rehabilitation |

**Additional flags that escalate the decision:**
- Bilateral limb asymmetry > 1.5°C → investigate injury / localized pathology
- Regional hyperthermia → investigate infection / inflammation
- Regional hypothermia → investigate circulation issues / hypothermia

> All automated decisions are advisory. Cross-verification by a **certified wildlife veterinarian** is required before any release action is taken.

---

*Document generated from source code — BioDiversityApp, April 3, 2026*
