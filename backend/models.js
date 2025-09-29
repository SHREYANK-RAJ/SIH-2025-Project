// Database Models for AI Crop Advisor
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['farmer', 'advisor', 'admin'],
        default: 'farmer'
    },
    phone: {
        type: String,
        trim: true
    },
    location: {
        address: String,
        city: String,
        state: String,
        country: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        pincode: String
    },
    farmSize: {
        type: Number,
        min: [0, 'Farm size cannot be negative']
    },
    language: {
        type: String,
        enum: ['english', 'hindi', 'bengali', 'telugu', 'tamil'],
        default: 'english'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    preferences: {
        notifications: {
            weather: { type: Boolean, default: true },
            market: { type: Boolean, default: true },
            reminders: { type: Boolean, default: true }
        },
        units: {
            temperature: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' },
            area: { type: String, enum: ['hectare', 'acre'], default: 'hectare' }
        }
    },
    subscription: {
        plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
        expiresAt: Date,
        features: [String]
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Farm Schema
const farmSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Farm name is required'],
        trim: true
    },
    area: {
        value: { type: Number, required: true, min: 0 },
        unit: { type: String, enum: ['hectare', 'acre'], default: 'hectare' }
    },
    location: {
        address: String,
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        elevation: Number
    },
    soilType: {
        type: String,
        enum: ['clay', 'sandy', 'loam', 'silt', 'peat', 'chalk'],
        required: true
    },
    irrigationType: {
        type: String,
        enum: ['rain-fed', 'drip', 'sprinkler', 'flood', 'furrow'],
        default: 'rain-fed'
    },
    currentCrops: [{
        cropName: String,
        variety: String,
        plantedDate: Date,
        expectedHarvestDate: Date,
        area: Number,
        status: { type: String, enum: ['planted', 'growing', 'flowering', 'harvested'], default: 'planted' }
    }],
    farmingPractices: {
        organic: { type: Boolean, default: false },
        sustainable: { type: Boolean, default: false },
        traditional: { type: Boolean, default: true }
    },
    equipment: [String],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Soil Analysis Schema
const soilAnalysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: true
    },
    testId: {
        type: String,
        unique: true,
        required: true
    },
    sampleLocation: {
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        description: String
    },
    nutrients: {
        nitrogen: { value: Number, unit: 'kg/ha', status: String },
        phosphorus: { value: Number, unit: 'kg/ha', status: String },
        potassium: { value: Number, unit: 'kg/ha', status: String },
        organicMatter: { value: Number, unit: '%', status: String },
        sulfur: { value: Number, unit: 'kg/ha', status: String },
        zinc: { value: Number, unit: 'mg/kg', status: String },
        iron: { value: Number, unit: 'mg/kg', status: String }
    },
    physicalProperties: {
        ph: { value: Number, status: String },
        electricalConductivity: { value: Number, unit: 'dS/m', status: String },
        moisture: { value: Number, unit: '%', status: String },
        temperature: { value: Number, unit: '°C' },
        bulk_density: { value: Number, unit: 'g/cm³' }
    },
    recommendations: [{
        parameter: String,
        currentValue: Number,
        optimalRange: String,
        suggestion: String,
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    }],
    testDate: {
        type: Date,
        default: Date.now
    },
    labInfo: {
        name: String,
        location: String,
        certificationNumber: String
    },
    reportFile: {
        filename: String,
        path: String,
        uploadDate: Date
    }
}, {
    timestamps: true
});

// Crop Recommendation Schema
const cropRecommendationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm'
    },
    inputParameters: {
        soilData: {
            nitrogen: Number,
            phosphorus: Number,
            potassium: Number,
            ph: Number,
            organicMatter: Number
        },
        weatherData: {
            temperature: Number,
            humidity: Number,
            rainfall: Number,
            season: String
        },
        farmingConditions: {
            area: Number,
            irrigationType: String,
            soilType: String,
            previousCrop: String
        }
    },
    recommendations: [{
        cropName: String,
        variety: String,
        confidenceScore: { type: Number, min: 0, max: 1 },
        yieldPrediction: {
            min: Number,
            max: Number,
            average: Number,
            unit: String
        },
        profitability: {
            estimatedRevenue: Number,
            estimatedCost: Number,
            expectedProfit: Number,
            roi: Number
        },
        sustainability: {
            carbonFootprint: Number,
            waterUsage: Number,
            soilHealth: String,
            biodiversityImpact: String
        },
        riskFactors: [{
            type: String,
            severity: String,
            mitigation: String
        }],
        timeline: {
            plantingWindow: { start: Date, end: Date },
            harvestWindow: { start: Date, end: Date },
            duration: Number
        },
        requirements: {
            seeds: { quantity: Number, unit: String, estimatedCost: Number },
            fertilizers: [{ name: String, quantity: Number, unit: String, cost: Number }],
            pesticides: [{ name: String, quantity: Number, unit: String, cost: Number }],
            irrigation: { frequency: String, amount: Number, unit: String }
        }
    }],
    modelInfo: {
        version: String,
        algorithm: String,
        accuracy: Number,
        trainingDate: Date
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'error'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Market Data Schema
const marketDataSchema = new mongoose.Schema({
    cropName: {
        type: String,
        required: true
    },
    variety: String,
    location: {
        market: String,
        city: String,
        state: String
    },
    prices: {
        minimum: Number,
        maximum: Number,
        average: Number,
        modal: Number,
        unit: String
    },
    volume: {
        arrivals: Number,
        unit: String
    },
    quality: {
        grade: String,
        moisture: Number,
        purity: Number
    },
    date: {
        type: Date,
        required: true
    },
    source: {
        type: String,
        enum: ['agmarknet', 'manual', 'api', 'scraping'],
        required: true
    }
}, {
    timestamps: true
});

// Sensor Data Schema
const sensorDataSchema = new mongoose.Schema({
    farmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: true
    },
    deviceId: {
        type: String,
        required: true
    },
    location: {
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        description: String
    },
    readings: {
        soilMoisture: { value: Number, unit: '%' },
        soilTemperature: { value: Number, unit: '°C' },
        soilPH: { value: Number },
        ambientTemperature: { value: Number, unit: '°C' },
        humidity: { value: Number, unit: '%' },
        lightIntensity: { value: Number, unit: 'lux' },
        windSpeed: { value: Number, unit: 'm/s' },
        precipitation: { value: Number, unit: 'mm' },
        atmosphericPressure: { value: Number, unit: 'hPa' }
    },
    batteryLevel: Number,
    signalStrength: Number,
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance', 'error'],
        default: 'active'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Weather Data Schema
const weatherDataSchema = new mongoose.Schema({
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        city: String,
        state: String,
        country: String
    },
    current: {
        temperature: Number,
        humidity: Number,
        pressure: Number,
        windSpeed: Number,
        windDirection: Number,
        visibility: Number,
        uvIndex: Number,
        precipitation: Number,
        cloudCover: Number,
        condition: String,
        description: String
    },
    forecast: [{
        date: Date,
        temperature: {
            min: Number,
            max: Number,
            average: Number
        },
        humidity: Number,
        precipitation: Number,
        windSpeed: Number,
        condition: String,
        description: String
    }],
    alerts: [{
        type: String,
        severity: String,
        description: String,
        startTime: Date,
        endTime: Date
    }],
    source: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create indexes for better performance
userSchema.index({ email: 1 });
farmSchema.index({ userId: 1 });
soilAnalysisSchema.index({ userId: 1, farmId: 1 });
cropRecommendationSchema.index({ userId: 1, createdAt: -1 });
marketDataSchema.index({ cropName: 1, date: -1 });
sensorDataSchema.index({ farmId: 1, timestamp: -1 });
weatherDataSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Export models
module.exports = {
    User: mongoose.model('User', userSchema),
    Farm: mongoose.model('Farm', farmSchema),
    SoilAnalysis: mongoose.model('SoilAnalysis', soilAnalysisSchema),
    CropRecommendation: mongoose.model('CropRecommendation', cropRecommendationSchema),
    MarketData: mongoose.model('MarketData', marketDataSchema),
    SensorData: mongoose.model('SensorData', sensorDataSchema),
    WeatherData: mongoose.model('WeatherData', weatherDataSchema)
};
