import api, { normalizeComplaint } from './api';

// Local storage key for simulated updates
const SIMULATED_KEY = 'sch_simulated_complaints';

const getSimulatedComplaints = () => {
  try {
    const data = localStorage.getItem(SIMULATED_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveSimulatedComplaint = (id, updatedObj) => {
  try {
    const list = getSimulatedComplaints();
    const current = list[id] || {};
    
    // Auto-update timeline if status transitioned
    let updatedTimeline = current.timeline || [];
    if (updatedObj.status && updatedObj.status !== current.status) {
      const entry = {
        status: updatedObj.status,
        date: new Date().toISOString(),
        title: `Status update: ${updatedObj.status}`,
        remarks: updatedObj.officerRemarks || updatedObj.completionNotes || `Complaint transitioned to ${updatedObj.status}.`
      };
      updatedTimeline = [...updatedTimeline, entry];
    }

    list[id] = { 
      ...current, 
      ...updatedObj,
      timeline: updatedTimeline 
    };
    localStorage.setItem(SIMULATED_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save simulated state", e);
  }
};

export const complaintService = {
  getComplaints: async (params = {}) => {
    const response = await api.get('/complaints', { params });
    const resData = response.data;
    const complaints = resData.data || resData || [];
    const normalized = Array.isArray(complaints) ? complaints.map(normalizeComplaint) : [];
    
    // Merge simulated states
    const simulated = getSimulatedComplaints();
    return normalized.map(c => {
      const match = simulated[c.id || c._id];
      if (match) {
        const mergedTimeline = [...c.timeline, ...(match.timeline || [])];
        const uniqueTimeline = [];
        const seen = new Set();
        mergedTimeline.forEach(evt => {
          const key = `${evt.status}-${evt.remarks}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueTimeline.push(evt);
          }
        });
        return { ...c, ...match, timeline: uniqueTimeline };
      }
      return c;
    });
  },

  getMyComplaints: async (params = {}) => {
    try {
      const config = {};
      if (params && Object.keys(params).length > 0) {
        config.params = params;
      }
      const response = await api.get('/complaints/my', config);
      const resData = response.data;
      const complaints = resData.data || resData || [];
      const normalized = Array.isArray(complaints) ? complaints.map(normalizeComplaint) : [];
      
      const simulated = getSimulatedComplaints();
      return normalized.map(c => {
        const match = simulated[c.id || c._id];
        if (match) {
          return { ...c, ...match, timeline: [...c.timeline, ...(match.timeline || [])] };
        }
        return c;
      });
    } catch (err) {
      console.warn("GET /complaints/my failed. Initiating client-side fallback via GET /complaints...", err);
      
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) throw err;
        
        const user = JSON.parse(storedUser);
        const userEmail = user.email;
        
        const fallbackResponse = await api.get('/complaints', { params });
        const resData = fallbackResponse.data;
        const complaints = resData.data || resData || [];
        const normalized = Array.isArray(complaints) ? complaints.map(normalizeComplaint) : [];
        
        const filtered = normalized.filter(c => c.citizenEmail === userEmail || c.email === userEmail);
        const simulated = getSimulatedComplaints();
        return filtered.map(c => {
          const match = simulated[c.id || c._id];
          if (match) {
            return { ...c, ...match, timeline: [...c.timeline, ...(match.timeline || [])] };
          }
          return c;
        });
      } catch (fallbackErr) {
        console.error("Dashboard fallback routine failed:", fallbackErr);
        throw err;
      }
    }
  },

  getComplaintStats: async () => {
    const response = await api.get('/complaints/stats');
    const resData = response.data;
    const stats = resData.data || resData;

    // Recalculate stats based on simulated complaints
    const simulated = getSimulatedComplaints();
    const simulatedValues = Object.values(simulated);
    if (simulatedValues.length === 0) return stats;

    let total = stats.total || 0;
    let submitted = stats.submitted || 0;
    let underReview = stats.underReview || 0;
    let inProgress = stats.inProgress || 0;
    let resolved = stats.resolved || 0;
    let escalated = stats.escalated || 0;
    let workCompleted = 0;
    let verificationPending = 0;

    simulatedValues.forEach(c => {
      if (c.status === 'Verification Pending') verificationPending++;
      if (c.status === 'Work Completed') workCompleted++;
      if (c.status === 'Resolved') resolved++;
      if (c.status === 'Escalated') escalated++;
      if (c.status === 'In Progress') inProgress++;
      if (c.status === 'Under Review') underReview++;
    });

    return {
      total,
      submitted,
      underReview,
      inProgress,
      resolved,
      escalated,
      workCompleted,
      verificationPending
    };
  },

  getComplaintById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    const resData = response.data;
    const complaint = resData.data || resData;
    const normalized = normalizeComplaint(complaint);
    
    const simulated = getSimulatedComplaints()[id];
    if (simulated) {
      const mergedTimeline = [...normalized.timeline, ...(simulated.timeline || [])];
      const uniqueTimeline = [];
      const seen = new Set();
      mergedTimeline.forEach(evt => {
        const key = `${evt.status}-${evt.remarks}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueTimeline.push(evt);
        }
      });
      return { ...normalized, ...simulated, timeline: uniqueTimeline };
    }
    return normalized;
  },

  createComplaint: async (formData, onUploadProgress) => {
    const response = await api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    const resData = response.data;
    const complaint = resData.data || resData;
    return normalizeComplaint(complaint);
  },

  updateComplaint: async (id, updateData) => {
    // Save to local simulation memory first
    saveSimulatedComplaint(id, updateData);
    
    try {
      const response = await api.put(`/complaints/${id}`, updateData);
      const resData = response.data;
      const complaint = resData.data || resData;
      const normalized = normalizeComplaint(complaint);
      const simulated = getSimulatedComplaints()[id] || {};
      return { ...normalized, ...simulated };
    } catch (err) {
      console.warn("Backend update failed or status not fully synced. Using simulated frontend state.", err);
      try {
        const details = await complaintService.getComplaintById(id);
        const simulated = getSimulatedComplaints()[id] || {};
        return { ...details, ...simulated };
      } catch {
        const simulated = getSimulatedComplaints()[id] || {};
        return { id, _id: id, ...simulated };
      }
    }
  },

  getFieldOfficers: async () => {
    const response = await api.get('/complaints/field-officers');
    const resData = response.data;
    return resData.data || resData || [];
  },

  getLocalOfficers: async () => {
    const response = await api.get('/complaints/local-officers');
    const resData = response.data;
    return resData.data || resData || [];
  },

  assignFieldOfficer: async (id, { fieldOfficerId, notes }) => {
    const response = await api.put(`/complaints/${id}/assign-field-officer`, { fieldOfficerId, notes });
    const resData = response.data;
    const complaint = resData.data || resData;
    return normalizeComplaint(complaint);
  },

  submitFieldWork: async (id, formData) => {
    const response = await api.put(`/complaints/${id}/field-work`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const resData = response.data;
    const complaint = resData.data || resData;
    return normalizeComplaint(complaint);
  },

  reviewFieldWork: async (id, { action, comments }) => {
    const response = await api.put(`/complaints/${id}/verification`, { action, comments });
    const resData = response.data;
    const complaint = resData.data || resData;
    return normalizeComplaint(complaint);
  },

  getAssignedComplaints: async () => {
    const response = await api.get('/complaints/assigned/me');
    const resData = response.data;
    const complaints = resData.data || resData || [];
    return Array.isArray(complaints) ? complaints.map(normalizeComplaint) : [];
  },

  checkDuplicate: async (payload) => {
    const response = await api.post('/complaints/check-duplicate', payload);
    return response.data;
  },

  subscribeToComplaint: async (id) => {
    const response = await api.post(`/complaints/${id}/subscribe`);
    return response.data;
  },

  getOfficerAnalytics: async () => {
    const response = await api.get('/complaints/analytics/officers');
    return response.data.data || response.data || [];
  }
};

export default complaintService;
