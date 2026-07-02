import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Target, 
  Trophy, 
  FileText, 
  ChevronRight 
} from 'lucide-react';
import BackButton from '@/components/BackButton';

const GPACalculatorHub = () => {
  const navigate = useNavigate();

  const TOOLS = [
    {
      title: 'SGPA Calculator',
      desc: 'Calculate your semester grade point average.',
      icon: BookOpen,
      path: '/utilities/cgpa/calculator',
      search: '?tab=sgpa',
      gradient: 'from-blue-500/10 to-indigo-500/5 dark:from-blue-500/20 dark:to-indigo-500/10',
      borderClass: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    },
    {
      title: 'CGPA Calculator',
      desc: 'Calculate your cumulative academic performance.',
      icon: GraduationCap,
      path: '/utilities/cgpa/calculator',
      search: '?tab=cgpa',
      gradient: 'from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10',
      borderClass: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    },
    {
      title: 'Academic Trend',
      desc: 'View your semester-wise academic progress.',
      icon: TrendingUp,
      path: '/utilities/cgpa/trend',
      gradient: 'from-purple-500/10 to-pink-500/5 dark:from-purple-500/20 dark:to-pink-500/10',
      borderClass: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: 'SGPA Predictor',
      desc: 'Predict your expected semester GPA before results.',
      icon: Target,
      path: '/utilities/cgpa/predictor',
      gradient: 'from-amber-500/10 to-orange-500/5 dark:from-amber-500/20 dark:to-orange-500/10',
      borderClass: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    },
    {
      title: 'Required SGPA',
      desc: 'Calculate the GPA required to reach your target CGPA.',
      icon: Trophy,
      path: '/utilities/cgpa/required',
      gradient: 'from-rose-500/10 to-red-500/5 dark:from-rose-500/20 dark:to-red-500/10',
      borderClass: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
    },
    {
      title: 'Academic Records',
      desc: 'View previously saved GPA records and reports.',
      icon: FileText,
      path: '/utilities/cgpa/history',
      gradient: 'from-slate-500/10 to-indigo-500/5 dark:from-slate-500/20 dark:to-indigo-500/10',
      borderClass: 'border-slate-500/20 hover:border-slate-500/40',
      iconBg: 'bg-gradient-to-br from-slate-500 to-indigo-600',
    },
  ];

  return (
    <div className="cs-page">
      <div className="flex items-center justify-between mb-6">
        <BackButton label="Utilities" />
      </div>

      {/* Header card matching the design language of utilities / home */}
      <div className="cs-header-card rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
          GPA Calculator
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Calculate, analyze, and track your academic performance.
        </p>
      </div>

      {/* Grid containing the cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((tool, idx) => (
          <button
            key={idx}
            onClick={() => navigate(tool.path + (tool.search || ''))}
            className={`flex flex-col text-left p-5 rounded-2xl border bg-gradient-to-br ${tool.gradient} ${tool.borderClass} shadow-sm transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] group`}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <div className={`w-12 h-12 rounded-2xl ${tool.iconBg} flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110`}>
                <tool.icon className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
            </div>

            <h3 className="text-base font-bold text-card-foreground mb-1 group-hover:text-primary transition-colors duration-200">
              {tool.title}
            </h3>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tool.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GPACalculatorHub;
