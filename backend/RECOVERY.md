# 🔧 Backend Recovery Guide

## Missing Files Identified

After branch operations, the following files were lost:

### ❌ Missing:
1. **`models/leopard_detector.h5`** - Trained ML model (22MB, gitignored)
2. **`prepared_dataset/` content** - Organized training images (empty directories)

### ✅ Present:
- ✅ All Python scripts (main.py, database.py, train_model.py, prepare_dataset.py)
- ✅ Raw dataset images in `detaset/` (4,092 images found)
- ✅ Virtual environment and dependencies

---

## 🚀 Quick Recovery Steps

### Step 1: Prepare Dataset
Organize raw images into training structure:
```bash
cd backend
./venv/bin/python3 prepare_dataset.py
```
**Expected Output**: ~245-350 images split into train/val/test for leopard/not_leopard classes

### Step 2: Train Model
Train the MobileNetV2 model (takes ~10-20 minutes):
```bash
./venv/bin/python3 train_model.py
```
**Expected Output**: `models/leopard_detector.h5` (~22MB) with 95%+ validation accuracy

### Step 3: Verify Model
Check if model file exists:
```bash
ls -lh models/leopard_detector.h5
```

### Step 4: Start Server
```bash
./venv/bin/python3 main.py
```
**Expected**: Server starts on http://localhost:8000 with model loaded

---

## 📊 Dataset Structure (After Recovery)

```
backend/
├── detaset/                    # ✅ Raw images (4,092 files)
│   └── animals/
│       ├── leopard/
│       ├── cheetah/
│       ├── lion/
│       └── tiger/
├── prepared_dataset/           # Will be populated by Step 1
│   ├── train/
│   │   ├── leopard/           # ~175 images
│   │   └── not_leopard/       # ~175 images
│   ├── val/
│   │   ├── leopard/           # ~38 images
│   │   └── not_leopard/       # ~38 images
│   └── test/
│       ├── leopard/           # ~37 images
│       └── not_leopard/       # ~37 images
└── models/
    └── leopard_detector.h5    # Will be created by Step 2 (~22MB)
```

---

## ⚠️ Important Notes

1. **Why files were lost**: `.gitignore` excludes:
   - `*.h5` (ML models)
   - `models/` directory
   - `prepared_dataset/` content
   
   These files are never committed to Git, so branch switches lose them.

2. **Training Time**: Model training takes 15-20 minutes on Mac M1/M2

3. **Model Performance**: Expected validation accuracy: 95-96%

4. **GPU Acceleration**: Training will use Metal GPU if available

---

## 🐛 Troubleshooting

### Issue: "Model not found" when starting server
**Solution**: Run Steps 1-2 to recreate the model

### Issue: "No images found" during dataset preparation  
**Solution**: Verify `detaset/animals/leopard/` contains images

### Issue: Training accuracy too low (<90%)
**Solution**: 
- Check dataset balance (should be ~50/50 leopard/not_leopard)
- Increase EPOCHS in train_model.py
- Verify images aren't corrupted

### Issue: "Out of memory" during training
**Solution**: Reduce BATCH_SIZE in train_model.py from 32 to 16

---

## ✅ Verification Checklist

After recovery, verify:
- [ ] `prepared_dataset/train/leopard/` has 150+ images
- [ ] `prepared_dataset/train/not_leopard/` has 150+ images
- [ ] `models/leopard_detector.h5` exists and is ~20-25MB
- [ ] Server starts without "Model not found" error
- [ ] API endpoint `/predict` returns predictions
- [ ] Frontend can upload images and get detections

---

**Generated**: March 2, 2026  
**Recovery Status**: Ready to execute
