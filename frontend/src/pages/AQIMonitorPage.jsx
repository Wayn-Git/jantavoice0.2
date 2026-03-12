import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { aqiAPI } from '../services/api';
import { Wind, Search, MapPin, RefreshCw, AlertCircle, Info, ChevronRight } from 'lucide-react';

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

    return (
        <div className="w-full text-foreground py-4 sm:py-8 sm:px-0 relative overflow-hidden">

            {/* ── ANIMATED PARTICLES ── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: `${2 + Math.random() * 4}px`,
                        height: `${2 + Math.random() * 4}px`,
                        borderRadius: '50%',
                        background: i % 3 === 0 ? 'var(--primary, #FF9933)' : i % 3 === 1 ? 'var(--secondary, #138808)' : 'currentColor',
                        animation: `floatParticle ${8 + Math.random() * 12}s ease-in-out infinite ${Math.random() * 5}s`,
                    }} />
                ))}
            </div>

            <style>{`
        @keyframes floatParticle { 0%,100%{transform:translateY(0) scale(1);opacity:.4} 50%{transform:translateY(-40px) scale(1.2);opacity:.8} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .tab-btn { background:none; border:none; color:var(--muted-foreground); font-size:14px; font-weight:700; cursor:pointer; padding:8px 18px; border-radius:12px; transition:all .2s; }
        .tab-btn.active { background:var(--primary-light, rgba(255,153,51,0.1)); color:var(--primary); }
        .forecast-card { background:rgba(128,128,128,0.05); border:1px solid rgba(128,128,128,0.1); border-radius:20px; padding:1rem; text-align:center; transition:all .25s; flex:1; }
        .forecast-card:hover { transform:translateY(-4px); border-color:rgba(128,128,128,0.2); }
        .pollutant-bar { height:6px; border-radius:3px; background:rgba(128,128,128,0.15); overflow:hidden; margin-top:4px; }
        .pollutant-fill { height:100%; border-radius:3px; transition:width 1.2s ease; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:rgba(128,128,128,0.2); border-radius:2px; }
      `}</style>

            {/* ── HEADER ── */}
            <div className="relative z-10 max-w-7xl mx-auto flex items-center justify-between mb-8 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-secondary text-sm flex items-center gap-2">
                        ← Back
                    </button>
                    <div>
                        <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Wind className="text-primary w-6 h-6" /> AQI Monitor
                        </div>
                        <div className="text-xs text-muted-foreground font-medium mt-1">Real-time Air Quality Index — India</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {myAQI && (
                        <div className="glass-card px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2" style={{ border: `1px solid ${getColorForValue(myAQI.aqi.value).color}44` }}>
                            <span style={{ color: getColorForValue(myAQI.aqi.value).color }}>{myAQI.aqi.value}</span>
                            <span className="text-muted-foreground">Your location</span>
                        </div>
                    )}
                    <div className="text-xs text-muted-foreground font-bold">
                        🕐 {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* ── MAIN LAYOUT ── */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 max-w-7xl mx-auto">

                {/* ── LEFT COLUMN ── */}
                <div className="flex flex-col gap-6">

                    {/* SEARCH BAR */}
                    <div className="glass-card rounded-3xl p-6" style={{ animation: 'fadeSlideIn .5s ease both' }}>
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                                <input
                                    ref={searchRef}
                                    className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-12 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setSearchErr(''); }}
                                    placeholder="Search city... (Delhi, Mumbai, Bangalore, Pune...)"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => { setSearchQuery(''); setSearchResult(null); setSearchErr(''); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">✕</button>
                                )}
                            </div>
                            <button type="submit" disabled={searching || !searchQuery.trim()} className="btn btn-primary whitespace-nowrap">
                                {searching ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" /> : 'Search'}
                            </button>
                            {myCoords && (
                                <button type="button" onClick={useMyLocation} className="btn bg-green-500/10 text-green-600 hover:bg-green-500/20 whitespace-nowrap flex items-center gap-2">
                                    <MapPin size={16} /> My Location
                                </button>
                            )}
                        </form>
                        {searchErr && (
                            <div className="mt-3 text-red-500 text-sm bg-red-500/10 p-3 rounded-xl font-medium flex items-center gap-2">
                                <AlertCircle size={16} /> {searchErr}
                            </div>
                        )}
                    </div>

                    {/* MAIN AQI DISPLAY */}
                    {displayData ? (
                        <div className="glass-card rounded-3xl overflow-hidden relative shadow-lg shadow-black/5 flex flex-col" style={{ animation: 'fadeSlideIn .5s .1s ease both' }}>
                            {/* Color accent top */}
                            <div style={{ height: '4px', background: `linear-gradient(90deg,${displayColor},${displayColor}88,transparent)` }} />

                            {/* Tabs */}
                            <div className="px-6 pt-4 pb-2 flex gap-2 border-b border-border overflow-x-auto scrollbar-none">
                                {[['overview', '📊 Overview'], ['pollutants', '🧪 Pollutants'], ['forecast', '📅 Forecast'], ['health', '🏥 Health']].map(([id, label]) => (
                                    <button key={id} className={`tab-btn whitespace-nowrap ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
                                ))}
                            </div>

                            <div className="p-6 md:p-8">
                                {/* City name + demo badge */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div>
                                        <div className="text-3xl font-bold tracking-tight">
                                            {displayData.city}
                                            {displayData.state && <span className="text-lg text-muted-foreground font-medium ml-3">{displayData.state}</span>}
                                        </div>
                                        <div className="text-sm text-muted-foreground font-medium mt-1">
                                            Last updated: {new Date(displayData.updatedAt).toLocaleTimeString('en-IN')}
                                            {displayData.isDemo && <span className="ml-3 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider">DEMO</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* OVERVIEW TAB */}
                                {tab === 'overview' && (
                                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                        <div className="shrink-0 bg-secondary/30 rounded-full p-4">
                                            <AQIGauge value={displayData.aqi.value} color={displayColor} size={200} />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <div className="text-5xl mb-2">{displayData.aqi.emoji}</div>
                                            <div className="text-2xl font-bold" style={{ color: displayColor }}>{displayData.aqi.label}</div>
                                            <div className="text-muted-foreground text-sm font-medium mt-2 mb-6 max-w-md leading-relaxed">{displayData.aqi.advice}</div>
                                            {/* AQI Scale */}
                                            <div className="mb-6">
                                                <div className="text-xs text-muted-foreground font-bold mb-2 tracking-wider">AQI SCALE</div>
                                                <div className="flex gap-1 rounded-full overflow-hidden h-2">
                                                    {AQI_BREAKPOINTS.map((bp, i) => (
                                                        <div key={i} className="flex-1 transition-opacity duration-300" style={{ background: bp.color, opacity: displayData.aqi.value <= bp.max && (i === 0 || displayData.aqi.value > AQI_BREAKPOINTS[i - 1]?.max || 0) ? 1 : 0.2 }} />
                                                    ))}
                                                </div>
                                                <div className="flex justify-between mt-1.5 px-0.5">
                                                    <span className="text-[10px] font-bold text-muted-foreground">0</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground">500</span>
                                                </div>
                                            </div>
                                            {/* Quick stats */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {[['PM2.5', displayData.components.pm25, 'µg/m³'], ['PM10', displayData.components.pm10, 'µg/m³']].map(([k, v, u]) => (
                                                    <div key={k} className="glass-card rounded-2xl p-4 border border-border">
                                                        <div className="text-xs text-muted-foreground font-bold mb-1">{k}</div>
                                                        <div className="text-xl font-bold text-foreground">{v}<span className="text-xs text-muted-foreground ml-1.5">{u}</span></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* POLLUTANTS TAB */}
                                {tab === 'pollutants' && (
                                    <div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                            {[
                                                ['PM2.5', displayData.components.pm25, 'µg/m³', 250, 'Fine particles — penetrate lungs'],
                                                ['PM10', displayData.components.pm10, 'µg/m³', 430, 'Coarse particles — irritate throat'],
                                                ['NO₂', displayData.components.no2, 'µg/m³', 200, 'Nitrogen dioxide — vehicles/industry'],
                                                ['O₃', displayData.components.o3, 'µg/m³', 180, 'Ground ozone — respiratory issues'],
                                                ['CO', displayData.components.co, 'µg/m³', 10000, 'Carbon monoxide — incomplete burning'],
                                                ['SO₂', displayData.components.so2, 'µg/m³', 350, 'Sulfur dioxide — power plants/factories'],
                                            ].map(([name, val, unit, max, desc]) => {
                                                const pct = Math.min((parseFloat(val) / max) * 100, 100);
                                                const barColor = pct > 70 ? 'var(--destructive)' : pct > 40 ? 'var(--primary)' : '#10B981';
                                                return (
                                                    <div key={name} className="glass-card rounded-2xl p-5 border border-border">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="font-bold text-foreground">{name}</div>
                                                            <div className="font-bold" style={{ color: barColor }}>{val}<span className="text-[10px] text-muted-foreground ml-1">{unit}</span></div>
                                                        </div>
                                                        <div className="pollutant-bar">
                                                            <div className="pollutant-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${barColor}88,${barColor})` }} />
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-medium mt-3 leading-relaxed">{desc}</div>
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
                                                <div className="text-sm font-bold text-muted-foreground tracking-tight mb-4">5-Day AQI Forecast for {displayData.city}</div>
                                                <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-none">
                                                    {forecast.map((day, i) => {
                                                        const col = getColorForValue(day.aqi.value).color;
                                                        return (
                                                            <div key={i} className="forecast-card shrink-0 min-w-[120px]">
                                                                <div className="text-xs font-bold text-muted-foreground mb-3">{day.date}</div>
                                                                <div className="flex justify-center mb-2">
                                                                    <AQIGauge value={day.aqi.value} color={col} size={80} />
                                                                </div>
                                                                <div className="mt-2 text-sm font-bold" style={{ color: col }}>{day.aqi.label}</div>
                                                                {day.pm25 && <div className="text-[10px] text-muted-foreground font-medium mt-1">PM2.5: {day.pm25}</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <div className="text-4xl mb-3 opacity-50">📅</div>
                                                <div className="font-medium text-sm">Loading forecast...</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* HEALTH TAB */}
                                {tab === 'health' && (
                                    <div>
                                        <div className="grid gap-3">
                                            {[
                                                { group: '👶 Children', rec: displayData.aqi.value > 200 ? 'Keep indoors. No outdoor play.' : displayData.aqi.value > 100 ? 'Limit outdoor time to 30 mins.' : 'Safe for normal outdoor play.' },
                                                { group: '👴 Elderly', rec: displayData.aqi.value > 150 ? 'Stay indoors. Use air purifier.' : displayData.aqi.value > 100 ? 'Wear N95 if going out.' : 'Safe. Take usual precautions.' },
                                                { group: '🏃 Active Adults', rec: displayData.aqi.value > 200 ? 'No outdoor exercise.' : displayData.aqi.value > 100 ? 'Move exercise indoors.' : 'Good conditions for outdoor exercise.' },
                                                { group: '🫁 Respiratory', rec: displayData.aqi.value > 100 ? 'Avoid going out. Take prescribed medication.' : 'Low risk. Follow doctor advice.' },
                                                { group: '🤰 Pregnant', rec: displayData.aqi.value > 150 ? 'Stay indoors. Consult doctor.' : displayData.aqi.value > 100 ? 'Minimize outdoor time.' : 'Moderate caution advised.' },
                                            ].map(({ group, rec }) => (
                                                <div key={group} className="flex gap-4 items-start glass-card p-4 rounded-2xl border border-border">
                                                    <div className="text-2xl shrink-0 leading-none">{group.split(' ')[0]}</div>
                                                    <div>
                                                        <div className="font-bold text-sm text-foreground mb-1">{group.split(' ').slice(1).join(' ')}</div>
                                                        <div className="text-xs text-muted-foreground font-medium leading-relaxed">{rec}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {displayData.aqi.value > 150 && (
                                            <button onClick={() => navigate('/report?tab=quick&prefill=Air+pollution+in+' + displayData.city + '+AQI+' + displayData.aqi.value)}
                                                className="btn btn-primary w-full mt-6 py-3.5 flex items-center justify-center gap-2 text-sm">
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
                        <div className="glass-card rounded-2xl p-5 mt-6" style={{ animation: 'fadeSlideIn .5s .2s ease both' }}>
                            <div className="font-bold mb-4 flex justify-between items-center">
                                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Major Cities Ranking</span>
                                <button onClick={loadCities} className="btn btn-secondary text-xs px-3 py-1 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Refresh
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {[...cities].sort((a, b) => (b.aqi?.value || 0) - (a.aqi?.value || 0)).map((city, i) => {
                                    const col = city.aqi ? getColorForValue(city.aqi.value).color : 'var(--muted-foreground)';
                                    return (
                                        <div key={city.name} onClick={() => { setSearchQuery(city.name); setSearchResult(null); aqiAPI.getByCity(city.name).then(r => setSearchResult(r.data)).catch(() => { }); }}
                                            className="flex items-center gap-3 bg-secondary/50 hover:bg-secondary rounded-xl p-3 cursor-pointer transition-all border border-transparent hover:border-border group"
                                            style={{ '--hover-border': `${col}55` }}>
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors"
                                                style={{ background: `${col}15`, border: `1px solid ${col}40`, color: col }}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm truncate group-hover:text-foreground transition-colors">{city.name}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">{city.aqi?.label}</div>
                                            </div>
                                            <div className="font-bold text-base shrink-0" style={{ color: col }}>{city.aqi?.value || '—'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN: INDIA MAP ── */}
                <div className="flex flex-col gap-6 sticky top-24 h-fit pb-12">
                    <div className="glass-card rounded-3xl p-6" style={{ animation: 'fadeSlideIn .5s .15s ease both' }}>
                        <div className="font-bold mb-3 flex items-center gap-2">
                            <MapPin className="text-primary w-5 h-5" /> India Air Quality Map
                            <span className="text-xs text-muted-foreground font-medium ml-1">Tap a city</span>
                        </div>

                        {/* SVG Map */}
                        <div className="bg-secondary/30 rounded-2xl p-4 relative border border-border">
                            <svg viewBox="100 40 320 340" className="w-full h-auto drop-shadow-md">
                                {/* Ocean background */}
                                <rect x="100" y="40" width="320" height="340" fill="var(--background)" className="opacity-50" rx="8" />

                                {/* Grid lines */}
                                {[...Array(6)].map((_, i) => (
                                    <line key={'h' + i} x1="100" y1={40 + i * 57} x2="420" y2={40 + i * 57} stroke="currentColor" className="opacity-5" strokeWidth="0.5" />
                                ))}
                                {[...Array(6)].map((_, i) => (
                                    <line key={'v' + i} x1={100 + i * 53} y1="40" x2={100 + i * 53} y2="380" stroke="currentColor" className="opacity-5" strokeWidth="0.5" />
                                ))}

                                {/* State paths */}
                                {INDIA_STATES.map(state => {
                                    const cityInState = Object.entries(CITY_COORDS).find(([, c]) => {
                                        const dx = Math.abs(c.mx - state.cx);
                                        const dy = Math.abs(c.my - state.cy);
                                        return dx < 30 && dy < 30;
                                    });
                                    const cityData = cityInState && cities.find(c => c.name === cityInState[0]);
                                    const stateColor = cityData ? getColorForValue(cityData.aqi?.value || 0).color : 'currentColor';
                                    const isHovered = hoveredState === state.id;
                                    return (
                                        <path
                                            key={state.id}
                                            className="transition-all duration-300 cursor-pointer"
                                            d={state.d}
                                            fill={isHovered ? stateColor : stateColor}
                                            fillOpacity={isHovered ? 0.8 : (cityData ? 0.3 : 0.05)}
                                            stroke={isHovered ? stateColor : "currentColor"}
                                            strokeOpacity={isHovered ? 1 : 0.1}
                                            strokeWidth={isHovered ? 1.5 : 0.5}
                                            onMouseEnter={() => setHoveredState(state.id)}
                                            onMouseLeave={() => setHoveredState(null)}
                                        />
                                    );
                                })}

                                {/* City dots */}
                                {Object.entries(CITY_COORDS).map(([name, coords]) => {
                                    const cityData = cities.find(c => c.name === name);
                                    const col = cityData ? getColorForValue(cityData.aqi?.value || 0).color : 'var(--muted-foreground)';
                                    const isSelected = selectedCity === name || (displayData?.city === name);
                                    const val = cityData?.aqi?.value;
                                    return (
                                        <g key={name} onClick={() => {
                                            setSelectedCity(name);
                                            setSearchQuery(name);
                                            aqiAPI.getByCity(name).then(r => setSearchResult(r.data)).catch(() => { });
                                        }} className="cursor-pointer group">
                                            {/* Pulse ring for selected */}
                                            {isSelected && (
                                                <circle cx={coords.mx} cy={coords.my} r="14" fill="none" stroke={col} strokeWidth="1" className="opacity-40 animate-ping origin-center" style={{ transformOrigin: `${coords.mx}px ${coords.my}px` }} />
                                            )}
                                            {/* Dot */}
                                            <circle cx={coords.mx} cy={coords.my} r={isSelected ? 8 : 6}
                                                fill={col}
                                                stroke="var(--background)" strokeWidth="1.5"
                                                className="transition-all duration-300"
                                                style={{ filter: `drop-shadow(0 0 ${isSelected ? 8 : 4}px ${col})` }}
                                            />
                                            {/* City label */}
                                            <text x={coords.mx + 10} y={coords.my + 4} fill="currentColor" fontSize="7.5" fontWeight="700" className="opacity-80 group-hover:opacity-100 transition-opacity">
                                                {name}
                                            </text>
                                            {/* AQI value */}
                                            {val && (
                                                <text x={coords.mx + 10} y={coords.my + 13} fill={col} fontSize="6.5" fontWeight="800">
                                                    {val}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Hovered state tooltip */}
                            {hoveredState && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-popover/90 text-popover-foreground backdrop-blur-md rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap pointer-events-none border border-border/50 shadow-xl">
                                    {INDIA_STATES.find(s => s.id === hoveredState)?.name}
                                </div>
                            )}

                            {/* Map legend */}
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50 justify-center">
                                {AQI_BREAKPOINTS.map(bp => (
                                    <div key={bp.label} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full" style={{ background: bp.color }} />
                                        <span>{bp.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* QUICK TIPS CARD */}
                    <div className="glass-card rounded-3xl p-6" style={{ animation: 'fadeSlideIn .5s .25s ease both' }}>
                        <div className="font-bold mb-4 flex items-center gap-2">
                            <Info className="text-blue-400 w-5 h-5" /> Air Quality Tips
                        </div>
                        <div className="flex flex-col gap-3">
                            {[
                                { icon: '😷', tip: 'Wear N95 masks when AQI > 150' },
                                { icon: '🌿', tip: 'Keep indoor plants for natural filtering' },
                                { icon: '🚗', tip: 'Avoid rush hour outdoor exercise' },
                                { icon: '💨', tip: 'Use air purifier indoors when AQI > 200' },
                                { icon: '🌊', tip: 'Wet mopping reduces indoor dust' },
                                { icon: '📱', tip: 'Check AQI before outdoor activities' },
                            ].map(({ icon, tip }) => (
                                <div key={tip} className="flex gap-3 items-start text-sm text-muted-foreground font-medium leading-relaxed bg-secondary/20 p-3 rounded-xl">
                                    <span className="shrink-0 text-lg leading-none">{icon}</span>{tip}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DEMO MODE WARNING */}
                    {(cities[0]?.isDemo || myAQI?.isDemo) && (
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 text-sm leading-relaxed text-muted-foreground">
                            <div className="font-bold text-primary mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Demo Mode Active
                            </div>
                            Add <code className="bg-secondary px-1.5 py-0.5 rounded text-blue-400 text-xs mx-1">OPENWEATHER_API_KEY</code> to <code className="bg-secondary px-1.5 py-0.5 rounded text-blue-400 text-xs mx-1">backend/.env</code> for live data.
                            <a href="https://openweathermap.org/api" target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 flex items-center gap-1 mt-3 font-bold text-xs transition-colors">
                                Get free key <ChevronRight className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
