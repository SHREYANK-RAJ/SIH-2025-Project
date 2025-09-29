// AI Crop Advisor Application
class CropAdvisorApp {
  constructor() {
    this.currentUser = null;
    this.currentLanguage = 'en';
    this.isAuthenticated = false;
    this.sensorChart = null;
    this.voiceRecognition = null;
    this.websocketConnection = null;
    this.offlineData = {};
    
    // Initialize the application
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthentication();
    this.initializeWebSocket();
    this.setupVoiceInterface();
    this.loadOfflineData();
    
    // Show auth modal if not authenticated
    if (!this.isAuthenticated) {
      this.showAuthModal();
    }
  }

  setupEventListeners() {
    // Authentication events
    document.getElementById('authForm').addEventListener('submit', this.handleAuth.bind(this));
    document.getElementById('switchMode').addEventListener('click', this.toggleAuthMode.bind(this));
    document.getElementById('closeAuth').addEventListener('click', this.hideAuthModal.bind(this));
    document.getElementById('language').addEventListener('change', this.changeLanguage.bind(this));

    // Navigation events
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', this.handleNavigation.bind(this));
    });

    document.getElementById('logoutBtn').addEventListener('click', this.logout.bind(this));
    document.getElementById('voiceBtn').addEventListener('click', this.toggleVoice.bind(this));

    // Weather events
    document.getElementById('getWeatherBtn').addEventListener('click', this.getWeather.bind(this));
    document.getElementById('getCurrentLocationBtn').addEventListener('click', this.getCurrentLocation.bind(this));

    // Soil analysis events
    document.getElementById('soilForm').addEventListener('submit', this.analyzeSoil.bind(this));
    document.getElementById('soilFile').addEventListener('change', this.handleFileUpload.bind(this));

    // Crop recommendation events
    document.getElementById('cropForm').addEventListener('submit', this.getCropRecommendations.bind(this));

    // Market events
    document.getElementById('refreshPrices').addEventListener('click', this.refreshMarketPrices.bind(this));
    document.getElementById('marketLocation').addEventListener('change', this.refreshMarketPrices.bind(this));

    // Voice interface events
    document.getElementById('stopVoice').addEventListener('click', this.stopVoice.bind(this));
  }

  // Authentication System
  checkAuthentication() {
    const token = localStorage.getItem('cropAdvisorToken');
    const userData = localStorage.getItem('cropAdvisorUser');
    
    if (token && userData) {
      this.currentUser = JSON.parse(userData);
      this.isAuthenticated = true;
      this.showApp();
      this.loadDashboard();
    }
  }

  async handleAuth(e) {
    e.preventDefault();
    this.showLoading();

    const formData = new FormData(e.target);
    const isLogin = document.getElementById('authSubmit').textContent === 'Sign In';
    
    const authData = {
      email: formData.get('email') || document.getElementById('email').value,
      password: formData.get('password') || document.getElementById('password').value,
      name: document.getElementById('name').value,
      role: document.getElementById('role').value
    };

    try {
      // Simulate API call
      await this.simulateApiDelay();
      
      if (isLogin) {
        await this.login(authData);
      } else {
        await this.register(authData);
      }
      
      this.hideLoading();
      this.hideAuthModal();
      this.showApp();
      this.loadDashboard();
      this.showNotification('Welcome to AI Crop Advisor!', 'success');
      
    } catch (error) {
      this.hideLoading();
      this.showNotification(error.message, 'error');
    }
  }

  async login(credentials) {
    // Simulate authentication
    const mockUser = {
      id: '12345',
      name: credentials.name || 'Smart Farmer',
      email: credentials.email,
      role: 'farmer',
      location: { lat: 28.6139, lng: 77.2090, city: 'Delhi' },
      farmSize: 2.5
    };

    const mockToken = 'jwt.mock.token.12345';
    
    localStorage.setItem('cropAdvisorToken', mockToken);
    localStorage.setItem('cropAdvisorUser', JSON.stringify(mockUser));
    
    this.currentUser = mockUser;
    this.isAuthenticated = true;
  }

  async register(userData) {
    // Simulate registration
    await this.login(userData);
  }

  logout() {
    localStorage.removeItem('cropAdvisorToken');
    localStorage.removeItem('cropAdvisorUser');
    this.currentUser = null;
    this.isAuthenticated = false;
    this.hideApp();
    this.showAuthModal();
    this.showNotification('Successfully logged out', 'info');
  }

  toggleAuthMode() {
    const nameGroup = document.getElementById('nameGroup');
    const roleGroup = document.getElementById('roleGroup');
    const authTitle = document.getElementById('authTitle');
    const authSubmit = document.getElementById('authSubmit');
    const switchMode = document.getElementById('switchMode');
    const authSwitchText = document.getElementById('authSwitchText');

    const isLogin = authSubmit.textContent === 'Sign In';

    if (isLogin) {
      // Switch to register mode
      nameGroup.style.display = 'block';
      roleGroup.style.display = 'block';
      authTitle.textContent = 'Create Account';
      authSubmit.textContent = 'Sign Up';
      authSwitchText.innerHTML = 'Already have an account? <a href="#" id="switchMode">Sign In</a>';
    } else {
      // Switch to login mode
      nameGroup.style.display = 'none';
      roleGroup.style.display = 'none';
      authTitle.textContent = 'Welcome Back';
      authSubmit.textContent = 'Sign In';
      authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="switchMode">Sign Up</a>';
    }

    // Re-attach event listener
    document.getElementById('switchMode').addEventListener('click', this.toggleAuthMode.bind(this));
  }

  changeLanguage(e) {
    this.currentLanguage = e.target.value;
    this.updateUILanguage();
  }

  updateUILanguage() {
    const translations = {
      en: {
        welcome: 'Welcome back',
        dashboard: 'Dashboard',
        weather: 'Weather',
        soil: 'Soil Analysis',
        crops: 'Crop Recommendation',
        market: 'Market Prices',
        sensors: 'IoT Sensors'
      },
      hi: {
        welcome: 'वापसी पर स्वागत है',
        dashboard: 'डैशबोर्ड',
        weather: 'मौसम',
        soil: 'मिट्टी विश्लेषण',
        crops: 'फसल सिफारिश',
        market: 'बाजार मूल्य',
        sensors: 'आईओटी सेंसर'
      }
    };

    // Update UI elements with translations
    const t = translations[this.currentLanguage];
    document.getElementById('welcomeText').textContent = `${t.welcome}, ${this.currentUser?.name || 'Farmer'}!`;
  }

  // UI Management
  showAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
  }

  hideAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
  }

  showApp() {
    document.getElementById('app').classList.remove('hidden');
  }

  hideApp() {
    document.getElementById('app').classList.add('hidden');
  }

  showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
  }

  handleNavigation(e) {
    const sectionId = e.target.dataset.section;
    
    // Update active navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Show corresponding section
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // Load section-specific data
    this.loadSectionData(sectionId);
  }

  async loadSectionData(sectionId) {
    switch (sectionId) {
      case 'weather':
        await this.loadWeatherData();
        break;
      case 'sensors':
        await this.loadSensorData();
        this.initSensorChart();
        break;
      case 'market':
        await this.loadMarketData();
        break;
    }
  }

  // Dashboard functionality
  async loadDashboard() {
    if (!this.currentUser) return;

    document.getElementById('userName').textContent = this.currentUser.name;
    
    // Load real-time data
    await this.updateDashboardStats();
    await this.loadRecentRecommendations();
    await this.loadWeatherForecast();
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }

  async updateDashboardStats() {
    // Simulate real API calls
    const weatherData = await this.fetchWeatherData();
    const soilData = await this.fetchSensorData();
    const marketPrices = await this.fetchMarketData();

    // Find rice price from market data
    const ricePrice = marketPrices.find(price => price.crop === 'Rice');

    document.getElementById('currentTemp').textContent = `${weatherData.temperature}°C`;
    document.getElementById('currentHumidity').textContent = `${weatherData.humidity}%`;
    document.getElementById('soilPh').textContent = soilData.ph;
    document.getElementById('marketAlert').textContent = ricePrice ? `₹${ricePrice.currentPrice}` : '₹2,500';
  }

  async loadRecentRecommendations() {
    const recommendations = [
      { crop: 'Wheat', confidence: 96, season: 'Rabi' },
      { crop: 'Maize', confidence: 89, season: 'Kharif' },
      { crop: 'Rice', confidence: 84, season: 'Kharif' }
    ];

    const container = document.getElementById('recentRecommendations');
    container.innerHTML = recommendations.map(rec => `
      <div class="recommendation-item">
        <span class="crop-name">${rec.crop}</span>
        <span class="confidence">${rec.confidence}% confidence</span>
      </div>
    `).join('');
  }

  // Weather functionality
  async loadWeatherData() {
    if (this.currentUser?.location) {
      await this.getWeatherByCoords(this.currentUser.location.lat, this.currentUser.location.lng);
    }
  }

  async getWeather() {
    const location = document.getElementById('locationInput').value;
    if (!location) {
      this.showNotification('Please enter a location', 'warning');
      return;
    }

    this.showLoading();
    try {
      // Simulate OpenWeatherMap API call
      await this.simulateApiDelay();
      const weatherData = await this.fetchWeatherData(location);
      this.updateWeatherDisplay(weatherData);
      this.hideLoading();
      this.showNotification('Weather data updated', 'success');
    } catch (error) {
      this.hideLoading();
      this.showNotification('Failed to fetch weather data', 'error');
    }
  }

  async getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showNotification('Geolocation not supported', 'error');
      return;
    }

    this.showLoading();
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await this.getWeatherByCoords(position.coords.latitude, position.coords.longitude);
        this.hideLoading();
      },
      () => {
        this.hideLoading();
        this.showNotification('Location access denied', 'error');
      }
    );
  }

  async getWeatherByCoords(lat, lng) {
    try {
      const weatherData = await this.fetchWeatherData(`${lat},${lng}`);
      this.updateWeatherDisplay(weatherData);
      this.showNotification('Weather data updated for your location', 'success');
    } catch (error) {
      this.showNotification('Failed to fetch weather data', 'error');
    }
  }

  async fetchWeatherData(location = '') {
    // Simulate OpenWeatherMap API response
    await this.simulateApiDelay();
    
    return {
      location: location || 'Delhi, IN',
      temperature: 28 + Math.round(Math.random() * 10 - 5),
      feelsLike: 32 + Math.round(Math.random() * 8 - 4),
      humidity: 75 + Math.round(Math.random() * 20 - 10),
      windSpeed: 12 + Math.round(Math.random() * 10 - 5),
      pressure: 1013 + Math.round(Math.random() * 20 - 10),
      description: 'Clear Sky',
      icon: '☀️'
    };
  }

  updateWeatherDisplay(data) {
    document.getElementById('feelsLike').textContent = `${data.feelsLike}°C`;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.windSpeed} km/h`;
    document.getElementById('pressure').textContent = `${data.pressure} hPa`;
  }

  // Soil Analysis functionality
  async handleFileUpload(e) {
    const files = Array.from(e.target.files);
    const container = document.getElementById('uploadedFiles');
    
    container.innerHTML = files.map(file => `
      <div class="uploaded-file">
        <span>${file.name}</span>
        <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
    `).join('');

    // Simulate file processing
    this.showNotification(`${files.length} file(s) uploaded successfully`, 'success');
  }

  async analyzeSoil(e) {
    e.preventDefault();
    this.showLoading();

    const formData = new FormData(e.target);
    const soilData = {
      ph: parseFloat(formData.get('ph') || document.getElementById('soilPH').value),
      nitrogen: parseFloat(formData.get('nitrogen') || document.getElementById('nitrogen').value),
      phosphorus: parseFloat(formData.get('phosphorus') || document.getElementById('phosphorus').value),
      potassium: parseFloat(formData.get('potassium') || document.getElementById('potassium').value),
      organicMatter: parseFloat(formData.get('organicMatter') || document.getElementById('organicMatter').value),
      soilType: formData.get('soilType') || document.getElementById('soilType').value
    };

    try {
      // Simulate ML analysis
      await this.simulateApiDelay(2000);
      const analysis = await this.performSoilAnalysis(soilData);
      this.displaySoilResults(analysis);
      this.hideLoading();
      this.showNotification('Soil analysis completed', 'success');
    } catch (error) {
      this.hideLoading();
      this.showNotification('Soil analysis failed', 'error');
    }
  }

  async performSoilAnalysis(data) {
    // Simulate ML service analysis
    const healthScore = Math.min(100, Math.max(0, 
      (data.ph >= 6.0 && data.ph <= 7.5 ? 25 : 15) +
      (data.nitrogen >= 40 ? 25 : data.nitrogen / 40 * 25) +
      (data.phosphorus >= 25 ? 25 : data.phosphorus / 25 * 25) +
      (data.potassium >= 35 ? 25 : data.potassium / 35 * 25)
    ));

    return {
      healthScore: Math.round(healthScore),
      fertilityLevel: healthScore > 80 ? 'High' : healthScore > 60 ? 'Medium' : 'Low',
      recommendations: this.generateSoilRecommendations(data, healthScore)
    };
  }

  generateSoilRecommendations(data, score) {
    const recommendations = [];
    
    if (data.ph < 6.0) recommendations.push('Add lime to increase pH');
    if (data.ph > 7.5) recommendations.push('Add sulfur to decrease pH');
    if (data.nitrogen < 40) recommendations.push('Apply nitrogen-rich fertilizer');
    if (data.phosphorus < 25) recommendations.push('Add phosphate fertilizer');
    if (data.potassium < 35) recommendations.push('Apply potassium fertilizer');
    if (data.organicMatter < 2.0) recommendations.push('Increase organic matter with compost');
    
    if (recommendations.length === 0) {
      recommendations.push('Soil health is excellent - maintain current practices');
    }

    return recommendations;
  }

  displaySoilResults(analysis) {
    document.getElementById('healthScore').textContent = `${analysis.healthScore}/100`;
    document.getElementById('fertilityLevel').textContent = analysis.fertilityLevel;
    document.getElementById('recommendedAction').textContent = 
      analysis.fertilityLevel === 'High' ? 'Maintain current practices' : 'Improve soil nutrients';

    const tipsContainer = document.getElementById('soilTips');
    tipsContainer.innerHTML = analysis.recommendations.map(rec => `<li>${rec}</li>`).join('');

    document.getElementById('soilResults').classList.remove('hidden');
  }

  // Crop Recommendation functionality
  async getCropRecommendations(e) {
    e.preventDefault();
    this.showLoading();

    const formData = new FormData(e.target);
    const cropData = {
      season: formData.get('season') || document.getElementById('season').value,
      farmSize: parseFloat(formData.get('farmSize') || document.getElementById('farmSize').value),
      budget: parseFloat(formData.get('budget') || document.getElementById('budget').value),
      experience: formData.get('experience') || document.getElementById('experience').value,
      soilData: await this.fetchSensorData(),
      weatherData: await this.fetchWeatherData()
    };

    try {
      await this.simulateApiDelay(3000);
      const recommendations = await this.performCropAnalysis(cropData);
      this.displayCropResults(recommendations);
      this.hideLoading();
      this.showNotification('Crop recommendations generated', 'success');
    } catch (error) {
      this.hideLoading();
      this.showNotification('Failed to generate recommendations', 'error');
    }
  }

  async performCropAnalysis(data) {
    // Simulate ML model prediction
    const crops = [
      { name: 'Rice', hindi: 'चावल', icon: '🌾', yield: '4-6 tonnes/ha', profit: '₹45,000/ha', confidence: 94 },
      { name: 'Wheat', hindi: 'गेहूं', icon: '🌾', yield: '3-4 tonnes/ha', profit: '₹35,000/ha', confidence: 89 },
      { name: 'Maize', hindi: 'मक्का', icon: '🌽', yield: '5-7 tonnes/ha', profit: '₹50,000/ha', confidence: 86 },
      { name: 'Sugarcane', hindi: 'गन्ना', icon: '🎋', yield: '60-80 tonnes/ha', profit: '₹80,000/ha', confidence: 78 },
      { name: 'Cotton', hindi: 'कपास', icon: '🌾', yield: '1.5-2.5 tonnes/ha', profit: '₹40,000/ha', confidence: 72 }
    ];

    // Filter based on season and budget
    let filteredCrops = crops.filter(crop => {
      if (data.season === 'kharif' && ['Rice', 'Maize', 'Cotton'].includes(crop.name)) return true;
      if (data.season === 'rabi' && ['Wheat'].includes(crop.name)) return true;
      if (data.season === 'summer' && ['Sugarcane', 'Maize'].includes(crop.name)) return true;
      return false;
    });

    // Sort by confidence
    return filteredCrops.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  displayCropResults(recommendations) {
    const container = document.getElementById('cropRecommendations');
    container.innerHTML = recommendations.map(crop => `
      <div class="crop-item">
        <div class="crop-icon">${crop.icon}</div>
        <div class="crop-info">
          <h4>${crop.name} (${crop.hindi})</h4>
          <div class="crop-details">
            <div class="crop-detail">Expected Yield: ${crop.yield}</div>
            <div class="crop-detail">Estimated Profit: ${crop.profit}</div>
          </div>
        </div>
        <div class="confidence-score">
          <div class="confidence-percentage">${crop.confidence}%</div>
          <div class="status status--success">Recommended</div>
        </div>
      </div>
    `).join('');

    document.getElementById('cropResults').classList.remove('hidden');
  }

  // Market Prices functionality
  async loadMarketData() {
    await this.refreshMarketPrices();
  }

  async refreshMarketPrices() {
    this.showLoading();
    const location = document.getElementById('marketLocation').value;
    
    try {
      await this.simulateApiDelay();
      const prices = await this.fetchMarketData(location);
      this.updatePricesTable(prices);
      this.hideLoading();
      this.showNotification('Market prices updated', 'success');
    } catch (error) {
      this.hideLoading();
      this.showNotification('Failed to fetch market data', 'error');
    }
  }

  async fetchMarketData(location = 'delhi') {
    // Simulate agricultural market API
    await this.simulateApiDelay();
    
    const basePrices = {
      'Rice': 2500,
      'Wheat': 2200,
      'Maize': 1800,
      'Sugarcane': 350,
      'Cotton': 5500
    };

    return Object.entries(basePrices).map(([crop, basePrice]) => {
      const currentPrice = basePrice + Math.round(Math.random() * 200 - 100);
      const previousPrice = basePrice + Math.round(Math.random() * 150 - 75);
      const change = currentPrice - previousPrice;
      
      return {
        crop,
        currentPrice,
        previousPrice,
        change,
        changePercent: ((change / previousPrice) * 100).toFixed(1),
        trend: change > 0 ? '📈' : change < 0 ? '📉' : '➡️'
      };
    });
  }

  updatePricesTable(prices) {
    const tbody = document.getElementById('pricesTableBody');
    tbody.innerHTML = prices.map(price => `
      <tr>
        <td>${price.crop}</td>
        <td>₹${price.currentPrice}</td>
        <td>₹${price.previousPrice}</td>
        <td class="price-change ${price.change >= 0 ? 'positive' : 'negative'}">
          ₹${price.change} (${price.changePercent}%)
        </td>
        <td class="price-trend">${price.trend}</td>
      </tr>
    `).join('');
  }

  // IoT Sensors functionality
  async loadSensorData() {
    await this.updateSensorReadings();
    this.startSensorUpdates();
  }

  async updateSensorReadings() {
    const sensorData = await this.fetchSensorData();
    
    // Update sensor displays
    document.getElementById('soilMoisture').textContent = `${sensorData.moisture}%`;
    document.getElementById('airTemp').textContent = `${sensorData.temperature}°C`;
    document.getElementById('sensorPH').textContent = sensorData.ph;
    document.getElementById('lightLevel').textContent = `${sensorData.light} lux`;

    // Update progress bars
    document.querySelector('.progress').style.width = `${sensorData.moisture}%`;
    document.querySelector('.gauge-fill').style.height = `${(sensorData.temperature / 40) * 100}%`;
    document.querySelector('.ph-marker').style.left = `${(sensorData.ph / 14) * 100}%`;
    document.querySelector('.light-bar').style.width = `${(sensorData.light / 1000) * 100}%`;

    // Update timestamp
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
  }

  async fetchSensorData() {
    // Simulate IoT sensor data
    return {
      moisture: 45 + Math.round(Math.random() * 20 - 10),
      temperature: 28 + Math.round(Math.random() * 8 - 4),
      ph: 6.2 + Math.round(Math.random() * 20 - 10) / 10,
      light: 850 + Math.round(Math.random() * 300 - 150),
      nitrogen: 50 + Math.round(Math.random() * 20 - 10),
      phosphorus: 30 + Math.round(Math.random() * 15 - 7),
      potassium: 40 + Math.round(Math.random() * 18 - 9)
    };
  }

  initSensorChart() {
    if (this.sensorChart) {
      this.sensorChart.destroy();
    }

    const ctx = document.getElementById('sensorChart');
    if (!ctx) return;

    const containerStyle = ctx.parentElement.style;
    containerStyle.position = 'relative';
    containerStyle.height = '400px';

    // Generate 24 hours of sample data
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    const moistureData = hours.map(() => 45 + Math.random() * 20 - 10);
    const tempData = hours.map(() => 28 + Math.random() * 8 - 4);

    this.sensorChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: 'Soil Moisture (%)',
          data: moistureData,
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          tension: 0.4
        }, {
          label: 'Temperature (°C)',
          data: tempData,
          borderColor: '#FFC185',
          backgroundColor: 'rgba(255, 193, 133, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Real-time updates
  startRealTimeUpdates() {
    // Update dashboard every 30 seconds
    setInterval(() => {
      if (this.isAuthenticated) {
        this.updateDashboardStats();
      }
    }, 30000);
  }

  startSensorUpdates() {
    // Update sensors every 5 seconds
    setInterval(() => {
      if (document.getElementById('sensors').classList.contains('active')) {
        this.updateSensorReadings();
      }
    }, 5000);
  }

  // WebSocket simulation for real-time data
  initializeWebSocket() {
    // Simulate WebSocket connection for real-time IoT data
    this.websocketConnection = {
      connected: true,
      onMessage: (callback) => {
        setInterval(() => {
          if (this.websocketConnection.connected) {
            callback({
              type: 'sensor_data',
              data: {
                timestamp: new Date().toISOString(),
                sensors: this.fetchSensorData()
              }
            });
          }
        }, 10000);
      }
    };
  }

  // Voice Interface
  setupVoiceInterface() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.voiceRecognition = new SpeechRecognition();
      this.voiceRecognition.continuous = false;
      this.voiceRecognition.interimResults = false;
      this.voiceRecognition.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-US';

      this.voiceRecognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        this.processVoiceCommand(command);
      };

      this.voiceRecognition.onerror = () => {
        this.showNotification('Voice recognition not supported in this environment', 'info');
        this.hideVoiceInterface();
      };

      this.voiceRecognition.onend = () => {
        this.hideVoiceInterface();
      };
    }
  }

  toggleVoice() {
    if (this.voiceRecognition) {
      this.showVoiceInterface();
      try {
        this.voiceRecognition.start();
      } catch (error) {
        this.showNotification('Voice recognition not available in this environment', 'info');
        this.hideVoiceInterface();
      }
    } else {
      this.showNotification('Voice recognition not supported by your browser', 'warning');
    }
  }

  stopVoice() {
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
    }
    this.hideVoiceInterface();
  }

  showVoiceInterface() {
    document.getElementById('voiceInterface').classList.remove('hidden');
  }

  hideVoiceInterface() {
    document.getElementById('voiceInterface').classList.add('hidden');
  }

  processVoiceCommand(command) {
    console.log('Voice command:', command);
    
    if (command.includes('weather')) {
      this.handleNavigation({ target: { dataset: { section: 'weather' } } });
      this.getWeather();
    } else if (command.includes('soil')) {
      this.handleNavigation({ target: { dataset: { section: 'soil' } } });
    } else if (command.includes('crop') || command.includes('recommendation')) {
      this.handleNavigation({ target: { dataset: { section: 'crops' } } });
    } else if (command.includes('market') || command.includes('price')) {
      this.handleNavigation({ target: { dataset: { section: 'market' } } });
    } else if (command.includes('sensor')) {
      this.handleNavigation({ target: { dataset: { section: 'sensors' } } });
    } else if (command.includes('dashboard') || command.includes('home')) {
      this.handleNavigation({ target: { dataset: { section: 'dashboard' } } });
    }

    this.showNotification(`Voice command processed: "${command}"`, 'info');
  }

  // Offline functionality
  loadOfflineData() {
    // Load cached data for offline use
    this.offlineData = {
      lastWeatherUpdate: localStorage.getItem('lastWeatherData'),
      lastSensorUpdate: localStorage.getItem('lastSensorData'),
      lastMarketUpdate: localStorage.getItem('lastMarketData')
    };
  }

  cacheData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    this.offlineData[key] = data;
  }

  // Utility functions
  async simulateApiDelay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Load weather forecast for dashboard
  async loadWeatherForecast() {
    const forecast = [
      { day: 'Today', weather: '☀️ Sunny 32°C' },
      { day: 'Tomorrow', weather: '⛅ Partly Cloudy 29°C' },
      { day: 'Day 3', weather: '🌧️ Light Rain 26°C' }
    ];

    const container = document.getElementById('weatherForecast');
    container.innerHTML = forecast.map(f => `
      <div class="forecast-item">
        <span class="day">${f.day}</span>
        <span class="weather">${f.weather}</span>
      </div>
    `).join('');
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cropAdvisorApp = new CropAdvisorApp();
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CropAdvisorApp;
}