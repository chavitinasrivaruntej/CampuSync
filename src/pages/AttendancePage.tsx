import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown, Clock, BookOpen, ShieldCheck, AlertTriangle, Search, Star, Edit } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useNavigate } from 'react-router-dom';
import { store, useStore } from '@/lib/store';
import type { AttendanceRecord } from '@/types';
import { toast } from 'sonner';

const THRESHOLD = 75;

const AttendancePage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useStore<AttendanceRecord[]>('attendance', []);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRec, setNewRec] = useState({ subject: '', totalClasses: '', attendedClasses: '', subjectType: 'Theory' });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showEdit, setShowEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({ subject: '', totalClasses: '', attendedClasses: '', subjectType: 'Theory' });

  // Simulate premium load on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const save = useCallback((updated: AttendanceRecord[]) => {
    setRecords(updated);
    store.set('attendance', updated);
  }, []);

  const addRecord = () => {
    if (!newRec.subject.trim()) {
      toast.error('Subject name is required');
      return;
    }
    const tClasses = +newRec.totalClasses || 0;
    const aClasses = +newRec.attendedClasses || 0;

    if (aClasses > tClasses) {
      toast.error('Attended classes cannot be greater than total classes');
      return;
    }

    const rec: AttendanceRecord = {
      id: crypto.randomUUID(),
      subject: newRec.subject.trim(),
      totalClasses: tClasses,
      attendedClasses: aClasses,
      subjectType: newRec.subjectType as any,
      isPinned: false
    };
    save([...records, rec]);
    setNewRec({ subject: '', totalClasses: '', attendedClasses: '', subjectType: 'Theory' });
    setShowAdd(false);
    toast.success('Subject added successfully');
  };

  const openEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditForm({
      subject: rec.subject,
      totalClasses: rec.totalClasses.toString(),
      attendedClasses: rec.attendedClasses.toString(),
      subjectType: rec.subjectType || 'Theory'
    });
    setShowEdit(true);
  };

  const saveEditRecord = () => {
    if (!editingRecord) return;
    if (!editForm.subject.trim()) {
      toast.error('Subject name is required');
      return;
    }
    const tClasses = +editForm.totalClasses || 0;
    const aClasses = +editForm.attendedClasses || 0;

    if (aClasses > tClasses) {
      toast.error('Attended classes cannot be greater than total classes');
      return;
    }

    const updated = records.map(r => {
      if (r.id === editingRecord.id) {
        return {
          ...r,
          subject: editForm.subject.trim(),
          totalClasses: tClasses,
          attendedClasses: aClasses,
          subjectType: editForm.subjectType as any
        };
      }
      return r;
    });
    save(updated);
    setShowEdit(false);
    setEditingRecord(null);
    toast.success('Subject updated successfully');
  };

  const removeRecord = (id: string, subjectName: string) => {
    const backup = [...records];
    save(records.filter((r) => r.id !== id));
    toast('Subject removed', {
      action: {
        label: 'Undo',
        onClick: () => save(backup),
      },
    });
  };

  const getPercentage = (attended: number, total: number) =>
    total > 0 ? +((attended / total) * 100).toFixed(1) : 0;

  const getSafeBunks = (attended: number, total: number) => {
    if (total === 0) return 0;
    return Math.max(0, Math.floor(attended / (THRESHOLD / 100)) - total);
  };

  const getClassesNeeded = (attended: number, total: number) => {
    const pct = getPercentage(attended, total);
    if (pct >= THRESHOLD) return 0;
    return Math.max(0, Math.ceil(((THRESHOLD / 100) * total - attended) / (1 - (THRESHOLD / 100))));
  };

  const handleAttendance = (id: string, isPresent: boolean) => {
    const backup = [...records];
    let subjectName = '';

    const updated = records.map((rec) => {
      if (rec.id === id) {
        subjectName = rec.subject;
        return {
          ...rec,
          totalClasses: rec.totalClasses + 1,
          attendedClasses: isPresent ? rec.attendedClasses + 1 : rec.attendedClasses,
        };
      }
      return rec;
    });

    save(updated);
    
    toast.success(`Marked ${isPresent ? 'Present' : 'Absent'} for ${subjectName}`, {
      action: {
        label: 'Undo',
        onClick: () => save(backup),
      },
      duration: 4000,
    });
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedCards(newExpanded);
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = records.map((r) => {
      if (r.id === id) {
        const nextPinned = !r.isPinned;
        toast.success(nextPinned ? `Pinned ${r.subject}` : `Unpinned ${r.subject}`);
        return { ...r, isPinned: nextPinned };
      }
      return r;
    });
    save(updated);
  };

  // derived metrics based on the unified thresholds logic
  const stats = useMemo(() => {
    let safe = 0, improving = 0, risky = 0, critical = 0;
    records.forEach(r => {
      const pct = getPercentage(r.attendedClasses, r.totalClasses);
      if (pct >= 75) safe++;
      else if (pct >= 65) improving++;
      else if (pct >= 50) risky++;
      else critical++;
    });
    return { total: records.length, safe, improving, risky, critical };
  }, [records]);

  // Insights logic
  const insights = useMemo(() => {
    if (records.length === 0) return null;
    let strongest = records[0];
    let weakest = records[0];
    let nearestRisk = null;
    let minDiffToRisk = 999;

    records.forEach(r => {
      const pct = getPercentage(r.attendedClasses, r.totalClasses);
      const strongestPct = getPercentage(strongest.attendedClasses, strongest.totalClasses);
      const weakestPct = getPercentage(weakest.attendedClasses, weakest.totalClasses);

      if (pct > strongestPct) strongest = r;
      if (pct < weakestPct) weakest = r;

      if (pct >= THRESHOLD) {
        const bunks = getSafeBunks(r.attendedClasses, r.totalClasses);
        if (bunks < minDiffToRisk) {
          minDiffToRisk = bunks;
          nearestRisk = r;
        }
      }
    });

    return { strongest, weakest, nearestRisk: minDiffToRisk <= 2 ? nearestRisk : null };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(rec => rec.subject.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [records, searchQuery]);

  const overallStats = useMemo(() => {
    let totalAttended = 0;
    let totalClasses = 0;
    records.forEach(r => {
      totalAttended += r.attendedClasses;
      totalClasses += r.totalClasses;
    });
    const overallPct = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    
    let overallStatus = 'Safe';
    let overallInsight = "You're safely above the minimum requirement.";
    if (overallPct < 50) {
      overallStatus = 'Critical';
      overallInsight = 'Critical status. Attendance is below the minimum required.';
    } else if (overallPct < 65) {
      overallStatus = 'Risky';
      overallInsight = 'Risky zone. Avoid bunking anymore.';
    } else if (overallPct < 75) {
      overallStatus = 'Improving';
      overallInsight = 'You need a small push to get back to the safe zone.';
    }
    
    return { totalAttended, totalClasses, overallPct, overallStatus, overallInsight };
  }, [records]);

  const { pinnedRecords, otherRecords } = useMemo(() => {
    const pinned = filteredRecords.filter(r => r.isPinned);
    const other = filteredRecords.filter(r => !r.isPinned);
    
    other.sort((a, b) => {
      const pctA = getPercentage(a.attendedClasses, a.totalClasses);
      const pctB = getPercentage(b.attendedClasses, b.totalClasses);
      return pctA - pctB;
    });
    
    return { pinnedRecords: pinned, otherRecords: other };
  }, [filteredRecords]);

  const renderCard = (rec: AttendanceRecord) => {
    const pct = getPercentage(rec.attendedClasses, rec.totalClasses);
    const safeBunks = getSafeBunks(rec.attendedClasses, rec.totalClasses);
    const needed = getClassesNeeded(rec.attendedClasses, rec.totalClasses);
    
    const isSafe = pct >= 75;
    const isImproving = pct >= 65 && pct < 75;
    const isRisky = pct >= 50 && pct < 65;
    const isCritical = pct < 50;

    const isExpanded = expandedCards.has(rec.id);

    // Predict Next
    const nextIfPresent = getPercentage(rec.attendedClasses + 1, rec.totalClasses + 1);
    const nextIfAbsent = getPercentage(rec.attendedClasses, rec.totalClasses + 1);

    let statusColor = "";
    let bgGradient = "";
    let progressColor = "";
    let BadgeIcon = CheckCircle2;
    let statusText = "";
    let message = "";

    if (isCritical) {
      statusColor = "text-red-500";
      bgGradient = "from-red-500/5 to-transparent border-red-500/20";
      progressColor = "bg-red-500";
      BadgeIcon = XCircle;
      statusText = "Critical";
      message = `Critical. Need ${needed} continuous classes.`;
    } else if (isRisky) {
      statusColor = "text-rose-500";
      bgGradient = "from-rose-500/5 to-transparent border-rose-500/20";
      progressColor = "bg-rose-500";
      BadgeIcon = AlertTriangle;
      statusText = "Risky";
      message = `Attend next ${needed} classes to reach safe zone`;
    } else if (isImproving) {
      statusColor = "text-amber-500";
      bgGradient = "from-amber-500/5 to-transparent border-amber-500/20";
      progressColor = "bg-amber-500";
      BadgeIcon = AlertCircle;
      statusText = "Improving";
      message = `Attend next ${needed} classes to reach safe zone`;
    } else {
      statusColor = "text-emerald-500";
      bgGradient = "from-emerald-500/5 to-transparent border-emerald-500/20";
      progressColor = "bg-emerald-500";
      BadgeIcon = CheckCircle2;
      statusText = "Safe";
      if (safeBunks === 0) message = "You are exactly in the safe zone";
      else message = `You can miss ${safeBunks} more ${safeBunks === 1 ? 'class' : 'classes'}`;
    }

    return (
      <div 
        key={rec.id} 
        onClick={() => toggleExpand(rec.id)}
        className={`flex flex-col rounded-[2rem] border bg-card shadow-sm overflow-hidden transition-all duration-300 ${bgGradient} bg-gradient-to-br cursor-pointer`}
      >
        {/* Main Card Content */}
        <div className="p-5 pb-3">
          
          <div className="flex justify-between items-start mb-4">
            <div className="max-w-[70%] flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); togglePin(rec.id, e); }}
                  className="focus:outline-none transition-transform active:scale-75"
                >
                  <Star className={`w-5 h-5 ${rec.isPinned ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30 hover:text-amber-500'}`} />
                </button>
                <h3 className="font-bold text-base text-foreground leading-tight tracking-tight">{rec.subject}</h3>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-current bg-background/50 ${statusColor}`}>
                  <BadgeIcon className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{statusText}</span>
                </div>
                {rec.subjectType && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-secondary/80 text-muted-foreground border px-2 py-0.5 rounded-full border-border/40">
                    {rec.subjectType}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end justify-start">
              <span className={`text-4xl tracking-tighter font-black ${statusColor}`}>
                {pct.toFixed(0)}<span className="text-xl font-bold opacity-80">%</span>
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-3 bg-secondary/80 rounded-full overflow-hidden mb-3 relative drop-shadow-sm">
            <div className="absolute top-0 bottom-0 w-[2px] bg-red-500/40 z-10" style={{ left: '50%' }} />
            <div className="absolute top-0 bottom-0 w-[2px] bg-orange-500/40 z-10" style={{ left: '65%' }} />
            <div className="absolute top-0 bottom-0 w-[2px] bg-emerald-500/30 z-10" style={{ left: '75%' }} />
            
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end ${progressColor} shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]`}
              style={{ width: `${Math.min(Math.max(pct, 2), 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center gap-2 mb-2">
            <span className="text-[11px] text-muted-foreground font-semibold tracking-wider uppercase border px-2.5 py-1 rounded-lg border-border/40 bg-secondary/30 whitespace-nowrap">
              <span className="text-foreground">{rec.attendedClasses}</span> / {rec.totalClasses} classes
            </span>
            <span className={`text-[11px] sm:text-[12px] font-semibold text-right leading-tight break-words ${statusColor} opacity-90`}>
              {message}
            </span>
          </div>
        </div>

        {/* Click for More Details Expander */}
        <div 
          className="w-full text-center py-2.5 border-t border-border/30 bg-card/60 cursor-pointer active:bg-secondary/20 transition-colors"
          onClick={() => toggleExpand(rec.id)}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            {isExpanded ? 'Hide Details' : 'Click for More Details'}
          </span>
        </div>

        {/* Expanded Predictions View */}
        <div className={`overflow-hidden transition-all duration-300 bg-secondary/10 ${isExpanded ? 'max-h-[350px] opacity-100 border-t border-border/30' : 'max-h-0 opacity-0'}`}>
           <div className="p-5">
             <div className="grid grid-cols-2 gap-3">
               <div className="flex flex-col border border-border/50 rounded-2xl p-3 bg-card shadow-sm">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex gap-1.5 items-center mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500"/> If Present
                  </span>
                  <span className="text-xl font-black text-foreground">{nextIfPresent.toFixed(1)}%</span>
               </div>
               <div className="flex flex-col border border-border/50 rounded-2xl p-3 bg-card shadow-sm">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex gap-1.5 items-center mb-1">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500"/> If Absent
                  </span>
                  <span className="text-xl font-black text-foreground">{nextIfAbsent.toFixed(1)}%</span>
               </div>
             </div>

             {/* Recovery / Bunk Predictions */}
             <div className="mt-3.5 p-3.5 rounded-xl border border-border/50 bg-card text-xs font-semibold text-muted-foreground space-y-2">
               <p className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b pb-1.5 mb-1.5">
                 <span>Planner Analysis</span>
                 <span className={statusColor}>{statusText}</span>
               </p>
               {isSafe ? (
                 <>
                   <p>• You are currently in the <span className="text-emerald-500 font-bold">Safe Zone</span>.</p>
                   {safeBunks > 0 ? (
                     <p>• Bunk Planner: You can bunk up to <span className="text-emerald-500 font-bold">{safeBunks} {safeBunks === 1 ? 'class' : 'classes'}</span> without falling below {THRESHOLD}%.</p>
                   ) : (
                     <p>• Bunk Planner: Bunking any more classes will push you below {THRESHOLD}%.</p>
                   )}
                 </>
               ) : (
                 <>
                   <p>• You are currently below the required {THRESHOLD}% threshold.</p>
                   <p>• Recovery Planner: You must attend the next <span className={statusColor + " font-bold"}>{needed} {needed === 1 ? 'class' : 'classes'}</span> continuously to reach {THRESHOLD}%.</p>
                 </>
               )}
             </div>

             <div className="flex gap-2.5 mt-4">
               <button 
                 onClick={(e) => { e.stopPropagation(); openEditModal(rec); }}
                 className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 bg-primary/5 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-1.5"
               >
                 <Edit className="w-3.5 h-3.5" /> Edit Subject
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); removeRecord(rec.id, rec.subject); }}
                 className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-red-500 border border-red-500/20 bg-red-500/5 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-1.5"
               >
                 <Trash2 className="w-3.5 h-3.5" /> Remove Subject
               </button>
             </div>
           </div>
        </div>

        {/* Action Buttons Layer */}
        <div className="flex border-t border-border/40 divide-x divide-border/40 bg-card/40 backdrop-blur-md">
           <button
             onClick={(e) => { e.stopPropagation(); handleAttendance(rec.id, true); }}
             className="flex-1 py-4 font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 text-xs flex items-center justify-center gap-2 active:bg-emerald-500/10 transition-colors"
           >
             Present
           </button>
           <button
             onClick={(e) => { e.stopPropagation(); handleAttendance(rec.id, false); }}
             className="flex-1 py-4 font-bold uppercase tracking-widest text-red-600 dark:text-red-500 text-xs flex items-center justify-center gap-2 active:bg-red-500/10 transition-colors"
           >
             Absent
           </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="cs-page flex flex-col gap-6">
        <div className="flex animate-pulse flex-col gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-secondary" />
          <div className="w-48 h-6 bg-secondary rounded-md" />
          <div className="w-32 h-4 bg-secondary/50 rounded-md" />
        </div>
        <div className="w-full h-12 bg-secondary/30 rounded-2xl animate-pulse" />
        <div className="w-full h-32 bg-secondary/80 rounded-2xl animate-pulse" />
        <div className="flex flex-col gap-4 mt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full h-40 bg-secondary/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cs-page min-h-screen pb-24">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between mb-2">
          <BackButton />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Tracker</h1>
        <p className="text-sm text-muted-foreground tracking-wide">Subject-wise planning & prediction</p>
      </div>

      {/* Clean Premium Search Bar */}
      <div className="mb-6 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search subject"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border/60 text-foreground rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
        />
      </div>

      {/* Overall Attendance Summary Card */}
      {records.length > 0 && (
        <div className={`bg-card border rounded-3xl p-6 mb-6 shadow-sm relative overflow-hidden bg-gradient-to-br ${
          overallStats.overallStatus === 'Safe' ? 'from-emerald-500/5 border-emerald-500/25' :
          overallStats.overallStatus === 'Improving' ? 'from-amber-500/5 border-amber-500/25' :
          overallStats.overallStatus === 'Risky' ? 'from-rose-500/5 border-rose-500/25' :
          'from-red-500/5 border-red-500/25'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                Overall Attendance
              </span>
              <span className="text-4xl font-black text-foreground">
                {overallStats.overallPct.toFixed(0)}<span className="text-xl font-bold opacity-80">%</span>
              </span>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-current bg-background/50 font-bold text-xs uppercase tracking-wider ${
                overallStats.overallStatus === 'Safe' ? 'text-emerald-600 dark:text-emerald-500' :
                overallStats.overallStatus === 'Improving' ? 'text-amber-600 dark:text-amber-500' :
                overallStats.overallStatus === 'Risky' ? 'text-rose-600 dark:text-rose-500' :
                'text-red-600 dark:text-red-500'
              }`}>
                {overallStats.overallStatus === 'Safe' ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {overallStats.overallStatus}
              </span>
              <p className="text-xs text-muted-foreground font-semibold mt-2">
                {overallStats.totalAttended} / {overallStats.totalClasses} Classes
              </p>
            </div>
          </div>
          
          <div className="w-full h-3 bg-secondary/85 rounded-full overflow-hidden mb-3 relative drop-shadow-sm">
            <div className="absolute top-0 bottom-0 w-[2px] bg-red-500/40 z-10" style={{ left: '50%' }} />
            <div className="absolute top-0 bottom-0 w-[2px] bg-orange-500/40 z-10" style={{ left: '65%' }} />
            <div className="absolute top-0 bottom-0 w-[2px] bg-emerald-500/30 z-10" style={{ left: '75%' }} />
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end ${
                overallStats.overallStatus === 'Safe' ? 'bg-emerald-500' :
                overallStats.overallStatus === 'Improving' ? 'bg-amber-500' :
                overallStats.overallStatus === 'Risky' ? 'bg-rose-500' :
                'bg-red-500'
              } shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]`}
              style={{ width: `${Math.min(Math.max(overallStats.overallPct, 2), 100)}%` }}
            />
          </div>
          
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            {overallStats.overallInsight}
          </p>
        </div>
      )}

      {/* Attendance Status Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex gap-1.5 items-center mb-1 z-10">
            <BookOpen className="w-3 h-3 text-primary"/> Total Subjects
          </span>
          <span className="text-3xl font-black text-foreground z-10">{stats.total}</span>
        </div>
        
        <div className="bg-card border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-1 z-10 w-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 flex gap-1.5 items-center">
              <ShieldCheck className="w-3 h-3"/> Safe
            </span>
            <span className="text-[9px] font-extrabold text-emerald-600/80 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.2 rounded">
              ≥75%
            </span>
          </div>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500 z-10">{stats.safe}</span>
        </div>
        
        <div className="col-span-2 grid grid-cols-3 gap-2">
          <div className="bg-card border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-[1.2rem] p-3 flex flex-col justify-between shadow-sm min-h-[85px]">
            <div className="flex justify-between items-center w-full mb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">Improving</span>
              <span className="text-[8px] font-extrabold text-amber-600/85">65-74%</span>
            </div>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-500">{stats.improving}</span>
          </div>

          <div className="bg-card border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent rounded-[1.2rem] p-3 flex flex-col justify-between shadow-sm min-h-[85px]">
            <div className="flex justify-between items-center w-full mb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-500">Risky</span>
              <span className="text-[8px] font-extrabold text-rose-600/85">50-64%</span>
            </div>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-500">{stats.risky}</span>
          </div>

          <div className="bg-card border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent rounded-[1.2rem] p-3 flex flex-col justify-between shadow-sm min-h-[85px]">
            <div className="flex justify-between items-center w-full mb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 dark:text-red-500">Critical</span>
              <span className="text-[8px] font-extrabold text-red-600/85">&lt;50%</span>
            </div>
            <span className="text-2xl font-black text-red-600 dark:text-red-500">{stats.critical}</span>
          </div>
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="space-y-6 mb-8">
          {/* Pinned Subjects Section */}
          {pinnedRecords.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Pinned Subjects
              </h3>
              <div className="space-y-4">
                {pinnedRecords.map(rec => renderCard(rec))}
              </div>
            </div>
          )}

          {/* Other Subjects Section */}
          {otherRecords.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-1">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground/60" /> Other Subjects
              </h3>
              <div className="space-y-4">
                {otherRecords.map(rec => renderCard(rec))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="cs-card p-10 text-center mb-8 border-dashed border-border flex flex-col items-center justify-center rounded-[2rem] shadow-sm">
          {searchQuery ? (
            <>
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-base font-semibold text-foreground mb-1">No subjects match</p>
              <p className="text-sm text-muted-foreground">Try a different search term</p>
            </>
          ) : (
            <>
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-base font-semibold text-foreground mb-1">No subjects found</p>
              <p className="text-sm text-muted-foreground">Add some subjects to start tracking</p>
            </>
          )}
        </div>
      )}

      {/* Prominent Add Button (Dashed Card) - Moved to bottom */}
      <button 
        onClick={() => setShowAdd(true)}
        className="w-full cs-card p-6 border-dashed border-2 bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all flex flex-col items-center justify-center gap-3 mb-8 group active:scale-95 duration-200 shadow-sm"
      >
        <div className="w-14 h-14 bg-primary text-primary-foreground rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
          <Plus className="w-8 h-8 stroke-[3.5px]" />
        </div>
        <div className="text-center">
          <p className="font-black text-lg text-foreground tracking-tight">Add New Subject</p>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.1em] mt-1 opacity-70">Start tracking attendance for a class</p>
        </div>
      </button>

      {/* Insights Section */}
      {insights && records.length > 0 && !searchQuery && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-muted-foreground mb-3 px-1 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" /> Quick Insights
          </h3>
          <div className="flex flex-col gap-2">
            
            {insights.strongest !== insights.weakest && (
              <div className="flex items-center justify-between bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex flex-col items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Top Performer</span>
                    <span className="text-sm font-semibold text-foreground">{insights.strongest.subject}</span>
                  </div>
                </div>
                <span className="text-base font-black text-emerald-500">{getPercentage(insights.strongest.attendedClasses, insights.strongest.totalClasses)}%</span>
              </div>
            )}

            <div className="flex items-center justify-between bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-500/10 flex flex-col items-center justify-center">
                  <TrendingDown className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Needs Attention</span>
                  <span className="text-sm font-semibold text-foreground">{insights.weakest.subject}</span>
                </div>
              </div>
              <span className="text-base font-black text-red-500">{getPercentage(insights.weakest.attendedClasses, insights.weakest.totalClasses)}%</span>
            </div>
            
          </div>
        </div>
      )}

      {/* Floating Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-card w-full max-w-sm rounded-[2rem] border border-border shadow-2xl p-6 animate-in slide-in-from-bottom-8 duration-500 sm:slide-in-from-bottom-0 sm:zoom-in-95">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold">Add Subject</h3>
               <button onClick={() => setShowAdd(false)} className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-muted-foreground"><XCircle className="w-5 h-5"/></button>
             </div>
             <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures"
                    value={newRec.subject}
                    onChange={(e) => setNewRec({ ...newRec, subject: e.target.value })}
                    className="w-full bg-secondary tracking-wide text-foreground rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Total Classes</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newRec.totalClasses}
                      onChange={(e) => setNewRec({ ...newRec, totalClasses: e.target.value })}
                      className="w-full bg-secondary text-foreground rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Attended Classes</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newRec.attendedClasses}
                      onChange={(e) => setNewRec({ ...newRec, attendedClasses: e.target.value })}
                      className="w-full bg-secondary text-foreground rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Subject Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Theory', 'Lab', 'Elective', 'Honors', 'Minor'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewRec({ ...newRec, subjectType: type })}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          newRec.subjectType === type 
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={addRecord} 
                  className="w-full mt-4 py-4 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                >
                  Save Subject
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Floating Edit Modal */}
      {showEdit && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-card w-full max-w-sm rounded-[2rem] border border-border shadow-2xl p-6 animate-in slide-in-from-bottom-8 duration-500 sm:slide-in-from-bottom-0 sm:zoom-in-95">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold">Edit Subject</h3>
               <button onClick={() => { setShowEdit(false); setEditingRecord(null); }} className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-muted-foreground"><XCircle className="w-5 h-5"/></button>
             </div>
             <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full bg-secondary tracking-wide text-foreground rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Total Classes</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={editForm.totalClasses}
                      onChange={(e) => setEditForm({ ...editForm, totalClasses: e.target.value })}
                      className="w-full bg-secondary text-foreground rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Attended Classes</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={editForm.attendedClasses}
                      onChange={(e) => setEditForm({ ...editForm, attendedClasses: e.target.value })}
                      className="w-full bg-secondary text-foreground rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Subject Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Theory', 'Lab', 'Elective', 'Honors', 'Minor'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, subjectType: type })}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          editForm.subjectType === type 
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={saveEditRecord} 
                  className="w-full mt-4 py-4 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                >
                  Save Changes
                </button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AttendancePage;
