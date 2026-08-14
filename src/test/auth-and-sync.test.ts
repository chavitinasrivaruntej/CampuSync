import { describe, it, expect, beforeEach } from 'vitest';
import { authStore } from '../lib/auth-store';
import { getStoredStudents } from '../lib/user-store';

describe('Authentication & Role-Based Access Control', () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.logout();
  });

  it('rejects fake student login with invalid credentials', async () => {
    await expect(authStore.login('FAKE99999', 'wrongpass')).rejects.toThrow('Invalid Student ID or Password.');
  });

  it('authenticates administrator with valid campusadmin@cs.com / CSAdmin credentials', async () => {
    const session = await authStore.login('campusadmin@cs.com', 'CSAdmin');
    expect(session).toBeDefined();
    expect(session.user?.role).toBe('Super Admin');
    expect(authStore.getCurrentRole()).toBe('Admin');
  });

  it('rejects administrator login with invalid password', async () => {
    await expect(authStore.login('campusadmin@cs.com', 'wrongpassword')).rejects.toThrow('Invalid Administrator Credentials.');
  });

  it('registers a new student and validates credentials', async () => {
    const studentData = {
      name: 'Test Student',
      rollNumber: '22A91A0599',
      email: 'test.student@campusync.edu',
      password: 'TestPassword123!',
      department: 'CSE',
      course: 'B.Tech',
      year: 2,
      semester: 4,
      section: 'Sec A'
    };

    const session = await authStore.register(studentData);
    expect(session).toBeDefined();
    expect(session.user?.rollNumber).toBe('22A91A0599');
    expect(authStore.getCurrentRole()).toBe('Student');

    authStore.logout();

    // Login with registered credentials
    const loginSession = await authStore.login('22A91A0599', 'TestPassword123!');
    expect(loginSession.user?.name).toBe('Test Student');
  });

  it('prevents registration with duplicate Roll Number', async () => {
    const studentData = {
      name: 'Test Student 1',
      rollNumber: '22A91A0598',
      email: 'test1@campusync.edu',
      password: 'TestPassword123!',
      department: 'CSE',
      course: 'B.Tech',
      year: 2,
      semester: 4,
      section: 'Sec A'
    };

    await authStore.register(studentData);

    await expect(authStore.register({
      ...studentData,
      email: 'different@campusync.edu'
    })).rejects.toThrow('An account with this Student ID / Roll Number or Email already exists.');
  });

  it('validates active session and invalidates logged out or expired sessions', async () => {
    expect(authStore.validateSession()).toBe(false);

    await authStore.login('campusadmin@cs.com', 'CSAdmin');
    expect(authStore.validateSession()).toBe(true);

    authStore.logout();
    expect(authStore.validateSession()).toBe(false);
  });
});
