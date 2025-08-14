export interface User {
  uid: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  employeeNo?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  ticketNo: string;
  createdBy: {
    uid: string;
    name: string;
    employeeNo?: string;
    location?: string;
  };
  assignedTo?: {
    uid: string;
    name: string;
  } | null;
  category: 'internet' | 'hardware' | 'software' | 'erp';
  status: 'pending' | 'ongoing' | 'resolved';
  details: string;
  remarks: string[];
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface TicketEvent {
  id: string;
  type: 'created' | 'acknowledged' | 'assigned' | 'transferred' | 'status_changed' | 'remark_added' | 'resolved';
  actor: {
    uid: string;
    name: string;
    role: string;
  };
  from?: string;
  to?: string;
  note?: string;
  at: Date;
}

export interface Analytics {
  date: string;
  counts: {
    total: number;
    pending: number;
    ongoing: number;
    resolved: number;
  };
  categories: {
    internet: number;
    hardware: number;
    software: number;
    erp: number;
  };
  sla: {
    success: number;
    violations: number;
  };
}

export interface SLAMetrics {
  totalTickets: number;
  successRate: number;
  violations: number;
  ticketsPerStaff: number;
}

export type TicketCategory = 'internet' | 'hardware' | 'software' | 'erp';
export type TicketStatus = 'pending' | 'ongoing' | 'resolved';