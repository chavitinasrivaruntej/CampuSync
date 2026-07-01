import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  X, 
  PlusCircle, 
  ChevronRight, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { SemesterRecord } from '@/types';
import BackButton from '@/components/BackButton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ParsedSemester {
  num: number;
  label: string;
  sgpa: number | null;
  credits: number;
  subjectsCount: number;
  lastUpdated: string | null;
  academicStatus: string | null;
  record: SemesterRecord | null;
}

const getAcademicStatus = (gpa: number) => {
  if (gpa >= 9.0) return 'Outstanding Performance';
  if (gpa >= 8.0) return 'Strong Academic Progress';
  if (gpa >= 7.0) return 'Good Standing';
  if (gpa >= 6.0) return 'Satisfactory';
  return 'Needs Improvement';
};

const AcademicTrendPage = () => {
  const navigate = useNavigate();
  const [semesterRecords] = useStore<SemesterRecord[]>('semester_records', []);
  const [selectedPoint, setSelectedPoint] = useState<ParsedSemester | null>(null);

  // 1. Data Parser for Semesters 1 to 8
  const parsedData = useMemo<ParsedSemester[]>(() => {
    const semesters: ParsedSemester[] = [];
    for (let i = 1; i <= 8; i++) {
      const titleToFind = `Semester ${i}`;
      const record = semesterRecords.find(
        (r) => r.title.toLowerCase().trim() === titleToFind.toLowerCase()
      );

      if (record) {
        const totalCredits = record.subjects.reduce((sum, s) => sum + s.credits, 0);
        semesters.push({
          num: i,
          label: `Sem ${i}`,
          sgpa: record.sgpa > 0 ? record.sgpa : null,
          credits: totalCredits,
          subjectsCount: record.subjects.length,
          lastUpdated: record.lastUpdated,
          academicStatus: record.sgpa > 0 ? getAcademicStatus(record.sgpa) : null,
          record,
        });
      } else {
        semesters.push({
          num: i,
          label: `Sem ${i}`,
          sgpa: null,
          credits: 0,
          subjectsCount: 0,
          lastUpdated: null,
          academicStatus: null,
          record: null,
        });
      }
    }
    return semesters;
  }, [semesterRecords]);

  // Available records list
  const activeRecords = useMemo(() => {
    return parsedData.filter((d) => d.sgpa !== null) as (ParsedSemester & { sgpa: number })[];
  }, [parsedData]);

  // 2. Summary Statistics
  const stats = useMemo(() => {
    if (activeRecords.length === 0) {
      return {
        cgpa: 0,
        highest: 0,
        lowest: 0,
        average: 0,
        completed: 0,
        remaining: 8,
      };
    }

    // CGPA is credit-weighted
    const totalWeighted = activeRecords.reduce((sum, r) => sum + r.sgpa * r.credits, 0);
    const totalCredits = activeRecords.reduce((sum, r) => sum + r.credits, 0);
    const cgpa = totalCredits > 0 ? totalWeighted / totalCredits : 0;

    const highest = Math.max(...activeRecords.map((r) => r.sgpa));
    const lowest = Math.min(...activeRecords.map((r) => r.sgpa));
    const average = activeRecords.reduce((sum, r) => sum + r.sgpa, 0) / activeRecords.length;

    return {
      cgpa: +cgpa.toFixed(2),
      highest: +highest.toFixed(2),
      lowest: +lowest.toFixed(2),
      average: +average.toFixed(2),
      completed: activeRecords.length,
      remaining: 8 - activeRecords.length,
    };
  }, [activeRecords]);

  // 3. Performance Insights Engine (Rule-Based)
  const insights = useMemo(() => {
    if (activeRecords.length === 0) return [];

    const list: string[] = [];

    // Find highest performing semester
    const highestSem = [...activeRecords].sort((a, b) => b.sgpa - a.sgpa)[0];
    list.push(`Your highest performing term is **Semester ${highestSem.num}** with a stellar SGPA of **${highestSem.sgpa.toFixed(2)}**.`);

    // Find if there is an improvement streak
    // Sort available semesters by number
    const sortedActive = [...activeRecords].sort((a, b) => a.num - b.num);
    let currentStreak = 0;
    let maxStreak = 0;

    sortedActive.forEach((r) => {
      if (r.sgpa >= 8.5) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    if (maxStreak >= 2) {
      list.push(`Excellent consistency! You maintained a **${maxStreak}-semester streak** scoring above **8.50** SGPA.`);
    }

    // Comparison against previous recorded semester
    if (sortedActive.length >= 2) {
      const latest = sortedActive[sortedActive.length - 1];
      const previous = sortedActive[sortedActive.length - 2];
      const diff = latest.sgpa - previous.sgpa;

      if (diff > 0) {
        list.push(`Progress Alert: Your performance in **Semester ${latest.num}** improved by **${diff.toFixed(2)}** grade points compared to Semester ${previous.num}.`);
      } else if (diff < 0) {
        list.push(`Comparison: Your Semester ${latest.num} SGPA is **${Math.abs(diff).toFixed(2)}** points lower than Semester ${previous.num}. Check subject credits to adjust your study balance.`);
      }
    }

    return list;
  }, [activeRecords]);

  if (activeRecords.length === 0) {
    // 4. Empty State
    return (
      <div className="cs-page flex flex-col min-h-[85vh] justify-center items-center text-center px-6">
        <div className="absolute top-4 left-4">
          <BackButton label="GPA Hub" />
        </div>

        <div className="w-20 h-20 rounded-3xl cs-gradient-primary flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-primary/20">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
          No Academic Records Found
        </h1>
        
        <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
          Calculate your first semester SGPA to unlock interactive trend charts, credit summaries, and academic progress insights.
        </p>

        <button
          onClick={() => navigate('/utilities/cgpa/calculator?tab=sgpa')}
          className="px-6 py-3.5 rounded-2xl cs-gradient-primary text-white text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Open SGPA Calculator</span>
        </button>
      </div>
    );
  }

  return (
    <div className="cs-page">
      <div className="flex items-center justify-between mb-6">
        <BackButton label="GPA Hub" />
      </div>

      <div className="cs-header-card rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
          Academic Trend
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Visualize, analyze, and track your performance trends across semesters.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="cs-card p-4 flex flex-col justify-between bg-gradient-to-br from-card to-primary/5 border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weighted CGPA</span>
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats.cgpa.toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground mt-1">Based on credit weights</p>
        </div>

        <div className="cs-card p-4 flex flex-col justify-between bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Highest SGPA</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats.highest.toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground mt-1">Best term record</p>
        </div>

        <div className="cs-card p-4 flex flex-col justify-between bg-gradient-to-br from-card to-blue-500/5 border-blue-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average SGPA</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats.average.toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground mt-1">Simple arithmetic average</p>
        </div>

        <div className="cs-card p-4 flex flex-col justify-between bg-gradient-to-br from-card to-indigo-500/5 border-indigo-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats.completed}/8</p>
          <p className="text-[9px] text-muted-foreground mt-1">Semesters completed</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="cs-card p-4 mb-6 bg-card relative">
        <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span>SGPA Performance Graph</span>
        </h3>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={parsedData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const clickedPoint = state.activePayload[0].payload as ParsedSemester;
                  if (clickedPoint.sgpa !== null) {
                    setSelectedPoint(clickedPoint);
                  }
                }
              }}
            >
              <defs>
                <linearGradient id="colorSgpa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
              />
              <YAxis 
                domain={[0, 10]} 
                ticks={[0, 2, 4, 6, 8, 10]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
              />
              <Tooltip 
                cursor={{ stroke: 'hsl(var(--primary) / 0.1)', strokeWidth: 2 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ParsedSemester;
                    if (data.sgpa === null) return null;
                    return (
                      <div className="p-3 bg-card border border-border rounded-xl shadow-lg text-left text-xs space-y-1">
                        <p className="font-bold text-primary">Semester {data.num}</p>
                        <p className="font-black text-foreground text-sm">{data.sgpa.toFixed(2)} SGPA</p>
                        <p className="text-[10px] text-muted-foreground">Tap to view metrics</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sgpa" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 7, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))', className: 'cursor-pointer' }}
                connectNulls={false} // Breaks line between missing semesters as required
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[9px] text-muted-foreground text-center mt-2 italic">
          Tapping points on the chart displays floating academic details cards.
        </p>
      </div>

      {/* Rules-Based Insights Section */}
      <div className="cs-card p-5 mb-6">
        <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Performance Insights</span>
        </h3>

        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 text-sm text-foreground leading-relaxed p-3 rounded-xl bg-secondary/40 border border-border/50"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                <p 
                  className="font-medium"
                  dangerouslySetInnerHTML={{
                    __html: insight
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-bold">$1</strong>')
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Complete more semester records to unlock performance insights.
            </p>
          </div>
        )}
      </div>

      {/* Floating Info Card (Modal) */}
      {selectedPoint && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPoint(null)}
        >
          <div 
            className="cs-card-elevated w-full max-w-sm p-6 bg-card border-primary/20 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPoint(null)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Academic Summary</p>
            <h3 className="text-xl font-extrabold text-foreground mb-4">Semester {selectedPoint.num}</h3>

            <div className="space-y-3.5 mb-6 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">Semester GPA</span>
                <span className="font-extrabold text-primary text-lg">{selectedPoint.sgpa?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">Total Credits</span>
                <span className="font-bold text-foreground">{selectedPoint.credits} Credits</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">Number of Subjects</span>
                <span className="font-bold text-foreground">{selectedPoint.subjectsCount} Subjects</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">Saved Date</span>
                <span className="font-bold text-foreground">
                  {selectedPoint.lastUpdated ? new Date(selectedPoint.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground">Performance Category</span>
                <span className="font-bold text-primary text-xs bg-primary/10 px-2.5 py-1 rounded-full text-right">
                  {selectedPoint.academicStatus}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedPoint(null)}
              className="w-full py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl text-xs transition-colors active:scale-95"
            >
              Dismiss Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicTrendPage;
