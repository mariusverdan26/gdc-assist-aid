export interface MockUser {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'employee';
  uid: string;
}

export const mockUsers: MockUser[] = [
  {
    email: 'admin@gdc.com',
    password: 'admin123',
    displayName: 'Admin User',
    role: 'admin',
    uid: 'admin-001'
  },
  {
    email: 'employee@gdc.com',
    password: 'employee123',
    displayName: 'Employee User',
    role: 'employee',
    uid: 'employee-001'
  },
  {
    email: 'john.doe@gdc.com',
    password: 'john123',
    displayName: 'John Doe',
    role: 'employee',
    uid: 'employee-002'
  },
  {
    email: 'jane.smith@gdc.com',
    password: 'jane123',
    displayName: 'Jane Smith',
    role: 'admin',
    uid: 'admin-002'
  }
];

export const findMockUser = (email: string, password: string): MockUser | null => {
  return mockUsers.find(user => user.email === email && user.password === password) || null;
};

export const getMockUserByEmail = (email: string): MockUser | null => {
  return mockUsers.find(user => user.email === email) || null;
};
