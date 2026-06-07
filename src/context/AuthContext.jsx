import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

// Default mock profiles for each role
export const MOCK_PROFILES = {
  Citizen: {
    id: 'u-1',
    name: 'Prajwal Kumar',
    email: 'citizen@smartcitizen.gov.in',
    phone: '+91 98765 43210',
    phonenumber: '+91 98765 43210',
    role: 'Citizen',
    ward: 'Ward 12, Park Circus',
    avatar: 'PK',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256',
    reputationScore: 85,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2026-01-10T10:00:00Z'),
    updatedAt: new Date(),
  },
  'Local Officer': {
    id: 'u-2',
    name: 'Rajesh Kumar',
    email: 'officer.rajesh@smartcitizen.gov.in',
    phone: '+91 98765 55432',
    phonenumber: '+91 98765 55432',
    role: 'Local Officer',
    ward: 'Ward 12, Park Circus',
    department: 'Roads & Infrastructure',
    avatar: 'RK',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256',
    reputationScore: 120,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2026-02-15T09:30:00Z'),
    updatedAt: new Date(),
  },
  'Municipal Officer': {
    id: 'u-3',
    name: 'Sanjay Sharma',
    email: 'municipal.sanjay@smartcitizen.gov.in',
    phone: '+91 98765 99887',
    phonenumber: '+91 98765 99887',
    role: 'Municipal Officer',
    division: 'Zone 4 Civic Works',
    avatar: 'SS',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256',
    reputationScore: 250,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2026-03-01T08:15:00Z'),
    updatedAt: new Date(),
  },
  Admin: {
    id: 'u-4',
    name: 'Chief Admin Commissioner',
    email: 'admin@smartcitizen.gov.in',
    phone: '+91 99999 88888',
    phonenumber: '+91 99999 88888',
    role: 'Admin',
    department: 'E-Governance Directorate',
    avatar: 'AD',
    isVerified: true,
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256',
    reputationScore: 999,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2025-12-01T12:00:00Z'),
    updatedAt: new Date(),
  }
};

// Normalizes user object to fully satisfy Mongoose schema requirements
// and guarantees no null or missing values for key properties (names, roles, phones)
export function normalizeUser(rawUser) {
  if (!rawUser) return null;
  
  // 1. Resolve name
  const nameVal = rawUser.name || rawUser.fullName || 'Citizen User';
  
  // 2. Resolve phone numbers
  const phoneVal = rawUser.phone || rawUser.phonenumber || '+91 99999 99999';
  
  // 3. Bidirectional role normalizer (safeguards against DB lowercase and UI capitalized formats)
  const roleMap = {
    'citizen': 'Citizen',
    'local_officer': 'Local Officer',
    'municipal_officer': 'Municipal Officer',
    'admin': 'Admin',
    'field_officer': 'Field Officer',
    'Citizen': 'Citizen',
    'Local Officer': 'Local Officer',
    'Municipal Officer': 'Municipal Officer',
    'Admin': 'Admin',
    'Field Officer': 'Field Officer'
  };
  
  const uiRole = roleMap[rawUser.role] || 'Citizen';
  
  // Reverse lookup to find lowercase DB enum value
  const dbRole = Object.keys(roleMap).find(key => roleMap[key] === uiRole && key !== uiRole) || 'citizen';

  return {
    id: rawUser.__id || rawUser.id || rawUser._id || `u-${Date.now()}`,
    _id: rawUser._id || rawUser.__id || rawUser.id || `u-${Date.now()}`, // support Mongoose _id
    name: nameVal,
    fullName: nameVal, // support both name formats
    email: rawUser.email || 'citizen@smartcitizen.gov.in',
    phone: phoneVal, // retro-compatibility
    phonenumber: phoneVal, // Mongoose schema key
    role: uiRole, // Capitalized for UI dashboards
    databaseRole: dbRole, // Lowercase for backend Mongoose models
    isVerified: typeof rawUser.isVerified === 'boolean' ? rawUser.isVerified : false,
    profileImage: rawUser.profileImage || '',
    ward: rawUser.ward || '', // default to empty string instead of null to prevent styling glitches
    reputationScore: typeof rawUser.reputationScore === 'number' ? rawUser.reputationScore : 0,
    isActive: typeof rawUser.isActive === 'boolean' ? rawUser.isActive : true,
    lastLogin: rawUser.lastLogin ? new Date(rawUser.lastLogin) : new Date(),
    avatar: rawUser.avatar || nameVal.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
    createdAt: rawUser.createdAt ? new Date(rawUser.createdAt) : new Date(),
    updatedAt: rawUser.updatedAt ? new Date(rawUser.updatedAt) : new Date()
  };
}

// Base64URL decoding helper for JWT token payloads
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn("JWT Payload decoding failed:", err);
    return null;
  }
}

// Helper to clean up all localStorage keys except 'sch_token' and 'user'
function cleanupLocalStorage() {
  const allowedKeys = ['sch_token', 'user'];
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !allowedKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (err) {
    console.warn("Cleanup of localStorage keys failed:", err);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize session from LocalStorage (JWT Token and User details)
  useEffect(() => {
    cleanupLocalStorage();
    const token = localStorage.getItem('sch_token');
    const storedUser = localStorage.getItem('user');
    
    // Discard any mock tokens or oversized tokens from previous design stages to prevent backend validation errors
    if (token && (
      token.startsWith('mock') || 
      token.split('.').length !== 3 || 
      token.startsWith('SCH-') || 
      token.endsWith('mock-signature') || 
      token.includes('mock') ||
      token.length > 2000
    )) {
      localStorage.removeItem('sch_token');
      localStorage.removeItem('user');
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return;
    }

    if (token) {
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRole(parsedUser.role);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to parse stored user from localStorage:", err);
        }
      } else {
        try {
          const decoded = decodeJWT(token);
          if (decoded) {
            // Support standard payloads where user details are nested (decoded.safeUser, decoded.user) or direct
            const userObj = decoded.safeUser || decoded.user || decoded;
            const normalized = normalizeUser(userObj);
            setUser(normalized);
            setRole(normalized.role);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(normalized));
          } else {
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error("Failed to restore auth session from token:", err);
        }
      }

      // Fetch fresh profile from database to ensure up-to-date image/details
      authService.getProfile()
        .then(result => {
          if (localStorage.getItem('sch_token')) {
            const payload = result.data || result;
            if (payload) {
              const normalized = normalizeUser(payload);
              localStorage.setItem('user', JSON.stringify(normalized));
              setUser(normalized);
              setRole(normalized.role);
            }
          }
        })
        .catch(err => {
          console.warn("Failed to fetch fresh user profile on load:", err);
        });
    }
    setLoading(false);
  }, []);



  const login = async (email, password, selectedRole = 'Citizen') => {
    setLoading(true);
    console.log(`[Auth Context Debug] login called for role: ${selectedRole}`);
    try {
      // Hit actual Express backend API
      const result = await authService.login(email, password);
      console.log("[Auth Context Debug] Login API response:", result);
      
      const payload = result.data || result;
      
      if (payload && payload.token) {
        const token = payload.token;
        const userObj = payload.safeUser || payload.user || payload;
        
        // Store JWT token first so that authService.getProfile() can use it in authorization headers
        localStorage.setItem('sch_token', token);

        let finalUserObj = userObj;
        try {
          const profileResult = await authService.getProfile();
          const profilePayload = profileResult.data || profileResult;
          if (profilePayload) {
            finalUserObj = profilePayload;
          }
        } catch (profileErr) {
          console.warn("Failed to fetch fresh user profile on login, falling back to login response payload:", profileErr);
        }

        const normalized = normalizeUser(finalUserObj);

        // Store user details in localStorage
        localStorage.setItem('user', JSON.stringify(normalized));
        cleanupLocalStorage();

        setUser(normalized);
        setRole(normalized.role);
        setIsAuthenticated(true);
        setLoading(false);
        return { success: true, user: normalized };
      }
      
      setLoading(false);
      return { success: false, error: result.message || 'Login failed. Invalid payload returned.' };
    } catch (error) {
      console.warn("Express backend authentication failed:", error);
      const errorMsg = error.response?.data?.message || error.message;
      setLoading(false);
      return { success: false, error: errorMsg || 'Connection to authentication service failed.' };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      // Map frontend fields to Mongoose schema parameters
      const mongoosePayload = {
        name: userData.fullName || userData.name,
        email: userData.email,
        password: userData.password,
        phonenumber: userData.phone || userData.phonenumber,
        role: userData.role || 'citizen',
        ward: userData.ward || null,
        profileImage: userData.profileImage || ''
      };

      // Hit actual Express backend signup endpoint
      const result = await authService.signup(mongoosePayload);
      console.log("[Auth Context Debug] Register API response:", result);

      const payload = result.data || result;
      const hasUserPayload = payload && (payload.email || payload.name || payload.safeUser || payload.user);

      if (hasUserPayload) {
        const userInstance = payload.safeUser || payload.user || payload;
        const normalized = normalizeUser(userInstance);

        // Auto-login after successful Mongoose registration!
        const loginResult = await login(userData.email, userData.password, normalized.role);
        setLoading(false);
        if (loginResult.success) {
          return { success: true, user: loginResult.user };
        }
        return { success: true, user: normalized };
      }

      setLoading(false);
      return { success: false, error: result.message || 'Registration failed. Invalid payload returned.' };
    } catch (error) {
      console.warn("Express backend signup failed:", error);
      const errorMsg = error.response?.data?.message || error.message;
      setLoading(false);
      return { success: false, error: errorMsg || 'Connection to registration service failed.' };
    }
  };

  const updateProfile = async (updatedData) => {
    setLoading(true);
    try {
      const result = await authService.updateProfile(updatedData);
      console.log("[Auth Context Debug] Profile Update API response:", result);
      
      const payload = result.data || result;
      if (payload) {
        const normalized = normalizeUser(payload);
        
        // Save details and trigger state update
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
        setLoading(false);
        return { success: true, user: normalized };
      }
      
      setLoading(false);
      return { success: false, error: 'Failed to update profile details.' };
    } catch (error) {
      console.warn("Backend profile update failed:", error);
      setLoading(false);
      return { success: false, error: error.userMessage || 'Failed to update profile on server.' };
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('sch_token'); // Clear stored JWT token!
    localStorage.removeItem('user'); // Clear stored user details!
    cleanupLocalStorage();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        register,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe fallback object to prevent destructuring crashes (e.g. during HMR context loss)
    return {
      user: null,
      role: null,
      isAuthenticated: false,
      loading: true,
      login: async () => {},
      logout: () => {},
      register: async () => {},
      updateProfile: async () => {}
    };
  }
  return context;
}
