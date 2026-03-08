import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { aqiAPI } from '../services/api';

// ── India SVG Map paths (simplified state boundaries) ──
const INDIA_STATES = [
    { id: 'JK', name: 'J&K', d: 'M 178 48 L 195 42 L 215 50 L 220 65 L 208 72 L 195 68 L 182 58 Z', cx: 200, cy: 57 },
    { id: 'HP', name: 'Himachal', d: 'M 210 70 L 225 65 L 235 75 L 228 88 L 215 85 Z', cx: 222, cy: 77 },
    { id: 'PB', name: 'Punjab', d: 'M 188 75 L 208 70 L 215 85 L 205 95 L 190 90 Z', cx: 202, cy: 82 },
    { id: 'UK', name: 'Uttarakhand', d: 'M 228 85 L 248 80 L 258 92 L 248 105 L 232 100 Z', cx: 243, cy: 92 },
    { id: 'UP', name: 'UP', d: 'M 205 92 L 255 88 L 268 108 L 258 125 L 218 128 L 200 112 Z', cx: 234, cy: 108 },
    { id: 'HR', name: 'Haryana', d: 'M 195 88 L 215 85 L 220 100 L 205 108 L 192 100 Z', cx: 206, cy: 96 },
    { id: 'DL', name: 'Delhi', d: 'M 210 98 L 218 95 L 220 103 L 212 106 Z', cx: 215, cy: 100 },
    { id: 'RJ', name: 'Rajasthan', d: 'M 168 95 L 210 90 L 218 128 L 210 158 L 178 165 L 155 148 L 150 118 Z', cx: 185, cy: 128 },
    { id: 'BR', name: 'Bihar', d: 'M 258 108 L 292 105 L 300 122 L 288 135 L 260 132 Z', cx: 278, cy: 118 },
    { id: 'WB', name: 'W. Bengal', d: 'M 295 108 L 315 112 L 320 140 L 308 158 L 295 148 L 288 132 Z', cx: 304, cy: 132 },
    { id: 'JH', name: 'Jharkhand', d: 'M 268 132 L 295 128 L 298 148 L 282 162 L 265 155 Z', cx: 280, cy: 145 },
    { id: 'OD', name: 'Odisha', d: 'M 270 158 L 300 148 L 312 165 L 305 185 L 280 190 L 265 175 Z', cx: 288, cy: 170 },
    { id: 'MP', name: 'MP', d: 'M 188 140 L 248 132 L 265 152 L 258 175 L 225 182 L 188 172 L 175 158 Z', cx: 220, cy: 157 },
    { id: 'GJ', name: 'Gujarat', d: 'M 135 148 L 178 140 L 182 170 L 172 195 L 148 202 L 128 185 L 122 165 Z', cx: 152, cy: 172 },
    { id: 'MH', name: 'Maharashtra', d: 'M 175 175 L 265 168 L 272 198 L 258 225 L 220 238 L 178 230 L 160 210 L 155 192 Z', cx: 215, cy: 202 },
    { id: 'CG', name: 'Chhattisgarh', d: 'M 248 172 L 282 165 L 292 188 L 280 215 L 255 218 L 245 198 Z', cx: 268, cy: 192 },
    { id: 'TL', name: 'Telangana', d: 'M 222 225 L 265 218 L 270 245 L 255 262 L 228 258 L 215 242 Z', cx: 243, cy: 242 },
    { id: 'AP', name: 'Andhra', d: 'M 220 258 L 275 252 L 282 280 L 268 302 L 238 308 L 215 290 L 212 268 Z', cx: 247, cy: 280 },
    { id: 'KA', name: 'Karnataka', d: 'M 175 242 L 222 235 L 228 268 L 215 295 L 190 305 L 165 288 L 158 262 Z', cx: 193, cy: 272 },
    { id: 'KL', name: 'Kerala', d: 'M 178 305 L 200 298 L 205 328 L 195 355 L 178 358 L 165 342 L 162 318 Z', cx: 184, cy: 328 },
    { id: 'TN', name: 'Tamil Nadu', d: 'M 200 295 L 235 305 L 238 335 L 220 358 L 198 355 L 188 335 L 192 308 Z', cx: 214, cy: 328 },
    { id: 'AS', name: 'Assam', d: 'M 318 105 L 350 100 L 362 118 L 348 130 L 318 128 Z', cx: 338, cy: 115 },
    { id: 'SK', name: 'Sikkim', d: 'M 308 95 L 322 90 L 328 100 L 318 108 Z', cx: 316, cy: 98 },
    { id: 'NE', name: 'NE States', d: 'M 348 100 L 385 95 L 395 125 L 375 140 L 348 132 Z', cx: 370, cy: 115 },
    { id: 'GA', name: 'Goa', d: 'M 160 250 L 175 248 L 178 262 L 165 265 Z', cx: 169, cy: 256 },
];

// Cities with map coordinates
const CITY_COORDS = {
    Delhi: { lat: 28.6139, lon: 77.2090, mx: 213, my: 99 },
    Mumbai: { lat: 19.0760, lon: 72.8777, mx: 158, my: 215 },
    Bangalore: { lat: 12.9716, lon: 77.5946, mx: 200, my: 278 },
    Hyderabad: { lat: 17.3850, lon: 78.4867, mx: 240, my: 245 },
    Chennai: { lat: 13.0827, lon: 80.2707, mx: 222, my: 298 },
    Kolkata: { lat: 22.5726, lon: 88.3639, mx: 305, my: 145 },
    Pune: { lat: 18.5204, lon: 73.8567, mx: 175, my: 215 },
    Ahmedabad: { lat: 23.0225, lon: 72.5714, mx: 155, my: 172 },
    Jaipur: { lat: 26.9124, lon: 75.7873, mx: 195, my: 115 },
    Lucknow: { lat: 26.8467, lon: 80.9462, mx: 238, my: 112 },
    Chandigarh: { lat: 30.7333, lon: 76.7794, mx: 205, my: 88 },
    Bhopal: { lat: 23.2599, lon: 77.4126, mx: 220, my: 155 },
};

const AQI_BREAKPOINTS = [
    { max: 50, label: 'Good', color: '#00C853', bg: '#E8F5E9' },
    { max: 100, label: 'Satisfactory', color: '#64DD17', bg: '#F1F8E9' },
    { max: 200, label: 'Moderate', color: '#FFD600', bg: '#FFFDE7' },
    { max: 300, label: 'Poor', color: '#FF6D00', bg: '#FFF3E0' },
    { max: 400, label: 'Very Poor', color: '#D50000', bg: '#FFEBEE' },
    { max: 500, label: 'Severe', color: '#7B1FA2', bg: '#F3E5F5' },
];

function getColorForValue(val) {
    for (const bp of AQI_BREAKPOINTS) { if (val <= bp.max) return bp; }
    return AQI_BREAKPOINTS[AQI_BREAKPOINTS.length - 1];
}

// ── GAUGE COMPONENT ──
function AQIGauge({ value, color, size = 180 }) {
    const r = (size / 2) * 0.72;
    const cx = size / 2;
    const cy = size / 2 + 10;
    const maxAQI = 500;
    const angle = Math.min((value / maxAQI) * 270, 270);
    const startAngle = -225 * (Math.PI / 180);
    const endAngle = (startAngle + (angle * Math.PI / 180));
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = angle > 180 ? 1 : 0;
    const totalArc = 270 * Math.PI / 180;
    const tx1 = cx + r * Math.cos(startAngle);
    const ty1 = cy + r * Math.sin(startAngle);
    const tx2 = cx + r * Math.cos(startAngle + totalArc);
    const ty2 = cy + r * Math.sin(startAngle + totalArc);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Track */}
            <path d={`M ${tx1} ${ty1} A ${r} ${r} 0 1 1 ${tx2} ${ty2}`}
                fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" strokeLinecap="round" />
            {/* Value arc */}
            {value > 0 && (
                <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
                    fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${color}88)`, transition: 'all 1.2s cubic-bezier(.34,1.56,.64,1)' }} />
            )}
            {/* Glow dot */}
            {value > 0 && (
                <circle cx={x2} cy={y2} r="6" fill={color}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
            )}
            {/* Value text */}
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize={size * 0.22} fontWeight="800" fill="white"
                style={{ fontFamily: 'monospace' }}>{value}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={size * 0.08} fill="rgba(255,255,255,0.7)">AQI INDEX</text>
        </svg>
    );
}

// ── MAIN PAGE COMPONENT ──
export default function AQIMonitorPage() {
    const navigate = useNavigate();
    const [myAQI, setMyAQI] = useState(null);
    const [cities, setCities] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchErr, setSearchErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState(null);
    const [hoveredState, setHoveredState] = useState(null);
    const [myCoords, setMyCoords] = useState(null);
    const [tab, setTab] = useState('overview');
    const searchRef = useRef(null);

    useEffect(() => {
        loadCities();
        navigator.geolocation?.getCurrentPosition(
            pos => {
                setMyCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                loadMyAQI(pos.coords.latitude, pos.coords.longitude);
            },
            () => { setLoading(false); }
        );
    }, []);

    async function loadMyAQI(lat, lon) {
        try {
            const res = await aqiAPI.getByCoords(lat, lon);
            setMyAQI(res.data);
            loadForecast(lat, lon);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function loadCities() {
        try {
            const res = await aqiAPI.getCities();
            setCities(res.data.cities || []);
        } catch (e) { console.error(e); }
    }

    async function loadForecast(lat, lon) {
        try {
            const res = await aqiAPI.getForecast(lat, lon);
            setForecast(res.data.forecast || []);
        } catch (e) { }
    }

    async function handleSearch(e) {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true); setSearchErr(''); setSearchResult(null);
        try {
            const res = await aqiAPI.getByCity(searchQuery.trim());
            setSearchResult(res.data);
            // Load forecast for searched city
            loadForecast(res.data.coordinates.lat, res.data.coordinates.lon);
            setTab('overview');
        } catch (e) {
            setSearchErr(e.response?.data?.message || 'City not found. Try another name.');
        }
        setSearching(false);
    }

    function useMyLocation() {
        if (!myAQI) return;
        setSearchResult(null);
        setSearchQuery('');
    }

    const displayData = searchResult || myAQI;
    const displayColor = displayData ? getColorForValue(displayData.aqi.value).color : '#FF9933';

    // Page styles
    const pageStyle = {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A1A 0%, #0D1B2A 40%, #0A1628 70%, #0D0A1A 100%)',
        fontFamily: "'Nunito', sans-serif",
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
    };

    return (
        <div style={pageStyle}>

            {/* ── ANIMATED PARTICLES ── */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: `${2 + Math.random() * 4}px`,
                        height: `${2 + Math.random() * 4}px`,
                        borderRadius: '50%',
                        background: i % 3 === 0 ? 'rgba(255,153,51,0.4)' : i % 3 === 1 ? 'rgba(19,136,8,0.3)' : 'rgba(255,255,255,0.15)',
                        animation: `floatParticle ${8 + Math.random() * 12}s ease-in-out infinite ${Math.random() * 5}s`,
                    }} />
                ))}
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Rajdhani:wght@600;700&display=swap');
        @keyframes floatParticle { 0%,100%{transform:translateY(0) scale(1);opacity:.4} 50%{transform:translateY(-40px) scale(1.2);opacity:.8} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmerBg { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes gaugeIn { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
        @keyframes numberCount { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        @keyframes borderGlow { 0%,100%{box-shadow:0 0 15px rgba(255,153,51,.3)} 50%{box-shadow:0 0 30px rgba(255,153,51,.6)} }
        .aqi-card { background:rgba(255,255,255,0.06); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.10); border-radius:20px; transition:all .3s ease; }
        .aqi-card:hover { background:rgba(255,255,255,0.10); border-color:rgba(255,153,51,0.3); transform:translateY(-3px); }
        .city-dot:hover { r:9; }
        .state-path { transition:fill .3s ease; cursor:pointer; }
        .state-path:hover { opacity:0.85; }
        .search-input:focus { outline:none; border-color:rgba(255,153,51,0.7) !important; box-shadow:0 0 0 3px rgba(255,153,51,0.15) !important; }
        .tab-btn { background:none; border:none; color:rgba(255,255,255,0.5); font-family:'Nunito',sans-serif; font-size:.85rem; font-weight:700; cursor:pointer; padding:8px 18px; border-radius:10px; transition:all .2s; }
        .tab-btn.active { background:rgba(255,153,51,0.15); color:#FF9933; border:1px solid rgba(255,153,51,0.3); }
        .forecast-card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; text-align:center; transition:all .25s; flex:1; }
        .forecast-card:hover { background:rgba(255,255,255,0.10); transform:translateY(-4px); }
        .pollutant-bar { height:6px; border-radius:3px; background:rgba(255,255,255,0.1); overflow:hidden; margin-top:4px; }
        .pollutant-fill { height:100%; border-radius:3px; transition:width 1.2s ease; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:rgba(255,153,51,0.4); border-radius:2px; }
      `}</style>

            {/* ── HEADER ── */}
            <div style={{ position: 'relative', zIndex: 10, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '.85rem', fontWeight: '700', fontFamily: 'Nunito,sans-serif', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        ← Back
                    </button>
                    <div>
                        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.6rem', fontWeight: '700', letterSpacing: '1px' }}>
                            🌬️ AQI Monitor
                        </div>
                        <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '-2px' }}>Real-time Air Quality Index — India</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    {myAQI && (
                        <div style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${getColorForValue(myAQI.aqi.value).color}44`, borderRadius: '12px', padding: '6px 14px', fontSize: '.82rem' }}>
                            <span style={{ color: getColorForValue(myAQI.aqi.value).color, fontWeight: '800' }}>{myAQI.aqi.value}</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '.4rem' }}>Your location</span>
                        </div>
                    )}
                    <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.4)' }}>
                        🕐 {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* ── MAIN LAYOUT ── */}
            <div style={{ position: 'relative', zIndex: 5, display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>

                {/* ── LEFT COLUMN ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* SEARCH BAR */}
                    <div className="aqi-card" style={{ padding: '1.25rem', animation: 'fadeSlideIn .5s ease both' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', pointerEvents: 'none' }}>🔍</span>
                                <input
                                    ref={searchRef}
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setSearchErr(''); }}
                                    placeholder="Search city... (Delhi, Mumbai, Bangalore, Pune...)"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 16px 12px 44px', color: 'white', fontSize: '.9rem', fontFamily: 'Nunito,sans-serif', boxSizing: 'border-box' }}
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => { setSearchQuery(''); setSearchResult(null); setSearchErr(''); }}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>✕</button>
                                )}
                            </div>
                            <button type="submit" disabled={searching || !searchQuery.trim()}
                                style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#FF9933,#E8720C)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '800', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'Nunito,sans-serif', whiteSpace: 'nowrap', opacity: searching ? 0.7 : 1 }}>
                                {searching ? '⏳' : '🌍 Search'}
                            </button>
                            {myCoords && (
                                <button type="button" onClick={useMyLocation}
                                    style={{ padding: '12px 18px', background: 'rgba(19,136,8,0.2)', border: '1px solid rgba(19,136,8,0.4)', borderRadius: '12px', color: '#4CAF50', fontWeight: '700', fontSize: '.82rem', cursor: 'pointer', fontFamily: 'Nunito,sans-serif', whiteSpace: 'nowrap' }}>
                                    📍 My Location
                                </button>
                            )}
                        </form>
                        {searchErr && (
                            <div style={{ marginTop: '.75rem', color: '#EF4444', fontSize: '.82rem', background: 'rgba(239,68,68,0.1)', padding: '.5rem .75rem', borderRadius: '8px' }}>
                                ⚠️ {searchErr}
                            </div>
                        )}
                    </div>

                    {/* MAIN AQI DISPLAY */}
                    {displayData ? (
                        <div className="aqi-card" style={{ padding: '0', overflow: 'hidden', animation: 'fadeSlideIn .5s .1s ease both', position: 'relative' }}>
                            {/* Color accent top */}
                            <div style={{ height: '4px', background: `linear-gradient(90deg,${displayColor},${displayColor}88,transparent)` }} />

                            {/* Tabs */}
                            <div style={{ padding: '1rem 1.5rem .5rem', display: 'flex', gap: '.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {[['overview', '📊 Overview'], ['pollutants', '🧪 Pollutants'], ['forecast', '📅 Forecast'], ['health', '🏥 Health']].map(([id, label]) => (
                                    <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
                                ))}
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                {/* City name + demo badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
                                    <div>
                                        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '1.8rem', fontWeight: '700', lineHeight: 1 }}>
                                            {displayData.city}
                                            {displayData.state ? <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: '400', marginLeft: '.5rem' }}>{displayData.state}</span> : null}
                                        </div>
                                        <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '.2rem' }}>
                                            Last updated: {new Date(displayData.updatedAt).toLocaleTimeString('en-IN')}
                                            {displayData.isDemo && <span style={{ marginLeft: '.5rem', background: 'rgba(255,153,51,0.2)', color: '#FF9933', padding: '1px 8px', borderRadius: '10px', fontSize: '.68rem', fontWeight: '800' }}>DEMO</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* OVERVIEW TAB */}
                                {tab === 'overview' && (
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ flexShrink: 0 }}>
                                            <AQIGauge value={displayData.aqi.value} color={displayColor} size={200} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '.3rem' }}>{displayData.aqi.emoji}</div>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: displayColor, fontFamily: 'Rajdhani,sans-serif' }}>{displayData.aqi.label}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '.88rem', lineHeight: '1.6', marginTop: '.4rem', marginBottom: '1.25rem', maxWidth: '280px' }}>{displayData.aqi.advice}</div>
                                            {/* AQI Scale */}
                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '.4rem', fontWeight: '700' }}>AQI SCALE</div>
                                                <div style={{ display: 'flex', gap: '3px', borderRadius: '6px', overflow: 'hidden', height: '10px' }}>
                                                    {AQI_BREAKPOINTS.map((bp, i) => (
                                                        <div key={i} style={{ flex: 1, background: bp.color, opacity: displayData.aqi.value <= bp.max && (i === 0 || displayData.aqi.value > AQI_BREAKPOINTS[i - 1]?.max || 0) ? 1 : 0.35, transition: 'opacity .3s' }} />
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem' }}>
                                                    <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,0.3)' }}>0</span>
                                                    <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,0.3)' }}>500</span>
                                                </div>
                                            </div>
                                            {/* Quick stats */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                                                {[['PM2.5', displayData.components.pm25, 'µg/m³'], ['PM10', displayData.components.pm10, 'µg/m³']].map(([k, v, u]) => (
                                                    <div key={k} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '.6rem .8rem' }}>
                                                        <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{k}</div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{v}<span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,0.4)', marginLeft: '3px' }}>{u}</span></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* POLLUTANTS TAB */}
                                {tab === 'pollutants' && (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                            {[
                                                ['PM2.5', displayData.components.pm25, 'µg/m³', 250, 'Fine particles — penetrate deep into lungs'],
                                                ['PM10', displayData.components.pm10, 'µg/m³', 430, 'Coarse particles — irritate nose and throat'],
                                                ['NO₂', displayData.components.no2, 'µg/m³', 200, 'Nitrogen dioxide — from vehicles and industry'],
                                                ['O₃', displayData.components.o3, 'µg/m³', 180, 'Ground ozone — causes respiratory issues'],
                                                ['CO', displayData.components.co, 'µg/m³', 10000, 'Carbon monoxide — from incomplete combustion'],
                                                ['SO₂', displayData.components.so2, 'µg/m³', 350, 'Sulfur dioxide — from power plants and factories'],
                                            ].map(([name, val, unit, max, desc]) => {
                                                const pct = Math.min((parseFloat(val) / max) * 100, 100);
                                                const barColor = pct > 70 ? '#D50000' : pct > 40 ? '#FF6D00' : '#00C853';
                                                return (
                                                    <div key={name} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.4rem' }}>
                                                            <div style={{ fontWeight: '800', fontSize: '1rem' }}>{name}</div>
                                                            <div style={{ fontWeight: '800', color: barColor, fontSize: '1rem' }}>{val}<span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,0.4)', marginLeft: '2px' }}>{unit}</span></div>
                                                        </div>
                                                        <div className="pollutant-bar">
                                                            <div className="pollutant-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${barColor}88,${barColor})` }} />
                                                        </div>
                                                        <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,0.35)', marginTop: '.4rem', lineHeight: '1.4' }}>{desc}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* FORECAST TAB */}
                                {tab === 'forecast' && (
                                    <div>
                                        {forecast.length > 0 ? (
                                            <>
                                                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>5-Day AQI Forecast for {displayData.city}</div>
                                                <div style={{ display: 'flex', gap: '.75rem' }}>
                                                    {forecast.map((day, i) => {
                                                        const col = getColorForValue(day.aqi.value).color;
                                                        return (
                                                            <div key={i} className="forecast-card">
                                                                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '.4rem', fontWeight: '700' }}>{day.date}</div>
                                                                <AQIGauge value={day.aqi.value} color={col} size={80} />
                                                                <div style={{ marginTop: '.4rem', fontSize: '.78rem', color: col, fontWeight: '800' }}>{day.aqi.label}</div>
                                                                {day.pm25 && <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,0.35)', marginTop: '.2rem' }}>PM2.5: {day.pm25}</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.35)' }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📅</div>
                                                Loading forecast...
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* HEALTH TAB */}
                                {tab === 'health' && (
                                    <div>
                                        <div style={{ display: 'grid', gap: '.75rem' }}>
                                            {[
                                                { group: '👶 Children', rec: displayData.aqi.value > 200 ? 'Keep indoors. No outdoor play.' : displayData.aqi.value > 100 ? 'Limit outdoor time to 30 mins.' : 'Safe for normal outdoor play.' },
                                                { group: '👴 Elderly', rec: displayData.aqi.value > 150 ? 'Stay indoors. Use air purifier.' : displayData.aqi.value > 100 ? 'Wear N95 if going out.' : 'Safe. Take usual precautions.' },
                                                { group: '🏃 Active Adults', rec: displayData.aqi.value > 200 ? 'No outdoor exercise.' : displayData.aqi.value > 100 ? 'Move exercise indoors.' : 'Good conditions for outdoor exercise.' },
                                                { group: '🫁 Respiratory', rec: displayData.aqi.value > 100 ? 'Avoid going out. Take prescribed medication.' : 'Low risk. Follow doctor advice.' },
                                                { group: '🤰 Pregnant', rec: displayData.aqi.value > 150 ? 'Stay indoors. Consult doctor.' : displayData.aqi.value > 100 ? 'Minimize outdoor time.' : 'Moderate caution advised.' },
                                            ].map(({ group, rec }) => (
                                                <div key={group} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '.85rem 1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                    <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>{group.split(' ')[0]}</div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '.82rem', marginBottom: '.2rem' }}>{group.split(' ').slice(1).join(' ')}</div>
                                                        <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>{rec}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {displayData.aqi.value > 150 && (
                                            <button onClick={() => navigate('/report?tab=quick&prefill=Air+pollution+in+' + displayData.city + '+AQI+' + displayData.aqi.value)}
                                                style={{ width: '100%', marginTop: '1rem', padding: '12px', background: 'linear-gradient(135deg,#FF9933,#E8720C)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '800', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
                                                📢 Report Pollution Issue in {displayData.city}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="aqi-card" style={{ padding: '3rem', textAlign: 'center', animation: 'fadeSlideIn .5s ease both' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'floatParticle 2s ease infinite' }}>🌬️</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)' }}>Fetching your location's air quality...</div>
                        </div>
                    ) : (
                        <div className="aqi-card" style={{ padding: '2.5rem', textAlign: 'center', animation: 'fadeSlideIn .5s ease both' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                            <div style={{ fontWeight: '700', marginBottom: '.5rem' }}>Location not available</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.85rem', marginBottom: '1.25rem' }}>Search for a city above to see AQI data</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'center' }}>
                                {['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad'].map(c => (
                                    <button key={c} onClick={() => { setSearchQuery(c); searchRef.current?.focus(); }}
                                        style={{ background: 'rgba(255,153,51,0.15)', border: '1px solid rgba(255,153,51,0.3)', color: '#FF9933', borderRadius: '20px', padding: '5px 14px', fontSize: '.8rem', cursor: 'pointer', fontFamily: 'Nunito,sans-serif', fontWeight: '700' }}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CITIES RANKING */}
                    {cities.length > 0 && (
                        <div className="aqi-card" style={{ padding: '1.25rem', animation: 'fadeSlideIn .5s .2s ease both' }}>
                            <div style={{ fontWeight: '800', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🏙️ Major Cities Ranking</span>
                                <button onClick={loadCities} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '.75rem', fontFamily: 'Nunito,sans-serif' }}>🔄 Refresh</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                                {[...cities].sort((a, b) => (b.aqi?.value || 0) - (a.aqi?.value || 0)).map((city, i) => {
                                    const col = city.aqi ? getColorForValue(city.aqi.value).color : '#9E9E9E';
                                    return (
                                        <div key={city.name} onClick={() => { setSearchQuery(city.name); setSearchResult(null); aqiAPI.getByCity(city.name).then(r => setSearchResult(r.data)).catch(() => { }); }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '.6rem .8rem', cursor: 'pointer', transition: 'all .2s', border: `1px solid ${col}22` }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = col + '55'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = col + '22'; }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${col}22`, border: `2px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: '800', color: col, flexShrink: 0 }}>
                                                {i + 1}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '700', fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{city.name}</div>
                                                <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.4)' }}>{city.aqi?.label}</div>
                                            </div>
                                            <div style={{ fontWeight: '800', color: col, fontSize: '1rem', flexShrink: 0 }}>{city.aqi?.value || '—'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN: INDIA MAP ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1.5rem', height: 'fit-content' }}>
                    <div className="aqi-card" style={{ padding: '1.25rem', animation: 'fadeSlideIn .5s .15s ease both' }}>
                        <div style={{ fontWeight: '800', marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                            🗺️ India Air Quality Map
                            <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>Tap a city</span>
                        </div>

                        {/* SVG Map */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1rem', position: 'relative', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <svg viewBox="100 40 320 340" style={{ width: '100%', height: 'auto' }}>
                                {/* Ocean background */}
                                <rect x="100" y="40" width="320" height="340" fill="rgba(13,27,42,0.8)" rx="8" />

                                {/* Grid lines */}
                                {[...Array(6)].map((_, i) => (
                                    <line key={'h' + i} x1="100" y1={40 + i * 57} x2="420" y2={40 + i * 57} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                                ))}
                                {[...Array(6)].map((_, i) => (
                                    <line key={'v' + i} x1={100 + i * 53} y1="40" x2={100 + i * 53} y2="380" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                                ))}

                                {/* State paths */}
                                {INDIA_STATES.map(state => {
                                    const cityInState = Object.entries(CITY_COORDS).find(([, c]) => {
                                        const dx = Math.abs(c.mx - state.cx);
                                        const dy = Math.abs(c.my - state.cy);
                                        return dx < 30 && dy < 30;
                                    });
                                    const cityData = cityInState && cities.find(c => c.name === cityInState[0]);
                                    const stateColor = cityData ? getColorForValue(cityData.aqi?.value || 0).color : 'rgba(255,255,255,0.08)';
                                    const isHovered = hoveredState === state.id;
                                    return (
                                        <path
                                            key={state.id}
                                            className="state-path"
                                            d={state.d}
                                            fill={isHovered ? stateColor + 'cc' : stateColor + (cityData ? '55' : '22')}
                                            stroke={isHovered ? stateColor : 'rgba(255,255,255,0.15)'}
                                            strokeWidth={isHovered ? 1.5 : 0.7}
                                            onMouseEnter={() => setHoveredState(state.id)}
                                            onMouseLeave={() => setHoveredState(null)}
                                        />
                                    );
                                })}

                                {/* City dots */}
                                {Object.entries(CITY_COORDS).map(([name, coords]) => {
                                    const cityData = cities.find(c => c.name === name);
                                    const col = cityData ? getColorForValue(cityData.aqi?.value || 0).color : 'rgba(255,255,255,0.3)';
                                    const isSelected = selectedCity === name || (displayData?.city === name);
                                    const val = cityData?.aqi?.value;
                                    return (
                                        <g key={name} onClick={() => {
                                            setSelectedCity(name);
                                            setSearchQuery(name);
                                            aqiAPI.getByCity(name).then(r => setSearchResult(r.data)).catch(() => { });
                                        }} style={{ cursor: 'pointer' }}>
                                            {/* Pulse ring for selected */}
                                            {isSelected && (
                                                <>
                                                    <circle cx={coords.mx} cy={coords.my} r="14" fill="none" stroke={col} strokeWidth="1" opacity="0.4">
                                                        <animate attributeName="r" from="8" to="18" dur="1.5s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                                                    </circle>
                                                </>
                                            )}
                                            {/* Dot */}
                                            <circle cx={coords.mx} cy={coords.my} r={isSelected ? 8 : 6}
                                                fill={col}
                                                stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"
                                                style={{ filter: `drop-shadow(0 0 ${isSelected ? 8 : 4}px ${col})`, transition: 'all .3s' }}
                                            />
                                            {/* City label */}
                                            <text x={coords.mx + 10} y={coords.my + 4} fill="rgba(255,255,255,0.85)" fontSize="7.5" fontFamily="Nunito,sans-serif" fontWeight="700">
                                                {name}
                                            </text>
                                            {/* AQI value */}
                                            {val && (
                                                <text x={coords.mx + 10} y={coords.my + 13} fill={col} fontSize="6.5" fontFamily="Nunito,sans-serif" fontWeight="800">
                                                    {val}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Hovered state tooltip */}
                            {hoveredState && (
                                <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', borderRadius: '8px', padding: '4px 12px', fontSize: '.75rem', whiteSpace: 'nowrap', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {INDIA_STATES.find(s => s.id === hoveredState)?.name}
                                </div>
                            )}
                        </div>

                        {/* Map legend */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginTop: '.75rem' }}>
                            {AQI_BREAKPOINTS.map(bp => (
                                <div key={bp.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '.65rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: bp.color, flexShrink: 0 }} />
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{bp.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* QUICK TIPS CARD */}
                    <div className="aqi-card" style={{ padding: '1.25rem', animation: 'fadeSlideIn .5s .25s ease both' }}>
                        <div style={{ fontWeight: '800', marginBottom: '.75rem' }}>💡 Air Quality Tips</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {[
                                { icon: '😷', tip: 'Wear N95 masks when AQI > 150' },
                                { icon: '🌿', tip: 'Keep indoor plants — they filter air naturally' },
                                { icon: '🚗', tip: 'Avoid rush hour outdoor exercise near traffic' },
                                { icon: '💨', tip: 'Use air purifier indoors when AQI > 200' },
                                { icon: '🌊', tip: 'Wet mopping reduces indoor dust particles' },
                                { icon: '📱', tip: 'Check AQI before planning outdoor activities' },
                            ].map(({ icon, tip }) => (
                                <div key={tip} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', fontSize: '.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                                    <span style={{ flexShrink: 0 }}>{icon}</span>{tip}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DEMO MODE WARNING */}
                    {(cities[0]?.isDemo || myAQI?.isDemo) && (
                        <div style={{ background: 'rgba(255,153,51,0.1)', border: '1px solid rgba(255,153,51,0.3)', borderRadius: '14px', padding: '1rem', fontSize: '.78rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.65)' }}>
                            <div style={{ fontWeight: '800', color: '#FF9933', marginBottom: '.4rem' }}>⚠️ Demo Mode Active</div>
                            Add <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px', color: '#4FC3F7' }}>OPENWEATHER_API_KEY</code> to <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px', color: '#4FC3F7' }}>backend/.env</code> for live data.
                            <a href="https://openweathermap.org/api" target="_blank" rel="noreferrer" style={{ color: '#FF9933', display: 'block', marginTop: '.4rem', fontWeight: '700' }}>
                                Get free key → openweathermap.org/api ↗
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* ── BOTTOM PADDING ── */}
            <div style={{ height: '3rem' }} />
        </div>
    );
}
