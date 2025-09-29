function LoadingSpinner({ show }) {
  return (
    <div id="loadingSpinner" className={`loading-spinner${show ? '' : ' hidden'}`}>
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

function VoiceInterface({ show, onStop }) {
  return (
    <div id="voiceInterface" className={`voice-interface${show ? '' : ' hidden'}`}>
      <div className="voice-content">
        <div className="voice-icon">🎤</div>
        <p id="voiceStatus">Listening...</p>
        <button id="stopVoice" className="btn btn--secondary" onClick={onStop}>Stop</button>
      </div>
    </div>
  );
}

function Notifications({ messages }) {
  return (
    <div id="notifications" className="notifications">
      {messages.map((msg, i) => (
        <div key={i} className={`notification ${msg.type}`}>{msg.text}</div>
      ))}
    </div>
  );
}
function IoTSensorsSection() {
  return (
    <main id="sensors" className="section">
      <div className="container">
        <h2>IoT Sensor Data</h2>
        <div className="sensor-status">
          <div className="status-indicator online">
            <span className="indicator"></span>
            <span>Sensors Online</span>
          </div>
          <div className="last-update">
            Last Update: <span id="lastUpdate">Just now</span>
          </div>
        </div>
        <div className="sensor-grid">
          <div className="sensor-card">
            <h3>Soil Moisture</h3>
            <div className="sensor-value">
              <span className="value" id="soilMoisture">45%</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="sensor-status">
              <span className="status status--success">Normal</span>
            </div>
          </div>
          <div className="sensor-card">
            <h3>Air Temperature</h3>
            <div className="sensor-value">
              <span className="value" id="airTemp">28°C</span>
              <div className="temp-gauge">
                <div className="gauge-fill" style={{ height: '70%' }}></div>
              </div>
            </div>
            <div className="sensor-status">
              <span className="status status--info">Optimal</span>
            </div>
          </div>
          <div className="sensor-card">
            <h3>Soil pH</h3>
            <div className="sensor-value">
              <span className="value" id="sensorPH">6.2</span>
              <div className="ph-indicator">
                <div className="ph-scale"></div>
                <div className="ph-marker" style={{ left: '62%' }}></div>
              </div>
            </div>
            <div className="sensor-status">
              <span className="status status--success">Good</span>
            </div>
          </div>
          <div className="sensor-card">
            <h3>Light Intensity</h3>
            <div className="sensor-value">
              <span className="value" id="lightLevel">850 lux</span>
              <div className="light-meter">
                <div className="light-bar" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="sensor-status">
              <span className="status status--success">High</span>
            </div>
          </div>
        </div>
        <div className="sensor-chart">
          <h3>24-Hour Sensor Trends</h3>
          <canvas id="sensorChart"></canvas>
        </div>
      </div>
    </main>
  );
}
import React, { useState } from 'react';

function MarketPricesSection() {
  const [commodity, setCommodity] = useState('');
  const [state, setState] = useState('');
  const [market, setMarket] = useState('');
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getPrices = async () => {
    setError('');
    setPrices([]);
    setLoading(true);
    try {
      let url = `/api/agmarknet/${commodity || 'wheat'}?`;
      if (state) url += `state=${encodeURIComponent(state)}&`;
      if (market) url += `market=${encodeURIComponent(market)}&`;
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setPrices(result.data.slice(0, 20)); // Limit to 20 results for demo
      } else {
        setError(result.message || 'Market prices fetch failed');
      }
    } catch (err) {
      setError(err.message || 'Error fetching market prices');
    }
    setLoading(false);
  };

  return (
    <main id="market" className="section">
      <div className="container">
        <h2>Market Prices</h2>
        <div className="market-controls" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="text" className="form-control" placeholder="Commodity (e.g. Wheat)" value={commodity} onChange={e => setCommodity(e.target.value)} />
          <input type="text" className="form-control" placeholder="State (e.g. Delhi)" value={state} onChange={e => setState(e.target.value)} />
          <input type="text" className="form-control" placeholder="Market (e.g. Azadpur)" value={market} onChange={e => setMarket(e.target.value)} />
          <button className="btn btn--primary" onClick={getPrices} disabled={loading}>Get Prices</button>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div className="price-table">
          <table className="table">
            <thead>
              <tr>
                <th>Commodity</th>
                <th>State</th>
                <th>Market</th>
                <th>Arrival Date</th>
                <th>Min Price</th>
                <th>Max Price</th>
                <th>Modal Price</th>
              </tr>
            </thead>
            <tbody>
              {prices.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No data</td></tr>
              )}
              {prices.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.commodity}</td>
                  <td>{item.state}</td>
                  <td>{item.market}</td>
                  <td>{item.arrival_date}</td>
                  <td>{item.min_price}</td>
                  <td>{item.max_price}</td>
                  <td>{item.modal_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
import React, { useState } from 'react';

function CropRecommendationSection() {
  const [fields, setFields] = useState({
    season: true,
    farmSize: true,
    budget: false,
    experience: false
  });
  const [values, setValues] = useState({
    season: 'kharif',
    farmSize: 2.5,
    budget: 50000,
    experience: 'beginner'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFieldToggle = (field) => {
    setFields(f => ({ ...f, [field]: !f[field] }));
  };
  const handleValueChange = (field, value) => {
    setValues(v => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      // Only send selected fields
      const payload = {};
      Object.keys(fields).forEach(f => { if (fields[f]) payload[f] = values[f]; });
      const res = await fetch('/api/ml/predict-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Prediction failed');
      }
    } catch (err) {
      setError(err.message || 'Prediction error');
    }
    setLoading(false);
  };

  return (
    <main id="crops" className="section">
      <div className="container">
        <h2>Crop Recommendation System</h2>
        <div className="crop-recommendation">
          <div className="input-section">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <input type="checkbox" checked={fields.season} onChange={() => handleFieldToggle('season')} />
                  <label className="form-label">Season</label>
                  <select className="form-control" value={values.season} onChange={e => handleValueChange('season', e.target.value)}>
                    <option value="kharif">Kharif (Monsoon)</option>
                    <option value="rabi">Rabi (Winter)</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
                <div className="form-group">
                  <input type="checkbox" checked={fields.farmSize} onChange={() => handleFieldToggle('farmSize')} />
                  <label className="form-label">Farm Size (hectares)</label>
                  <input type="number" className="form-control" min="0.1" step="0.1" value={values.farmSize} onChange={e => handleValueChange('farmSize', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input type="checkbox" checked={fields.budget} onChange={() => handleFieldToggle('budget')} />
                  <label className="form-label">Budget (₹)</label>
                  <input type="number" className="form-control" min="1000" value={values.budget} onChange={e => handleValueChange('budget', e.target.value)} />
                </div>
                <div className="form-group">
                  <input type="checkbox" checked={fields.experience} onChange={() => handleFieldToggle('experience')} />
                  <label className="form-label">Farming Experience</label>
                  <select className="form-control" value={values.experience} onChange={e => handleValueChange('experience', e.target.value)}>
                    <option value="beginner">Beginner (0-2 years)</option>
                    <option value="intermediate">Intermediate (3-7 years)</option>
                    <option value="expert">Expert (8+ years)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn--primary" disabled={loading}>Get Crop Recommendations</button>
            </form>
          </div>
          <div className="crop-results">
            <h3>Recommended Crops</h3>
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {result && (
              <div className="crop-list">
                <pre style={{ background: '#222', color: '#fff', padding: 10, borderRadius: 6, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
import React, { useState } from 'react';

function SoilAnalysisSection() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [soil, setSoil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getSoilData = async () => {
    setError('');
    setSoil(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/soilgrids/${lat}/${lon}`);
      const result = await res.json();
      if (result.success) {
        setSoil(result.data);
      } else {
        setError(result.message || 'Soil data fetch failed');
      }
    } catch (err) {
      setError(err.message || 'Error fetching soil data');
    }
    setLoading(false);
  };

  return (
    <main id="soil" className="section">
      <div className="container">
        <h2>Soil Analysis</h2>
        <div className="soil-analysis">
          <div className="manual-input">
            <h3>Get Soil Data by Coordinates</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Latitude</label>
                <input type="number" className="form-control" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 28.61" />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input type="number" className="form-control" value={lon} onChange={e => setLon(e.target.value)} placeholder="e.g. 77.23" />
              </div>
              <div className="form-group">
                <button className="btn btn--primary" onClick={getSoilData} disabled={loading || !lat || !lon}>Get Soil Data</button>
              </div>
            </div>
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {soil && (
              <div className="soil-results">
                <h3>Soil Data</h3>
                <pre style={{ background: '#222', color: '#fff', padding: 10, borderRadius: 6, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(soil, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
import React, { useState } from 'react';

function WeatherSection() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper: fetch lat/lon for city name using OpenWeatherMap geocoding
  const fetchLatLon = async (cityName) => {
    const apiKey = undefined; // Not needed, backend will handle
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=9d66774f9edc73ea73782c0476ac3452`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
    throw new Error('City not found');
  };

  const getWeather = async () => {
    setError('');
    setWeather(null);
    setLoading(true);
    try {
      // 1. Get lat/lon for city
      const { lat, lon } = await fetchLatLon(city);
      // 2. Call backend for weather
      const res = await fetch(`/api/weather/current/${lat}/${lon}`);
      const result = await res.json();
      if (result.success) {
        setWeather(result.data);
      } else {
        setError(result.message || 'Weather fetch failed');
      }
    } catch (err) {
      setError(err.message || 'Error fetching weather');
    }
    setLoading(false);
  };

  return (
    <main id="weather" className="section">
      <div className="container">
        <h2>Weather Information</h2>
        <div className="location-input">
          <input
            type="text"
            className="form-control"
            placeholder="Enter city name"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <button className="btn btn--primary" onClick={getWeather} disabled={loading || !city}>Get Weather</button>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {weather && (
          <div className="weather-display">
            <div className="current-weather">
              <div className="weather-main">
                <div className="weather-icon">☀️</div>
                <div className="weather-temp">{weather.current.temperature}°C</div>
                <div className="weather-desc">{weather.current.description}</div>
              </div>
              <div className="weather-details">
                <div className="weather-detail">
                  <span>Humidity:</span>
                  <span>{weather.current.humidity}%</span>
                </div>
                <div className="weather-detail">
                  <span>Wind Speed:</span>
                  <span>{weather.current.windSpeed} km/h</span>
                </div>
                <div className="weather-detail">
                  <span>Pressure:</span>
                  <span>{weather.current.pressure} hPa</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
import React from 'react';
import './style.css';

// You will need to migrate the HTML from index.html and logic from app.js into React components here.
// For now, this is a placeholder to start the migration.


import React, { useState } from 'react';

function AuthModal({ show, onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <div id="authModal" className={`modal${show ? '' : ' hidden'}`}>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="authTitle">{isLogin ? 'Welcome to AI Crop Advisor' : 'Create Account'}</h2>
          <button id="closeAuth" className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form id="authForm" onSubmit={e => {e.preventDefault(); onAuth();}}>
            {!isLogin && (
              <div className="form-group" id="nameGroup">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input type="text" id="name" className="form-control" placeholder="Enter your name" />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input type="email" id="email" className="form-control" placeholder="Enter your email" required />
            </div>
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" id="password" className="form-control" placeholder="Enter your password" required />
            </div>
            {!isLogin && (
              <div className="form-group" id="roleGroup">
                <label htmlFor="role" className="form-label">Role</label>
                <select id="role" className="form-control">
                  <option value="farmer">Farmer</option>
                  <option value="advisor">Agricultural Advisor</option>
                </select>
              </div>
            )}
            <button type="submit" className="btn btn--primary btn--full-width" id="authSubmit">{isLogin ? 'Sign In' : 'Sign Up'}</button>
          </form>
          <div className="auth-switch">
            <p id="authSwitchText">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <a href="#" id="switchMode" onClick={e => {e.preventDefault(); setIsLogin(!isLogin);}}>{isLogin ? 'Sign Up' : 'Sign In'}</a>
            </p>
          </div>
          <div className="language-selector">
            <label htmlFor="language" className="form-label">Language / भाषा</label>
            <select id="language" className="form-control">
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}


function Navigation() {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>🌾 AI Crop Advisor</h1>
      </div>
      <div className="nav-menu">
        <button className="nav-item active" data-section="dashboard">Dashboard</button>
        <button className="nav-item" data-section="weather">Weather</button>
        <button className="nav-item" data-section="soil">Soil Analysis</button>
        <button className="nav-item" data-section="crops">Crop Recommendation</button>
        <button className="nav-item" data-section="market">Market Prices</button>
        <button className="nav-item" data-section="sensors">IoT Sensors</button>
      </div>
      <div className="nav-actions">
        <button id="voiceBtn" className="btn btn--secondary btn--sm">🎤 Voice</button>
        <button id="profileBtn" className="btn btn--outline btn--sm">Profile</button>
        <button id="logoutBtn" className="btn btn--secondary btn--sm">Logout</button>
      </div>
    </nav>
  );
}

function Dashboard({ user }) {
  return (
    <main id="dashboard" className="section active">
      <div className="container">
        <div className="welcome-header">
          <h2 id="welcomeText">Welcome back, <span id="userName">{user?.name || 'Farmer'}</span>!</h2>
          <p id="dashboardSubtext">Here's your farm overview for today</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🌡️</div>
            <div className="stat-content">
              <h3 id="currentTemp">28°C</h3>
              <p>Current Temperature</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💧</div>
            <div className="stat-content">
              <h3 id="currentHumidity">75%</h3>
              <p>Humidity</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌱</div>
            <div className="stat-content">
              <h3 id="soilPh">6.2</h3>
              <p>Soil pH</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3 id="marketAlert">₹2,500</h3>
              <p>Rice Price/Quintal</p>
            </div>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Recent Recommendations</h3>
            <div id="recentRecommendations">
              <div className="recommendation-item">
                <span className="crop-name">Wheat</span>
                <span className="confidence">96% confidence</span>
              </div>
              <div className="recommendation-item">
                <span className="crop-name">Maize</span>
                <span className="confidence">89% confidence</span>
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <h3>Weather Forecast</h3>
            <div id="weatherForecast">
              <div className="forecast-item">
                <span className="day">Today</span>
                <span className="weather">☀️ Sunny 32°C</span>
              </div>
              <div className="forecast-item">
                <span className="day">Tomorrow</span>
                <span className="weather">⛅ Partly Cloudy 29°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function App() {
  // BYPASS AUTH for debugging: always show UI
  const [showAuth] = useState(false);
  const [user] = useState({ name: 'Smart Farmer' });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showVoice, setShowVoice] = useState(false);

  // Simulate authentication
  const handleAuth = () => {
    setUser({ name: 'Smart Farmer' });
    setShowAuth(false);
    setActiveSection('dashboard'); // Always show dashboard after login
    showNotification('Welcome to AI Crop Advisor!', 'success');
  };

  // Navigation handler
  const handleNavigation = section => {
    setActiveSection(section);
    showNotification(`Switched to ${section.charAt(0).toUpperCase() + section.slice(1)}`, 'info');
  };

  // Notification handler
  const showNotification = (text, type = 'info') => {
    setNotifications(msgs => [...msgs, { text, type }]);
    setTimeout(() => {
      setNotifications(msgs => msgs.slice(1));
    }, 4000);
  };

  // Voice interface handler
  const handleVoice = () => {
    setShowVoice(true);
    showNotification('Voice interface activated', 'info');
  };
  const stopVoice = () => {
    setShowVoice(false);
    showNotification('Voice interface stopped', 'info');
  };

  // Section rendering
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'weather':
        return <WeatherSection />;
      case 'soil':
        return <SoilAnalysisSection />;
      case 'crops':
        return <CropRecommendationSection />;
      case 'market':
        return <MarketPricesSection />;
      case 'sensors':
        return <IoTSensorsSection />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div>
      {/* AuthModal removed for debugging */}
      <LoadingSpinner show={loading} />
      <VoiceInterface show={showVoice} onStop={stopVoice} />
      <Notifications messages={notifications} />
      {/* Always show navigation and main content for debugging */}
      <Navigation />
      <div className="main-content">
        <div className="nav-menu">
          <button className={`nav-item${activeSection === 'dashboard' ? ' active' : ''}`} onClick={() => handleNavigation('dashboard')}>Dashboard</button>
          <button className={`nav-item${activeSection === 'weather' ? ' active' : ''}`} onClick={() => handleNavigation('weather')}>Weather</button>
          <button className={`nav-item${activeSection === 'soil' ? ' active' : ''}`} onClick={() => handleNavigation('soil')}>Soil Analysis</button>
          <button className={`nav-item${activeSection === 'crops' ? ' active' : ''}`} onClick={() => handleNavigation('crops')}>Crop Recommendation</button>
          <button className={`nav-item${activeSection === 'market' ? ' active' : ''}`} onClick={() => handleNavigation('market')}>Market Prices</button>
          <button className={`nav-item${activeSection === 'sensors' ? ' active' : ''}`} onClick={() => handleNavigation('sensors')}>IoT Sensors</button>
        </div>
        {renderSection()}
      </div>
    </div>
  );
}

export default App;
