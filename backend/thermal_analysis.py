"""
Thermal Stress Index (TSI) Calculation Module
Implements thermal analysis for wildlife health assessment
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import json


class HealthStatus(Enum):
    """Health status classification based on TSI"""
    NORMAL = "Normal"
    MILD_STRESS = "Mild Stress"
    MODERATE_STRESS = "Moderate Stress"
    CRITICAL_STRESS = "Critical Stress"


@dataclass
class ThermalRegion:
    """Represents a thermal region of interest"""
    name: str
    bbox: Tuple[int, int, int, int]  # (x1, y1, x2, y2)
    temperatures: np.ndarray
    mean_temp: float
    min_temp: float
    max_temp: float
    std_temp: float


@dataclass
class ThermalAnalysisResult:
    """Results of thermal analysis"""
    tsi: float
    health_status: HealthStatus
    leopard_mean_temp: float
    background_mean_temp: float
    regions: List[ThermalRegion]
    bilateral_asymmetry: Dict[str, float]
    anomalies: List[str]
    recommendations: List[str]
    confidence: float


class ThermalStressAnalyzer:
    """
    Analyzes thermal images to compute Thermal Stress Index (TSI)
    and assess animal health status
    """
    
    # TSI thresholds for health classification
    TSI_THRESHOLDS = {
        'normal': 0.05,  # TSI < 0.05
        'mild': 0.10,    # 0.05 <= TSI < 0.10
        'moderate': 0.15,  # 0.10 <= TSI < 0.15
        'critical': float('inf')  # TSI >= 0.15
    }
    
    # Normal temperature ranges (in Celsius) for leopards
    NORMAL_TEMP_RANGE = {
        'head': (36.0, 38.5),
        'torso': (35.5, 37.8),
        'limbs': (34.0, 36.5),
        'eyes': (36.5, 38.0)
    }
    
    # Bilateral asymmetry threshold (degrees Celsius)
    ASYMMETRY_THRESHOLD = 1.5
    
    def __init__(self):
        """Initialize thermal stress analyzer"""
        pass
    
    def extract_temperatures(self, thermal_image: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
        """
        Extract temperature values from a thermal image region
        
        Args:
            thermal_image: Thermal image (grayscale or BGR)
            bbox: Bounding box (x1, y1, x2, y2)
        
        Returns:
            Array of temperature values
        """
        x1, y1, x2, y2 = bbox
        
        # Ensure coordinates are within image bounds
        h, w = thermal_image.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        # Extract region
        region = thermal_image[y1:y2, x1:x2]
        
        # Convert to grayscale if needed
        if len(region.shape) == 3:
            region = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        
        # Normalize to temperature range (assuming 0-255 maps to 20°C-45°C)
        # This is a simplified conversion - actual thermal cameras provide real temps
        temperatures = 20.0 + (region.astype(float) / 255.0) * 25.0
        
        return temperatures
    
    def identify_anatomical_regions(self, bbox: Tuple[int, int, int, int]) -> Dict[str, Tuple[int, int, int, int]]:
        """
        Divide animal bounding box into anatomical regions
        
        Args:
            bbox: Animal bounding box (x1, y1, x2, y2)
        
        Returns:
            Dictionary of region names to bounding boxes
        """
        x1, y1, x2, y2 = bbox
        w = x2 - x1
        h = y2 - y1
        
        regions = {
            'head': (x1, y1, x1 + int(w * 0.3), y1 + int(h * 0.3)),
            # 'torso': (x1 + int(w * 0.2), y1 + int(h * 0.25), x2 - int(w * 0.2), y2 - int(h * 0.3)),
            # 'left_limb': (x1, y1 + int(h * 0.5), x1 + int(w * 0.25), y2),
            # 'right_limb': (x2 - int(w * 0.25), y1 + int(h * 0.5), x2, y2),
            # 'ocular': (x1 + int(w * 0.1), y1, x1 + int(w * 0.25), y1 + int(h * 0.15))
        }
        
        return regions
    
    def calculate_tsi(self, leopard_temp: float, background_temp: float) -> float:
        """
        Calculate Thermal Stress Index (TSI)
        
        TSI = (T_leopard - T_background) / T_background
        
        Args:
            leopard_temp: Average body temperature of leopard (°C)
            background_temp: Average background temperature (°C)
        
        Returns:
            Thermal Stress Index value
        """
        if background_temp == 0:
            return 0.0
        
        tsi = (leopard_temp - background_temp) / background_temp
        return abs(tsi)  # Use absolute value for stress indication
    
    def classify_health_status(self, tsi: float) -> HealthStatus:
        """
        Classify health status based on TSI value
        
        Args:
            tsi: Thermal Stress Index
        
        Returns:
            Health status classification
        """
        if tsi < self.TSI_THRESHOLDS['normal']:
            return HealthStatus.NORMAL
        elif tsi < self.TSI_THRESHOLDS['mild']:
            return HealthStatus.MILD_STRESS
        elif tsi < self.TSI_THRESHOLDS['moderate']:
            return HealthStatus.MODERATE_STRESS
        else:
            return HealthStatus.CRITICAL_STRESS
    
    def detect_bilateral_asymmetry(self, regions: Dict[str, ThermalRegion]) -> Dict[str, float]:
        """
        Detect bilateral temperature asymmetry
        
        Args:
            regions: Dictionary of thermal regions
        
        Returns:
            Dictionary of asymmetry measurements
        """
        asymmetry = {}
        
        # Check limb asymmetry
        if 'left_limb' in regions and 'right_limb' in regions:
            left_temp = regions['left_limb'].mean_temp
            right_temp = regions['right_limb'].mean_temp
            asymmetry['limbs'] = abs(left_temp - right_temp)
        
        return asymmetry
    
    def detect_anomalies(self, regions: Dict[str, ThermalRegion], 
                        bilateral_asymmetry: Dict[str, float]) -> List[str]:
        """
        Detect thermal anomalies indicating potential health issues
        
        Args:
            regions: Dictionary of thermal regions
            bilateral_asymmetry: Bilateral asymmetry measurements
        
        Returns:
            List of detected anomalies
        """
        anomalies = []
        
        # Check regional temperatures against normal ranges
        for region_name, region in regions.items():
            base_name = region_name.replace('left_', '').replace('right_', '')
            if base_name in self.NORMAL_TEMP_RANGE:
                min_normal, max_normal = self.NORMAL_TEMP_RANGE[base_name]
                if region.mean_temp < min_normal:
                    anomalies.append(f"Low temperature in {region_name}: {region.mean_temp:.1f}°C (normal: {min_normal}-{max_normal}°C)")
                elif region.mean_temp > max_normal:
                    anomalies.append(f"Elevated temperature in {region_name}: {region.mean_temp:.1f}°C (normal: {min_normal}-{max_normal}°C)")
        
        # Check bilateral asymmetry
        for region_pair, asymmetry_value in bilateral_asymmetry.items():
            if asymmetry_value > self.ASYMMETRY_THRESHOLD:
                anomalies.append(f"Significant bilateral asymmetry in {region_pair}: {asymmetry_value:.2f}°C difference")
        
        return anomalies
    
    def generate_recommendations(self, health_status: HealthStatus, 
                                 anomalies: List[str]) -> List[str]:
        """
        Generate health recommendations based on analysis
        
        Args:
            health_status: Classified health status
            anomalies: List of detected anomalies
        
        Returns:
            List of recommendations
        """
        recommendations = []
        
        if health_status == HealthStatus.NORMAL:
            recommendations.append("Animal shows normal thermal profile")
            recommendations.append("Suitable for release consideration")
        elif health_status == HealthStatus.MILD_STRESS:
            recommendations.append("Mild physiological stress detected")
            recommendations.append("Monitor for 24-48 hours before release")
            recommendations.append("Ensure adequate hydration and nutrition")
        elif health_status == HealthStatus.MODERATE_STRESS:
            recommendations.append("Moderate stress levels detected")
            recommendations.append("Delay release for 3-7 days")
            recommendations.append("Conduct veterinary examination")
            recommendations.append("Review environmental conditions in enclosure")
        else:  # CRITICAL_STRESS
            recommendations.append("Critical stress levels - DO NOT RELEASE")
            recommendations.append("Immediate veterinary intervention required")
            recommendations.append("Conduct comprehensive health assessment")
            recommendations.append("Extended rehabilitation period recommended")
        
        # Add anomaly-specific recommendations
        if any('elevated temperature' in a.lower() for a in anomalies):
            recommendations.append("Investigate potential inflammation or infection")
        
        if any('low temperature' in a.lower() for a in anomalies):
            recommendations.append("Check for circulation issues or hypothermia")
        
        if any('asymmetry' in a.lower() for a in anomalies):
            recommendations.append("Investigate potential injury or localized pathology")
        
        return recommendations
    
    def analyze_thermal_image(self, thermal_image: np.ndarray, 
                             leopard_bbox: Tuple[int, int, int, int],
                             background_bbox: Optional[Tuple[int, int, int, int]] = None) -> ThermalAnalysisResult:
        """
        Perform complete thermal analysis on an image
        
        Args:
            thermal_image: Thermal image (grayscale or BGR)
            leopard_bbox: Bounding box of leopard (x1, y1, x2, y2)
            background_bbox: Background region for temperature reference
        
        Returns:
            ThermalAnalysisResult containing complete analysis
        """
        # Extract anatom regions
        anatomical_regions = self.identify_anatomical_regions(leopard_bbox)
        
        # Analyze each region
        thermal_regions = {}
        for region_name, region_bbox in anatomical_regions.items():
            temps = self.extract_temperatures(thermal_image, region_bbox)
            
            thermal_regions[region_name] = ThermalRegion(
                name=region_name,
                bbox=region_bbox,
                temperatures=temps,
                mean_temp=np.mean(temps),
                min_temp=np.min(temps),
                max_temp=np.max(temps),
                std_temp=np.std(temps)
            )
        
        # Calculate overall leopard temperature
        leopard_temps = self.extract_temperatures(thermal_image, leopard_bbox)
        leopard_mean_temp = np.mean(leopard_temps)
        
        # Calculate background temperature
        if background_bbox is None:
            # Use image corners as background
            h, w = thermal_image.shape[:2]
            background_bbox = (0, 0, w, int(h * 0.1))  # Top 10% of image
        
        background_temps = self.extract_temperatures(thermal_image, background_bbox)
        background_mean_temp = np.mean(background_temps)
        
        # Calculate TSI
        tsi = self.calculate_tsi(leopard_mean_temp, background_mean_temp)
        
        # Classify health status
        health_status = self.classify_health_status(tsi)
        
        # Detect bilateral asymmetry
        bilateral_asymmetry = self.detect_bilateral_asymmetry(thermal_regions)
        
        # Detect anomalies
        anomalies = self.detect_anomalies(thermal_regions, bilateral_asymmetry)
        
        # Generate recommendations
        recommendations = self.generate_recommendations(health_status, anomalies)
        
        # Calculate confidence based on image quality and detection clarity
        confidence = self._calculate_confidence(thermal_image, leopard_bbox, thermal_regions)
        
        return ThermalAnalysisResult(
            tsi=tsi,
            health_status=health_status,
            leopard_mean_temp=leopard_mean_temp,
            background_mean_temp=background_mean_temp,
            regions=list(thermal_regions.values()),
            bilateral_asymmetry=bilateral_asymmetry,
            anomalies=anomalies,
            recommendations=recommendations,
            confidence=confidence
        )
    
    def _calculate_confidence(self, thermal_image: np.ndarray, 
                             leopard_bbox: Tuple[int, int, int, int],
                             regions: Dict[str, ThermalRegion]) -> float:
        """
        Calculate confidence score for the analysis
        
        Args:
            thermal_image: Thermal image
            leopard_bbox: Leopard bounding box
            regions: Analyzed thermal regions
        
        Returns:
            Confidence score (0-1)
        """
        # Factors affecting confidence:
        # 1. Image quality (contrast, clarity)
        # 2. Detection size (larger = more reliable)
        # 3. Temperature variation (too uniform might indicate poor quality)
        
        x1, y1, x2, y2 = leopard_bbox
        roi = thermal_image[y1:y2, x1:x2]
        
        if len(roi.shape) == 3:
            roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Image contrast
        contrast = np.std(roi) / 255.0
        contrast_score = min(contrast * 5, 1.0)
        
        # Detection size
        img_area = thermal_image.shape[0] * thermal_image.shape[1]
        bbox_area = (x2 - x1) * (y2 - y1)
        size_ratio = bbox_area / img_area
        size_score = min(size_ratio * 10, 1.0)
        
        # Temperature variation
        temp_range = max(r.max_temp - r.min_temp for r in regions.values())
        variation_score = min(temp_range / 10.0, 1.0)
        
        # Weighted average
        confidence = (contrast_score * 0.4 + size_score * 0.3 + variation_score * 0.3)
        
        return round(confidence, 2)
    
    def generate_report_dict(self, result: ThermalAnalysisResult) -> Dict:
        """
        Convert analysis result to dictionary for JSON serialization
        
        Args:
            result: Thermal analysis result
        
        Returns:
            Dictionary representation
        """
        return {
            'tsi': round(result.tsi, 4),
            'health_status': result.health_status.value,
            'leopard_mean_temp': round(result.leopard_mean_temp, 2),
            'background_mean_temp': round(result.background_mean_temp, 2),
            'regions': [
                {
                    'name': r.name,
                    'mean_temp': round(r.mean_temp, 2),
                    'min_temp': round(r.min_temp, 2),
                    'max_temp': round(r.max_temp, 2),
                    'std_temp': round(r.std_temp, 2)
                }
                for r in result.regions
            ],
            'bilateral_asymmetry': {k: round(v, 2) for k, v in result.bilateral_asymmetry.items()},
            'anomalies': result.anomalies,
            'recommendations': result.recommendations,
            'confidence': result.confidence,
            'release_recommended': result.health_status in [HealthStatus.NORMAL, HealthStatus.MILD_STRESS]
        }


# Example usage
if __name__ == '__main__':
    # Example: Analyze a thermal image
    analyzer = ThermalStressAnalyzer()
    
    # Load thermal image
    thermal_image = cv2.imread('path/to/thermal/image.jpg')
    
    # Define leopard bounding box (you would get this from your detection model)
    leopard_bbox = (100, 100, 400, 500)
    
    # Perform analysis
    result = analyzer.analyze_thermal_image(thermal_image, leopard_bbox)
    
    # Print results
    print(f"TSI: {result.tsi:.4f}")
    print(f"Health Status: {result.health_status.value}")
    print(f"Leopard Mean Temperature: {result.leopard_mean_temp:.2f}°C")
    print(f"Confidence: {result.confidence:.2f}")
    print("\nAnomalies:")
    for anomaly in result.anomalies:
        print(f"  - {anomaly}")
    print("\nRecommendations:")
    for rec in result.recommendations:
        print(f"  - {rec}")
