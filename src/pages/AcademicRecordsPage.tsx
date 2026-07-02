import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  BookOpen, 
  GraduationCap, 
  Download, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  Calendar, 
  User, 
  School, 
  Trophy, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle 
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useNavigate } from 'react-router-dom';
import { store, useStore } from '@/lib/store';
import { GRADE_POINTS } from '@/types';
import type { Subject, UserProfile, SemesterRecord } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to convert grades to score points
const getGradeStatus = (val: number) => {
  if (val >= 9.0) return 'Outstanding';
  if (val >= 8.0) return 'Strong';
  if (val >= 7.0) return 'Good';
  if (val >= 6.0) return 'Average';
  return 'Passing';
};

const AcademicRecordsPage = () => {
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);
  
  // Link directly to global application state using useStore
  const [semesterRecords, setSemesterRecords] = useStore<SemesterRecord[]>('semester_records', []);
  const [profile] = useState<UserProfile>(() => store.get('profile', {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Student',
    course: 'B.Tech',
    className: 'CSE',
    year: 2,
    semester: 4,
    email: 'student@campusync.edu',
    regulation: 'R23'
  }));

  // Track expanded cards (by record ID)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  
  // Track PDF Downloads locally
  const [pdfDownloads, setPdfDownloads] = useState<number>(() => {
    try {
      const cached = localStorage.getItem('campusync_pdf_downloads_count');
      return cached ? parseInt(cached) : 0;
    } catch {
      return 0;
    }
  });

  // Track snapshot for pdf exporting
  const [exportSnapshot, setExportSnapshot] = useState<SemesterRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Delete modal dialog confirmation states
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    recordId: string | null;
    title: string;
  }>({ isOpen: false, recordId: null, title: '' });

  // Update download count cache
  const incrementDownloads = () => {
    const nextVal = pdfDownloads + 1;
    setPdfDownloads(nextVal);
    localStorage.setItem('campusync_pdf_downloads_count', nextVal.toString());
  };

  // Sort completed records chronologically
  const completedRecords = semesterRecords
    .filter(r => r.sgpa > 0)
    .sort((a, b) => {
      const getNum = (title: string) => parseInt(title.replace(/\D/g, '')) || 0;
      return getNum(a.title) - getNum(b.title);
    });

  // Calculate global statistics
  const completedSemestersCount = completedRecords.length;
  const highestSGPA = completedRecords.length > 0 ? Math.max(...completedRecords.map(r => r.sgpa)) : 0;
  const lowestSGPA = completedRecords.length > 0 ? Math.min(...completedRecords.map(r => r.sgpa)) : 0;
  
  // Credit-weighted CGPA
  const totalCredits = completedRecords.reduce((sum, r) => 
    sum + r.subjects.reduce((sSum, s) => sSum + s.credits, 0), 0
  );
  const totalWeighted = completedRecords.reduce((sum, r) => 
    sum + r.sgpa * r.subjects.reduce((sSum, s) => sSum + s.credits, 0), 0
  );
  const currentCGPA = totalCredits ? +(totalWeighted / totalCredits).toFixed(2) : 0;

  // Simple average SGPA
  const averageSGPA = completedRecords.length > 0 
    ? +(completedRecords.reduce((sum, r) => sum + r.sgpa, 0) / completedRecords.length).toFixed(2)
    : 0;

  // Best Performing Semester
  const bestSemester = completedRecords.length > 0 
    ? completedRecords.reduce((max, r) => r.sgpa > max.sgpa ? r : max, completedRecords[0])
    : null;

  // Toggle card expansion
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete handler
  const triggerDelete = (recordId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalConfig({ isOpen: true, recordId, title });
  };

  const confirmDelete = () => {
    const { recordId } = deleteModalConfig;
    if (recordId) {
      const updated = semesterRecords.filter(r => r.id !== recordId);
      setSemesterRecords(updated);
      store.set('semester_records', updated);
    }
    setDeleteModalConfig({ isOpen: false, recordId: null, title: '' });
  };

  // Math-based comparison against previous completed semester
  const getSemesterComparison = (currentIndex: number) => {
    if (currentIndex === 0) return null;
    const currentRec = completedRecords[currentIndex];
    const prevRec = completedRecords[currentIndex - 1];
    const diff = currentRec.sgpa - prevRec.sgpa;
    
    if (diff > 0) {
      return {
        label: `Improved by ${diff.toFixed(2)} SGPA compared to ${prevRec.title}.`,
        isImprovement: true
      };
    } else if (diff < 0) {
      return {
        label: `Decreased by ${Math.abs(diff).toFixed(2)} SGPA compared to ${prevRec.title}.`,
        isImprovement: false
      };
    }
    return {
      label: `Maintained same SGPA as ${prevRec.title}.`,
      isImprovement: true
    };
  };

  // Math-based Performance Badges
  const getPerformanceBadges = (record: SemesterRecord, index: number) => {
    const badges: string[] = [];
    
    if (record.sgpa >= 9.0) {
      badges.push('Outstanding Semester');
    }
    
    if (record.sgpa === highestSGPA && completedRecords.length > 1) {
      badges.push('Personal Best');
    }

    // Progress badge check
    if (index > 0) {
      const prev = completedRecords[index - 1];
      if (record.sgpa > prev.sgpa) {
        badges.push('Excellent Progress');
      }
    }

    // Consistency check
    const isConsistent = record.sgpa >= 8.5 && completedRecords.filter(r => r.sgpa >= 8.5).length >= 3;
    if (isConsistent) {
      badges.push('Consistent Performer');
    }

    return badges;
  };

  // PDF Report Exporter
  const handleExportPDF = async (record: SemesterRecord) => {
    setExportSnapshot(record);
    setIsExporting(true);

    // Render hidden PDF template
    setTimeout(async () => {
      if (!pdfRef.current) return setIsExporting(false);
      const element = pdfRef.current;
      element.style.display = 'block';

      try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${record.title.replace(/\s+/g, '_')}_Academic_Record.pdf`);
        incrementDownloads();
      } catch (err) {
        console.error('Failed to export PDF', err);
      } finally {
        element.style.display = 'none';
        setIsExporting(false);
      }
    }, 100);
  };

  return (
    <div className="cs-page pb-8">
      {isExporting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest animate-pulse">Generating Report Card...</p>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between mb-2">
          <BackButton label="GPA Hub" />
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-xl font-bold text-foreground">Academic Records</h1>
        <p className="text-xs text-muted-foreground">
          Your complete academic journey across every semester.
        </p>
      </div>

      {completedRecords.length === 0 ? (
        /* Empty State */
        <div className="cs-card p-10 flex flex-col items-center justify-center text-center border-dashed border-2 bg-secondary/20 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-primary/15 text-primary rounded-full flex items-center justify-center mb-5 shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Your academic archive is empty</h3>
          <p className="text-xs text-muted-foreground mb-6 max-w-[260px] leading-relaxed">
            Calculate your first semester SGPA to begin building your academic journey.
          </p>
          <button 
            onClick={() => navigate('/utilities/cgpa/calculator?tab=sgpa')}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-[0.97] transition-all flex items-center gap-2 text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Open SGPA Calculator
          </button>
        </div>
      ) : (
        /* Content State */
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Overview Dashboard */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="cs-card p-4 flex flex-col justify-between min-h-[90px] bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest block">Current CGPA</span>
              <span className="text-2xl font-black text-foreground mt-1">{currentCGPA.toFixed(2)}</span>
            </div>
            <div className="cs-card p-4 flex flex-col justify-between min-h-[90px] bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest block">Completed Terms</span>
              <span className="text-2xl font-black text-foreground mt-1">{completedSemestersCount} / 8</span>
            </div>
            <div className="cs-card p-4 flex flex-col justify-between min-h-[90px] bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest block">Highest SGPA</span>
              <span className="text-2xl font-black text-foreground mt-1">{highestSGPA.toFixed(2)}</span>
            </div>
            <div className="cs-card p-4 flex flex-col justify-between min-h-[90px] bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/10">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest block">PDF Report Downloads</span>
              <span className="text-2xl font-black text-foreground mt-1">{pdfDownloads}</span>
            </div>
          </div>

          {/* Academic Timeline Container */}
          <div className="relative pl-6 border-l-2 border-border/80 space-y-6 ml-2">
            {completedRecords.map((record, index) => {
              const isExpanded = !!expandedIds[record.id];
              const comp = getSemesterComparison(index);
              const badges = getPerformanceBadges(record, index);
              const recordCredits = record.subjects.reduce((sum, s) => sum + s.credits, 0);
              
              return (
                <div key={record.id} className="relative group animate-in slide-in-from-left-4 duration-300">
                  
                  {/* Timeline point indicator */}
                  <div className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-4 border-background flex items-center justify-center transition-all ${
                    record.sgpa >= 9.0 
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/10' 
                      : 'bg-primary ring-4 ring-primary/10'
                  }`} />

                  {/* Semester Timeline Node Card */}
                  <div 
                    onClick={() => toggleExpanded(record.id)}
                    className={`cs-card p-4 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm relative ${
                      isExpanded ? 'border-primary/30 bg-primary/5 dark:bg-primary/2.5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">
                            {record.title}
                          </h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            record.sgpa >= 9.0 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {getGradeStatus(record.sgpa)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-1 text-[10px] text-muted-foreground font-semibold">
                          <span>{record.subjects.length} Subjects</span>
                          <span>•</span>
                          <span>{recordCredits} Credits</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(record.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground font-bold block uppercase leading-none">SGPA</span>
                          <span className="text-lg font-black text-foreground block mt-0.5">{record.sgpa.toFixed(2)}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Comparison label indicator */}
                    {comp && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold border-t border-border/40 pt-2.5">
                        {comp.isImprovement ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className={comp.isImprovement ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {comp.label}
                        </span>
                      </div>
                    )}

                    {/* Achievement Badges Pills */}
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {badges.map(b => (
                          <span key={b} className="inline-flex items-center gap-0.5 text-[7px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Award className="w-2.5 h-2.5" />
                            {b}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expandable Section Details Container */}
                    {isExpanded && (
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="mt-4 pt-4 border-t border-border space-y-4 cursor-default animate-in fade-in duration-300"
                      >
                        {/* Subjects performance summary table */}
                        <div className="bg-secondary/40 border border-border/40 rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-secondary/60 text-muted-foreground text-[9px] font-black uppercase tracking-wider border-b border-border/40">
                                <th className="p-2.5 pl-4">Subject</th>
                                <th className="p-2.5 text-center w-16">Credits</th>
                                <th className="p-2.5 text-center w-16">Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {record.subjects.map((sub) => (
                                <tr key={sub.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/15 transition-colors">
                                  <td className="p-2.5 pl-4 font-bold text-foreground truncate max-w-[160px]">{sub.name}</td>
                                  <td className="p-2.5 text-center text-muted-foreground font-semibold">{sub.credits}</td>
                                  <td className="p-2.5 text-center font-black text-primary">{sub.grade || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Action buttons bar */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleExportPDF(record)}
                            className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold rounded-lg text-[10px] active:scale-[0.97] transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-primary" /> Report PDF
                          </button>
                          <button
                            onClick={() => navigate(`/utilities/cgpa/calculator?tab=sgpa&edit=${record.id}`)}
                            className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-primary text-primary-foreground font-bold rounded-lg text-[10px] active:scale-[0.97] transition-all shadow-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => triggerDelete(record.id, record.title, e)}
                            className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/60 hover:border-destructive/20 rounded-lg transition-colors"
                            title="Delete semester record"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Analytics Statistics Panel */}
          <div className="cs-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5 border-b border-border/60 pb-3">
              <Trophy className="w-4 h-4 text-amber-500" /> Academic Statistics Overview
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-muted-foreground uppercase">
              <div>
                <span className="block text-[9px] text-muted-foreground/60">Highest SGPA</span>
                <span className="text-sm font-black text-foreground mt-0.5 block">{highestSGPA.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground/60">Lowest SGPA</span>
                <span className="text-sm font-black text-foreground mt-0.5 block">{lowestSGPA.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground/60">Average SGPA</span>
                <span className="text-sm font-black text-foreground mt-0.5 block">{averageSGPA.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground/60">Best Semester</span>
                <span className="text-sm font-black text-foreground mt-0.5 block truncate max-w-[120px]">
                  {bestSemester ? `${bestSemester.title} (${bestSemester.sgpa.toFixed(2)})` : '-'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground/60">Completed Semesters</span>
                <span className="text-sm font-black text-foreground mt-0.5 block">{completedSemestersCount} / 8</span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground/60">Remaining Semesters</span>
                <span className="text-sm font-black text-foreground mt-0.5 block">{Math.max(0, 8 - completedSemestersCount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deleteModalConfig.isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-[320px] rounded-2xl p-5 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-sm text-foreground mb-1">Delete Academic Record?</h3>
            <p className="text-[10px] text-muted-foreground mb-4">
              Are you sure you want to permanently delete your saved grades for {deleteModalConfig.title}? This action cannot be undone.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModalConfig({ isOpen: false, recordId: null, title: '' })}
                className="flex-1 py-2.5 rounded-xl border border-border bg-transparent hover:bg-secondary text-muted-foreground text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/95 text-destructive-foreground text-xs font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ HIDDEN PDF REPORT CARD TEMPLATE ═══════ */}
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
                  Official Semester Report Card
                </h2>
              </div>
              <div className="text-right">
                <p className="font-black text-[#111827] text-xl" style={{ margin: 0 }}>{recordSnapshotName(exportSnapshot)}</p>
                <div className="mt-1 text-[#4B5563] font-bold text-sm">
                  <p style={{ margin: 0 }}>Course: {exportSnapshot.course || profile.course}</p>
                  <p style={{ margin: 0 }}>Branch: {profile.className}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-[#E5E7EB] mb-8 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[#4B5563] font-black uppercase tracking-wider block">Academic Term</span>
                <span className="text-2xl font-black text-[#111827] mt-1 block">{exportSnapshot.title}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#4B5563] font-black uppercase tracking-wider block">Semester SGPA</span>
                <span className="text-4xl font-black text-[#2563EB] mt-1 block">{exportSnapshot.sgpa.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-black text-[#4B5563] uppercase tracking-wider mb-3">Performance Details</h3>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F3F4F6] text-[#4B5563] text-[10px] font-black uppercase tracking-wider border-b border-[#E5E7EB]">
                    <th className="p-3 pl-4">Subject Name</th>
                    <th className="p-3 text-center w-24">Credits</th>
                    <th className="p-3 text-center w-24">Grade Secured</th>
                  </tr>
                </thead>
                <tbody>
                  {exportSnapshot.subjects.map((sub, i) => (
                    <tr key={i} className="border-b border-[#E5E7EB] last:border-0">
                      <td className="p-3 pl-4 font-bold text-[#111827]">{sub.name}</td>
                      <td className="p-3 text-center text-[#4B5563] font-bold">{sub.credits}</td>
                      <td className="p-3 text-center font-black text-[#2563EB]">{sub.grade || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[#E5E7EB] pt-6 mt-12 flex justify-between items-center text-xs text-[#9CA3AF] font-bold">
              <span>Report Generated on {new Date().toLocaleDateString('en-IN')}</span>
              <span>CampuSync Analytics Engine</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper inside pdf template
const recordSnapshotName = (rec: SemesterRecord) => {
  return rec.studentName || 'Student';
};

export default AcademicRecordsPage;
