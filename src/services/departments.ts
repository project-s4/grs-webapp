import api from './api';

export interface Department {
  id: string;
  name: string;
  code: string;
  parent_department_id?: string;
}

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const response = await api.get('/departments');
    return response.data;
  },

  async createDepartment(departmentData: Omit<Department, 'id'>): Promise<Department> {
    const response = await api.post('/departments', departmentData);
    return response.data;
  }
};
