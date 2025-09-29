# Create the complete backend server structure and files for the AI Crop Advisor

# 1. Create package.json for Node.js backend
package_json = {
    "name": "ai-crop-advisor-backend",
    "version": "1.0.0",
    "description": "Backend server for AI Crop Recommendation System",
    "main": "server.js",
    "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js",
        "test": "jest"
    },
    "dependencies": {
        "express": "^4.18.2",
        "mongoose": "^7.5.0",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "bcryptjs": "^2.4.3",
        "jsonwebtoken": "^9.0.2",
        "axios": "^1.5.0",
        "multer": "^1.4.5-lts.1",
        "helmet": "^7.0.0",
        "express-rate-limit": "^6.10.0",
        "express-validator": "^7.0.1",
        "winston": "^3.10.0",
        "socket.io": "^4.7.2",
        "node-cron": "^3.0.2",
        "swagger-ui-express": "^5.0.0",
        "swagger-jsdoc": "^6.2.8",
        "compression": "^1.7.4",
        "morgan": "^1.10.0"
    },
    "devDependencies": {
        "nodemon": "^3.0.1",
        "jest": "^29.7.0"
    },
    "keywords": ["agriculture", "ai", "crop-recommendation", "farming", "nodejs"],
    "author": "AI Crop Advisor Team",
    "license": "MIT"
}

import json
with open('package.json', 'w') as f:
    json.dump(package_json, f, indent=2)

print("✅ package.json created")