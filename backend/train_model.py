"""
Leopard Detection Model Training Script
Binary Classification: Leopard vs Not Leopard
Uses Transfer Learning with MobileNetV2
"""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from pathlib import Path
import json
import numpy as np
from datetime import datetime

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.001

# Paths
SCRIPT_DIR = Path(__file__).parent
DATASET_DIR = SCRIPT_DIR / "prepared_dataset"
MODEL_DIR = SCRIPT_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

MODEL_PATH = MODEL_DIR / "leopard_detector.h5"
HISTORY_PATH = MODEL_DIR / "training_history.json"


def create_data_generators():
    """Create data generators with augmentation"""
    print("\n📊 Creating data generators...")
    
    # Training data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        shear_range=0.15,
        brightness_range=[0.8, 1.2],
        fill_mode='nearest'
    )
    
    # Validation/Test data (only rescaling)
    val_test_datagen = ImageDataGenerator(rescale=1./255)
    
    # Load datasets
    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR / 'train',
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        shuffle=True
    )
    
    val_generator = val_test_datagen.flow_from_directory(
        DATASET_DIR / 'val',
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        shuffle=False
    )
    
    test_generator = val_test_datagen.flow_from_directory(
        DATASET_DIR / 'test',
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        shuffle=False
    )
    
    print(f"✅ Training samples: {train_generator.samples}")
    print(f"✅ Validation samples: {val_generator.samples}")
    print(f"✅ Test samples: {test_generator.samples}")
    print(f"✅ Class indices: {train_generator.class_indices}")
    
    return train_generator, val_generator, test_generator


def create_model():
    """Create transfer learning model with MobileNetV2"""
    print("\n🏗️  Building model...")
    
    # Load pre-trained MobileNetV2
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Create model
    model = keras.Sequential([
        # Input
        layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3)),
        
        # Data augmentation layers (applied during training)
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
        
        # Pre-trained base
        base_model,
        
        # Custom classification head
        layers.GlobalAveragePooling2D(),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(1, activation='sigmoid')  # Binary classification
    ])
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall'),
            keras.metrics.AUC(name='auc')
        ]
    )
    
    print("✅ Model created successfully")
    print(f"\n📊 Model Summary:")
    print(f"   Total parameters: {model.count_params():,}")
    print(f"   Trainable parameters: {sum([tf.size(w).numpy() for w in model.trainable_weights]):,}")
    
    return model


def train_model(model, train_gen, val_gen):
    """Train the model"""
    print("\n🚀 Starting training...")
    print("=" * 60)
    
    # Callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ModelCheckpoint(
            MODEL_PATH,
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Train
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1
    )
    
    print("\n✅ Training complete!")
    return history


def fine_tune_model(model, train_gen, val_gen):
    """Fine-tune the model by unfreezing some layers"""
    print("\n🔧 Fine-tuning model...")
    
    # Unfreeze the last 20 layers of base model
    base_model = model.layers[3]  # MobileNetV2
    base_model.trainable = True
    
    # Freeze all layers except the last 20
    for layer in base_model.layers[:-20]:
        layer.trainable = False
    
    # Recompile with lower learning rate
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE / 10),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall'),
            keras.metrics.AUC(name='auc')
        ]
    )
    
    # Fine-tune
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        ModelCheckpoint(
            MODEL_PATH,
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        )
    ]
    
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=30,
        callbacks=callbacks,
        verbose=1
    )
    
    print("✅ Fine-tuning complete!")
    return history


def evaluate_model(model, test_gen):
    """Evaluate model on test set"""
    print("\n📈 Evaluating model on test set...")
    
    results = model.evaluate(test_gen, verbose=0)
    metrics = dict(zip(model.metrics_names, results))
    
    print("\n🎯 Test Results:")
    print(f"   Loss:      {metrics.get('loss', 0):.4f}")
    
    # Handle different metric names (binary_accuracy vs accuracy)
    accuracy_key = 'binary_accuracy' if 'binary_accuracy' in metrics else 'accuracy'
    if accuracy_key in metrics:
        print(f"   Accuracy:  {metrics[accuracy_key]:.4f}")
    
    if 'precision' in metrics:
        print(f"   Precision: {metrics['precision']:.4f}")
    if 'recall' in metrics:
        print(f"   Recall:    {metrics['recall']:.4f}")
    if 'auc' in metrics:
        print(f"   AUC:       {metrics['auc']:.4f}")
    
    return metrics


def save_training_history(history, fine_tune_history=None):
    """Save training history to JSON"""
    history_dict = {
        'initial_training': {
            'accuracy': [float(x) for x in history.history['accuracy']],
            'val_accuracy': [float(x) for x in history.history['val_accuracy']],
            'loss': [float(x) for x in history.history['loss']],
            'val_loss': [float(x) for x in history.history['val_loss']],
        }
    }
    
    if fine_tune_history:
        history_dict['fine_tuning'] = {
            'accuracy': [float(x) for x in fine_tune_history.history['accuracy']],
            'val_accuracy': [float(x) for x in fine_tune_history.history['val_accuracy']],
            'loss': [float(x) for x in fine_tune_history.history['loss']],
            'val_loss': [float(x) for x in fine_tune_history.history['val_loss']],
        }
    
    with open(HISTORY_PATH, 'w') as f:
        json.dump(history_dict, f, indent=2)
    
    print(f"\n💾 Training history saved to {HISTORY_PATH}")


def main():
    """Main training pipeline"""
    print("=" * 60)
    print("🐆 LEOPARD DETECTION MODEL TRAINING")
    print("=" * 60)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🖼️  Image size: {IMG_SIZE}x{IMG_SIZE}")
    print(f"📦 Batch size: {BATCH_SIZE}")
    print(f"🔄 Max epochs: {EPOCHS}")
    print(f"📚 Learning rate: {LEARNING_RATE}")
    
    # Check if prepared dataset exists
    if not DATASET_DIR.exists():
        print("\n❌ Error: Prepared dataset not found!")
        print(f"   Please run 'python prepare_dataset.py' first")
        return
    
    # Create data generators
    train_gen, val_gen, test_gen = create_data_generators()
    
    # Create model
    model = create_model()
    
    # Initial training
    history = train_model(model, train_gen, val_gen)
    
    # Fine-tuning (optional but recommended)
    fine_tune_history = fine_tune_model(model, train_gen, val_gen)
    
    # Evaluate on test set
    test_metrics = evaluate_model(model, test_gen)
    
    # Save training history
    save_training_history(history, fine_tune_history)
    
    # Save final metrics
    with open(MODEL_DIR / 'test_metrics.json', 'w') as f:
        json.dump(test_metrics, f, indent=2)
    
    print("\n" + "=" * 60)
    print("✅ TRAINING COMPLETE!")
    print(f"📁 Model saved to: {MODEL_PATH}")
    print(f"📊 History saved to: {HISTORY_PATH}")
    print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)


if __name__ == "__main__":
    main()
