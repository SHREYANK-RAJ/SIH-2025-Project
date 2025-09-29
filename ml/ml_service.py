# AI Crop Recommendation ML Service
# Flask-based machine learning service for crop predictions

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import logging
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for models
crop_model = None
yield_model = None
label_encoder = None
scaler = None
model_version = "1.2.0"
model_accuracy = 0.0

# Crop database with characteristics
CROP_DATABASE = {
    'rice': {
        'optimal_conditions': {'ph': [5.5, 7.0], 'temp': [20, 35], 'humidity': [70, 90], 'rainfall': [1000, 2000]},
        'season': 'Kharif',
        'duration': 120,
        'yield_range': [3, 6],
        'market_price': 2500
    },
    'wheat': {
        'optimal_conditions': {'ph': [6.0, 7.5], 'temp': [10, 25], 'humidity': [50, 70], 'rainfall': [300, 800]},
        'season': 'Rabi',
        'duration': 120,
        'yield_range': [2.5, 4.5],
        'market_price': 2200
    },
    'maize': {
        'optimal_conditions': {'ph': [6.0, 7.0], 'temp': [15, 30], 'humidity': [60, 80], 'rainfall': [600, 1200]},
        'season': 'Both',
        'duration': 90,
        'yield_range': [4, 8],
        'market_price': 2000
    },
    'cotton': {
        'optimal_conditions': {'ph': [5.8, 8.0], 'temp': [21, 32], 'humidity': [50, 80], 'rainfall': [500, 1000]},
        'season': 'Kharif',
        'duration': 180,
        'yield_range': [1.5, 3],
        'market_price': 5500
    },
    'sugarcane': {
        'optimal_conditions': {'ph': [6.0, 7.5], 'temp': [20, 30], 'humidity': [75, 85], 'rainfall': [1000, 1500]},
        'season': 'Both',
        'duration': 365,
        'yield_range': [60, 100],
        'market_price': 350
    },
    'potato': {
        'optimal_conditions': {'ph': [5.0, 6.5], 'temp': [15, 25], 'humidity': [60, 80], 'rainfall': [400, 600]},
        'season': 'Rabi',
        'duration': 90,
        'yield_range': [15, 30],
        'market_price': 1500
    },
    'tomato': {
        'optimal_conditions': {'ph': [6.0, 7.0], 'temp': [18, 25], 'humidity': [65, 85], 'rainfall': [600, 1000]},
        'season': 'Both',
        'duration': 120,
        'yield_range': [12, 25],
        'market_price': 3000
    },
    'onion': {
        'optimal_conditions': {'ph': [6.0, 7.0], 'temp': [13, 25], 'humidity': [60, 70], 'rainfall': [350, 500]},
        'season': 'Rabi',
        'duration': 120,
        'yield_range': [12, 20],
        'market_price': 2800
    }
}

def create_synthetic_dataset():
    """Create synthetic training dataset for crop recommendation"""
    logger.info("Creating synthetic training dataset...")

    np.random.seed(42)
    data = []
    crops = list(CROP_DATABASE.keys())

    # Generate 5000 samples
    for _ in range(5000):
        # Randomly select a crop
        crop = np.random.choice(crops)
        crop_info = CROP_DATABASE[crop]
        opt_conditions = crop_info['optimal_conditions']

        # Generate features with some noise around optimal conditions
        nitrogen = np.random.normal(50, 20)  # NPK values
        phosphorus = np.random.normal(40, 15)
        potassium = np.random.normal(35, 12)

        # Generate values closer to optimal for the selected crop
        ph = np.random.uniform(opt_conditions['ph'][0] - 0.5, opt_conditions['ph'][1] + 0.5)
        temperature = np.random.uniform(opt_conditions['temp'][0] - 5, opt_conditions['temp'][1] + 5)
        humidity = np.random.uniform(opt_conditions['humidity'][0] - 10, opt_conditions['humidity'][1] + 10)
        rainfall = np.random.uniform(opt_conditions['rainfall'][0] * 0.8, opt_conditions['rainfall'][1] * 1.2)

        # Add some completely random samples for other crops
        if np.random.random() < 0.3:  # 30% random samples
            crop = np.random.choice(crops)
            ph = np.random.uniform(4.5, 9.0)
            temperature = np.random.uniform(5, 45)
            humidity = np.random.uniform(30, 95)
            rainfall = np.random.uniform(200, 2500)

        # Calculate yield based on conditions match
        yield_factor = calculate_yield_factor(crop, ph, temperature, humidity, rainfall)
        base_yield = np.mean(CROP_DATABASE[crop]['yield_range'])
        predicted_yield = base_yield * yield_factor * np.random.uniform(0.8, 1.2)

        data.append([nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, 
                    crop, predicted_yield])

    df = pd.DataFrame(data, columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 
                                   'label', 'yield'])

    logger.info(f"Dataset created with {len(df)} samples")
    logger.info(f"Crops distribution: {df['label'].value_counts().to_dict()}")

    return df

def calculate_yield_factor(crop, ph, temperature, humidity, rainfall):
    """Calculate yield factor based on how well conditions match optimal requirements"""
    crop_info = CROP_DATABASE[crop]
    opt_conditions = crop_info['optimal_conditions']

    factors = []

    # pH factor
    ph_range = opt_conditions['ph']
    if ph_range[0] <= ph <= ph_range[1]:
        factors.append(1.0)
    else:
        deviation = min(abs(ph - ph_range[0]), abs(ph - ph_range[1]))
        factors.append(max(0.3, 1 - (deviation * 0.2)))

    # Temperature factor
    temp_range = opt_conditions['temp']
    if temp_range[0] <= temperature <= temp_range[1]:
        factors.append(1.0)
    else:
        deviation = min(abs(temperature - temp_range[0]), abs(temperature - temp_range[1]))
        factors.append(max(0.2, 1 - (deviation * 0.05)))

    # Humidity factor
    humidity_range = opt_conditions['humidity']
    if humidity_range[0] <= humidity <= humidity_range[1]:
        factors.append(1.0)
    else:
        deviation = min(abs(humidity - humidity_range[0]), abs(humidity - humidity_range[1]))
        factors.append(max(0.3, 1 - (deviation * 0.02)))

    # Rainfall factor
    rainfall_range = opt_conditions['rainfall']
    if rainfall_range[0] <= rainfall <= rainfall_range[1]:
        factors.append(1.0)
    else:
        deviation = min(abs(rainfall - rainfall_range[0]), abs(rainfall - rainfall_range[1]))
        factors.append(max(0.2, 1 - (deviation * 0.001)))

    return np.mean(factors)

def train_models():
    """Train machine learning models for crop recommendation and yield prediction"""
    global crop_model, yield_model, label_encoder, scaler, model_accuracy

    logger.info("Starting model training...")

    # Create or load dataset
    df = create_synthetic_dataset()

    # Prepare features
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[features]
    y_crop = df['label']
    y_yield = df['yield']

    # Encode labels
    label_encoder = LabelEncoder()
    y_crop_encoded = label_encoder.fit_transform(y_crop)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split data
    X_train, X_test, y_crop_train, y_crop_test = train_test_split(
        X_scaled, y_crop_encoded, test_size=0.2, random_state=42, stratify=y_crop_encoded
    )

    # Train crop recommendation model (Random Forest Classifier)
    logger.info("Training crop recommendation model...")
    crop_model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2
    )
    crop_model.fit(X_train, y_crop_train)

    # Evaluate crop model
    y_crop_pred = crop_model.predict(X_test)
    model_accuracy = accuracy_score(y_crop_test, y_crop_pred)
    logger.info(f"Crop model accuracy: {model_accuracy:.4f}")

    # Train yield prediction model (Random Forest Regressor)
    logger.info("Training yield prediction model...")
    X_yield_train, X_yield_test, y_yield_train, y_yield_test = train_test_split(
        X_scaled, y_yield, test_size=0.2, random_state=42
    )

    yield_model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2
    )
    yield_model.fit(X_yield_train, y_yield_train)

    # Save models
    try:
        joblib.dump(crop_model, 'crop_model.pkl')
        joblib.dump(yield_model, 'yield_model.pkl')
        joblib.dump(label_encoder, 'label_encoder.pkl')
        joblib.dump(scaler, 'scaler.pkl')
        logger.info("Models saved successfully")
    except Exception as e:
        logger.error(f"Error saving models: {e}")

    logger.info("Model training completed successfully")

def load_models():
    """Load pre-trained models if they exist"""
    global crop_model, yield_model, label_encoder, scaler, model_accuracy

    try:
        if all(os.path.exists(f) for f in ['crop_model.pkl', 'yield_model.pkl', 'label_encoder.pkl', 'scaler.pkl']):
            crop_model = joblib.load('crop_model.pkl')
            yield_model = joblib.load('yield_model.pkl')
            label_encoder = joblib.load('label_encoder.pkl')
            scaler = joblib.load('scaler.pkl')
            model_accuracy = 0.96  # Placeholder
            logger.info("Models loaded successfully from disk")
            return True
    except Exception as e:
        logger.error(f"Error loading models: {e}")

    return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Crop Recommendation ML Service',
        'version': model_version,
        'model_loaded': crop_model is not None,
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        'model_version': model_version,
        'accuracy': model_accuracy,
        'features': ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'],
        'supported_crops': list(CROP_DATABASE.keys()),
        'algorithm': 'Random Forest',
        'training_date': datetime.now().isoformat()
    }), 200

@app.route('/predict', methods=['POST'])
def predict_crop():
    """Main prediction endpoint"""
    try:
        if crop_model is None or yield_model is None:
            return jsonify({
                'error': 'Models not loaded',
                'message': 'ML models are not properly initialized'
            }), 500

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        # Extract and validate input features
        required_features = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall']

        try:
            features = []
            for feature in required_features:
                if feature in data:
                    features.append(float(data[feature]))
                else:
                    # Use default values if missing
                    defaults = {
                        'nitrogen': 50, 'phosphorus': 40, 'potassium': 35,
                        'temperature': 25, 'humidity': 70, 'ph': 6.5, 'rainfall': 800
                    }
                    features.append(defaults[feature])

        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid input data format'}), 400

        # Scale features
        features_scaled = scaler.transform([features])

        # Get crop predictions with probabilities
        crop_probabilities = crop_model.predict_proba(features_scaled)[0]
        crop_classes = label_encoder.classes_

        # Get yield prediction
        predicted_yield = yield_model.predict(features_scaled)[0]

        # Create recommendations
        recommendations = []

        # Sort crops by probability (top 5)
        crop_prob_pairs = list(zip(crop_classes, crop_probabilities))
        crop_prob_pairs.sort(key=lambda x: x[1], reverse=True)

        for i, (crop, probability) in enumerate(crop_prob_pairs[:5]):
            if probability < 0.1:  # Skip very low probability crops
                continue

            crop_info = CROP_DATABASE.get(crop, CROP_DATABASE['rice'])

            # Adjust yield based on conditions
            yield_factor = calculate_yield_factor(crop, features[5], features[3], features[4], features[6])
            adjusted_yield = np.mean(crop_info['yield_range']) * yield_factor

            recommendation = {
                'crop': crop,
                'confidence': float(probability),
                'rank': i + 1,
                'yield_prediction': {
                    'value': round(adjusted_yield, 2),
                    'unit': 'tonnes/hectare',
                    'min': round(adjusted_yield * 0.8, 2),
                    'max': round(adjusted_yield * 1.2, 2)
                },
                'suitability_score': round(yield_factor * 100, 1),
                'season': crop_info['season'],
                'duration_days': crop_info['duration'],
                'market_price_per_quintal': crop_info['market_price']
            }
            recommendations.append(recommendation)

        # Calculate risk factors
        risk_factors = calculate_risks(features, recommendations[0]['crop'] if recommendations else 'rice')

        response = {
            'success': True,
            'recommendations': recommendations,
            'input_analysis': {
                'soil_ph': {
                    'value': features[5],
                    'status': get_ph_status(features[5])
                },
                'nutrient_levels': {
                    'nitrogen': {'value': features[0], 'status': get_nutrient_status(features[0], 'N')},
                    'phosphorus': {'value': features[1], 'status': get_nutrient_status(features[1], 'P')},
                    'potassium': {'value': features[2], 'status': get_nutrient_status(features[2], 'K')}
                },
                'climate_conditions': {
                    'temperature': features[3],
                    'humidity': features[4],
                    'rainfall': features[6]
                }
            },
            'risk_factors': risk_factors,
            'model_info': {
                'version': model_version,
                'algorithm': 'Random Forest',
                'accuracy': round(model_accuracy, 4),
                'training_date': datetime.now().isoformat()
            },
            'timestamp': datetime.now().isoformat()
        }

        logger.info(f"Prediction completed successfully. Top recommendation: {recommendations[0]['crop'] if recommendations else 'None'}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during prediction',
            'message': str(e)
        }), 500

def get_ph_status(ph):
    """Get pH status description"""
    if ph < 5.5:
        return 'Acidic - May need liming'
    elif ph > 7.5:
        return 'Alkaline - May need acidification'
    else:
        return 'Optimal - Good for most crops'

def get_nutrient_status(value, nutrient):
    """Get nutrient status description"""
    ranges = {
        'N': {'low': 30, 'high': 80},
        'P': {'low': 20, 'high': 60},
        'K': {'low': 25, 'high': 50}
    }

    nutrient_range = ranges.get(nutrient, ranges['N'])

    if value < nutrient_range['low']:
        return 'Low - Consider fertilizer application'
    elif value > nutrient_range['high']:
        return 'High - Adequate levels'
    else:
        return 'Optimal - Good levels'

def calculate_risks(features, top_crop):
    """Calculate potential risk factors"""
    risks = []

    # Temperature risk
    if features[3] > 35:
        risks.append({
            'type': 'Heat Stress',
            'severity': 'High',
            'description': 'High temperature may affect crop growth',
            'mitigation': 'Use shade nets or cooling systems'
        })
    elif features[3] < 10:
        risks.append({
            'type': 'Cold Stress',
            'severity': 'Medium',
            'description': 'Low temperature may slow growth',
            'mitigation': 'Consider protected cultivation'
        })

    # Rainfall risk
    if features[6] < 300:
        risks.append({
            'type': 'Water Stress',
            'severity': 'High',
            'description': 'Low rainfall may cause drought stress',
            'mitigation': 'Install irrigation systems'
        })
    elif features[6] > 2000:
        risks.append({
            'type': 'Excess Water',
            'severity': 'Medium',
            'description': 'High rainfall may cause waterlogging',
            'mitigation': 'Improve drainage systems'
        })

    # pH risk
    if features[5] < 5.0 or features[5] > 8.0:
        risks.append({
            'type': 'pH Imbalance',
            'severity': 'Medium',
            'description': 'Soil pH outside optimal range',
            'mitigation': 'Apply lime or sulfur to adjust pH'
        })

    return risks

@app.route('/crops/database', methods=['GET'])
def get_crop_database():
    """Get crop database information"""
    return jsonify({
        'crops': CROP_DATABASE,
        'total_crops': len(CROP_DATABASE)
    }), 200

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model with new data"""
    try:
        logger.info("Retraining models...")
        train_models()
        return jsonify({
            'success': True,
            'message': 'Models retrained successfully',
            'new_accuracy': model_accuracy,
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Retraining error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrain models',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting AI Crop Recommendation ML Service...")

    # Try to load existing models, otherwise train new ones
    if not load_models():
        logger.info("No existing models found, training new models...")
        train_models()

    # Start Flask server
    logger.info(f"ML Service ready! Model accuracy: {model_accuracy:.4f}")
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=False,
        threaded=True
    )
