import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Hash, BookOpen, GraduationCap, Settings, Camera, Layers, Phone, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store, useStore } from '@/lib/store';
import BackButton from '@/components/BackButton';
import type { UserProfile, CourseType } from '@/types';
import { CLASS_OPTIONS, YEAR_OPTIONS } from '@/types';
import { authStore } from '@/lib/auth-store';

import { getStoredStudents, saveStoredStudents } from '@/lib/user-store';

const DEFAULT_PROFILE: UserProfile = {
  id: '1',
  name: '',
  nickname: '',
  rollNumber: '',
  course: 'B.Tech',
  className: 'CSE',
  year: 1,
  semester: 1,
  email: '',
  phone: ''
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useStore<UserProfile>('profile', DEFAULT_PROFILE);
  const [editing, setEditing] = useState(!profile.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = () => {
    store.set('profile', profile);
    try {
      const students = getStoredStudents();
      const updated = students.map(s => {
        if (s.rollNumber.toLowerCase() === profile.rollNumber.toLowerCase() || s.email.toLowerCase() === profile.email.toLowerCase()) {
          return {
            ...s,
            name: profile.name,
            nickname: profile.nickname,
            email: profile.email,
            phone: profile.phone || s.phone,
            course: profile.course as any,
            department: profile.className as any,
            year: Number(profile.year),
            semester: Number(profile.semester),
            profilePicture: profile.profilePicture
          };
        }
        return s;
      });
      saveStoredStudents(updated);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
    setEditing(false);
  };

  const update = (field: keyof UserProfile, value: string | number) => {
    const updated = { ...profile, [field]: value };

    // Reset dependent fields when course changes
    if (field === 'course') {
      const course = value as CourseType;
      updated.className = CLASS_OPTIONS[course][0];
      updated.year = YEAR_OPTIONS[course][0];
    }

    setProfile(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfile({ ...profile, profilePicture: base64 });
      store.set('profile', { ...profile, profilePicture: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="cs-page pb-12">
      {/* Top Header - Consolidated Identity Block */}
      <div className="relative flex flex-col items-center pt-8 pb-10 mb-8 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-[3rem] border border-primary/10 shadow-sm overflow-hidden">
        {/* Settings Integration */}
        <button 
          onClick={() => navigate('/settings')} 
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-card/40 backdrop-blur-md border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-90"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="relative group mb-6">
          <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/30 ring-4 ring-card transition-transform group-hover:scale-105 duration-500">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-foreground text-4xl font-black tracking-tighter">
                {(profile.name || 'S').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {editing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl border-4 border-card active:scale-90 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        <div className="text-center px-6">
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-1">
            {profile.name || 'Your Name'}
          </h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4 opacity-70">
            {profile.className || 'CSE'} Department • JNTUK UCEK
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/10 shadow-inner">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-black text-primary uppercase tracking-wider">
              {profile.year ? `${profile.year}${['st','nd','rd','th'][profile.year-1] || 'th'} Year` : '—'} • Semester {profile.semester || '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {/* Section 1: Personal Information */}
        <section>
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Personal Information</h3>
          </div>
          
          <div className="space-y-4">
            <ProfileField 
              icon={User} label="Full Name" value={profile.name} editing={editing} 
              onChange={(v) => update('name', v)} placeholder="Full academic name" isPrimary
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField 
                icon={User} label="Nickname" value={profile.nickname} editing={editing} 
                onChange={(v) => update('nickname', v)} placeholder="e.g. Varun" 
              />
              <ProfileField 
                icon={Mail} label="Official Email" value={profile.email} editing={editing} 
                onChange={(v) => update('email', v)} placeholder="university@email.com" type="email" 
              />
              <ProfileField 
                icon={Phone} label="Phone Number" value={profile.phone || ''} editing={editing} 
                onChange={(v) => update('phone', v)} placeholder="+91 9876543210" type="tel" 
              />
            </div>
          </div>
        </section>

        {/* Section 2: Academic Information */}
        <section>
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Academic Details</h3>
          </div>
          
          <div className="space-y-4">
            <ProfileField 
              icon={Hash} label="University Roll Number" value={profile.rollNumber} editing={editing} 
              onChange={(v) => update('rollNumber', v)} placeholder="e.g. 21B01A0501" isPrimary
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="cs-card p-4 flex flex-col gap-3 group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Course</span>
                </div>
                {editing ? (
                  <Select value={profile.course} onValueChange={(v) => update('course', v)}>
                    <SelectTrigger className="h-6 text-sm font-bold border-0 bg-transparent p-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech">B.Tech</SelectItem>
                      <SelectItem value="M.Tech">M.Tech</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm font-bold text-foreground">{profile.course || '—'}</span>
                )}
              </div>

              <div className="cs-card p-4 flex flex-col gap-3 group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Branch</span>
                </div>
                {editing ? (
                  <Select value={profile.className} onValueChange={(v) => update('className', v)}>
                    <SelectTrigger className="h-6 text-sm font-bold border-0 bg-transparent p-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS[profile.course].map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm font-bold text-foreground">{profile.className || '—'}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="cs-card p-4 flex flex-col gap-3 group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Year</span>
                </div>
                {editing ? (
                  <Select value={String(profile.year)} onValueChange={(v) => update('year', +v)}>
                    <SelectTrigger className="h-6 text-sm font-bold border-0 bg-transparent p-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS[profile.course].map((y) => (
                        <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm font-bold text-foreground">{profile.year ? `Year ${profile.year}` : '—'}</span>
                )}
              </div>

              <div className="cs-card p-4 flex flex-col gap-3 group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Semester</span>
                </div>
                {editing ? (
                  <Select value={String(profile.semester)} onValueChange={(v) => update('semester', +v)}>
                    <SelectTrigger className="h-6 text-sm font-bold border-0 bg-transparent p-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm font-bold text-foreground">{profile.semester ? `Semester ${profile.semester}` : '—'}</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={editing ? save : () => {
          setEditing(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`w-full mt-10 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
          editing 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
            : 'bg-card border border-border/60 text-foreground hover:bg-secondary'
        }`}
      >
        {editing ? 'Save Academic Profile' : 'Edit Profile Information'}
      </button>

      {/* Log Out Action */}
      <button
        onClick={() => {
          authStore.logout();
          navigate('/login', { replace: true });
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 100);
        }}
        className="w-full mt-4 py-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-destructive hover:text-white active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4" />
        Log Out from CampusSync
      </button>
    </div>
  );
};

function ProfileField({
  icon: Icon, label, value, editing, onChange, placeholder, type = 'text', isPrimary = false
}: {
  icon: any; label: string; value: string; editing: boolean; onChange: (v: string) => void; placeholder: string; type?: string; isPrimary?: boolean;
}) {
  return (
    <div className={`cs-card transition-all group hover:border-primary/20 ${isPrimary ? 'p-5 ring-1 ring-primary/5' : 'p-4'}`}>
      <div className="flex items-center gap-4">
        <div className={`rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          isPrimary ? 'w-12 h-12 bg-primary/10 text-primary' : 'w-10 h-10 bg-secondary/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
        }`}>
          <Icon className={isPrimary ? "w-6 h-6" : "w-5 h-5"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {label}
          </p>
          {editing ? (
            <input 
              type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
              className={`w-full bg-transparent font-bold text-foreground outline-none placeholder:opacity-30 ${isPrimary ? 'text-base' : 'text-sm'}`} 
            />
          ) : (
            <p className={`font-bold text-foreground truncate ${isPrimary ? 'text-base' : 'text-sm'}`}>
              {value || '—'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
