import { useState, useRef, useEffect } from 'react';
import { complaintAPI } from '../services/api';
import toast from 'react-hot-toast';

import { Mic, StopCircle, CheckCircle, Tag, Zap, Loader2, Bot, CheckCircle2 } from 'lucide-react';

export default function VoiceRecorder({ onUseComplaint }) {
    // ... existing state ...

    // ... (skipping to render) ...
    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[160px]">
            const [recording, setRecording] = useState(false);
            const [audioUrl, setAudioUrl] = useState(null);
            const [audioBlob, setAudioBlob] = useState(null);
            const [seconds, setSeconds] = useState(0);

            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');

            const [transcriptData, setTranscriptData] = useState(null);

            const mediaRecorderRef = useRef(null);
            const audioContextRef = useRef(null);
            const analyserRef = useRef(null);
            const canvasRef = useRef(null);
            const animationRef = useRef(null);
            const timerRef = useRef(null);
            const chunksRef = useRef([]);

    useEffect(() => {
        return () => {
                stopRecordingFlow();
        };
    }, []);

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
            const s = secs % 60;
            return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const drawWaveform = () => {
        if (!canvasRef.current || !analyserRef.current) return;
            const canvas = canvasRef.current;
            const canvasCtx = canvas.getContext('2d');
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Clear canvas first
            canvasCtx.fillStyle = '#f8fafc';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const draw = () => {
                animationRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = '#f8fafc';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
            canvasCtx.fillStyle = '#f97316';
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
            }
        };
            draw();
    };

    const startRecording = async () => {
                setError('');
            setTranscriptData(null);
            setAudioUrl(null);
            setAudioBlob(null);
            setSeconds(0);
            chunksRef.current = [];

            try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true });

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;

            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {type: 'audio/webm' });
            setAudioBlob(blob);
            setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(t => t.stop());
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error);
                }
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setRecording(true);

            // Timer setup
            timerRef.current = setInterval(() => {
                setSeconds(s => {
                    if (s >= 59) {
                        stopRecording();
                        return 60;
                    }
                    return s + 1;
                });
            }, 1000);

            drawWaveform();

        } catch (err) {
                console.error(err);
            setError('Microphone access denied or not available.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
        }
            stopRecordingFlow();
    };

    const stopRecordingFlow = () => {
                setRecording(false);
            clearInterval(timerRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const handleTranscribe = async () => {
        if (!audioBlob) return;
            setLoading(true);
            setError('');

            try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'complaint.webm');

            const {data} = await complaintAPI.transcribeAudio(formData);
            if (data.success) {
                setTranscriptData({
                    transcript: data.transcript,
                    category: data.category,
                    priority: data.priority,
                    summary: data.summary,
                });
            toast.success('Audio transcribed successfully!');
            } else {
                throw new Error(data.message || 'Transcription failed');
            }
        } catch (err) {
                console.error(err);
            setError(err.response?.data?.message || err.message || 'Error occurred during transcription.');
            toast.error('Failed to transcribe audio.');
        } finally {
                setLoading(false);
        }
    };

    const handleTranscriptChange = (e) => {
                setTranscriptData(prev => ({ ...prev, transcript: e.target.value }));
    };

    const handleUseComplaint = () => {
        if (!transcriptData) return;

            const title = transcriptData.summary || transcriptData.transcript.split('.')[0].substring(0, 100);

            onUseComplaint({
                title: title,
            description: transcriptData.transcript,
            category: transcriptData.category,
            priority: transcriptData.priority,
        });
    };

            return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[160px]">
                {!audioUrl && (
                    <div className="flex flex-col items-center justify-center w-full h-full relative">
                        {error && <div className="absolute -top-10 text-white text-xs bg-destructive px-3 py-1 rounded-full shadow-md z-20">{error}</div>}

                        <div className="relative flex items-center justify-center group">
                            {/* Outer animated rings */}
                            {recording && (
                                <>
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                                    <div className="absolute -inset-4 bg-primary/10 rounded-full animate-pulse" />
                                </>
                            )}

                            <button
                                onClick={recording ? stopRecording : startRecording}
                                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl z-10 relative
                                ${recording
                                        ? 'bg-primary text-primary-foreground scale-105 shadow-primary/40'
                                        : 'bg-background hover:bg-secondary text-primary border-4 border-primary/10 hover:border-primary/30 hover:scale-105'}`}
                            >
                                {recording ? <StopCircle size={40} className="animate-pulse" /> : <Mic size={40} />}
                            </button>
                        </div>

                        <div className={`mt-6 font-mono font-bold text-xl transition-all duration-300 ${recording ? 'text-primary' : 'text-muted-foreground'}`}>
                            {recording ? formatTime(seconds) : 'Tap to Speak'}
                        </div>

                        {recording && (
                            <div className="absolute bottom-0 w-full max-w-[200px] h-12 bg-background/50 backdrop-blur-sm rounded-full overflow-hidden border border-border mt-4">
                                <canvas ref={canvasRef} width="200" height="48" className="w-full h-full opacity-80" />
                            </div>
                        )}
                    </div>
                )}

                {audioUrl && !transcriptData && (
                    <div className="flex flex-col items-center w-full max-w-md animate-fade-up">
                        <audio src={audioUrl} controls className="w-full mb-6" />

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => { setAudioUrl(null); setAudioBlob(null); setTranscriptData(null); }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-xl flex-1 transition-colors"
                                disabled={loading}
                            >
                                Retake
                            </button>
                            <button
                                onClick={handleTranscribe}
                                className="btn-primary flex-[2] py-2 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? '⏳ AI is transcribing...' : '🤖 Transcribe with AI'}
                            </button>
                        </div>
                        {error && <div className="text-saffron-dark text-sm mt-4">{error}</div>}
                    </div>
                )}

                {transcriptData && (
                    <div className="w-full max-w-lg animate-fade-up mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-foreground">AI Analysis Result</h3>
                            <button onClick={() => { setAudioUrl(null); setAudioBlob(null); setTranscriptData(null); }} className="text-xs text-primary font-bold hover:underline">
                                Start Over
                            </button>
                        </div>

                        <div className="bg-secondary border border-border rounded-2xl p-5 mb-5 shadow-sm">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="bg-background px-3 py-1.5 rounded-lg text-xs font-bold text-foreground border border-border flex items-center gap-1.5 shadow-sm">
                                    <Tag size={12} className="text-primary" /> {transcriptData.category}
                                </span>
                                <span className="bg-background px-3 py-1.5 rounded-lg text-xs font-bold text-foreground border border-border flex items-center gap-1.5 shadow-sm">
                                    <Zap size={12} className="text-saffron" /> {transcriptData.priority} Priority
                                </span>
                            </div>
                            {transcriptData.summary && (
                                <p className="text-sm text-foreground font-medium mb-4 italic">"{transcriptData.summary}"</p>
                            )}

                            <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">Full Transcript (Editable)</label>
                            <textarea
                                value={transcriptData.transcript}
                                onChange={handleTranscriptChange}
                                className="w-full p-4 text-sm font-medium rounded-xl border border-border bg-background min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                            />
                        </div>

                        <button onClick={handleUseComplaint} className="btn-success w-full py-3 shadow-lg flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} /> Use This Transcript
                        </button>
                    </div>
                )}
            </div>
            );
}
