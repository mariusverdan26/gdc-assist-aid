export interface MockUser {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'employee';
  uid: string;
}

export const mockUsers: MockUser[] = [
  {
    email: 'sarah.johnson@greenfield.com',
    password: 'admin123',
    displayName: 'Sarah Johnson',
    role: 'admin',
    uid: 'admin1'
  },
  {
    email: 'michael.chen@greenfield.com',
    password: 'employee123',
    displayName: 'Michael Chen',
    role: 'employee',
    uid: 'emp1'
  },
  {
    email: 'emily.rodriguez@greenfield.com',
    password: 'emily123',
    displayName: 'Emily Rodriguez',
    role: 'employee',
    uid: 'emp2'
  }
];

export const findMockUser = (email: string, password: string): MockUser | null => {
  return mockUsers.find(user => user.email === email && user.password === password) || null;
};

export const getMockUserByEmail = (email: string): MockUser | null => {
  return mockUsers.find(user => user.email === email) || null;
};
