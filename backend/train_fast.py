"""
ULTRA-FAST Training - 15-20 minutes
Optimized for quick model training on CPU
"""

from ultralytics import YOLO
import torch

print("=" * 60)
print("ULTRA-FAST MODE: 5 epochs, 800 images, 320px")
print("Estimated time: 15-20 minutes")
print("=" * 60)

# Initialize with smallest YOLOv8 model
model = YOLO('yolov8n.pt')

# Ultra-fast training configuration
results = model.train(
    data='termalDetaset/yolo_dataset/data.yaml',
    
    # Minimal epochs
    epochs=5,
    
    # Smaller image size (320 instead of 416)
    imgsz=320,
    
    # Larger batch for speed
    batch=48,
    
    # Use only 800 images (modify data.yaml to point to subset)
    fraction=0.27,  # 27% of 3000 = ~800 images
    
    # Performance optimizations
    cache=True,
    workers=8,
    device='cpu',
    
    # Skip unnecessary validations during training
    val=False,  # Only validate at end
    
    # Minimal augmentations for speed
    hsv_h=0.0,
    hsv_s=0.0,
    hsv_v=0.0,
    degrees=0,
    translate=0,
    scale=0,
    shear=0,
    flipud=0,
    fliplr=0.5,
    mosaic=0.0,
    mixup=0.0,
    
    # Fast convergence
    patience=3,
    
    # Output
    name='thermal_fast',
    project='runs/detect',
    exist_ok=True,
    pretrained=True,
    verbose=True
)

# Final validation
print("\nRunning final validation...")
metrics = model.val()

print("\n" + "=" * 60)
print("✓ Training complete!")
print(f"Model saved to: runs/detect/thermal_fast/weights/best.pt")
print("=" * 60)
