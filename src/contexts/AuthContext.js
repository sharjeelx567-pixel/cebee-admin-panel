import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as authLogin, getCurrentUser, logout as authLogout } from '../services/authService';
import { getStoredSession } from '../services/apiBase';

// Auth Context with Backend API Integration
const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage and validate with backend
    const checkSession = async () => {
      try {
        const storedSession = getStoredSession();
        
        if (storedSession && storedSession.token && storedSession.user) {
          // Validate session with backend
          const result = await getCurrentUser();
          
          if (result.success && result.data?.user) {
            const user = result.data.user;
            
            // Check if user is admin
            if (user.role === 'admin') {
              // Format user for compatibility with existing code
              const formattedUser = {
                uid: user.id,
                email: user.email,
                displayName: user.fullName || user.username,
                emailVerified: true,
              };

              const formattedAdmin = {
                id: user.id,
                email: user.email,
                name: user.fullName || user.username,
                username: user.username,
                role: user.role,
                isActive: user.isActive !== false,
                lastLoginAt: user.lastLogin || new Date(),
              };

              setCurrentUser(formattedUser);
              setAdmin(formattedAdmin);
            } else {
              // Not an admin, clear session
              authLogout();
            }
          } else {
            // Session invalid, clear it
            authLogout();
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clear invalid session
        authLogout();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      // Call backend API
      const result = await authLogin(email.trim(), password);

      // Pass through status code for error handling
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Login failed. Please try again.',
          status: result.status,
        };
      }

      if (result.success && result.data?.user) {
        const user = result.data.user;

        // Check if user is admin
        if (user.role !== 'admin') {
          return {
            success: false,
            error: 'Access denied. Admin privileges required.',
          };
        }

        // Format user for compatibility with existing code
        const formattedUser = {
          uid: user.id,
          email: user.email,
          displayName: user.fullName || user.username,
          emailVerified: true,
        };

        const formattedAdmin = {
          id: user.id,
          email: user.email,
          name: user.fullName || user.username,
          username: user.username,
          role: user.role,
          isActive: user.isActive !== false,
          lastLoginAt: new Date(),
        };

        setCurrentUser(formattedUser);
        setAdmin(formattedAdmin);

        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Login failed. Please try again.',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during login.',
      };
    }
  };

  const logout = async () => {
    try {
      // Clear backend session
      authLogout();
      
      // Clear local state
      setCurrentUser(null);
      setAdmin(null);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setCurrentUser(null);
      setAdmin(null);
      authLogout();
      return { success: true };
    }
  };

  const value = {
    currentUser,
    admin,
    login,
    logout,
    loading,
    isAuthenticated: !!currentUser && !!admin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
