import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trophy, 
  Sparkles, 
  Target, 
  BookOpen, 
  TrendingUp 
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useNavigate } from 'react-router-dom';
import { store } from '@/lib/store';
import type { SemesterRecord } from '@/types';

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

const RequiredSGPAPage = () => {
  const navigate = useNavigate();
  
  // App-level state (loaded from global store)
  const [semesterRecords] = useState<SemesterRecord[]>(() => store.get('semester_records', []));
  
  // Mode Selection: Linked (Auto) vs Manual
  const completedRecords = semesterRecords.filter(r => r.sgpa > 0);
  const hasSavedRecords = completedRecords.length > 0;
  const [isManualMode, setIsManualMode] = useState(!hasSavedRecords);
  
  // Auto-calculated fields
  const autoCompletedSemesters = completedRecords.length;
  const autoRemainingSemesters = Math.max(1, 8 - autoCompletedSemesters);
  
  const totalCredits = completedRecords.reduce((sum, r) => 
    sum + r.subjects.reduce((sSum, s) => sSum + s.credits, 0), 0
  );
  const totalWeighted = completedRecords.reduce((sum, r) => 
    sum + r.sgpa * r.subjects.reduce((sSum, s) => sSum + s.credits, 0), 0
  );
  const autoCurrentCGPA = totalCredits 
    ? +(totalWeighted / totalCredits).toFixed(2)
    : completedRecords.length 
      ? +(completedRecords.reduce((sum, r) => sum + r.sgpa, 0) / completedRecords.length).toFixed(2)
      : 0;

  // Manual inputs
  const [manualCGPA, setManualCGPA] = useState(8.0);
  const [manualCompleted, setManualCompleted] = useState(3);
  
  // Target CGPA (Shared)
  const [targetCGPA, setTargetCGPA] = useState(8.5);

  // Derived state fields based on active mode
  const currentCGPA = isManualMode ? manualCGPA : autoCurrentCGPA;
  const completedSemesters = isManualMode ? manualCompleted : autoCompletedSemesters;
  const remainingSemesters = isManualMode ? Math.max(1, 8 - manualCompleted) : autoRemainingSemesters;
  
  // Core Math Engine: CGPA Target Equations
  const calculateRequiredSGPA = () => {
    if (completedSemesters >= 8) return 0;
    const required = ((targetCGPA * 8) - (currentCGPA * completedSemesters)) / remainingSemesters;
    return required > 0 ? +required.toFixed(2) : 0;
  };
  
  const requiredSGPA = calculateRequiredSGPA();
  const animatedRequiredSGPA = useAnimatedNumber(requiredSGPA);

  // Scenario projections
  const getFinalCGPAForAverage = (avg: number) => {
    const final = ((currentCGPA * completedSemesters) + (avg * remainingSemesters)) / 8;
    return +final.toFixed(2);
  };

  // Conversational advice generator
  const getAcademicAdviceText = (val: number) => {
    if (completedSemesters >= 8) {
      return 'All 8 semesters completed! Check your final CGPA on the CGPA Calculator tab.';
    }
    if (val > 10.0) {
      return 'This target is mathematically out of reach with your remaining credits. Try adjusting your target CGPA.';
    }
    
    let difficultyDesc = '';
    if (val <= currentCGPA) {
      difficultyDesc = 'Your target is comfortably achievable.';
    } else if (val <= 8.5) {
      difficultyDesc = 'Maintain performance slightly above your current average.';
    } else {
      difficultyDesc = 'This target will require consistently excellent performance.';
    }

    const diff = targetCGPA - currentCGPA;
    const gapText = diff > 0 
      ? `You are only ${diff.toFixed(2)} CGPA away from your target.` 
      : 'Your current performance already puts you on a strong path.';

    return `${difficultyDesc} ${gapText} Maintain an average SGPA of ${val.toFixed(2)} in your remaining semesters to reach your goal.`;
  };

  return (
    <div className="cs-page pb-8">
      {/* Back navigation header */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between mb-2">
          <BackButton label="GPA Hub" />
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-xl font-bold text-foreground">Required SGPA</h1>
        <p className="text-xs text-muted-foreground">
          Determine the average grade points you need in future semesters to hit your target CGPA.
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Current Academic Status */}
        <div className="cs-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" /> Current Academic Status
            </h3>
            {hasSavedRecords && (
              <button 
                onClick={() => setIsManualMode(!isManualMode)}
                className="text-[10px] font-extrabold text-primary hover:underline bg-secondary/80 px-2.5 py-1 rounded-md"
              >
                {isManualMode ? 'Switch to Auto' : 'Switch to Manual'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-secondary/30 border border-border/30 rounded-xl p-3 flex flex-col justify-between min-h-[96px]">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Current CGPA</span>
              {isManualMode ? (
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.00"
                  max="10.00"
                  step="0.01"
                  value={manualCGPA}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      setManualCGPA(val);
                    } else if (e.target.value === '') {
                      setManualCGPA(0);
                    }
                  }}
                  onBlur={() => {
                    const clamped = Math.min(10.0, Math.max(0, manualCGPA));
                    setManualCGPA(parseFloat(clamped.toFixed(2)));
                  }}
                  className="w-full bg-secondary border border-border rounded-xl mt-1.5 py-1.5 px-2 text-center text-xs font-black outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-foreground transition-all"
                />
              ) : (
                <span className="text-sm font-black text-foreground block mt-1.5 py-1.5">{currentCGPA.toFixed(2)}</span>
              )}
            </div>

            <div className="bg-secondary/30 border border-border/30 rounded-xl p-3 flex flex-col justify-between min-h-[96px]">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Completed Semesters</span>
              {isManualMode ? (
                <select
                  value={manualCompleted}
                  onChange={(e) => setManualCompleted(parseInt(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl mt-1.5 py-1.5 px-2 text-center text-xs font-bold outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-foreground transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-black text-foreground block mt-1.5 py-1.5">{completedSemesters}</span>
              )}
            </div>

            <div className="bg-secondary/30 border border-border/30 rounded-xl p-3 flex flex-col justify-between min-h-[96px]">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Remaining Semesters</span>
              <span className="text-sm font-black text-foreground block mt-1.5 py-1.5">{remainingSemesters}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Target CGPA */}
        <div className="cs-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-500" /> Target CGPA
            </h3>
            <input
              type="number"
              min="6.0"
              max="10.0"
              step="0.01"
              value={targetCGPA}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  setTargetCGPA(Math.min(10.0, Math.max(6.0, val)));
                }
              }}
              className="w-16 bg-secondary border-none rounded-lg px-2 py-1 text-xs font-bold text-right outline-none focus:ring-1 focus:ring-primary/20 text-foreground"
            />
          </div>
          
          <div className="flex items-center gap-4 pt-1">
            <input
              type="range"
              min="6.0"
              max="10.0"
              step="0.05"
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(parseFloat(e.target.value))}
              className="flex-1 accent-primary bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground font-black uppercase tracking-wider">
            <span>6.00</span>
            <span>8.00</span>
            <span>10.00</span>
          </div>
        </div>

        {/* Section 3: Required SGPA (Hero Card) */}
        <div className="cs-card p-6 flex flex-col items-center justify-center text-center border-2 border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-transparent relative shadow-md">
          <span className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mb-1">Average SGPA Required</span>
          <span className="text-6xl font-black text-primary tracking-tighter my-2 block">
            {requiredSGPA > 10.0 ? '> 10.00' : animatedRequiredSGPA.toFixed(2)}
          </span>
          
          <p className="text-xs text-foreground mt-3 max-w-[280px] leading-relaxed font-semibold">
            You need to maintain an average SGPA of <span className="font-extrabold text-primary">{requiredSGPA > 10.0 ? 'over 10.00' : requiredSGPA.toFixed(2)}</span> across your remaining <span className="font-extrabold">{remainingSemesters} semester{remainingSemesters > 1 ? 's' : ''}</span> to reach a final CGPA of <span className="font-extrabold">{targetCGPA.toFixed(2)}</span>.
          </p>

          {/* Academic Advice / Recommendation */}
          <div className="mt-4 pt-4 border-t border-border/40 w-full text-xs text-muted-foreground space-y-1 text-left">
            <p className="font-bold text-foreground">Academic Advice</p>
            <p className="leading-relaxed text-[11px]">
              {getAcademicAdviceText(requiredSGPA)}
            </p>
          </div>
        </div>

        {/* Section 4: Possible Outcomes */}
        {completedSemesters < 8 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> Possible Outcomes
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[8.5, 9.0, 9.5, 10.0].map(avg => {
                const projected = getFinalCGPAForAverage(avg);
                return (
                  <div key={avg} className="cs-card p-3.5 flex flex-col justify-between bg-secondary/10 border-border/30">
                    <div>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">If you average</span>
                      <span className="text-xs font-black text-foreground mt-0.5 block">{avg.toFixed(1)} SGPA</span>
                    </div>
                    <div className="border-t border-border/40 mt-3 pt-3 flex justify-between items-baseline">
                      <span className="text-[8px] text-muted-foreground font-bold uppercase">Final CGPA</span>
                      <span className="text-xs font-black text-primary">{projected.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequiredSGPAPage;
