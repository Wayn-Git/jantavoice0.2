import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { getInitials } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card dark:bg-zinc-900 rounded-3xl p-7 sm:p-9 border border-border shadow-sm dark:shadow-2xl text-center"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-black mb-4 shadow-lg shadow-primary/30">
            {getInitials(user?.name || '?')}
          </div>
          <h1 className="text-3xl font-black text-foreground mb-1">{user?.name}</h1>
          <p className="text-muted-foreground font-medium flex items-center justify-center gap-2 mb-6">
            <Mail size={16} /> {user?.email}
          </p>
          
          <div className="flex flex-col gap-3 max-w-sm mx-auto mt-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border">
              <span className="text-sm font-bold text-muted-foreground flex items-center gap-2"><Shield size={16}/> Role</span>
              <span className="text-sm font-black uppercase tracking-wider text-primary">{user?.role || 'User'}</span>
            </div>
            
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all font-bold mt-4"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
