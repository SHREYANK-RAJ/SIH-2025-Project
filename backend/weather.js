// Weather Routes with OpenWeatherMap Integration
const express = require('express');
const axios = require('axios');
const { body, param, validationResult } = require('express-validator');
const { WeatherData } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// OpenWeatherMap API configuration
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

/**
 * @swagger
 * components:
 *   schemas:
 *     Weather:
 *       type: object
 *       properties:
 *         location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *             city:
 *               type: string
 *         current:
 *           type: object
 *           properties:
 *             temperature:
 *               type: number
 *             humidity:
 *               type: number
 *             pressure:
 *               type: number
 *             windSpeed:
 *               type: number
 *             condition:
 *               type: string
 */

/**
 * @swagger
 * /api/weather/current/{lat}/{lon}:
 *   get:
 *     summary: Get current weather for coordinates
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: path
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 */
router.get('/current/:lat/:lon', [
    auth,
    param('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    param('lon').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates',
                errors: errors.array()
            });
        }

        const { lat, lon } = req.params;

        // Check if we have recent cached data (within 10 minutes)
        const cachedWeather = await WeatherData.findOne({
            'location.latitude': parseFloat(lat),
            'location.longitude': parseFloat(lon),
            lastUpdated: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
        });

        if (cachedWeather) {
            logger.info(`Returning cached weather data for ${lat}, ${lon}`);
            return res.json({
                success: true,
                data: cachedWeather,
                cached: true
            });
        }

        // Fetch from OpenWeatherMap API
        if (!OPENWEATHER_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Weather service configuration error'
            });
        }

        const weatherResponse = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
            params: {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                appid: OPENWEATHER_API_KEY,
                units: 'metric'
            },
            timeout: 10000
        });

        const weatherData = weatherResponse.data;

        // Transform OpenWeather data to our format
        const transformedData = {
            location: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                city: weatherData.name,
                state: weatherData.sys.state || '',
                country: weatherData.sys.country
            },
            current: {
                temperature: weatherData.main.temp,
                humidity: weatherData.main.humidity,
                pressure: weatherData.main.pressure,
                windSpeed: weatherData.wind.speed,
                windDirection: weatherData.wind.deg,
                visibility: weatherData.visibility,
                uvIndex: 0, // Not available in current weather
                precipitation: weatherData.rain ? weatherData.rain['1h'] || 0 : 0,
                cloudCover: weatherData.clouds.all,
                condition: weatherData.weather[0].main,
                description: weatherData.weather[0].description
            },
            source: 'openweathermap',
            lastUpdated: new Date()
        };

        // Save to database for caching
        try {
            await WeatherData.findOneAndUpdate(
                {
                    'location.latitude': parseFloat(lat),
                    'location.longitude': parseFloat(lon)
                },
                transformedData,
                { upsert: true, new: true }
            );
        } catch (dbError) {
            logger.error('Error saving weather data to cache:', dbError);
        }

        logger.info(`Weather data fetched for ${lat}, ${lon}`);

        res.json({
            success: true,
            data: transformedData,
            cached: false
        });

    } catch (error) {
        if (error.response) {
            logger.error('OpenWeatherMap API error:', error.response.data);
            return res.status(error.response.status).json({
                success: false,
                message: 'Weather service error',
                details: error.response.data.message
            });
        }

        logger.error('Weather fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather data'
        });
    }
});

/**
 * @swagger
 * /api/weather/forecast/{lat}/{lon}:
 *   get:
 *     summary: Get 5-day weather forecast
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 */
router.get('/forecast/:lat/:lon', [
    auth,
    param('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    param('lon').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates',
                errors: errors.array()
            });
        }

        const { lat, lon } = req.params;

        if (!OPENWEATHER_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Weather service configuration error'
            });
        }

        // Fetch forecast from OpenWeatherMap API
        const forecastResponse = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
            params: {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                appid: OPENWEATHER_API_KEY,
                units: 'metric'
            },
            timeout: 15000
        });

        const forecastData = forecastResponse.data;

        // Process forecast data (5-day forecast with 3-hour intervals)
        const dailyForecast = {};

        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toISOString().split('T')[0];

            if (!dailyForecast[dateKey]) {
                dailyForecast[dateKey] = {
                    date: new Date(dateKey),
                    temperature: {
                        min: item.main.temp,
                        max: item.main.temp,
                        values: []
                    },
                    humidity: [],
                    precipitation: 0,
                    windSpeed: [],
                    condition: item.weather[0].main,
                    description: item.weather[0].description
                };
            }

            const dayData = dailyForecast[dateKey];
            dayData.temperature.values.push(item.main.temp);
            dayData.temperature.min = Math.min(dayData.temperature.min, item.main.temp);
            dayData.temperature.max = Math.max(dayData.temperature.max, item.main.temp);
            dayData.humidity.push(item.main.humidity);
            dayData.windSpeed.push(item.wind.speed);

            if (item.rain && item.rain['3h']) {
                dayData.precipitation += item.rain['3h'];
            }
        });

        // Calculate averages and format response
        const forecast = Object.values(dailyForecast).slice(0, 5).map(day => ({
            date: day.date,
            temperature: {
                min: Math.round(day.temperature.min),
                max: Math.round(day.temperature.max),
                average: Math.round(day.temperature.values.reduce((a, b) => a + b, 0) / day.temperature.values.length)
            },
            humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
            precipitation: Math.round(day.precipitation * 10) / 10,
            windSpeed: Math.round((day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length) * 10) / 10,
            condition: day.condition,
            description: day.description
        }));

        const responseData = {
            location: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                city: forecastData.city.name,
                country: forecastData.city.country
            },
            forecast,
            source: 'openweathermap',
            lastUpdated: new Date()
        };

        logger.info(`Weather forecast fetched for ${lat}, ${lon}`);

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        if (error.response) {
            logger.error('OpenWeatherMap forecast API error:', error.response.data);
            return res.status(error.response.status).json({
                success: false,
                message: 'Weather forecast service error',
                details: error.response.data.message
            });
        }

        logger.error('Weather forecast fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather forecast'
        });
    }
});

/**
 * @swagger
 * /api/weather/alerts/{lat}/{lon}:
 *   get:
 *     summary: Get weather alerts for location
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 */
router.get('/alerts/:lat/:lon', [
    auth,
    param('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    param('lon').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates',
                errors: errors.array()
            });
        }

        const { lat, lon } = req.params;

        if (!OPENWEATHER_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Weather service configuration error'
            });
        }

        // Fetch weather alerts using One Call API
        const alertsResponse = await axios.get(`https://api.openweathermap.org/data/3.0/onecall`, {
            params: {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                appid: OPENWEATHER_API_KEY,
                exclude: 'minutely,hourly,daily',
                units: 'metric'
            },
            timeout: 10000
        });

        const alerts = alertsResponse.data.alerts || [];

        const formattedAlerts = alerts.map(alert => ({
            type: alert.event,
            severity: determineSeverity(alert.event),
            description: alert.description,
            startTime: new Date(alert.start * 1000),
            endTime: new Date(alert.end * 1000),
            source: alert.sender_name || 'OpenWeatherMap'
        }));

        logger.info(`Weather alerts fetched for ${lat}, ${lon}: ${alerts.length} alerts`);

        res.json({
            success: true,
            data: {
                location: { latitude: parseFloat(lat), longitude: parseFloat(lon) },
                alerts: formattedAlerts,
                lastUpdated: new Date()
            }
        });

    } catch (error) {
        if (error.response && error.response.status === 401) {
            logger.error('Weather alerts API requires subscription');
            return res.json({
                success: true,
                data: {
                    location: { latitude: parseFloat(lat), longitude: parseFloat(lon) },
                    alerts: [],
                    message: 'Weather alerts require API subscription',
                    lastUpdated: new Date()
                }
            });
        }

        logger.error('Weather alerts fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather alerts'
        });
    }
});

// Helper function to determine alert severity
function determineSeverity(eventType) {
    const severeEvents = ['tornado', 'hurricane', 'cyclone', 'thunderstorm', 'flood'];
    const moderateEvents = ['rain', 'snow', 'wind', 'fog'];

    const eventLower = eventType.toLowerCase();

    if (severeEvents.some(event => eventLower.includes(event))) {
        return 'high';
    } else if (moderateEvents.some(event => eventLower.includes(event))) {
        return 'medium';
    }

    return 'low';
}

/**
 * @swagger
 * /api/weather/history:
 *   get:
 *     summary: Get weather data history for user's farms
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', auth, async (req, res) => {
    try {
        const { days = 7, farmId } = req.query;

        const query = {
            lastUpdated: {
                $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
        };

        if (farmId) {
            // If farmId is provided, get weather for that specific location
            // This would require joining with Farm collection to get coordinates
            query.farmId = farmId;
        }

        const weatherHistory = await WeatherData.find(query)
            .sort({ lastUpdated: -1 })
            .limit(100);

        res.json({
            success: true,
            data: {
                history: weatherHistory,
                period: `${days} days`
            }
        });

    } catch (error) {
        logger.error('Weather history fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather history'
        });
    }
});

module.exports = router;
