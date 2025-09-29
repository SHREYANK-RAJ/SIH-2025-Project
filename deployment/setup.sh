#!/bin/bash

# AI Crop Advisor Full-Stack Setup Script

echo "🌾 AI Crop Advisor Full-Stack Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if MongoDB is installed or running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed locally. You can:"
    echo "   1. Install MongoDB locally"
    echo "   2. Use Docker Compose (recommended)"
    echo "   3. Use MongoDB Atlas (cloud)"
fi

echo ""
echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "🐍 Setting up Python ML service..."
pip3 install -r requirements.txt

echo ""
echo "⚙️  Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.template .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your actual API keys and configuration"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📁 Creating necessary directories..."
mkdir -p logs uploads public

echo ""
echo "🔧 Setting up database (if MongoDB is running)..."
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB is not running. Please start MongoDB or use Docker Compose"
fi

echo ""
echo "🚀 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Get API keys:"
echo "   - OpenWeatherMap: https://openweathermap.org/api"
echo "   - SoilGrids: https://soilgrids.org"
echo ""
echo "To start the application:"
echo "• Using Docker Compose (recommended):"
echo "  docker-compose up -d"
echo ""
echo "• Manual startup:"
echo "  # Terminal 1: Start ML Service"
echo "  python3 ml_service.py"
echo ""
echo "  # Terminal 2: Start Backend Server"
echo "  npm start"
echo ""
echo "  # Terminal 3: Start Frontend (if separate)"
echo "  cd client && npm start"
echo ""
echo "🌐 Access the application:"
echo "• Backend API: http://localhost:5000"
echo "• ML Service: http://localhost:8000"
echo "• API Documentation: http://localhost:5000/api/docs"
echo "• Health Check: http://localhost:5000/health"
