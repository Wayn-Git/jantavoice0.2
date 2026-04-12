import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.23, 1, 0.320, 1] } }
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email address'); return; }
    
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)] w-full relative z-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="glass-card w-full max-w-md p-8 sm:p-10 text-center"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>
        
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={32} className="text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Forgot Password?</h1>
        
        {!sent ? (
          <>
            <p className="text-muted-foreground text-sm font-medium mb-8">
              No worries, we'll send you reset instructions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-left">
                <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3.5 text-muted-foreground" />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : 'Reset password'}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <p className="text-muted-foreground text-sm font-medium mb-8">
              We have sent a secure password reset link to <strong className="text-foreground">{email}</strong>. Please check your inbox and spam folder.
            </p>
            <Link to="/login" className="w-full btn btn-secondary py-3 flex items-center justify-center gap-2">
              Return to Login <ArrowRight size={18} />
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
