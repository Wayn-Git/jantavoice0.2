import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FaBell, FaBars, FaTimes } from 'react-icons/fa';
import { getInitials } from '../utils/helpers';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unread, shake, notifications, markAllRead, markAsRead } = useNotification();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [dropNotif, setDropNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">

      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-saffron rounded flex items-center justify-center text-white text-lg shadow-sm">
          📢
        </div>
        <span className="font-heading font-bold text-xl tracking-wide text-gray-800 hidden sm:block">
          JANTA VOICE
        </span>
      </Link>

      {/* Center: Desktop Links (Optional here, since sidebar handles most, but requested in prompt) */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/" className="text-gray-500 hover:text-saffron font-bold text-sm transition-colors">Home</Link>
        <Link to="/feed" className="text-gray-500 hover:text-saffron font-bold text-sm transition-colors">Feed</Link>
        <Link to="/aqi-monitor" className="text-gray-500 hover:text-saffron flex items-center gap-1 font-bold text-sm transition-colors">🌬️ AQI Monitor</Link>
        {isAuthenticated && (
          <>
            <Link to="/gov-tracking" className="text-gray-500 hover:text-saffron font-bold text-sm transition-colors">Gov Tracker</Link>
            <Link to="/my-complaints" className="text-gray-500 hover:text-saffron font-bold text-sm transition-colors">My Complaints</Link>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button onClick={() => setDarkMode(!darkMode)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-full transition-colors focus:outline-none" title="Toggle Dark Mode">
          {darkMode ? '🌙' : '☀️'}
        </button>
        {isAuthenticated ? (
          <>
            <div className="relative">
              <button
                onClick={() => { setDropNotif(!dropNotif); setDropOpen(false); }}
                className="relative w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-full transition-colors focus:outline-none"
              >
                <FaBell className={`text-lg transition-transform ${shake ? 'animate-bounce text-saffron' : ''}`} />
                {unread > 0 && (
                  <span className="absolute top-2 right-2 bg-india-green text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {dropNotif && (
                <div className="absolute right-0 md:right-[-80px] top-12 bg-white border border-gray-200 rounded-xl shadow-xl w-80 overflow-hidden z-50 flex flex-col max-h-[400px]">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                    <div className="flex gap-3 items-center">
                      {unread > 0 && <button onClick={() => { markAllRead(); setDropNotif(false); }} className="text-xs text-saffron font-bold hover:underline">Mark all read</button>}
                      <Link to="/notifications" onClick={() => setDropNotif(false)} className="text-xs text-gray-500 hover:text-gray-800">View All</Link>
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-gray-400 text-sm">No new notifications</p>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div key={n._id} onClick={() => { if (!n.isRead) markAsRead(n._id); navigate(n.complaint ? `/complaint/${n.complaint}` : '/notifications'); setDropNotif(false); }} className={`p-3 rounded-lg cursor-pointer transition-colors ${n.isRead ? 'hover:bg-gray-50 opacity-70' : 'bg-saffron-pale/50 border border-saffron/20 hover:bg-saffron-pale'}`}>
                          <p className="text-xs text-gray-800 font-semibold mb-1 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-gray-500 font-bold">{n.type === 'automation_rule' ? '🤖 Automation' : n.type === 'gov_update' ? '🏛️ Gov Update' : '🔔 System'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/report" className="hidden sm:flex bg-saffron hover:bg-saffron-dark text-white font-bold text-sm px-4 py-2 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 items-center gap-2">
              <span>+</span> Report Issue
            </Link>

            <div className="relative">
              <button onClick={() => { setDropOpen(!dropOpen); setDropNotif(false); }} className="w-10 h-10 bg-india-green-pale text-india-green-dark border border-india-green/20 rounded-full flex items-center justify-center font-bold text-sm transition-transform hover:scale-105">
                {getInitials(user.name)}
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg w-48 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-bold text-sm text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setDropOpen(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-saffron/10 hover:text-saffron">👤 Profile</Link>
                  <button onClick={() => { logout(); setDropOpen(false); navigate('/'); }} className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">🚪 Logout</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="text-gray-600 hover:text-saffron font-bold text-sm px-4 py-2 border border-gray-200 hover:border-saffron rounded-lg transition-colors bg-white">
            Login
          </Link>
        )}

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-full">
          {mobileOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-[60px] left-0 right-0 bg-white border-b border-gray-200 shadow-md flex flex-col p-4 gap-2 md:hidden">
          <Link to="/" onClick={() => setMobileOpen(false)} className="px-4 py-3 font-bold text-gray-600 hover:bg-saffron/10 hover:text-saffron rounded-xl">Home</Link>
          <Link to="/feed" onClick={() => setMobileOpen(false)} className="px-4 py-3 font-bold text-gray-600 hover:bg-saffron/10 hover:text-saffron rounded-xl">Feed</Link>
          {isAuthenticated && (
            <>
              <Link to="/gov-tracking" onClick={() => setMobileOpen(false)} className="px-4 py-3 font-bold text-gray-600 hover:bg-saffron/10 hover:text-saffron rounded-xl">Gov Tracker</Link>
              <Link to="/my-complaints" onClick={() => setMobileOpen(false)} className="px-4 py-3 font-bold text-gray-600 hover:bg-saffron/10 hover:text-saffron rounded-xl">My Complaints</Link>
            </>
          )}
          <Link to="/report" onClick={() => setMobileOpen(false)} className="bg-saffron text-white text-center font-bold px-4 py-3 rounded-xl mt-2 shadow-sm">
            + Report Issue
          </Link>
        </div>
      )}
    </nav>
  );
}
