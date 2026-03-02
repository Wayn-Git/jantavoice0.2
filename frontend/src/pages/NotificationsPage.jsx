import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheckDouble, FaRobot, FaLandmark, FaInfoCircle } from 'react-icons/fa';
import { timeAgo } from '../utils/helpers';

export default function NotificationsPage() {
  const { notifications, markAllRead, markAsRead } = useNotification();
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.isRead;
    if (filter === 'Automation') return n.type === 'automation_rule';
    if (filter === 'Gov Updates') return n.type === 'gov_update';
    return true;
  });

  const getIcon = (type) => {
    if (type === 'automation_rule') return <FaRobot className="text-blue-500" />;
    if (type === 'gov_update') return <FaLandmark className="text-purple-500" />;
    return <FaInfoCircle className="text-gray-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-800 flex items-center gap-3">
            <FaBell className="text-saffron" />
            Notifications
          </h1>
          <p className="text-gray-500">Stay updated on your complaint statuses and government portal actions.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="btn-secondary whitespace-nowrap flex items-center gap-2">
            <FaCheckDouble /> Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {['All', 'Unread', 'Automation', 'Gov Updates'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${filter === f ? 'border-saffron text-saffron bg-white/50' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
            <div className="text-6xl opacity-20">📭</div>
            <p className="font-bold text-lg">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(n => (
              <div
                key={n._id}
                onClick={() => {
                  if (!n.isRead) markAsRead(n._id);
                  if (n.complaint) navigate(`/complaint/${n.complaint}`);
                }}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4 ${!n.isRead ? 'bg-saffron-pale/20' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-white shadow-sm border border-gray-100' : 'bg-gray-100'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{n.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-gray-400">
                    <span>{timeAgo(n.createdAt)}</span>
                    {!n.isRead && <span className="text-saffron">• New</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
