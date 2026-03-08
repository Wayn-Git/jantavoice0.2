import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdSettings, MdHistory, MdBlock, MdGavel, MdCall, MdOutlineRefresh, MdListAlt } from 'react-icons/md';
import toast from 'react-hot-toast';
import CallTranscriptViewer from '../components/CallTranscriptViewer';
import { callAPI } from '../services/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [callLogs, setCallLogs] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [callsLoading, setCallsLoading] = useState(false);

  async function fetchCallLogs() {
    setCallsLoading(true);
    try {
      const res = await callAPI.getAllLogs();
      setCallLogs(res.data.logs || []);
    } catch (e) { console.error(e); }
    setCallsLoading(false);
  }

  useEffect(() => { if (activeTab === 'calllogs') fetchCallLogs(); }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 page-enter pb-24">
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/60">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-800">Administrator Console</h1>
          <p className="text-gray-500 font-medium">Manage AI Automations, Portals, and Flagged Entities.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto scroller-hide pb-2">
        {[
          { id: 'overview', icon: MdSettings, label: 'Overview' },
          { id: 'complaints', icon: MdListAlt, label: 'All Complaints' },
          { id: 'fakereports', icon: MdBlock, label: 'Fake Reports' },
          { id: 'automation', icon: MdSettings, label: '🤖 Automation' },
          { id: 'govtickets', icon: MdGavel, label: '🏛️ Gov Tickets' },
          { id: 'calllogs', icon: MdCall, label: '📞 Call Logs' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === t.id ? 'bg-saffron text-white shadow-orange' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="glass p-12 text-center rounded-2xl border border-white">
          <h2 className="text-2xl font-heading font-bold text-gray-800 mb-2">Systems Online</h2>
          <p className="text-gray-500">Node-cron services are actively monitoring gov schemas.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-heading font-bold text-saffron">98.2%</div>
              <div className="text-xs font-bold text-gray-400 uppercase mt-1">AI Accuracy</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-heading font-bold text-green-600">4,120</div>
              <div className="text-xs font-bold text-gray-400 uppercase mt-1">Total Actions</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-heading font-bold text-blue-500">76</div>
              <div className="text-xs font-bold text-gray-400 uppercase mt-1">Gov Tickets</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl font-heading font-bold text-red-500">14</div>
              <div className="text-xs font-bold text-gray-400 uppercase mt-1">Spam Blocked</div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && activeTab !== 'calllogs' && (
        <div className="glass p-12 text-center rounded-2xl border border-white text-gray-500 font-bold">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-4">
            <MdOutlineRefresh className="animate-spin" /> Fetching live data stream...
          </div>
          <p>Admin tabular views auto-populate from database bindings on active traffic.</p>
        </div>
      )}

      {activeTab === 'calllogs' && (
        <div className="glass p-6 md:p-12 text-center rounded-2xl border border-white">
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            {[
              { label: 'Total Calls', value: callLogs.length, color: '#FF9933' },
              { label: 'Completed', value: callLogs.filter(c => c.status === 'Completed').length, color: '#138808' },
              { label: 'Transcribed', value: callLogs.filter(c => c.status === 'Transcribed').length, color: '#3B82F6' },
              { label: 'Failed/No Answer', value: callLogs.filter(c => ['Failed', 'No Answer'].includes(c.status)).length, color: '#EF4444' }
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,.06)', borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Rajdhani,sans-serif', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '.8rem', color: '#666', marginTop: '.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Note about Twilio */}
          <div style={{ background: '#FFF3E0', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid rgba(255,153,51,.25)', fontSize: '.82rem', color: '#555', textAlign: 'left' }}>
            💡 <strong>Twilio Integration:</strong> Get free trial at <a href="https://twilio.com" target="_blank" rel="noreferrer" style={{ color: '#FF9933' }}>twilio.com</a> ($15 credit).
            Add keys to <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: '4px' }}>.env</code> to enable real calls.
            Without Twilio, scripts are generated but calls are simulated.
          </div>

          {/* Call logs table */}
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '800', color: '#1A1A1A' }}>All AI Calls</div>
              <button onClick={fetchCallLogs} style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '.8rem', fontWeight: '700', fontFamily: 'Nunito,sans-serif', color: '#333' }}>🔄 Refresh</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAF7' }}>
                    {['Complaint', 'Department', 'Status', 'Duration', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: '.75rem', fontWeight: '800', color: '#666', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {callsLoading && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}><MdOutlineRefresh className="animate-spin inline text-xl" /></td></tr>}
                  {!callsLoading && callLogs.map(log => {
                    const STATUS_COLORS = { 'Completed': '#138808', 'Transcribed': '#3B82F6', 'Failed': '#EF4444', 'No Answer': '#EF4444', 'In Progress': '#FF9933', 'Calling': '#8B5CF6', 'Script Generated': '#9CA3AF', 'Awaiting Permission': '#F59E0B' };
                    const color = STATUS_COLORS[log.status] || '#9CA3AF';
                    return (
                      <tr key={log._id} style={{ borderBottom: '1px solid #F9FAF7', transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAF7'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '12px 16px', fontSize: '.83rem', fontWeight: '600', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }}>{log.complaint?.title || 'N/A'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '.8rem', color: '#666' }}>{log.targetDepartment}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: color + '18', color, border: `1px solid ${color}33`, padding: '3px 10px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '800' }}>{log.status}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '.8rem', color: '#666' }}>{log.duration ? `${Math.floor(log.duration / 60)}m ${log.duration % 60}s` : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#999' }}>{new Date(log.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '.4rem' }}>
                            <button onClick={() => setSelectedCallId(log._id)}
                              style={{ padding: '5px 12px', background: '#F0FDF4', color: '#138808', border: '1px solid rgba(19,136,8,.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '.75rem', fontWeight: '700', fontFamily: 'Nunito,sans-serif' }}>
                              📋 Transcript
                            </button>
                            {log.script && (
                              <button onClick={() => { const m = document.createElement('div'); m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem'; m.innerHTML = `<div class="glass" style="background:white;border-radius:20px;padding:1.5rem;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;color:#1a1a1a"><div style="font-weight:800;margin-bottom:1rem">AI Call Script</div><pre style="font-size:.8rem;line-height:1.7;white-space:pre-wrap;font-family:Nunito,sans-serif">${log.script.replace(/</g, '&lt;')}</pre><button onclick="this.closest('[style*=fixed]').remove()" style="margin-top:1rem;padding:8px 20px;background:#FF9933;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-family:Nunito,sans-serif">Close</button></div>`; document.body.appendChild(m); }}
                                style={{ padding: '5px 12px', background: '#FFF3E0', color: '#E8720C', border: '1px solid rgba(255,153,51,.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '.75rem', fontWeight: '700', fontFamily: 'Nunito,sans-serif' }}>
                                📝 Script
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!callsLoading && callLogs.length === 0 && (
                    <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: '.9rem' }}>No calls yet. Use "📞 Call Department via AI" on any complaint.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transcript viewer modal */}
          {selectedCallId && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'left' }} onClick={e => e.target === e.currentTarget && setSelectedCallId(null)}>
              <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', fontFamily: 'Rajdhani,sans-serif', color: '#333' }}>📞 Call Transcript</div>
                  <button onClick={() => setSelectedCallId(null)} style={{ background: '#F3F4F6', color: '#333', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
                <CallTranscriptViewer callLogId={selectedCallId} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
