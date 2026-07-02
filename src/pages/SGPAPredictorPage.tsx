import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Save, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight, 
  History, 
  Plus, 
  HelpCircle 
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useNavigate } from 'react-router-dom';
import { store } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { GRADES, GRADE_POINTS } from '@/types';
import type { Subject, UserProfile, SemesterRecord } from '@/types';

// Custom Scenario Interface
interface PredictionScenario {
  id: string;
  semester: number;
  name: string;
  sgpa: number;
  subjects: { name: string; credits: number; grade: string }[];
  createdAt: string;
}

// Custom hook to animate numbers smoothly
const useAnimatedNumber = (value: number, duration: number = 400) => {
  const [animatedValue, setAnimatedValue] = useState(value);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = animatedValue;
    const endVal = value;
    
    let animationFrameId: number;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad
      const currentVal = startVal + easedProgress * (endVal - startVal);
      setAnimatedValue(currentVal);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };
    
    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);
  
  return animatedValue;
};

const SGPAPredictorPage = () => {
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);
  
  // App-level state
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
  const [semesterRecords] = useState<SemesterRecord[]>(() => store.get('semester_records', []));
  
  // Page navigation & loader states
  const [viewState, setViewState] = useState<'select_semester' | 'predict'>('select_semester');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  
  // Predictor workspace states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [lastSGPA, setLastSGPA] = useState<number | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  
  // Scenarios state loaded from local storage
  const [scenarios, setScenarios] = useState<PredictionScenario[]>(() => {
    try {
      const cached = localStorage.getItem('campusync_prediction_scenarios');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Save scenarios list changes back to local storage
  useEffect(() => {
    localStorage.setItem('campusync_prediction_scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  // Fallback preset templates
  const getPrefilledSubjectsForSemester = (semNum: number, branch: string): Subject[] => {
    // Only CSE has hardcoded templates for now
    if (branch.toLowerCase().trim() === 'cse') {
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
    }
    
    // Default fallback for other semesters (returns 3 empty subjects for manual entry)
    return [
      { id: crypto.randomUUID(), name: 'Theory Core Course 1', credits: 3, grade: '' },
      { id: crypto.randomUUID(), name: 'Theory Core Course 2', credits: 3, grade: '' },
      { id: crypto.randomUUID(), name: 'Core Laboratory 1', credits: 1.5, grade: '' },
    ];
  };

  // Select semester and load fresh database/preset templates
  const handleSelectSemester = async (num: number) => {
    setIsLoadingTemplate(true);
    setSelectedSemester(num);
    setLastSGPA(null); // Reset session baseline
    
    const reg = profile.regulation || 'R23';
    const branch = profile.className || 'CSE';
    
    let templateSubjects: Subject[] = [];
    let templateLoaded = false;
    
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
        templateLoaded = true;
      }
    } catch (err) {
      console.warn('Error fetching template from Supabase, falling back to local presets', err);
    }
    
    if (templateSubjects.length === 0) {
      templateSubjects = getPrefilledSubjectsForSemester(num, branch);
      // Local preset templates are only for CSE sem 2, 3, and 5
      if (branch.toLowerCase().trim() === 'cse' && (num === 2 || num === 3 || num === 5)) {
        templateLoaded = true;
      }
    }

    setSubjects(templateSubjects);
    setHasTemplate(templateLoaded);
    setIsLoadingTemplate(false);
    setViewState('predict');
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Math calculator functions
  const calculateSGPA = (subs: Subject[]) => {
    const totalCredits = subs.reduce((sum, s) => sum + s.credits, 0);
    const totalWeighted = subs.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0);
    return totalCredits ? +(totalWeighted / totalCredits).toFixed(2) : 0;
  };

  const getAcademicStatus = (val: number) => {
    if (val >= 9.0) return 'Outstanding Performance';
    if (val >= 8.0) return 'Strong Academic Performance';
    if (val >= 7.0) return 'Good Progress';
    if (val >= 6.0) return 'Needs Improvement';
    return 'Academic Risk';
  };

  const getStatusColor = (val: number) => {
    if (val >= 9.0) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (val >= 8.0) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (val >= 7.0) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    if (val >= 6.0) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  };

  // State changes reactive calculators
  const currentSGPA = calculateSGPA(subjects);
  const animatedSGPA = useAnimatedNumber(currentSGPA);

  // Grade updates
  const updateGrade = (index: number, newGrade: string) => {
    // Record baseline score before making change
    if (currentSGPA > 0) {
      setLastSGPA(currentSGPA);
    }
    const updated = [...subjects];
    updated[index].grade = newGrade;
    setSubjects(updated);
  };

  const addSubject = () => {
    setSubjects([...subjects, {
      id: crypto.randomUUID(),
      name: '',
      credits: 3,
      grade: ''
    }]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      if (currentSGPA > 0) setLastSGPA(currentSGPA);
      setSubjects(subjects.filter((_, idx) => idx !== index));
    }
  };

  const updateSubjectName = (index: number, name: string) => {
    const updated = [...subjects];
    updated[index].name = name;
    setSubjects(updated);
  };

  const updateSubjectCredits = (index: number, credits: number) => {
    if (currentSGPA > 0) setLastSGPA(currentSGPA);
    const updated = [...subjects];
    updated[index].credits = credits;
    setSubjects(updated);
  };

  // Grade Impact calculation logic
  const calculatePotentialGain = (index: number): string => {
    const sub = subjects[index];
    if (sub.grade === 'S') return 'Already Optimal';

    // Simulate S grade for this subject
    const simulated = subjects.map((s, idx) => 
      idx === index ? { ...s, grade: 'S' } : s
    );

    const simulatedSGPA = calculateSGPA(simulated);
    const gain = simulatedSGPA - currentSGPA;

    if (gain <= 0) return 'Already Optimal';
    return `Potential Gain: +${gain.toFixed(2)}`;
  };

  // Session differential calculator
  const sessionDelta = lastSGPA !== null && currentSGPA !== lastSGPA ? currentSGPA - lastSGPA : null;

  // Comparison with previous semester actual results
  const prevSemesterNum = selectedSemester ? selectedSemester - 1 : null;
  const prevSemesterRecord = prevSemesterNum 
    ? semesterRecords.find(r => r.title.toLowerCase().trim() === `semester ${prevSemesterNum}`)
    : null;
  const prevSGPA = prevSemesterRecord && prevSemesterRecord.sgpa > 0 ? prevSemesterRecord.sgpa : null;
  const compareDelta = prevSGPA && currentSGPA > 0 ? currentSGPA - prevSGPA : null;

  // Scenario handlers
  const handleSaveScenario = () => {
    if (!selectedSemester) return;
    
    const newScenario: PredictionScenario = {
      id: crypto.randomUUID(),
      semester: selectedSemester,
      name: scenarioName.trim() || `Scenario ${scenarios.filter(s => s.semester === selectedSemester).length + 1}`,
      sgpa: currentSGPA,
      subjects: subjects.map(s => ({ name: s.name, credits: s.credits, grade: s.grade })),
      createdAt: new Date().toISOString()
    };

    setScenarios([newScenario, ...scenarios]);
    setScenarioName('');
    setSaveModalOpen(false);
  };

  const handleLoadScenario = (scenario: PredictionScenario) => {
    // Set baseline so we see session shift differences
    if (currentSGPA > 0) {
      setLastSGPA(currentSGPA);
    }
    
    // Construct subjects mapping back IDs
    const loaded = scenario.subjects.map(s => ({
      id: crypto.randomUUID(),
      name: s.name,
      credits: s.credits,
      grade: s.grade
    }));

    setSubjects(loaded);
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const handleReset = () => {
    if (currentSGPA > 0) {
      setLastSGPA(currentSGPA);
    }
    const reset = subjects.map(s => ({ ...s, grade: '' }));
    setSubjects(reset);
  };

  // Filter scenarios for currently selected semester
  const activeScenarios = scenarios.filter(s => s.semester === selectedSemester);

  return (
    <div className="cs-page pb-8">
      {isLoadingTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest animate-pulse">Loading Simulation...</p>
        </div>
      )}

      {/* Main Header navigation */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between mb-2">
          {viewState === 'select_semester' ? (
            <BackButton label="GPA Hub" />
          ) : (
            <button 
              onClick={() => {
                setViewState('select_semester');
                setSelectedSemester(null);
                setLastSGPA(null);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Back to selection
            </button>
          )}
        </div>
      </div>

      <div ref={topRef} />

      {/* ═══════ SEMESTER SELECTION STATE ═══════ */}
      {viewState === 'select_semester' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-foreground">SGPA Predictor</h1>
            <p className="text-xs text-muted-foreground">
              Simulate different grade outcomes to project your semester performance.
            </p>
          </div>

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
            ].map((sem) => (
              <button
                key={sem.num}
                onClick={() => handleSelectSemester(sem.num)}
                className={`flex flex-col justify-between p-4 min-h-[105px] rounded-2xl border bg-gradient-to-br ${sem.gradient} ${sem.border} shadow-sm active:scale-[0.96] hover:-translate-y-0.5 transition-all duration-300 text-left group relative`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-8 h-8 rounded-xl ${sem.iconBg} flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-110 transition-transform shrink-0`}>
                    {sem.num}
                  </div>
                  <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-secondary text-muted-foreground border-border/40">
                    Predict
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                    {sem.label}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    Run simulations
                  </p>
                </div>
              </button>
            ))}
          </div>

          {scenarios.length > 0 && (
            <div className="border-t border-border pt-6 mt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-primary" />
                Previously Saved Simulations ({scenarios.length})
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {scenarios.slice(0, 4).map(scen => (
                  <div
                    key={scen.id}
                    onClick={() => {
                      setSelectedSemester(scen.semester);
                      // Preload scenario
                      const loaded = scen.subjects.map(s => ({
                        id: crypto.randomUUID(),
                        name: s.name,
                        credits: s.credits,
                        grade: s.grade
                      }));
                      setSubjects(loaded);
                      setViewState('predict');
                      setLastSGPA(null);
                    }}
                    className="cs-card p-3 flex items-center justify-between hover:border-primary/40 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{scen.name}</p>
                      <p className="text-[10px] text-muted-foreground">Semester {scen.semester} • {new Date(scen.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="bg-primary/10 text-primary font-black px-2.5 py-1 rounded-lg text-xs">
                        {scen.sgpa.toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => handleDeleteScenario(scen.id, e)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ PREDICTION WORKSPACE STATE ═══════ */}
      {viewState === 'predict' && selectedSemester && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Live Prediction Card */}
          <div className="cs-card-elevated p-6 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20 shadow-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mb-1">Expected SGPA Prediction</p>
              
              <div className="relative flex items-center justify-center my-2">
                <span className="text-5xl font-black text-foreground tracking-tighter">
                  {animatedSGPA.toFixed(2)}
                </span>
                
                {/* Session delta badge overlay */}
                {sessionDelta !== null && sessionDelta !== 0 && (
                  <div className={`absolute -right-16 top-1 text-xs font-black flex items-center gap-0.5 px-2 py-0.5 rounded-full border animate-in scale-in duration-300 ${
                    sessionDelta > 0 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  }`}>
                    {sessionDelta > 0 ? `+${sessionDelta.toFixed(2)}` : `${sessionDelta.toFixed(2)}`}
                  </div>
                )}
              </div>

              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusColor(currentSGPA)}`}>
                <Sparkles className="w-3.5 h-3.5" />
                {getAcademicStatus(currentSGPA)}
              </div>
            </div>

            {/* Compare with Previous Semester widget */}
            {prevSGPA !== null && (
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-bold">
                <div>
                  <span className="block text-[10px] text-muted-foreground/60 uppercase">Previous Semester (S{prevSemesterNum})</span>
                  <span className="text-sm font-black text-foreground">{prevSGPA.toFixed(2)}</span>
                </div>
                <div className="text-center font-black">
                  {compareDelta !== null && compareDelta !== 0 ? (
                    <div className={`flex flex-col items-center justify-center ${compareDelta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <span className="text-sm">{compareDelta > 0 ? `+${compareDelta.toFixed(2)}` : `${compareDelta.toFixed(2)}`}</span>
                      <span className="text-[8px] uppercase tracking-widest">Projected Shift</span>
                    </div>
                  ) : (
                    <span>No Shift</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-muted-foreground/60 uppercase">Simulation target (S{selectedSemester})</span>
                  <span className="text-sm font-black text-foreground">{currentSGPA.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick utility controllers */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground text-xs font-bold transition-all active:scale-[0.97]"
            >
              <Save className="w-4 h-4 text-primary" />
              Save Simulation
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center p-3 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors active:scale-[0.97]"
              title="Reset grades"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Simulated grade inputs list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Simulation Workspace</h3>
              <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-md text-muted-foreground font-black">
                {subjects.reduce((sum, s) => sum + s.credits, 0)} Total Credits
              </span>
            </div>

            <div className="space-y-3">
              {subjects.map((sub, i) => (
                <div key={sub.id} className="cs-card p-3.5 border-l-4 border-l-amber-500/40 relative">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0 flex-1">
                      {hasTemplate ? (
                        <>
                          <h4 className="font-bold text-xs text-foreground line-clamp-2 leading-relaxed">
                            {sub.name || `Subject ${i + 1}`}
                          </h4>
                          <p className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                            {sub.credits} Credits • {calculatePotentialGain(i)}
                          </p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Subject name"
                              value={sub.name}
                              onChange={(e) => updateSubjectName(i, e.target.value)}
                              className="flex-1 bg-secondary border-none rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-amber-500/30 placeholder:text-muted-foreground/50"
                            />
                            {subjects.length > 1 && (
                              <button
                                onClick={() => removeSubject(i)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={sub.credits}
                              onChange={(e) => updateSubjectCredits(i, parseFloat(e.target.value))}
                              className="bg-secondary border-none rounded-lg px-2.5 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-amber-500/30"
                            >
                              {[0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].map(c => (
                                <option key={c} value={c}>{c} Credits</option>
                              ))}
                            </select>
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                              • {calculatePotentialGain(i)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Expected Grade</label>
                      <select
                        value={sub.grade}
                        onChange={(e) => updateGrade(i, e.target.value)}
                        className="w-full bg-secondary border-none rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-amber-500/30"
                      >
                        <option value="">Select Grade</option>
                        {GRADES.map(g => (
                          <option key={g} value={g}>{g} ({GRADE_POINTS[g]} Pts)</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-right flex flex-col justify-end">
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Simulated Score</span>
                      <div className="bg-secondary/40 border border-border/40 text-foreground rounded-lg py-1.5 px-3 text-xs font-black inline-block self-end">
                        {(GRADE_POINTS[sub.grade] ?? 0) * sub.credits} Points
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!hasTemplate && (
                <button
                  onClick={addSubject}
                  className="w-full py-3 rounded-xl border border-dashed border-primary/20 hover:border-primary/40 text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-primary/5 hover:bg-primary/10 mt-3 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" /> Add Subject to Simulation
                </button>
              )}
            </div>
          </div>

          {/* Active scenarios comparisons */}
          {activeScenarios.length > 0 && (
            <div className="border-t border-border pt-6 mt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-primary" />
                Saved Scenarios for Semester {selectedSemester}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {activeScenarios.map(scen => (
                  <div
                    key={scen.id}
                    onClick={() => handleLoadScenario(scen)}
                    className={`cs-card p-3 flex items-center justify-between hover:border-amber-500/40 transition-colors cursor-pointer group ${
                      scen.sgpa.toFixed(2) === currentSGPA.toFixed(2) ? 'border-amber-500/40 bg-amber-500/5' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{scen.name}</p>
                      <p className="text-[9px] text-muted-foreground">{new Date(scen.createdAt).toLocaleDateString('en-IN')} • {scen.subjects.filter(s => s.grade !== '').length} Graded</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black px-2.5 py-1 rounded-lg text-xs">
                        {scen.sgpa.toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => handleDeleteScenario(scen.id, e)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alert explaining sandbox mode */}
          <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 flex gap-3 text-xs text-muted-foreground">
            <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-foreground">Simulator Mode</p>
              <p className="leading-relaxed text-[11px]">
                Predictions run in a temporary sandbox. None of these changes will affect your saved semester records, official history tables, or cumulative trend calculations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Scenario Modal Dialog */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-[340px] rounded-2xl p-5 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-sm text-foreground mb-1">Save Simulation Scenario</h3>
            <p className="text-[10px] text-muted-foreground mb-4">Enter a custom name for this prediction scenario to compare it later.</p>
            
            <input
              type="text"
              placeholder="e.g. Best Case, Worst Case"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full bg-secondary border-none rounded-xl px-3 py-3 text-xs outline-none focus:ring-1 focus:ring-primary/20 mb-4 placeholder:text-muted-foreground"
              maxLength={25}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSaveModalOpen(false);
                  setScenarioName('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-border bg-transparent hover:bg-secondary text-muted-foreground text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SGPAPredictorPage;
