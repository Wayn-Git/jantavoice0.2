import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdOutlineAir, MdClose, MdLocationOn } from 'react-icons/md';

const AQIWidget = () => {
    const [aqiData, setAqiData] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAQI = async (lat, lon) => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/aqi?lat=${lat}&lon=${lon}`);
                if (data.success) setAqiData(data);
            } catch (err) {
                console.error('Failed to get AQI', err);
            } finally {
                setLoading(false);
            }
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => fetchAQI(pos.coords.latitude, pos.coords.longitude),
            (err) => {
                // Fallback to New Delhi if denied
                fetchAQI(28.6139, 77.2090);
            }
        );
    }, []);

    if (loading || !aqiData) return null;

    const { city, aqi, components } = aqiData;

    return (
        <div className="fixed bottom-6 left-6 z-[800]">
            {!expanded ? (
                <button
                    onClick={() => setExpanded(true)}
                    className="glass flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer hover:scale-105 transition-all shadow-md group border border-white/50"
                >
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: aqi.color }} />
                    <span className="font-bold text-gray-800 font-heading">AQI {aqi.value}</span>
                    <span className="text-xs text-gray-500 hidden group-hover:block transition-all">{city}</span>
                </button>
            ) : (
                <div className="glass rounded-2xl w-72 overflow-hidden shadow-2xl border border-white/60 origin-bottom-left animate-[fadeUp_0.2s_ease-out]">
                    <div className="p-4 bg-white/40 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <MdLocationOn className="text-gray-400" />
                            <span className="font-bold text-sm text-gray-700 font-heading">{city}</span>
                        </div>
                        <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-800"><MdClose size={20} /></button>
                    </div>

                    <div className="p-5 flex flex-col items-center">
                        <div
                            className="w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg border-4"
                            style={{ borderColor: aqi.color, background: 'rgba(255,255,255,0.8)' }}
                        >
                            <span className="text-3xl font-extrabold" style={{ color: aqi.color }}>{aqi.value}</span>
                            <span className="text-xs font-bold text-gray-500">{aqi.label}</span>
                        </div>

                        <p className="text-sm text-center mt-4 text-gray-600 font-medium">
                            {aqi.emoji} {aqi.advice}
                        </p>

                        <div className="grid grid-cols-4 gap-2 w-full mt-4 p-3 bg-white/50 rounded-xl">
                            <div className="text-center"><div className="text-[10px] text-gray-400 font-bold">PM2.5</div><div className="text-xs font-bold text-gray-700">{components.pm25}</div></div>
                            <div className="text-center"><div className="text-[10px] text-gray-400 font-bold">PM10</div><div className="text-xs font-bold text-gray-700">{components.pm10}</div></div>
                            <div className="text-center"><div className="text-[10px] text-gray-400 font-bold">NO2</div><div className="text-xs font-bold text-gray-700">{components.no2}</div></div>
                            <div className="text-center"><div className="text-[10px] text-gray-400 font-bold">O3</div><div className="text-xs font-bold text-gray-700">{components.o3}</div></div>
                        </div>

                        {aqi.value > 150 && (
                            <button className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                                📢 Report Pollution
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AQIWidget;
