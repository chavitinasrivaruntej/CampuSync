import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  User, 
  Mail, 
  FileText, 
  GraduationCap, 
  Building, 
  BookOpen, 
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { authStore, validatePassword } from '@/lib/auth-store';

import { useLocation } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sign In State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [course, setCourse] = useState('B.Tech');
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);

  // Password rules validation
  const pwdValidation = validatePassword(password);
  const isPasswordMatch = password === confirmPassword;

  const targetPath = (location.state as any)?.from;

  const redirectUser = () => {
    if (targetPath && targetPath !== '/auth' && targetPath !== '/login' && !targetPath.startsWith('/admin')) {
      navigate(targetPath, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Check if session already exists
  useEffect(() => {
    if (authStore.validateSession()) {
      redirectUser();
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !loginPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both your Roll Number / Student ID / Email and Password.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await authStore.login(loginId, loginPassword);
      toast({
        title: 'Logged in successfully',
        description: `Welcome back to CampusSync!`
      });
      redirectUser();
    } catch (err: any) {
      toast({
        title: 'Authentication failed',
        description: err.message || 'Invalid Student ID or Password.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !rollNumber || !email || !password || !confirmPassword) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in all requested fields.',
        variant: 'destructive'
      });
      return;
    }

    if (!pwdValidation.isValid) {
      toast({
        title: 'Password too weak',
        description: 'Please ensure your password meets all validation criteria.',
        variant: 'destructive'
      });
      return;
    }

    if (!isPasswordMatch) {
      toast({
        title: 'Passwords mismatch',
        description: 'Confirm password must match the password.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await authStore.register({
        name,
        nickname,
        rollNumber,
        email,
        phone,
        password,
        department,
        course,
        year,
        semester
      });

      toast({
        title: 'Account created',
        description: 'Your personalized profile and timetable are ready!'
      });
      navigate('/');
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err.message || 'An error occurred during sign up.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100 font-sans relative overflow-hidden">
      {/* Dynamic Aesthetic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CampusSync</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister ? 'Create your student identity profile' : 'Sign in to access your personalized campus feed'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => setIsRegister(false)}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              !isRegister ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              isRegister ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Sign In Form */}
        {!isRegister ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Roll Number or Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22A91A0501 or varun@campusync.edu"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-white transition-all placeholder-slate-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <a href="#forgot" className="text-[11px] text-blue-400 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-white transition-all placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 text-blue-600 bg-slate-900 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer select-none">
                Remember my login sessions
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 mt-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {loading ? 'Authenticating credentials...' : 'Authenticate & Sign In'}
            </Button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Varun Tej"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nickname / Display Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Varun"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Student ID / Roll Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FileText className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22A91A0501"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. varun@campusync.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Course</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="B.Tech" className="bg-slate-950">B.Tech</option>
                    <option value="M.Tech" className="bg-slate-950">M.Tech</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Department / Branch</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Building className="h-4 w-4" />
                  </span>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="CSE" className="bg-slate-950">CSE</option>
                    <option value="AI & ML" className="bg-slate-950">AI & ML</option>
                    <option value="CSE ICP" className="bg-slate-950">CSE ICP</option>
                    <option value="AI & ML ICP" className="bg-slate-950">AI & ML ICP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Year</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                  </span>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-2 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="1" className="bg-slate-950">1st Year</option>
                    <option value="2" className="bg-slate-950">2nd Year</option>
                    <option value="3" className="bg-slate-950">3rd Year</option>
                    <option value="4" className="bg-slate-950">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Semester</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500">
                    <GraduationCap className="h-3.5 w-3.5" />
                  </span>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-2 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="1" className="bg-slate-950">Sem 1</option>
                    <option value="2" className="bg-slate-950">Sem 2</option>
                    <option value="3" className="bg-slate-950">Sem 3</option>
                    <option value="4" className="bg-slate-950">Sem 4</option>
                    <option value="5" className="bg-slate-950">Sem 5</option>
                    <option value="6" className="bg-slate-950">Sem 6</option>
                    <option value="7" className="bg-slate-950">Sem 7</option>
                    <option value="8" className="bg-slate-950">Sem 8</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 8 chars, mixed case"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all"
                />
              </div>

              {/* Password strength indicator list */}
              {password && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[10px]">
                  <p className="font-semibold text-slate-400 mb-1">Password Requirements:</p>
                  <div className="flex items-center gap-1.5">
                    {pwdValidation.length ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-600" />}
                    <span className={pwdValidation.length ? 'text-slate-200' : 'text-slate-500'}>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pwdValidation.uppercase ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-600" />}
                    <span className={pwdValidation.uppercase ? 'text-slate-200' : 'text-slate-500'}>One uppercase letter (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pwdValidation.lowercase ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-600" />}
                    <span className={pwdValidation.lowercase ? 'text-slate-200' : 'text-slate-500'}>One lowercase letter (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pwdValidation.number ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-600" />}
                    <span className={pwdValidation.number ? 'text-slate-200' : 'text-slate-500'}>One numeric digit (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pwdValidation.special ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-600" />}
                    <span className={pwdValidation.special ? 'text-slate-200' : 'text-slate-500'}>One special character (@, $, !, etc.)</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white transition-all"
                />
              </div>
              {confirmPassword && (
                <div className="mt-1 flex items-center gap-1">
                  {isPasswordMatch ? (
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Passwords match</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 flex items-center gap-1"><XCircle className="h-3 w-3" /> Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !pwdValidation.isValid || !isPasswordMatch}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 mt-4 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {loading ? 'Creating student profile...' : 'Register & Create Profile'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
