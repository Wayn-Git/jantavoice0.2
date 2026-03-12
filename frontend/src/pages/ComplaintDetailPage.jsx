import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Download, Eye, Trash2, ExternalLink, Loader, ArrowLeft, Phone } from 'lucide-react';
import { complaintAPI, govAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusTimeline from '../components/StatusTimeline';
import GovStatusBadge from '../components/GovStatusBadge';
import CallPermissionModal from '../components/CallPermissionModal';
import CallTranscriptViewer from '../components/CallTranscriptViewer';
import { CATEGORY_ICONS, STATUS_COLORS, timeAgo, formatDate, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [downloadingLetter, setDownloadingLetter] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callLogId, setCallLogId] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await complaintAPI.getById(id);
        setComplaint(data.complaint);
        setLiked(data.complaint.isLiked);
        setLikesCount(data.complaint.likesCount);
        if (data.complaint.callLogId) setCallLogId(data.complaint.callLogId);
      } catch { toast.error('Complaint not found'); navigate('/feed'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Please login to like'); return; }
    try {
      const { data } = await complaintAPI.like(id);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch { toast.error('Failed'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const { data } = await complaintAPI.comment(id, comment);
      setComplaint(p => ({ ...p, comments: data.comments }));
      setComment('');
      toast.success('Comment added');
    } catch { toast.error('Failed to comment'); }
    finally { setCommenting(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this complaint?')) return;
    try {
      await complaintAPI.delete(id);
      toast.success('Complaint deleted');
      navigate('/my-complaints');
    } catch { toast.error('Cannot delete'); }
  };

  const handleLetterDownload = async () => {
    setDownloadingLetter(true);
    const toastId = toast.loading('🤖 AI is drafting your letter...');
    try {
      const res = await complaintAPI.generateLetter(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaint-letter.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Letter downloaded!', { id: toastId });

      // Refresh to get referenceNumber 
      const { data } = await complaintAPI.getById(id);
      setComplaint(data.complaint);
    } catch (err) {
      toast.error('Failed to generate letter', { id: toastId });
    } finally {
      setDownloadingLetter(false);
    }
  };

  const handleInitiateCall = async () => {
    setCalling(true);
    const tid = toast.loading('Generating AI voice script...');
    try {
      // Assuming api from services
      const token = localStorage.getItem('jv_token');
      const res = await fetch(`http://localhost:5000/api/calls/${id}/initiate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCallScript(data.script);
        setShowCallModal(true);
        toast.success('Call Script generated', { id: tid });
      } else {
        toast.error(data.message || 'Failed', { id: tid });
      }
    } catch (err) {
      toast.error('Network Error', { id: tid });
    } finally {
      setCalling(false);
    }
  };

  if (loading) return (
    <motion.div
      className="pt-20 min-h-screen bg-background flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <Loader size={40} className="text-primary" />
      </motion.div>
    </motion.div>
  );
  if (!complaint) return null;

  const isOwner = user?.id === complaint.user?._id || user?._id === complaint.user?._id;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {/* Main */}
          <div className="md:col-span-2 space-y-4">
            {/* Image carousel or fallback */}
            {complaint.images?.length > 0 ? (
              <div className="glass-card rounded-3xl overflow-hidden p-1">
                <img src={`https://jantavoice0-2.onrender.com${complaint.images[imgIdx]}`} alt="Complaint" className="w-full h-64 object-cover rounded-2xl bg-secondary/50" />
                {complaint.images.length > 1 && (
                  <div className="flex gap-2 p-2 mt-1">
                    {complaint.images.map((img, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}>
                        <img src={`https://jantavoice0-2.onrender.com${img}`} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover bg-secondary/50" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-secondary/30 border border-border rounded-3xl h-64 flex flex-col items-center justify-center text-muted-foreground/50 shadow-inner">
                <div className="text-6xl mb-4 drop-shadow-sm">{CATEGORY_ICONS[complaint.category] || '📋'}</div>
                <p className="font-bold tracking-widest uppercase text-sm text-muted-foreground">{complaint.category}</p>
                <p className="text-xs mt-2 opacity-70 font-medium">No photos attached</p>
              </div>
            )}

            {/* Content */}
            <div className="glass-card rounded-3xl p-6 sm:p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={STATUS_COLORS[complaint.status]}>{complaint.status}</span>
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  {CATEGORY_ICONS[complaint.category]} {complaint.category}
                </span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${complaint.priority === 'Critical' ? 'bg-destructive text-destructive-foreground shadow-sm' :
                  complaint.priority === 'High' ? 'bg-orange-500/10 text-orange-600' :
                    complaint.priority === 'Medium' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'
                  }`}>{complaint.priority} Priority</span>
              </div>
              <h1 className="font-bold text-3xl leading-tight mb-4 text-foreground tracking-tight">{complaint.title}</h1>
              {complaint.aiSummary && (
                <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-4 text-sm text-foreground flex gap-3 items-start">
                  <span className="text-lg">🤖</span> <span className="leading-relaxed"><strong className="text-primary font-semibold">AI Summary:</strong> {complaint.aiSummary}</span>
                </div>
              )}
              <p className="text-muted-foreground font-medium leading-relaxed text-base mb-6">{complaint.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-6">
                <span className="text-lg">📍</span> {complaint.location?.address}{complaint.location?.city ? `, ${complaint.location.city}` : ''}{complaint.location?.state ? `, ${complaint.location.state}` : ''}
              </div>
              {complaint.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-6">
                  {complaint.tags.map(tag => (
                    <span key={tag} className="bg-secondary text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-5 border-t border-border mt-4">
                <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${liked ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
                  {liked ? <Heart className="fill-current w-4 h-4" /> : <Heart className="w-4 h-4" />} {likesCount} {liked ? 'Liked' : 'Like'}
                </button>
                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {complaint.views}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {complaint.comments?.length || 0}</span>
                  {(isOwner || isAdmin) && (
                    <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Admin note */}
            {complaint.adminNote && (
              <div className="bg-secondary/50 border border-border rounded-3xl p-6">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Admin Note</p>
                <p className="text-sm text-foreground font-medium leading-relaxed">{complaint.adminNote}</p>
              </div>
            )}

            {/* Comments */}
            <div className="glass-card rounded-3xl p-6 sm:p-8">
              <h3 className="font-bold text-xl mb-5 text-foreground tracking-tight">Comments ({complaint.comments?.length || 0})</h3>
              {isAuthenticated ? (
                <form onSubmit={handleComment} className="flex gap-3 mb-6">
                  <input className="input flex-1 bg-secondary/50 border-border" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." maxLength={500} />
                  <button disabled={!comment.trim() || commenting} className="btn btn-primary px-6 text-sm disabled:opacity-60">
                    {commenting ? '...' : 'Post'}
                  </button>
                </form>
              ) : (
                <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-5 text-sm font-medium text-muted-foreground text-center">
                  <Link to="/login" className="text-primary font-bold hover:underline">Login</Link> to add a comment
                </div>
              )}
              <div className="space-y-4">
                {complaint.comments?.length === 0 && <p className="text-muted-foreground font-medium text-sm text-center py-6">No comments yet. Be the first!</p>}
                {complaint.comments?.map(c => (
                  <div key={c._id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0 shadow-sm">
                      {getInitials(c.user?.name || 'A')}
                    </div>
                    <div className="flex-1 bg-secondary/30 border border-border rounded-2xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-foreground">{c.user?.name || 'Anonymous'}</span>
                        <span className="text-xs font-semibold text-muted-foreground">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-6">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Status Progress</h4>
              <StatusTimeline statusHistory={complaint.statusHistory} currentStatus={complaint.status} />
            </div>
            <div className="glass-card rounded-3xl p-6">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Filed By</h4>
              {complaint.isAnonymous ? (
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">👤</div><span className="text-sm font-bold text-foreground">Anonymous</span></div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">{getInitials(complaint.user?.name)}</div>
                  <div><p className="text-sm font-bold text-foreground">{complaint.user?.name}</p><p className="text-xs text-muted-foreground font-medium">{complaint.user?.complaintsCount || 0} complaints filed</p></div>
                </div>
              )}
              <p className="text-xs font-semibold text-muted-foreground mt-4 pt-4 border-t border-border">📅 Filed {formatDate(complaint.createdAt)}</p>
            </div>

            {(isOwner || isAdmin) && (
              <div className="bg-foreground text-background rounded-3xl p-6 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">🤖</div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted mb-4 relative z-10 flex items-center gap-2">
                  ⚡ Automation Status
                </h4>
                <div className="space-y-3 text-sm relative z-10 font-medium">
                  <div className="flex justify-between items-center bg-background/10 p-2.5 rounded-xl backdrop-blur-sm">
                    <span className="text-muted/80">Auto-monitoring:</span>
                    <span className="flex items-center gap-1 text-green-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-background/10 p-2.5 rounded-xl backdrop-blur-sm">
                    <span className="text-muted/80">Gov Submission:</span>
                    <span className={complaint.govTicket ? "text-green-400 font-bold" : "text-primary font-bold"}>
                      {complaint.govTicket ? `GR#${complaint.govTicket.ticketId || complaint.govTicket.slice(-6)}` : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-background/10 p-2.5 rounded-xl backdrop-blur-sm">
                    <span className="text-muted/80">Next auto-check:</span>
                    <span className="text-background font-bold">in ~24 mins</span>
                  </div>

                  <div className="pt-3 border-t border-background/20 mt-3">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">📄 Formal Letter</div>
                    {complaint.referenceNumber ? (
                      <button onClick={handleLetterDownload} disabled={downloadingLetter} className="btn w-full bg-background/20 hover:bg-background/30 text-background text-sm py-2.5 flex items-center justify-center gap-2 border border-background/20 backdrop-blur-md transition-all">
                        {downloadingLetter ? 'Downloading...' : 'Download PDF'}
                      </button>
                    ) : (
                      <button onClick={handleLetterDownload} disabled={downloadingLetter} className="btn w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2.5 flex items-center justify-center gap-2 transition-all">
                        {downloadingLetter ? 'Generating...' : 'Generate Letter'}
                      </button>
                    )}
                  </div>

                  <div className="pt-3 border-t border-background/20 mt-3 space-y-3">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 mt-1">📞 Automated Calling</div>

                    {!complaint.callLogId && (
                      <button
                        onClick={() => setShowCallModal(true)}
                        className="btn w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 flex items-center justify-center gap-2 transition-all">
                        📞 Call Department via AI
                      </button>
                    )}

                    {complaint.callLogId && (
                      <button onClick={() => { setCallLogId(complaint.callLogId); setShowTranscript(true); }}
                        className="btn w-full bg-background hover:bg-muted text-foreground text-sm py-2.5 flex items-center justify-center gap-2 transition-all font-bold">
                        📋 View Call Transcript
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}

            {complaint.govTicket && (
              <div className="glass-card rounded-3xl p-6">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  🏛️ Government Ticket
                </h4>

                <div className="space-y-4">
                  <div className="bg-secondary/50 border border-border p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Ticket ID</span>
                      <span className="text-[10px] text-foreground bg-secondary px-2 py-1 rounded font-bold uppercase tracking-widest border border-border mt-1">{complaint.govTicket.portalName || 'CPGRAMS'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-mono text-base font-bold text-foreground">{complaint.govTicket.ticketId || complaint.govTicket}</span>
                      <button onClick={() => { navigator.clipboard.writeText(complaint.govTicket.ticketId || complaint.govTicket); toast.success('Ticket ID Copied!'); }} className="text-primary hover:bg-primary/20 text-xs font-bold transition-all bg-primary/10 px-3 py-1.5 rounded-lg">Copy</button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Current Status</div>
                    <GovStatusBadge status={complaint.govTicket.currentStatus || 'Submitted'} />
                  </div>

                  {complaint.govTicket.statusHistory && (
                    <div className="pt-3 border-t border-border mt-2">
                      <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Progression</h5>
                      <div className="space-y-3">
                        {complaint.govTicket.statusHistory?.slice(-3).map((h, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className="text-primary mt-0.5 text-lg leading-none">●</div>
                            <div>
                              <div className="font-bold text-foreground">{h.status}</div>
                              <div className="text-xs font-medium text-muted-foreground mt-0.5">{timeAgo(h.timestamp)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border mt-3">
                    <a href={complaint.govTicket.ticketUrl || '#'} target="_blank" rel="noreferrer" className="bg-secondary hover:bg-primary/10 text-foreground hover:text-primary border border-border hover:border-primary/20 text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all">
                      Portal <ExternalLink size={14} />
                    </a>
                    <button onClick={async () => {
                      const tid = toast.loading('Checking status...');
                      try {
                        await govAPI.checkStatus(complaint.govTicket.ticketId || complaint.govTicket);
                        const { data } = await complaintAPI.getById(id);
                        setComplaint(data.complaint);
                        toast.success('Status updated', { id: tid });
                      } catch {
                        toast.error('Check failed', { id: tid });
                      }
                    }} className="btn btn-secondary text-sm py-2.5 flex items-center justify-center gap-1">
                      🔄 Check Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="glass-card rounded-3xl p-6 mt-4 border-primary/20 bg-primary/5">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary mb-4">Admin Actions</h4>
                <button onClick={handleInitiateCall} disabled={calling} className="btn btn-primary w-full text-center text-sm py-3 mb-3 flex items-center justify-center gap-2">
                  <Phone size={16} /> {calling ? 'Calling AI...' : '📞 Initiate AI Call'}
                </button>
                <Link to="/admin" className="btn btn-secondary w-full text-center text-sm py-3 block">Open Admin Panel</Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {showCallModal && (
        <CallPermissionModal
          complaint={complaint}
          onClose={() => setShowCallModal(false)}
          onCallStarted={(data) => { setCallLogId(data.callLogId); setShowCallModal(false); setShowTranscript(true); }}
        />
      )}

      {showTranscript && callLogId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1900] flex items-center justify-center p-4">
          <div className="glass-card bg-background rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-6">
              <div className="font-bold text-xl text-foreground tracking-tight">📞 Call Details & Transcript</div>
              <button onClick={() => setShowTranscript(false)} className="bg-secondary hover:bg-secondary/80 text-foreground rounded-full w-8 h-8 flex items-center justify-center transition-colors border border-border">✕</button>
            </div>
            <CallTranscriptViewer callLogId={callLogId} />
          </div>
        </div>
      )}
    </div>
  );
}
