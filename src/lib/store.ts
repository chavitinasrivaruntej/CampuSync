import { supabase, isSupabaseConfigured } from './supabase';
import { useState, useEffect } from 'react';

function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`campusync_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(`campusync_${key}`, JSON.stringify(value));
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
      // Clear and re-insert to keep list in sync
      await supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (Array.isArray(value) && value.length > 0) {
        const toInsert = value.map(a => ({
          title: a.title,
          short_description: a.shortDescription,
          full_description: a.fullDescription,
          date: a.date,
          expiry_date: a.expiryDate,
          category: a.category,
          audience: a.audience,
          source: a.source,
          priority: a.priority,
          course: a.course,
          year: a.year,
          attachment_url: a.attachmentURL,
          attachment_type: a.attachmentType,
          is_pinned: a.isPinned
        }));
        await supabase.from('announcements').insert(toInsert);
      }
    } else if (key === 'timetable') {
      await supabase.from('timetable_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (Array.isArray(value) && value.length > 0) {
        const toInsert = value.map(t => ({
          day: t.day,
          time_slot: t.timeSlot,
          subject: t.subject,
          room: t.room || '',
          teacher: t.teacher || ''
        }));
        await supabase.from('timetable_entries').insert(toInsert);
      }
    } else if (key === 'assignments') {
      await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (Array.isArray(value) && value.length > 0) {
        const toInsert = value.map(a => ({
          title: a.title,
          subject: a.subject,
          due_date: a.dueDate,
          description: a.description || '',
          status: a.status || 'pending',
          max_marks: a.maxMarks || null,
          obtained_marks: a.obtainedMarks || null,
          submitted_at: a.submittedAt || null
        }));
        await supabase.from('assignments').insert(toInsert);
      }
    } else if (key === 'attendance') {
      await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (Array.isArray(value) && value.length > 0) {
        const toInsert = value.map(r => ({
          subject: r.subject,
          present: r.present,
          total: r.total
        }));
        await supabase.from('attendance_records').insert(toInsert);
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

      // 2. Announcements
      const { data: announcements } = await supabase.from('announcements').select('*');
      if (announcements && announcements.length > 0) {
        const mapped = announcements.map(a => ({
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
          isPinned: a.is_pinned,
        }));
        store.setSilently('announcements', mapped);
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
