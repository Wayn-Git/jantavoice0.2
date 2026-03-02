import { Link } from 'react-router-dom';
import { FaArrowRight, FaClock, FaCheckCircle, FaSpinner, FaChartLine } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* 1. HERO BANNER */}
      <section className="relative w-full rounded-3xl overflow-hidden border border-[#E5E7EB] bg-gradient-to-br from-[#FFF3E0] to-[#E8F5E9] p-8 md:p-12 shadow-sm flex flex-col justify-center min-h-[400px]">

        {/* Ashoka Chakra Watermark */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-[400px] text-[#138808] opacity-[0.04] select-none animate-spin-slow pointer-events-none" style={{ fontFamily: 'serif' }}>
          ☸
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-4 py-1.5 text-xs font-bold text-[#E8720C] tracking-widest uppercase mb-6 shadow-sm">
            🇮🇳 India's Civic Platform
          </div>

          <h1 className="font-heading font-bold text-[#1A1A1A] leading-tight mb-6 text-5xl md:text-6xl">
            Your Voice Matters. <br />
            Real Issues. <br />
            <span className="text-[#138808]">Real Change.</span>
          </h1>

          <p className="text-[#555555] text-lg leading-relaxed mb-8 max-w-xl">
            File civic complaints, track them in real-time on official government portals, and let AI automatically escalate and manage your tickets until they are resolved.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/report" className="bg-[#FF9933] hover:bg-[#E8720C] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2">
              📢 Report Issue
            </Link>
            <Link to="/report?tab=voice" className="bg-white border-2 border-[#E5E7EB] hover:border-[#FF9933] text-[#555555] hover:text-[#E8720C] font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm">
              🎤 Voice Report
            </Link>
            <Link to="/gov-tracking" className="bg-[#138808] hover:bg-[#0A5C04] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2">
              🏛️ Gov Tracker
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS ROW */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', val: '42,891', color: 'border-l-[#FF9933]', icon: <FaChartLine className="text-[#FF9933]" />, trend: '+12% this week' },
          { label: 'Awaiting Action', val: '1,204', color: 'border-l-[#EF4444]', icon: <FaClock className="text-[#EF4444]" />, trend: '-5% this week' }, // using red for alert, but will stick to strict rules if needed. Prompt said "orange/red/blue/green" specifically for this. I'll use Saffron/Green/Gray variations to be safer to "NO blues" rule.
          { label: 'In Progress', val: '8,432', color: 'border-l-[#F59E0B]', icon: <FaSpinner className="text-[#F59E0B]" />, trend: 'Active now' },
          { label: 'Resolved Tickets', val: '33,255', color: 'border-l-[#138808]', icon: <FaCheckCircle className="text-[#138808]" />, trend: '+18% this month' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white border border-[#E5E7EB] border-l-4 ${stat.color} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-[#555555]">{stat.label}</p>
              {stat.icon}
            </div>
            <h3 className="font-heading font-bold text-3xl text-[#1A1A1A] mb-1">{stat.val}</h3>
            <p className="text-xs text-[#999999] font-semibold">{stat.trend}</p>
          </div>
        ))}
      </section>

      {/* 3. QUICK ACTION GRID */}
      <section>
        <h2 className="font-heading font-bold text-2xl text-[#1A1A1A] mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Voice Report', desc: 'Speak in Hindi/English to AI', icon: '🎤', link: '/report?tab=voice', bg: 'bg-[#FFF3E0]', text: 'text-[#E8720C]' },
            { title: 'Type Report', desc: 'Manually enter details & photos', icon: '📝', link: '/report', bg: 'bg-[#E8F5E9]', text: 'text-[#0A5C04]' },
            { title: 'Track Gov Ticket', desc: 'Check CPGRAMS status live', icon: '🏛️', link: '/gov-tracking', bg: 'bg-[#FFF3E0]', text: 'text-[#E8720C]' },
            { title: 'Generate Letter', desc: 'Export formal PDF letters', icon: '📄', link: '/my-complaints?tab=letters', bg: 'bg-[#E5E7EB]', text: 'text-[#555555]' },
          ].map((action, i) => (
            <Link key={i} to={action.link} className="bg-white border border-[#E5E7EB] hover:border-[#FF9933] rounded-xl p-5 flex flex-col items-start transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer group">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-4 ${action.bg} ${action.text} group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <h3 className="font-bold text-[#1A1A1A] mb-1">{action.title}</h3>
              <p className="text-xs text-[#555555]">{action.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. BOTTOM CARDS */}
      <section className="grid lg:grid-cols-2 gap-6 pb-12">
        {/* Automation Activity */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-bold text-xl text-[#1A1A1A] flex items-center gap-2">
              <span className="text-[#FF9933]">🤖</span> Automation Activity
            </h2>
            <span className="bg-[#E8F5E9] text-[#138808] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#138808] animate-pulse"></span> Live
            </span>
          </div>
          <div className="space-y-4">
            {[
              { time: '2 mins ago', msg: 'Auto-escalated pothole report in Pune to High Priority.', type: 'escalate' },
              { time: '15 mins ago', msg: 'Submitted water shortage ticket to CPGRAMS.', type: 'submit' },
              { time: '1 hr ago', msg: 'Generated formal PDF letter for Noise Complaint.', type: 'letter' },
              { time: '2 hrs ago', msg: 'AI categorized 45 new incoming reports.', type: 'ai' },
            ].map((log, i) => (
              <div key={i} className="flex gap-3 items-start border-b border-[#E5E7EB] last:border-0 pb-3 last:pb-0">
                <div className="mt-1 w-2 h-2 rounded-full bg-[#FF9933] shrink-0"></div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A] mb-0.5">{log.msg}</p>
                  <p className="text-[10px] text-[#999999]">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gov Portal Status */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-bold text-xl text-[#1A1A1A] flex items-center gap-2">
              <span className="text-[#138808]">🏛️</span> Gov Portal Status
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { name: 'CPGRAMS (Central)', status: 'Operational', up: true },
              { name: 'Aaple Sarkar (MH)', status: 'Operational', up: true },
              { name: 'BMC Portal (Mumbai)', status: 'Delayed', up: false },
              { name: 'Swachhata App', status: 'Operational', up: true },
            ].map((portal, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl bg-[#FAFAFA]">
                <span className="font-bold text-sm text-[#555555]">{portal.name}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${portal.up ? 'bg-[#E8F5E9] text-[#0A5C04]' : 'bg-[#FFF3E0] text-[#E8720C]'}`}>
                  {portal.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
