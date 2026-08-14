import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, Wrench, Megaphone, CalendarDays, User } from 'lucide-react';
import PageTransition from './PageTransition';
import { authStore } from '@/lib/auth-store';
import { store } from '@/lib/store';

// Increment this to force a one-time data wipe for all users on next app load
const DATA_VERSION_KEY = 'campusync_data_version';
const CURRENT_DATA_VERSION = '2';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/utilities', label: 'Utilities', icon: Wrench },
  { path: '/announcements', label: 'Announcements', icon: Megaphone },
  { path: '/events', label: 'Events', icon: CalendarDays },
  { path: '/profile', label: 'Profile', icon: User },
];

const MobileLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = authStore.getCurrentUser();

  useEffect(() => {
    if (!currentUser) return;
    const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
    if (storedVersion !== CURRENT_DATA_VERSION) {
      store.set('cgpa_semesters', []);
      store.set('semester_records', []);
      store.set('attendance', []);
      store.set('assignments', []);
      store.set('savedEvents', []);
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="cs-mobile-container bg-[#FAF7F2]">
      <div className="min-h-screen pb-24">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>

      {/* Bottom Navigation matching reference UI */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-[#E5E7EB] z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-5 items-center py-2 px-1 relative">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);

            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-1 focus:outline-none relative transition-all group ${
                  active ? 'text-[#0F766E]' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {/* Active Top Bar Indicator */}
                {active && (
                  <span className="w-7 h-[3px] bg-[#0F766E] rounded-full absolute -top-[9px] left-1/2 -translate-x-1/2 animate-in fade-in zoom-in duration-200" />
                )}

                {/* Tab Icon */}
                <Icon className={`w-5 h-5 transition-transform group-active:scale-95 ${
                  active ? 'stroke-[2.2] text-[#0F766E]' : 'stroke-[1.6] text-[#6B7280]'
                }`} />

                {/* Tab Label */}
                <span className={`text-[10px] leading-none transition-colors ${
                  active ? 'font-bold text-[#0F766E]' : 'font-normal text-[#6B7280]'
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Safe area bottom */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white" />
      </nav>
    </div>
  );
};

export default MobileLayout;
