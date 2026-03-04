"""
Thermal Wildlife Detection Model Training Script
Trains a deep learning model for detecting wildlife in thermal images
"""

import os
import json
import numpy as np
import cv2
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2
from typing import Dict, List, Tuple
import yaml
from pathlib import Path

class ThermalWildlifeDataset(Dataset):
    """Custom Dataset for thermal wildlife images with COCO annotations"""
    
    def __init__(self, images_dir: str, annotations_file: str, transform=None):
        self.images_dir = Path(images_dir)
        self.transform = transform
        
        # Load COCO annotations
        with open(annotations_file, 'r') as f:
            self.coco_data = json.load(f)
        
        # Create image id to annotations mapping
        self.image_annotations = {}
        for ann in self.coco_data['annotations']:
            img_id = ann['image_id']
            if img_id not in self.image_annotations:
                self.image_annotations[img_id] = []
            self.image_annotations[img_id].append(ann)
        
        # Get all images
        self.images = self.coco_data.get('images', [])
        if not self.images:
            # Generate images list from image file names
            image_files = sorted(list(self.images_dir.glob('*.jpg')))
            self.images = [{'id': idx, 'file_name': img_file.name} 
                          for idx, img_file in enumerate(image_files)]
        
        self.categories = {cat['id']: cat['name'] for cat in self.coco_data['categories']}
        
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        img_info = self.images[idx]
        img_id = img_info['id']
        img_path = self.images_dir / img_info['file_name']
        
        # Load image
        image = cv2.imread(str(img_path))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Get annotations for this image
        annotations = self.image_annotations.get(img_id, [])
        
        # Extract bounding boxes and labels
        boxes = []
        labels = []
        for ann in annotations:
            bbox = ann['bbox']  # [x, y, width, height]
            x, y, w, h = bbox
            boxes.append([x, y, x + w, y + h])  # Convert to [x1, y1, x2, y2]
            labels.append(ann['category_id'])
        
        target = {
            'boxes': torch.as_tensor(boxes, dtype=torch.float32) if boxes else torch.zeros((0, 4), dtype=torch.float32),
            'labels': torch.as_tensor(labels, dtype=torch.int64) if labels else torch.zeros((0,), dtype=torch.int64),
            'image_id': torch.tensor([img_id])
        }
        
        if self.transform:
            # Apply albumentations transforms
            transformed = self.transform(image=image, bboxes=boxes, labels=labels)
            image = transformed['image']
            if 'bboxes' in transformed and len(transformed['bboxes']) > 0:
                target['boxes'] = torch.as_tensor(transformed['bboxes'], dtype=torch.float32)
        
        return image, target


def get_transforms(train=True):
    """Get data augmentation transforms"""
    if train:
        return A.Compose([
            A.Resize(640, 640),
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(p=0.2),
            A.GaussNoise(p=0.1),
            A.Blur(blur_limit=3, p=0.1),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ], bbox_params=A.BboxParams(format='pascal_voc', label_fields=['labels']))
    else:
        return A.Compose([
            A.Resize(640, 640),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ], bbox_params=A.BboxParams(format='pascal_voc', label_fields=['labels']))


def train_yolov8_model(data_yaml_path: str, epochs: int = 20):
    """
    Train YOLOv8 model for thermal wildlife detection
    Optimized for faster training (20-30 min)
    """
    from ultralytics import YOLO
    
    # Initialize model
    model = YOLO('yolov8n.pt')  # Start with nano model
    
    # Train the model with optimized parameters
    results = model.train(
        data=data_yaml_path,
        epochs=epochs,
        imgsz=416,  # Reduced from 640 for faster training
        batch=32,   # Increased from 16 for faster batching
        name='thermal_wildlife_detection',
        device='0' if torch.cuda.is_available() else 'cpu',
        patience=10,  # Reduced from 50 for early stopping
        save=True,
        plots=True,
        val=True,
        cache=True,  # Cache images for faster loading
        workers=8    # Multi-threaded data loading
    )
    
    return model, results


def create_yolo_dataset(base_dir: str, output_dir: str):
    """
    Convert COCO format to YOLO format
    """
    base_path = Path(base_dir)
    output_path = Path(output_dir)
    
    images_dir = base_path / 'Images'
    annotations_file = base_path / 'Annotations' / 'coco_info.json'
    
    # Load COCO annotations
    with open(annotations_file, 'r') as f:
        coco_data = json.load(f)
    
    # Create output directories
    for split in ['train', 'val']:
        (output_path / 'images' / split).mkdir(parents=True, exist_ok=True)
        (output_path / 'labels' / split).mkdir(parents=True, exist_ok=True)
    
    # Get all images
    image_files = sorted(list(images_dir.glob('*.jpg')))
    
    # Use a subset for faster training (10% of data for quick testing)
    # For full training, comment out the next two lines
    subset_size = min(3000, len(image_files))
    image_files = image_files[:subset_size]
    print(f"Using {len(image_files)} images for faster training (from {len(sorted(list(images_dir.glob('*.jpg'))))} total)")
    
    # Create image id to annotations mapping
    image_annotations = {}
    for ann in coco_data['annotations']:
        img_id = ann['image_id']
        if img_id not in image_annotations:
            image_annotations[img_id] = []
        image_annotations[img_id].append(ann)
    
    # Split dataset (80% train, 20% val)
    split_idx = int(len(image_files) * 0.8)
    train_images = image_files[:split_idx]
    val_images = image_files[split_idx:]
    
    def process_split(image_list, split_name):
        for img_idx, img_path in enumerate(image_list):
            # Read image to get dimensions
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            
            h, w = img.shape[:2]
            
            # Copy image
            output_img_path = output_path / 'images' / split_name / img_path.name
            cv2.imwrite(str(output_img_path), img)
            
            # Get annotations
            annotations = image_annotations.get(img_idx if split_name == 'train' else img_idx + split_idx, [])
            
            # Create YOLO label file
            label_path = output_path / 'labels' / split_name / (img_path.stem + '.txt')
            with open(label_path, 'w') as f:
                for ann in annotations:
                    bbox = ann['bbox']  # [x, y, width, height]
                    x, y, box_w, box_h = bbox
                    
                    # Convert to YOLO format (normalized center x, center y, width, height)
                    x_center = (x + box_w / 2) / w
                    y_center = (y + box_h / 2) / h
                    norm_w = box_w / w
                    norm_h = box_h / h
                    
                    class_id = ann['category_id']
                    f.write(f"{class_id} {x_center} {y_center} {norm_w} {norm_h}\n")
    
    print("Processing training set...")
    process_split(train_images, 'train')
    
    print("Processing validation set...")
    process_split(val_images, 'val')
    
    # Create data.yaml file
    categories = {cat['id']: cat['name'] for cat in coco_data['categories']}
    data_yaml = {
        'path': str(output_path.absolute()),
        'train': 'images/train',
        'val': 'images/val',
        'nc': len(categories),
        'names': list(categories.values())
    }
    
    yaml_path = output_path / 'data.yaml'
    with open(yaml_path, 'w') as f:
        yaml.dump(data_yaml, f)
    
    print(f"Dataset prepared at: {output_path}")
    print(f"Data YAML created at: {yaml_path}")
    
    return str(yaml_path)


if __name__ == '__main__':
    # Configuration
    BASE_DIR = 'termalDetaset/wildlife termal detaset'
    OUTPUT_DIR = 'termalDetaset/yolo_dataset'
    EPOCHS = 20  # Reduced from 100 for faster training (20-30 min)
    
    print("=" * 50)
    print("Thermal Wildlife Detection Model Training")
    print("FAST MODE: 3000 images, 20 epochs, 416px")
    print("=" * 50)
    
    # Create YOLO format dataset
    print("\n[1/3] Converting COCO format to YOLO format...")
    data_yaml_path = create_yolo_dataset(BASE_DIR, OUTPUT_DIR)
    
    # Train model
    print("\n[2/3] Training YOLOv8 model...")
    try:
        model, results = train_yolov8_model(data_yaml_path, epochs=EPOCHS)
        print("\n[3/3] Training completed successfully!")
        print(f"Model saved to: runs/detect/thermal_wildlife_detection/weights/best.pt")
    except Exception as e:
        print(f"Error during training: {e}")
        print("Please ensure you have ultralytics installed: pip install ultralytics")
