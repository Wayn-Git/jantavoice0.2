import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdMic, MdGavel, MdListAlt, MdDescription, MdArrowForward } from 'react-icons/md';
import VoiceRecorder from '../components/VoiceRecorder';

export default function HomePage() {
    const navigate = useNavigate();
    const [stats] = useState({ resolved: 1420, active: 450, tracking: 89 });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">

            {/* SECTION 1 - HERO */}
            <section className="glass rounded-[2rem] p-8 md:p-12 shadow-sm border border-white flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative">
                <div className="flex-1 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron/10 text-saffron-dark text-sm font-bold mb-6 border border-saffron/20">
                        <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" /> Official AI Grievance Portal
                    </div>
                    <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-gray-900 leading-tight mb-4">
                        बोलिए, <span className="text-saffron">हम सुनेंगे।</span>
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-lg font-medium">
                        Janta Voice translates your spoken issues directly to government departments. No complex forms. AI routes your complaint instantly.
                    </p>
                    <div className="flex gap-4 items-center">
                        <button onClick={() => navigate('/report')} className="btn-orange text-lg px-8 py-4 !rounded-2xl">
                            <MdMic size={24} /> Speak Complaint
                        </button>
                        <button onClick={() => navigate('/report')} className="btn-outline px-6 py-4 !rounded-2xl">
                            ✍️ Type Instead
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex w-72 h-72 relative items-center justify-center z-10 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-saffron to-orange-400 rounded-full blur-[80px] opacity-20 animate-pulse" />
                    <div className="w-48 h-48 bg-white rounded-full shadow-[0_20px_60px_rgba(255,153,51,0.3)] border-8 border-saffron/10 flex items-center justify-center float-y z-20">
                        <MdMic size={80} className="text-saffron drop-shadow-lg" />
                    </div>
                </div>
            </section>

            {/* SECTION 2 - VOICE FAST TRACK */}
            <section className="glass-orange rounded-[2rem] p-8 border border-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-heading font-bold text-gray-800 mb-2">Record & Auto-File</h2>
                    <p className="text-gray-600 mb-6 font-medium">Our AI auto-extracts the priority, category, and formats the formal text.</p>
                    <VoiceRecorder onTranscribe={(txt) => navigate('/report', { state: { text: txt } })} />
                </div>
            </section>

            {/* SECTION 3 - STATS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card">
                    <div className="accent-bar bg-green-500" />
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Resolved By Govt</div>
                    <div className="stat-value text-gray-800">{stats.resolved}+</div>
                    <div className="mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-block">↑ 12% this week</div>
                </div>
                <div className="stat-card">
                    <div className="accent-bar bg-saffron" />
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</div>
                    <div className="stat-value text-gray-800">{stats.active}</div>
                </div>
                <div className="stat-card">
                    <div className="accent-bar bg-blue-500" />
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Auto-Escalated</div>
                    <div className="stat-value text-gray-800">{stats.tracking}</div>
                    <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">State Portals Linked</div>
                </div>
            </section>

            {/* SECTION 4 - QUICK ACTIONS */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { icon: MdMic, title: 'Voice Report', desc: 'Speak in any language', c: 'text-saffron', b: 'bg-orange-50', nav: '/report' },
                    { icon: MdListAlt, title: 'Live Feed', desc: 'See nearby issues', c: 'text-blue-500', b: 'bg-blue-50', nav: '/feed' },
                    { icon: MdGavel, title: 'Gov Tracker', desc: 'CPGRAMS sync', c: 'text-green-600', b: 'bg-green-50', nav: '/gov-tracking' },
                    { icon: MdDescription, title: 'Formal Letters', desc: 'Auto PDF generation', c: 'text-purple-500', b: 'bg-purple-50', nav: '/letters' }
                ].map((item, i) => (
                    <div key={i} onClick={() => navigate(item.nav)} className="card p-6 cursor-pointer group stagger">
                        <div className={`w-14 h-14 rounded-2xl ${item.b} ${item.c} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <item.icon size={28} />
                        </div>
                        <h3 className="font-heading font-bold text-xl text-gray-800 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 font-medium mb-4">{item.desc}</p>
                        <div className="flex items-center text-saffron text-sm font-bold group-hover:translate-x-1 transition-transform">
                            Open <MdArrowForward className="ml-1" />
                        </div>
                    </div>
                ))}
            </section>

        </div>
    );
}
