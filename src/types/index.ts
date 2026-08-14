// CampuSync Data Models — Backend-ready architecture

export interface Subject {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

export interface Semester {
  id: string;
  number: number;
  subjects: Subject[];
  sgpa: number | null;
}

export interface SemesterRecord {
  id: string;
  title: string;
  academicYear?: string;
  studentName: string;
  course: string;
  year: string;
  subjects: Subject[];
  lastUpdated: string;
  sgpa: number;
}

export interface TimetableEntry {
  id: string;
  day: string;
  subject: string;
  time: string;
  room?: string;
}

export interface AttendanceRecord {
  id: string;
  subject: string;
  totalClasses: number;
  attendedClasses: number;
  isPinned?: boolean;
  subjectType?: 'Theory' | 'Lab' | 'Elective' | 'Honors' | 'Minor';
}

export const DEFAULT_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: 'att-1', subject: 'Database Management Systems', totalClasses: 32, attendedClasses: 28, subjectType: 'Theory', isPinned: true },
  { id: 'att-2', subject: 'Operating Systems', totalClasses: 30, attendedClasses: 24, subjectType: 'Theory', isPinned: true },
  { id: 'att-3', subject: 'Computer Networks', totalClasses: 28, attendedClasses: 22, subjectType: 'Theory', isPinned: false },
  { id: 'att-4', subject: 'Software Engineering', totalClasses: 30, attendedClasses: 25, subjectType: 'Theory', isPinned: false },
  { id: 'att-5', subject: 'Full Stack Development – I', totalClasses: 20, attendedClasses: 18, subjectType: 'Lab', isPinned: false },
];

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'internal' | 'lab' | 'semester' | 'holiday';
  description?: string;
}

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  deadline: string;
  description: string;
  completed: boolean;
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low';
  completedAt?: string;
}

export const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn-1',
    subject: 'Database Management Systems',
    title: 'DBMS Lab 5: SQL Joins & Subqueries',
    deadline: '2026-08-16',
    description: 'Solve problem set 1 through 10 in Supabase / Postgres',
    completed: false,
    priority: 'High',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asgn-2',
    subject: 'Operating Systems',
    title: 'OS Assignment 2: CPU Scheduling Algorithms',
    deadline: '2026-08-18',
    description: 'Implement FCFS, SJF, and Round Robin simulations',
    completed: false,
    priority: 'Medium',
    createdAt: new Date().toISOString(),
  },
];

import { FileAttachment } from '@/lib/storage';

export interface Announcement {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  date: string;
  expiryDate: string;
  category: 'Academic' | 'Exam' | 'Event' | 'Placement';
  audience: string;
  source: string;
  priority: 'urgent' | 'important' | 'general';
  course: 'All' | 'B.Tech' | 'M.Tech';
  year: 'All' | '1st' | '2nd' | '3rd' | '4th';
  attachmentURL?: string;
  attachmentType?: 'pdf' | 'image' | 'document';
  attachmentsList?: FileAttachment[];
  isPinned: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  category: 'Fest' | 'Seminar' | 'Workshop' | 'Exhibition' | 'Meet';
  description: string;
  image?: string;
  links?: { title: string, url: string }[];
  attachmentsList?: FileAttachment[];
}

export type CourseType = 'B.Tech' | 'M.Tech';

export const CLASS_OPTIONS: Record<CourseType, string[]> = {
  'B.Tech': ['CSE', 'AIML', 'CSE-ICP', 'AIML-ICP'],
  'M.Tech': ['Cyber Security', 'Data Science'],
};

export const YEAR_OPTIONS: Record<CourseType, number[]> = {
  'B.Tech': [1, 2, 3, 4],
  'M.Tech': [1, 2],
};

export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  rollNumber: string;
  course: CourseType;
  className: string;
  year: number;
  semester: number;
  email: string;
  phone?: string;
  profilePicture?: string;
  regulation?: string;
}

export const GRADE_POINTS: Record<string, number> = {
  'S': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'F': 0,
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const GRADES = ['S', 'A', 'B', 'C', 'D', 'E', 'F'] as const;
