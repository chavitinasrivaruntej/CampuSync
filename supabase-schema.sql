-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nickname TEXT,
    email TEXT,
    course TEXT DEFAULT 'B.Tech',
    year INT DEFAULT 1,
    semester INT DEFAULT 1,
    profile_picture TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    expiry_date DATE,
    category TEXT NOT NULL,
    audience TEXT,
    source TEXT,
    priority TEXT DEFAULT 'general' CHECK (priority IN ('general', 'important', 'urgent')),
    course TEXT DEFAULT 'All',
    year TEXT DEFAULT 'All',
    attachment_url TEXT,
    attachment_type TEXT,
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    venue TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
    max_marks INT,
    obtained_marks INT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    present INT DEFAULT 0 NOT NULL,
    total INT DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Timetable Entries Table
CREATE TABLE IF NOT EXISTS public.timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL, -- e.g., 'Monday', 'Tuesday'
    time_slot TEXT NOT NULL, -- e.g., '09:00 - 10:00'
    subject TEXT NOT NULL,
    room TEXT,
    teacher TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable public read/write access for demonstration/easy setup (RLS disabled or public policy allowed)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow public write access to announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public write access to events" ON public.events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Allow public write access to assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public write access to attendance_records" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to timetable_entries" ON public.timetable_entries FOR SELECT USING (true);
CREATE POLICY "Allow public write access to timetable_entries" ON public.timetable_entries FOR ALL USING (true) WITH CHECK (true);

-- Create Semester Templates Table
CREATE TABLE IF NOT EXISTS public.semester_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regulation TEXT NOT NULL, -- e.g. 'R23'
    branch TEXT NOT NULL,     -- e.g. 'CSE'
    semester INT NOT NULL,    -- e.g. 2, 3
    subject_name TEXT NOT NULL,
    credits NUMERIC NOT NULL,
    subject_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.semester_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to semester_templates" ON public.semester_templates FOR SELECT USING (true);
CREATE POLICY "Allow public write access to semester_templates" ON public.semester_templates FOR ALL USING (true) WITH CHECK (true);

-- Seed Semester 2 Templates (R23 CSE)
INSERT INTO public.semester_templates (regulation, branch, semester, subject_name, credits) VALUES
('R23', 'CSE', 2, 'Differential Equations and Vector Calculus', 3),
('R23', 'CSE', 2, 'Engineering Chemistry / Chemistry / Fundamental Chemistry', 3),
('R23', 'CSE', 2, 'Communicative English Lab', 1),
('R23', 'CSE', 2, 'Engineering Chemistry / Chemistry / Fundamental Chemistry Lab', 1),
('R23', 'CSE', 2, 'Health and Wellness, Yoga and Sports', 0.5),
('R23', 'CSE', 2, 'Communicative English', 2),
('R23', 'CSE', 2, 'Basic Civil and Mechanical Engineering', 3),
('R23', 'CSE', 2, 'Engineering Workshop', 1.5),
('R23', 'CSE', 2, 'Data Structures Lab', 1.5),
('R23', 'CSE', 2, 'Data Structures', 3)
ON CONFLICT DO NOTHING;

-- Seed Semester 3 Templates (R23 CSE)
INSERT INTO public.semester_templates (regulation, branch, semester, subject_name, credits) VALUES
('R23', 'CSE', 3, 'Environmental Science', 0),
('R23', 'CSE', 3, 'Discrete Mathematics & Graph Theory', 3),
('R23', 'CSE', 3, 'Managerial Economics and Financial Analysis', 2),
('R23', 'CSE', 3, 'Computer Organization and Architecture', 3),
('R23', 'CSE', 3, 'Advanced Data Structures Lab', 1.5),
('R23', 'CSE', 3, 'Advanced Data Structures', 3),
('R23', 'CSE', 3, 'Object Oriented Programming Through Java Lab', 1.5),
('R23', 'CSE', 3, 'Object Oriented Programming Through Java', 3),
('R23', 'CSE', 3, 'Python Programming', 2)
ON CONFLICT DO NOTHING;

-- Seed Semester 5 Templates (R23 CSE)
INSERT INTO public.semester_templates (regulation, branch, semester, subject_name, credits) VALUES
('R23', 'CSE', 5, 'Community Service Internship', 2),
('R23', 'CSE', 5, 'Data Mining Lab', 1.5),
('R23', 'CSE', 5, 'Data Warehousing and Data Mining', 3),
('R23', 'CSE', 5, 'Computer Networks Lab', 1.5),
('R23', 'CSE', 5, 'Computer Networks', 3),
('R23', 'CSE', 5, 'Formal Languages and Automata Theory', 3),
('R23', 'CSE', 5, 'Design and Analysis of Algorithms', 3),
('R23', 'CSE', 5, 'User Interface Design Using Flutter', 1),
('R23', 'CSE', 5, 'Construction and Technology Management', 3),
('R23', 'CSE', 5, 'Full Stack Development – 2', 2)
ON CONFLICT DO NOTHING;
