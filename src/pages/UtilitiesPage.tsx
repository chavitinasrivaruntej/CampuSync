import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  TrendingUp, 
  Calendar, 
  PieChart, 
  Folder, 
  ClipboardList, 
  ChevronRight,
  X
} from 'lucide-react';

const UTILITIES_LIST = [
  {
    title: 'GPA Calculator',
    desc: 'Calculate, analyze, and track your academic performance.',
    icon: TrendingUp,
    path: '/utilities/cgpa',
  },
  {
    title: 'Timetable',
    desc: 'Browse and access official semester timetables.',
    icon: Calendar,
    path: '/utilities/timetable',
  },
  {
    title: 'Attendance Tracker',
    desc: 'Track attendance and plan accordingly.',
    icon: PieChart,
    path: '/utilities/attendance',
  },
  {
    title: 'Academic Repository',
    desc: 'Access official syllabus, calendars, and holiday lists.',
    icon: Folder,
    path: '/utilities/repository',
  },
  {
    title: 'Assignment Tracker',
    desc: 'Track deadlines and manage pending work.',
    icon: ClipboardList,
    path: '/utilities/assignments',
  },
];

const UtilitiesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredUtilities = UTILITIES_LIST.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="cs-page px-4 pt-5 pb-28 space-y-5 max-w-md mx-auto animate-in fade-in duration-300 font-sans">
      
      {/* 1. HEADER SECTION */}
      <header className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              Utilities
            </h1>
            <div className="w-5 h-5 text-[#0F766E] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0F766E] fill-[#0F766E]" />
            </div>
          </div>
          <p className="text-xs font-normal text-[#6B7280] mt-1">
            Academic tools at your fingertips
          </p>
        </div>

        {/* Top Right Search Button */}
        <button
          onClick={() => setIsSearching(!isSearching)}
          aria-label="Search utilities"
          className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center text-[#4B5563] hover:border-[#0F766E]/40 active:scale-95 transition-all"
        >
          {isSearching ? <X className="w-4.5 h-4.5" /> : <Search className="w-4.5 h-4.5 stroke-[2]" />}
        </button>
      </header>

      {/* Optional Search Bar Input */}
      {isSearching && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            placeholder="Search tools (GPA, Timetable, Attendance...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#0F766E]/30 rounded-[18px] px-4 py-2.5 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 shadow-sm"
            autoFocus
          />
        </div>
      )}

      {/* 2. TOP BANNER CARD (Your academic hub + 3D Vector Graphic) */}
      <div className="bg-gradient-to-r from-[#ECFDF5] via-[#F0FDF4] to-[#E6F4EA] border border-[#10B981]/25 rounded-[28px] p-5 shadow-sm flex items-center justify-between relative overflow-hidden">
        
        {/* Left Text Column */}
        <div className="z-10 max-w-[190px] space-y-1">
          <h2 className="text-sm font-bold text-[#064E3B] leading-tight">
            Your academic hub
          </h2>
          <p className="text-xs font-normal text-[#065F46] leading-relaxed">
            Everything you need to stay on track and excel.
          </p>
        </div>

        {/* Right 3D Academic Briefcase Graphic (Vector SVG) */}
        <div className="pointer-events-none w-[140px] h-[95px] shrink-0 -mr-2">
          <svg viewBox="0 0 160 110" fill="none" className="w-full h-full">
            {/* Soft Shadow Base */}
            <ellipse cx="85" cy="98" rx="60" ry="8" fill="#10B981" opacity="0.15" />
            
            {/* Plant Pot (Far Right) */}
            <path d="M125 72 L138 72 L135 94 L128 94 Z" fill="#78350F" />
            {/* Plant Leaves */}
            <path d="M131 72 Q125 55 118 62 Q126 68 131 72 Z" fill="#047857" />
            <path d="M132 72 Q136 50 144 58 Q138 65 132 72 Z" fill="#10B981" />
            <path d="M131 72 Q131 46 131 46 Q135 58 131 72 Z" fill="#059669" />

            {/* Back Card (Chart Popup) */}
            <rect x="38" y="22" width="60" height="45" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
            {/* Chart Line with Dots */}
            <path d="M46 54 L58 42 L72 48 L88 32" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="88" cy="32" r="3" fill="#10B981" />
            <circle cx="58" cy="42" r="2.5" fill="#10B981" />
            <circle cx="72" cy="48" r="2.5" fill="#10B981" />

            {/* Green Academic Briefcase (Center Body) */}
            <rect x="48" y="44" width="70" height="50" rx="12" fill="#0F766E" />
            {/* Briefcase Front Lip */}
            <path d="M48 52 C48 48, 118 48, 118 52 L118 64 C118 64, 83 72, 48 64 Z" fill="#115E59" />
            {/* Briefcase Handle */}
            <rect x="71" y="36" width="24" height="10" rx="4" fill="none" stroke="#0F766E" strokeWidth="3" />
            {/* Silver Latch */}
            <rect x="76" y="56" width="14" height="10" rx="3" fill="white" />
            <rect x="80" y="60" width="6" height="2" rx="1" fill="#9CA3AF" />
          </svg>
        </div>
      </div>

      {/* 3. UTILITIES LIST (5 Clean Cards) */}
      <div className="space-y-3.5">
        {filteredUtilities.map(({ title, desc, icon: Icon, path }) => (
          <div
            key={path}
            onClick={() => navigate(path)}
            className="bg-white border border-[#E5E7EB] rounded-[24px] p-4 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:border-[#0F766E]/40 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Soft Mint Icon Container */}
              <div className="w-14 h-14 rounded-[18px] bg-[#ECFDF5] text-[#0F766E] flex items-center justify-center shrink-0 border border-[#10B981]/15 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                <Icon className="w-6 h-6 stroke-[2]" />
              </div>

              {/* Title & Description */}
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#111827] leading-tight truncate group-hover:text-[#0F766E] transition-colors">
                  {title}
                </h3>
                <p className="text-xs font-normal text-[#6B7280] leading-snug mt-0.5">
                  {desc}
                </p>
              </div>
            </div>

            {/* Right Action Circular Arrow Button */}
            <div className="w-9 h-9 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] group-hover:text-[#0F766E] group-hover:border-[#0F766E]/40 group-hover:bg-[#ECFDF5] transition-all shrink-0">
              <ChevronRight className="w-4.5 h-4.5 stroke-[2] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}

        {filteredUtilities.length === 0 && (
          <div className="text-center py-10 bg-white border border-[#E5E7EB] rounded-[24px] p-6 space-y-2">
            <p className="text-sm font-bold text-[#111827]">No utilities found</p>
            <p className="text-xs text-[#6B7280]">Try searching for "GPA", "Timetable", or "Attendance"</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default UtilitiesPage;
