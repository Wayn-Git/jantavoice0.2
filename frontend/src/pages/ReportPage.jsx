import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { STATES } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = ['Roads', 'Water', 'Electricity', 'Sanitation', 'Parks', 'Safety', 'Noise', 'Other'];
const PRIORITIES = [
  { val: 'Low', icon: '🟢', color: 'border-india-green bg-india-green-pale text-india-green-dark' },
  { val: 'Medium', icon: '🟡', color: 'border-gray-300 bg-gray-200 text-gray-800' },
  { val: 'High', icon: '🟠', color: 'border-saffron bg-saffron-pale text-saffron-dark' },
  { val: 'Critical', icon: '🔴', color: 'border-saffron-dark bg-saffron text-white' },
];

export default function ReportPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('quick'); // 'quick', 'voice', 'detailed'

  // Loading States
  const [loading, setLoading] = useState(false);

  // --- Quick File State ---
  const [quickText, setQuickText] = useState('');
  const [quickResult, setQuickResult] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  // --- Voice State ---
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceResult, setVoiceResult] = useState(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const [recSeconds, setRecSeconds] = useState(0);
  const recIntervalRef = useRef(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // --- Detailed State ---
  const [step, setStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'Medium',
    address: '', city: '', state: '', pincode: '', isAnonymous: false, autoSubmit: true
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { state: { from: { pathname: '/report' } } }); }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechSupported(false);
    }
  }, []);

  // --- Quick File Handlers ---
  const handleQuickFile = async () => {
    if (!quickText.trim() || quickText.length < 10) {
      toast.error('Please enter at least 10 characters describing the issue.');
      return;
    }
    setLoading(true);
    const msgs = ["🤖 AI is analyzing your complaint...", "🔍 Detecting category...", "⚡ Setting priority...", "💾 Submitting to database..."];
    let mIdx = 0;
    setLoadingMsg(msgs[0]);
    const msgInterval = setInterval(() => {
      mIdx = (mIdx + 1) % msgs.length;
      setLoadingMsg(msgs[mIdx]);
    }, 1500);

    try {
      const locationMatch = quickText.match(/(?:in|near|at|from)\s+([A-Za-z\s]+)/i);
      const extractedCity = locationMatch ? locationMatch[1].trim() : '';

      const { data } = await complaintAPI.quickFile({
        text: quickText,
        location: { city: extractedCity },
        autoSubmit: true
      });

      clearInterval(msgInterval);
      setQuickResult(data.complaint);
      toast.success('✅ AI Filed Your Complaint!');

      setTimeout(() => {
        navigate(`/complaint/${data.complaint._id}`);
      }, 3000);

    } catch (err) {
      clearInterval(msgInterval);
      toast.error(err.response?.data?.message || 'Failed to file. Please try detailed form.');
      setLoading(false);
    }
  };

  // --- Voice Handlers ---
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startVoice = () => {
    if (!speechSupported) {
      toast.error("Browser doesn't support speech recognition.");
      return;
    }
    setTranscript('');
    setInterimTranscript('');
    setVoiceResult(null);
    setRecSeconds(0);
    setRecording(true);

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalStr += event.results[i][0].transcript;
        else interimStr += event.results[i][0].transcript;
      }
      if (finalStr) setTranscript(prev => prev + ' ' + finalStr);
      setInterimTranscript(interimStr);

      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopVoice();
      }, 5000);
    };

    recognition.onerror = (e) => {
      console.error(e);
      if (e.error !== 'no-speech') {
        toast.error('Microphone error.');
        stopVoice();
      }
    };

    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();

    recIntervalRef.current = setInterval(() => {
      setRecSeconds(s => s + 1);
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {
      stopVoice();
    }, 5000);
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecording(false);
    clearTimeout(silenceTimerRef.current);
    clearInterval(recIntervalRef.current);
  };

  const processVoiceTranscript = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const { data } = await complaintAPI.extractDetails({ text: transcript });
      setVoiceResult(data.result);
      toast.success('🤖 AI categorized your message!');
    } catch {
      toast.error('Failed to categorize. Try manual submission.');
    } finally {
      setLoading(false);
    }
  };

  const submitVoiceComplaint = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.quickFile({
        text: transcript,
        location: { city: voiceResult?.city, state: voiceResult?.state },
        autoSubmit: true
      });
      toast.success('✅ Complaint filed successfully!');
      navigate(`/complaint/${data.complaint._id}`);
    } catch (err) {
      toast.error('Failed to file complaint.');
    } finally {
      setLoading(false);
    }
  };

  // --- Detailed Form Handlers ---
  const handleAI = async () => {
    if (!form.title || !form.description) { toast.error('Enter title and description first'); return; }
    setAiLoading(true);
    try {
      const { data } = await complaintAPI.aiCategorize({ title: form.title, description: form.description });
      if (data.success && data.result) {
        setForm(f => ({ ...f, category: data.result.category || f.category, priority: data.result.priority || f.priority }));
        toast.success('🤖 AI suggested category & priority!');
      } else toast('AI unavailable, please select manually', { icon: 'ℹ️' });
    } catch { toast('AI categorization unavailable', { icon: 'ℹ️' }); }
    finally { setAiLoading(false); }
  };

  const handleImages = (e) => {
    const validFiles = Array.from(e.target.files).filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < e.target.files.length) toast.error('Files over 5MB skipped.');
    const filesToAdd = validFiles.slice(0, 3 - images.length);
    setImages(prev => [...prev, ...filesToAdd].slice(0, 3));
    filesToAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPreviews(prev => [...prev, ev.target.result].slice(0, 3));
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx) => {
    setImages(p => p.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  const fetchLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        toast.success(`Found location: ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        // Setup mock reverse geocode logic if Google Maps isn't active
        setForm(f => ({ ...f, city: 'Local City', state: 'Delhi' }));
      }, () => toast.error('Location rejected.'));
    }
  };

  const goNext = () => {
    if (step === 1) {
      if (!form.title.trim() || form.title.length < 10) { toast.error('Title > 10 chars required'); return; }
      if (!form.category) { toast.error('Category required'); return; }
      if (!form.description.trim() || form.description.length < 20) { toast.error('Description > 20 chars required'); return; }
    }
    if (step === 2 && !form.address.trim()) { toast.error('Address required'); return; }
    setStep(s => s + 1);
  };

  const handleDetailedSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      const { data } = await complaintAPI.create(fd);
      toast.success('✅ Complaint filed successfully!');
      navigate(`/complaint/${data.complaint._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to file complaint');
    } finally {
      setLoading(false);
    }
  };

  const StepDot = ({ n }) => (
    <div className="flex flex-col items-center flex-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all z-10 relative
        ${n < step ? 'bg-india-green border-india-green text-white' : n === step ? 'bg-saffron border-saffron text-white shadow-md' : 'bg-white border-gray-300 text-gray-400'}`}>
        {n < step ? '✓' : n}
      </div>
      <span className={`text-[10px] font-bold mt-1 absolute top-8 whitespace-nowrap ${n === step ? 'text-saffron-dark' : n < step ? 'text-india-green' : 'text-gray-400'}`}>
        {['', 'Details', 'Location', 'Review'][n]}
      </span>
    </div>
  );

  return (
    <div className="pt-24 pb-12 min-h-screen bg-gray-50 flex justify-center">
      <div className="max-w-3xl w-full px-4">

        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-4xl mb-2 text-gray-800">File a <span className="text-saffron">Complaint</span></h1>
          <p className="text-gray-500 text-sm">Choose the simplest way to report your civic issue.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6">
          <button onClick={() => setActiveTab('quick')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'quick' ? 'bg-saffron text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="text-xl mb-1">⚡</span> Quick File
          </button>
          <button onClick={() => setActiveTab('voice')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'voice' ? 'bg-saffron text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="text-xl mb-1">🎤</span> Voice
          </button>
          <button onClick={() => setActiveTab('detailed')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'detailed' ? 'bg-saffron text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="text-xl mb-1">✍️</span> Detailed
          </button>
        </div>

        {/* Tab 1: Quick File */}
        {activeTab === 'quick' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center animate-fade-in">
            {!quickResult ? (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-saffron-pale rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🤖</div>
                  <h2 className="font-heading font-bold text-2xl text-gray-800">Let AI do the work.</h2>
                  <p className="text-gray-500 text-sm mt-1">Just type one sentence describing your issue and location.</p>
                </div>

                <textarea
                  className="w-full bg-gray-50 border-2 border-gray-200 focus:border-saffron focus:ring-0 rounded-2xl p-5 text-lg resize-none mb-6 min-h-[140px]"
                  placeholder="e.g. Broken street light near Metro Station causing dark spots at night."
                  value={quickText}
                  onChange={e => setQuickText(e.target.value)}
                  disabled={loading}
                />

                <button
                  onClick={handleQuickFile}
                  disabled={loading || !quickText.trim()}
                  className="bg-saffron hover:bg-saffron-dark text-white font-bold text-lg w-full py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {loading ? (
                    <><div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> {loadingMsg}</>
                  ) : '⚡ File Now — AI handles everything'}
                </button>
              </>
            ) : (
              <div className="animate-fade-up py-4">
                <div className="w-20 h-20 bg-india-green text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg">✓</div>
                <h2 className="font-heading font-bold text-3xl text-gray-800 mb-2">Complaint Filed!</h2>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 text-left max-w-sm mx-auto mb-6">
                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{quickResult.title}</h3>
                  <div className="flex gap-2">
                    <span className="bg-saffron-pale text-saffron-dark text-xs font-bold px-2 py-1 rounded-full">{quickResult.category}</span>
                    <span className="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">{quickResult.priority} Priority</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <span className="text-lg">🏛️</span> Routing to Government Portals...
                  </div>
                </div>
                <p className="text-gray-400 text-sm">Redirecting to status page...</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Voice */}
        {activeTab === 'voice' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center animate-fade-in flex flex-col items-center">
            <h2 className="font-heading font-bold text-2xl text-gray-800 mb-1">Speak Your Issue</h2>
            <p className="text-gray-500 text-sm mb-8">Record in Hindi or English (Max 60s)</p>

            {!transcript && !recording && !voiceResult && (
              <button
                onClick={startVoice}
                className="w-24 h-24 rounded-full bg-saffron text-white text-4xl flex items-center justify-center shadow-[0_0_20px_rgba(255,153,51,0.4)] hover:scale-105 transition-all mb-4"
              >🎙️</button>
            )}

            {recording && (
              <div className="relative mb-8">
                <button onClick={stopVoice} className="w-24 h-24 rounded-full bg-saffron-dark text-white text-3xl flex items-center justify-center shadow-lg z-10 relative">⏹️</button>
                <div className="absolute inset-0 rounded-full animate-ping bg-saffron opacity-40" style={{ animationDuration: '1s' }} />
                <div className="absolute inset-[-10px] rounded-full animate-ping bg-saffron opacity-20" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
              </div>
            )}

            {(recording || transcript || interimTranscript) && !voiceResult && (
              <div className="w-full animate-fade-in">
                <div className="text-2xl font-mono font-bold text-gray-600 mb-6">{formatTime(recSeconds)}</div>

                {/* CSS Waveform */}
                {recording && (
                  <div className="flex items-center justify-center gap-1.5 mb-6 h-8">
                    {[1, 2, 3, 4, 1, 2, 3, 4].map((v, i) => (
                      <div key={i} className={`w-2 bg-saffron rounded-full animate-pulse h-${v * 2}`} style={{ animationDuration: `${0.3 + (i % 3) * 0.1}s`, animationDirection: 'alternate-reverse' }} />
                    ))}
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left min-h-[100px] mb-6">
                  <p className="text-gray-800 text-lg">{transcript} <span className="text-gray-400">{interimTranscript}</span></p>
                  {!transcript && !interimTranscript && <p className="text-gray-400 italic text-center mt-6">Listening...</p>}
                </div>

                {!recording && transcript && (
                  <div className="flex gap-3">
                    <button onClick={startVoice} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl border border-gray-200">🔄 Re-record</button>
                    <button onClick={processVoiceTranscript} disabled={loading} className="flex-[2] bg-saffron text-white font-bold py-3 rounded-xl shadow-md hover:bg-saffron-dark disabled:opacity-70">
                      {loading ? '⏳ Analyzing...' : '🤖 Extract Details'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {voiceResult && (
              <div className="w-full text-left animate-fade-in">
                <div className="bg-saffron-pale border border-saffron/20 rounded-2xl p-5 mb-5 space-y-3">
                  <h3 className="font-heading font-bold text-lg text-saffron-dark">AI Extracted Details</h3>
                  <div className="flex gap-2">
                    <span className="bg-white px-3 py-1 rounded text-xs font-bold text-gray-700 border border-gray-200">{voiceResult.category}</span>
                    <span className="bg-white px-3 py-1 rounded text-xs font-bold text-gray-700 border border-gray-200">{voiceResult.priority} Priority</span>
                  </div>
                  <textarea
                    className="w-full border border-saffron/30 rounded-lg p-3 text-sm min-h-[80px]"
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setVoiceResult(null); setTranscript(''); }} className="flex-1 text-gray-500 font-bold py-3 hover:text-gray-800">Cancel</button>
                  <button onClick={submitVoiceComplaint} disabled={loading} className="flex-[2] btn-green py-3 text-base">
                    {loading ? 'Submitting...' : '✅ Use This Complaint'}
                  </button>
                </div>
              </div>
            )}

            {!speechSupported && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-200 w-full mt-4 text-center">
                Your browser does not support Voice Recognition. Please use Quick File.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Detailed Form */}
        {activeTab === 'detailed' && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm text-left animate-fade-in relative z-10 w-full max-w-full">
            <div className="flex items-center px-8 py-5 border-b border-gray-100 relative">
              <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
              <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-india-green -translate-y-1/2 z-0 origin-left transition-transform duration-300" style={{ transform: `scaleX(${(step - 1) / 2})` }} />
              <StepDot n={1} />
              <StepDot n={2} />
              <StepDot n={3} />
            </div>

            <div className="p-6 sm:p-8">
              {step === 1 && (
                <div className="space-y-6 animate-fade-right">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1.5 block">Issue Title * <span className="text-gray-400 font-normal">({form.title.length}/150)</span></label>
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-saffron focus:ring-1 focus:ring-saffron" maxLength={150} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Broken water pipe leaking for 2 days" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-gray-700 block">Category *</label>
                      <button onClick={handleAI} disabled={aiLoading} className="text-xs font-bold text-saffron-dark hover:bg-saffron-pale px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-60">
                        {aiLoading ? '⏳ Detecting...' : '🤖 AI Detect'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                          className={`p-3 rounded-xl border-2 text-center transition-all text-xs font-bold ${form.category === cat ? 'border-saffron bg-saffron-pale text-saffron-dark' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'}`}>
                          <div className="text-xl mb-1">{['🛣️', '💧', '⚡', '🗑️', '🌳', '🛡️', '🔊', '📋'][CATEGORIES.indexOf(cat)]}</div>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1.5 block">Description * <span className="text-gray-400 font-normal text-xs">({form.description.length}/2000)</span></label>
                    <textarea className="w-full min-h-[120px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-saffron focus:ring-1 focus:ring-saffron resize-y" maxLength={2000} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Provide details like safety concerns, duration..." />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1.5 block">Priority</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRIORITIES.map(p => (
                        <button key={p.val} onClick={() => setForm(f => ({ ...f, priority: p.val }))}
                          className={`py-2 px-1 rounded-xl border-2 text-center text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${form.priority === p.val ? p.color + ' border-current scale-[1.02] shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                          {p.icon} {p.val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-fade-right">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-bold text-gray-700 block">Address / Landmark *</label>
                      <button onClick={fetchLocation} className="text-xs font-bold text-saffron hover:underline flex items-center gap-1">📍 Use My Location</button>
                    </div>
                    <input className="input w-full" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Building Name, Street" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-1.5 block">City *</label>
                      <input className="input w-full" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-1.5 block">State</label>
                      <select className="input w-full bg-white" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                        <option value="">— Select —</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1.5 block">PIN Code</label>
                    <input className="input w-full" maxLength={6} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/, '') }))} placeholder="123456" />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1.5 block">Photos <span className="text-gray-400 font-normal">({images.length}/3)</span></label>
                    <label className="border-2 border-dashed border-gray-300 hover:border-saffron rounded-2xl p-8 text-center cursor-pointer block transition-colors bg-gray-50 hover:bg-saffron-pale/20">
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImages} disabled={images.length >= 3} />
                      <div className="text-3xl mb-2 text-gray-400">📷</div>
                      <p className="text-sm text-gray-600"><span className="text-saffron-dark font-bold">Upload Photos</span> or drag and drop</p>
                    </label>
                    {previews.length > 0 && (
                      <div className="flex gap-3 mt-4">
                        {previews.map((src, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-gray-800/80 hover:bg-saffron text-white rounded-full text-xs flex items-center justify-center">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex bg-gray-50 border border-gray-200 p-3 rounded-xl items-center gap-3">
                    <input type="checkbox" id="anon" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} className="w-5 h-5 accent-saffron" />
                    <label htmlFor="anon" className="text-sm font-bold text-gray-700 cursor-pointer">Submit Anonymously <span className="text-gray-400 font-normal">(Hide my name publicly)</span></label>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-fade-right">
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 shadow-inner">
                    <div className="grid grid-cols-2 gap-y-4 text-sm mb-4">
                      <div><span className="text-gray-400 block mb-0.5 text-xs font-bold uppercase">Title</span><span className="font-bold text-gray-800">{form.title}</span></div>
                      <div><span className="text-gray-400 block mb-0.5 text-xs font-bold uppercase">Category</span><span className="font-bold text-gray-800 bg-gray-200 px-2 py-0.5 rounded-full">{form.category}</span></div>
                      <div><span className="text-gray-400 block mb-0.5 text-xs font-bold uppercase">Location</span><span className="font-bold text-gray-800">{form.city}, {form.state}</span></div>
                      <div><span className="text-gray-400 block mb-0.5 text-xs font-bold uppercase">Priority</span><span className="font-bold text-gray-800">{form.priority}</span></div>
                    </div>

                    <div className="mb-4 pt-4 border-t border-gray-200">
                      <span className="text-gray-400 block mb-1 text-xs font-bold uppercase">Description</span>
                      <p className="text-gray-700 text-sm">{form.description}</p>
                    </div>

                    {images.length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <span className="text-gray-400 block mb-2 text-xs font-bold uppercase">Photos ({images.length})</span>
                        <div className="flex gap-2">
                          {previews.map((src, i) => <img key={i} src={src} className="w-12 h-12 rounded-lg object-cover" alt="" />)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-saffron-pale border border-saffron/20 rounded-xl p-4 flex gap-3 text-sm">
                    <div className="text-xl">🤖</div>
                    <div>
                      <p className="font-bold text-saffron-dark">AI Portal Recommendation</p>
                      <p className="text-gray-700 mt-0.5">This {form.category} complaint is best suited for <strong>CPGRAMS</strong> or local State Portals.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                    <input type="checkbox" id="autosubmit" checked={form.autoSubmit} onChange={e => setForm(f => ({ ...f, autoSubmit: e.target.checked }))} className="w-5 h-5 accent-saffron mt-0.5 whitespace-nowrap" />
                    <label htmlFor="autosubmit" className="text-sm font-bold text-gray-700 cursor-pointer">
                      🏛️ Auto-submit to government portal after filing
                      <span className="block text-gray-400 font-normal mt-1 leading-snug">JantaVoice will automatically forward your ticket to the correct government department and live-track it.</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center px-8 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
              <button onClick={() => step === 1 ? navigate('/feed') : setStep(s => s - 1)} className="text-gray-500 font-bold hover:text-gray-800 text-sm py-2 px-4 rounded-xl hover:bg-gray-100 transition-colors">
                {step === 1 ? 'Cancel' : '← Back'}
              </button>
              {step < 3 ? (
                <button onClick={goNext} className="bg-saffron text-white font-bold py-2.5 px-6 rounded-xl hover:bg-saffron-dark shadow-md transition-all">Next Step →</button>
              ) : (
                <button onClick={handleDetailedSubmit} disabled={loading} className="btn-green py-2.5 px-6 text-sm flex items-center gap-2">
                  {loading ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Submitting...</> : '✅ Submit Complaint'}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
