/**
 * Authentication storage utilities
 * Handles token storage based on user's "remember me" preference
 */

export const AuthStorage = {
  /**
   * Store access token based on remember me preference
   */
  setAccessToken: (token: string, rememberMe: boolean = false) => {
    if (rememberMe) {
      localStorage.setItem('accessToken', token);
      sessionStorage.removeItem('accessToken');
      localStorage.setItem('remember-me', 'true');
    } else {
      sessionStorage.setItem('accessToken', token);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('remember-me');
    }
  },

  /**
   * Get access token from either storage location
   */
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  },

  /**
   * Check if user has remember me preference enabled
   */
  hasRememberMe: (): boolean => {
    return localStorage.getItem('remember-me') === 'true';
  },

  /**
   * Clear all authentication tokens and preferences
   */
  clearAll: () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('remember-me');
  },

  /**
   * Get the appropriate storage location based on current token location
   */
  getStorageType: (): 'localStorage' | 'sessionStorage' | null => {
    if (localStorage.getItem('accessToken')) {
      return 'localStorage';
    }
    if (sessionStorage.getItem('accessToken')) {
      return 'sessionStorage';
    }
    return null;
  }
}; 