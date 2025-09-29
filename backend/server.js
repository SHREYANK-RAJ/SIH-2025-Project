// Import route handlers (do not register yet)
const mlRoutes = require('./routes/ml');
// AI Crop Advisor Backend Server
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import route handlers
const authRoutes = require('./routes/auth');
const weatherRoutes = require('./routes/weather');
const cropRoutes = require('./routes/crops');
const soilRoutes = require('./routes/soil');
const marketRoutes = require('./routes/market');
const sensorRoutes = require('./routes/sensors');
const userRoutes = require('./routes/user');
const soilgridsRoutes = require('./routes/soilgrids');
const agmarknetRoutes = require('./routes/agmarknet');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Register all routes after app is defined
app.use('/api/ml', mlRoutes);
app.use('/api/agmarknet', agmarknetRoutes);

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-crop-advisor';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    logger.info('Connected to MongoDB successfully');
    console.log('✅ MongoDB connected');
})
.catch((error) => {
    logger.error('MongoDB connection error:', error);
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
});

// Swagger documentation setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AI Crop Advisor API',
            version: '1.0.0',
            description: 'API for AI-powered crop recommendation system',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
    },
    apis: ['./routes/*.js'], // paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/soilgrids', soilgridsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/user', userRoutes);

// Serve static files from the frontend build
app.use(express.static('public'));

// Catch-all handler: send back index.html file for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// WebSocket handling for real-time features
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join user to their specific room
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        logger.info(`User ${userId} joined room`);
    });

    // Handle sensor data subscription
    socket.on('subscribe_sensors', (farmId) => {
        socket.join(`farm_${farmId}`);
        // Send initial sensor data
        const sensorData = generateMockSensorData();
        socket.emit('sensor_data', sensorData);
    });

    // Handle weather alerts subscription
    socket.on('subscribe_weather', (location) => {
        socket.join(`weather_${location}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Simulate real-time sensor data updates
setInterval(() => {
    const sensorData = generateMockSensorData();
    io.emit('sensor_update', sensorData);
}, 30000); // Update every 30 seconds

// Generate mock sensor data
function generateMockSensorData() {
    return {
        timestamp: new Date().toISOString(),
        soil_moisture: Math.round(Math.random() * 30 + 35), // 35-65%
        soil_ph: Math.round((Math.random() * 2 + 5.5) * 10) / 10, // 5.5-7.5
        soil_temperature: Math.round(Math.random() * 10 + 20), // 20-30°C
        ambient_temperature: Math.round(Math.random() * 15 + 20), // 20-35°C
        humidity: Math.round(Math.random() * 30 + 50), // 50-80%
        light_intensity: Math.round(Math.random() * 50000 + 10000), // 10k-60k lux
    };
}

// Error handling middleware (should be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        mongoose.connection.close();
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        mongoose.connection.close();
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api/docs`);
    logger.info(`Server started on port ${PORT}`);
});

module.exports = { app, io };
