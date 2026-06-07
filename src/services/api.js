import axios from 'axios';

// Create central Axios instance configured with a base URL
// On mobile devices, localhost resolves to the mobile itself, so we fall back to the host machine's IP.
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const { hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s request timeout
});

// Request Interceptor: Automatically injects stored JWT token in standard Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sch_token');
    if (token && token !== 'undefined' && token !== 'null' && token !== '') {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[Axios Request] Header injected: Bearer ${token.substring(0, 20)}... for route ${config.url}`);
    } else {
      console.log(`[Axios Request] No valid token found in localStorage for route ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catches errors globally and maps them to user-friendly messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.response) {
      const { status, data } = error.response;
      const requestUrl = error.config?.url || '';
      
      // Auto-clear session if unauthorized (401)
      if (status === 401) {
        userMessage = 'Session expired or invalid. Please log in again.';
        const isAuthRequest = requestUrl.includes('/login') || requestUrl.includes('/signup');

        if (!isAuthRequest) {
          localStorage.removeItem('sch_token');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } else if (status === 403) {
        userMessage = 'Access denied: You are not authorized to perform this operation.';
      } else if (status === 404) {
        userMessage = 'Resource not found on E-Governance registry.';
      } else if (status === 500) {
        userMessage = 'Internal Server Error: The server is temporarily unavailable.';
      } else if (data && data.message) {
        userMessage = data.message;
      }
    } else if (error.request) {
      userMessage = 'Network Error: No response received from server. Please check your internet connection.';
    }
    
    error.userMessage = userMessage;
    return Promise.reject(error);
  }
);

// Complaint normalizer to map backend Mongoose schema to frontend flat properties
export function normalizeComplaint(raw) {
  if (!raw) return null;
  
  const idVal = raw.id || raw._id || `c-${Date.now()}`;
  
  let locationStr = '';
  if (typeof raw.location === 'string') {
    locationStr = raw.location;
  } else if (raw.location && typeof raw.location === 'object') {
    locationStr = raw.location.address || '';
  }
  
  let citizenEmailVal = '';
  let citizenNameVal = '';
  if (raw.citizen && typeof raw.citizen === 'object') {
    citizenEmailVal = raw.citizen.email || '';
    citizenNameVal = raw.citizen.name || '';
  } else {
    citizenEmailVal = raw.citizenEmail || '';
    citizenNameVal = raw.citizenName || '';
  }
  
  let officerNameVal = 'Unassigned';
  if (raw.officer && typeof raw.officer === 'object') {
    officerNameVal = raw.officer.name || 'Unassigned';
  } else if (raw.assignment?.fieldOfficer && typeof raw.assignment.fieldOfficer === 'object') {
    officerNameVal = raw.assignment.fieldOfficer.name || 'Unassigned';
  } else if (raw.assignedOfficer) {
    officerNameVal = raw.assignedOfficer;
  }
  
  let imageUrls = [];
  if (Array.isArray(raw.images)) {
    imageUrls = raw.images.map(img => {
      if (typeof img === 'string') return img;
      if (img && typeof img === 'object') return img.url || '';
      return '';
    }).filter(Boolean);
  } else if (typeof raw.images === 'string') {
    imageUrls = [raw.images];
  } else if (raw.image && typeof raw.image === 'string') {
    imageUrls = [raw.image];
  }

  // Build timeline history
  let timelineVal = [];
  if (Array.isArray(raw.statusHistory) && raw.statusHistory.length > 0) {
    timelineVal = raw.statusHistory.map(history => {
      let titleText = `Status updated to ${history.to}`;
      if (history.to === 'Submitted') titleText = 'Complaint Registered';
      if (history.to === 'Under Review') titleText = 'Under Review';
      if (history.to === 'Assigned') titleText = 'Assigned to Field Lead';
      if (history.to === 'In Progress') titleText = 'In Progress';
      if (history.to === 'Resolved') titleText = 'Grievance Resolved';
      if (history.to === 'Escalated') titleText = 'Escalated to Municipal HQ';

      return {
        status: history.to,
        date: history.timestamp || new Date(),
        title: titleText,
        remarks: history.remarks || (history.to === raw.status ? raw.remarks : '') || `Status transitioned from [${history.from}] to [${history.to}].`
      };
    });
  }

  // Prepend Submitted state if not present in timelineVal
  const hasSubmitted = timelineVal.some(evt => evt.status === 'Submitted');
  if (!hasSubmitted) {
    const createdDate = raw.createdAt || raw.date || new Date();
    timelineVal.unshift({
      status: 'Submitted',
      date: createdDate,
      title: 'Complaint Registered',
      remarks: `Grievance submitted by citizen ${citizenNameVal || 'User'}.`
    });
  }

  // If status is updated but statusHistory hasn't caught up or we want to ensure latest matches
  const hasLatestStatus = timelineVal.some(evt => evt.status === raw.status);
  if (!hasLatestStatus && raw.status && raw.status !== 'Submitted') {
    const updatedDate = raw.updatedAt || raw.createdAt || new Date();
    let titleText = `Status updated to ${raw.status}`;
    if (raw.status === 'Assigned') titleText = `Assigned to ${officerNameVal}`;
    if (raw.status === 'Resolved') titleText = 'Grievance Resolved';
    if (raw.status === 'Escalated') titleText = 'Escalated to Municipal HQ';

    timelineVal.push({
      status: raw.status,
      date: updatedDate,
      title: titleText,
      remarks: raw.remarks || `Ticket state moved to [${raw.status}].`
    });
  }

  // Sort timeline by date
  timelineVal.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    id: idVal,
    _id: raw._id || idVal,
    title: raw.title || '',
    description: raw.description || '',
    category: raw.category || 'Road & Infrastructure',
    location: locationStr,
    rawLocation: raw.location || null,
    priority: raw.priority || 'Medium',
    status: raw.status || 'Submitted',
    date: raw.date || (raw.createdAt ? new Date(raw.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
    citizenName: citizenNameVal,
    citizenEmail: citizenEmailVal,
    assignedOfficer: officerNameVal,
    officerRemarks: raw.remarks || '',
    images: imageUrls[0] || '',
    rawImages: imageUrls,
    timeline: timelineVal,
    escalation: raw.escalation || null,
    escalationReason: raw.escalation?.reason || '',
    beforeImages: (() => {
      if (raw.beforeImages && raw.beforeImages.length) return raw.beforeImages;
      if (raw.fieldWork && Array.isArray(raw.fieldWork.beforeImages)) {
        return raw.fieldWork.beforeImages.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
      }
      return [];
    })(),
    afterImages: (() => {
      if (raw.afterImages && raw.afterImages.length) return raw.afterImages;
      if (raw.fieldWork && Array.isArray(raw.fieldWork.afterImages)) {
        return raw.fieldWork.afterImages.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
      }
      return [];
    })(),
    workNotes: raw.workNotes || (raw.fieldWork && raw.fieldWork.notes) || '',
    completionNotes: raw.completionNotes || (raw.fieldWork && raw.fieldWork.notes) || '',
    slaDeadline: raw.slaDeadline || null,
    subscribers: raw.subscribers || [],
    aiAnalysis: raw.aiAnalysis || null
  };
}

// Notification normalizer
export function normalizeNotification(raw) {
  if (!raw) return null;
  return {
    id: raw.id || raw._id || `n-${Date.now()}`,
    _id: raw._id || raw.id || `n-${Date.now()}`,
    message: raw.message || '',
    date: raw.date || (raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : 'Just Now'),
    read: typeof raw.read === 'boolean' ? raw.read : false,
    complaintId: raw.complaintId || raw.complaint || null
  };
}

// Legacy Compatibility Wrappers
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  }
};

export const complaintsAPI = {
  getComplaints: async () => {
    const response = await api.get('/complaints');
    const resData = response.data;
    const complaints = resData.data || resData || [];
    return Array.isArray(complaints) ? complaints.map(normalizeComplaint) : [];
  },
  getComplaintById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    const resData = response.data;
    const complaint = resData.data || resData;
    return normalizeComplaint(complaint);
  },
  createComplaint: async (complaintData) => {
    const response = await api.post('/complaints', complaintData);
    const resData = response.data;
    const complaint = resData.data || resData;
    return normalizeComplaint(complaint);
  },
  updateComplaint: async (id, updateData) => {
    const response = await api.put(`/complaints/${id}`, updateData);
    const resData = response.data;
    const complaint = resData.data || resData;
    return normalizeComplaint(complaint);
  }
};

export const notificationsAPI = {
  getNotifications: async () => {
    // Return empty array directly since backend notifications are not implemented yet
    return [];
  },
  markNotificationsAsRead: async () => {
    return null;
  }
};

export default api;
