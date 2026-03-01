import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });
export const formatDate = (date) => format(new Date(date), 'dd MMM yyyy');

export const STATUS_COLORS = {
  Reported: 'badge-reported',
  'In Progress': 'badge-inprogress',
  Resolved: 'badge-resolved',
  Rejected: 'badge-rejected',
};

export const STATUS_DOT = {
  Reported: 'bg-red-500',
  'In Progress': 'bg-amber-500',
  Resolved: 'bg-india-green',
  Rejected: 'bg-gray-400',
};

export const CATEGORY_ICONS = {
  Roads: '🛣️', Water: '💧', Electricity: '⚡',
  Sanitation: '🗑️', Parks: '🌳', Safety: '🛡️',
  Noise: '🔊', Other: '📋',
};

export const CATEGORY_ACCENT = {
  Roads: 'bg-saffron', Water: 'bg-sky-500', Electricity: 'bg-yellow-400',
  Sanitation: 'bg-india-green', Parks: 'bg-emerald-500',
  Safety: 'bg-red-500', Noise: 'bg-purple-500', Other: 'bg-gray-400',
};

export const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry',
];

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
