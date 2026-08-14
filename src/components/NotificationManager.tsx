import React, { useEffect } from 'react';
import { eventBus } from '@/lib/eventBus';
import { playNotificationSound } from '@/lib/sounds';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { Megaphone, Calendar, ArrowRight } from 'lucide-react';

export function NotificationManager() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleNewAnnouncement = (payload: any) => {
      playNotificationSound();

      toast.custom((t) => (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-4 w-[350px] flex gap-4 animate-in slide-in-from-right-8 pointer-events-auto">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl h-fit shrink-0">
            <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">📢 New Announcement</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mb-2">
              {payload.title || 'Important update posted'}
            </p>
            <button
              onClick={() => {
                toast.dismiss(t);
                navigate('/announcements', { state: { highlightId: payload.id } });
              }}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
            >
              Tap to View <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ), { duration: 6000, id: `announcement-${payload.id}` });
    };

    const handleNewEvent = (payload: any) => {
      playNotificationSound();

      toast.custom((t) => (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-4 w-[350px] flex gap-4 animate-in slide-in-from-right-8 pointer-events-auto">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-xl h-fit shrink-0">
            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">🎉 New Event</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mb-2">
              {payload.title || 'Upcoming event scheduled'}
            </p>
            <button
              onClick={() => {
                toast.dismiss(t);
                navigate('/events', { state: { highlightId: payload.id } });
              }}
              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
            >
              Tap to View <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ), { duration: 6000, id: `event-${payload.id}` });
    };

    const unsubAnnouncements = eventBus.on('new_announcement', handleNewAnnouncement);
    const unsubEvents = eventBus.on('new_event', handleNewEvent);

    return () => {
      unsubAnnouncements();
      unsubEvents();
    };
  }, [navigate, location]);

  return null;
}
