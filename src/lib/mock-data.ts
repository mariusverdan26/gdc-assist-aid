import { Ticket, User, Analytics, TicketEvent } from '@/types';

export const mockUsers: User[] = [
  {
    uid: 'admin1',
    displayName: 'Sarah Johnson',
    email: 'sarah.johnson@greenfield.com',
    role: 'admin',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    uid: 'emp1',
    displayName: 'Michael Chen',
    email: 'michael.chen@greenfield.com',
    role: 'employee',
    employeeNo: 'GDC-001',
    location: 'Building A - Floor 2',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    uid: 'emp2',
    displayName: 'Emily Rodriguez',
    email: 'emily.rodriguez@greenfield.com',
    role: 'employee',
    employeeNo: 'GDC-002',
    location: 'Building B - Floor 1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

export const mockTickets: Ticket[] = [
  {
    id: 'ticket1',
    ticketNo: 'GDC-20241213-001',
    createdBy: {
      uid: 'emp1',
      name: 'Michael Chen',
      employeeNo: 'GDC-001',
      location: 'Building A - Floor 2',
    },
    assignedTo: {
      uid: 'admin1',
      name: 'Sarah Johnson',
    },
    category: 'internet',
    status: 'ongoing',
    details: 'Unable to access company intranet. Connection times out when trying to reach internal servers.',
    remarks: ['Investigating network connectivity', 'Checking firewall rules'],
    createdAt: new Date('2024-12-13T09:30:00'),
    acknowledgedAt: new Date('2024-12-13T09:45:00'),
  },
  {
    id: 'ticket2',
    ticketNo: 'GDC-20241213-002',
    createdBy: {
      uid: 'emp2',
      name: 'Emily Rodriguez',
      employeeNo: 'GDC-002',
      location: 'Building B - Floor 1',
    },
    category: 'hardware',
    status: 'pending',
    details: 'Laptop screen is flickering intermittently. Started yesterday morning.',
    remarks: [],
    createdAt: new Date('2024-12-13T11:15:00'),
  },
  {
    id: 'ticket3',
    ticketNo: 'GDC-20241212-005',
    createdBy: {
      uid: 'emp1',
      name: 'Michael Chen',
      employeeNo: 'GDC-001',
      location: 'Building A - Floor 2',
    },
    assignedTo: {
      uid: 'admin1',
      name: 'Sarah Johnson',
    },
    category: 'software',
    status: 'resolved',
    details: 'ERP system not loading inventory module. Getting error code 500.',
    remarks: ['Updated ERP to latest version', 'Cleared cache and restarted service'],
    createdAt: new Date('2024-12-12T14:20:00'),
    acknowledgedAt: new Date('2024-12-12T14:35:00'),
    resolvedAt: new Date('2024-12-12T16:00:00'),
  },
];

export const mockAnalytics: Analytics[] = [
  {
    date: '2024-12-13',
    counts: { total: 8, pending: 3, ongoing: 2, resolved: 3 },
    categories: { internet: 2, hardware: 3, software: 2, erp: 1 },
    sla: { success: 6, violations: 2 },
  },
  {
    date: '2024-12-12',
    counts: { total: 12, pending: 1, ongoing: 3, resolved: 8 },
    categories: { internet: 4, hardware: 3, software: 3, erp: 2 },
    sla: { success: 10, violations: 2 },
  },
  {
    date: '2024-12-11',
    counts: { total: 15, pending: 0, ongoing: 2, resolved: 13 },
    categories: { internet: 5, hardware: 4, software: 4, erp: 2 },
    sla: { success: 12, violations: 3 },
  },
];

export const mockEvents: TicketEvent[] = [
  {
    id: 'event1',
    type: 'created',
    actor: { uid: 'emp1', name: 'Michael Chen', role: 'employee' },
    at: new Date('2024-12-13T09:30:00'),
  },
  {
    id: 'event2',
    type: 'acknowledged',
    actor: { uid: 'admin1', name: 'Sarah Johnson', role: 'admin' },
    at: new Date('2024-12-13T09:45:00'),
  },
  {
    id: 'event3',
    type: 'status_changed',
    actor: { uid: 'admin1', name: 'Sarah Johnson', role: 'admin' },
    from: 'pending',
    to: 'ongoing',
    at: new Date('2024-12-13T09:45:00'),
  },
];

// Current user context
export const getCurrentUser = (): User => {
  // In a real app, this would come from auth context
  return mockUsers[0]; // Return admin user for demo
};

export const getUserRole = (): 'admin' | 'employee' => {
  return getCurrentUser().role;
};