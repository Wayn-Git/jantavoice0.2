import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const getStrength = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const strength = getStrength(form.password);
  const strengthColors = ['bg-gray-400', 'bg-saffron-pale', 'bg-saffron', 'bg-india-green'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill in all fields'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created! Welcome to Janta Voice 🎉');
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-7">
          <img src="/logo.jpeg" alt="Janta Voice Logo" className="w-16 h-auto mx-auto mb-3 object-contain drop-shadow-sm mix-blend-multiply" />
          <h1 className="font-heading font-bold text-2xl">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join Janta Voice — file and track civic complaints</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" type="text" placeholder="Rahul Kumar" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="rahul@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full ${i < strength ? strengthColors[strength - 1] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">{strengthLabels[strength - 1] || 'Too short'}</p>
              </div>
            )}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input className="input" type="password" placeholder="Repeat password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading} className="btn-green w-full text-base py-3 disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account? <Link to="/login" className="text-saffron-dark font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
