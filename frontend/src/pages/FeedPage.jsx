import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Heart, Eye, MessageSquare, ChevronDown, Plus, Mic, FileText, MapPin, Bell, Inbox } from 'lucide-react';
import { complaintAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintSkeleton from '../components/ComplaintSkeleton';
import { CATEGORY_ICONS } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Roads', 'Water', 'Electricity', 'Sanitation', 'Parks', 'Safety', 'Noise', 'Other'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.320, 1] } }
};

export default function FeedPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({ category: '', status: '', sortBy: 'newest', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchComplaints = useCallback(async (pg = 1, reset = true) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = { page: pg, limit: 12 };
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.sortBy !== 'newest') params.sortBy = filters.sortBy;
      if (filters.search) params.search = filters.search;

      const { data } = await complaintAPI.getAll(params);
      if (reset || pg === 1) {
        setComplaints(data.complaints);
      } else {
        setComplaints(prev => [...prev, ...data.complaints]);
      }
      setTotal(data.total);
      setHasMore(pg < data.pages);
      setPage(pg);
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => { fetchComplaints(1, true); }, [fetchComplaints]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setCategory = (cat) => setFilters(f => ({ ...f, category: cat === 'All' ? '' : cat }));

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-0 py-4 md:py-8">
        {/* Header Bento Block */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-8 border border-border shadow-sm mb-6 flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-success via-white to-primary opacity-50" />
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-success/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
              <span className="text-success">Complaints</span> Feed
            </h1>
            {!loading && <p className="text-base text-muted-foreground font-medium flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              {total} complaint{total !== 1 ? 's' : ''} reported in your area
            </p>}
          </div>

          <div className="relative z-10 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`btn flex items-center gap-2 font-bold px-6 py-3 transition-colors ${showFilters ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80'}`}
            >
              <Filter size={18} /> {showFilters ? 'Hide Filters' : 'Filters'}
            </motion.button>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="mb-8"
            >
              {/* Mosaic Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Search Block (Spans 2 columns on lg) */}
                <div className="md:col-span-2 lg:col-span-2 bg-card rounded-3xl p-6 border border-border shadow-sm">
                  <label className="block text-sm font-bold text-foreground mb-3 uppercase tracking-wider opacity-80">Search Complaints</label>
                  <div className="relative">
                    <Search size={20} className="absolute left-4 top-3.5 text-primary" />
                    <input
                      className="w-full pl-12 pr-4 py-3 bg-secondary/30 border border-border rounded-2xl text-foreground font-medium placeholder-muted-foreground focus:outline-none focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                      placeholder="Search by title, category, area..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status & Sort Block */}
                <div className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col sm:flex-row lg:flex-col gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider opacity-80">Status</label>
                    <select
                      value={filters.status}
                      onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Status</option>
                      <option value="Reported">Reported</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider opacity-80">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="likes">Most Liked</option>
                      <option value="views">Most Viewed</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Categories Block (Spans full width) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-card rounded-3xl p-6 border border-border shadow-sm">
                  <label className="block text-sm font-bold text-foreground mb-4 uppercase tracking-wider opacity-80 flex items-center gap-2">
                    <Filter size={16} className="text-success" /> Filter by Category
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat, i) => (
                      <motion.button
                        key={cat}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setCategory(cat)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border flex items-center gap-2 ${(cat === 'All' && !filters.category) || filters.category === cat
                          ? 'bg-success text-success-foreground border-success shadow-md shadow-success/20'
                          : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                          }`}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 overflow-x-auto pb-4 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {[
            { icon: Mic, label: 'Voice Complaint', link: '/report?tab=voice' },
            { icon: FileText, label: 'Generate Letter', link: '/my-complaints' },
            { icon: MapPin, label: 'Gov Tracker', link: '/gov-tracking' },
            { icon: Bell, label: 'Set Alert', action: () => toast.success('Alerts configured!') },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {item.link ? (
                <Link to={item.link} className="flex-shrink-0 flex items-center gap-2 px-4 py-3 glass-card hover:bg-secondary/50 rounded-xl transition-all font-semibold text-sm text-foreground group border border-border">
                  <item.icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  {item.label}
                </Link>
              ) : (
                <motion.button
                  onClick={item.action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-3 glass-card hover:bg-secondary/50 rounded-xl transition-all font-semibold text-sm text-foreground group border border-border"
                >
                  <item.icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  {item.label}
                </motion.button>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <ComplaintSkeleton />
              </motion.div>
            ))}
          </motion.div>
        ) : complaints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 glass-card rounded-3xl"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="text-6xl mb-4">
              <Inbox size={80} className="mx-auto text-muted-foreground/30" />
            </motion.div>
            <h3 className="font-bold text-2xl text-foreground tracking-tight mb-2">No complaints found</h3>
            <p className="text-muted-foreground font-medium text-base mb-6 max-w-md mx-auto">
              {filters.search || filters.category || filters.status
                ? 'Try adjusting your filters'
                : 'Be the first to file a complaint in your area'}
            </p>
            {isAuthenticated
              ? <Link to="/report" className="btn btn-primary inline-flex items-center gap-2">
                <Plus size={18} /> File First Complaint
              </Link>
              : <Link to="/register" className="btn btn-primary inline-flex items-center gap-2">
                Join Janta Voice
              </Link>
            }
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            >
              {complaints.map((c, i) => (
                <motion.div key={c._id} variants={itemVariants}>
                  <ComplaintCard complaint={c} />
                </motion.div>
              ))}
            </motion.div>
            {hasMore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.button
                  onClick={() => fetchComplaints(page + 1, false)}
                  disabled={loadingMore}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-secondary border border-border inline-flex px-8 py-3 rounded-full font-semibold"
                >
                  {loadingMore ? '⏳ Loading...' : 'Load More Complaints'}
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to="/report" className="w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all">
          <Plus size={28} />
        </Link>
      </motion.div>
    </div>
  );
}
