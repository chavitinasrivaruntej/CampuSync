import { UserProfile } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type AdminRole = 'Super Admin' | 'Department Admin' | 'Read Only Admin';

export interface UserLoginActivity {
  id: string;
  action: string;
  timestamp: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
}

export interface StudentAppUsageStats {
  attendanceChecks: number;
  cgpaCalculations: number;
  assignmentsCompleted: number;
  announcementsViewed: number;
  eventsJoined: number;
  resourcesDownloaded: number;
}

export interface ExtendedStudentUser {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  password?: string;
  registrationNumber: string;
  course: 'B.Tech' | 'M.Tech';
  department: 'CSE' | 'AIML' | 'ECE' | 'EEE';
  year: number;
  semester: number;
  section?: string;
  status: UserStatus;
  profilePicture?: string;
  phone: string;
  createdAt: string;
  lastLogin: string;
  loginCount: number;
  authProvider: 'Email/Password' | 'Google SSO';
  usageStats: StudentAppUsageStats;
  loginHistory: UserLoginActivity[];
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  department: string;
  status: UserStatus;
  lastLogin: string;
  permissions: string[];
}

const INITIAL_STUDENTS: ExtendedStudentUser[] = [
  {
    id: 'stu-101',
    name: 'Varun Tej',
    email: 'varun.tej@campusync.edu',
    rollNumber: '22A91A0501',
    password: 'Student@123',
    registrationNumber: 'REG2022CSE0501',
    course: 'B.Tech',
    department: 'CSE',
    year: 2,
    semester: 4,
    section: 'Sec A',
    status: 'active',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    phone: '+91 98765 43210',
    createdAt: '2025-08-15',
    lastLogin: 'Today, 02:45 PM',
    loginCount: 142,
    authProvider: 'Email/Password',
    usageStats: {
      attendanceChecks: 84,
      cgpaCalculations: 38,
      assignmentsCompleted: 12,
      announcementsViewed: 24,
      eventsJoined: 3,
      resourcesDownloaded: 15
    },
    loginHistory: [
      { id: 'lh-1', action: 'Logged In', timestamp: 'Today, 02:45 PM', device: 'Chrome / Windows 11', browser: 'Chrome 126', os: 'Windows 11', ipAddress: '103.15.22.41' },
      { id: 'lh-2', action: 'Password Reset', timestamp: 'Yesterday, 11:20 AM', device: 'Chrome / Windows 11', browser: 'Chrome 126', os: 'Windows 11', ipAddress: '103.15.22.41' },
      { id: 'lh-3', action: 'Logged In', timestamp: 'Jul 20, 2026, 09:15 AM', device: 'Safari / iPhone 15', browser: 'Mobile Safari', os: 'iOS 17.5', ipAddress: '49.37.12.88' }
    ]
  },
  {
    id: 'stu-102',
    name: 'Srikar Varma',
    email: 'srikar.v@campusync.edu',
    rollNumber: '22A91A0502',
    password: 'Student@123',
    registrationNumber: 'REG2022CSE0502',
    course: 'B.Tech',
    department: 'CSE',
    year: 2,
    semester: 4,
    section: 'Sec A',
    status: 'active',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
    phone: '+91 98765 43211',
    createdAt: '2025-08-15',
    lastLogin: 'Today, 11:30 AM',
    loginCount: 98,
    authProvider: 'Email/Password',
    usageStats: {
      attendanceChecks: 62,
      cgpaCalculations: 24,
      assignmentsCompleted: 9,
      announcementsViewed: 18,
      eventsJoined: 2,
      resourcesDownloaded: 8
    },
    loginHistory: [
      { id: 'lh-4', action: 'Logged In', timestamp: 'Today, 11:30 AM', device: 'Chrome / macOS', browser: 'Chrome 126', os: 'macOS Sonoma', ipAddress: '103.15.22.45' }
    ]
  },
  {
    id: 'stu-103',
    name: 'Ananya Reddy',
    email: 'ananya.r@campusync.edu',
    rollNumber: '23A91A1214',
    registrationNumber: 'REG2023AIML1214',
    course: 'B.Tech',
    department: 'AIML',
    year: 2,
    semester: 3,
    section: 'Sec B',
    status: 'active',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
    phone: '+91 98765 43212',
    createdAt: '2025-08-16',
    lastLogin: 'Yesterday, 04:15 PM',
    loginCount: 115,
    authProvider: 'Google SSO',
    usageStats: {
      attendanceChecks: 95,
      cgpaCalculations: 42,
      assignmentsCompleted: 15,
      announcementsViewed: 28,
      eventsJoined: 5,
      resourcesDownloaded: 22
    },
    loginHistory: [
      { id: 'lh-5', action: 'Logged In', timestamp: 'Yesterday, 04:15 PM', device: 'Safari / iPhone 14', browser: 'Mobile Safari', os: 'iOS 17', ipAddress: '49.37.14.99' }
    ]
  },
  {
    id: 'stu-104',
    name: 'Pavan Kumar',
    email: 'pavan.k@campusync.edu',
    rollNumber: '21A91A0412',
    registrationNumber: 'REG2021ECE0412',
    course: 'B.Tech',
    department: 'ECE',
    year: 3,
    semester: 5,
    section: 'Sec C',
    status: 'inactive',
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
    phone: '+91 98765 43213',
    createdAt: '2024-08-10',
    lastLogin: 'Jul 10, 2026',
    loginCount: 45,
    authProvider: 'Email/Password',
    usageStats: {
      attendanceChecks: 30,
      cgpaCalculations: 12,
      assignmentsCompleted: 4,
      announcementsViewed: 10,
      eventsJoined: 1,
      resourcesDownloaded: 3
    },
    loginHistory: [
      { id: 'lh-6', action: 'Logged In', timestamp: 'Jul 10, 2026', device: 'Chrome / Android', browser: 'Chrome Mobile', os: 'Android 14', ipAddress: '157.33.10.12' }
    ]
  },
  {
    id: 'stu-105',
    name: 'Divya Sri',
    email: 'divya.s@campusync.edu',
    rollNumber: '22A91A0588',
    registrationNumber: 'REG2022CSE0588',
    course: 'B.Tech',
    department: 'CSE',
    year: 2,
    semester: 4,
    section: 'Sec B',
    status: 'suspended',
    profilePicture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop',
    phone: '+91 98765 43214',
    createdAt: '2025-08-15',
    lastLogin: 'Jul 05, 2026',
    loginCount: 68,
    authProvider: 'Email/Password',
    usageStats: {
      attendanceChecks: 40,
      cgpaCalculations: 18,
      assignmentsCompleted: 8,
      announcementsViewed: 14,
      eventsJoined: 1,
      resourcesDownloaded: 6
    },
    loginHistory: [
      { id: 'lh-7', action: 'Account Suspended', timestamp: 'Jul 06, 2026', device: 'System Admin', browser: 'Admin Control', os: 'Server', ipAddress: '10.0.0.1' }
    ]
  }
];

const INITIAL_ADMINS: AdminUserRecord[] = [
  {
    id: 'adm-1',
    name: 'Varun (Department Admin)',
    email: 'admin.cse@campusync.edu',
    role: 'Department Admin',
    department: 'CSE & AIML',
    status: 'active',
    lastLogin: 'Today, 03:20 PM',
    permissions: ['Manage Students', 'Manage Announcements', 'Manage Events', 'Manage Resources', 'View Analytics']
  },
  {
    id: 'adm-2',
    name: 'Campus System Admin',
    email: 'superadmin@campusync.edu',
    role: 'Super Admin',
    department: 'Central Administration',
    status: 'active',
    lastLogin: 'Today, 10:00 AM',
    permissions: ['All System Permissions', 'Manage Administrators', 'Manage Roles', 'Database Settings']
  },
  {
    id: 'adm-3',
    name: 'Exam Branch Auditor',
    email: 'auditor.exam@campusync.edu',
    role: 'Read Only Admin',
    department: 'Examination Branch',
    status: 'active',
    lastLogin: 'Yesterday, 02:15 PM',
    permissions: ['View Analytics', 'View Students', 'Export Reports']
  }
];

const STUDENTS_KEY = 'campusync_admin_students';
const ADMINS_KEY = 'campusync_admin_users';

export function getStoredStudents(): ExtendedStudentUser[] {
  try {
    const saved = localStorage.getItem(STUDENTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_STUDENTS;
}

export function saveStoredStudents(students: ExtendedStudentUser[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('campusync_students_updated', { detail: students }));
  } catch {}
}

export function getStoredAdmins(): AdminUserRecord[] {
  try {
    const saved = localStorage.getItem(ADMINS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_ADMINS;
}

export function saveStoredAdmins(admins: AdminUserRecord[]): void {
  try {
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  } catch {}
}

export function exportUsersToCSV(users: ExtendedStudentUser[]): void {
  const headers = ['Name', 'Roll Number', 'Registration No', 'Email', 'Department', 'Year', 'Semester', 'Section', 'Status', 'Last Login'];
  const rows = users.map(u => [
    `"${u.name}"`,
    `"${u.rollNumber}"`,
    `"${u.registrationNumber}"`,
    `"${u.email}"`,
    `"${u.department}"`,
    u.year,
    u.semester,
    `"${u.section}"`,
    `"${u.status}"`,
    `"${u.lastLogin}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CampusSync_Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
