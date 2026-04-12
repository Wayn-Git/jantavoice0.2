import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.23, 1, 0.320, 1] } }
};

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.resetPassword(token, form.password);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired reset token');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)] w-full">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="glass-card w-full max-w-md p-8 sm:p-10 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">All Done!</h1>
          <p className="text-muted-foreground text-sm font-medium mb-6">Your password has been reset successfully. Redirecting you to login...</p>
          <Link to="/login" className="btn btn-primary w-full inline-flex justify-center py-3">Login Now</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)] w-full relative z-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="glass-card w-full max-w-md p-8 sm:p-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Set New Password</h1>
          <p className="text-muted-foreground text-sm font-medium">Please enter your new strong password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-muted-foreground" />
              <input
                className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                type={showPass ? 'text' : 'password'}
                placeholder="********"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-muted-foreground" />
              <input
                className="w-full pl-10 pr-12 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                type={showPass ? 'text' : 'password'}
                placeholder="********"
                value={form.confirmPassword}
                onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 btn btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : 'Update Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
