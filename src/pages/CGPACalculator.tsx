import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, BookOpen, GraduationCap, Download, Share2, History, FileText, ChevronRight, CheckCircle2, Eye, Calendar, User, School, ArrowLeft } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { store } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { GRADES, GRADE_POINTS } from '@/types';
import type { Subject, UserProfile, SemesterRecord } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ── helpers ── */
const newSubject = (): Subject => ({
  id: crypto.randomUUID(),
  name: '',
  credits: 3,
  grade: '',
});

interface CGPASemester {
  id: string;
  label: string;
  sgpa: string;
  credits: string;
}

const newCGPASem = (n: number): CGPASemester => ({
  id: crypto.randomUUID(),
  label: `Semester ${n}`,
  sgpa: '',
  credits: '',
});

interface SavedResult {
  id: string;
  date: string;
  title: string;
  gpa: number;
  credits: number;
  type: 'SGPA' | 'CGPA';
  status: string;
  data: any[]; 
}

const getAcademicStatus = (gpa: number) => {
  if (gpa >= 9.0) return 'Outstanding Performance';
  if (gpa >= 8.0) return 'Strong Academic Progress';
  if (gpa >= 7.0) return 'Good Standing';
  if (gpa >= 6.0) return 'Satisfactory';
  return 'Needs Improvement';
};

/* ── component ── */
const CGPACalculator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as 'sgpa' | 'cgpa') || 'sgpa';
  const [tab, setTab] = useState<'sgpa' | 'cgpa'>(initialTab);
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const profile = store.get('profile', { name: 'Student', course: 'B.Tech', year: 1, semester: 1 }) as UserProfile;

  // SGPA Semester-Based States
  const [viewState, setViewState] = useState<'list' | 'create' | 'edit' | 'select_semester'>('select_semester');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [semesterRecords, setSemesterRecords] = useState<SemesterRecord[]>(() => store.get('semester_records', []));
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  // CGPA States
  const [cgpaSemesters, setCgpaSemesters] = useState<CGPASemester[]>(() => store.get('cgpa_semesters', [newCGPASem(1)]));
  const [savedHistory, setSavedHistory] = useState<SavedResult[]>(() => store.get('gpa_history', []));

  // Snapshot active export data
  const [exportSnapshot, setExportSnapshot] = useState<SavedResult | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const editId = params.get('edit');

    if (tabParam === 'sgpa' || tabParam === 'cgpa') {
      setTab(tabParam);
    }

    if (editId) {
      const rec = semesterRecords.find(r => r.id === editId);
      if (rec) {
        setActiveRecordId(rec.id);
        setViewState('edit');
      }
    }
  }, [location.search, semesterRecords]);

  const showModal = (config: Omit<typeof modalConfig, 'isOpen'>) => {
    setModalConfig({ ...config, isOpen: true });
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const activeRecord = semesterRecords.find(r => r.id === activeRecordId);

  /* ── SGPA logic (Semester Records) ── */
  const saveRecords = (records: SemesterRecord[]) => {
    setSemesterRecords(records);
    store.set('semester_records', records);
  };

  const updateActiveRecord = (updates: Partial<SemesterRecord>) => {
    if (!activeRecordId) return;
    const updated = semesterRecords.map(r => 
      r.id === activeRecordId ? { ...r, ...updates, lastUpdated: new Date().toISOString() } : r
    );
    saveRecords(updated);
  };

  const calculateSGPA = (subjects: Subject[]) => {
    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const totalWeighted = subjects.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0);
    return totalCredits ? +(totalWeighted / totalCredits).toFixed(2) : 0;
  };

  const addSubject = () => {
    if (!activeRecord) return;
    const newSubjects = [...activeRecord.subjects, newSubject()];
    updateActiveRecord({ subjects: newSubjects, sgpa: calculateSGPA(newSubjects) });
  };

  const removeSubject = (i: number) => {
    if (!activeRecord || activeRecord.subjects.length <= 1) return;
    const newSubjects = [...activeRecord.subjects];
    newSubjects.splice(i, 1);
    updateActiveRecord({ subjects: newSubjects, sgpa: calculateSGPA(newSubjects) });
  };

  const updateSubject = (i: number, field: keyof Subject, value: string | number) => {
    if (!activeRecord) return;
    const newSubjects = [...activeRecord.subjects];
    (newSubjects[i] as any)[field] = value;
    updateActiveRecord({ subjects: newSubjects, sgpa: calculateSGPA(newSubjects) });
  };

  const deleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showModal({
      type: 'confirm',
      title: 'Delete Record',
      message: 'Are you sure you want to delete this semester record? This action cannot be undone.',
      onConfirm: () => {
        saveRecords(semesterRecords.filter(r => r.id !== id));
        if (activeRecordId === id) {
          setActiveRecordId(null);
          setViewState('list');
        }
      }
    });
  };

  /* ── CGPA logic ── */
  const saveCGPA = (s: CGPASemester[]) => { setCgpaSemesters(s); store.set('cgpa_semesters', s); };
  const addCGPASem = () => saveCGPA([...cgpaSemesters, newCGPASem(cgpaSemesters.length + 1)]);
  const removeCGPASem = (i: number) => {
    if (cgpaSemesters.length <= 1) return;
    const u = [...cgpaSemesters]; u.splice(i, 1); saveCGPA(u);
  };
  const updateCGPASem = (i: number, field: 'sgpa' | 'credits', value: string) => {
    const u = [...cgpaSemesters]; u[i] = { ...u[i], [field]: value }; saveCGPA(u);
  };

  const validSems = cgpaSemesters.filter(s => {
    const sg = parseFloat(s.sgpa); const cr = parseFloat(s.credits);
    return !isNaN(sg) && !isNaN(cr) && cr > 0 && sg >= 0 && sg <= 10;
  });
  const cgpaTotalCredits = validSems.reduce((sum, s) => sum + parseFloat(s.credits), 0);
  const cgpaTotalWeighted = validSems.reduce((sum, s) => sum + parseFloat(s.sgpa) * parseFloat(s.credits), 0);
  const cgpa = cgpaTotalCredits ? +(cgpaTotalWeighted / cgpaTotalCredits).toFixed(2) : 0;
  const resetCGPA = () => {
    showModal({
      type: 'confirm',
      title: 'Reset CGPA',
      message: 'This will clear all semester entries in the CGPA calculator. Continue?',
      onConfirm: () => saveCGPA([newCGPASem(1)])
    });
  };

  /* ── Export & History logic ── */
  const saveCurrentToHistory = () => {
    const isSgpa = tab === 'sgpa';
    let gpaVal = 0;
    let title = '';
    let credits = 0;
    let data: any[] = [];

    if (isSgpa) {
      if (!activeRecord || activeRecord.sgpa === 0) {
        return showModal({ type: 'alert', title: 'Invalid Data', message: 'Please enter valid subject grades to calculate SGPA.' });
      }
      gpaVal = activeRecord.sgpa;
      title = activeRecord.title;
      credits = activeRecord.subjects.reduce((sum, s) => sum + s.credits, 0);
      data = activeRecord.subjects;
    } else {
      if (cgpa === 0) return alert('Calculate a valid CGPA first.');
      gpaVal = cgpa;
      title = 'Cumulative Academic Summary';
      credits = cgpaTotalCredits;
      data = validSems;
    }

    const newRecord: SavedResult = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      title,
      gpa: gpaVal,
      credits,
      type: isSgpa ? 'SGPA' : 'CGPA',
      status: getAcademicStatus(gpaVal),
      data
    };
    
    setSavedHistory(prev => {
      const updatedHistory = [newRecord, ...prev];
      store.set('gpa_history', updatedHistory);
      return updatedHistory;
    });
    showModal({ type: 'alert', title: 'Success', message: 'Academic result has been saved to your history.' });
  };

  const deleteHistoryRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showModal({
      type: 'confirm',
      title: 'Remove History',
      message: 'Are you sure you want to remove this result from your history?',
      onConfirm: () => {
        const updated = savedHistory.filter(r => r.id !== id);
        setSavedHistory(updated);
        store.set('gpa_history', updated);
      }
    });
  };

  const handleHistoryItemClick = (record: SavedResult) => {
    if (record.type === 'SGPA') {
      const existing = semesterRecords.find(r => r.id === record.id);
      if (existing) {
        setActiveRecordId(existing.id);
        setTab('sgpa');
        setViewState('edit');
      } else {
        // If not in live records (e.g. deleted), allow preview or temporary re-entry
        showModal({
          type: 'confirm',
          title: 'Record Not Found',
          message: 'The live record for this entry was deleted. Would you like to restore it from the history snapshot?',
          onConfirm: () => {
            const restored: SemesterRecord = {
              id: record.id,
              title: record.title,
              studentName: profile.name,
              course: profile.course,
              year: profile.year.toString(),
              subjects: record.data,
              lastUpdated: new Date().toISOString(),
              sgpa: record.gpa
            };
            saveRecords([restored, ...semesterRecords]);
            setActiveRecordId(restored.id);
            setTab('sgpa');
            setViewState('edit');
          }
        });
      }
    } else {
      setTab('cgpa');
      showModal({ type: 'alert', title: 'CGPA Snapshot', message: 'Cumulative snapshot data is displayed in the summary cards above.' });
    }
  };

  const handleExport = async (action: 'download' | 'share' | 'preview', record?: SavedResult) => {
    const isSgpa = tab === 'sgpa';
    let gpaVal = 0;
    let title = '';
    let credits = 0;
    let data: any[] = [];

    if (record) {
      gpaVal = record.gpa;
      title = record.title;
      credits = record.credits;
      data = record.data;
    } else if (isSgpa) {
      if (!activeRecord || activeRecord.sgpa === 0) return alert('Calculate a valid SGPA before exporting.');
      gpaVal = activeRecord.sgpa;
      title = activeRecord.title;
      credits = activeRecord.subjects.reduce((sum, s) => sum + s.credits, 0);
      data = activeRecord.subjects;
    } else {
      if (cgpa === 0) return alert('Calculate a valid CGPA before exporting.');
      gpaVal = cgpa;
      title = 'Cumulative Academic Summary';
      credits = cgpaTotalCredits;
      data = validSems;
    }

    const exportData: SavedResult = record || {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      title,
      gpa: gpaVal,
      credits,
      type: isSgpa ? 'SGPA' : 'CGPA',
      status: getAcademicStatus(gpaVal),
      data
    };

    setExportSnapshot(exportData);
    setIsExporting(true);

    // Wait for state to reflect in hidden div
    setTimeout(async () => {
      if (!pdfRef.current) return setIsExporting(false);
      
      const element = pdfRef.current;
      element.style.display = 'block';

      try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
        
        const fileName = `${title.replace(/ /g, '_')}.pdf`;

        if (action === 'download') {
          pdf.save(fileName);
        } else if (action === 'share') {
          const blob = pdf.output('blob');
          const file = new File([blob], fileName, { type: 'application/pdf' });
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: exportData.title,
              text: 'Here is my academic performance summary.',
              files: [file]
            });
          } else {
            pdf.save(fileName); 
            alert('Sharing not fully supported. File downloaded instead.');
          }
        } else if (action === 'preview') {
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        }
      } catch (err) {
        console.error('PDF Error:', err);
        alert('Failed to generate document.');
      } finally {
        element.style.display = 'none';
        setIsExporting(false);
        setExportSnapshot(null);
      }
    }, 100);
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    
    const newRec: SemesterRecord = {
      id: crypto.randomUUID(),
      title: title,
      studentName: profile.name,
      course: profile.course,
      year: profile.year.toString(),
      subjects: [newSubject(), newSubject(), newSubject()], // Start with 3 subjects
      lastUpdated: new Date().toISOString(),
      sgpa: 0
    };

    saveRecords([newRec, ...semesterRecords]);
    setActiveRecordId(newRec.id);
    setViewState('edit');
  };

  const getPrefilledSubjectsForSemester = (semNum: number, branch: string): Subject[] => {
    const branchKey = branch.toLowerCase().trim();
    
    if (branchKey === 'cse' || branchKey === 'aiml') {
      if (semNum === 1) {
        return [
          { id: crypto.randomUUID(), name: 'Engineering Physics', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Linear Algebra & Calculus', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Basic Electrical & Electronics Engineering', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Engineering Graphics', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Introduction to Programming', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'IT Workshop', credits: 1, grade: '' },
          { id: crypto.randomUUID(), name: 'Engineering Physics Lab', credits: 1, grade: '' },
          { id: crypto.randomUUID(), name: 'Electrical & Electronics Engineering Workshop', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Computer Programming Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'NSS / NCC / Scouts & Guides / Community Service', credits: 0.5, grade: '' },
        ];
      }
    }
    
    if (branchKey === 'cse') {
      if (semNum === 2) {
        return [
          { id: crypto.randomUUID(), name: 'Differential Equations and Vector Calculus', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Engineering Chemistry / Chemistry / Fundamental Chemistry', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Communicative English Lab', credits: 1, grade: '' },
          { id: crypto.randomUUID(), name: 'Engineering Chemistry / Chemistry / Fundamental Chemistry Lab', credits: 1, grade: '' },
          { id: crypto.randomUUID(), name: 'Health and Wellness, Yoga and Sports', credits: 0.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Communicative English', credits: 2, grade: '' },
          { id: crypto.randomUUID(), name: 'Basic Civil and Mechanical Engineering', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Engineering Workshop', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Data Structures Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Data Structures', credits: 3, grade: '' },
        ];
      }

      if (semNum === 3) {
        return [
          { id: crypto.randomUUID(), name: 'Environmental Science', credits: 0, grade: '' },
          { id: crypto.randomUUID(), name: 'Discrete Mathematics & Graph Theory', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Managerial Economics and Financial Analysis', credits: 2, grade: '' },
          { id: crypto.randomUUID(), name: 'Computer Organization and Architecture', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Advanced Data Structures Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Advanced Data Structures', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Object Oriented Programming Through Java Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Object Oriented Programming Through Java', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Python Programming', credits: 2, grade: '' },
        ];
      }

      if (semNum === 4) {
        return [
          { id: crypto.randomUUID(), name: 'Universal Human Values – Understanding Harmony', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Probability & Statistics', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Operating Systems', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Database Management Systems', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Software Engineering', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Operating Systems Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Database Management Systems Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Full Stack Development – I', credits: 2, grade: '' },
          { id: crypto.randomUUID(), name: 'Design Thinking & Innovation', credits: 2, grade: '' },
        ];
      }

      if (semNum === 5) {
        return [
          { id: crypto.randomUUID(), name: 'Community Service Internship', credits: 2, grade: '' },
          { id: crypto.randomUUID(), name: 'Data Mining Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Data Warehousing and Data Mining', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Computer Networks Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Computer Networks', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Formal Languages and Automata Theory', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Design and Analysis of Algorithms', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'User Interface Design Using Flutter', credits: 1, grade: '' },
          { id: crypto.randomUUID(), name: 'Construction and Technology Management', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Full Stack Development – 2', credits: 2, grade: '' },
        ];
      }
    } else if (branchKey === 'aiml') {
      if (semNum === 2) {
        return [
          { id: crypto.randomUUID(), name: 'Differential Equations and Vector Calculus', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Engineering Chemistry / Chemistry / Fundamental Chemistry', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Communicative English Lab', credits: 1, grade: '' },
          { id: crypto.randomUUID(), name: 'Engineering Chemistry / Chemistry / Fundamental Chemistry Lab', credits: 1, grade: '' },
          { id: crypto.randomUUID(), name: 'Health and Wellness, Yoga and Sports', credits: 0.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Communicative English', credits: 2, grade: '' },
          { id: crypto.randomUUID(), name: 'Basic Civil and Mechanical Engineering', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Engineering Workshop', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Data Structures Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Data Structures', credits: 3, grade: '' },
        ];
      }

      if (semNum === 3) {
        return [
          { id: crypto.randomUUID(), name: 'Universal Human Values – Understanding Harmony', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Environmental Science', credits: 0, grade: '' },
          { id: crypto.randomUUID(), name: 'Discrete Mathematics & Graph Theory', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Advanced Data Structures Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Advanced Data Structures', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Object Oriented Programming Through Java Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Object Oriented Programming Through Java', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Artificial Intelligence', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Python Programming', credits: 2, grade: '' },
        ];
      }

      if (semNum === 5) {
        return [
          { id: crypto.randomUUID(), name: 'Community Service Internship', credits: 2, grade: '' },
          { id: crypto.randomUUID(), name: 'Information Retrieval Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Information Retrieval Systems', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Computer Networks Lab', credits: 1.5, grade: '' },
          { id: crypto.randomUUID(), name: 'Computer Networks', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Operating Systems', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Automata Theory and Compiler Design', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'User Interface Design Using Flutter', credits: 1, grade: '' },
          { id: crypto.randomUUID(), name: 'Construction and Technology Management', credits: 3, grade: '' },
          { id: crypto.randomUUID(), name: 'Full Stack Development – 2', credits: 2, grade: '' },
        ];
      }
    }
    
    // Default fallback for other semesters or branches (returns 3 empty subjects for manual entry)
    return [newSubject(), newSubject(), newSubject()];
  };

  const handleSelectSemester = async (num: number) => {
    setIsLoadingTemplate(true);
    const title = `Semester ${num}`;
    const reg = profile.regulation || 'R23';
    const branch = profile.className || 'CSE';
    
    let templateSubjects: Subject[] = [];
    
    try {
      const { data: dbTemplates } = await supabase
        .from('semester_templates')
        .select('*')
        .eq('regulation', reg)
        .eq('branch', branch)
        .eq('semester', num)
        .order('created_at', { ascending: true });
      
      if (dbTemplates && dbTemplates.length > 0) {
        templateSubjects = dbTemplates.map((t: any) => ({
          id: crypto.randomUUID(),
          name: t.subject_name,
          credits: parseFloat(t.credits),
          grade: '',
        }));
      }
    } catch (err) {
      console.warn('Error fetching template from Supabase, falling back to local pre-fills', err);
    }
    
    // Fallback to local hardcoded presets if database request returned nothing
    if (templateSubjects.length === 0) {
      templateSubjects = getPrefilledSubjectsForSemester(num, branch);
    }

    // Now check if a user record for this semester already exists
    const existing = semesterRecords.find(r => r.title.toLowerCase().trim() === title.toLowerCase());
    
    if (existing) {
      // Merge! Preserve existing user grades for matching subjects.
      const mergedSubjects = templateSubjects.map(tempSub => {
        const userSub = existing.subjects.find(
          u => u.name.toLowerCase().trim() === tempSub.name.toLowerCase().trim()
        );
        return {
          ...tempSub,
          grade: userSub ? userSub.grade : '',
        };
      });
      
      // Update existing record with merged template names/credits
      const updatedRecords = semesterRecords.map(r => 
        r.id === existing.id 
          ? { 
              ...r, 
              subjects: mergedSubjects, 
              sgpa: calculateSGPA(mergedSubjects),
              lastUpdated: new Date().toISOString()
            } 
          : r
      );
      
      saveRecords(updatedRecords);
      setActiveRecordId(existing.id);
    } else {
      // Create new record with pre-filled subjects
      const newRec: SemesterRecord = {
        id: crypto.randomUUID(),
        title: title,
        studentName: profile.name,
        course: profile.course,
        year: profile.year.toString(),
        subjects: templateSubjects,
        lastUpdated: new Date().toISOString(),
        sgpa: 0
      };
      
      saveRecords([newRec, ...semesterRecords]);
      setActiveRecordId(newRec.id);
    }
    
    setIsLoadingTemplate(false);
    setViewState('edit');
  };

  return (
    <div className="cs-page pb-8">
      {isLoadingTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest animate-pulse">Fetching Semester Template...</p>
        </div>
      )}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between mb-2">
          {viewState === 'select_semester' || tab === 'cgpa' ? (
            <BackButton label="GPA Hub" />
          ) : (
            <button 
              onClick={() => setViewState('select_semester')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>
      </div>

      <div ref={topRef} />

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-foreground">
          {tab === 'sgpa' ? 'SGPA Semester Records' : 'Cumulative GPA'}
        </h1>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        {tab === 'sgpa' ? 'Manage your individual semester academic performance' : 'Overall academic standing summary'}
      </p>

      {/* Tab Switcher */}
      <div className="flex bg-secondary rounded-2xl p-1 mb-8">
        {(['sgpa', 'cgpa'] as const).map(t => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === 'sgpa') setViewState('select_semester');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t === 'sgpa' ? <BookOpen className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ═══════ SGPA TAB ═══════ */}
      <div className={tab === 'sgpa' ? 'block' : 'hidden'}>
        
        {/* → SEMESTER SELECTION VIEW */}
        {viewState === 'select_semester' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: 1, label: 'Semester 1', gradient: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20 hover:border-blue-500/40', iconBg: 'bg-blue-500 text-white' },
                { num: 2, label: 'Semester 2', gradient: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20 hover:border-emerald-500/40', iconBg: 'bg-emerald-500 text-white' },
                { num: 3, label: 'Semester 3', gradient: 'from-indigo-500/10 to-indigo-500/5', border: 'border-indigo-500/20 hover:border-indigo-500/40', iconBg: 'bg-indigo-500 text-white' },
                { num: 4, label: 'Semester 4', gradient: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20 hover:border-amber-500/40', iconBg: 'bg-amber-500 text-white' },
                { num: 5, label: 'Semester 5', gradient: 'from-rose-500/10 to-rose-500/5', border: 'border-rose-500/20 hover:border-rose-500/40', iconBg: 'bg-rose-500 text-white' },
                { num: 6, label: 'Semester 6', gradient: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/20 hover:border-violet-500/40', iconBg: 'bg-violet-500 text-white' },
                { num: 7, label: 'Semester 7', gradient: 'from-cyan-500/10 to-cyan-500/5', border: 'border-cyan-500/20 hover:border-cyan-500/40', iconBg: 'bg-cyan-500 text-white' },
                { num: 8, label: 'Semester 8', gradient: 'from-orange-500/10 to-orange-500/5', border: 'border-orange-500/20 hover:border-orange-500/40', iconBg: 'bg-orange-500 text-white' },
              ].map((sem) => {
                const record = semesterRecords.find(
                  (r) => r.title.toLowerCase().trim() === `semester ${sem.num}`
                );
                const hasRecord = !!record;
                const isCompleted = hasRecord && record.sgpa > 0;
                const isInProgress = hasRecord && record.sgpa === 0;

                const statusLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started';
                const detailLabel = isCompleted 
                  ? `SGPA: ${record.sgpa.toFixed(2)}` 
                  : isInProgress 
                    ? `${record.subjects.length} Subjects` 
                    : 'No Record';

                const statusColor = isCompleted 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : isInProgress 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                    : 'bg-muted text-muted-foreground border-border/40';

                return (
                  <button
                    key={sem.num}
                    onClick={() => handleSelectSemester(sem.num)}
                    className={`flex flex-col justify-between p-4 min-h-[105px] rounded-2xl border bg-gradient-to-br ${sem.gradient} ${sem.border} shadow-sm active:scale-[0.96] hover:-translate-y-0.5 transition-all duration-300 text-left group relative`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className={`w-8 h-8 rounded-xl ${sem.iconBg} flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-110 transition-transform shrink-0`}>
                        {sem.num}
                      </div>
                      <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                        {sem.label}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        {detailLabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-center mt-8 pt-6 border-t border-border">
              <button
                onClick={() => setViewState('list')}
                disabled={semesterRecords.length === 0}
                className={`inline-flex items-center justify-between gap-3 w-full px-5 py-3.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                  semesterRecords.length === 0 
                    ? 'bg-secondary/40 text-muted-foreground/60 cursor-not-allowed border border-border/40'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <span>
                    {semesterRecords.length === 0 ? 'No Saved Semester Records' : 'View Saved Semester Records'}
                  </span>
                </div>
                {semesterRecords.length > 0 && (
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-black">
                    {semesterRecords.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* → LIST VIEW */}
        {viewState === 'list' && (
          <div className="space-y-4">
            {semesterRecords.length === 0 ? (
              <div className="cs-card p-10 flex flex-col items-center justify-center text-center border-dashed border-2 bg-secondary/50">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No semester records yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">Create your first semester record to start tracking subjects and grades.</p>
                <button 
                  onClick={() => setViewState('select_semester')}
                  className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                  Create Semester Record
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {/* Prominent Add Button */}
                <button 
                  onClick={() => setViewState('select_semester')}
                  className="w-full cs-card p-6 border-dashed border-2 bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all flex flex-col items-center justify-center gap-2 mb-2 group active:scale-95 duration-200"
                >
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">Calculate Your GPA</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Start new semester record</p>
                  </div>
                </button>

                {semesterRecords.map(record => (
                  <div 
                    key={record.id}
                    onClick={() => {
                      setActiveRecordId(record.id);
                      setViewState('edit');
                    }}
                    className="cs-card-elevated p-4 flex items-center justify-between group active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary">
                        <span className="text-xs font-bold leading-none">{record.sgpa.toFixed(1)}</span>
                        <span className="text-[8px] font-black uppercase mt-0.5">GPA</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{record.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {record.subjects.length} Subjects
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(record.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={(e) => deleteRecord(record.id, e)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* → CREATE VIEW */}
        {viewState === 'create' && (
          <form onSubmit={handleCreate} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="cs-card p-6 space-y-6">
              <div className="text-center mb-2">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">New Semester Record</h3>
                <p className="text-xs text-muted-foreground mt-1">Initialize your academic subject list for a new semester.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Semester Title</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input 
                    name="title"
                    required
                    placeholder="e.g. Semester 3 Final Results"
                    className="w-full bg-secondary border-none rounded-xl py-3.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Profile Meta</p>
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Student: <b className="text-foreground">{profile.name}</b></span>
                  <span className="text-muted-foreground">Course: <b className="text-foreground">{profile.course}</b></span>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              Start Entering Results
            </button>
          </form>
        )}

        {/* → EDIT / CALCULATOR VIEW */}
        {viewState === 'edit' && activeRecord && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="cs-card-elevated p-5 mb-5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
              <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mb-1">{activeRecord.title}</p>
              <p className="text-5xl font-black text-primary mt-1">{activeRecord.sgpa.toFixed(2)}</p>
              
              <div className="flex justify-center gap-6 mt-4 text-[10px] text-muted-foreground font-bold uppercase">
                <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {activeRecord.studentName}</span>
                <span className="flex items-center gap-1.5"><School className="w-3 h-3" /> {activeRecord.year} {activeRecord.course}</span>
              </div>

              {activeRecord.sgpa > 0 && (
                <div className="mt-5 inline-flex items-center gap-1.5 bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {getAcademicStatus(activeRecord.sgpa)}
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {activeRecord.subjects.map((sub, i) => (
                <div key={sub.id} className="cs-card p-3 border-l-4 border-l-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Subject name"
                      value={sub.name}
                      onChange={(e) => updateSubject(i, 'name', e.target.value)}
                      className="flex-1 bg-secondary border-none rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                    />
                    {activeRecord.subjects.length > 1 && (
                      <button onClick={() => removeSubject(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Grade</label>
                      <select
                        value={sub.grade}
                        onChange={(e) => updateSubject(i, 'grade', e.target.value)}
                        className="w-full bg-secondary border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Grade</option>
                        {GRADES.map(g => (
                          <option key={g} value={g}>{g} ({GRADE_POINTS[g]} Pts)</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Credits</label>
                      <select
                        value={sub.credits}
                        onChange={(e) => updateSubject(i, 'credits', parseFloat(e.target.value))}
                        className="w-full bg-secondary border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {[0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-16 text-center">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Score</label>
                      <div className="bg-accent/10 text-accent rounded-lg py-2 text-sm font-black">
                        {(GRADE_POINTS[sub.grade] ?? 0) * sub.credits}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prominent Add Button (Dashed Card) */}
            <button 
              onClick={addSubject}
              className="w-full cs-card p-6 border-dashed border-2 bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all flex flex-col items-center justify-center gap-3 mb-6 group active:scale-95 duration-200 shadow-sm"
            >
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 stroke-[3.5px]" />
              </div>
              <div className="text-center">
                <p className="font-black text-lg text-foreground tracking-tight">Add New Subject</p>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.1em] mt-1 opacity-70">Include another subject in this semester</p>
              </div>
            </button>

            <div className="flex justify-end mb-8">
              <button 
                onClick={() => {
                  showModal({
                    type: 'confirm',
                    title: 'Reset Subjects',
                    message: 'Clear all subjects and grades for this semester? This cannot be undone.',
                    onConfirm: () => {
                      const cleared = activeRecord.subjects.map(s => ({ ...s, name: '', grade: 'S' }));
                      updateActiveRecord({ subjects: cleared, sgpa: calculateSGPA(cleared) });
                    }
                  });
                }} 
                className="py-2.5 px-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-destructive/20 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>

            {/* Export Actions (Only if subjects exist and GPA > 0) */}
            <div className={`space-y-3 transition-all duration-300 ${activeRecord.sgpa > 0 ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-2'}`}>
              <button 
                onClick={() => handleExport('download')}
                disabled={isExporting}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                {isExporting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Export {activeRecord.title} PDF
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={saveCurrentToHistory}
                  className="flex-1 bg-secondary text-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                >
                  <History className="w-4 h-4" /> Save
                </button>
                <button 
                  onClick={() => handleExport('preview')}
                  disabled={isExporting}
                  className="flex-1 bg-secondary text-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
              </div>
            </div>

            {/* Floating Live Result Island */}
            {scrollY > 200 && (
              <div 
                onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500 cursor-pointer"
              >
                <div className="bg-primary/90 backdrop-blur-md text-primary-foreground px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl shadow-primary/40 border border-white/10 active:scale-95 transition-transform">
                  <div className="flex flex-col items-center border-r border-white/20 pr-3">
                     <span className="text-[10px] font-black uppercase tracking-tighter opacity-70 leading-none">SGPA</span>
                     <span className="text-lg font-black leading-none mt-0.5">
                        {activeRecord.sgpa === 0 ? '--' : activeRecord.sgpa.toFixed(2)}
                     </span>
                  </div>
                  <div className="text-xs font-bold whitespace-nowrap">
                    {activeRecord.sgpa === 0 ? (
                      "Start entering subjects"
                    ) : (
                      <div className="flex flex-col">
                        <span>{activeRecord.subjects.length} Subjects Added</span>
                        <span className="text-[10px] opacity-70 font-medium">Tap to scroll to top</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════ CGPA TAB ═══════ */}
      <div className={tab === 'cgpa' ? 'block' : 'hidden'}>
        <div className="cs-card-elevated p-5 mb-5 text-center relative overflow-hidden">
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Cumulative GPA</p>
          <p className="text-5xl font-extrabold text-accent mt-1">{cgpa}</p>
          <div className="flex justify-center gap-6 mt-3 text-xs text-muted-foreground">
            <span>Semesters: <strong className="text-foreground">{validSems.length}</strong></span>
            <span>Total Credits: <strong className="text-foreground">{cgpaTotalCredits}</strong></span>
          </div>
          {cgpa > 0 && (
            <div className="mt-4 inline-flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {getAcademicStatus(cgpa)}
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {cgpaSemesters.map((sem, i) => {
            const sg = parseFloat(sem.sgpa); const cr = parseFloat(sem.credits);
            const semWeighted = (!isNaN(sg) && !isNaN(cr)) ? +(sg * cr).toFixed(2) : 0;
            const isValid = !isNaN(sg) && !isNaN(cr) && cr > 0 && sg >= 0 && sg <= 10;

            return (
              <div key={sem.id} className="cs-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{sem.label}</span>
                  <div className="flex items-center gap-2">
                    {isValid && (
                      <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">
                        {semWeighted}
                      </span>
                    )}
                    {cgpaSemesters.length > 1 && (
                      <button onClick={() => removeCGPASem(i)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="0.00"
                      value={sem.sgpa}
                      onChange={(e) => updateCGPASem(i, 'sgpa', e.target.value)}
                      className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Credits</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      value={sem.credits}
                      onChange={(e) => updateCGPASem(i, 'credits', e.target.value)}
                      className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Add Button (Dashed Card) */}
        <button 
          onClick={addCGPASem}
          className="w-full cs-card p-6 border-dashed border-2 bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all flex flex-col items-center justify-center gap-3 mb-6 group active:scale-95 duration-200 shadow-sm"
        >
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 stroke-[3.5px]" />
          </div>
          <div className="text-center">
            <p className="font-black text-lg text-foreground tracking-tight">Add Semester</p>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.1em] mt-1 opacity-70">Include another semester in your CGPA</p>
          </div>
        </button>

        <div className="flex justify-end mb-6">
          <button onClick={resetCGPA} className="py-2.5 px-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-destructive/20 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
        </div>

        {/* CGPA Export Actions */}
        <div className="space-y-3 mb-8">
          <button 
            onClick={() => handleExport('download')}
            disabled={isExporting || cgpa === 0}
            className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isExporting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            Export Cumulative Summary
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={saveCurrentToHistory}
              disabled={cgpa === 0}
              className="flex-1 bg-secondary text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <History className="w-4 h-4" /> Save
            </button>
            <button 
              onClick={() => handleExport('preview')}
              disabled={isExporting || cgpa === 0}
              className="flex-1 bg-secondary text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ RESULT HISTORY (Only in List View) ═══════ */}
      {viewState === 'list' && savedHistory.length > 0 && (
        <section className="mt-4 mb-6">
          <p className="cs-section-title mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Result History
          </p>
          <div className="space-y-3">
            {savedHistory.map((record) => (
              <div 
                key={record.id} 
                onClick={() => handleHistoryItemClick(record)}
                className="cs-card p-4 flex flex-col gap-3 group cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{record.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
                      {new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary leading-none">{record.gpa.toFixed(2)}</p>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">{record.type}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3 border-t border-border mt-1">
                  <button 
                    onClick={() => handleExport('preview', record)}
                    className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-secondary/80"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button 
                    onClick={() => handleExport('download', record)}
                    className="flex-1 py-2.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-primary/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button 
                    onClick={(e) => deleteHistoryRecord(record.id, e)}
                    className="w-10 py-2.5 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold flex items-center justify-center transition-colors hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ HIDDEN PDF TEMPLATE ═══════ */}
      <div 
        ref={pdfRef} 
        style={{ display: 'none', position: 'fixed', top: -9999, left: -9999, width: 800, backgroundColor: '#ffffff', padding: 40, fontFamily: 'sans-serif' }}
      >
        {exportSnapshot && (
          <div className="w-full text-[#111827]">
            <div className="flex justify-between items-start border-b-2 border-[#E5E7EB] pb-6 mb-6">
              <div>
                <h1 className="text-4xl font-black flex items-center gap-2" style={{ margin: 0, color: '#2563EB' }}>
                  CampuSync
                </h1>
                <h2 className="text-xl font-bold text-[#4B5563] mt-1" style={{ margin: 0 }}>
                  Academic Performance Summary
                </h2>
              </div>
              <div className="text-right">
                <p className="font-black text-[#111827] text-xl" style={{ margin: 0 }}>{activeRecord?.studentName || exportSnapshot.data[0]?.studentName || profile.name || 'Student'}</p>
                <div className="mt-1 text-[#4B5563] font-bold text-sm">
                  <p style={{ margin: 0 }}>Course: {activeRecord?.course || profile.course}</p>
                  <p style={{ margin: 0 }}>Year: {activeRecord?.year || profile.year}</p>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-2 font-bold uppercase tracking-widest">Date: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8 bg-[#F3F4F6] p-8 rounded-2xl border-l-[6px] border-l-[#2563EB]">
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-[#6B7280] uppercase mb-1">RECORD TITLE</p>
                <p className="text-2xl font-black text-[#111827]">{exportSnapshot.title}</p>
                <p className="text-lg font-bold text-[#2563EB] mt-1">{exportSnapshot.status}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black tracking-[0.2em] text-[#6B7280] uppercase mb-1">{exportSnapshot.type} SCORE</p>
                <p className="text-6xl font-black text-[#2563EB]">{exportSnapshot.gpa.toFixed(2)}</p>
                <p className="text-sm font-black text-[#6B7280] mt-2 tracking-widest uppercase">TOTAL CREDITS: {exportSnapshot.credits}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', marginTop: '10px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900' }}>
                    {exportSnapshot.type === 'SGPA' ? 'Subject Name / Code' : 'Semester'}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900' }}>Credits</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900' }}>
                    {exportSnapshot.type === 'SGPA' ? 'Grade Obtained' : 'SGPA'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {exportSnapshot.type === 'SGPA' 
                  ? (exportSnapshot.data as Subject[]).map((sub, i) => (
                      <tr key={i} style={{ backgroundColor: '#F9FAFB' }}>
                        <td style={{ padding: '16px', fontWeight: '800', color: '#111827', borderRadius: '12px 0 0 12px' }}>{sub.name || `Subject ${i + 1}`}</td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#4B5563', fontWeight: 'bold' }}>{sub.credits}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '900', color: '#2563EB', borderRadius: '0 12px 12px 0' }}>{sub.grade}</td>
                      </tr>
                    ))
                  : (exportSnapshot.data as CGPASemester[]).map((sem, i) => (
                      <tr key={i} style={{ backgroundColor: '#F9FAFB' }}>
                        <td style={{ padding: '16px', fontWeight: '800', color: '#111827', borderRadius: '12px 0 0 12px' }}>{sem.label}</td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#4B5563', fontWeight: 'bold' }}>{sem.credits || '-'}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '900', color: '#2563EB', borderRadius: '0 12px 12px 0' }}>{sem.sgpa || '-'}</td>
                      </tr>
                    ))
                }
              </tbody>
            </table>

            <div className="mt-16 pt-10 border-t-2 border-[#F3F4F6] text-center">
              <div className="inline-block px-4 py-2 bg-[#F3F4F6] rounded-lg mb-4">
                <p className="text-[10px] font-black text-[#111827] uppercase tracking-[0.2em]">Authenticity Verification</p>
              </div>
              <p className="text-sm font-bold text-[#4B5563]">This document is an unofficial academic performance summary generated via CampuSync.</p>
              <p className="text-[10px] text-[#9CA3AF] mt-2 font-medium">Digital Signature ID: {exportSnapshot.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ CUSTOM PREMIUM MODAL ═══════ */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={closeModal} />
          <div className="cs-card-elevated w-full max-w-xs relative z-10 p-6 animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-bold text-foreground mb-2">{modalConfig.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{modalConfig.message}</p>
            
            <div className="flex gap-3">
              {modalConfig.type === 'confirm' && (
                <button 
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl bg-secondary text-foreground text-sm font-bold active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => {
                  modalConfig.onConfirm?.();
                  closeModal();
                }}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                {modalConfig.type === 'confirm' ? 'Confirm' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CGPACalculator;
