import api from './api';

export interface Department {
  id: string; // UUID string
  name: string;
  code: string;
  parent_department_id?: string;
}

// Helper to validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const response = await api.get('/departments');
    const departments = response.data || [];
    
    // Ensure all department IDs are UUID strings
    // If backend returns numeric IDs, we'll need to handle that
    // For now, assume backend returns UUIDs
    return departments.map((dept: any) => ({
      ...dept,
      id: String(dept.id), // Ensure it's a string
      // If backend returns numeric ID, we'll need to fetch UUID separately
      // This will be handled in the registration form
    }));
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    try {
      const response = await api.get(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch department:', error);
      return null;
    }
  },

  async createDepartment(departmentData: Omit<Department, 'id'>): Promise<Department> {
    const response = await api.post('/departments', departmentData);
    return response.data;
  }
};
