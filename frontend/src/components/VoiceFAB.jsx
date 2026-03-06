import React, { useState } from 'react';
import { MdMic, MdClose, MdMicNone } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const VoiceFAB = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const navigate = useNavigate();

    const handleStart = () => {
        setIsRecording(true);
        setTranscript('Listening... speak now');
        setTimeout(() => {
            setIsRecording(false);
            setTranscript('Pothole found near MG Road, needs urgent fix.');
            setTimeout(() => {
                toast.success("Complaint filed via Voice!");
                setIsOpen(false);
                navigate('/feed');
            }, 1500);
        }, 3000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[850]">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-saffron to-[#E8720C] text-white flex items-center justify-center shadow-[0_8px_32px_rgba(255,153,51,0.5)] hover:scale-105 transition-transform"
                >
                    <MdMic size={28} />
                </button>
            ) : (
                <div className="glass-orange p-6 rounded-3xl w-80 shadow-2xl border border-white/60 animate-[fadeUp_0.2s_ease-out] relative">
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><MdClose size={24} /></button>

                    <div className="text-center mt-2">
                        <h3 className="font-heading font-bold text-xl text-gray-800 mb-1">Voice Complaint</h3>
                        <p className="text-sm text-gray-500 mb-6">Describe your civic issue directly.</p>

                        <button
                            onClick={handleStart}
                            className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 text-white transition-all
                ${isRecording ? 'bg-red-500 animate-[micPulse_1.5s_infinite]' : 'bg-saffron hover:bg-[#E8720C]'}`}
                        >
                            {isRecording ? <MdMic size={48} /> : <MdMicNone size={48} />}
                        </button>

                        {isRecording || transcript ? (
                            <div className="bg-white/50 p-3 rounded-xl border border-white min-h-[60px] flex items-center justify-center text-sm font-medium text-gray-700">
                                {transcript}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm font-bold opacity-70">Tap microphone to speak</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceFAB;
