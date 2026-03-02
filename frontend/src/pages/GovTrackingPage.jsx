import React, { useState, useEffect } from 'react';
import { govAPI, complaintAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { FaBuilding, FaSearch, FaSyncAlt, FaExternalLinkAlt, FaCheckCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function GovTrackingPage() {
    const [tickets, setTickets] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    // Section 1 State
    const [selectedComplaintId, setSelectedComplaintId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Section 2 State
    const [manualTicketId, setManualTicketId] = useState('');
    const [manualPortal, setManualPortal] = useState('CPGRAMS');
    const [tracking, setTracking] = useState(false);

    // Expanded rows
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketsRes, complaintsRes] = await Promise.all([
                govAPI.getMyTickets(),
                complaintAPI.getMy()
            ]);
            setTickets(ticketsRes.data.tickets);
            setComplaints(complaintsRes.data.complaints);
        } catch (err) {
            toast.error('Failed to load tracking data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    const handleAutoSubmit = async () => {
        if (!selectedComplaintId) return toast.error('Please select a complaint');
        setSubmitting(true);
        try {
            const { data } = await govAPI.submit(selectedComplaintId);
            toast.success(data.message);
            setSelectedComplaintId('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit to government portal');
        } finally {
            setSubmitting(false);
        }
    };

    const handleManualTrack = async () => {
        if (!manualTicketId.trim()) return toast.error('Enter a ticket ID');
        setTracking(true);
        try {
            const { data } = await govAPI.trackManual({ ticketId: manualTicketId, portal: manualPortal });
            toast.success('Ticket tracked successfully!');
            setManualTicketId('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Tracking failed');
        } finally {
            setTracking(false);
        }
    };

    const handleCheckStatus = async (ticketId) => {
        try {
            toast.loading('Checking status...', { id: 'check' });
            await govAPI.checkStatus(ticketId);
            toast.success('Status updated!', { id: 'check' });
            fetchData();
        } catch (err) {
            toast.error('Failed to update status', { id: 'check' });
        }
    };

    const unsubmittedComplaints = complaints.filter(c => !tickets.some(t => t.complaint?._id === c._id));

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-saffron border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-heading font-bold text-gray-800 flex items-center gap-3">
                <FaBuilding className="text-saffron" />
                Government Portal Tracker
            </h1>
            <p className="text-gray-500">Track and manage your official government grievance tickets directly from Janta Voice.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SECTION 1: Auto Submit */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">🚀 Submit to Gov Portal</h2>
                    <p className="text-sm text-gray-500 mb-4">We auto-submit your complaint to the right portal and track it every 4 hours.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Select your complaint</label>
                            <select
                                value={selectedComplaintId}
                                onChange={(e) => setSelectedComplaintId(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50 transition-colors"
                            >
                                <option value="">-- Select an unsubmitted complaint --</option>
                                {unsubmittedComplaints.map(c => (
                                    <option key={c._id} value={c._id}>{c.title} ({c.category})</option>
                                ))}
                            </select>
                            {unsubmittedComplaints.length === 0 && (
                                <p className="text-xs text-india-green mt-1 font-semibold">All your complaints are already submitted! ✅</p>
                            )}
                        </div>

                        {selectedComplaintId && (
                            <div className="bg-saffron/10 border border-saffron/30 rounded-lg p-3 flex items-start gap-3">
                                <div className="text-2xl mt-1">🏛️</div>
                                <div>
                                    <p className="font-bold text-saffron-dark text-sm">Portal Auto-Selected</p>
                                    <p className="text-xs text-gray-600">Based on complaint category and state, we will route this to the correct official portal.</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleAutoSubmit}
                            disabled={!selectedComplaintId || submitting}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all ${submitting || !selectedComplaintId ? 'bg-gray-300 cursor-not-allowed' : 'bg-saffron hover:bg-saffron-dark hover:-translate-y-0.5'}`}
                        >
                            {submitting ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><FaBuilding /> Submit to Government Portal</>}
                        </button>
                    </div>
                </div>

                {/* SECTION 2: Manual Track */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">🔍 Track Existing Ticket</h2>
                    <p className="text-sm text-gray-500 mb-4">Already filed a report directly? Enter the ticket ID here to track it.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Grievance/Ticket ID</label>
                            <input
                                type="text"
                                placeholder="e.g. GR2024048291"
                                value={manualTicketId}
                                onChange={(e) => setManualTicketId(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50 transition-colors uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Portal Name</label>
                            <select
                                value={manualPortal}
                                onChange={(e) => setManualPortal(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron/50 transition-colors"
                            >
                                <option value="CPGRAMS">CPGRAMS</option>
                                <option value="Maharashtra_CRZ">Aaple Sarkar</option>
                                <option value="Swachhata">Swachhata App</option>
                                <option value="Delhi_CM">Delhi CM Helpline</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <button
                            onClick={handleManualTrack}
                            disabled={!manualTicketId.trim() || tracking}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all ${tracking || !manualTicketId.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-800 hover:bg-black hover:-translate-y-0.5'}`}
                        >
                            {tracking ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><FaSearch /> Check Status</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION 3: My Active Gov Tickets */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">My Active Gov Tickets</h2>
                </div>

                {tickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <FaBuilding className="text-4xl mx-auto mb-2 opacity-30" />
                        <p>No government tickets tracked yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                                    <th className="p-4">Complaint</th>
                                    <th className="p-4">Portal & Ticket ID</th>
                                    <th className="p-4">Gov Status</th>
                                    <th className="p-4">Last Checked</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => (
                                    <React.Fragment key={ticket._id}>
                                        <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4">
                                                <p className="font-bold text-gray-800 text-sm truncate max-w-xs">{ticket.complaint?.title || 'Unknown Complaint'}</p>
                                                <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-india-green text-sm">{ticket.portalName}</p>
                                                <p className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block">{ticket.ticketId}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ticket.isResolved ? 'bg-india-green-pale text-india-green-dark border-india-green/20' : 'bg-saffron-pale text-saffron-dark border-saffron/20'} border`}>
                                                    {ticket.currentStatus}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs text-gray-600">{ticket.lastChecked ? formatDistanceToNow(new Date(ticket.lastChecked), { addSuffix: true }) : 'Never'}</p>
                                                <p className="text-[10px] text-gray-400">{ticket.checkCount} checks</p>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleCheckStatus(ticket._id)}
                                                    className="p-2 text-gray-400 hover:text-saffron hover:bg-saffron/10 rounded-lg transition-colors"
                                                    title="Check Now"
                                                >
                                                    <FaSyncAlt />
                                                </button>
                                                <a
                                                    href={ticket.ticketUrl || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 inline-block text-gray-400 hover:text-india-green hover:bg-india-green/10 rounded-lg transition-colors"
                                                    title="Open Portal"
                                                >
                                                    <FaExternalLinkAlt />
                                                </a>
                                                <button
                                                    onClick={() => toggleRow(ticket._id)}
                                                    className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    {expandedRows.has(ticket._id) ? <FaChevronUp /> : <FaChevronDown />}
                                                </button>
                                            </td>
                                        </tr>
                                        {/* EXPANDED TIMELINE */}
                                        {expandedRows.has(ticket._id) && (
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <td colSpan="5" className="p-6">
                                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                        <FaHistory className="text-gray-400" /> Government Action Timeline
                                                    </h4>
                                                    <div className="space-y-4 pl-2 border-l-2 border-gray-200 ml-2">
                                                        {ticket.statusHistory?.map((hw, idx) => (
                                                            <div key={idx} className="relative pl-6">
                                                                <div className="absolute -left-[33px] top-1 bg-white border-2 border-saffron w-4 h-4 rounded-full"></div>
                                                                <p className="text-xs font-bold text-gray-500 mb-1">{new Date(hw.timestamp).toLocaleString()}</p>
                                                                <p className="text-sm font-bold text-gray-800">{hw.status}</p>
                                                                <div className="bg-white border border-gray-200 p-3 rounded-xl mt-2 text-sm text-gray-600 shadow-sm relative">
                                                                    <div className="absolute -left-[5px] top-4 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-[-45deg]"></div>
                                                                    <span className="font-serif italic">"{hw.details}"</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
