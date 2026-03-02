import { FaClock, FaCheckCircle, FaTimesCircle, FaPaperPlane, FaSpinner, FaBuilding } from 'react-icons/fa';

export default function GovStatusBadge({ status }) {
    const getBadgeStyle = () => {
        const s = status?.toLowerCase() || '';
        if (s.includes('submitted')) return 'bg-gray-100 text-gray-800 border-gray-200';
        if (s.includes('process') || s.includes('pending')) return 'bg-saffron-pale text-saffron-dark border-saffron/20';
        if (s.includes('resolved') || s.includes('closed') || s.includes('disposed')) return 'bg-india-green-pale text-india-green-dark border-india-green/20';
        if (s.includes('rejected')) return 'bg-saffron text-white border-saffron-dark';
        if (s.includes('ministry')) return 'bg-gray-200 text-gray-800 border-gray-300';
        if (s.includes('action')) return 'bg-saffron-pale text-saffron border-saffron/20';
        return 'bg-gray-50 text-gray-500 border-gray-200';
    };

    const getIcon = () => {
        const s = status?.toLowerCase() || '';
        if (s.includes('submitted')) return <FaPaperPlane className="text-xs" />;
        if (s.includes('process') || s.includes('pending')) return <FaSpinner className="text-xs animate-spin-slow" />;
        if (s.includes('resolved') || s.includes('closed') || s.includes('disposed')) return <FaCheckCircle className="text-xs" />;
        if (s.includes('rejected')) return <FaTimesCircle className="text-xs" />;
        if (s.includes('ministry')) return <FaBuilding className="text-xs" />;
        return <FaClock className="text-xs" />;
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${getBadgeStyle()}`}>
            {getIcon()}
            {status || 'Unknown'}
        </span>
    );
}
