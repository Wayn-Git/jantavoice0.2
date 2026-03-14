import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aqiAPI } from '../services/api';
import {
    Wind, Search, MapPin, RefreshCw, AlertCircle,
    ArrowLeft, BarChart2, FlaskConical, Calendar, Activity,
    Baby, Users, Heart, Shield, Leaf, Car, Droplets, Smartphone
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   AQI SCALE
───────────────────────────────────────────────────── */
const AQI_SCALE = [
    { max: 50, label: 'Good', color: '#10B981' },
    { max: 100, label: 'Satisfactory', color: '#84CC16' },
    { max: 200, label: 'Moderate', color: '#EAB308' },
    { max: 300, label: 'Poor', color: '#F97316' },
    { max: 400, label: 'Very Poor', color: '#EF4444' },
    { max: 500, label: 'Severe', color: '#A855F7' },
];
const getAQI = v => AQI_SCALE.find(b => v <= b.max) ?? AQI_SCALE.at(-1);

/* ─────────────────────────────────────────────────────
   INDIA MAP
   viewBox: "0 0 430 490"
   Projection (equirectangular):
     x = (lon - 67.5) * 13.33 + 10
     y = (37.5 - lat) * 15.67 + 10

   Coordinates computed from real geographic boundary data.
   Key features captured:
   · J&K + Ladakh notch (top-left)
   · Full Himalayan border (Nepal + Bhutan)
   · Arunachal Pradesh bulge (top-right)
   · NE states with chicken-neck + Mizoram/Tripura
   · Bay of Bengal + full east coast
   · Kanyakumari southern tip
   · Kerala + Goa + Konkan west coast
   · Saurashtra/Kathiawar peninsula (Gujarat westward bump)
   · Rann of Kutch concavity
   · Rajasthan + Punjab western border
───────────────────────────────────────────────────── */

// Pre-computed SVG path — viewBox 430 × 490
// Each point derived from: x = (lon-67.5)*13.33+10, y = (37.5-lat)*15.67+10
const INDIA_PATH = `
  M 97,41
  L 123,30  L 157,57  L 170,81  L 183,120
  L 217,151 L 277,167 L 290,167 L 310,164
  L 330,170 L 350,162 L 377,151 L 410,151
  L 403,182 L 370,198 L 350,222 L 337,245
  L 337,253 L 323,253 L 303,261 L 283,253
  L 263,284 L 237,308 L 210,331 L 183,355
  L 181,392 L 174,425 L 143,471
  L 137,464 L 130,441 L 117,417
  L 107,396 L 97,366  L 94,355  L 86,323
  L 81,298  L 81,269  L 77,265
  L 57,269  L 50,269  L 31,248
  L 27,237  L 23,229
  L 37,222  L 43,214  L 57,206
  L 50,190  L 50,167  L 50,135
  L 83,112  L 103,104 L 117,88
  L 103,73  L 121,57
  Z
`;

// Sri Lanka — small island south of Kanyakumari
const SRILANKA_PATH = `M 178,444 L 187,464 L 197,475 L 202,468 L 193,454 Z`;

// Project lat/lon → SVG px using same coordinate system as INDIA_PATH
function proj(lat, lon) {
    return {
        x: (lon - 67.5) * 13.33 + 10,
        y: (37.5 - lat) * 15.67 + 10,
    };
}

// Cities with real lat/lon
const CITIES = {
    Delhi: { lat: 28.61, lon: 77.21 },
    Mumbai: { lat: 19.08, lon: 72.88 },
    Bangalore: { lat: 12.97, lon: 77.59 },
    Hyderabad: { lat: 17.38, lon: 78.49 },
    Chennai: { lat: 13.08, lon: 80.27 },
    Kolkata: { lat: 22.57, lon: 88.36 },
    Pune: { lat: 18.52, lon: 73.86 },
    Ahmedabad: { lat: 23.02, lon: 72.57 },
    Jaipur: { lat: 26.91, lon: 75.79 },
    Lucknow: { lat: 26.85, lon: 80.95 },
    Chandigarh: { lat: 30.73, lon: 76.78 },
    Bhopal: { lat: 23.26, lon: 77.41 },
};

/* ─────────────────────────────────────────────────────
   INDIAN FLAG
   - Saffron / White / Green — correct #FF9933 / #FFFFFF / #138808
   - Ashoka Chakra: 24 spokes, navy blue #000080
   - Aspect ratio 3:2
   - Made at an intentional larger size for legibility
───────────────────────────────────────────────────── */
// function IndianFlag({ height = 38 }) {
//     const W = Math.round(height * 1.5);
//     const H = height;
//     const sh = H / 3;                  // stripe height
//     const cx = W / 2;
//     const cy = H / 2;
//     const R = sh * 0.44;              // chakra outer ring radius
//     const rH = R * 0.18;               // inner hub radius
//     const sw = Math.max(R * 0.09, 0.8); // ring stroke-width (min 0.8px)
//     const spW = Math.max(R * 0.065, 0.6); // spoke width

//     // 24 spokes at 15° intervals, first pointing straight up (−90°)
//     const spokes = Array.from({ length: 24 }, (_, i) => {
//         const a = ((i * 15) - 90) * (Math.PI / 180);
//         const x1 = cx + rH * Math.cos(a);
//         const y1 = cy + rH * Math.sin(a);
//         const x2 = cx + (R - sw * 0.6) * Math.cos(a);
//         const y2 = cy + (R - sw * 0.6) * Math.sin(a);
//         return { x1, y1, x2, y2 };
//     });

//     return (
//         <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
//             style={{
//                 display: 'block', flexShrink: 0,
//                 borderRadius: 2,
//                 border: '0.5px solid rgba(0,0,0,0.15)',
//                 boxShadow: '0 1px 5px rgba(0,0,0,0.18)',
//             }}>
//             {/* Three horizontal stripes */}
//             <rect x={0} y={0} width={W} height={sh} fill="#FF9933" />
//             <rect x={0} y={sh} width={W} height={sh} fill="#FFFFFF" />
//             <rect x={0} y={sh * 2} width={W} height={sh} fill="#138808" />

//             {/* Ashoka Chakra */}
//             {/* Outer ring */}
//             <circle cx={cx} cy={cy} r={R} fill="none" stroke="#000080" strokeWidth={sw} />
//             {/* Inner filled hub */}
//             <circle cx={cx} cy={cy} r={rH} fill="#000080" />
//             {/* 24 spokes */}
//             {spokes.map((s, i) => (
//                 <line key={i}
//                     x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
//                     stroke="#000080" strokeWidth={spW} strokeLinecap="round" />
//             ))}
//         </svg>
//     );
// }

/* ─────────────────────────────────────────────────────
   AQI GAUGE (270° arc)
───────────────────────────────────────────────────── */
function AQIGauge({ value, color, size = 180 }) {
    const r = size * 0.37;
    const cx = size / 2;
    const cy = size / 2 + 8;
    const pct = Math.min(value / 500, 1);
    const toR = d => (d * Math.PI) / 180;
    const pt = d => ({ x: cx + r * Math.cos(toR(d)), y: cy + r * Math.sin(toR(d)) });
    const s = pt(135);
    const eT = pt(405);
    const eV = pt(135 + 270 * pct);
    const lg = 270 * pct > 180 ? 1 : 0;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <path d={`M${s.x},${s.y} A${r},${r} 0 1 1 ${eT.x},${eT.y}`}
                fill="none" stroke="currentColor" strokeOpacity="0.1"
                strokeWidth="8" strokeLinecap="round" className="text-foreground" />
            {value > 0 && (
                <path d={`M${s.x},${s.y} A${r},${r} 0 ${lg} 1 ${eV.x},${eV.y}`}
                    fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                    style={{ transition: 'all 1.1s cubic-bezier(.4,0,.2,1)' }} />
            )}
            <text x={cx} y={cy - 6} textAnchor="middle"
                fontSize={size * 0.26} fontWeight="700" fill={color}>{value}</text>
            <text x={cx} y={cy + 16} textAnchor="middle"
                fontSize={size * 0.072} fill="currentColor" fillOpacity="0.38"
                className="text-foreground"
                style={{ textTransform: 'uppercase', letterSpacing: 2 }}>AQI</text>
        </svg>
    );
}

/* ─────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────── */
export default function AQIMonitorPage() {
    const navigate = useNavigate();
    const [myAQI, setMyAQI] = useState(null);
    const [cities, setCities] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchErr, setSearchErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [selCity, setSelCity] = useState(null);
    const [hovCity, setHovCity] = useState(null);
    const [myCoords, setMyCoords] = useState(null);
    const [tab, setTab] = useState('overview');
    const inputRef = useRef(null);

    useEffect(() => {
        loadCities();
        navigator.geolocation?.getCurrentPosition(
            p => { setMyCoords({ lat: p.coords.latitude, lon: p.coords.longitude }); loadMyAQI(p.coords.latitude, p.coords.longitude); },
            () => setLoading(false)
        );
    }, []);

    const loadMyAQI = async (lat, lon) => {
        try { const r = await aqiAPI.getByCoords(lat, lon); setMyAQI(r.data); loadForecast(lat, lon); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };
    const loadCities = async () => {
        try { const r = await aqiAPI.getCities(); setCities(r.data.cities || []); } catch { }
    };
    const loadForecast = async (lat, lon) => {
        try { const r = await aqiAPI.getForecast(lat, lon); setForecast(r.data.forecast || []); } catch { }
    };
    const handleSearch = async e => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true); setSearchErr(''); setResult(null);
        try {
            const r = await aqiAPI.getByCity(query.trim());
            setResult(r.data);
            loadForecast(r.data.coordinates?.lat, r.data.coordinates?.lon);
            setTab('overview');
        } catch (e) { setSearchErr(e.response?.data?.message || 'City not found.'); }
        setSearching(false);
    };
    const pickCity = async name => {
        setSelCity(name); setQuery(name);
        try { const r = await aqiAPI.getByCity(name); setResult(r.data); setTab('overview'); } catch { }
    };

    const data = result || myAQI;
    const aqiMeta = data ? getAQI(data.aqi.value) : null;
    const sorted = [...cities].sort((a, b) => (b.aqi?.value || 0) - (a.aqi?.value || 0));

    const TABS = [
        { id: 'overview', label: 'Overview', Icon: BarChart2 },
        { id: 'pollutants', label: 'Pollutants', Icon: FlaskConical },
        { id: 'forecast', label: 'Forecast', Icon: Calendar },
        { id: 'health', label: 'Health', Icon: Activity },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* ── STICKY TOPBAR ─────────────────────────────────── */}
            <div className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-sm">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <Wind className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm tracking-tight">Air Quality Monitor</span>
                        <span className="hidden sm:block text-muted-foreground text-xs">— India</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {myAQI && (
                            <div className="hidden md:flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border border-border bg-secondary/50">
                                <span className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: getAQI(myAQI.aqi.value).color }} />
                                {myAQI.city} · <strong>{myAQI.aqi.value}</strong>
                            </div>
                        )}
                        {/* <IndianFlag height={32} /> */}
                    </div>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">

                {/* ── SEARCH ─────────────────────────────────────── */}
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input ref={inputRef}
                            className="w-full h-10 bg-card border border-border rounded-xl pl-10 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all placeholder:text-muted-foreground shadow-sm"
                            value={query}
                            onChange={e => { setQuery(e.target.value); setSearchErr(''); }}
                            placeholder="Search any city…" />
                        {query && (
                            <button type="button"
                                onClick={() => { setQuery(''); setResult(null); setSearchErr(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
                        )}
                    </div>
                    {myCoords && (
                        <button type="button"
                            onClick={() => { setResult(null); setQuery(''); }}
                            className="h-10 w-10 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shadow-sm">
                            <MapPin className="w-4 h-4" />
                        </button>
                    )}
                    <button type="submit" disabled={searching || !query.trim()}
                        className="h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm whitespace-nowrap">
                        {searching ? 'Searching…' : 'Search'}
                    </button>
                </form>
                {searchErr && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive mb-4 -mt-4">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {searchErr}
                    </p>
                )}

                {/* ── 3-COLUMN GRID ─────────────────────────────────
                    Col 1 (220px): AQI gauge + scale + city ranking
                    Col 2 (flex):  Tab panels (detail content)
                    Col 3 (300px): India map + tips
                ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-5 items-start">

                    {/* ── COL 1 ─────────────────────────────────── */}
                    <div className="flex flex-col gap-4">

                        {/* Gauge + city name */}
                        {data ? (
                            <>
                                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center">
                                    <AQIGauge value={data.aqi.value} color={aqiMeta.color} size={160} />
                                    <span className="mt-2 inline-block px-3 py-1 rounded-lg text-xs font-semibold border"
                                        style={{ color: aqiMeta.color, borderColor: aqiMeta.color + '40', background: aqiMeta.color + '12' }}>
                                        {data.aqi.label}
                                    </span>
                                    <div className="mt-3">
                                        <div className="font-semibold text-base leading-tight">{data.city}</div>
                                        {data.state && <div className="text-xs text-muted-foreground mt-0.5">{data.state}</div>}
                                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                                            {new Date(data.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            {data.isDemo && <span className="bg-secondary rounded px-1 py-0.5 text-[8px] font-bold uppercase">Demo</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* AQI scale legend */}
                                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">AQI Scale</p>
                                    <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-3">
                                        {AQI_SCALE.map((bp, i) => (
                                            <div key={i} className="flex-1 transition-opacity" style={{
                                                background: bp.color,
                                                opacity: (data.aqi.value <= bp.max && (i === 0 || data.aqi.value > (AQI_SCALE[i - 1]?.max || 0))) ? 1 : 0.15,
                                            }} />
                                        ))}
                                    </div>
                                    {AQI_SCALE.map(bp => (
                                        <div key={bp.label}
                                            className={`flex items-center gap-2 text-[11px] py-0.5 transition-opacity ${data.aqi.label === bp.label ? 'opacity-100 font-semibold' : 'opacity-35'}`}>
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: bp.color }} />
                                            {bp.label}
                                            <span className="ml-auto font-mono text-muted-foreground">{bp.max}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : loading ? (
                            <div className="bg-card border border-border rounded-2xl p-10 shadow-sm text-center">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Locating…</p>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
                                <Wind className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-20" />
                                <p className="text-sm font-medium mb-1">Search a city</p>
                                <p className="text-xs text-muted-foreground mb-4">to see live AQI data</p>
                                <div className="flex flex-col gap-1.5">
                                    {['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad'].map(c => (
                                        <button key={c} onClick={() => { setQuery(c); inputRef.current?.focus(); }}
                                            className="px-3 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs font-medium hover:bg-secondary transition-colors">
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cities ranking */}
                        {sorted.length > 0 && (
                            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2.5">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cities</p>
                                    <button onClick={loadCities} className="text-muted-foreground hover:text-foreground transition-colors">
                                        <RefreshCw className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="space-y-0.5">
                                    {sorted.map((city, i) => {
                                        const m = city.aqi ? getAQI(city.aqi.value) : null;
                                        return (
                                            <button key={city.name} onClick={() => pickCity(city.name)}
                                                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/60 transition-colors text-left">
                                                <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">{i + 1}</span>
                                                <span className="flex-1 text-xs font-medium truncate">{city.name}</span>
                                                <span className="text-xs font-semibold tabular-nums" style={{ color: m?.color }}>{city.aqi?.value ?? '—'}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── COL 2: TAB PANELS ─────────────────────── */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                        {data ? (
                            <>
                                {/* Tab bar */}
                                <div className="flex border-b border-border">
                                    {TABS.map(({ id, label, Icon }) => (
                                        <button key={id} onClick={() => setTab(id)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap
                                            ${tab === id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">{label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-5">
                                    {/* OVERVIEW */}
                                    {tab === 'overview' && (
                                        <div className="space-y-5">
                                            <p className="text-sm text-muted-foreground leading-relaxed">{data.aqi.advice}</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[['PM2.5', data.components.pm25, '#F97316'], ['PM10', data.components.pm10, '#EAB308']].map(([k, v, c]) => (
                                                    <div key={k} className="bg-secondary/30 border border-border/50 rounded-xl p-4">
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{k}</div>
                                                        <div className="text-2xl font-bold" style={{ color: c }}>{v}</div>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5">µg/m³</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                {[['NO₂', data.components.no2], ['O₃', data.components.o3], ['SO₂', data.components.so2], ['CO', data.components.co]].map(([k, v]) => (
                                                    <div key={k} className="bg-secondary/20 border border-border/40 rounded-xl p-3 text-center">
                                                        <div className="text-[10px] font-semibold text-muted-foreground mb-1">{k}</div>
                                                        <div className="text-sm font-semibold tabular-nums">{v}</div>
                                                        <div className="text-[9px] text-muted-foreground">µg/m³</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* POLLUTANTS */}
                                    {tab === 'pollutants' && (
                                        <div className="space-y-3">
                                            {[
                                                ['PM2.5', data.components.pm25, 250, 'Fine inhalable particles', '#F97316'],
                                                ['PM10', data.components.pm10, 430, 'Coarse particles', '#EAB308'],
                                                ['NO₂', data.components.no2, 200, 'Nitrogen dioxide', '#A855F7'],
                                                ['O₃', data.components.o3, 180, 'Ground-level ozone', '#3B82F6'],
                                                ['CO', data.components.co, 10000, 'Carbon monoxide', '#EF4444'],
                                                ['SO₂', data.components.so2, 350, 'Sulfur dioxide', '#10B981'],
                                            ].map(([name, val, max, desc, color]) => {
                                                const pct = Math.min((parseFloat(val) / max) * 100, 100);
                                                return (
                                                    <div key={name} className="bg-secondary/20 border border-border/40 rounded-xl p-3.5">
                                                        <div className="flex justify-between items-start mb-2.5">
                                                            <div>
                                                                <div className="text-sm font-semibold">{name}</div>
                                                                <div className="text-xs text-muted-foreground">{desc}</div>
                                                            </div>
                                                            <span className="text-sm font-bold tabular-nums" style={{ color }}>
                                                                {val} <span className="text-[10px] font-normal text-muted-foreground">µg/m³</span>
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-700"
                                                                style={{ width: `${pct}%`, background: color }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* FORECAST */}
                                    {tab === 'forecast' && (
                                        forecast.length > 0 ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                                                {forecast.map((day, i) => {
                                                    const m = getAQI(day.aqi.value);
                                                    return (
                                                        <div key={i} className="bg-secondary/20 border border-border/40 rounded-xl p-3 text-center">
                                                            <div className="text-[10px] text-muted-foreground font-medium mb-2">{day.date}</div>
                                                            <div className="text-2xl font-bold tabular-nums" style={{ color: m.color }}>{day.aqi.value}</div>
                                                            <div className="text-[10px] text-muted-foreground mt-1">{m.label}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-16 text-center text-muted-foreground">
                                                <Calendar className="w-8 h-8 mx-auto mb-3 opacity-15" />
                                                <p className="text-sm">Forecast unavailable</p>
                                            </div>
                                        )
                                    )}

                                    {/* HEALTH */}
                                    {tab === 'health' && (
                                        <div className="space-y-2.5">
                                            {[
                                                {
                                                    Icon: Baby, g: 'Children',
                                                    r: data.aqi.value > 200 ? 'Keep indoors. No outdoor play.' : data.aqi.value > 100 ? 'Limit outdoor time to 30 mins.' : 'Safe for normal outdoor play.'
                                                },
                                                {
                                                    Icon: Users, g: 'Elderly',
                                                    r: data.aqi.value > 150 ? 'Stay indoors. Use air purifier.' : data.aqi.value > 100 ? 'Wear N95 if going out.' : 'Safe. Take usual precautions.'
                                                },
                                                {
                                                    Icon: Activity, g: 'Active Adults',
                                                    r: data.aqi.value > 200 ? 'No outdoor exercise.' : data.aqi.value > 100 ? 'Move exercise indoors.' : 'Good conditions for outdoor exercise.'
                                                },
                                                {
                                                    Icon: Wind, g: 'Respiratory',
                                                    r: data.aqi.value > 100 ? 'Avoid going out. Take prescribed meds.' : "Low risk. Follow doctor's advice."
                                                },
                                                {
                                                    Icon: Heart, g: 'Pregnant Women',
                                                    r: data.aqi.value > 150 ? 'Stay indoors. Consult doctor.' : data.aqi.value > 100 ? 'Minimize outdoor time.' : 'Moderate caution advised.'
                                                },
                                            ].map(({ Icon, g, r }) => (
                                                <div key={g} className="flex gap-3 items-center bg-secondary/20 border border-border/40 rounded-xl p-3.5">
                                                    <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                                                        <Icon className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{g}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                                <BarChart2 className="w-10 h-10 mb-4 opacity-15" />
                                <p className="text-sm font-medium">Select a city to view details</p>
                            </div>
                        )}
                    </div>

                    {/* ── COL 3: MAP + TIPS ─────────────────────── */}
                    <div className="flex flex-col gap-4 lg:sticky lg:top-20">

                        {/* India Map */}
                        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                                <span className="text-xs font-semibold">India Map</span>
                                <span className="text-[10px] text-muted-foreground">tap to select city</span>
                            </div>

                            <div className="p-3 bg-secondary/10">
                                <svg viewBox="0 0 430 490" className="w-full h-auto">
                                    {/* India outline */}
                                    <path d={INDIA_PATH}
                                        fill="currentColor" fillOpacity="0.06"
                                        stroke="currentColor" strokeWidth="1.5"
                                        strokeOpacity="0.3" strokeLinejoin="round"
                                        strokeLinecap="round" className="text-foreground" />

                                    {/* Sri Lanka */}
                                    <path d={SRILANKA_PATH}
                                        fill="currentColor" fillOpacity="0.06"
                                        stroke="currentColor" strokeWidth="1"
                                        strokeOpacity="0.2" className="text-foreground" />

                                    {/* Andaman & Nicobar islands — ~12N 92.5E */}
                                    {[[343, 402], [344, 412], [345, 422]].map(([x, y], i) => (
                                        <circle key={i} cx={x} cy={y} r={3}
                                            fill="currentColor" fillOpacity="0.1"
                                            stroke="currentColor" strokeOpacity="0.2"
                                            strokeWidth="0.8" className="text-foreground" />
                                    ))}

                                    {/* City markers */}
                                    {Object.entries(CITIES).map(([name, { lat, lon }]) => {
                                        const { x, y } = proj(lat, lon);
                                        const cd = cities.find(c => c.name === name);
                                        const m = cd ? getAQI(cd.aqi?.value || 0) : null;
                                        const col = m?.color ?? 'currentColor';
                                        const isActive = selCity === name || data?.city === name;
                                        const isHov = hovCity === name;
                                        // Flip label left for cities in eastern half (midpoint ~82.5°E → x≈210)
                                        const anchor = x > 210 ? 'end' : 'start';
                                        const lx = x > 210 ? x - 8 : x + 8;

                                        return (
                                            <g key={name}
                                                onClick={() => pickCity(name)}
                                                onMouseEnter={() => setHovCity(name)}
                                                onMouseLeave={() => setHovCity(null)}
                                                style={{ cursor: 'pointer' }}>
                                                {isActive && <circle cx={x} cy={y} r={13} fill={col} opacity={0.15} />}
                                                {isHov && !isActive && <circle cx={x} cy={y} r={9} fill={col} opacity={0.1} />}
                                                <circle cx={x} cy={y}
                                                    r={isActive ? 7 : isHov ? 6 : 4.5}
                                                    fill={col}
                                                    stroke="var(--background)" strokeWidth="1.5"
                                                    style={{ transition: 'r 0.15s' }} />
                                                <text x={lx} y={y + 4}
                                                    textAnchor={anchor}
                                                    fontSize="9" fontWeight={isActive ? '700' : '500'}
                                                    fill="currentColor"
                                                    fillOpacity={isActive || isHov ? 0.85 : 0.45}
                                                    className="text-foreground pointer-events-none">
                                                    {name}
                                                </text>
                                                {isHov && cd?.aqi?.value && (
                                                    <g>
                                                        <rect x={x - 16} y={y - 27} width={32} height={18} rx={4} fill={col} />
                                                        <text x={x} y={y - 14} textAnchor="middle"
                                                            fontSize="9" fontWeight="700" fill="white">
                                                            {cd.aqi.value}
                                                        </text>
                                                    </g>
                                                )}
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>

                            {/* AQI legend */}
                            <div className="px-4 pb-3 pt-1 flex flex-wrap gap-x-3 gap-y-1">
                                {AQI_SCALE.map(bp => (
                                    <div key={bp.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <span className="w-2 h-2 rounded-full" style={{ background: bp.color }} />
                                        {bp.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Protection tips */}
                        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" /> Protection Tips
                            </p>
                            {[
                                { Icon: Shield, tip: 'N95 masks when AQI > 150' },
                                { Icon: Leaf, tip: 'Indoor plants filter air naturally' },
                                { Icon: Car, tip: 'Avoid exercising near heavy traffic' },
                                { Icon: Wind, tip: 'Air purifier indoors when AQI > 200' },
                                { Icon: Droplets, tip: 'Wet mop to reduce indoor dust' },
                                { Icon: Smartphone, tip: 'Check AQI before going outside' },
                            ].map(({ Icon, tip }) => (
                                <div key={tip} className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground border-b last:border-0 border-border/40">
                                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-50" /> {tip}
                                </div>
                            ))}
                        </div>

                        {/* Demo warning */}
                        {(cities[0]?.isDemo || myAQI?.isDemo) && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 text-xs text-amber-700 dark:text-amber-400">
                                <p className="font-semibold mb-1 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> Demo Mode Active
                                </p>
                                Add your API key for live data.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}