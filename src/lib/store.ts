import { supabase, isSupabaseConfigured } from './supabase';
import { useState, useEffect } from 'react';
import { eventBus } from './eventBus';

function getStorageKey(key: string): string {
  // Global keys shared across all students
  const globalKeys = ['announcements', 'events', 'settings_theme', 'settings_notifications', 'settings_reminder'];
  if (globalKeys.includes(key)) {
    return `campusync_${key}`;
  }
  
  // Get active session user ID or roll number
  try {
    const saved = localStorage.getItem('campusync_auth_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      const userId = parsed?.user?.id || parsed?.user?.rollNumber?.toLowerCase()?.trim();
      if (userId) {
        return `campusync_user_${userId}_${key}`;
      }
    }
  } catch {}

  return `campusync_guest_${key}`;
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(getStorageKey(key));
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(getStorageKey(key), JSON.stringify(value));
}

const subscribers = new Map<string, Set<(val: any) => void>>();

// Helper to push updates to Supabase
async function pushToSupabase(key: string, value: any) {
  if (!isSupabaseConfigured) return;

  try {
    if (key === 'profile') {
      const profileId = '00000000-0000-0000-0000-000000000000';
      await supabase.from('profiles').upsert({
        id: profileId,
        name: value.name || 'Student',
        nickname: value.nickname || '',
        email: value.email || '',
        course: value.course || 'B.Tech',
        year: value.year || 1,
        semester: value.semester || 1,
        profile_picture: value.profilePicture || '',
        updated_at: new Date().toISOString()
      });
    } else if (key === 'announcements') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          const { error } = await supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) console.error('[Supabase Error] announcements delete:', error);
        } else {
          const toInsert = value.map(a => {
            const validPriority = ['general', 'important', 'urgent'].includes(a.priority) ? a.priority : 'general';
            const validId = (a.id && typeof a.id === 'string' && a.id.length === 36 && a.id.includes('-')) ? a.id : crypto.randomUUID();
            const validDate = (a.date && typeof a.date === 'string' && a.date.trim() !== '') ? a.date : new Date().toISOString().split('T')[0];
            const validExpiry = (a.expiryDate && typeof a.expiryDate === 'string' && a.expiryDate.trim() !== '') ? a.expiryDate : null;
            return {
              id: validId,
              title: a.title,
              short_description: a.shortDescription || a.short_description || a.title,
              full_description: a.fullDescription || a.full_description || a.shortDescription || a.title,
              date: validDate,
              expiry_date: validExpiry,
              category: a.category || 'General',
              audience: a.audience || 'All',
              source: a.source || 'Central Admin',
              priority: validPriority,
              course: a.course || 'All',
              year: a.year || 'All',
              attachment_url: a.attachmentsList && a.attachmentsList.length > 0 ? JSON.stringify(a.attachmentsList) : a.attachmentURL || '',
              attachment_type: a.attachmentType || 'file',
              is_pinned: !!a.isPinned
            };
          });
          const { error } = await supabase.from('announcements').upsert(toInsert, { onConflict: 'id' });
          if (error) {
            console.error('[Supabase Error] announcements upsert:', error);
          } else {
            console.log('[Supabase Success] announcements upserted count:', toInsert.length);
          }
        }
      }
    } else if (key === 'events') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          const { error } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) console.error('[Supabase Error] events delete:', error);
        } else {
          const toInsert = value.map(e => {
            const validId = (e.id && typeof e.id === 'string' && e.id.length === 36 && e.id.includes('-')) ? e.id : crypto.randomUUID();
            const validDate = (e.date && typeof e.date === 'string' && e.date.trim() !== '') ? e.date : new Date().toISOString().split('T')[0];
            return {
              id: validId,
              title: e.title,
              date: validDate,
              venue: e.venue || 'Campus Auditorium',
              category: e.category || 'Event',
              description: e.description || e.title,
              links: e.attachmentsList && e.attachmentsList.length > 0 ? e.attachmentsList : e.links || []
            };
          });
          const { error } = await supabase.from('events').upsert(toInsert, { onConflict: 'id' });
          if (error) {
            console.error('[Supabase Error] events upsert:', error);
          } else {
            console.log('[Supabase Success] events upserted count:', toInsert.length);
          }
        }
      }
    } else if (key === 'timetable') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          await supabase.from('timetable_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          const toInsert = value.map(t => {
            const validId = (t.id && typeof t.id === 'string' && t.id.length === 36 && t.id.includes('-')) ? t.id : crypto.randomUUID();
            return {
              id: validId,
              day: t.day,
              time_slot: t.timeSlot,
              subject: t.subject,
              room: t.room || '',
              teacher: t.teacher || ''
            };
          });
          await supabase.from('timetable_entries').upsert(toInsert, { onConflict: 'id' });
        }
      }
    } else if (key === 'assignments') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          const toInsert = value.map(a => {
            const validId = (a.id && typeof a.id === 'string' && a.id.length === 36 && a.id.includes('-')) ? a.id : crypto.randomUUID();
            const validStatus = ['pending', 'submitted', 'graded'].includes(a.status) ? a.status : 'pending';
            return {
              id: validId,
              title: a.title,
              subject: a.subject || 'General',
              due_date: a.dueDate || new Date().toISOString(),
              description: a.description || '',
              status: validStatus,
              max_marks: a.maxMarks || null,
              obtained_marks: a.obtainedMarks || null,
              submitted_at: a.submittedAt || null
            };
          });
          await supabase.from('assignments').upsert(toInsert, { onConflict: 'id' });
        }
      }
    } else if (key === 'attendance') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          const toInsert = value.map(r => {
            const validId = (r.id && typeof r.id === 'string' && r.id.length === 36 && r.id.includes('-')) ? r.id : crypto.randomUUID();
            return {
              id: validId,
              subject: r.subject,
              present: r.present || 0,
              total: r.total || 0
            };
          });
          await supabase.from('attendance_records').upsert(toInsert, { onConflict: 'id' });
        }
      }
    }
  } catch (error) {
    console.error(`Error pushing key "${key}" to Supabase:`, error);
  }
}

export const store = {
  get: getItem,
  
  set: (key: string, value: any): void => {
    setItem(key, value);
    subscribers.get(key)?.forEach(cb => cb(value));
    pushToSupabase(key, value).catch(console.error);
  },

  setSilently: (key: string, value: any): void => {
    setItem(key, value);
    subscribers.get(key)?.forEach(cb => cb(value));
  },

  subscribe: (key: string, callback: (val: any) => void) => {
    if (!subscribers.has(key)) {
      subscribers.set(key, new Set());
    }
    subscribers.get(key)!.add(callback);
    return () => {
      subscribers.get(key)?.delete(callback);
    };
  },

  subscribeToRealtime: () => {
    if (!isSupabaseConfigured) return;
    try {
      const channel = supabase
        .channel('campusync-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            eventBus.emit('new_announcement', payload.new);
          }
          store.pullFromSupabase().catch(console.error);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            eventBus.emit('new_event', payload.new);
          }
          store.pullFromSupabase().catch(console.error);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
          store.pullFromSupabase().catch(console.error);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_entries' }, () => {
          store.pullFromSupabase().catch(console.error);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
          store.pullFromSupabase().catch(console.error);
          eventBus.emit('attendance_updated');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_usage_logs' }, () => {
          eventBus.emit('telemetry_updated');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_interactions' }, () => {
          eventBus.emit('telemetry_updated');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_interactions' }, () => {
          eventBus.emit('telemetry_updated');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_login_logs' }, () => {
          eventBus.emit('telemetry_updated');
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[CampuSync] Supabase Realtime connected.');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.warn('[CampuSync] Supabase Realtime disconnected. Will retry on next change.');
          }
        });
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Supabase Realtime subscription error:', err);
    }
  },

  pullFromSupabase: async (): Promise<void> => {
    if (!isSupabaseConfigured) return;
    try {
      // 1. Profile
      const { data: profile } = await supabase.from('profiles').select('*').limit(1);
      if (profile && profile.length > 0) {
        const p = profile[0];
        store.setSilently('profile', {
          name: p.name,
          nickname: p.nickname,
          email: p.email,
          course: p.course,
          year: p.year,
          semester: p.semester,
          profilePicture: p.profile_picture
        });
      }

      // 2. Announcements — always update store (even empty, to reflect deletes)
      const { data: announcements } = await supabase.from('announcements').select('*');
      if (announcements && Array.isArray(announcements)) {
        const mapped = announcements.map(a => {
          let attachmentsList: any[] = [];
          if (a.attachment_url && a.attachment_url.trim().startsWith('[')) {
            try {
              attachmentsList = JSON.parse(a.attachment_url);
            } catch {}
          }
          return {
            id: a.id,
            title: a.title,
            shortDescription: a.short_description,
            fullDescription: a.full_description,
            date: a.date,
            expiryDate: a.expiry_date,
            category: a.category,
            audience: a.audience,
            source: a.source,
            priority: a.priority,
            course: a.course,
            year: a.year,
            attachmentURL: a.attachment_url,
            attachmentType: a.attachment_type,
            attachmentsList: attachmentsList.length > 0 ? attachmentsList : undefined,
            isPinned: a.is_pinned,
          };
        });
        store.setSilently('announcements', mapped);
      }

      // 2b. Events — always update store (even empty, to reflect deletes)
      const { data: events } = await supabase.from('events').select('*');
      if (events && Array.isArray(events)) {
        const mapped = events.map(e => {
          const linksList = Array.isArray(e.links) ? e.links : [];
          const attachmentsList = linksList.filter((l: any) => l && l.url && l.name);
          return {
            id: e.id,
            title: e.title,
            date: e.date,
            venue: e.venue,
            category: e.category,
            description: e.description,
            image: e.image,
            links: linksList,
            attachmentsList: attachmentsList.length > 0 ? attachmentsList : undefined
          };
        });
        store.setSilently('events', mapped);
      }

      // 3. Timetable
      const { data: timetable } = await supabase.from('timetable_entries').select('*');
      if (timetable && timetable.length > 0) {
        const mapped = timetable.map(t => ({
          day: t.day,
          timeSlot: t.time_slot,
          subject: t.subject,
          room: t.room,
          teacher: t.teacher
        }));
        store.setSilently('timetable', mapped);
      }

      // 4. Assignments
      const { data: assignments } = await supabase.from('assignments').select('*');
      if (assignments && assignments.length > 0) {
        const mapped = assignments.map(a => ({
          id: a.id,
          title: a.title,
          subject: a.subject,
          dueDate: a.due_date,
          description: a.description,
          status: a.status,
          maxMarks: a.max_marks,
          obtainedMarks: a.obtained_marks,
          submittedAt: a.submitted_at
        }));
        store.setSilently('assignments', mapped);
      }

      // 5. Attendance
      const { data: attendance } = await supabase.from('attendance_records').select('*');
      if (attendance && attendance.length > 0) {
        const mapped = attendance.map(r => ({
          subject: r.subject,
          present: r.present,
          total: r.total
        }));
        store.setSilently('attendance', mapped);
      }
    } catch (err) {
      console.error('Error pulling from Supabase:', err);
    }
  }
};

export function useStore<T>(key: string, fallback: T): [T, (val: T) => void] {
  const [state, setState] = useState<T>(() => store.get(key, fallback));

  useEffect(() => {
    return store.subscribe(key, (newVal) => {
      setState(newVal);
    });
  }, [key]);

  const setValue = (newVal: T) => {
    store.set(key, newVal);
  };

  return [state, setValue];
}
