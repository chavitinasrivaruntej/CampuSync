import { supabase, isSupabaseConfigured } from './supabase';
import { authStore } from './auth-store';

// Helper to get active user ID or fallback
function getActiveStudentId(): string {
  const user = authStore.getCurrentUser();
  return user?.id || user?.rollNumber || 'guest-student';
}

/**
 * Record when a student accesses a feature/module
 */
export async function trackFeatureUsage(featureName: string, category: string = 'General') {
  const studentId = getActiveStudentId();

  // Save to local storage cache for instant offline access
  try {
    const existingRaw = localStorage.getItem('campusync_feature_usage_logs') || '[]';
    const logs = JSON.parse(existingRaw);
    logs.push({
      student_id: studentId,
      feature_name: featureName,
      category,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('campusync_feature_usage_logs', JSON.stringify(logs.slice(-500)));
  } catch (err) {
    console.warn('Local storage error in trackFeatureUsage:', err);
  }

  // Push to Supabase if available
  if (isSupabaseConfigured) {
    try {
      await supabase.from('feature_usage_logs').insert({
        student_id: studentId,
        feature_name: featureName,
        category,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Telemetry] Failed to log feature usage to Supabase:', err);
    }
  }
}

/**
 * Record announcement views & downloads
 */
export async function trackAnnouncementInteraction(announcementId: string, action: 'view' | 'download') {
  const studentId = getActiveStudentId();

  if (isSupabaseConfigured) {
    try {
      await supabase.from('announcement_interactions').insert({
        announcement_id: announcementId,
        student_id: studentId,
        action,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Telemetry] Failed to log announcement interaction:', err);
    }
  }
}

/**
 * Record event views, registrations & link clicks
 */
export async function trackEventInteraction(eventId: string, action: 'view' | 'register' | 'click_link') {
  const studentId = getActiveStudentId();

  if (isSupabaseConfigured) {
    try {
      await supabase.from('event_interactions').insert({
        event_id: eventId,
        student_id: studentId,
        action,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Telemetry] Failed to log event interaction:', err);
    }
  }
}

/**
 * Record student login sessions
 */
export async function trackStudentLogin(studentId: string, rollNumber: string) {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('student_login_logs').insert({
        student_id: studentId,
        roll_number: rollNumber,
        login_timestamp: new Date().toISOString(),
        device_info: navigator.userAgent || 'Web Client',
        ip_address: '127.0.0.1'
      });
    } catch (err) {
      console.warn('[Telemetry] Failed to log student login:', err);
    }
  }
}
