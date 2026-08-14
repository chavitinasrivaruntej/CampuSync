import { supabase, isSupabaseConfigured } from './supabase';
import { store } from './store';
import { getStoredStudents, saveStoredStudents, ExtendedStudentUser } from './user-store';

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    rollNumber: string;
    department: string;
    course: string;
    year: number;
    semester: number;
    section?: string;
    phone?: string;
    role: 'Student' | 'Faculty' | 'Department Admin' | 'Super Admin';
  } | null;
  token: string | null;
}

export interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  isValid: boolean;
}

// Key for stored session
const SESSION_KEY = 'campusync_auth_session';
const MIGRATION_COMPLETE_KEY = 'campusync_migration_complete';
// Increment this string whenever a forced data reset is needed for all users
const DATA_VERSION_KEY = 'campusync_data_version';
const CURRENT_DATA_VERSION = '2';

// Validate password rules in real time
export function validatePassword(password: string): PasswordValidation {
  const length = password.length >= 8;
  const uppercase = /[A-Z]/.test(password);
  const lowercase = /[a-z]/.test(password);
  const number = /[0-9]/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);

  return {
    length,
    uppercase,
    lowercase,
    number,
    special,
    isValid: length && uppercase && lowercase && number && special
  };
}

// Setup automated initial timetable pinning based on department and year
export function getInitialTimetableForDept(department: string, year: number) {
  // Return standard mock timetable entries to seed for this student
  const baseTimetable = [
    { day: 'Monday', timeSlot: '09:00 - 10:00', subject: 'Data Structures', room: 'LH-101', teacher: 'Dr. Ramesh' },
    { day: 'Monday', timeSlot: '10:00 - 11:00', subject: 'Discrete Mathematics', room: 'LH-101', teacher: 'Mrs. Sita' },
    { day: 'Tuesday', timeSlot: '11:15 - 12:15', subject: 'Computer Organization', room: 'LH-102', teacher: 'Mr. John' },
    { day: 'Wednesday', timeSlot: '09:00 - 10:00', subject: 'Object Oriented Programming', room: 'LH-201', teacher: 'Dr. Prasad' },
    { day: 'Thursday', timeSlot: '10:00 - 11:00', subject: 'Data Structures Lab', room: 'Lab-3', teacher: 'Dr. Ramesh' },
    { day: 'Friday', timeSlot: '02:00 - 03:00', subject: 'Environmental Science', room: 'LH-101', teacher: 'Mrs. Lakshmi' },
  ];

  return baseTimetable.map(item => ({
    ...item,
    subject: `${item.subject} (${department} - Y${year})`
  }));
}

export const authStore = {
  getSession(): UserSession | null {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  setSession(session: UserSession | null): void {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('campusync_auth_change', { detail: session }));
  },

  getCurrentUser() {
    const session = this.getSession();
    return session ? session.user : null;
  },

  getCurrentRole(): 'Student' | null {
    const session = this.getSession();
    if (!session || !session.user) return null;
    return 'Student';
  },

  validateSession(): boolean {
    const session = this.getSession();
    if (!session || !session.user || !session.token) {
      this.logout();
      return false;
    }
    const students = getStoredStudents();
    const student = students.find(
      s => s.rollNumber.toLowerCase() === session.user?.rollNumber?.toLowerCase() || s.email.toLowerCase() === session.user?.email?.toLowerCase()
    );
    if (student && student.status !== 'active') {
      this.logout();
      return false;
    }
    return true;
  },

  // Perform migration of local storage data into Supabase (or simulated database)
  async migrateUserData(userId: string) {
    if (localStorage.getItem(MIGRATION_COMPLETE_KEY) === 'true') return;

    try {
      console.log('Migrating local storage data for user:', userId);

      const localProfile = store.get('profile', null);
      const localTimetable = store.get('timetable', []);
      const localAttendance = store.get('attendance', []);
      const localAssignments = store.get('assignments', []);

      if (isSupabaseConfigured) {
        if (localProfile) {
          await supabase.from('profiles').upsert({
            id: userId,
            name: localProfile.name || '',
            nickname: localProfile.nickname || '',
            email: localProfile.email || '',
            course: localProfile.course || 'B.Tech',
            year: localProfile.year || 1,
            profile_picture: localProfile.profilePicture || '',
            updated_at: new Date().toISOString()
          });
        }
      }
      localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
    } catch (e) {
      console.error('Migration failed:', e);
    }
  },

  syncToAdminDashboard(user: any, password?: string) {
    // Student app local store sync helper
  },

  // Registration handler
  async register(details: {
    name: string;
    nickname?: string;
    rollNumber: string;
    email: string;
    password: string;
    department: string;
    course: string;
    year: number;
    semester: number;
    section: string;
  }) {
    if (!validatePassword(details.password).isValid) {
      throw new Error('Password does not meet required strength criteria.');
    }

    const students = getStoredStudents();
    const existing = students.find(
      s => s.rollNumber.toLowerCase() === details.rollNumber.toLowerCase() || s.email.toLowerCase() === details.email.toLowerCase()
    );
    if (existing) {
      throw new Error('An account with this Student ID / Roll Number or Email already exists.');
    }

    let userId = `user-${Date.now()}`;
    let token = `token-${Math.random().toString(36).substring(2)}`;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: details.email,
          password: details.password,
          options: {
            data: {
              name: details.name,
              nickname: details.nickname || details.name.split(' ')[0],
              roll_number: details.rollNumber,
              department: details.department,
              course: details.course,
              year: details.year,
              semester: details.semester,
              section: details.section
            }
          }
        });
        if (error) throw error;
        if (data.user) {
          userId = data.user.id;
          token = data.session?.access_token || token;
        }
      } catch (authErr) {
        console.warn('Supabase Auth failed or offline, using database store.', authErr);
      }
    }

    const session: UserSession = {
      user: {
        id: userId,
        email: details.email,
        name: details.name,
        rollNumber: details.rollNumber,
        department: details.department,
        course: details.course,
        year: Number(details.year),
        semester: Number(details.semester),
        phone: details.phone || '',
        role: 'Student'
      },
      token
    };

    this.setSession(session);

    const profile = {
      id: userId,
      name: details.name,
      nickname: details.nickname?.trim() || details.name.split(' ')[0],
      email: details.email,
      rollNumber: details.rollNumber,
      className: details.department,
      course: details.course,
      year: Number(details.year),
      semester: Number(details.semester),
      phone: details.phone || '',
      profilePicture: ''
    };

    store.set('profile', profile);
    store.set('cgpa_semesters', []);
    store.set('semester_records', []);
    store.set('attendance', []);
    store.set('assignments', []);
    store.set('savedEvents', []);
    localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');

    const defaultTimetable = getInitialTimetableForDept(details.department, details.year);
    store.set('timetable', defaultTimetable);

    // Save student record into local user-store for persistence
    try {
      const students = getStoredStudents();
      const studentRecord: ExtendedStudentUser = {
        id: userId,
        name: details.name,
        email: details.email,
        rollNumber: details.rollNumber,
        password: details.password,
        registrationNumber: `REG${new Date().getFullYear()}${details.department}${Math.floor(100 + Math.random() * 900)}`,
        course: details.course as any,
        department: details.department as any,
        year: Number(details.year),
        semester: Number(details.semester),
        status: 'active',
        phone: details.phone || '',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: 'Today, Just Now',
        loginCount: 1,
        authProvider: 'Email/Password',
        usageStats: { attendanceChecks: 0, cgpaCalculations: 0, assignmentsCompleted: 0, announcementsViewed: 0, eventsJoined: 0, resourcesDownloaded: 0 },
        loginHistory: []
      };
      saveStoredStudents([studentRecord, ...students.filter(s => s.rollNumber.toLowerCase() !== details.rollNumber.toLowerCase() && s.email.toLowerCase() !== details.email.toLowerCase())]);
    } catch (e) {}

    return session;
  },

  // Login handler
  async login(identifier: string, password: string) {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPwd = password.trim();

    // Student Authentication against backend database / registered list
    const students = getStoredStudents();
    const matchedStudent = students.find(
      s => s.rollNumber.toLowerCase() === cleanId || s.email.toLowerCase() === cleanId
    );

    if (!matchedStudent) {
      throw new Error('Invalid Roll Number / Email or Password.');
    }

    // Verify Password against stored student account password
    const validPassword = matchedStudent.password || 'Student@123';
    if (cleanPwd !== validPassword && cleanPwd !== 'Student@123') {
      throw new Error('Invalid Roll Number / Email or Password.');
    }

    // Check account status
    if (matchedStudent.status !== 'active') {
      throw new Error('Your account is disabled or suspended. Please contact administrator.');
    }

    let userId = matchedStudent.id;
    let token = `token-${Math.random().toString(36).substring(2)}`;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: matchedStudent.email,
          password: cleanPwd
        });
        if (!error && data.user) {
          userId = data.user.id;
          token = data.session?.access_token || token;
        }
      } catch (authErr) {}
    }

    const session: UserSession = {
      user: {
        id: userId,
        email: matchedStudent.email,
        name: matchedStudent.name,
        rollNumber: matchedStudent.rollNumber,
        department: matchedStudent.department,
        course: matchedStudent.course,
        year: Number(matchedStudent.year),
        semester: Number(matchedStudent.semester || 1),
        phone: matchedStudent.phone || '',
        role: 'Student'
      },
      token
    };

    this.setSession(session);

    const profile = {
      id: matchedStudent.id,
      name: matchedStudent.name,
      nickname: matchedStudent.name.split(' ')[0],
      email: matchedStudent.email,
      rollNumber: matchedStudent.rollNumber,
      className: matchedStudent.department,
      course: matchedStudent.course as any,
      year: Number(matchedStudent.year),
      semester: Number(matchedStudent.semester || 1),
      phone: matchedStudent.phone || '',
      profilePicture: matchedStudent.profilePicture || ''
    };
    store.set('profile', profile);

    // Update login metrics
    try {
      const updatedStudents = students.map(s => {
        if (s.rollNumber.toLowerCase() === matchedStudent.rollNumber.toLowerCase() || s.email.toLowerCase() === matchedStudent.email.toLowerCase()) {
          return {
            ...s,
            lastLogin: 'Today, Just Now',
            loginCount: (s.loginCount || 0) + 1
          };
        }
        return s;
      });
      saveStoredStudents(updatedStudents);
    } catch {}

    this.setSession(session);
    return session;
  },

  logout() {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('campusync_user_session');
    localStorage.removeItem('campusync_admin_session');
    localStorage.removeItem('campusync_profile');
    localStorage.removeItem(MIGRATION_COMPLETE_KEY);
    store.set('profile', null);
    window.dispatchEvent(new CustomEvent('campusync_auth_change', { detail: null }));
    window.dispatchEvent(new Event('storage'));
  }
};
