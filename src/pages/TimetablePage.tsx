import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  GraduationCap, 
  School, 
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
  FileDown,
  Info,
  Calendar,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeftSquare,
  ChevronRightSquare,
  WifiOff,
  Wifi,
  X
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

// Helper types for the document repository
interface TimetableVersion {
  version: number;
  uploadDate: string;
  notes: string;
}

interface TimetableDoc {
  id: string;
  year: number; // 1, 2, 3, 4
  semester: string; // 'Semester 1-1', 'Semester 1-2', etc.
  department: string; // 'CSE / CSE ICP' | 'AIML / AIML ICP'
  academicYear: string;
  fileType: string; // 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'WEBP'
  uploadedBy: string;
  lastUpdated: string;
  version: number;
  isVerified: boolean;
  description: string;
  versions: TimetableVersion[];
  schedulePreview: {
    days: string[];
    timeSlots: string[];
    classes: { day: string; time: string; subject: string; room: string }[];
    labInstructions: string[];
  };
  images?: string[];
}

// Dynamic preview generator for mock timetable pages (Supports 2-page view)
const generateSchedulePreview = (dept: string, semester: string) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const timeSlots = ['09:00 - 10:30', '10:45 - 12:15', '01:30 - 03:00', '03:15 - 04:45'];
  
  const subjects = dept.includes('CSE') 
    ? ['Data Structures', 'Java Programming', 'Computer Networks', 'Operating Systems', 'Web Technologies', 'Software Engineering']
    : ['Python Coding', 'Machine Learning', 'Deep Learning', 'Neural Networks', 'AI Ethics', 'Computer Vision'];
  
  const classes: { day: string; time: string; subject: string; room: string }[] = [];
  
  days.forEach((day, dIdx) => {
    timeSlots.forEach((slot, sIdx) => {
      if ((dIdx + sIdx) % 4 !== 3) {
        const subIdx = (dIdx * 2 + sIdx) % subjects.length;
        const isLab = sIdx === 2 && dIdx % 2 === 0;
        classes.push({
          day,
          time: slot,
          subject: isLab ? `${subjects[subIdx]} Lab` : subjects[subIdx],
          room: isLab ? `${dept.includes('CSE') ? 'CS' : 'AI'}-Lab-${(dIdx % 2) + 1}` : `LH-${300 + (dIdx * 5) + sIdx}`
        });
      }
    });
  });

  const labInstructions = dept.includes('CSE')
    ? [
        "1. All lab sessions are mandatory; minimum 75% attendance is required.",
        "2. Students must wear standard laboratory lab coats and bring record notebooks.",
        "3. System setups are allocated by roll number. Do not swap terminals without permission.",
        "4. Weekly reviews will contribute 20% to the continuous internal evaluation grade."
      ]
    : [
        "1. Ensure Python dependencies (PyTorch, TensorFlow) are updated before class.",
        "2. Record notebooks must be updated weekly and verified by the Lab Instructor.",
        "3. System setups in the AI Lab are restricted to designated projects only.",
        "4. Lab internals will be conducted during the 15th week of the semester."
      ];
  
  return { days, timeSlots, classes, labInstructions };
};

// Official Timetable Document Mock Database (Complete Year -> Semester -> Department mapping)
const TIMETABLE_DATABASE: TimetableDoc[] = [
  // Year 1 CSE
  {
    id: 'y1-cse-sem-1-1',
    year: 1,
    semester: 'Semester 1-1',
    department: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '15 June 2026',
    version: 3,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 3, uploadDate: '15 June 2026', notes: 'Revised room allocations and lab groups.' },
      { version: 2, uploadDate: '10 June 2026', notes: 'Adjusted afternoon slots for engineering drawing.' },
      { version: 1, uploadDate: '01 June 2026', notes: 'Initial release of freshman schedule.' }
    ],
    schedulePreview: generateSchedulePreview('CSE / CSE ICP', 'Semester 1-1')
  },
  {
    id: 'y1-cse-sem-1-2',
    year: 1,
    semester: 'Semester 1-2',
    department: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PNG',
    uploadedBy: 'Department Office',
    lastUpdated: '12 July 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '12 July 2026', notes: 'First official release.' }
    ],
    schedulePreview: generateSchedulePreview('CSE / CSE ICP', 'Semester 1-2'),
    images: ['/mock_timetable.png', '/mock_timetable.png']
  },
  // Year 1 AIML
  {
    id: 'y1-aiml-sem-1-1',
    year: 1,
    semester: 'Semester 1-1',
    department: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '14 June 2026',
    version: 2,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 2, uploadDate: '14 June 2026', notes: 'Corrected python programming instructor.' },
      { version: 1, uploadDate: '02 June 2026', notes: 'Initial schedule release.' }
    ],
    schedulePreview: generateSchedulePreview('AIML / AIML ICP', 'Semester 1-1')
  },
  {
    id: 'y1-aiml-sem-1-2',
    year: 1,
    semester: 'Semester 1-2',
    department: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '10 July 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '10 July 2026', notes: 'First official release.' }
    ],
    schedulePreview: generateSchedulePreview('AIML / AIML ICP', 'Semester 1-2')
  },
  // Year 2 CSE
  {
    id: 'y2-cse-sem-2-1',
    year: 2,
    semester: 'Semester 2-1',
    department: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '18 June 2026',
    version: 2,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 2, uploadDate: '18 June 2026', notes: 'Rescheduled Wednesday DBMS lab.' },
      { version: 1, uploadDate: '05 June 2026', notes: 'Initial schedule.' }
    ],
    schedulePreview: generateSchedulePreview('CSE / CSE ICP', 'Semester 2-1')
  },
  {
    id: 'y2-cse-sem-2-2',
    year: 2,
    semester: 'Semester 2-2',
    department: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '11 July 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '11 July 2026', notes: 'First release.' }
    ],
    schedulePreview: generateSchedulePreview('CSE / CSE ICP', 'Semester 2-2')
  },
  // Year 2 AIML
  {
    id: 'y2-aiml-sem-2-1',
    year: 2,
    semester: 'Semester 2-1',
    department: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'JPG',
    uploadedBy: 'Department Office',
    lastUpdated: '16 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '16 June 2026', notes: 'Initial release.' }
    ],
    schedulePreview: generateSchedulePreview('AIML / AIML ICP', 'Semester 2-1'),
    images: ['/mock_timetable.png']
  },
  {
    id: 'y2-aiml-sem-2-2',
    year: 2,
    semester: 'Semester 2-2',
    department: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '10 July 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '10 July 2026', notes: 'First release.' }
    ],
    schedulePreview: generateSchedulePreview('AIML / AIML ICP', 'Semester 2-2')
  },
  // Year 3 CSE
  {
    id: 'y3-cse-sem-3-1',
    year: 3,
    semester: 'Semester 3-1',
    department: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '22 June 2026',
    version: 2,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 2, uploadDate: '22 June 2026', notes: 'Updated slot for Software Engineering elective.' },
      { version: 1, uploadDate: '07 June 2026', notes: 'Initial draft for juniors.' }
    ],
    schedulePreview: generateSchedulePreview('CSE / CSE ICP', 'Semester 3-1')
  },
  {
    id: 'y3-cse-sem-3-2',
    year: 3,
    semester: 'Semester 3-2',
    department: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '15 July 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '15 July 2026', notes: 'First release.' }
    ],
    schedulePreview: generateSchedulePreview('CSE / CSE ICP', 'Semester 3-2')
  },
  // Year 3 AIML
  {
    id: 'y3-aiml-sem-3-1',
    year: 3,
    semester: 'Semester 3-1',
    department: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '24 June 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '24 June 2026', notes: 'Initial release.' }
    ],
    schedulePreview: generateSchedulePreview('AIML / AIML ICP', 'Semester 3-1')
  },
  {
    id: 'y3-aiml-sem-3-2',
    year: 3,
    semester: 'Semester 3-2',
    department: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '12 July 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '12 July 2026', notes: 'First release.' }
    ],
    schedulePreview: generateSchedulePreview('AIML / AIML ICP', 'Semester 3-2')
  },
  // Year 4 CSE
  {
    id: 'y4-cse-sem-4-1',
    year: 4,
    semester: 'Semester 4-1',
    department: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '20 June 2026',
    version: 3,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 3, uploadDate: '20 June 2026', notes: 'Integrated project review hours.' },
      { version: 2, uploadDate: '15 June 2026', notes: 'Cloud computing slot shifted.' },
      { version: 1, uploadDate: '01 June 2026', notes: 'First release.' }
    ],
    schedulePreview: generateSchedulePreview('CSE / CSE ICP', 'Semester 4-1')
  },
  {
    id: 'y4-cse-sem-4-2',
    year: 4,
    semester: 'Semester 4-2',
    department: 'CSE / CSE ICP',
    academicYear: '2025-2026',
    fileType: 'WEBP',
    uploadedBy: 'Department Office',
    lastUpdated: '18 July 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '18 July 2026', notes: 'First release.' }
    ],
    schedulePreview: generateSchedulePreview('CSE / CSE ICP', 'Semester 4-2'),
    images: ['/mock_timetable.png']
  },
  // Year 4 AIML
  {
    id: 'y4-aiml-sem-4-1',
    year: 4,
    semester: 'Semester 4-1',
    department: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '22 June 2026',
    version: 2,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 2, uploadDate: '22 June 2026', notes: 'Corrected review committee list.' },
      { version: 1, uploadDate: '05 June 2026', notes: 'Initial release.' }
    ],
    schedulePreview: generateSchedulePreview('AIML / AIML ICP', 'Semester 4-1')
  },
  {
    id: 'y4-aiml-sem-4-2',
    year: 4,
    semester: 'Semester 4-2',
    department: 'AIML / AIML ICP',
    academicYear: '2025-2026',
    fileType: 'PDF',
    uploadedBy: 'Department Office',
    lastUpdated: '20 July 2026',
    version: 1,
    isVerified: true,
    description: 'Official Class & Lab Schedule',
    versions: [
      { version: 1, uploadDate: '20 July 2026', notes: 'First release.' }
    ],
    schedulePreview: generateSchedulePreview('AIML / AIML ICP', 'Semester 4-2')
  }
];

const TIMETABLE_YEARS = [
  { id: 1, title: '1st Year', badge: 'B.Tech', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
  { id: 2, title: '2nd Year', badge: 'B.Tech', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { id: 3, title: '3rd Year', badge: 'B.Tech', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
  { id: 4, title: '4th Year', badge: 'B.Tech', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-500' },
];

const DEPARTMENTS = [
  { id: 'cse', name: 'CSE / CSE ICP', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', accentColor: 'border-blue-200' },
  { id: 'aiml', name: 'AIML / AIML ICP', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500', accentColor: 'border-purple-200' },
];

// Helper to determine semesters based on year
const getSemestersForYear = (year: number) => {
  return [
    { title: `Semester ${year}-1`, academicRepository: `B.Tech Y${year} S1 Repository` },
    { title: `Semester ${year}-2`, academicRepository: `B.Tech Y${year} S2 Repository` }
  ];
};

const TimetablePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Navigation State (Revised Hierarchy)
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  // Pin State
  const [pinnedId, setPinnedId] = useState<string | null>(() => {
    return localStorage.getItem('campusync_pinned_timetable') || null;
  });

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('campusync_recent_timetables');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Save Offline State
  const [offlineIds, setOfflineIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('campusync_offline_timetable_ids');
      return raw ? JSON.parse(raw) : [];
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
  const [showPdfModal, setShowPdfModal] = useState(false);
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

  // Effect: Handle direct links on mount (e.g. ?doc=y1-cse-sem-1-1)
  useEffect(() => {
    const docId = searchParams.get('doc');
    if (docId) {
      const doc = TIMETABLE_DATABASE.find(d => d.id === docId);
      if (doc) {
        setSelectedYear(doc.year);
        setSelectedSemester(doc.semester);
        setSelectedDept(doc.department);
      }
    }
  }, [searchParams]);

  // Sync Pinned state
  useEffect(() => {
    if (pinnedId) {
      localStorage.setItem('campusync_pinned_timetable', pinnedId);
    } else {
      localStorage.removeItem('campusync_pinned_timetable');
    }
  }, [pinnedId]);

  // Sync Recently Viewed state
  useEffect(() => {
    localStorage.setItem('campusync_recent_timetables', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Sync Offline IDs
  useEffect(() => {
    localStorage.setItem('campusync_offline_timetable_ids', JSON.stringify(offlineIds));
  }, [offlineIds]);

  // Sync simulated offline mode
  useEffect(() => {
    localStorage.setItem('campusync_offline_simulated', isOfflineSimulated ? 'true' : 'false');
  }, [isOfflineSimulated]);

  // Find document based on current selections
  const currentDoc = TIMETABLE_DATABASE.find(d => 
    d.year === selectedYear && 
    d.semester === selectedSemester && 
    d.department === selectedDept
  );

  const selectDocumentDirect = (doc: TimetableDoc) => {
    setSelectedYear(doc.year);
    setSelectedSemester(doc.semester);
    setSelectedDept(doc.department);
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
    setPinnedId(prev => {
      if (prev !== id) {
        if (prev !== null) {
          toast.success('Pinned timetable updated successfully.');
        } else {
          toast.success('Timetable pinned successfully.');
        }
        return id;
      }
      return prev;
    });
  };

  const handleUnpin = (id: string) => {
    setPinnedId(prev => {
      if (prev === id) {
        toast.success('Pinned timetable removed.');
        return null;
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

  const toggleSaveOffline = (id: string) => {
    let isSaved = false;
    setOfflineIds(prev => {
      if (prev.includes(id)) {
        toast.success('Offline copy deleted');
        return prev.filter(item => item !== id);
      } else {
        toast.success('Saved Offline Successfully!', {
          description: 'Document cached. Access it anytime without internet.'
        });
        isSaved = true;
        return [...prev, id];
      }
    });
  };

  const handleDownload = (doc: TimetableDoc) => {
    toast.success(`${doc.fileType} Download Completed`, {
      description: `Saved ${doc.department.split(' / ')[0]}_${doc.semester}.${doc.fileType.toLowerCase()} successfully.`
    });
  };

  const handleShare = (doc: TimetableDoc) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?doc=${doc.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${doc.department} Timetable`,
        text: `Official ${doc.semester} schedule for ${doc.department}.`,
        url: shareUrl
      }).then(() => {
        toast.success('Shared successfully');
      }).catch((err) => {
        // Fall back to copy
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Shareable Link Copied!', {
        description: 'You can now share this direct timetable link.'
      });
    });
  };

  const handleBackNavigation = () => {
    if (selectedDept) {
      setSelectedDept(null);
      // Remove doc query param
      setSearchParams({});
    } else if (selectedSemester) {
      setSelectedSemester(null);
    } else if (selectedYear) {
      setSelectedYear(null);
    }
  };

  // Find pinned document
  const pinnedDoc = TIMETABLE_DATABASE.find(d => d.id === pinnedId);

  // Determine if a document is offline accessible
  const isDocumentAccessible = (doc: TimetableDoc) => {
    if (!isOfflineSimulated) return true;
    return offlineIds.includes(doc.id);
  };

  // Render breadcrumbs dynamically based on path
  const renderBreadcrumbs = () => {
    if (!selectedYear) return null;
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-extrabold mb-5 overflow-x-auto whitespace-nowrap hide-scrollbar pb-1">
        <button 
          onClick={() => {
            setSelectedYear(null);
            setSelectedSemester(null);
            setSelectedDept(null);
            setSearchParams({});
          }}
          className="hover:text-primary transition-colors uppercase tracking-wider"
        >
          Timetables
        </button>
        
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
        
        <button
          onClick={() => {
            setSelectedSemester(null);
            setSelectedDept(null);
            setSearchParams({});
          }}
          className={`hover:text-primary transition-colors uppercase tracking-wider ${!selectedSemester ? 'text-primary font-black' : ''}`}
        >
          {selectedYear} Year
        </button>
        
        {selectedSemester && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
            <button
              onClick={() => {
                setSelectedDept(null);
                setSearchParams({});
              }}
              className={`hover:text-primary transition-colors uppercase tracking-wider ${!selectedDept ? 'text-primary font-black' : ''}`}
            >
              {selectedSemester.replace('Semester ', '')}
            </button>
          </>
        )}

        {selectedDept && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
            <span className="text-primary font-black uppercase tracking-wider">
              {selectedDept.split(' / ')[0]}
            </span>
          </>
        )}
      </div>
    );
  };

  // Render Built-in Image Viewer
  const renderImageViewer = (doc: TimetableDoc) => {
    const imagesList = doc.images || ['/mock_timetable.png'];
    const totalPages = imagesList.length;

    // Zoom factor styles
    const imageStyle = {
      transform: `translate(${imgPanX}px, ${imgPanY}px) scale(${imgZoomScale}) rotate(${imgRotation}deg)`,
      transformOrigin: 'center center',
      transition: isDragging ? 'none' : 'transform 0.15s ease-out'
    };

    return (
      <div className={`flex flex-col bg-slate-800 text-white rounded-3xl border border-slate-700/60 shadow-lg overflow-hidden transition-all ${
        isImgFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[400px]'
      }`}>
        
        {/* Viewer Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3.5 border-b border-slate-800 text-xs">
          
          {/* Zoom controls */}
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

          {/* Rotate & Reset & Page Controls */}
          <div className="flex items-center gap-2">
            {/* Rotate */}
            <button
              onClick={() => setImgRotation(prev => (prev + 90) % 360)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-colors active:scale-95 flex items-center gap-1"
              title="Rotate Page"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-bold">Rotate</span>
            </button>

            {/* Reset */}
            <button
              onClick={resetImageState}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-colors active:scale-95 flex items-center gap-1"
              title="Reset View"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-bold">Reset</span>
            </button>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-0.5 border border-slate-700/50">
                <button
                  disabled={imgPage === 1}
                  onClick={() => {
                    setImgPage(1);
                    resetImageState();
                  }}
                  className={`p-2 rounded-lg transition-colors ${imgPage === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95'}`}
                >
                  <ChevronLeftSquare className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold font-mono text-[10px]">
                  {imgPage} / {totalPages}
                </span>
                <button
                  disabled={imgPage === totalPages}
                  onClick={() => {
                    setImgPage(totalPages);
                    resetImageState();
                  }}
                  className={`p-2 rounded-lg transition-colors ${imgPage === totalPages ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95'}`}
                >
                  <ChevronRightSquare className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Full Screen Mode */}
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

        {/* Scrollable Page Wrapper */}
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
          {/* Simulated Image Page Sheet */}
          <div 
            style={imageStyle}
            className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-300/80 p-2 overflow-hidden pointer-events-none"
          >
            <img 
              src={imagesList[imgPage - 1]} 
              alt={`${doc.department} Timetable Page ${imgPage}`}
              className="w-full h-auto object-contain rounded-xl select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Page Indicator Footer */}
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-800 text-[10px] text-slate-400">
          <span>Official Department Timetable Repos ({doc.fileType} Format)</span>
          <span className="font-bold">Page {imgPage} of {totalPages}</span>
        </div>

      </div>
    );
  };

  // Render Built-in PDF Viewer
  const renderPdfViewer = (doc: TimetableDoc) => {
    const { days, timeSlots, classes, labInstructions } = doc.schedulePreview;
    
    // Zoom factor styles
    const zoomStyle = {
      transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
      transformOrigin: 'top center',
      transition: 'transform 0.2s ease-in-out'
    };

    return (
      <div className={`flex flex-col bg-slate-800 text-white rounded-3xl border border-slate-700/60 shadow-lg overflow-hidden transition-all ${
        isPdfFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[400px]'
      }`}>
        
        {/* Viewer Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3.5 border-b border-slate-800 text-xs">
          
          {/* Zoom controls */}
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

          {/* Rotate & Page Controls */}
          <div className="flex items-center gap-2">
            {/* Rotate */}
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-colors active:scale-95 flex items-center gap-1"
              title="Rotate Page"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-bold">Rotate</span>
            </button>

            {/* Page navigation */}
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

          {/* Full Screen Mode */}
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

        {/* Scrollable Page Wrapper */}
        <div className="flex-1 bg-slate-700 p-6 overflow-auto flex items-start justify-center">
          
          {/* Simulated PDF Page Sheet */}
          <div 
            style={zoomStyle}
            className="w-full max-w-[520px] min-h-[500px] bg-white text-slate-800 p-8 rounded-2xl shadow-xl border border-slate-300/80 font-serif flex flex-col gap-6 text-center select-none"
          >
            
            {/* Stamp Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none rotate-[20deg]">
              <span className="text-4xl font-black text-slate-900 tracking-[0.2em] uppercase">OFFICIAL COPY</span>
            </div>

            {/* PAGE 1 CONTENT: TIMETABLE GRID */}
            {pdfPage === 1 ? (
              <>
                {/* University Header */}
                <div className="border-b-2 border-double border-slate-400 pb-3">
                  <h1 className="text-[12px] font-black tracking-wide text-slate-900 uppercase">JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY KAKINADA</h1>
                  <h2 className="text-[10px] font-bold text-slate-600 uppercase mt-0.5">University College of Engineering Kakinada</h2>
                  <h3 className="text-[10px] font-bold text-slate-800 uppercase mt-1.5 bg-slate-100 py-1 px-2.5 rounded w-fit mx-auto border border-slate-200">
                    {doc.department}
                  </h3>
                </div>

                {/* Details Meta */}
                <div className="flex justify-between items-center text-left text-[10px] font-sans text-slate-500 border-b border-slate-100 pb-2">
                  <div>
                    <div><strong>Year / Sem:</strong> {doc.semester}</div>
                    <div><strong>Academic Year:</strong> {doc.academicYear}</div>
                  </div>
                  <div className="text-right">
                    <div><strong>Revision No:</strong> Ver {doc.version}.0</div>
                    <div><strong>Revised Date:</strong> {doc.lastUpdated}</div>
                  </div>
                </div>

                {/* Schedule Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-slate-300 font-sans text-[10px]">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-300 p-1.5 font-bold w-12 text-slate-600">Day</th>
                        {timeSlots.map((slot) => (
                          <th key={slot} className="border border-slate-300 p-1.5 font-bold text-slate-600">
                            {slot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day) => (
                        <tr key={day}>
                          <td className="border border-slate-300 p-1.5 font-black bg-slate-50/50 text-slate-700">{day.toUpperCase()}</td>
                          {timeSlots.map((slot) => {
                            const classItem = classes.find(c => c.day === day && c.time === slot);
                            return (
                              <td key={slot} className="border border-slate-300 p-1 text-slate-800 font-medium">
                                {classItem ? (
                                  <div>
                                    <div className="font-extrabold text-[10px] text-slate-900 leading-tight">{classItem.subject}</div>
                                    <div className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{classItem.room}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 italic">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Institutional Seal / Stamp info */}
                <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-end text-[9px] font-sans text-slate-400">
                  <div className="text-center">
                    <div className="w-16 border-b border-slate-200 h-6 flex items-end justify-center italic text-slate-300">Coordinator</div>
                    <span className="mt-0.5 block">Academic Coordinator</span>
                  </div>

                  {/* Stamp */}
                  <div className="flex flex-col items-center border border-emerald-500/80 bg-emerald-50/40 p-1.5 rounded-lg text-emerald-800 text-[8px]">
                    <div className="flex items-center gap-0.5 font-extrabold">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> JNTUK SECURE
                    </div>
                    <div className="text-[6px] font-mono text-emerald-600/70">VERIFIED OFFICIAL</div>
                  </div>

                  <div className="text-center">
                    <div className="w-16 border-b border-slate-200 h-6 flex items-end justify-center italic text-slate-300">H. O. D.</div>
                    <span className="mt-0.5 block font-bold">Head of Dept</span>
                  </div>
                </div>
              </>
            ) : (
              /* PAGE 2 CONTENT: LAB DETAILS & INSTRUCTIONS */
              <>
                <div className="border-b-2 border-double border-slate-400 pb-3">
                  <h1 className="text-[12px] font-black tracking-wide text-slate-900 uppercase">JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY KAKINADA</h1>
                  <h2 className="text-[10px] font-bold text-slate-600 uppercase mt-0.5">Laboratory Instructions & Guidelines</h2>
                  <h3 className="text-[10px] font-bold text-slate-800 uppercase mt-1.5 bg-slate-100 py-1 px-2.5 rounded w-fit mx-auto border border-slate-200">
                    {doc.department}
                  </h3>
                </div>

                <div className="text-left space-y-4 font-sans text-xs text-slate-700 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
                    Laboratory Conduct Codes:
                  </h4>
                  <ul className="space-y-2.5 leading-relaxed font-medium">
                    {labInstructions.map((inst, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                        <p>{inst}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Administrative Note:</span>
                    Practical assessment marks depend heavily on laboratory conduct, record book completeness, and attendance margins. Students failing to log necessary records weekly will be barred from internal tests.
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between items-end text-[9px] font-sans text-slate-400">
                  <div className="text-center">
                    <div className="w-16 border-b border-slate-200 h-6 flex items-end justify-center italic text-slate-300">Office</div>
                    <span className="mt-0.5 block">Controller of Exams</span>
                  </div>

                  <div className="text-center">
                    <div className="w-16 border-b border-slate-200 h-6 flex items-end justify-center italic text-slate-300">Principal</div>
                    <span className="mt-0.5 block font-bold">Principal Office</span>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Page Indicator Footer */}
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-800 text-[10px] text-slate-400">
          <span>Official Department Timetable Repos</span>
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
                <span className="font-extrabold text-xs text-foreground">Current Version (v3.4)</span>
                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">Active</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Uploaded: 15 July 2026</p>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">Revised room allocations, lab grids, and batch guidelines for Year 1, 2, 3, 4.</p>
            </div>

            <div className="p-3 bg-secondary/10 border border-border/50 rounded-2xl space-y-1 opacity-75">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-muted-foreground">Revision v3.2</span>
                <span className="text-[9px] font-black uppercase text-muted-foreground bg-secondary px-2 py-0.2 rounded-full">Superseded</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60">Uploaded: 22 June 2026</p>
              <p className="text-xs text-muted-foreground/75 leading-relaxed pt-1">Adjusted software engineering elective hours for B.Tech CSE Year 3.</p>
            </div>

            <div className="p-3 bg-secondary/10 border border-border/50 rounded-2xl space-y-1 opacity-75">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-muted-foreground">Revision v3.0</span>
                <span className="text-[9px] font-black uppercase text-muted-foreground bg-secondary px-2 py-0.2 rounded-full">Superseded</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60">Uploaded: 05 June 2026</p>
              <p className="text-xs text-muted-foreground/75 leading-relaxed pt-1">Initial release of timetables for A.Y. 2025-26 start semesters.</p>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2 bg-secondary/30 p-3 rounded-2xl border border-border/60">
            <Info className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
            <p>Older revision copies are archived securely. Students are served the latest active revision v3.4 automatically. Contact department admin for archives.</p>
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
      
      {/* Breadcrumbs / Back navigation */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-center justify-between mb-1">
          {selectedYear ? (
            <button 
              onClick={handleBackNavigation} 
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <BackButton />
          )}

          {/* Simulated Offline Mode indicator & Toggle for testing */}
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

      {/* DETAILED VIEW: LEVEL 3 (SCREEN 4) */}
      {selectedYear && selectedSemester && selectedDept ? (
        (() => {
          if (!currentDoc) {
            return (
              <div className="text-center p-8 bg-card border border-border rounded-[2rem] shadow-sm flex flex-col items-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="font-extrabold text-sm text-foreground">Timetable document not available</p>
                <p className="text-xs text-muted-foreground mt-1">Please select another semester or department.</p>
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
              
              {/* Info Header */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  Academic Year {currentDoc.academicYear}
                </span>
                <h1 className="text-2xl font-black text-foreground mt-3 tracking-tight leading-tight">
                  {currentDoc.semester} • {currentDoc.department.split(' / ')[0]}
                </h1>
                
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Official Document
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <span>Revision: v{currentDoc.version}.0</span>
                </div>
              </div>

              {/* Offline Blocker Overlay (If simulated offline and file not saved) */}
              {!accessible ? (
                <div className="bg-card border-2 border-dashed border-amber-300 rounded-[2rem] p-8 text-center space-y-4 flex flex-col items-center">
                  <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
                    <WifiOff className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">Offline Access Restricted</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                    You are in Offline Mode. This timetable has not been saved offline yet. Save it while connected to access it offline.
                  </p>
                  <button
                    onClick={() => toggleSaveOffline(currentDoc.id)}
                    className="px-5 py-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                  >
                    Save Offline Anyway (Cache Document)
                  </button>
                </div>
              ) : (
                <>
                  {/* Universal Timetable Viewer */}
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
                      <Share2 className="w-4 h-4" /> Share Timetable Document
                    </button>
                    {pinnedId === currentDoc.id ? (
                      <>
                        <button
                          disabled
                          className="py-3.5 bg-amber-500/10 border border-amber-300/60 text-amber-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 opacity-80 cursor-default"
                        >
                          <Pin className="w-4 h-4 fill-amber-600 text-amber-600" />
                          Pinned Timetable
                        </button>
                        <button
                          onClick={() => handleUnpin(currentDoc.id)}
                          className="py-3.5 bg-card border border-red-200 text-red-600 hover:bg-red-50/50 font-bold text-xs rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                          <PinOff className="w-4 h-4" />
                          Remove Pin
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handlePin(currentDoc.id)}
                        className="col-span-2 py-3.5 bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                      >
                        <Pin className="w-4 h-4" />
                        Pin Timetable
                      </button>
                    )}
                  </div>

                  {/* Warning Notice Card */}
                  <div className="p-4 bg-secondary/35 border border-border/80 rounded-2xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                      This repository provides the latest available timetable uploaded for this semester. Please ensure you are using the latest version.
                    </p>
                  </div>
                </>
              )}

            </div>
          );
        })()
      ) : selectedYear && selectedSemester ? (
        /* SCREEN 3: DEPARTMENT SELECTION */
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">{selectedSemester}</h1>
            <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mt-1">
              Select Department Repository
            </p>
          </div>

          <div className="space-y-4">
            {DEPARTMENTS.map((dept) => {
              // Find matching document in DB to get its updated date
              const doc = TIMETABLE_DATABASE.find(d => 
                d.year === selectedYear && 
                d.semester === selectedSemester && 
                d.department === dept.name
              );
              
              const lastUpdated = doc ? doc.lastUpdated : '15 June 2026';
              const isOffline = doc ? offlineIds.includes(doc.id) : false;

              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.name)}
                  className={`group cs-interactive-card flex flex-col p-6 rounded-[2rem] bg-card border-2 ${dept.accentColor} shadow-sm active:scale-[0.98] transition-all relative overflow-hidden`}
                >
                  {/* Folder stamp icon in background */}
                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
                    <Folder className="w-24 h-24 text-foreground" />
                  </div>

                  <div className="flex items-center gap-4 mb-4 z-10">
                    <div className={`w-12 h-12 rounded-2xl ${dept.iconBg} ${dept.iconColor} flex items-center justify-center shadow-inner`}>
                      <Folder className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Official Timetable</span>
                        {doc && (
                          <span className={`text-[8px] font-black uppercase px-2 py-0.2 rounded border flex items-center gap-1 ${
                            doc.fileType === 'PDF' 
                              ? 'bg-red-500/10 text-red-700 border-red-500/20' 
                              : 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                          }`}>
                            {doc.fileType === 'PDF' ? '📄 PDF' : `🖼 ${doc.fileType}`}
                          </span>
                        )}
                        {isOffline && (
                          <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                            <Wifi className="w-2 h-2" /> Offline Saved
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-black text-foreground mt-0.5">{dept.name}</h2>
                    </div>
                  </div>

                  <div className="flex items-center justify-between z-10 pt-3 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground font-semibold">Repository Document</span>
                    <div className="flex items-center gap-1.5 text-muted-foreground/60 text-[11px] font-semibold">
                      <span>Updated {lastUpdated}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/45 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : selectedYear ? (
        /* SCREEN 2: SEMESTER SELECTION */
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">{selectedYear}st Year</h1>
            <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mt-1">
              Select Semester Repository
            </p>
          </div>

          <div className="space-y-4">
            {getSemestersForYear(selectedYear).map((sem) => {
              // Find first department file for this semester to fetch lastUpdated
              const doc = TIMETABLE_DATABASE.find(d => 
                d.year === selectedYear && 
                d.semester === sem.title
              );
              const lastUpdated = doc ? doc.lastUpdated : '15 June 2026';

              return (
                <div
                  key={sem.title}
                  onClick={() => setSelectedSemester(sem.title)}
                  className="group cs-interactive-card flex items-center justify-between p-5 rounded-[2rem] bg-card border border-border shadow-sm hover:border-border/80 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-foreground leading-tight">{sem.title}</h2>
                      <span className="text-[10px] font-bold text-muted-foreground block mt-1 uppercase tracking-tight">
                        {sem.academicRepository}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                      Rev: {lastUpdated}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* SCREEN 1: TIMETABLES HOME */
        <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
          
          {/* Header Title */}
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Timetables</h1>
            <p className="text-sm font-semibold text-muted-foreground tracking-tight mt-1">
              Browse Official Academic Timetables
            </p>
          </div>

          {/* Pinned Timetable Hero Section (First element on Home Screen) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 rotate-45 shrink-0" />
              Pinned Timetable
            </h3>
            
            {pinnedDoc ? (
              <div 
                onClick={() => selectDocumentDirect(pinnedDoc)}
                className="group cs-interactive-card flex items-center justify-between p-5 rounded-[2rem] bg-gradient-to-br from-amber-500/5 via-amber-500/[0.01] to-transparent border-2 border-amber-500/20 shadow-sm hover:border-amber-500/40 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <Pin className="w-24 h-24 text-amber-500 rotate-45 fill-current" />
                </div>
                
                <div className="flex items-center gap-4 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <Pin className="w-6 h-6 rotate-45 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Quick Access</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Verified</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.2 rounded border flex items-center gap-1 ${
                        pinnedDoc.fileType === 'PDF' 
                          ? 'bg-red-500/10 text-red-700 border-red-500/20' 
                          : 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                      }`}>
                        {pinnedDoc.fileType === 'PDF' ? '📄 PDF' : `🖼 ${pinnedDoc.fileType}`}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-foreground mt-0.5 leading-tight">
                      {pinnedDoc.semester} • {pinnedDoc.department.split(' / ')[0]}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/80 font-bold uppercase tracking-tight">
                      <span>B.Tech Year {pinnedDoc.year}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>Updated: {pinnedDoc.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 z-10 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpin(pinnedDoc.id);
                    }}
                    className="p-2 bg-secondary/80 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-xl transition-all active:scale-95 border border-border/50"
                    title="Remove Pin"
                  >
                    <PinOff className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all">
                    <span>Quick View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/80 rounded-[2rem] bg-secondary/15 p-8 text-center space-y-4 flex flex-col items-center">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
                  <Pin className="w-6 h-6 rotate-45" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-foreground">No Pinned Timetable</h4>
                  <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                    Pin your most frequently used timetable for instant access.
                  </p>
                </div>
                <button
                  onClick={() => {
                    document.getElementById('year-repositories')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg shadow-primary/10 active:scale-95 transition-transform"
                >
                  Browse Timetables
                </button>
              </div>
            )}
          </div>

          {/* Year Repositories */}
          <div id="year-repositories" className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              BROWSE BY ACADEMIC YEAR
            </h3>
            
            <div className="space-y-4">
              {TIMETABLE_YEARS.map((year, idx) => (
                <div 
                  key={year.id} 
                  onClick={() => setSelectedYear(year.id)}
                  className="group cs-interactive-card flex items-center justify-between p-5 rounded-[2rem] bg-card border border-border shadow-sm hover:border-border/80 active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${year.iconBg} ${year.iconColor} group-hover:scale-110 transition-transform shadow-inner`}>
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/70 block">Official Repository</span>
                      <h2 className="text-lg font-black text-foreground mt-0.5 leading-tight">{year.title}</h2>
                      <span className="text-[10px] font-bold text-muted-foreground block mt-1 font-semibold">
                        Browse Semester Repository
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Viewed (Optional feature - rendered neatly if history is present) */}
          {recentlyViewed.length > 0 && (
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Recently Retrieved
              </h3>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {recentlyViewed
                  .map(id => TIMETABLE_DATABASE.find(d => d.id === id))
                  .filter((doc): doc is TimetableDoc => !!doc)
                  .map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => selectDocumentDirect(doc)}
                      className="flex-shrink-0 w-36 bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm hover:border-primary/20 active:scale-95 transition-all cursor-pointer space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 bg-secondary px-1.5 py-0.2 rounded border border-border/50">
                          Y{doc.year} • {doc.fileType}
                        </span>
                        {doc.fileType === 'PDF' ? (
                          <FileText className="w-4 h-4 text-red-500/70 animate-pulse" />
                        ) : (
                          <Folder className="w-4 h-4 text-blue-500/70 animate-pulse" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-extrabold text-foreground truncate">{doc.semester}</h4>
                        <p className="text-[9px] text-muted-foreground font-semibold truncate mt-0.5">{doc.department.split(' / ')[0]}</p>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-border/50 my-1" />

          {/* Bottom Footer Info & Version Log link */}
          <div className="flex flex-col items-center justify-center gap-3 pt-3 text-center">
            <button
              onClick={() => setShowVersionHistory(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline hover:text-primary-foreground/90 transition-all bg-primary/5 px-4 py-2.5 rounded-xl border border-primary/10 active:scale-95"
            >
              <History className="w-4 h-4" />
              Repository Info & Version History
            </button>
            <p className="text-[9px] text-muted-foreground/60 leading-relaxed font-semibold max-w-[280px]">
              CampusSync Academic document library v3.4. All timetable files are digitally verified copies of department prints.
            </p>
          </div>

          {/* Render modal if triggered */}
          {renderVersionHistory()}

        </div>
      )}

    </div>
  );
};

export default TimetablePage;

