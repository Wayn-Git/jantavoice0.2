import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Eye, Trash2, Loader, Folder, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { complaintAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusTimeline from '../components/StatusTimeline';
import { CATEGORY_ICONS, STATUS_COLORS, formatDate, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -100, transition: { duration: 0.3 } }
};

export default function MyComplaintsPage() {
  const { isAuthenticated } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetch = async () => {
      try {
        const { data } = await complaintAPI.getMy();
        setComplaints(data.complaints);
      } catch { toast.error('Failed to load your complaints'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [isAuthenticated]);

  const filtered = complaints.filter(c => {
    if (tab === 'active') return c.status !== 'Resolved' && c.status !== 'Rejected';
    if (tab === 'resolved') return c.status === 'Resolved';
    if (tab === 'rejected') return c.status === 'Rejected';
    return true;
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this complaint?')) return;
    try {
      await complaintAPI.delete(id);
      setComplaints(prev => prev.filter(c => c._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Cannot delete'); }
  };

  const handleLetterDownload = async (id) => {
    setGeneratingId(id);
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

      const { data } = await complaintAPI.getById(id);
      setComplaints(prev => prev.map(c => c._id === data.complaint._id ? data.complaint : c));
    } catch (err) {
      toast.error('Failed to generate letter', { id: toastId });
    } finally {
      setGeneratingId(null);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'Resolved') return <CheckCircle2 size={18} className="text-green-500" />;
    if (status === 'Rejected') return <AlertCircle size={18} className="text-red-500" />;
    return <Clock size={18} className="text-blue-500" />;
  };

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-4 md:py-8">
        {/* Header Bento Box */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-8 border border-border shadow-sm mb-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-white to-success opacity-80" />
          <div className="absolute -left-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />

          <div className="relative z-10">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-3">
              My <span className="text-primary">Reports</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg flex items-center gap-2">
              <Folder size={20} className="text-success" />
              {complaints.length} issue{complaints.length !== 1 ? 's' : ''} reported to the portal
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 bg-secondary/50 border border-border rounded-2xl p-1.5 w-fit mb-8 backdrop-blur-md"
        >
          {[['all', 'All'], ['active', 'Active'], ['resolved', 'Resolved'], ['rejected', 'Rejected']].map(([val, label], i) => (
            <motion.button
              key={val}
              onClick={() => setTab(val)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === val
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:bg-secondary'}`}
            >
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-20"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader size={40} className="text-primary" />
            </motion.div>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 glass-card rounded-3xl shadow-sm"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="mb-4">
              <Folder size={80} className="mx-auto text-muted-foreground/30" />
            </motion.div>
            <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">No complaints here.</h3>
            <p className="text-muted-foreground font-medium text-base mb-6">{tab === 'all' ? "You haven't filed any complaints yet." : `No ${tab} complaints.`}</p>
            {tab === 'all' && (
              <Link to="/report" className="btn btn-primary inline-flex items-center gap-2 px-6 py-3">
                📢 File Your First Complaint
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((c, idx) => (
                <motion.div
                  key={c._id}
                  variants={itemVariants}
                  layout
                  className={`bg-card rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group h-full relative overflow-hidden ${c.status === 'Resolved' ? 'border-success/30 hover:border-success/60' : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 opacity-60 ${c.status === 'Resolved' ? 'bg-success' : c.status === 'Rejected' ? 'bg-destructive' : 'bg-primary'
                    }`} />
                  <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-xl tracking-tight leading-snug mb-3 group-hover:text-primary transition-colors">{c.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        <div className="px-2 py-1 bg-secondary rounded-lg flex items-center gap-1">
                          <span>{CATEGORY_ICONS[c.category]}</span>
                          <span>{c.category}</span>
                        </div>
                        <div className="px-2 py-1 bg-secondary rounded-lg flex items-center gap-1 opacity-80">
                          📍 {c.location?.city || c.location?.address}
                        </div>
                        <div className="px-2 py-1 bg-secondary rounded-lg flex items-center gap-1 opacity-80">
                          📅 {formatDate(c.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Row */}
                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider border ${c.status === 'Resolved' ? 'bg-success/10 text-success border-success/20' : c.status === 'Rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                        {getStatusIcon(c.status)}
                        {c.status}
                      </div>

                      {/* Context Bubbles */}
                      <div className="flex gap-1 ml-1">
                        {c.govTicket && <span className="text-sm bg-secondary rounded-full flex items-center justify-center w-6 h-6 border border-border" title="Gov Ticket Active">🏛️</span>}
                        {c.referenceNumber && <span className="text-sm bg-secondary rounded-full flex items-center justify-center w-6 h-6 border border-border" title="Formal Letter Ready">📄</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleLetterDownload(c._id)}
                        disabled={generatingId === c._id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 bg-secondary border border-border hover:bg-success hover:border-success hover:text-success-foreground rounded-xl flex items-center justify-center text-muted-foreground transition-all disabled:opacity-50"
                        title="Generate Letter"
                      >
                        {generatingId === c._id ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Loader size={18} />
                          </motion.div>
                        ) : (
                          <FileDown size={18} />
                        )}
                      </motion.button>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to={`/complaint/${c._id}`} className="w-10 h-10 bg-secondary border border-border hover:bg-primary hover:border-primary hover:text-primary-foreground rounded-xl flex items-center justify-center text-muted-foreground transition-all">
                          <Eye size={18} />
                        </Link>
                      </motion.div>
                      <motion.button
                        onClick={() => handleDelete(c._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 bg-secondary border border-border hover:bg-destructive hover:border-destructive hover:text-destructive-foreground rounded-xl flex items-center justify-center text-muted-foreground transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </div>


                  {/* Status Timeline */}
                  <div className="mb-4 pb-4 border-b border-border">
                    <StatusTimeline statusHistory={c.statusHistory || []} currentStatus={c.status} />
                  </div>

                  {/* Admin Note */}
                  {c.adminNote && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-secondary/50 border border-border rounded-xl p-3 text-sm text-foreground flex gap-2"
                    >
                      <span className="text-lg">💬</span>
                      <div>
                        <strong className="text-primary font-bold">Admin:</strong> {c.adminNote}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
