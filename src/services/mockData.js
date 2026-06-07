const INITIAL_COMPLAINTS = [
  {
    id: 'SCH-84920',
    title: 'Pothole on Main Street Corner',
    description: 'A deep, dangerous pothole has formed at the turn of W. Park Circus, causing traffic slowdowns and bike hazards. Needs immediate filling.',
    category: 'Road & Infrastructure',
    location: 'Ward 12, Park Circus Junction',
    priority: 'High',
    status: 'In Progress',
    date: '2026-06-01',
    citizenName: 'Prajwal Kumar',
    citizenEmail: 'citizen@smartcitizen.gov.in',
    assignedOfficer: 'Rajesh Kumar',
    officerRemarks: 'Repairs team dispatched. Pothole filling underway.',
    images: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop',
    timeline: [
      { status: 'Submitted', date: '2026-06-01T09:00:00Z', title: 'Complaint Registered', remarks: 'Complaint submitted by Prajwal Kumar.' },
      { status: 'Assigned', date: '2026-06-01T11:00:00Z', title: 'Routed to Infrastructure', remarks: 'Routed automatically. Local Officer Rajesh Kumar assigned.' },
      { status: 'In Progress', date: '2026-06-01T13:30:00Z', title: 'Repairs Team Dispatched', remarks: 'Repairs team dispatched. Materials mixed.' }
    ]
  },
  {
    id: 'SCH-84921',
    title: 'Broken water pipeline leaking water',
    description: 'Fresh clean water is gushing out of the primary delivery main line on Sector B corner, flooding nearby street pathways and lowering tap pressures.',
    category: 'Water & Sanitation',
    location: 'Ward 4, Sector B Crossroads',
    priority: 'High',
    status: 'Resolved',
    date: '2026-05-30',
    citizenName: 'Karan Malhotra',
    citizenEmail: 'karan@gmail.com',
    assignedOfficer: 'Rajesh Kumar',
    officerRemarks: 'Leak successfully clamped and water flow normalized.',
    images: 'https://images.unsplash.com/photo-1542013936693-8848e574047a?q=80&w=600&auto=format&fit=crop',
    timeline: [
      { status: 'Submitted', date: '2026-05-30T07:15:00Z', title: 'Complaint Registered', remarks: 'Water main burst filed by citizen Karan Malhotra.' },
      { status: 'Assigned', date: '2026-05-30T08:00:00Z', title: 'Assigned to Water Dept', remarks: 'Officer Rajesh Kumar assigned.' },
      { status: 'In Progress', date: '2026-05-30T09:30:00Z', title: 'Welding Clamps Initiated', remarks: 'Main line valves closed, welding leak clamps in progress.' },
      { status: 'Resolved', date: '2026-05-30T14:00:00Z', title: 'Repairs Completed', remarks: 'Leak successfully clamped and water flow normalized.' }
    ]
  },
  {
    id: 'SCH-84922',
    title: 'Illegal garbage dumping on park perimeter',
    description: 'Commercial vegetable vendors are dumping plastic wastes, rotten vegetables, and packing boards behind green belt ward park, leading to severe odor.',
    category: 'Garbage & Waste',
    location: 'Ward 12, Children Park West Gate',
    priority: 'Medium',
    status: 'Escalated',
    date: '2026-05-25',
    citizenName: 'Prajwal Kumar',
    citizenEmail: 'citizen@smartcitizen.gov.in',
    assignedOfficer: 'Unassigned',
    officerRemarks: '',
    escalationReason: 'Ticket unassigned and exceeded SLA response period of 48 hours.',
    images: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600&auto=format&fit=crop',
    timeline: [
      { status: 'Submitted', date: '2026-05-25T10:00:00Z', title: 'Complaint Registered', remarks: 'Garbage accumulation filed by Prajwal Kumar.' },
      { status: 'Escalated', date: '2026-05-27T10:00:00Z', title: 'Ticket Escalated', remarks: 'System auto-escalated: SLA delay in department assignment.' }
    ]
  },
  {
    id: 'SCH-84923',
    title: 'Streetlight completely dark for 3 days',
    description: 'The overhead sodium streetlight lamp has fused and is completely dark. High risk of chain-snatching or road accidents at the dark curve.',
    category: 'Electricity & Lighting',
    location: 'Ward 9, Lane 3 Green Avenue',
    priority: 'Medium',
    status: 'Submitted',
    date: '2026-06-02',
    citizenName: 'Ananya Roy',
    citizenEmail: 'ananya@yahoo.com',
    assignedOfficer: 'Unassigned',
    officerRemarks: '',
    images: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=600&auto=format&fit=crop',
    timeline: [
      { status: 'Submitted', date: '2026-06-02T02:00:00Z', title: 'Complaint Registered', remarks: 'Fused street bulb complaint registered.' }
    ]
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n-1',
    message: 'Your complaint about Main Street Pothole is updated to [In Progress] by Officer Rajesh.',
    date: '2 Hours Ago',
    read: false,
    complaintId: 'SCH-84920'
  },
  {
    id: 'n-2',
    message: 'System Notice: Garbage Dumping ticket #SCH-84922 escalated due to SLA delay.',
    date: '1 Day Ago',
    read: true,
    complaintId: 'SCH-84922'
  },
  {
    id: 'n-3',
    message: 'Thank you! Water pipeline issue #SCH-84921 has been marked as [Resolved].',
    date: '2 Days Ago',
    read: true,
    complaintId: 'SCH-84921'
  }
];

// In-memory data storage (replacing localStorage)
let complaints = [...INITIAL_COMPLAINTS];
let notifications = [...INITIAL_NOTIFICATIONS];

export const mockService = {
  getComplaints: () => {
    return complaints;
  },

  getComplaintsByEmail: (email) => {
    return complaints.filter(c => c.citizenEmail === email);
  },

  getComplaintsByOfficer: (officerName) => {
    return complaints.filter(c => c.assignedOfficer === officerName);
  },

  getComplaintById: (id) => {
    return complaints.find(c => c.id === id);
  },

  addComplaint: (data, citizen) => {
    const newId = `SCH-${Math.floor(10000 + Math.random() * 90000)}`;
    const newComplaint = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      priority: data.priority || 'Medium',
      status: 'Submitted',
      date: new Date().toISOString().split('T')[0],
      citizenName: citizen.name,
      citizenEmail: citizen.email,
      assignedOfficer: 'Unassigned',
      officerRemarks: '',
      images: data.image || 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?q=80&w=600&auto=format&fit=crop',
      timeline: [
        {
          status: 'Submitted',
          date: new Date().toISOString(),
          title: 'Complaint Registered',
          remarks: `Grievance submitted by citizen ${citizen.name}.`
        }
      ]
    };

    complaints.unshift(newComplaint);

    // Also trigger notification
    mockService.addNotification(
      `New complaint registered: "${newComplaint.title}" (#${newId})`,
      newId
    );

    return newComplaint;
  },

  updateComplaint: (id, fields) => {
    const idx = complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      const original = complaints[idx];
      const updated = { ...original, ...fields };

      // Append to timeline if status changes
      if (fields.status && fields.status !== original.status) {
        let titleText = `Status updated to ${fields.status}`;
        if (fields.status === 'Assigned') titleText = `Assigned to ${fields.assignedOfficer || 'Local Officer'}`;
        if (fields.status === 'Resolved') titleText = 'Grievance Resolved';
        if (fields.status === 'Escalated') titleText = 'Escalated to Municipal HQ';

        updated.timeline = [
          ...original.timeline,
          {
            status: fields.status,
            date: new Date().toISOString(),
            title: titleText,
            remarks: fields.officerRemarks || `Ticket state moved to [${fields.status}].`
          }
        ];

        // Trigger Notification
        mockService.addNotification(
          `Grievance #${id} ("${original.title}") updated to [${fields.status}].`,
          id
        );
      }

      complaints[idx] = updated;
      return updated;
    }
    return null;
  },

  getNotifications: () => {
    return notifications;
  },

  addNotification: (message, complaintId = null) => {
    const newNotif = {
      id: `n-${Date.now()}`,
      message,
      date: 'Just Now',
      read: false,
      complaintId
    };
    notifications.unshift(newNotif);
    return newNotif;
  },

  markNotificationsAsRead: () => {
    notifications = notifications.map(n => ({ ...n, read: true }));
    return notifications;
  }
};
