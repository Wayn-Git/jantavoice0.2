import React, { useState, useEffect } from 'react';
import { complaintAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaFilePdf, FaDownload, FaMagic, FaSpinner } from 'react-icons/fa';

export default function LettersPage() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState(null);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const { data } = await complaintAPI.getMy();
            setComplaints(data.complaints);
        } catch (err) {
            toast.error('Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (id, title) => {
        setGeneratingId(id);
        const toastId = toast.loading(`🤖 AI is drafting "${title.substring(0, 20)}..."`);
        try {
            const res = await complaintAPI.getLetter(id);
            const blob = new Blob([res.data], { type: 'application/pdf' });

            // Extract filename from header if possible
            const disposition = res.headers['content-disposition'];
            let filename = 'complaint-letter.pdf';
            if (disposition && disposition.indexOf('attachment') !== -1) {
                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            toast.success(`Letter downloaded!`, { id: toastId });
            // Refresh to show it exists now
            fetchComplaints();
        } catch (err) {
            console.error('PDF error:', err);
            toast.error('Failed to generate letter', { id: toastId });
        } finally {
            setGeneratingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-saffron border-t-transparent rounded-full" /></div>;
    }

    const availableLetters = complaints.filter(c => c.formalLetter && !c.formalLetter.includes('Sample formal letter text.'));
    const pendingLetters = complaints.filter(c => !c.formalLetter || c.formalLetter.includes('Sample formal letter text.'));

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold text-gray-800 flex items-center gap-3">
                    <FaFilePdf className="text-red-500" />
                    Formal Complaint Letters
                </h1>
                <p className="text-gray-500 mt-2">Generate and download official PDF copies of your complaints formatted for Indian Government submission.</p>
            </div>

            {/* Existing Letters */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Generated Letters</h2>
                {availableLetters.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border border-gray-100 italic">
                        No formal letters generated yet. Generate one from the list below.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {availableLetters.map(c => (
                            <div key={c._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-saffron/50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                        <FaFilePdf size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{c.title}</h3>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-gray-600">Ref: {c.referenceNumber}</span>
                                            <span>Issued: {new Date(c.letterGeneratedAt || c.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleGenerate(c._id, c.title)}
                                    disabled={generatingId === c._id}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                >
                                    {generatingId === c._id ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                                    <span className="hidden sm:inline">Download PDF</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Generate New */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Available For Generation</h2>
                {pendingLetters.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border border-gray-100 italic">
                        You have no other complaints waiting for letters.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendingLetters.map(c => (
                            <div key={c._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-700 text-sm line-clamp-1">{c.title}</h3>
                                    <span className="text-xs text-gray-400 mt-1">Status: {c.status} • Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <button
                                    onClick={() => handleGenerate(c._id, c.title)}
                                    disabled={generatingId === c._id}
                                    className="bg-saffron hover:bg-saffron-dark text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                >
                                    {generatingId === c._id ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                                    <span className="hidden sm:inline">Generate Letter</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
