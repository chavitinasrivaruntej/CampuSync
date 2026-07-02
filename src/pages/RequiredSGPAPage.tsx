import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trophy, 
  Sparkles, 
  Target, 
  Settings, 
  Info, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen 
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
  // Final CGPA = ((Current CGPA * Completed) + (Required SGPA * Remaining)) / 8
  // Required SGPA = ((Target CGPA * 8) - (Current CGPA * Completed)) / Remaining
  const calculateRequiredSGPA = () => {
    if (completedSemesters >= 8) return 0;
    const required = ((targetCGPA * 8) - (currentCGPA * completedSemesters)) / remainingSemesters;
    return required > 0 ? +required.toFixed(2) : 0;
  };
  
  const requiredSGPA = calculateRequiredSGPA();
  const animatedRequiredSGPA = useAnimatedNumber(requiredSGPA);

  // Goal Difficulty Indicator Classifier
  const getGoalDifficulty = (val: number) => {
    if (val > 10.0) return { label: 'Impossible', desc: 'Target is currently out of reach. Try adjusting your target CGPA.', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    if (val > 9.5) return { label: 'Very Challenging', desc: 'Requires exceptional performance across the remaining semesters.', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    if (val > 8.5) return { label: 'Challenging', desc: "You'll need to perform above your current average.", color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    if (val > 7.5) return { label: 'Moderate', desc: 'Requires consistent performance.', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    return { label: 'Easy', desc: 'Your target is comfortably achievable.', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  };

  const difficulty = getGoalDifficulty(requiredSGPA);

  // Scenario projections matrix
  const getFinalCGPAForAverage = (avg: number) => {
    const final = ((currentCGPA * completedSemesters) + (avg * remainingSemesters)) / 8;
    return +final.toFixed(2);
  };

  // Progress Ring logic
  // Progress Ring radius = 32, circumference = 2 * PI * r = 201.06
  const progressRatio = targetCGPA > 0 ? Math.min(1, currentCGPA / targetCGPA) : 0;
  const ringCircumference = 201.06;
  const strokeDashoffset = ringCircumference - (progressRatio * ringCircumference);

  // Motivation Card Insight Generator
  const getMotivationMessage = () => {
    if (completedSemesters >= 8) {
      return 'All 8 semesters completed! Check your final CGPA on the CGPA Calculator tab.';
    }
    if (requiredSGPA > 10.0) {
      return `Your target of ${targetCGPA.toFixed(2)} is mathematically out of reach in the remaining ${remainingSemesters} semester${remainingSemesters > 1 ? 's' : ''}. Try adjusting your target to a slightly lower value.`;
    }
    const diff = targetCGPA - currentCGPA;
    if (diff <= 0) {
      return `Excellent work! Your current CGPA (${currentCGPA.toFixed(2)}) is already at or above your target CGPA of ${targetCGPA.toFixed(2)}. Maintain your current average to stay ahead.`;
    }
    return `You are only ${diff.toFixed(2)} CGPA away from your goal. Maintain an average SGPA of ${requiredSGPA.toFixed(2)} for the remaining ${remainingSemesters} semester${remainingSemesters > 1 ? 's' : ''} to reach your target.`;
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
          Academic planner to calculate the average SGPA needed in remaining terms to reach target CGPA goals.
        </p>
      </div>

      {/* Mode Toggle Selector */}
      {hasSavedRecords && (
        <div className="flex bg-secondary rounded-xl p-1 mb-6">
          <button
            onClick={() => setIsManualMode(false)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              !isManualMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Linked Mode (Auto)
          </button>
          <button
            onClick={() => setIsManualMode(true)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              isManualMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Manual Simulation
          </button>
        </div>
      )}

      {/* Academic Goal Summary Card */}
      <div className="cs-card-elevated p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20 shadow-md mb-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div>
                <span className="block text-[10px] text-muted-foreground/60 mb-0.5">Current CGPA</span>
                <span className="text-sm font-black text-foreground">{currentCGPA.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground/60 mb-0.5">Target CGPA</span>
                <span className="text-sm font-black text-foreground">{targetCGPA.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground/60 mb-0.5">Completed Terms</span>
                <span className="text-sm font-black text-foreground">{completedSemesters} / 8</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground/60 mb-0.5">Remaining Terms</span>
                <span className="text-sm font-black text-foreground">{remainingSemesters}</span>
              </div>
            </div>
          </div>

          {/* SVG Progress Ring */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                className="stroke-secondary"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                className="stroke-primary transition-all duration-500 ease-out"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={ringCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-[10px] font-black text-primary">
                {Math.round(progressRatio * 100)}%
              </span>
              <span className="block text-[6px] uppercase font-bold text-muted-foreground">Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Required SGPA Main Prominent Card */}
      <div className="cs-card p-6 flex flex-col items-center justify-center text-center border-2 border-primary/20 mb-6">
        <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mb-1">Average SGPA Required</p>
        <span className="text-5xl font-black text-primary tracking-tighter my-2">
          {requiredSGPA > 10.0 ? '> 10.00' : animatedRequiredSGPA.toFixed(2)}
        </span>
        <div className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${difficulty.color}`}>
          <Target className="w-3 h-3" />
          {difficulty.label}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 max-w-[280px]">
          {difficulty.desc}
        </p>
      </div>

      {/* Target CGPA interactive Slider panel */}
      <div className="cs-card p-5 space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" /> Desired Target CGPA
          </label>
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
            className="w-16 bg-secondary border-none rounded-lg px-2 py-1 text-xs font-bold text-right outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-4">
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

      {/* Manual Input Workspaces (Manual Mode Only) */}
      {isManualMode && (
        <div className="cs-card p-5 space-y-4 mb-6 animate-in fade-in duration-300">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-primary" /> Simulator Settings
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5 block">Current CGPA</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.05"
                value={manualCGPA}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setManualCGPA(Math.min(10.0, Math.max(0, val)));
                }}
                className="w-full bg-secondary border-none rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5 block">Completed Terms</label>
              <select
                value={manualCompleted}
                onChange={(e) => setManualCompleted(parseInt(e.target.value))}
                className="w-full bg-secondary border-none rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20"
              >
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <option key={n} value={n}>{n} Semester{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Comparisons Panels */}
      {completedSemesters < 8 && (
        <div className="cs-card p-5 space-y-3 mb-6">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Scenario Projection Matrix
          </h3>
          
          <div className="grid grid-cols-1 gap-2.5">
            {[8.5, 9.0, 9.5, 10.0].map(avg => {
              const projected = getFinalCGPAForAverage(avg);
              const isMeetingGoal = projected >= targetCGPA;
              
              return (
                <div key={avg} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/20">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">If you average</span>
                    <span className="text-xs font-black text-foreground">{avg.toFixed(1)} SGPA</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Final CGPA</span>
                    <span className={`text-xs font-black flex items-center gap-1 justify-end ${isMeetingGoal ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {projected.toFixed(2)}
                      <span className="text-[9px] font-medium opacity-80">
                        {isMeetingGoal ? '(Target Met)' : '(Short)'}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Motivation Card Info Alert */}
      <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 flex gap-3 text-xs text-muted-foreground">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-foreground">Motivation & Academic Insights</p>
          <p className="leading-relaxed text-[11px]">
            {getMotivationMessage()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequiredSGPAPage;
