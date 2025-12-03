/**
 * Session Management Utilities
 * Handles session persistence, validation, and cleanup
 */

export interface SessionData {
  sessionId: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt?: number;
}

const SESSION_STORAGE_KEY = 'session_data';

export const sessionManager = {
  /**
   * Create a new session
   */
  createSession: (sessionId: string, userId: string, expiresIn?: number): SessionData => {
    const now = Date.now();
    const session: SessionData = {
      sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: expiresIn ? now + expiresIn : undefined,
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    
    return session;
  },

  /**
   * Get current session
   */
  getSession: (): SessionData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      
      const session: SessionData = JSON.parse(data);
      
      // Check if session is expired
      if (session.expiresAt && session.expiresAt < Date.now()) {
        sessionManager.clearSession();
        return null;
      }
      
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Update last activity timestamp
   */
  updateActivity: (): void => {
    const session = sessionManager.getSession();
    if (session) {
      session.lastActivity = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    }
  },

  /**
   * Check if session is valid
   */
  isSessionValid: (maxInactivityMinutes: number = 30): boolean => {
    const session = sessionManager.getSession();
    if (!session) return false;
    
    // Check expiration
    if (session.expiresAt && session.expiresAt < Date.now()) {
      return false;
    }
    
    // Check inactivity
    const maxInactivity = maxInactivityMinutes * 60 * 1000;
    if (Date.now() - session.lastActivity > maxInactivity) {
      return false;
    }
    
    return true;
  },

  /**
   * Clear session
   */
  clearSession: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  },

  /**
   * Get session duration in minutes
   */
  getSessionDuration: (): number => {
    const session = sessionManager.getSession();
    if (!session) return 0;
    
    return Math.floor((Date.now() - session.createdAt) / 60000);
  },
};

