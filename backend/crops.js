// Crop Recommendation Routes with ML Service Integration
const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { CropRecommendation, User, Farm } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * @swagger
 * components:
 *   schemas:
 *     CropRecommendationRequest:
 *       type: object
 *       required:
 *         - soilData
 *         - weatherData
 *       properties:
 *         soilData:
 *           type: object
 *           properties:
 *             nitrogen:
 *               type: number
 *             phosphorus:
 *               type: number
 *             potassium:
 *               type: number
 *             ph:
 *               type: number
 *             organicMatter:
 *               type: number
 *         weatherData:
 *           type: object
 *           properties:
 *             temperature:
 *               type: number
 *             humidity:
 *               type: number
 *             rainfall:
 *               type: number
 *             season:
 *               type: string
 *         farmingConditions:
 *           type: object
 *           properties:
 *             area:
 *               type: number
 *             irrigationType:
 *               type: string
 *             soilType:
 *               type: string
 */

/**
 * @swagger
 * /api/crops/recommend:
 *   post:
 *     summary: Get AI-powered crop recommendations
 *     tags: [Crops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CropRecommendationRequest'
 */
router.post('/recommend', [
    auth,
    body('soilData').isObject().withMessage('Soil data is required'),
    body('soilData.nitrogen').isNumeric().withMessage('Nitrogen value must be numeric'),
    body('soilData.phosphorus').isNumeric().withMessage('Phosphorus value must be numeric'),
    body('soilData.potassium').isNumeric().withMessage('Potassium value must be numeric'),
    body('soilData.ph').isFloat({ min: 0, max: 14 }).withMessage('pH must be between 0 and 14'),
    body('weatherData').isObject().withMessage('Weather data is required'),
    body('weatherData.temperature').isNumeric().withMessage('Temperature must be numeric'),
    body('weatherData.humidity').isNumeric().withMessage('Humidity must be numeric'),
    body('weatherData.rainfall').isNumeric().withMessage('Rainfall must be numeric')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { soilData, weatherData, farmingConditions = {} } = req.body;
        const userId = req.user.userId;

        // Create initial recommendation record
        const recommendation = new CropRecommendation({
            userId,
            farmId: farmingConditions.farmId || null,
            inputParameters: {
                soilData,
                weatherData,
                farmingConditions
            },
            status: 'processing'
        });

        await recommendation.save();

        try {
            // Prepare data for ML service
            const mlInputData = {
                nitrogen: soilData.nitrogen,
                phosphorus: soilData.phosphorus,
                potassium: soilData.potassium,
                ph: soilData.ph,
                temperature: weatherData.temperature,
                humidity: weatherData.humidity,
                rainfall: weatherData.rainfall,
                organic_matter: soilData.organicMatter || 2.5,
                soil_type: farmingConditions.soilType || 'loam',
                irrigation_type: farmingConditions.irrigationType || 'rain-fed',
                area: farmingConditions.area || 1,
                season: weatherData.season || getCurrentSeason(),
                location: {
                    latitude: farmingConditions.latitude || 23.3441,
                    longitude: farmingConditions.longitude || 85.3096
                }
            };

            // Call ML service
            logger.info(`Calling ML service for crop recommendation: ${ML_SERVICE_URL}/predict`);

            const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, mlInputData, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });

            const mlResults = mlResponse.data;

            // Process ML results and add business logic
            const processedRecommendations = await processMLRecommendations(mlResults, mlInputData);

            // Update recommendation with results
            recommendation.recommendations = processedRecommendations;
            recommendation.modelInfo = {
                version: mlResults.model_version || '1.0',
                algorithm: mlResults.algorithm || 'Random Forest',
                accuracy: mlResults.accuracy || 0.92,
                trainingDate: new Date(mlResults.training_date || Date.now())
            };
            recommendation.status = 'completed';
            await recommendation.save();

            logger.info(`Crop recommendation completed for user ${userId}`);

            res.json({
                success: true,
                message: 'Crop recommendations generated successfully',
                data: {
                    recommendationId: recommendation._id,
                    recommendations: processedRecommendations,
                    modelInfo: recommendation.modelInfo,
                    inputParameters: recommendation.inputParameters,
                    generatedAt: recommendation.createdAt
                }
            });

        } catch (mlError) {
            // Update recommendation status to error
            recommendation.status = 'error';
            await recommendation.save();

            logger.error('ML service error:', mlError.message);

            // Fallback to rule-based recommendations
            const fallbackRecommendations = await generateFallbackRecommendations(soilData, weatherData, farmingConditions);

            res.json({
                success: true,
                message: 'Recommendations generated using fallback method',
                data: {
                    recommendationId: recommendation._id,
                    recommendations: fallbackRecommendations,
                    fallback: true,
                    warning: 'AI service temporarily unavailable, using rule-based recommendations'
                }
            });
        }

    } catch (error) {
        logger.error('Crop recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate crop recommendations'
        });
    }
});

// Process ML recommendations and add business logic
async function processMLRecommendations(mlResults, inputData) {
    const recommendations = [];

    // Handle different ML service response formats
    const crops = mlResults.recommendations || mlResults.crops || [mlResults];

    for (const crop of crops.slice(0, 5)) { // Top 5 recommendations
        const cropName = crop.crop || crop.name || 'Unknown';
        const confidence = crop.confidence || crop.probability || 0.8;

        // Add business intelligence
        const businessData = await enrichWithBusinessData(cropName, inputData);

        const processedCrop = {
            cropName,
            variety: crop.variety || await getSuggestedVariety(cropName, inputData.location),
            confidenceScore: confidence,
            yieldPrediction: {
                min: businessData.yield.min,
                max: businessData.yield.max,
                average: businessData.yield.average,
                unit: 'tonnes/hectare'
            },
            profitability: {
                estimatedRevenue: businessData.revenue,
                estimatedCost: businessData.cost,
                expectedProfit: businessData.profit,
                roi: Math.round((businessData.profit / businessData.cost) * 100)
            },
            sustainability: {
                carbonFootprint: businessData.carbon_footprint || 2.5,
                waterUsage: businessData.water_usage || 500,
                soilHealth: businessData.soil_health || 'Neutral',
                biodiversityImpact: businessData.biodiversity || 'Low'
            },
            riskFactors: await identifyRiskFactors(cropName, inputData),
            timeline: await getCropTimeline(cropName, inputData.season),
            requirements: await getCropRequirements(cropName, inputData.area)
        };

        recommendations.push(processedCrop);
    }

    return recommendations;
}

// Generate fallback recommendations when ML service is unavailable
async function generateFallbackRecommendations(soilData, weatherData, farmingConditions) {
    const fallbackRules = {
        'rice': { ph: [5.5, 7.0], temp: [20, 35], humidity: [70, 90] },
        'wheat': { ph: [6.0, 7.5], temp: [10, 25], humidity: [50, 70] },
        'maize': { ph: [6.0, 7.0], temp: [15, 30], humidity: [60, 80] },
        'potato': { ph: [5.0, 6.5], temp: [15, 25], humidity: [60, 80] },
        'tomato': { ph: [6.0, 7.0], temp: [18, 25], humidity: [65, 85] }
    };

    const recommendations = [];

    for (const [cropName, requirements] of Object.entries(fallbackRules)) {
        let score = 0;

        // Calculate suitability score
        if (soilData.ph >= requirements.ph[0] && soilData.ph <= requirements.ph[1]) score += 0.3;
        if (weatherData.temperature >= requirements.temp[0] && weatherData.temperature <= requirements.temp[1]) score += 0.3;
        if (weatherData.humidity >= requirements.humidity[0] && weatherData.humidity <= requirements.humidity[1]) score += 0.3;

        if (score >= 0.6) { // Only recommend if score is decent
            const businessData = await enrichWithBusinessData(cropName, farmingConditions);

            recommendations.push({
                cropName,
                variety: await getSuggestedVariety(cropName, farmingConditions.location),
                confidenceScore: score,
                yieldPrediction: {
                    min: businessData.yield.min,
                    max: businessData.yield.max,
                    average: businessData.yield.average,
                    unit: 'tonnes/hectare'
                },
                profitability: businessData.profitability || {
                    estimatedRevenue: 50000,
                    estimatedCost: 30000,
                    expectedProfit: 20000,
                    roi: 67
                },
                note: 'Generated using rule-based fallback system'
            });
        }
    }

    return recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 3);
}

// Helper functions
async function enrichWithBusinessData(cropName, inputData) {
    // This would typically fetch from market data APIs or databases
    const mockData = {
        rice: { 
            yield: { min: 3, max: 6, average: 4.5 },
            revenue: 112500, cost: 45000, profit: 67500,
            carbon_footprint: 3.2, water_usage: 1200
        },
        wheat: { 
            yield: { min: 2.5, max: 4.5, average: 3.5 },
            revenue: 77000, cost: 35000, profit: 42000,
            carbon_footprint: 2.8, water_usage: 800
        },
        maize: { 
            yield: { min: 4, max: 8, average: 6 },
            revenue: 120000, cost: 40000, profit: 80000,
            carbon_footprint: 2.5, water_usage: 600
        },
        potato: { 
            yield: { min: 15, max: 30, average: 22 },
            revenue: 330000, cost: 120000, profit: 210000,
            carbon_footprint: 1.8, water_usage: 400
        },
        tomato: { 
            yield: { min: 12, max: 25, average: 18 },
            revenue: 540000, cost: 180000, profit: 360000,
            carbon_footprint: 2.2, water_usage: 800
        }
    };

    return mockData[cropName.toLowerCase()] || mockData.rice;
}

async function getSuggestedVariety(cropName, location) {
    // This would fetch variety recommendations based on location and conditions
    const varieties = {
        rice: ['Basmati 370', 'IR64', 'Swarna', 'MTU 1010'],
        wheat: ['HD 2967', 'PBW 343', 'WH 542', 'DBW 88'],
        maize: ['Pioneer 30V92', 'DKC 9144', 'Hishell', 'P3396'],
        potato: ['Kufri Jyoti', 'Kufri Pukhraj', 'Kufri Chipsona', 'Kufri Bahar'],
        tomato: ['Pusa Ruby', 'Arka Rakshak', 'Himsona', 'Kashi Vishesh']
    };

    const cropVarieties = varieties[cropName.toLowerCase()] || ['Standard'];
    return cropVarieties[Math.floor(Math.random() * cropVarieties.length)];
}

async function identifyRiskFactors(cropName, inputData) {
    // Identify potential risks based on crop and conditions
    const risks = [];

    if (inputData.rainfall < 500) {
        risks.push({
            type: 'Water Stress',
            severity: 'Medium',
            mitigation: 'Install drip irrigation system'
        });
    }

    if (inputData.temperature > 35) {
        risks.push({
            type: 'Heat Stress',
            severity: 'High',
            mitigation: 'Use shade nets and cooling systems'
        });
    }

    return risks;
}

async function getCropTimeline(cropName, season) {
    // Return planting and harvest timelines
    const timelines = {
        rice: { planting: [6, 7], harvest: [10, 11], duration: 120 },
        wheat: { planting: [11, 12], harvest: [3, 4], duration: 120 },
        maize: { planting: [6, 7], harvest: [9, 10], duration: 90 }
    };

    const timeline = timelines[cropName.toLowerCase()] || timelines.rice;

    return {
        plantingWindow: {
            start: new Date(2024, timeline.planting[0] - 1, 1),
            end: new Date(2024, timeline.planting[1] - 1, 30)
        },
        harvestWindow: {
            start: new Date(2024, timeline.harvest[0] - 1, 1),
            end: new Date(2024, timeline.harvest[1] - 1, 30)
        },
        duration: timeline.duration
    };
}

async function getCropRequirements(cropName, area) {
    // Calculate input requirements based on area
    const baseRequirements = {
        rice: { seeds: 25, fertilizer: 150, irrigation: 1200 },
        wheat: { seeds: 100, fertilizer: 120, irrigation: 400 },
        maize: { seeds: 20, fertilizer: 180, irrigation: 500 }
    };

    const base = baseRequirements[cropName.toLowerCase()] || baseRequirements.rice;

    return {
        seeds: { 
            quantity: Math.round(base.seeds * area), 
            unit: 'kg', 
            estimatedCost: Math.round(base.seeds * area * 50) 
        },
        fertilizers: [
            { name: 'NPK', quantity: Math.round(base.fertilizer * area), unit: 'kg', cost: Math.round(base.fertilizer * area * 25) },
            { name: 'Urea', quantity: Math.round(50 * area), unit: 'kg', cost: Math.round(50 * area * 15) }
        ],
        irrigation: { 
            frequency: 'Weekly', 
            amount: Math.round(base.irrigation * area), 
            unit: 'liters' 
        }
    };
}

function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 9) return 'Kharif';
    if (month >= 10 && month <= 3) return 'Rabi';
    return 'Summer';
}

/**
 * @swagger
 * /api/crops/history:
 *   get:
 *     summary: Get user's crop recommendation history
 *     tags: [Crops]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.userId;

        const recommendations = await CropRecommendation.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('farmId', 'name location');

        const total = await CropRecommendation.countDocuments({ userId });

        res.json({
            success: true,
            data: {
                recommendations,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecommendations: total
            }
        });

    } catch (error) {
        logger.error('Crop history fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendation history'
        });
    }
});

module.exports = router;
