import { Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="cs-page flex flex-col min-h-[80vh] justify-center items-center text-center px-6">
      <div className="absolute top-4 left-4">
        <BackButton />
      </div>

      <div className="w-20 h-20 rounded-3xl cs-gradient-accent flex items-center justify-center mb-6 animate-pulse shadow-lg">
        <Clock className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
        Coming Soon
      </h1>
      
      <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
        This premium performance tool is currently under development. We are engineering smart analytics to help you optimize your academic journey.
      </p>

      <button
        onClick={() => navigate('/utilities/cgpa')}
        className="px-6 py-3 rounded-2xl cs-gradient-primary text-white text-sm font-semibold shadow-md active:scale-95 transition-transform"
      >
        Return to Hub
      </button>
    </div>
  );
};

export default ComingSoon;
