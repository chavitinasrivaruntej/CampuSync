import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  Bell, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  Megaphone, 
  CalendarDays, 
  MapPin, 
  Clock, 
  Pin,
  Calculator,
  BarChart3,
  Sparkles,
  Target,
  ArrowRight,
  GraduationCap,
  User
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { type AttendanceRecord, type Assignment, DEFAULT_ATTENDANCE_RECORDS, DEFAULT_ASSIGNMENTS } from '@/types';

// Helper function for dynamic greeting
function getGreetingHeader() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, 👋';
  if (h < 17) return 'Good afternoon, 👋';
  return 'Good evening, 👋';
}

const HomePage = () => {
  const navigate = useNavigate();

  // 1. Profile — synced from store with fallback
  const [profile] = useStore<any>('profile', {
    name: 'Student',
    rollNumber: '21B01A0501',
    course: 'B.Tech',
    className: 'CSE',
    year: 2,
    semester: 4,
  });
  const displayName = profile.nickname || profile.name || 'Student';
  const courseBranch = profile.course || profile.branch || 'B.Tech CSE';
  const semNum = profile.semester || 4;

  // 2. CGPA — store calculation from cgpa_semesters & semester_records with live sync
  const [cgpaSemesters] = useStore<any[]>('cgpa_semesters', []);
  const [semesterRecords] = useStore<any[]>('semester_records', []);
  
  const cgpaStats = useMemo(() => {
    let totalCredits = 0;
    let totalWeighted = 0;

    // Check CGPA semester inputs
    if (cgpaSemesters && cgpaSemesters.length > 0) {
      cgpaSemesters.forEach((s: any) => {
        if (s && !isNaN(parseFloat(s.sgpa)) && !isNaN(parseFloat(s.credits)) && parseFloat(s.credits) > 0) {
          totalCredits += parseFloat(s.credits);
          totalWeighted += parseFloat(s.sgpa) * parseFloat(s.credits);
        }
      });
    }

    // Check SGPA semester records
    if (semesterRecords && semesterRecords.length > 0) {
      semesterRecords.forEach((r: any) => {
        if (r && r.sgpa > 0 && r.subjects && r.subjects.length > 0) {
          const semCredits = r.subjects.reduce((sum: number, sub: any) => sum + (sub.credits || 0), 0);
          if (semCredits > 0) {
            totalCredits += semCredits;
            totalWeighted += r.sgpa * semCredits;
          }
        }
      });
    }

    const cgpa = totalCredits > 0 ? +(totalWeighted / totalCredits).toFixed(2) : 8.74;
    
    let status = 'Excellent';
    let color = 'text-[#16A34A]';
    let strokeColor = '#16A34A';
    
    if (cgpa >= 9.0) {
      status = 'Outstanding';
      color = 'text-[#2563EB]';
      strokeColor = '#2563EB';
    } else if (cgpa >= 8.0) {
      status = 'Excellent';
      color = 'text-[#16A34A]';
      strokeColor = '#16A34A';
    } else if (cgpa >= 7.0) {
      status = 'Good Standing';
      color = 'text-[#0F766E]';
      strokeColor = '#0F766E';
    } else if (cgpa >= 6.0) {
      status = 'Average';
      color = 'text-[#D97706]';
      strokeColor = '#D97706';
    } else {
      status = 'Needs Work';
      color = 'text-[#DC2626]';
      strokeColor = '#DC2626';
    }

    return { cgpa, status, color, strokeColor };
  }, [cgpaSemesters, semesterRecords]);

  // 3. Attendance — dynamic calculation linked to Attendance Calculator with live sync
  const [attendanceRecords] = useStore<AttendanceRecord[]>('attendance', DEFAULT_ATTENDANCE_RECORDS);
  const attendanceStats = useMemo(() => {
    const recs = attendanceRecords && attendanceRecords.length > 0 ? attendanceRecords : DEFAULT_ATTENDANCE_RECORDS;
    let attended = 0;
    let total = 0;
    recs.forEach((r) => {
      attended += (r.attendedClasses !== undefined ? r.attendedClasses : (r as any).present) || 0;
      total += (r.totalClasses !== undefined ? r.totalClasses : (r as any).total) || 0;
    });
    const pct = total > 0 ? Math.round((attended / total) * 100) : 84;
    
    let label = 'Safe Zone';
    let status = 'Safe';
    let color = 'text-[#16A34A]';
    let strokeColor = '#16A34A';
    if (pct < 50) {
      label = 'Critical Zone';
      status = 'Critical';
      color = 'text-[#DC2626]';
      strokeColor = '#DC2626';
    } else if (pct < 65) {
      label = 'Risky Zone';
      status = 'Risky';
      color = 'text-[#EA580C]';
      strokeColor = '#EA580C';
    } else if (pct < 75) {
      label = 'Improving';
      status = 'Improving';
      color = 'text-[#D97706]';
      strokeColor = '#D97706';
    }
    
    return { pct, attended, total, label, status, color, strokeColor };
  }, [attendanceRecords]);

  // 4. Assignments — store calculation with live sync
  const [assignments] = useStore<Assignment[]>('assignments', DEFAULT_ASSIGNMENTS);
  const assignmentStats = useMemo(() => {
    const recs = assignments && assignments.length > 0 ? assignments : DEFAULT_ASSIGNMENTS;
    const pending = recs.filter((a) => !a.completed && a.status !== 'submitted');
    const pendingCount = pending.length;
    
    let status = 'All Completed';
    let color = 'text-[#16A34A]';
    let strokeColor = '#16A34A';
    
    if (pendingCount === 1) {
      status = '1 Due Soon';
      color = 'text-[#F59E0B]';
      strokeColor = '#F59E0B';
    } else if (pendingCount > 1) {
      status = `${pendingCount} Pending`;
      color = 'text-[#EA580C]';
      strokeColor = '#EA580C';
    }

    return { pendingCount, status, color, strokeColor };
  }, [assignments]);

  // 5. Announcements — store calculation
  const [announcements] = useStore<any[]>('announcements', []);

  // 6. Events — store calculation
  const [events] = useStore<any[]>('events', []);

  return (
    <div className="cs-page px-4 pt-5 pb-28 space-y-6 max-w-md mx-auto animate-in fade-in duration-300 font-sans">
      
      {/* 1. HEADER SECTION WITH CAMPUS BUILDING ILLUSTRATION */}
      <header className="relative pt-1 pb-2">
        {/* Top Control Bar: Left Bell, Center Trademark, Right Profile Vector Avatar */}
        <div className="flex items-center justify-between w-full mb-3">
          {/* Notification Bell (Left) */}
          <button
            onClick={() => navigate('/announcements')}
            aria-label="Notifications"
            className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center relative shadow-sm hover:border-[#0F766E]/40 active:scale-95 transition-all shrink-0"
          >
            <Bell className="w-4.5 h-4.5 text-[#111827] stroke-[1.8]" />
            <span className="w-2 h-2 rounded-full bg-[#0F766E] absolute top-2 right-2 ring-2 ring-white" />
          </button>

          {/* Trademark Brand Text (Center) - Montserrat Font */}
          <div className="text-center select-none pointer-events-none px-1 flex items-start justify-center">
            <span 
              className="text-[12px] md:text-[14px] font-bold text-[#6B7280]/70 leading-none uppercase tracking-widest"
              style={{ fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif" }}
            >
              CampuSync
            </span>
            <span 
              className="text-[7px] font-light text-[#6B7280]/60 ml-0.5 -mt-0.5 tracking-wider uppercase inline-block"
              style={{ fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 300 }}
            >
              TM
            </span>
          </div>

          {/* Profile Avatar (Right) - Clean vector logo, no blue dot */}
          <button
            onClick={() => navigate('/profile')}
            aria-label="Profile"
            className="w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#0F766E]/25 relative shadow-sm overflow-hidden flex items-center justify-center text-[#0F766E] hover:border-[#0F766E]/50 active:scale-95 transition-all shrink-0"
          >
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#ECFDF5] flex items-center justify-center text-[#0F766E]">
                <User className="w-5 h-5 stroke-[2]" />
              </div>
            )}
          </button>
        </div>

        {/* Parallel Content Row: Text Block aligned parallel to Campus Logo */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Text Block Parallel to Logo */}
          <div className="space-y-1 z-10 flex-1 min-w-0">
            <p className="text-base font-medium text-[#6B7280] leading-tight">
              {getGreetingHeader()}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight truncate">
              {displayName}
            </h1>
            <p className="text-sm font-normal text-[#6B7280] leading-snug">
              {courseBranch} • Semester {semNum} • Week 11
            </p>
          </div>

          {/* Right Campus Building SVG Logo */}
          <div className="pointer-events-none w-[150px] h-[95px] shrink-0">
            <svg viewBox="0 0 200 120" fill="none" className="w-full h-full">
              {/* Birds */}
              <path d="M40 30 Q45 25 50 30 Q55 25 60 30" stroke="#9CA3AF" strokeWidth="1" fill="none" />
              <path d="M70 20 Q74 16 78 20 Q82 16 86 20" stroke="#9CA3AF" strokeWidth="1" fill="none" />
              {/* Background Hills */}
              <ellipse cx="140" cy="115" rx="70" ry="35" fill="#E5E7EB" opacity="0.5" />
              <ellipse cx="60" cy="115" rx="60" ry="25" fill="#D1D5DB" opacity="0.3" />
              {/* Building Base */}
              <rect x="70" y="55" width="80" height="50" fill="#F3F4F6" rx="2" />
              <rect x="50" y="70" width="120" height="35" fill="#E5E7EB" rx="3" />
              {/* Clock Tower */}
              <rect x="98" y="30" width="24" height="40" fill="#E5E7EB" />
              <polygon points="98,30 110,12 122,30" fill="#9CA3AF" />
              {/* Clock Face */}
              <circle cx="110" cy="42" r="6" fill="white" stroke="#6B7280" strokeWidth="1" />
              <line x1="110" y1="42" x2="110" y2="39" stroke="#111827" strokeWidth="1" />
              <line x1="110" y1="42" x2="113" y2="42" stroke="#111827" strokeWidth="1" />
              {/* Windows */}
              <rect x="80" y="76" width="8" height="12" fill="#9CA3AF" rx="1" />
              <rect x="95" y="76" width="8" height="12" fill="#9CA3AF" rx="1" />
              <rect x="117" y="76" width="8" height="12" fill="#9CA3AF" rx="1" />
              <rect x="132" y="76" width="8" height="12" fill="#9CA3AF" rx="1" />
              {/* Entrance Door */}
              <path d="M104 105 V92 A6 6 0 0 1 116 92 V105 Z" fill="#4B5563" />
              {/* Trees */}
              <circle cx="45" cy="85" r="14" fill="#0F766E" opacity="0.8" />
              <rect x="43" y="85" width="4" height="20" fill="#78350F" />
              <circle cx="175" cy="80" r="16" fill="#059669" opacity="0.85" />
              <rect x="173" y="80" width="4" height="25" fill="#78350F" />
            </svg>
          </div>
        </div>
      </header>

      {/* 2. QUICK ACTIONS BAR (4 Colored Cards) */}
      <section className="bg-white border border-[#E5E7EB] rounded-[28px] p-3.5 shadow-sm grid grid-cols-4 gap-2">
        {/* GPA */}
        <button
          onClick={() => navigate('/utilities/cgpa')}
          className="flex flex-col items-center justify-center text-center p-2 rounded-[20px] hover:bg-[#FAFAF8] active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 rounded-[18px] bg-[#ECFDF5] text-[#0F766E] flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <Calculator className="w-5 h-5 stroke-[1.8] text-[#0F766E]" />
          </div>
          <span className="text-[11px] font-bold text-[#111827] leading-tight">GPA</span>
          <span className="text-[9px] font-normal text-[#6B7280] mt-0.5">Calculator</span>
        </button>

        {/* Timetable */}
        <button
          onClick={() => navigate('/utilities/timetable')}
          className="flex flex-col items-center justify-center text-center p-2 rounded-[20px] hover:bg-[#FAFAF8] active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 rounded-[18px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <Clock className="w-5 h-5 stroke-[1.8] text-[#2563EB]" />
          </div>
          <span className="text-[11px] font-bold text-[#111827] leading-tight">Timetable</span>
          <span className="text-[9px] font-normal text-[#6B7280] mt-0.5">My Schedule</span>
        </button>

        {/* Attendance */}
        <button
          onClick={() => navigate('/attendance')}
          className="flex flex-col items-center justify-center text-center p-2 rounded-[20px] hover:bg-[#FAFAF8] active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 rounded-[18px] bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <BarChart3 className="w-5 h-5 stroke-[1.8] text-[#D97706]" />
          </div>
          <span className="text-[11px] font-bold text-[#111827] leading-tight">Attendance</span>
          <span className={`text-[9px] font-semibold ${attendanceStats.color} mt-0.5`}>
            {attendanceStats.pct}% • {attendanceStats.status}
          </span>
        </button>

        {/* Assignments */}
        <button
          onClick={() => navigate('/utilities/assignments')}
          className="flex flex-col items-center justify-center text-center p-2 rounded-[20px] hover:bg-[#FAFAF8] active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 rounded-[18px] bg-[#FEE2E2] text-[#E11D48] flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <FileText className="w-5 h-5 stroke-[1.8] text-[#E11D48]" />
          </div>
          <span className="text-[11px] font-bold text-[#111827] leading-tight">Assignments</span>
          <span className="text-[9px] font-normal text-[#6B7280] mt-0.5">{pendingAssignmentsCount} Pending</span>
        </button>
      </section>

      {/* 3. TODAY AT A GLANCE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#111827]">
            Today at a glance
          </h3>
          <button 
            onClick={() => navigate('/utilities/timetable')}
            className="text-xs font-normal text-[#0F766E] hover:underline flex items-center gap-0.5 transition-colors"
          >
            View full schedule <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Class & Next Class Cards */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Current Class */}
          <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="bg-[#0F766E] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  LIVE
                </span>
                <span className="text-xs font-normal text-[#6B7280]">Current Class</span>
              </div>
              <h4 className="text-sm font-bold text-[#111827] leading-tight mb-2">
                Operating Systems
              </h4>
              <div className="space-y-1 text-xs font-normal text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>Room A204</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>09:30 AM – 10:20 AM</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#E5E7EB]/60">
              <div className="flex items-center justify-between text-[10px] font-normal text-[#6B7280]">
                <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden mr-2">
                  <div className="h-full bg-[#0F766E] rounded-full w-[65%]" />
                </div>
                <span className="shrink-0 font-semibold text-[#0F766E]">50 mins left</span>
              </div>
            </div>
          </div>

          {/* Next Class */}
          <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-xs font-normal text-[#6B7280] block mb-2">
                Next Class
              </span>
              <h4 className="text-sm font-bold text-[#111827] leading-tight mb-2">
                DBMS Lab
              </h4>
              <div className="space-y-1 text-xs font-normal text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>10:30 AM – 12:20 PM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>Lab 3 • Second Floor</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[10px] font-normal text-[#6B7280]">
              Starts in 10 mins
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Block Cards */}
        <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-3 shadow-sm grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-[12px] bg-[#ECFDF5] text-[#0F766E] flex items-center justify-center mb-1">
              <BookOpen className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-sm font-semibold text-[#111827]">4</span>
            <span className="text-[9px] text-[#6B7280] font-normal leading-tight">Classes<br />Today</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-[12px] bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-1">
              <FileText className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-sm font-semibold text-[#111827]">{assignmentStats.pendingCount}</span>
            <span className="text-[9px] text-[#6B7280] font-normal leading-tight">Assignments<br />Pending</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-[12px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-1">
              <Megaphone className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-sm font-semibold text-[#111827]">1</span>
            <span className="text-[9px] text-[#6B7280] font-normal leading-tight">New<br />Announcement</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-[12px] bg-[#FEE2E2] text-[#E11D48] flex items-center justify-center mb-1">
              <CalendarDays className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-sm font-semibold text-[#111827]">1</span>
            <span className="text-[9px] text-[#6B7280] font-normal leading-tight">Event<br />Tomorrow</span>
          </div>
        </div>
      </section>

      {/* 4. ACADEMIC HEALTH (4 Metric Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#111827]">
            Academic Health
          </h3>
          <button 
            onClick={() => navigate('/utilities/cgpa')}
            className="text-xs font-normal text-[#0F766E] hover:underline flex items-center gap-0.5 transition-colors"
          >
            Detailed insights <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Attendance */}
          <div 
            onClick={() => navigate('/attendance')}
            className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm flex flex-col justify-between min-h-[115px] relative overflow-hidden cursor-pointer hover:border-[#0F766E]/40 transition-all active:scale-[0.98] group"
          >
            <div>
              <span className="text-xs font-normal text-[#6B7280] block">Attendance</span>
              <span className="text-2xl font-semibold text-[#111827] block mt-0.5">{attendanceStats.pct}%</span>
              <span className={`text-xs font-semibold ${attendanceStats.color} block mt-0.5`}>
                {attendanceStats.label}
              </span>
            </div>
            <div className="w-full h-6 mt-2">
              <svg className="w-full h-full" style={{ color: attendanceStats.strokeColor }} viewBox="0 0 100 30" fill="none">
                <path d="M0 25 Q20 20, 40 22 T80 10 T100 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* CGPA */}
          <div 
            onClick={() => navigate('/utilities/cgpa/calculator')}
            className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm flex flex-col justify-between min-h-[115px] relative overflow-hidden cursor-pointer hover:border-[#2563EB]/40 transition-all active:scale-[0.98] group"
          >
            <div>
              <span className="text-xs font-normal text-[#6B7280] block">CGPA</span>
              <span className="text-2xl font-semibold text-[#111827] block mt-0.5">{cgpaStats.cgpa.toFixed(2)}</span>
              <span className={`text-xs font-semibold ${cgpaStats.color} block mt-0.5`}>{cgpaStats.status}</span>
            </div>
            <div className="w-full h-6 mt-2">
              <svg className="w-full h-full" style={{ color: cgpaStats.strokeColor }} viewBox="0 0 100 30" fill="none">
                <path d="M0 22 Q25 24, 50 15 T80 12 T100 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Assignments */}
          <div 
            onClick={() => navigate('/assignments')}
            className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm flex flex-col justify-between min-h-[115px] relative overflow-hidden cursor-pointer hover:border-[#F59E0B]/40 transition-all active:scale-[0.98] group"
          >
            <div>
              <span className="text-xs font-normal text-[#6B7280] block">Assignments</span>
              <span className="text-2xl font-semibold text-[#111827] block mt-0.5">{assignmentStats.pendingCount}</span>
              <span className={`text-xs font-semibold ${assignmentStats.color} block mt-0.5`}>{assignmentStats.status}</span>
            </div>
            <div className="w-full h-6 mt-2">
              <svg className="w-full h-full" style={{ color: assignmentStats.strokeColor }} viewBox="0 0 100 30" fill="none">
                <path d="M0 15 Q30 25, 60 18 T100 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Semester Progress */}
          <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm flex flex-col justify-between min-h-[115px] relative overflow-hidden">
            <div>
              <span className="text-xs font-normal text-[#6B7280] block">Semester Progress</span>
              <span className="text-2xl font-semibold text-[#111827] block mt-0.5">68%</span>
              <span className="text-xs font-semibold text-[#0F766E] block mt-0.5">On Track</span>
            </div>
            <div className="w-full h-6 mt-2">
              <svg className="w-full h-full text-[#0F766E]" viewBox="0 0 100 30" fill="none">
                <path d="M0 24 Q30 20, 60 15 T100 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LATEST ANNOUNCEMENTS (Top 2 latest announcements in full width) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#111827]">
            Latest Announcements
          </h3>
          <button 
            onClick={() => navigate('/announcements')}
            className="text-xs font-normal text-[#0F766E] hover:underline transition-colors"
          >
            View all
          </button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-2 divide-y divide-[#E5E7EB] shadow-sm">
          {/* Announcement 1 */}
          <div 
            onClick={() => navigate('/announcements')}
            className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAFAF8] rounded-[20px] transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[14px] bg-[#ECFDF5] text-[#0F766E] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-sm font-bold text-[#111827] truncate group-hover:text-[#0F766E] transition-colors">
                  Mid Examination Schedule
                </h4>
                <p className="text-[11px] font-normal text-[#6B7280] truncate">
                  Computer Science Department • 2 hours ago • 📌 Pinned
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-[#ECFDF5] text-[#0F766E] border border-[#0F766E]/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                New
              </span>
              <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Announcement 2 */}
          <div 
            onClick={() => navigate('/announcements')}
            className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAFAF8] rounded-[20px] transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[14px] bg-[#ECFDF5] text-[#0F766E] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-sm font-bold text-[#111827] truncate group-hover:text-[#0F766E] transition-colors">
                  Holiday on Sept 15
                </h4>
                <p className="text-[11px] font-normal text-[#6B7280] truncate">
                  Department of Academic Affairs • 1 day ago
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </section>

      {/* 6. UPCOMING EVENTS (Full width) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#111827]">
            Upcoming Events
          </h3>
          <button 
            onClick={() => navigate('/events')}
            className="text-xs font-normal text-[#0F766E] hover:underline transition-colors"
          >
            View all
          </button>
        </div>

        <div 
          onClick={() => navigate('/events')}
          className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:border-[#0F766E]/30 transition-all group"
        >
          <div className="w-24 h-24 rounded-[20px] bg-[#064E3B] text-white flex flex-col items-center justify-center text-center p-2 border border-[#0F766E]/30 shrink-0 shadow-inner">
            <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">TECHNOVA</span>
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">HACKATHON</span>
            <span className="text-[10px] font-bold text-emerald-300 mt-0.5">2024</span>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#111827] truncate group-hover:text-[#0F766E] transition-colors">
                TechNova Hackathon 2024
              </h4>
              <div className="space-y-1 mt-1 text-xs font-normal text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>18 Sep 2024</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                  <span className="truncate">Seminar Hall, Block A</span>
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/events');
                }}
                className="w-full bg-[#0F766E] text-white hover:bg-[#115E59] py-1.5 rounded-[14px] text-xs font-semibold transition-colors shadow-sm"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TODAY'S TIMELINE (Full width) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#111827]">
            Today's Timeline
          </h3>
          <button 
            onClick={() => navigate('/utilities/timetable')}
            className="text-xs font-normal text-[#0F766E] hover:underline transition-colors"
          >
            View all
          </button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="font-medium text-[#6B7280] w-16">09:30 AM</span>
              <span className="font-bold text-[#111827]">Operating Systems</span>
            </div>
            <span className="bg-[#ECFDF5] text-[#0F766E] text-[10px] font-semibold px-2.5 py-0.5 rounded-md">
              A204
            </span>
          </div>

          <div className="h-px bg-[#E5E7EB]/60 ml-5" />

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="font-medium text-[#6B7280] w-16">10:30 AM</span>
              <span className="font-bold text-[#111827]">DBMS Lab</span>
            </div>
            <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-semibold px-2.5 py-0.5 rounded-md">
              Lab 3
            </span>
          </div>

          <div className="h-px bg-[#E5E7EB]/60 ml-5" />

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="font-medium text-[#6B7280] w-16">01:00 PM</span>
              <span className="font-bold text-[#111827]">Machine Learning</span>
            </div>
            <span className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-semibold px-2.5 py-0.5 rounded-md">
              A301
            </span>
          </div>

          <div className="h-px bg-[#E5E7EB]/60 ml-5" />

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span className="font-medium text-[#6B7280] w-16">05:00 PM</span>
              <span className="font-bold text-[#111827]">Hackathon Registration</span>
            </div>
            <span className="bg-[#FEE2E2] text-[#EF4444] text-[10px] font-semibold px-2.5 py-0.5 rounded-md">
              Important
            </span>
          </div>
        </div>
      </section>

      {/* 8. YOUR ASSIGNMENTS (Full width stacked items) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#111827]">
            Your Assignments
          </h3>
          <button 
            onClick={() => navigate('/utilities/assignments')}
            className="text-xs font-normal text-[#0F766E] hover:underline transition-colors"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {/* Assignment 1 */}
          <div 
            onClick={() => navigate('/utilities/assignments')}
            className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm cursor-pointer hover:border-[#0F766E]/30 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#111827] truncate group-hover:text-[#0F766E] transition-colors">
                  Operating Systems
                </h4>
                <span className="text-[10px] font-semibold text-[#E11D48] bg-[#FEE2E2] px-2 py-0.5 rounded-full shrink-0">
                  Due Tomorrow
                </span>
              </div>
              <p className="text-xs font-normal text-[#6B7280]">
                Process Scheduling Report
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:translate-x-0.5 transition-transform shrink-0 ml-3" />
          </div>

          {/* Assignment 2 */}
          <div 
            onClick={() => navigate('/utilities/assignments')}
            className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-sm cursor-pointer hover:border-[#0F766E]/30 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#111827] truncate group-hover:text-[#0F766E] transition-colors">
                  Machine Learning
                </h4>
                <span className="text-[10px] font-semibold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full shrink-0">
                  Due in 3 Days
                </span>
              </div>
              <p className="text-xs font-normal text-[#6B7280]">
                Neural Network Architecture
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:translate-x-0.5 transition-transform shrink-0 ml-3" />
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
