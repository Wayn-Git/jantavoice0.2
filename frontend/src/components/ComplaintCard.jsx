import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Eye, MapPin, Flame, FileText, Settings } from 'lucide-react';
import { timeAgo, getInitials, CATEGORY_ICONS } from '../utils/helpers';
import { complaintAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ComplaintCard({ complaint, onLikeUpdate }) {
  const { isAuthenticated, user } = useAuth();
  const [liked, setLiked] = useState(complaint.likes?.includes(user?._id || user?.id));
  const [likesCount, setLikesCount] = useState(complaint.likesCount || complaint.likes?.length || 0);
  const [liking, setLiking] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to like complaints'); return; }
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await complaintAPI.like(complaint._id);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      onLikeUpdate?.(complaint._id, data);
    } catch { toast.error('Failed to update like'); }
    finally { setLiking(false); }
  };

  const CategoryIcon = CATEGORY_ICONS[complaint.category] || CATEGORY_ICONS['Other'];

  return (
    <Link to={`/complaint/${complaint._id}`} className="block group relative overflow-hidden glass-card">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex gap-2 flex-wrap text-[11px] font-medium">
            <span className="badge bg-secondary text-foreground capitalize">
              ● {complaint.status}
            </span>
            <span className="badge bg-secondary text-foreground flex items-center gap-1.5 px-3 py-1">
              {CategoryIcon} {complaint.category}
            </span>
            {complaint.govTicket && <span className="badge bg-secondary text-foreground border border-border px-3 font-semibold" title="Gov Ticket Active">GR#{complaint.govTicket.ticketId || complaint.govTicket.slice(-6)}</span>}
            {complaint.formalLetter && <span className="badge bg-secondary text-foreground border border-border flex items-center gap-1 px-3" title="Formal Letter Ready"><FileText size={12} /> Letter</span>}
            {complaint.statusHistory?.some(h => h.source === 'automation') && (
              <span className="badge bg-success/10 text-success border border-success/20 flex items-center gap-1 px-3" title="Auto-managed"><Settings size={12} /> Auto</span>
            )}
          </div>
          {(complaint.likes?.length >= 10 || likesCount >= 10) && (
            <span className="badge bg-saffron/10 text-saffron border border-saffron/20 border-opacity-50 flex items-center gap-1 font-bold whitespace-nowrap"><Flame size={14} className="animate-pulse" /> Trending</span>
          )}
        </div>

        <h3 className="font-semibold text-foreground text-sm leading-snug mb-2 line-clamp-2 transition-colors">{complaint.title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-4">{complaint.description}</p>

        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mb-4">
          <MapPin size={12} className="text-primary flex-shrink-0" />
          <span className="truncate">{complaint.location?.address}{complaint.location?.city ? `, ${complaint.location.city}` : ''}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-foreground text-[10px] font-medium border border-border">
              {getInitials(complaint.user?.name || 'A')}
            </div>
            <div>
              <p className="text-[11px] font-medium text-foreground">{complaint.user?.name || 'Anonymous'}</p>
              <p className="text-[10px] text-muted-foreground">{timeAgo(complaint.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
            <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${liked ? 'text-primary' : 'hover:text-primary'}`}>
              <Heart size={14} fill={liked ? "currentColor" : "none"} /> {likesCount}
            </button>
            <span className="flex items-center gap-1"><MessageSquare size={14} /> {complaint.comments?.length || 0}</span>
            <span className="flex items-center gap-1"><Eye size={14} /> {complaint.views || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
