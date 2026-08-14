import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [animationClass, setAnimationClass] = useState('cs-page-enter');

  useEffect(() => {
    setAnimationClass('');
    const raf = requestAnimationFrame(() => {
      setAnimationClass('cs-page-enter');
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div className={animationClass}>
      {children}
    </div>
  );
};

export default PageTransition;
