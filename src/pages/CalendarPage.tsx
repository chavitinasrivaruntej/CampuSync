import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  GraduationCap, 
  ChevronLeft, 
  Folder, 
  FileText, 
  Download, 
  Pin, 
  PinOff, 
  Clock, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  History,
  Info,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeftSquare,
  ChevronRightSquare,
  WifiOff,
  Wifi,
  X,
  Palmtree
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

// Helper types for the academic repository
interface CalendarDoc {
  id: string;
  year?: number; // 1, 2, 3, 4 (optional for Holidays List)
  type: 'Academic Calendar' | 'Syllabus' | 'Holidays List';
  classType?: 'CSE / CSE ICP' | 'AIML / AIML ICP'; // Only for Year 2, 3, 4 Syllabus
  academicYear: string;
  fileType: string; // 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'WEBP'
  uploadedBy: string;
  lastUpdated: string;
  version: number;
  isVerified: boolean;
  description: string;
  versions: { version: number; uploadDate: string; notes: string }[];
  images?: string[];
  previewData: {
    title: string;
    items: { event: string; dates: string; duration?: string }[];
  };
}

// Official Academic Repository document database
const CALENDAR_DATABASE: CalendarDoc[] = [
  // Shared Holidays List
  {
    id: 'holidays-list',
    type: 'Holidays List',
    academicYear: '2025-2026',
    fileType: 'PNG',
    uploadedBy: 'Administration Office',
    lastUpdated: '05 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official holiday schedules and institutional holidays',
    versions: [
      { version: 1, uploadDate: '05 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'LIST OF GENERAL HOLIDAYS 2026',
      items: [
        { event: 'Bakrid / Eid al-Adha', dates: '17 June 2026' },
        { event: 'Muharram', dates: '17 July 2026' },
        { event: 'Independence Day', dates: '15 August 2026' },
        { event: 'Sri Krishna Janmashtami', dates: '24 August 2026' },
        { event: 'Vinayaka Chavithi', dates: '07 September 2026' },
        { event: 'Milad-un-Nabi', dates: '16 September 2026' },
        { event: 'Mahatma Gandhi Jayanti', dates: '02 October 2026' },
        { event: 'Vijayadasami / Dussehra', dates: '12 October 2026' }
      ]
    },
    images: ['/mock_timetable.png']
  },
  // Year 1 Academic Calendar
  {
    id: 'y1-academic-calendar',
    year: 1,
    type: 'Academic Calendar',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Academic Cell',
    lastUpdated: '10 June 2026',
    version: 2,
    isVerified: true,
    description: 'Class schedules, semester timelines, examinations, and important academic dates.',
    versions: [
      { version: 2, uploadDate: '10 June 2026', notes: 'Updated spells of instruction.' },
      { version: 1, uploadDate: '01 June 2026', notes: 'Initial release of freshman schedule.' }
    ],
    previewData: {
      title: 'B.TECH 1ST YEAR ACADEMIC CALENDAR',
      items: [
        { event: 'Commencement of Class Work', dates: '01 July 2026' },
        { event: '1st Spell of Instructions', dates: '01 July - 25 August 2026', duration: '8 Weeks' },
        { event: '1st Mid Examinations', dates: '26 August - 31 August 2026', duration: '1 Week' },
        { event: '2nd Spell of Instructions', dates: '01 September - 28 October 2026', duration: '8 Weeks' },
        { event: '2nd Mid Examinations', dates: '29 October - 04 November 2026', duration: '1 Week' },
        { event: 'Preparation & Practicals', dates: '05 November - 12 November 2026', duration: '1 Week' },
        { event: 'Semester End Theory Examinations', dates: '13 November - 30 November 2026', duration: '2.5 Weeks' },
        { event: 'Commencement of Next Semester', dates: '01 December 2026' }
      ]
    }
  },
  // Year 1 Syllabus (common)
  {
    id: 'y1-syllabus',
    year: 1,
    type: 'Syllabus',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Board of Studies',
    lastUpdated: '01 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official subject syllabus, curriculum, subject codes, and credit structure.',
    versions: [
      { version: 1, uploadDate: '01 June 2026', notes: 'Initial syllabus release.' }
    ],
    previewData: {
      title: 'B.TECH 1ST YEAR COMMON SYLLABUS',
      items: [
        { event: 'Mathematics-I (Linear Algebra & Calculus)', dates: 'Course Code: R231101', duration: 'Credits: 3' },
        { event: 'Applied Chemistry', dates: 'Course Code: R231102', duration: 'Credits: 3' },
        { event: 'Programming for Problem Solving', dates: 'Course Code: R231103', duration: 'Credits: 3' },
        { event: 'English for Communication', dates: 'Course Code: R231104', duration: 'Credits: 2' },
        { event: 'Computer Engineering Workshop', dates: 'Course Code: R231105', duration: 'Credits: 1.5' },
        { event: 'Applied Chemistry Laboratory', dates: 'Course Code: R231106', duration: 'Credits: 1' },
        { event: 'Problem Solving Lab using C', dates: 'Course Code: R231107', duration: 'Credits: 1' },
        { event: 'Basic Electrical Engineering', dates: 'Course Code: R231108', duration: 'Credits: 3' }
      ]
    }
  },
  // Year 2 Academic Calendar
  {
    id: 'y2-academic-calendar',
    year: 2,
    type: 'Academic Calendar',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Academic Cell',
    lastUpdated: '12 June 2026',
    version: 1,
    isVerified: true,
    description: 'Class schedules, semester timelines, examinations, and important academic dates.',
    versions: [
      { version: 1, uploadDate: '12 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 2ND YEAR ACADEMIC CALENDAR',
      items: [
        { event: 'Commencement of Class Work', dates: '05 July 2026' },
        { event: '1st Spell of Instructions', dates: '05 July - 29 August 2026', duration: '8 Weeks' },
        { event: '1st Mid Examinations', dates: '30 August - 05 September 2026', duration: '1 Week' },
        { event: '2nd Spell of Instructions', dates: '06 September - 31 October 2026', duration: '8 Weeks' },
        { event: '2nd Mid Examinations', dates: '01 November - 07 November 2026', duration: '1 Week' },
        { event: 'Preparation & Practicals', dates: '08 November - 15 November 2026', duration: '1 Week' },
        { event: 'Semester End Theory Examinations', dates: '16 November - 03 December 2026', duration: '2.5 Weeks' },
        { event: 'Commencement of Next Semester', dates: '05 December 2026' }
      ]
    }
  },
  // Year 2 CSE Syllabus
  {
    id: 'y2-syllabus-cse',
    year: 2,
    type: 'Syllabus',
    classType: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Board of Studies',
    lastUpdated: '10 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official subject syllabus, curriculum, subject codes, and credit structure.',
    versions: [
      { version: 1, uploadDate: '10 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 2ND YEAR CSE (CSE / CSE ICP) SYLLABUS',
      items: [
        { event: 'Mathematical Foundations of Computer Science', dates: 'Course Code: R232101', duration: 'Credits: 3' },
        { event: 'Data Structures & Algorithms', dates: 'Course Code: R232102', duration: 'Credits: 3' },
        { event: 'Java Programming Language', dates: 'Course Code: R232103', duration: 'Credits: 3' },
        { event: 'Database Management Systems', dates: 'Course Code: R232104', duration: 'Credits: 3' },
        { event: 'Software Engineering Methodologies', dates: 'Course Code: R232105', duration: 'Credits: 3' },
        { event: 'Java Programming Lab', dates: 'Course Code: R232106', duration: 'Credits: 1.5' },
        { event: 'Data Structures Laboratory', dates: 'Course Code: R232107', duration: 'Credits: 1.5' },
        { event: 'DBMS Laboratory Practices', dates: 'Course Code: R232108', duration: 'Credits: 1.5' }
      ]
    }
  },
  // Year 2 AIML Syllabus
  {
    id: 'y2-syllabus-aiml',
    year: 2,
    type: 'Syllabus',
    classType: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Board of Studies',
    lastUpdated: '11 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official subject syllabus, curriculum, subject codes, and credit structure.',
    versions: [
      { version: 1, uploadDate: '11 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 2ND YEAR AIML SYLLABUS',
      items: [
        { event: 'Python Programming for AI Developers', dates: 'Course Code: R232201', duration: 'Credits: 3' },
        { event: 'Mathematical Foundations for Machine Learning', dates: 'Course Code: R232202', duration: 'Credits: 3' },
        { event: 'Machine Learning Models & Logic', dates: 'Course Code: R232203', duration: 'Credits: 3' },
        { event: 'Data Structures and Algorithms', dates: 'Course Code: R232204', duration: 'Credits: 3' },
        { event: 'Deep Learning Foundation Essentials', dates: 'Course Code: R232205', duration: 'Credits: 3' },
        { event: 'Python for AI Lab Practice', dates: 'Course Code: R232206', duration: 'Credits: 1.5' },
        { event: 'Machine Learning Models Lab', dates: 'Course Code: R232207', duration: 'Credits: 1.5' },
        { event: 'Data Structures Lab using Python', dates: 'Course Code: R232208', duration: 'Credits: 1.5' }
      ]
    }
  },
  // Year 3 Academic Calendar
  {
    id: 'y3-academic-calendar',
    year: 3,
    type: 'Academic Calendar',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Academic Cell',
    lastUpdated: '15 June 2026',
    version: 1,
    isVerified: true,
    description: 'Class schedules, semester timelines, examinations, and important academic dates.',
    versions: [
      { version: 1, uploadDate: '15 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 3RD YEAR ACADEMIC CALENDAR',
      items: [
        { event: 'Commencement of Class Work', dates: '10 July 2026' },
        { event: '1st Spell of Instructions', dates: '10 July - 03 September 2026', duration: '8 Weeks' },
        { event: '1st Mid Examinations', dates: '04 September - 10 September 2026', duration: '1 Week' },
        { event: '2nd Spell of Instructions', dates: '11 September - 05 November 2026', duration: '8 Weeks' },
        { event: '2nd Mid Examinations', dates: '06 November - 12 November 2026', duration: '1 Week' },
        { event: 'Preparation & Practicals', dates: '13 November - 20 November 2026', duration: '1 Week' },
        { event: 'Semester End Theory Examinations', dates: '21 November - 07 December 2026', duration: '2.5 Weeks' },
        { event: 'Commencement of Next Semester', dates: '10 December 2026' }
      ]
    }
  },
  // Year 3 CSE Syllabus
  {
    id: 'y3-syllabus-cse',
    year: 3,
    type: 'Syllabus',
    classType: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Board of Studies',
    lastUpdated: '15 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official subject syllabus, curriculum, subject codes, and credit structure.',
    versions: [
      { version: 1, uploadDate: '15 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 3RD YEAR CSE (CSE / CSE ICP) SYLLABUS',
      items: [
        { event: 'Computer Networks System Administration', dates: 'Course Code: R233101', duration: 'Credits: 3' },
        { event: 'Compiler Design Core Concepts', dates: 'Course Code: R233102', duration: 'Credits: 3' },
        { event: 'Web Technologies Development', dates: 'Course Code: R233103', duration: 'Credits: 3' },
        { event: 'Cryptography and Network Security', dates: 'Course Code: R233104', duration: 'Credits: 3' },
        { event: 'Mobile Computing Elective', dates: 'Course Code: R233105', duration: 'Credits: 3' },
        { event: 'Compiler Design Lab Session', dates: 'Course Code: R233106', duration: 'Credits: 1.5' },
        { event: 'Computer Networks Laboratory', dates: 'Course Code: R233107', duration: 'Credits: 1.5' },
        { event: 'Web Technologies Practical Lab', dates: 'Course Code: R233108', duration: 'Credits: 1.5' }
      ]
    }
  },
  // Year 3 AIML Syllabus
  {
    id: 'y3-syllabus-aiml',
    year: 3,
    type: 'Syllabus',
    classType: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Board of Studies',
    lastUpdated: '16 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official subject syllabus, curriculum, subject codes, and credit structure.',
    versions: [
      { version: 1, uploadDate: '16 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 3RD YEAR AIML SYLLABUS',
      items: [
        { event: 'Artificial Neural Networks', dates: 'Course Code: R233201', duration: 'Credits: 3' },
        { event: 'Natural Language Processing Techniques', dates: 'Course Code: R233202', duration: 'Credits: 3' },
        { event: 'Computer Vision Core Frameworks', dates: 'Course Code: R233203', duration: 'Credits: 3' },
        { event: 'Big Data Analytics with Spark', dates: 'Course Code: R233204', duration: 'Credits: 3' },
        { event: 'Ethics & Governance in AI', dates: 'Course Code: R233205', duration: 'Credits: 2' },
        { event: 'Neural Networks Lab Session', dates: 'Course Code: R233206', duration: 'Credits: 1.5' },
        { event: 'NLP and Text Processing Lab', dates: 'Course Code: R233207', duration: 'Credits: 1.5' },
        { event: 'Computer Vision Application Lab', dates: 'Course Code: R233208', duration: 'Credits: 1.5' }
      ]
    }
  },
  // Year 4 Academic Calendar
  {
    id: 'y4-academic-calendar',
    year: 4,
    type: 'Academic Calendar',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Academic Cell',
    lastUpdated: '20 June 2026',
    version: 1,
    isVerified: true,
    description: 'Class schedules, semester timelines, examinations, and important academic dates.',
    versions: [
      { version: 1, uploadDate: '20 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 4TH YEAR ACADEMIC CALENDAR',
      items: [
        { event: 'Commencement of Class Work', dates: '15 July 2026' },
        { event: '1st Spell of Instructions', dates: '15 July - 09 September 2026', duration: '8 Weeks' },
        { event: '1st Mid Examinations', dates: '10 September - 16 September 2026', duration: '1 Week' },
        { event: '2nd Spell of Instructions', dates: '17 September - 12 November 2026', duration: '8 Weeks' },
        { event: '2nd Mid Examinations', dates: '13 November - 19 November 2026', duration: '1 Week' },
        { event: 'Preparation & Practicals', dates: '20 November - 27 November 2026', duration: '1 Week' },
        { event: 'Semester End Theory Examinations', dates: '28 November - 15 December 2026', duration: '2.5 Weeks' },
        { event: 'Commencement of Next Semester', dates: '18 December 2026' }
      ]
    }
  },
  // Year 4 CSE Syllabus
  {
    id: 'y4-syllabus-cse',
    year: 4,
    type: 'Syllabus',
    classType: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Board of Studies',
    lastUpdated: '20 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official subject syllabus, curriculum, subject codes, and credit structure.',
    versions: [
      { version: 1, uploadDate: '20 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 4TH YEAR CSE (CSE / CSE ICP) SYLLABUS',
      items: [
        { event: 'Cloud Computing & Virtualization', dates: 'Course Code: R234101', duration: 'Credits: 3' },
        { event: 'Human Computer Interaction Methods', dates: 'Course Code: R234102', duration: 'Credits: 3' },
        { event: 'Distributed Systems & Network Architecture', dates: 'Course Code: R234103', duration: 'Credits: 3' },
        { event: 'Blockchain Technologies & Smart Contracts', dates: 'Course Code: R234104', duration: 'Credits: 3' },
        { event: 'Software Project Management Essentials', dates: 'Course Code: R234105', duration: 'Credits: 3' },
        { event: 'Cloud Computing Lab Practice', dates: 'Course Code: R234106', duration: 'Credits: 1.5' },
        { event: 'Major Project Phase-I Implementation', dates: 'Course Code: R234107', duration: 'Credits: 2' },
        { event: 'Major Project Phase-II Final reviews', dates: 'Course Code: R234108', duration: 'Credits: 8' }
      ]
    }
  },
  // Year 4 AIML Syllabus
  {
    id: 'y4-syllabus-aiml',
    year: 4,
    type: 'Syllabus',
    classType: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'WEBP',
    uploadedBy: 'Board of Studies',
    lastUpdated: '21 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official subject syllabus, curriculum, subject codes, and credit structure.',
    versions: [
      { version: 1, uploadDate: '21 June 2026', notes: 'First official release.' }
    ],
    previewData: {
      title: 'B.TECH 4TH YEAR AIML SYLLABUS',
      items: [
        { event: 'Reinforcement Learning and Logic', dates: 'Course Code: R234201', duration: 'Credits: 3' },
        { event: 'Generative AI & LLM Systems', dates: 'Course Code: R234202', duration: 'Credits: 3' },
        { event: 'Robotics & Computer Vision Intelligence', dates: 'Course Code: R234203', duration: 'Credits: 3' },
        { event: 'Cloud Systems for AI workloads', dates: 'Course Code: R234204', duration: 'Credits: 3' },
        { event: 'AI Capstone Project Guidelines', dates: 'Course Code: R234205', duration: 'Credits: 3' },
        { event: 'Reinforcement Learning Lab Practice', dates: 'Course Code: R234206', duration: 'Credits: 1.5' },
        { event: 'Generative AI Lab and Fine-tuning', dates: 'Course Code: R234207', duration: 'Credits: 1.5' },
        { event: 'AI Capstone Implementation reviews', dates: 'Course Code: R234208', duration: 'Credits: 8' }
      ]
    },
    images: ['/mock_timetable.png']
  }
];

const CALENDAR_YEARS = [
  { id: 1, title: '1st Year', badge: 'B.Tech', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
  { id: 2, title: '2nd Year', badge: 'B.Tech', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { id: 3, title: '3rd Year', badge: 'B.Tech', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
  { id: 4, title: '4th Year', badge: 'B.Tech', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-500' },
];

const CALENDAR_RESOURCES = [
  { 
    type: 'Academic Calendar' as const, 
    name: 'Academic Calendar', 
    desc: 'Class schedules, semester timelines, examinations, and important academic dates.', 
    icon: Calendar, 
    iconBg: 'bg-primary/10', 
    iconColor: 'text-primary' 
  },
  { 
    type: 'Syllabus' as const, 
    name: 'Syllabus', 
    desc: 'Official subject syllabus, curriculum, subject codes, and credit structure.', 
    icon: GraduationCap, 
    iconBg: 'bg-indigo-500/10', 
    iconColor: 'text-indigo-500' 
  }
];

const SYLLABUS_BRANCHES = [
  { id: 'cse', name: 'CSE / CSE ICP' as const, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', accentColor: 'border-blue-200' },
  { id: 'aiml', name: 'AIML / AIML ICP' as const, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500', accentColor: 'border-purple-200' },
];

const CalendarPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Navigation State
  const [selectedRepo, setSelectedRepo] = useState<'Academic Resources' | 'Holidays List' | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedResource, setSelectedResource] = useState<'Academic Calendar' | 'Syllabus' | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<'CSE / CSE ICP' | 'AIML / AIML ICP' | null>(null);

  // Pin State (Multiple pins - generous limit of 10)
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('campusync_pinned_calendars');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('campusync_recent_calendars');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Save Offline State
  const [offlineIds, setOfflineIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('campusync_offline_calendar_ids');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Offline Simulation State
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(() => {
    return localStorage.getItem('campusync_offline_simulated') === 'true';
  });

  // Version History Modal State
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Built-in PDF Viewer States
  const [zoomScale, setZoomScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [isPdfFullScreen, setIsPdfFullScreen] = useState(false);

  // Built-in Image Viewer States
  const [imgZoomScale, setImgZoomScale] = useState(1.0);
  const [imgRotation, setImgRotation] = useState(0);
  const [imgPanX, setImgPanX] = useState(0);
  const [imgPanY, setImgPanY] = useState(0);
  const [imgPage, setImgPage] = useState(1);
  const [isImgFullScreen, setIsImgFullScreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null);

  // Effect: Handle direct links on mount (e.g. ?doc=y1-academic-calendar)
  useEffect(() => {
    const docId = searchParams.get('doc');
    if (docId) {
      if (docId === 'holidays-list') {
        setSelectedRepo('Holidays List');
      } else {
        const doc = CALENDAR_DATABASE.find(d => d.id === docId);
        if (doc) {
          setSelectedRepo('Academic Resources');
          setSelectedYear(doc.year || null);
          setSelectedResource(doc.type);
          if (doc.classType) {
            setSelectedBranch(doc.classType);
          }
        }
      }
    }
  }, [searchParams]);

  // Sync Pinned state
  useEffect(() => {
    localStorage.setItem('campusync_pinned_calendars', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  // Sync Recently Viewed state
  useEffect(() => {
    localStorage.setItem('campusync_recent_calendars', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Sync Offline IDs
  useEffect(() => {
    localStorage.setItem('campusync_offline_calendar_ids', JSON.stringify(offlineIds));
  }, [offlineIds]);

  // Sync simulated offline mode
  useEffect(() => {
    localStorage.setItem('campusync_offline_simulated', isOfflineSimulated ? 'true' : 'false');
  }, [isOfflineSimulated]);

  // Find document based on current selections
  const currentDoc = useMemo(() => {
    if (selectedRepo === 'Holidays List') {
      return CALENDAR_DATABASE.find(d => d.type === 'Holidays List');
    }
    
    if (selectedRepo === 'Academic Resources' && selectedYear) {
      if (selectedYear === 1) {
        return CALENDAR_DATABASE.find(d => d.year === 1 && d.type === selectedResource);
      } else {
        if (selectedResource === 'Academic Calendar') {
          return CALENDAR_DATABASE.find(d => d.year === selectedYear && d.type === 'Academic Calendar');
        }
        if (selectedResource === 'Syllabus' && selectedBranch) {
          return CALENDAR_DATABASE.find(d => d.year === selectedYear && d.type === 'Syllabus' && d.classType === selectedBranch);
        }
      }
    }
    return undefined;
  }, [selectedRepo, selectedYear, selectedResource, selectedBranch]);

  const selectDocumentDirect = (doc: CalendarDoc) => {
    if (doc.type === 'Holidays List') {
      setSelectedRepo('Holidays List');
    } else {
      setSelectedRepo('Academic Resources');
      setSelectedYear(doc.year || null);
      setSelectedResource(doc.type);
      if (doc.classType) {
        setSelectedBranch(doc.classType);
      } else {
        setSelectedBranch(null);
      }
    }
    addToRecentlyViewed(doc.id);
    setSearchParams({ doc: doc.id });
  };

  const addToRecentlyViewed = (id: string) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item !== id);
      return [id, ...filtered].slice(0, 4); // Keep top 4
    });
  };

  const handlePin = (id: string) => {
    setPinnedIds(prev => {
      if (prev.includes(id)) return prev;
      if (prev.length >= 10) {
        toast.warning('Maximum pinning limit (10) reached.', {
          description: 'Unpin another resource to pin this one.'
        });
        return prev;
      }
      toast.success('Resource pinned successfully.');
      return [...prev, id];
    });
  };

  const handleUnpin = (id: string) => {
    setPinnedIds(prev => {
      if (prev.includes(id)) {
        toast.success('Pinned resource removed.');
        return prev.filter(item => item !== id);
      }
      return prev;
    });
  };

  const resetImageState = () => {
    setImgZoomScale(1.0);
    setImgRotation(0);
    setImgPanX(0);
    setImgPanY(0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - imgPanX, y: e.clientY - imgPanY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setImgPanX(e.clientX - dragStart.x);
    setImgPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - imgPanX, y: touch.clientY - imgPanY });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialTouchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setImgPanX(touch.clientX - dragStart.x);
      setImgPanY(touch.clientY - dragStart.y);
    } else if (e.touches.length === 2 && initialTouchDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialTouchDistance;
      setImgZoomScale(prev => Math.min(2.5, Math.max(0.6, prev * (factor > 1 ? 1.05 : 0.95))));
      setInitialTouchDistance(dist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialTouchDistance(null);
  };

  const isDocumentAccessible = (doc: CalendarDoc) => {
    // If simulated offline is active, only allow if the file ID is in the cached offlineIds list.
    if (isOfflineSimulated) {
      return offlineIds.includes(doc.id);
    }
    return true;
  };

  const toggleSaveOffline = (id: string) => {
    setOfflineIds(prev => {
      if (prev.includes(id)) {
        toast.success('Offline copy deleted');
        return prev.filter(item => item !== id);
      } else {
        toast.success('Saved Offline Successfully!', {
          description: 'Document cached. Access it anytime without internet.'
        });
        return [...prev, id];
      }
    });
  };

  const handleDownload = (doc: CalendarDoc) => {
    toast.success(`${doc.fileType} Download Completed`, {
      description: `Saved Year_${doc.year || 'Shared'}_${doc.type.replace(' ', '_')}.${doc.fileType.toLowerCase()} successfully.`
    });
  };

  const handleShare = (doc: CalendarDoc) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?doc=${doc.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Academic Repo: ${doc.type}`,
        text: `Official ${doc.type} document.`,
        url: shareUrl
      }).then(() => {
        toast.success('Shared successfully');
      }).catch(() => {
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Shareable Link Copied!', {
        description: 'You can now share this direct planner link.'
      });
    });
  };

  const handleBackNavigation = () => {
    if (selectedBranch) {
      setSelectedBranch(null);
    } else if (selectedResource) {
      setSelectedResource(null);
    } else if (selectedYear) {
      setSelectedYear(null);
    } else if (selectedRepo) {
      setSelectedRepo(null);
      setSearchParams({});
    }
  };

  const renderBreadcrumbs = () => {
    if (!selectedRepo) return null;
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-extrabold mb-5 overflow-x-auto whitespace-nowrap hide-scrollbar pb-1">
        <button 
          onClick={() => {
            setSelectedRepo(null);
            setSelectedYear(null);
            setSelectedResource(null);
            setSelectedBranch(null);
            setSearchParams({});
          }}
          className="hover:text-primary transition-colors uppercase tracking-wider animate-in fade-in"
        >
          Academic Repository
        </button>
        
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
        
        <button
          onClick={() => {
            if (selectedRepo === 'Holidays List') return;
            setSelectedYear(null);
            setSelectedResource(null);
            setSelectedBranch(null);
            setSearchParams({});
          }}
          className={`hover:text-primary transition-colors uppercase tracking-wider ${!selectedYear ? 'text-primary font-black' : ''}`}
        >
          {selectedRepo === 'Holidays List' ? 'Holiday List' : selectedRepo}
        </button>
        
        {selectedYear && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 animate-in fade-in" />
            <button
              onClick={() => {
                setSelectedResource(null);
                setSelectedBranch(null);
                setSearchParams({});
              }}
              className={`hover:text-primary transition-colors uppercase tracking-wider ${!selectedResource ? 'text-primary font-black' : ''}`}
            >
              {selectedYear} Year
            </button>
          </>
        )}
        
        {selectedResource && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 animate-in fade-in" />
            <button
              onClick={() => {
                setSelectedBranch(null);
                setSearchParams({});
              }}
              className={`hover:text-primary transition-colors uppercase tracking-wider ${!selectedBranch ? 'text-primary font-black' : ''}`}
            >
              {selectedResource}
            </button>
          </>
        )}

        {selectedBranch && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 animate-in fade-in" />
            <span className="text-primary font-black uppercase tracking-wider animate-in fade-in">
              {selectedBranch.split(' / ')[0]}
            </span>
          </>
        )}
      </div>
    );
  };

  // Render Built-in Image Viewer
  const renderImageViewer = (doc: CalendarDoc) => {
    const imagesList = doc.images || ['/mock_timetable.png'];
    const totalPages = imagesList.length;

    const imageStyle = {
      transform: `translate(${imgPanX}px, ${imgPanY}px) scale(${imgZoomScale}) rotate(${imgRotation}deg)`,
      transformOrigin: 'center center',
      transition: isDragging ? 'none' : 'transform 0.15s ease-out'
    };

    return (
      <div className={`flex flex-col bg-slate-800 text-white rounded-3xl border border-slate-700/60 shadow-lg overflow-hidden transition-all ${
        isImgFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[400px]'
      }`}>
        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3.5 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-0.5 border border-slate-700/50">
            <button 
              onClick={() => setImgZoomScale(prev => Math.max(0.6, prev - 0.1))}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[10px] font-bold min-w-[36px] text-center">
              {Math.round(imgZoomScale * 100)}%
            </span>
            <button 
              onClick={() => setImgZoomScale(prev => Math.min(2.5, prev + 0.1))}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setImgRotation(prev => (prev + 90) % 360)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-colors active:scale-95 flex items-center gap-1"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-bold">Rotate</span>
            </button>

            <button
              onClick={resetImageState}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-colors active:scale-95 flex items-center gap-1"
              title="Reset View"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-bold">Reset</span>
            </button>
          </div>

          <button
            onClick={() => setIsImgFullScreen(!isImgFullScreen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ml-auto sm:ml-0"
          >
            {isImgFullScreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">Fullscreen</span>
              </>
            )}
          </button>
        </div>

        {/* Image view pane */}
        <div 
          className="flex-1 bg-slate-700 p-6 overflow-hidden flex items-center justify-center relative cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            style={imageStyle}
            className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-300/80 p-2 overflow-hidden pointer-events-none"
          >
            <img 
              src={imagesList[imgPage - 1]} 
              alt={`${doc.type} Page ${imgPage}`}
              className="w-full h-auto object-contain rounded-xl select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-800 text-[10px] text-slate-400">
          <span>Official Academic Registry ({doc.fileType} Format)</span>
          <span className="font-bold">Page {imgPage} of {totalPages}</span>
        </div>
      </div>
    );
  };

  // Render Built-in PDF Viewer (simulating formal PDF document view)
  const renderPdfViewer = (doc: CalendarDoc) => {
    const preview = doc.previewData;

    const zoomStyle = {
      transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
      transformOrigin: 'top center',
      transition: 'transform 0.2s ease-in-out'
    };

    const isSyllabus = doc.type === 'Syllabus';

    return (
      <div className={`flex flex-col bg-slate-800 text-white rounded-3xl border border-slate-700/60 shadow-lg overflow-hidden transition-all ${
        isPdfFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[400px]'
      }`}>
        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3.5 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-0.5 border border-slate-700/50">
            <button 
              onClick={() => setZoomScale(prev => Math.max(0.8, prev - 0.1))}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[10px] font-bold min-w-[36px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button 
              onClick={() => setZoomScale(prev => Math.min(1.5, prev + 0.1))}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-colors active:scale-95 flex items-center gap-1"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-bold">Rotate</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-0.5 border border-slate-700/50">
              <button
                disabled={pdfPage === 1}
                onClick={() => setPdfPage(1)}
                className={`p-2 rounded-lg transition-colors ${pdfPage === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95'}`}
              >
                <ChevronLeftSquare className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold font-mono text-[10px]">
                {pdfPage} / 2
              </span>
              <button
                disabled={pdfPage === 2}
                onClick={() => setPdfPage(2)}
                className={`p-2 rounded-lg transition-colors ${pdfPage === 2 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95'}`}
              >
                <ChevronRightSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsPdfFullScreen(!isPdfFullScreen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ml-auto sm:ml-0"
          >
            {isPdfFullScreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">Fullscreen</span>
              </>
            )}
          </button>
        </div>

        {/* PDF Sheet page view */}
        <div className="flex-1 bg-slate-700 p-6 overflow-auto flex items-start justify-center">
          <div 
            style={zoomStyle}
            className="w-full max-w-[520px] min-h-[500px] bg-white text-slate-800 p-8 rounded-2xl shadow-xl border border-slate-300/80 font-serif flex flex-col gap-6 text-center select-none relative animate-in zoom-in-98"
          >
            {/* Stamp Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none rotate-[20deg]">
              <span className="text-4xl font-black text-slate-900 tracking-[0.2em] uppercase">
                {isSyllabus ? 'SYLLABUS COPY' : 'OFFICIAL PLANNER'}
              </span>
            </div>

            {/* Header stamps */}
            <div className="border-b-2 border-double border-slate-400 pb-3">
              <h1 className="text-[12px] font-black tracking-wide text-slate-900 uppercase">JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY KAKINADA</h1>
              <h2 className="text-[10px] font-bold text-slate-600 uppercase mt-0.5">
                {isSyllabus ? 'Office of the Director of Evaluation & Academic Audit' : 'Office of the Director of Academics & Planning'}
              </h2>
              <h3 className="text-[10px] font-bold text-slate-800 uppercase mt-1.5 bg-slate-100 py-1 px-2.5 rounded w-fit mx-auto border border-slate-200">
                {preview.title}
              </h3>
            </div>

            {/* Document stats */}
            <div className="flex justify-between items-center text-left text-[10px] font-sans text-slate-500 border-b border-slate-100 pb-2">
              <div>
                <div><strong>Resource Type:</strong> {doc.type} {doc.classType ? `(${doc.classType.split(' / ')[0]})` : ''}</div>
                <div><strong>Academic Year:</strong> {doc.academicYear}</div>
              </div>
              <div className="text-right">
                <div><strong>Revision:</strong> Ver {doc.version}.0</div>
                <div><strong>Updated Date:</strong> {doc.lastUpdated}</div>
              </div>
            </div>

            {/* Data Schedule Table */}
            <div className="overflow-x-auto text-left flex-1">
              <table className="w-full text-center border-collapse border border-slate-300 font-sans text-[10px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold">
                    <th className="border border-slate-300 p-2 text-left">{isSyllabus ? 'Course / Subject Title' : 'Activity / Event'}</th>
                    <th className="border border-slate-300 p-2">{isSyllabus ? 'Course Code' : 'Scheduled Dates'}</th>
                    <th className="border border-slate-300 p-2">{isSyllabus ? 'Credits' : 'Duration'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(pdfPage === 1 ? preview.items.slice(0, 4) : preview.items.slice(4)).map((item, idx) => (
                    <tr key={idx} className="text-slate-800 font-medium">
                      <td className="border border-slate-300 p-2 text-left font-semibold">{item.event}</td>
                      <td className="border border-slate-300 p-2">{item.dates}</td>
                      <td className="border border-slate-300 p-2 text-slate-500">{item.duration || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Coordinator seal & verified stamp */}
            <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between items-end text-[9px] font-sans text-slate-400">
              <div className="text-center">
                <div className="w-16 border-b border-slate-200 h-6 flex items-end justify-center italic text-slate-300">
                  {isSyllabus ? 'Chairman' : 'Director'}
                </div>
                <span className="mt-0.5 block">{isSyllabus ? 'Board of Studies' : 'Director of Academics'}</span>
              </div>

              <div className="flex flex-col items-center border border-emerald-500/80 bg-emerald-50/40 p-1.5 rounded-lg text-emerald-800 text-[8px]">
                <div className="flex items-center gap-0.5 font-extrabold">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> JNTUK SECURE
                </div>
                <div className="text-[6px] font-mono text-emerald-600/70">VERIFIED OFFICIAL</div>
              </div>

              <div className="text-center">
                <div className="w-16 border-b border-slate-200 h-6 flex items-end justify-center italic text-slate-300">Registrar</div>
                <span className="mt-0.5 block font-bold">Registrar JNTUK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer page info */}
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-800 text-[10px] text-slate-400">
          <span>Official JNTUK Academic Registry</span>
          <span className="font-bold">Page {pdfPage} of 2</span>
        </div>
      </div>
    );
  };

  // Render Version History Dialog
  const renderVersionHistory = () => {
    if (!showVersionHistory) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-card rounded-[2rem] border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-base font-extrabold text-foreground">Repository Version History</h3>
            </div>
            <button 
              onClick={() => setShowVersionHistory(false)}
              className="p-1 text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-full transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            <div className="p-3 bg-secondary/40 border border-border rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-foreground">Current Version (v2.0)</span>
                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">Active</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Uploaded: 10 June 2026</p>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">Revised spells of instruction and syllabus credit frames.</p>
            </div>

            <div className="p-3 bg-secondary/10 border border-border/50 rounded-2xl space-y-1 opacity-75">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-muted-foreground">Revision v1.0</span>
                <span className="text-[9px] font-black uppercase text-muted-foreground bg-secondary px-2 py-0.2 rounded-full">Superseded</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60">Uploaded: 01 June 2026</p>
              <p className="text-xs text-muted-foreground/75 leading-relaxed pt-1">Initial syllabus release for freshman & B.Tech board curriculums.</p>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2 bg-secondary/30 p-3 rounded-2xl border border-border/60">
            <Info className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
            <p>Older revision copies are archived securely. Students are served the latest active revision copies automatically. Contact admin office for archives.</p>
          </div>

          <button
            onClick={() => setShowVersionHistory(false)}
            className="w-full py-3 bg-secondary text-secondary-foreground font-bold text-xs rounded-xl active:scale-95 transition-all"
          >
            Close Version Log
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="cs-page pb-24 overflow-x-hidden animate-in fade-in duration-300">
      
      {/* Back navigation & Simulated offline mode toggle */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-center justify-between mb-1">
          {selectedRepo ? (
            <button 
              onClick={handleBackNavigation} 
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <BackButton />
          )}

          <button 
            onClick={() => {
              setIsOfflineSimulated(!isOfflineSimulated);
              toast.info(isOfflineSimulated ? 'Online Mode Restored' : 'Simulating Offline Mode (No Internet)');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
              isOfflineSimulated 
                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            }`}
          >
            {isOfflineSimulated ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-600" /> Simulated Offline
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-600" /> Live Connection
              </>
            )}
          </button>
        </div>
        {renderBreadcrumbs()}
      </div>

      {/* SCREEN 5: DETAILED DOCUMENT VIEWER */}
      {selectedRepo && (
        selectedRepo === 'Holidays List' || 
        (selectedRepo === 'Academic Resources' && selectedYear && selectedResource && (
          selectedResource === 'Academic Calendar' || 
          (selectedResource === 'Syllabus' && (selectedYear === 1 || selectedBranch !== null))
        ))
      ) ? (
        (() => {
          if (!currentDoc) {
            return (
              <div className="text-center p-8 bg-card border border-border rounded-[2rem] shadow-sm flex flex-col items-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="font-extrabold text-sm text-foreground">Resource not uploaded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Please select another academic year or document repository.</p>
                <button 
                  onClick={handleBackNavigation}
                  className="mt-4 px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl active:scale-95 transition-transform"
                >
                  Go Back
                </button>
              </div>
            );
          }

          const hasOfflineCopy = offlineIds.includes(currentDoc.id);
          const accessible = isDocumentAccessible(currentDoc);

          return (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
              
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  Academic Year {currentDoc.academicYear}
                </span>
                <h1 className="text-2xl font-black text-foreground mt-3 tracking-tight leading-tight">
                  {currentDoc.year ? `Year ${currentDoc.year} • ` : ''}{currentDoc.type === 'Holidays List' ? 'Holiday List' : currentDoc.type}
                </h1>
                
                {currentDoc.classType && (
                  <p className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wider mt-1">
                    Class: {currentDoc.classType}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Official Document
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <span>Revision: v{currentDoc.version}.0</span>
                </div>
              </div>

              {!accessible ? (
                <div className="bg-card border-2 border-dashed border-amber-300 rounded-[2rem] p-8 text-center space-y-4 flex flex-col items-center">
                  <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
                    <WifiOff className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">Offline Access Restricted</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                    This academic document has not been cached offline. Save it offline while online to access it without internet.
                  </p>
                  <button
                    onClick={() => toggleSaveOffline(currentDoc.id)}
                    className="px-5 py-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                  >
                    Save Offline Anyway
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      {currentDoc.fileType === 'PDF' ? (
                        <>
                          <FileText className="w-3.5 h-3.5 text-red-500" /> Integrated PDF Viewer
                        </>
                      ) : (
                        <>
                          <Folder className="w-3.5 h-3.5 text-blue-500" /> Universal Image Viewer
                        </>
                      )}
                    </h3>
                    {currentDoc.fileType === 'PDF' 
                      ? renderPdfViewer(currentDoc) 
                      : renderImageViewer(currentDoc)
                    }
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDownload(currentDoc)}
                      className="py-4 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg shadow-primary/10 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download {currentDoc.fileType}
                    </button>
                    <button
                      onClick={() => toggleSaveOffline(currentDoc.id)}
                      className={`py-4 font-bold text-xs rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 border ${
                        hasOfflineCopy 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                          : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Wifi className="w-4 h-4" />
                      {hasOfflineCopy ? 'Delete Offline Copy' : 'Save Offline'}
                    </button>
                    <button
                      onClick={() => handleShare(currentDoc)}
                      className="col-span-2 py-3.5 bg-secondary text-secondary-foreground border border-border font-bold text-xs rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" /> Share Document Link
                    </button>
                    
                    {pinnedIds.includes(currentDoc.id) ? (
                      <>
                        <button
                          disabled
                          className="py-3.5 bg-amber-500/10 border border-amber-300/60 text-amber-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 opacity-80 cursor-default animate-in fade-in"
                        >
                          <Pin className="w-4 h-4 fill-amber-600 text-amber-600" />
                          Pinned Resource
                        </button>
                        <button
                          onClick={() => handleUnpin(currentDoc.id)}
                          className="py-3.5 bg-card border border-red-200 text-red-600 hover:bg-red-50/50 font-bold text-xs rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2 animate-in fade-in"
                        >
                          <PinOff className="w-4 h-4" />
                          Remove Pin
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handlePin(currentDoc.id)}
                        className="col-span-2 py-3.5 bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2 animate-in fade-in"
                      >
                        <Pin className="w-4 h-4" />
                        Pin Document
                      </button>
                    )}
                  </div>

                  <div className="p-4 bg-secondary/35 border border-border/80 rounded-2xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground whitespace-pre-line leading-relaxed font-semibold">
                      This calendar repository provides the verified schedules uploaded by the planning board. Please verify with notice boards for final adjustments.
                    </p>
                  </div>
                </>
              )}
            </div>
          );
        })()
      ) : selectedRepo === 'Academic Resources' && selectedYear && selectedResource === 'Syllabus' && selectedYear > 1 && !selectedBranch ? (
        /* SCREEN 4: SYLLABUS DEPARTMENT SELECTION (FOR YEARS 2, 3, 4) */
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">{selectedYear} Year Syllabus</h1>
            <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mt-1">
              Select Department
            </p>
          </div>

          <div className="space-y-4">
            {SYLLABUS_BRANCHES.map((branch) => {
              const doc = CALENDAR_DATABASE.find(d => 
                d.year === selectedYear && 
                d.type === 'Syllabus' && 
                d.classType === branch.name
              );
              const lastUpdated = doc ? doc.lastUpdated : '10 June 2026';
              const isOffline = doc ? offlineIds.includes(doc.id) : false;
              const isPinned = doc ? pinnedIds.includes(doc.id) : false;

              return (
                <div
                  key={branch.id}
                  onClick={() => {
                    setSelectedBranch(branch.name);
                    if (doc) {
                      addToRecentlyViewed(doc.id);
                      setSearchParams({ doc: doc.id });
                    }
                  }}
                  className={`group cs-interactive-card flex items-center justify-between p-5 rounded-[2rem] bg-card border-2 ${branch.accentColor} shadow-sm hover:border-border/80 active:scale-95 transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-4 min-w-0 mr-4">
                    <div className={`w-12 h-12 rounded-2xl ${branch.iconBg} ${branch.iconColor} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0`}>
                      <Folder className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-bold">Syllabus Sheet</span>
                        {isOffline && (
                          <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5 animate-in fade-in shrink-0">
                            <Wifi className="w-2 h-2" /> Cached
                          </span>
                        )}
                        {isPinned && (
                          <span className="bg-amber-500/10 text-amber-700 text-[8px] font-black uppercase px-2 py-0.2 rounded border border-amber-500/20 flex items-center gap-0.5 animate-in fade-in shrink-0">
                            <Pin className="w-2 h-2 fill-current" /> Pinned
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-black text-foreground leading-tight mt-0.5 truncate">{branch.name}</h2>
                      <span className="text-[10px] font-bold text-muted-foreground block mt-1 uppercase tracking-tight truncate">
                        Official department curriculum
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider shrink-0">
                      Rev: {lastUpdated}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : selectedRepo === 'Academic Resources' && selectedYear && !selectedResource ? (
        /* SCREEN 3: RESOURCE SELECTION (ACADEMIC CALENDAR & SYLLABUS) */
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">{selectedYear} Year</h1>
            <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mt-1">
              Select Resource Type
            </p>
          </div>

          <div className="space-y-4">
            {CALENDAR_RESOURCES.map((res) => {
              // Fetch doc for Year 1 directly, or Academic Calendar directly for Year 2-4
              const doc = selectedYear === 1 || res.type === 'Academic Calendar'
                ? CALENDAR_DATABASE.find(d => d.year === selectedYear && d.type === res.type)
                : null;

              const lastUpdated = doc ? doc.lastUpdated : '10 June 2026';
              const isOffline = doc ? offlineIds.includes(doc.id) : false;
              const isPinned = doc ? pinnedIds.includes(doc.id) : false;

              return (
                <div
                  key={res.type}
                  onClick={() => {
                    setSelectedResource(res.type);
                    if (doc) {
                      addToRecentlyViewed(doc.id);
                      setSearchParams({ doc: doc.id });
                    }
                  }}
                  className="group cs-interactive-card flex items-center justify-between p-5 rounded-[2rem] bg-card border border-border shadow-sm hover:border-border/80 active:scale-95 transition-all cursor-pointer w-full min-w-0"
                >
                  <div className="flex items-center gap-4 min-w-0 mr-4">
                    <div className={`w-12 h-12 rounded-2xl ${res.iconBg} ${res.iconColor} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0`}>
                      <res.icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Official resource</span>
                        {isOffline && (
                          <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5 shrink-0">
                            <Wifi className="w-2 h-2" /> Cached
                          </span>
                        )}
                        {isPinned && (
                          <span className="bg-amber-500/10 text-amber-700 text-[8px] font-black uppercase px-2 py-0.2 rounded border border-amber-500/20 flex items-center gap-0.5 shrink-0">
                            <Pin className="w-2 h-2 fill-current" /> Pinned
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-black text-foreground leading-tight mt-0.5 truncate">{res.name}</h2>
                      <span className="text-[10px] font-bold text-muted-foreground block mt-1 font-semibold leading-snug line-clamp-2 whitespace-normal">
                        {res.desc}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {doc && (
                      <span className="hidden sm:inline text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider shrink-0">
                        Rev: {lastUpdated}
                      </span>
                    )}
                    <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : selectedRepo === 'Academic Resources' && !selectedYear ? (
        /* SCREEN 2: YEAR SELECTION */
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Academic Resources</h1>
            <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mt-1">
              Select Curriculum Year
            </p>
          </div>

          <div className="space-y-4">
            {CALENDAR_YEARS.map((year, idx) => (
              <div 
                key={year.id} 
                onClick={() => setSelectedYear(year.id)}
                className="group cs-interactive-card flex items-center justify-between p-5 rounded-[2rem] bg-card border border-border shadow-sm hover:border-border/80 active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500 w-full min-w-0"
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-4 min-w-0 mr-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${year.iconBg} ${year.iconColor} group-hover:scale-110 transition-transform shadow-inner shrink-0`}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/70 block">Official Syllabus & calendars</span>
                    <h2 className="text-lg font-black text-foreground mt-0.5 leading-tight truncate">{year.title}</h2>
                    <span className="text-[10px] font-bold text-muted-foreground block mt-1 font-semibold truncate">
                      Browse Calendars & Syllabus
                    </span>
                  </div>
                </div>
                
                <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SCREEN 1: ACADEMIC REPOSITORY LANDING */
        <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
          
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Academic Repository</h1>
            <p className="text-sm font-semibold text-muted-foreground tracking-tight mt-1">
              Syllabus Curriculum, calendars, and holidays
            </p>
          </div>

          {/* Pinned Resources Section (Support multiple pins) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 rotate-45 shrink-0" />
              Pinned Resources
            </h3>
            
            {pinnedIds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pinnedIds
                  .map(id => CALENDAR_DATABASE.find(d => d.id === id))
                  .filter((doc): doc is CalendarDoc => !!doc)
                  .map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => selectDocumentDirect(doc)}
                      className="group cs-interactive-card flex items-center justify-between p-4 rounded-[1.8rem] bg-gradient-to-br from-amber-500/5 via-amber-500/[0.01] to-transparent border-2 border-amber-500/20 shadow-sm hover:border-amber-500/40 relative overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-[0.01] group-hover:opacity-[0.04] transition-opacity">
                        <Pin className="w-16 h-16 text-amber-500 rotate-45 fill-current" />
                      </div>
                      
                      <div className="flex items-center gap-3 z-10 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner shrink-0">
                          <Pin className="w-5 h-5 rotate-45 fill-current" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">Pinned</span>
                            <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded border flex items-center gap-0.5 ${
                              doc.fileType === 'PDF' 
                                ? 'bg-red-500/10 text-red-700 border-red-500/20' 
                                : 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                            }`}>
                              {doc.fileType === 'PDF' ? 'PDF' : doc.fileType}
                            </span>
                          </div>
                          <h2 className="text-sm font-black text-foreground mt-0.5 truncate leading-tight">
                            {doc.year ? `Year ${doc.year}` : 'University'} • {doc.type === 'Holidays List' ? 'Holiday List' : doc.type}
                          </h2>
                          {doc.classType && (
                            <p className="text-[8px] font-extrabold text-muted-foreground uppercase truncate mt-0.5">
                              {doc.classType}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 z-10 shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnpin(doc.id);
                          }}
                          className="p-1.5 bg-secondary/80 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-all active:scale-95 border border-border/50"
                          title="Remove Pin"
                        >
                          <PinOff className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/80 rounded-[2rem] bg-secondary/15 p-8 text-center space-y-4 flex flex-col items-center">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
                  <Pin className="w-6 h-6 rotate-45" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-foreground">No Pinned Resources</h4>
                  <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                    Pin your current syllabus, academic calendar, or holidays list for instant access.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Primary Directories (Academic Resources and Holiday List stacked vertically) */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              document repositories
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* Academic Resources Card */}
              <div
                onClick={() => setSelectedRepo('Academic Resources')}
                className="group cs-interactive-card flex flex-col justify-between p-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-primary/20 rounded-[2rem] shadow-sm cursor-pointer active:scale-[0.98] transition-all overflow-hidden relative min-h-[140px] w-full"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <GraduationCap className="w-24 h-24 text-primary" />
                </div>

                <div className="flex items-center gap-4 mb-3 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-0.5">Year folders</span>
                    <span className="text-lg font-black text-foreground leading-tight truncate">Academic Resources</span>
                  </div>
                </div>

                <div className="flex items-center justify-between z-10 mt-2">
                  <span className="text-[11px] font-semibold text-muted-foreground border border-border/50 bg-background/50 px-2.5 py-1 rounded-lg backdrop-blur-sm truncate mr-4">
                    Official syllabi, academic calendars, and curriculum documents
                  </span>
                  <ChevronRight className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1 shrink-0" />
                </div>
              </div>

              {/* Holiday List Card */}
              <div
                onClick={() => {
                  setSelectedRepo('Holidays List');
                  const doc = CALENDAR_DATABASE.find(d => d.type === 'Holidays List');
                  if (doc) addToRecentlyViewed(doc.id);
                  setSearchParams({ doc: 'holidays-list' });
                }}
                className="group flex flex-col justify-between p-6 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-emerald-500/20 rounded-[2rem] shadow-sm cursor-pointer active:scale-[0.98] transition-all overflow-hidden relative min-h-[140px] w-full"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Palmtree className="w-24 h-24 text-emerald-500" />
                </div>

                <div className="flex items-center gap-4 mb-3 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Palmtree className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-0.5">Shared</span>
                    <span className="text-lg font-black text-foreground leading-tight truncate">Holiday List</span>
                  </div>
                </div>

                <div className="flex items-center justify-between z-10 mt-2">
                  <span className="text-[11px] font-semibold text-muted-foreground border border-border/50 bg-background/50 px-2.5 py-1 rounded-lg backdrop-blur-sm truncate mr-4">
                    Official holiday schedules and institutional holidays
                  </span>
                  <ChevronRight className="w-5 h-5 text-emerald-500/50 group-hover:text-emerald-500 transition-colors translate-x-0 group-hover:translate-x-1 shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Recently Opened */}
          {recentlyViewed.length > 0 && (
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Recently Opened
              </h3>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {recentlyViewed
                  .map(id => CALENDAR_DATABASE.find(d => d.id === id))
                  .filter((doc): doc is CalendarDoc => !!doc)
                  .map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => selectDocumentDirect(doc)}
                      className="flex-shrink-0 w-36 bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm hover:border-primary/20 active:scale-95 transition-all cursor-pointer space-y-2 relative group animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 bg-secondary px-1.5 py-0.2 rounded border border-border/50">
                          {doc.year ? `Year ${doc.year}` : 'Shared'} • {doc.fileType}
                        </span>
                        {doc.fileType === 'PDF' ? (
                          <FileText className="w-4 h-4 text-red-500/70" />
                        ) : (
                          <Folder className="w-4 h-4 text-blue-500/70" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-extrabold text-foreground truncate">{doc.type === 'Holidays List' ? 'Holiday List' : doc.type}</h4>
                        <p className="text-[9px] text-muted-foreground font-semibold truncate mt-0.5">
                          {doc.classType ? doc.classType.split(' / ')[0] : doc.academicYear}
                        </p>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-border/50 my-1" />

          {/* Bottom footer and version log */}
          <div className="flex flex-col items-center justify-center gap-3 pt-3 text-center">
            <button
              onClick={() => setShowVersionHistory(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline hover:text-primary-foreground/90 transition-all bg-primary/5 px-4 py-2.5 rounded-xl border border-primary/10 active:scale-95"
            >
              <History className="w-4 h-4" />
              Repository Info & Version History
            </button>
            <p className="text-[9px] text-muted-foreground/60 leading-relaxed font-semibold max-w-[280px]">
              CampusSync Academic repository library v2.0. All documents are digitally verified copies of official JNTUK board publications.
            </p>
          </div>

          {renderVersionHistory()}
        </div>
      )}

    </div>
  );
};

export default CalendarPage;
