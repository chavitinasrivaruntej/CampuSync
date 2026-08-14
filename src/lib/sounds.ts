// A very soft, subtle, professional notification chime (short "ping" or "pop" sound)
// Encoded as Base64 to avoid external asset loading delays or dependencies
export const NOTIFICATION_SOUND_B64 = 'data:audio/mp3;base64,//O0wAAAAAAAWGluZwAAAA8AAAAHAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//O0wAAB6m1gIAAAAE2ZWIuCg4QhAQAABcBAAAAAAAAAAAAAP/7sQAA8yABqgAAAAgAGqAAAAAD//O0wAAA4gFAAAABwgFAAAAAA//O0wAAAwAFAAAABAQFAAAAAA//O0wAAAuAFAAAAAAQAFAAAAAA//O0wAAAuAFAAAAAAQAFAAAAAA//O0wAAAuAFAAAAAAQAFAAAAAA//O0wAAAuAFAAAAAAQAFAAAAAA';

let audioInstance: HTMLAudioElement | null = null;

export const playNotificationSound = () => {
  try {
    if (!audioInstance) {
      audioInstance = new Audio(NOTIFICATION_SOUND_B64);
      audioInstance.volume = 0.5; // Keep it subtle
    }
    // Reset and play
    audioInstance.currentTime = 0;
    audioInstance.play().catch(e => console.warn('Audio playback prevented by browser:', e));
  } catch (err) {
    console.warn('Failed to play notification sound', err);
  }
};
